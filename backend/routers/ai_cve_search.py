"""
AI-Powered CVE Search Router
POST /api/ai-cve-search

Query flow:
  1. Extract smart keywords from natural language input
  2. Call NVD API 2.0 with keyword
  3. Rank/filter results
  4. Return top 20 enriched CVEs
"""

import re
import httpx
import asyncio
from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

router = APIRouter()

# ── Synonyms / term-expansion map ─────────────────────────────────────────────
_SYNONYM_MAP: Dict[str, str] = {
    # Attack types
    "rce": "remote code execution",
    "remote code execution": "remote code execution",
    "sqli": "SQL injection",
    "sql injection": "SQL injection",
    "xss": "cross-site scripting",
    "lfi": "local file inclusion",
    "rfi": "remote file inclusion",
    "ssrf": "server-side request forgery",
    "xxe": "XML external entity",
    "csrf": "cross-site request forgery",
    "privesc": "privilege escalation",
    "priv esc": "privilege escalation",
    "privilege escalation": "privilege escalation",
    "dos": "denial of service",
    "ddos": "denial of service",
    "buffer overflow": "buffer overflow",
    "bof": "buffer overflow",
    "path traversal": "path traversal",
    "directory traversal": "path traversal",
    "idor": "insecure direct object reference",
    "auth bypass": "authentication bypass",
    "bypass": "bypass",
    # Products/platforms
    "apache": "apache",
    "nginx": "nginx",
    "iis": "IIS",
    "windows": "Windows",
    "linux": "Linux",
    "ubuntu": "Ubuntu",
    "android": "Android",
    "ios": "iOS",
    "openssl": "OpenSSL",
    "openssh": "OpenSSH",
    "chrome": "Google Chrome",
    "firefox": "Mozilla Firefox",
    "wordpress": "WordPress",
    "log4j": "log4j",
    "spring": "Spring Framework",
    "java": "Java",
    "python": "Python",
    "php": "PHP",
    "node": "Node.js",
    "nodejs": "Node.js",
    "docker": "Docker",
    "kubernetes": "Kubernetes",
    "k8s": "Kubernetes",
    "vmware": "VMware",
    "cisco": "Cisco",
    "juniper": "Juniper",
    "fortinet": "Fortinet",
    "palo alto": "Palo Alto",
    "exchange": "Microsoft Exchange",
    "sharepoint": "SharePoint",
    "active directory": "Active Directory",
    "ad": "Active Directory",
    "samba": "Samba",
    # Severity shorthands
    "critical": "critical",
    "high": "high",
    "severe": "critical",
    # Time shorthands
    "recent": "",
    "latest": "",
    "new": "",
}

_NOISE_WORDS = {
    "a", "an", "the", "in", "on", "for", "of", "to", "and",
    "or", "with", "about", "using", "show", "me", "find",
    "search", "give", "list", "any", "all", "are", "there",
    "what", "how", "which", "get", "vulnerabilities",
    "vulnerability", "cves", "cve", "issues", "bugs",
}

NVD_URL = "https://services.nvd.nist.gov/rest/json/cves/2.0"
RESULTS_PER_QUERY = 30    # fetch from NVD; we trim to 20 after ranking
MAX_RETRIES = 2
TIMEOUT = 15              # seconds


# ── Pydantic Models ────────────────────────────────────────────────────────────

class CVESearchRequest(BaseModel):
    query: str = Field(..., min_length=2, max_length=300)


class CVEResult(BaseModel):
    cve_id: str
    description: str
    cvss_score: Optional[float]
    severity: str
    published: str
    url: str
    keywords_matched: List[str]


class CVESearchResponse(BaseModel):
    query: str
    keywords_used: str
    total_found: int
    results: List[CVEResult]


# ── Keyword extractor ──────────────────────────────────────────────────────────

def _extract_keywords(raw: str) -> str:
    """
    Convert natural language query → tight NVD keyword string.
    Example: "recent apache RCE vulnerabilities" → "apache remote code execution"
    """
    text = raw.lower().strip()

    # Replace known synonyms (longest match first)
    sorted_syns = sorted(_SYNONYM_MAP.keys(), key=len, reverse=True)
    for syn in sorted_syns:
        replacement = _SYNONYM_MAP[syn]
        text = re.sub(r'\b' + re.escape(syn) + r'\b', replacement, text)

    # Tokenise and drop noise words
    tokens = re.findall(r'[a-z0-9./#_-]+', text)
    kept   = [t for t in tokens if t not in _NOISE_WORDS and len(t) > 1]

    # De-duplicate while preserving order
    seen, unique = set(), []
    for t in kept:
        if t not in seen:
            seen.add(t)
            unique.append(t)

    return " ".join(unique) if unique else raw.strip()


# ── CVSS helpers ───────────────────────────────────────────────────────────────

def _parse_cvss(cve_item: dict) -> Optional[float]:
    """Try CVSS 3.1 → 3.0 → 2.0 in order."""
    metrics = cve_item.get("metrics", {})

    for key in ("cvssMetricV31", "cvssMetricV30"):
        entries = metrics.get(key, [])
        if entries:
            return entries[0].get("cvssData", {}).get("baseScore")

    entries = metrics.get("cvssMetricV2", [])
    if entries:
        return entries[0].get("cvssData", {}).get("baseScore")

    return None


def _severity_from_score(score: Optional[float]) -> str:
    if score is None:
        return "UNKNOWN"
    if score >= 9.0:
        return "CRITICAL"
    if score >= 7.0:
        return "HIGH"
    if score >= 4.0:
        return "MEDIUM"
    return "LOW"


# ── Relevance ranker ───────────────────────────────────────────────────────────

def _rank_results(results: list, keywords: str) -> list:
    kw_tokens = set(keywords.lower().split())

    def _score(item: dict) -> float:
        desc  = (item.get("description") or "").lower()
        cve_id = (item.get("cve_id") or "").lower()
        score  = item.get("cvss_score") or 0.0

        # keyword hits in description
        kw_hits = sum(1 for k in kw_tokens if k in desc)
        kw_hits += sum(1 for k in kw_tokens if k in cve_id)

        # severity bonus
        sev_bonus = {
            "CRITICAL": 3.0,
            "HIGH":     2.0,
            "MEDIUM":   1.0,
        }.get(item.get("severity", ""), 0.0)

        # recency bonus (days old → less = better)
        try:
            pub_dt  = datetime.fromisoformat(item.get("published", "").replace("Z", "+00:00"))
            now     = datetime.now(timezone.utc)
            days_old = (now - pub_dt).days
            recency = max(0.0, 3.0 - days_old / 365)
        except Exception:
            recency = 0.0

        return kw_hits * 4 + (score / 10 * 2) + sev_bonus + recency

    return sorted(results, key=_score, reverse=True)


# ── NVD caller ─────────────────────────────────────────────────────────────────

async def _call_nvd(keyword: str, start: int = 0) -> dict:
    params = {
        "keywordSearch": keyword,
        "startIndex":    start,
        "resultsPerPage": RESULTS_PER_QUERY,
    }
    headers = {"User-Agent": "CTIIndia-Platform/1.0"}

    for attempt in range(MAX_RETRIES + 1):
        try:
            async with httpx.AsyncClient(timeout=TIMEOUT) as client:
                resp = await client.get(NVD_URL, params=params, headers=headers)
            resp.raise_for_status()
            return resp.json()
        except httpx.HTTPStatusError as e:
            if e.response.status_code == 403:
                # NVD rate-limit — back off
                await asyncio.sleep(6)
            elif attempt == MAX_RETRIES:
                raise
        except Exception:
            if attempt == MAX_RETRIES:
                raise
            await asyncio.sleep(2)
    return {}


def _parse_nvd_response(raw: dict, query_tokens: set) -> list:
    parsed = []
    for item in raw.get("vulnerabilities", []):
        cve = item.get("cve", {})
        cve_id = cve.get("id", "")

        # Description — prefer English
        descriptions = cve.get("descriptions", [])
        description  = ""
        for d in descriptions:
            if d.get("lang") == "en":
                description = d.get("value", "")
                break
        if not description and descriptions:
            description = descriptions[0].get("value", "")

        cvss_score = _parse_cvss(cve)
        severity   = _severity_from_score(cvss_score)
        published  = cve.get("published", "")[:10]

        # Which keywords actually appear in description?
        desc_lower = description.lower()
        matched    = [k for k in query_tokens if k in desc_lower or k in cve_id.lower()]

        parsed.append({
            "cve_id":           cve_id,
            "description":      description[:600] + ("…" if len(description) > 600 else ""),
            "cvss_score":       cvss_score,
            "severity":         severity,
            "published":        published,
            "url":              f"https://nvd.nist.gov/vuln/detail/{cve_id}",
            "keywords_matched": matched,
        })
    return parsed


# ── Main endpoint ──────────────────────────────────────────────────────────────

@router.post("/ai-cve-search", response_model=CVESearchResponse)
async def ai_cve_search(payload: CVESearchRequest):
    raw_query = payload.query.strip()
    keywords  = _extract_keywords(raw_query)

    if not keywords:
        raise HTTPException(status_code=400, detail="Could not extract valid keywords from query.")

    try:
        raw = await _call_nvd(keywords)
    except httpx.HTTPStatusError as e:
        raise HTTPException(
            status_code=502,
            detail=f"NVD API returned HTTP {e.response.status_code}. Try again shortly.",
        )
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"NVD API unreachable: {str(e)}")

    query_tokens = set(keywords.lower().split())
    results      = _parse_nvd_response(raw, query_tokens)
    results      = _rank_results(results, keywords)
    total_found  = raw.get("totalResults", len(results))

    return {
        "query":        raw_query,
        "keywords_used": keywords,
        "total_found":  total_found,
        "results":      results[:20],
    }
