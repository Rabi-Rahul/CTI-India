"""
Live Cyber Threat Map — Simulation Backend
GET /api/threat-map/live
"""
import random
from datetime import datetime, timezone
from fastapi import APIRouter
from typing import List, Dict, Any

router = APIRouter()

# ── City targets ────────────────────────────────────────────
INDIAN_CITIES = [
    {"city": "Delhi",     "coords": [77.2090,  28.6139]},
    {"city": "Mumbai",    "coords": [72.8777,  19.0760]},
    {"city": "Bangalore", "coords": [77.5946,  12.9716]},
    {"city": "Chennai",   "coords": [80.2707,  13.0827]},
    {"city": "Hyderabad", "coords": [78.4867,  17.3850]},
    {"city": "Kolkata",   "coords": [88.3639,  22.5726]},
    {"city": "Pune",      "coords": [73.8567,  18.5204]},
]

# ── Attacker origin regions ─────────────────────────────────
ATTACKER_REGIONS = [
    {"country": "China",       "coords": [104.19,  35.86],  "weight": 30},
    {"country": "Russia",      "coords": [105.31,  61.52],  "weight": 20},
    {"country": "USA",         "coords": [-95.71,  37.09],  "weight": 15},
    {"country": "Iran",        "coords": [53.68,   32.43],  "weight": 12},
    {"country": "North Korea", "coords": [127.51,  40.33],  "weight": 10},
    {"country": "Pakistan",    "coords": [69.34,   30.37],  "weight": 8},
    {"country": "Brazil",      "coords": [-51.92, -14.23],  "weight": 5},
    {"country": "UK",          "coords": [-3.43,   55.37],  "weight": 4},
    {"country": "Germany",     "coords": [10.45,   51.16],  "weight": 3},
    {"country": "Israel",      "coords": [34.85,   31.04],  "weight": 3},
    {"country": "Ukraine",     "coords": [31.16,   48.37],  "weight": 3},
    {"country": "Vietnam",     "coords": [108.27,  14.05],  "weight": 4},
]

# ── Attack attribute pools ─────────────────────────────────
VECTORS = [
    "UDP Flood", "TCP SYN", "DNS Flood", "ICMP Flood", "HTTP Flood",
    "XSS", "SQL Injection", "Access Violations", "Brute Force", "Port Scan",
]

ATTACK_TYPES = {
    "UDP Flood":         "ddos",
    "TCP SYN":           "ddos",
    "DNS Flood":         "ddos",
    "ICMP Flood":        "ddos",
    "HTTP Flood":        "ddos",
    "XSS":               "web_attack",
    "SQL Injection":     "web_attack",
    "Access Violations": "intrusion",
    "Brute Force":       "intrusion",
    "Port Scan":         "scanner",
}

# Weighted random choice helper
def _wchoice(pool):
    total = sum(r["weight"] for r in pool)
    r = random.uniform(0, total)
    cum = 0
    for item in pool:
        cum += item["weight"]
        if r <= cum:
            return item
    return pool[-1]


@router.get("/live", response_model=List[Dict[str, Any]])
def get_live_threats():
    """
    Simulates 2–5 concurrent cyber attack events targeting Indian cities.
    Weights are applied so China, Russia, USA appear more frequently.
    """
    num_attacks = random.randint(2, 5)
    attacks = []

    for _ in range(num_attacks):
        src = _wchoice(ATTACKER_REGIONS)
        dst = random.choice(INDIAN_CITIES)

        # Jitter the origin so flows look organic, not all from exact capital
        src_lon = src["coords"][0] + random.uniform(-4.0, 4.0)
        src_lat = src["coords"][1] + random.uniform(-4.0, 4.0)

        # Minor city jitter
        tgt_lon = dst["coords"][0] + random.uniform(-0.15, 0.15)
        tgt_lat = dst["coords"][1] + random.uniform(-0.15, 0.15)

        vector   = random.choice(VECTORS)
        severity = random.randint(4, 10)

        attacks.append({
            "id":             f"T{random.randint(1000, 9999)}",
            "type":           ATTACK_TYPES.get(vector, "unknown"),
            "source_country": src["country"],
            "source_coords":  [src_lon, src_lat],
            "target_city":    dst["city"],
            "target_coords":  [tgt_lon, tgt_lat],
            "severity":       severity,
            "vector":         vector,
            "timestamp":      datetime.now(timezone.utc).isoformat(),
        })

    return attacks
