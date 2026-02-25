import os
import re
import socket
import base64
import httpx
import asyncio
import datetime
from typing import Dict, Any, Optional
from urllib.parse import urlparse
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field

try:
    import whois
    HAS_WHOIS = True
except ImportError:
    HAS_WHOIS = False

try:
    import tldextract
    HAS_TLDEXTRACT = True
except ImportError:
    HAS_TLDEXTRACT = False

router = APIRouter()

# -------------------------------------------------------------------------
# CONSTANTS & CONFIGURATION
# -------------------------------------------------------------------------

TRUSTED_LIST = {
    "google.com", "gov.in", "nic.in", "sbi.co.in", "rbi.org.in", "npci.org.in",
    "hdfc.com", "icicibank.com", "microsoft.com", "apple.com", "amazon.in"
}

SUSPICIOUS_TLDS = {".xyz", ".tk", ".top", ".gq", ".ml"}

# -------------------------------------------------------------------------
# MODEL DEFINITIONS
# -------------------------------------------------------------------------

class ScanRequest(BaseModel):
    url: str

class ScoreBreakdown(BaseModel):
    whitelist: int
    virustotal: int
    abuseipdb: int
    google_safe_browsing: int
    phishtank: int
    age_score: int
    heuristics: int

class ThreatScoreResult(BaseModel):
    url: str
    score: int
    final_score: int
    classification: str
    threat_level: str
    breakdown: ScoreBreakdown
    reasons: list[str]
    api_verdicts: dict
    domain_info: dict = {}
    ip_info: dict = {}
    from_cache: bool = False

# -------------------------------------------------------------------------
# HELPER FUNCTIONS
# -------------------------------------------------------------------------

def get_root_domain(url: str) -> str:
    if HAS_TLDEXTRACT:
        ext = tldextract.extract(url)
        return f"{ext.domain}.{ext.suffix}".lower() if ext.suffix else ext.domain.lower()
    host = urlparse(url).hostname or ""
    parts = host.split(".")
    return ".".join(parts[-2:]) if len(parts) >= 2 else host

def get_ip_from_url(url: str) -> str | None:
    try:
        host = urlparse(url).hostname or ""
        return socket.gethostbyname(host)
    except Exception:
        return None

def levenshtein_distance(s1: str, s2: str) -> int:
    if len(s1) < len(s2):
        return levenshtein_distance(s2, s1)
    if len(s2) == 0:
        return len(s1)
    previous_row = range(len(s2) + 1)
    for i, c1 in enumerate(s1):
        current_row = [i + 1]
        for j, c2 in enumerate(s2):
            insertions = previous_row[j + 1] + 1
            deletions = current_row[j] + 1
            substitutions = previous_row[j] + (c1 != c2)
            current_row.append(min(insertions, deletions, substitutions))
        previous_row = current_row
    return previous_row[-1]

def classify_score(score: int) -> str:
    if score >= 51: return "MALICIOUS"
    elif score >= 21: return "SUSPICIOUS"
    else: return "SAFE"

def _sync_get_whois_info(domain: str) -> dict:
    try:
        info = whois.whois(domain)
        creation = info.creation_date
        if isinstance(creation, list):
            creation = creation[0]
        
        age_days = None
        if creation:
            age_days = (datetime.datetime.now() - creation).days

        registrar = info.registrar
        if isinstance(registrar, list):
            registrar = registrar[0]

        return {"age_days": age_days, "registrar": registrar}
    except Exception:
        pass
    return {"age_days": None, "registrar": "Unknown"}

async def get_domain_info(url: str) -> dict:
    if not HAS_WHOIS: return {"age_days": None, "registrar": "Unknown"}
    domain = get_root_domain(url)
    return await asyncio.to_thread(_sync_get_whois_info, domain)

async def get_ip_intel(ip: str) -> dict:
    if not ip: return {"ip": "Unknown", "server_country": "Unknown", "isp": "Unknown"}
    try:
        async with httpx.AsyncClient(timeout=4.0) as client:
            res = await client.get(f"http://ip-api.com/json/{ip}?fields=status,country,isp,query")
        if res.status_code == 200:
            data = res.json()
            if data.get("status") == "success":
                return {
                    "ip": data.get("query", ip),
                    "server_country": data.get("country", "Unknown"),
                    "isp": data.get("isp", "Unknown")
                }
    except Exception: pass
    return {"ip": ip, "server_country": "Unknown", "isp": "Unknown"}

# -------------------------------------------------------------------------
# EXTERNAL API SERVICES
# -------------------------------------------------------------------------

async def check_virustotal(url: str) -> dict:
    api_key = os.getenv("VIRUSTOTAL_API_KEY")
    if not api_key: return {"positives": 0, "total": 0}
    url_id = base64.urlsafe_b64encode(url.encode()).decode().rstrip("=")
    headers = {"x-apikey": api_key}
    try:
        async with httpx.AsyncClient(timeout=6.0) as client:
            res = await client.get(f"https://www.virustotal.com/api/v3/urls/{url_id}", headers=headers)
        if res.status_code == 200:
            stats = res.json().get("data", {}).get("attributes", {}).get("last_analysis_stats", {})
            positives = stats.get("malicious", 0) + stats.get("suspicious", 0)
            return {"positives": positives, "total": sum(stats.values())}
    except Exception: pass
    return {"positives": 0, "total": 0}

async def check_abuseipdb(url: str) -> int:
    api_key = os.getenv("ABUSEIPDB_API_KEY")
    ip = get_ip_from_url(url)
    if not api_key or not ip: return 0
    try:
        async with httpx.AsyncClient(timeout=6.0) as client:
            res = await client.get(
                "https://api.abuseipdb.com/api/v2/check",
                params={"ipAddress": ip, "maxAgeInDays": 90},
                headers={"Key": api_key, "Accept": "application/json"}
            )
        if res.status_code == 200:
            return res.json().get("data", {}).get("abuseConfidenceScore", 0)
    except Exception: pass
    return 0

async def check_google_safe_browsing(url: str) -> bool:
    api_key = os.getenv("GOOGLE_SAFE_BROWSING_KEY", "")
    if not api_key: return False
    payload = {
        "client": {"clientId": "cti-india", "clientVersion": "2.0"},
        "threatInfo": {
            "threatTypes": ["MALWARE", "SOCIAL_ENGINEERING", "PHISHING", "UNWANTED_SOFTWARE", "POTENTIALLY_HARMFUL_APPLICATION"],
            "platformTypes": ["ANY_PLATFORM"],
            "threatEntryTypes": ["URL"],
            "threatEntries": [{"url": url}],
        },
    }
    try:
        async with httpx.AsyncClient(timeout=6.0) as client:
            res = await client.post(f"https://safebrowsing.googleapis.com/v4/threatMatches:find?key={api_key}", json=payload)
        if res.status_code == 200:
            return bool(res.json().get("matches"))
    except Exception: pass
    return False

async def check_phishtank(url: str) -> bool:
    try:
        async with httpx.AsyncClient(timeout=6.0) as client:
            res = await client.post("https://checkurl.phishtank.com/checkurl/", data={"url": url, "format": "json"})
        if res.status_code == 200:
            results = res.json().get("results", {})
            return bool(results.get("in_database") and results.get("verified"))
    except Exception: pass
    return False

# -------------------------------------------------------------------------
# SCORING ENGINE
# -------------------------------------------------------------------------

async def calculate_threat_score(url: str) -> ThreatScoreResult:
    # 0. Normalization
    url = url.strip()
    if not url.startswith(("http://", "https://")):
        url = "https://" + url

    root_domain = get_root_domain(url)
    server_ip = get_ip_from_url(url)
    
    # ---------------------------------------------------------------------
    # DNS CHECK
    # ---------------------------------------------------------------------
    parsed = urlparse(url)
    host = parsed.hostname or ""
    is_raw_ip = bool(re.match(r"^\d+\.\d+\.\d+\.\d+$", host))
    
    if not server_ip and not is_raw_ip:
        return ThreatScoreResult(
            url=url, score=0, final_score=0, classification="Unreachable", threat_level="UNREACHABLE",
            breakdown=ScoreBreakdown(whitelist=0, virustotal=0, abuseipdb=0, google_safe_browsing=0, phishtank=0, age_score=0, heuristics=0),
            reasons=["⚠️ Domain does not resolve to an IP (site is offline or invalid)"],
            api_verdicts={"DNS": "Resolution Failed"}, domain_info={}, ip_info={}, from_cache=False
        )
    
    # Fire API requests concurrently
    vt_task = asyncio.create_task(check_virustotal(url))
    abuse_task = asyncio.create_task(check_abuseipdb(url))
    gsb_task = asyncio.create_task(check_google_safe_browsing(url))
    phish_task = asyncio.create_task(check_phishtank(url))
    domain_task = asyncio.create_task(get_domain_info(url))
    ip_task = asyncio.create_task(get_ip_intel(server_ip))
    
    vt_data, abuse_cert, gsb_flag, phish_flag, domain_info, ip_info = await asyncio.gather(
        vt_task, abuse_task, gsb_task, phish_task, domain_task, ip_task
    )

    age_days = domain_info.get("age_days")

    # 1. Whitelist Modifier 
    whitelist_score = -50 if root_domain in TRUSTED_LIST else 0

    # 2. VirusTotal
    vt_score = 0
    flagged = vt_data["positives"]
    total = vt_data["total"]
    if total > 0 and flagged > 0:
        vt_ratio_score = int((flagged / total) * 100 * 0.5)
        base_penalty = 0
        if flagged >= 10: base_penalty = 40
        elif flagged >= 5: base_penalty = 30
        elif flagged >= 2: base_penalty = 20
        elif flagged == 1: base_penalty = 10
        vt_score = vt_ratio_score + base_penalty

    # 3. AbuseIPDB
    abuse_score = int(abuse_cert * 0.3) if abuse_cert > 0 else 0

    # 4. Google Safe Browsing
    gsb_score = 40 if gsb_flag else 0

    # 5. PhishTank
    phishtank_score = 40 if phish_flag else 0

    # 6. Domain Age
    age_score = 0
    if age_days is not None:
        if age_days < 7: age_score = 30
        elif age_days < 30: age_score = 20
        elif age_days < 90: age_score = 10
        elif age_days > 1825: age_score = -10

    # 7. Structural Heuristics & Typosquatting
    heuristics_score = 0
    if is_raw_ip: heuristics_score += 15
    if "xn--" in host: heuristics_score += 15
    if len(url) > 100: heuristics_score += 5
        
    ext = tldextract.extract(url) if HAS_TLDEXTRACT else None
    if ext:
        subs = [s for s in ext.subdomain.split(".") if s] if ext.subdomain else []
        if len(subs) >= 3: heuristics_score += 10
        tld = f".{ext.suffix}".lower() if ext.suffix else ""
        if tld in SUSPICIOUS_TLDS: heuristics_score += 10

    if whitelist_score == 0:
        for brand in TRUSTED_LIST:
            if abs(len(root_domain) - len(brand)) <= 2:
                if levenshtein_distance(root_domain, brand) in [1, 2] and len(brand) > 4:
                    heuristics_score += 40
                    break

    # ---------------------------------------------------------------------
    # Final Score Calculation
    # ---------------------------------------------------------------------
    raw_score = whitelist_score + vt_score + abuse_score + gsb_score + phishtank_score + age_score + heuristics_score
    final_score = min(100, max(0, raw_score))
    classification = classify_score(final_score)
    
    breakdown = ScoreBreakdown(
        whitelist=whitelist_score, virustotal=vt_score, abuseipdb=abuse_score,
        google_safe_browsing=gsb_score, phishtank=phishtank_score, age_score=age_score, heuristics=heuristics_score
    )
    
    reasons = [f"✅ Whitelist Modifier: {whitelist_score}"] if whitelist_score < 0 else []
    if vt_score > 0: reasons.append(f"⚠️ VirusTotal: {flagged}/{total} engines ({vt_score} pts)")
    if abuse_score > 0: reasons.append(f"⚠️ AbuseIPDB: {abuse_cert}% confidence ({abuse_score} pts)")
    if gsb_score > 0: reasons.append(f"🚨 Google Safe Browsing: MALICIOUS ({gsb_score} pts)")
    if phishtank_score > 0: reasons.append(f"🚨 PhishTank: VERIFIED PHISHING ({phishtank_score} pts)")
    if age_score > 0: reasons.append(f"⚠️ Domain Age Penalty ({age_score} pts)")
    if heuristics_score > 0: reasons.append(f"⚠️ Structural Heuristics Triggered ({heuristics_score} pts)")
    if not reasons: reasons.append("✅ No threat signals detected")

    api_verdicts = {
        "Google Safe Browsing": "MALICIOUS" if gsb_score else "Clean",
        "VirusTotal": f"{flagged}/{total} matches" if total else "Clean",
        "PhishTank": "VERIFIED PHISHING" if phishtank_score else "Not in database",
        "AbuseIPDB": f"{abuse_cert}% confidence"
    }

    return ThreatScoreResult(
        url=url, score=final_score, final_score=final_score, classification=classification, threat_level=classification.upper(),
        breakdown=breakdown, reasons=reasons, api_verdicts=api_verdicts, 
        domain_info=domain_info, ip_info=ip_info, from_cache=False
    )

# -------------------------------------------------------------------------
# ROUTE
# -------------------------------------------------------------------------

@router.post("/analyze-url", response_model=ThreatScoreResult)
async def analyze_url(request: ScanRequest):
    if not request.url or not request.url.strip():
        raise HTTPException(status_code=400, detail="URL cannot be empty")
    try:
        return await calculate_threat_score(request.url)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")
