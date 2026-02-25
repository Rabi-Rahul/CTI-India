import os
from dotenv import load_dotenv

# Force absolute path loading and override environment vars in hot-reload
_env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env")
load_dotenv(_env_path, override=True)

import httpx
import asyncio
from fastapi import APIRouter, HTTPException, Query
from typing import Optional, Dict, Any

router = APIRouter()

# -------------------------------------------------------------------------
# OTX ALIENVAULT INTEGRATION
# -------------------------------------------------------------------------

async def get_otx_intel(indicator: str, indicator_type: str) -> Dict[str, Any]:
    """
    Query AlienVault OTX API for threat intelligence on a specific indicator.
    indicator_type must be one of: 'IPv4', 'domain', 'url', 'file'
    """
    api_key = os.getenv("OTX_API_KEY")
    if not api_key:
        return {"error": "OTX API key not configured", "status": "unavailable"}

    # Map our internal types to OTX endpoint paths
    # Note: OTX expects 'file' for hashes (like SHA256)
    type_map = {
        "ip": "IPv4",
        "domain": "domain",
        "url": "url",
        "hash": "file"
    }
    
    # Default to IPv4 if type is unknown just to prevent URL mapping errors, though validation should catch this
    otx_type = type_map.get(indicator_type.lower())
    if not otx_type:
        return {"error": f"Unsupported indicator type for OTX: {indicator_type}", "status": "error"}

    url = f"https://otx.alienvault.com/api/v1/indicators/{otx_type}/{indicator}/general"
    headers = {
        "X-OTX-API-KEY": api_key,
        "Accept": "application/json"
    }

    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            response = await client.get(url, headers=headers)
            
        if response.status_code == 200:
            data = response.json()
            pulse_info = data.get("pulse_info", {})
            pulses = pulse_info.get("pulses", [])
            
            # Extract malware families if available in pulses
            malware_families = set()
            for pulse in pulses:
                for family in pulse.get("malware_families", []):
                    if isinstance(family, str):
                        malware_families.add(family)
                    elif isinstance(family, dict) and "display_name" in family:
                        malware_families.add(family["display_name"])
            
            return {
                "pulse_count": pulse_info.get("count", 0),
                "reputation": data.get("reputation", 0),
                "malware_families": list(malware_families),
                "first_seen": data.get("base_indicator", {}).get("created", ""),
                "last_seen": data.get("base_indicator", {}).get("modified", "") if hasattr(data.get("base_indicator"), "get") else ""
            }
        elif response.status_code == 404:
            # Indicator not found in OTX - this is a valid response meaning no known threat
            return {
                "pulse_count": 0,
                "reputation": 0,
                "malware_families": [],
                "first_seen": "",
                "last_seen": "",
                "status": "not_found"
            }
        else:
            print(f"OTX API returned status {response.status_code}")
            return {"status": "unavailable"}
            
    except Exception as e:
        print(f"OTX API request failed: {e}")
        return {"status": "unavailable"}

# -------------------------------------------------------------------------
# IOC ROUTER
# -------------------------------------------------------------------------

# Define a simple memory cache to respect ratelimits (Valid for 5 mins)
_IOC_CACHE = {}
import time

@router.get("/")
async def analyze_ioc(
    indicator: str = Query(..., description="The IOC value (IP, domain, URL, or hash)"),
    type: str = Query(..., description="Type of IOC: ip, domain, url, hash")
):
    """
    Unified IOC Intelligence Search Endpoint.
    Currently integrates AlienVault OTX, with placeholders for VT and AbuseIPDB.
    """
    indicator = indicator.strip()
    type = type.strip().lower()

    if not indicator or type not in ["ip", "domain", "url", "hash"]:
        raise HTTPException(status_code=400, detail="Invalid indicator or type provided.")

    # Cache check
    cache_key = f"{type}:{indicator}"
    if cache_key in _IOC_CACHE:
        cache_entry = _IOC_CACHE[cache_key]
        if time.time() - cache_entry["timestamp"] < 300: # 5 minutes
            return cache_entry["data"]

    # 1. Gather Intelligence (Async)
    # Right now we just have OTX, but we set this up for future parallel execution
    otx_task = asyncio.create_task(get_otx_intel(indicator, type))
    
    # Wait for all intelligence APIs
    result_otx = await otx_task

    # 2. Risk Scoring Logic
    confidence_score = 0
    risk_level = "Unknown"
    
    # OTX Impact
    if result_otx.get("status") not in ["unavailable", "error"]:
        pulse_count = result_otx.get("pulse_count", 0)
        reputation = result_otx.get("reputation", 0)
        
        if pulse_count > 5:
            confidence_score += 25
        elif pulse_count > 0:
            confidence_score += 10
            
        # If reputation is exceptionally bad via OTX
        if reputation > 0: # OTX reputation > 0 is bad, but actual API meaning can vary
            confidence_score += min(reputation * 5, 20)

    # Note: OTX Alone cannot classify as Malicious (100%), but can push it up.
    # We cap at 90 if only OTX is signaling
    confidence_score = min(confidence_score, 100)
    
    if confidence_score >= 70:
        risk_level = "Malicious"
    elif confidence_score >= 25:
        risk_level = "Suspicious"
    elif confidence_score > 0:
        risk_level = "Low Risk"
    else:
        risk_level = "Safe / Unknown"

    # 3. Formulate Response payload
    response_data = {
      "indicator": indicator,
      "type": type,
      "virustotal": {}, # Placeholder for future VT integration
      "abuseipdb": {},  # Placeholder for future AbuseIPDB integration
      "otx": result_otx,
      "overall_risk": risk_level,
      "confidence_level": f"{confidence_score}%"
    }

    # Store in cache
    _IOC_CACHE[cache_key] = {
        "timestamp": time.time(),
        "data": response_data
    }

    return response_data
