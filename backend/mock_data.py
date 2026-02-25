"""
Mock data generators for the CTIIndia Platform.
Provides realistic, India-focused cybersecurity data for all API endpoints.
"""
import random
from datetime import datetime, timedelta

SECTORS = [
    "Power & Energy", "Telecom", "Banking & Finance", "Railways",
    "Healthcare", "Government IT", "Defence", "Water Supply"
]

THREAT_TYPES = ["DDoS", "Phishing", "Malware", "Ransomware", "APT", "Data Breach", "SQL Injection", "Insider Threat"]

INDIA_STATES = [
    "Delhi", "Maharashtra", "Karnataka", "Tamil Nadu", "Uttar Pradesh",
    "West Bengal", "Telangana", "Gujarat", "Rajasthan", "Kerala",
    "Madhya Pradesh", "Andhra Pradesh", "Punjab", "Haryana", "Bihar"
]

SEVERITIES = ["CRITICAL", "HIGH", "MEDIUM", "LOW"]

CVE_PREFIXES = ["CVE-2024-", "CVE-2025-", "CVE-2023-"]
CVE_VENDORS = ["Microsoft", "Cisco", "Apache", "Linux Kernel", "OpenSSL", "Fortinet", "VMware", "Oracle"]


def get_overview_stats():
    return {
        "active_incidents": random.randint(42, 78),
        "critical_alerts": random.randint(8, 22),
        "threats_blocked_today": random.randint(1200, 2800),
        "sectors_affected": random.randint(3, 7),
        "national_risk_score": round(random.uniform(6.5, 9.2), 1),
        "risk_level": "HIGH",
        "ioc_count": random.randint(14500, 21000),
        "vulnerabilities_open": random.randint(230, 480),
        "last_updated": datetime.now().isoformat()
    }


def get_early_warning_alerts():
    alerts = []
    for _ in range(12):
        state = random.choice(INDIA_STATES)
        threat = random.choice(THREAT_TYPES)
        severity = random.choice(SEVERITIES)
        sector = random.choice(SECTORS)
        minutes_ago = random.randint(1, 120)
        alerts.append({
            "id": f"EWA-{random.randint(10000, 99999)}",
            "title": f"{threat} attack detected targeting {sector} in {state}",
            "severity": severity,
            "state": state,
            "sector": sector,
            "threat_type": threat,
            "timestamp": (datetime.now() - timedelta(minutes=minutes_ago)).isoformat(),
            "source_ip": f"{random.randint(1,254)}.{random.randint(0,254)}.{random.randint(0,254)}.{random.randint(1,254)}",
            "confidence": random.randint(75, 99)
        })
    return sorted(alerts, key=lambda x: x["timestamp"], reverse=True)


def get_threat_map_data():
    attacks = []
    for _ in range(30):
        src_state = random.choice(INDIA_STATES)
        dst_state = random.choice([s for s in INDIA_STATES if s != src_state])
        attacks.append({
            "id": f"ATK-{random.randint(10000, 99999)}",
            "source_state": src_state,
            "target_state": dst_state,
            "threat_type": random.choice(THREAT_TYPES),
            "severity": random.choice(SEVERITIES),
            "timestamp": (datetime.now() - timedelta(minutes=random.randint(0, 60))).isoformat(),
            "packet_count": random.randint(500, 100000)
        })
    return attacks


def get_analytics_data():
    months = ["Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb"]
    monthly_attacks = [random.randint(800, 3000) for _ in months]
    sector_data = [
        {"sector": s, "attacks": random.randint(50, 500), "risk_score": round(random.uniform(4.0, 9.8), 1)}
        for s in SECTORS
    ]
    threat_distribution = [
        {"type": t, "count": random.randint(100, 800)} for t in THREAT_TYPES
    ]
    return {
        "monthly_trend": [{"month": m, "attacks": c} for m, c in zip(months, monthly_attacks)],
        "sector_analysis": sector_data,
        "threat_distribution": threat_distribution
    }


def get_vulnerabilities():
    vulns = []
    for i in range(25):
        prefix = random.choice(CVE_PREFIXES)
        cve_id = f"{prefix}{random.randint(10000, 50000)}"
        severity = random.choice(SEVERITIES)
        vendor = random.choice(CVE_VENDORS)
        vulns.append({
            "id": cve_id,
            "title": f"{vendor} {random.choice(['Remote Code Execution', 'Privilege Escalation', 'Authentication Bypass', 'Buffer Overflow', 'XSS', 'SSRF'])} Vulnerability",
            "severity": severity,
            "cvss_score": round(random.uniform(4.0, 10.0), 1),
            "vendor": vendor,
            "affected_product": f"{vendor} Product v{random.randint(1,15)}.{random.randint(0,9)}",
            "published": (datetime.now() - timedelta(days=random.randint(1, 90))).strftime("%Y-%m-%d"),
            "patch_available": random.choice([True, False]),
            "patch_url": f"https://nvd.nist.gov/vuln/detail/{cve_id}",
            "sectors_affected": random.sample(SECTORS, random.randint(1, 4))
        })
    return sorted(vulns, key=lambda x: x["cvss_score"], reverse=True)


def get_ioc_database():
    iocs = []
    ioc_types = ["IP Address", "Domain", "File Hash (MD5)", "File Hash (SHA256)", "URL", "Email"]
    for _ in range(50):
        ioc_type = random.choice(ioc_types)
        if ioc_type == "IP Address":
            value = f"{random.randint(1,254)}.{random.randint(0,254)}.{random.randint(0,254)}.{random.randint(1,254)}"
        elif ioc_type == "Domain":
            tlds = [".com", ".ru", ".cn", ".xyz", ".info"]
            value = f"{''.join(random.choices('abcdefghijklmnopqrstuvwxyz', k=random.randint(6,14)))}{random.choice(tlds)}"
        elif "Hash" in ioc_type:
            value = ''.join(random.choices('0123456789abcdef', k=32 if "MD5" in ioc_type else 64))
        elif ioc_type == "URL":
            value = f"http://malicious-{''.join(random.choices('abcdefghijklmnopqrstuvwxyz', k=8))}.xyz/payload"
        else:
            value = f"phish_{''.join(random.choices('abcdefghijklmnopqrstuvwxyz', k=6))}@malicious.com"

        iocs.append({
            "id": f"IOC-{random.randint(10000, 99999)}",
            "type": ioc_type,
            "value": value,
            "reputation_score": random.randint(10, 99),
            "tags": random.sample(THREAT_TYPES, random.randint(1, 3)),
            "first_seen": (datetime.now() - timedelta(days=random.randint(1, 365))).strftime("%Y-%m-%d"),
            "last_seen": (datetime.now() - timedelta(days=random.randint(0, 30))).strftime("%Y-%m-%d"),
            "source": random.choice(["CERT-In", "NCIIPC", "Manual Report", "Honeypot", "Open Source Intel"]),
            "country": random.choice(["China", "Russia", "North Korea", "Unknown", "Pakistan", "Iran"])
        })
    return iocs


def get_incidents():
    statuses = ["OPEN", "INVESTIGATING", "RESOLVED", "ESCALATED"]
    incidents = []
    for i in range(20):
        status = random.choice(statuses)
        severity = random.choice(SEVERITIES)
        sector = random.choice(SECTORS)
        state = random.choice(INDIA_STATES)
        created = datetime.now() - timedelta(hours=random.randint(1, 720))
        incidents.append({
            "ticket_id": f"INC-{2025000 + i}",
            "title": f"{random.choice(THREAT_TYPES)} Incident in {state} {sector}",
            "status": status,
            "severity": severity,
            "sector": sector,
            "state": state,
            "reporter": f"Analyst_{random.randint(1,20)}",
            "assigned_to": f"Team_{random.choice(['Alpha','Bravo','Charlie','Delta'])}",
            "created_at": created.isoformat(),
            "updated_at": (created + timedelta(hours=random.randint(1, 10))).isoformat(),
            "description": f"Detected suspicious {random.choice(THREAT_TYPES).lower()} activity targeting {sector} infrastructure in {state}.",
            "iocs_linked": random.randint(0, 8)
        })
    return incidents


def get_sectors():
    sector_data = []
    for sector in SECTORS:
        sector_data.append({
            "name": sector,
            "risk_score": round(random.uniform(3.5, 9.8), 1),
            "active_incidents": random.randint(0, 15),
            "threats_last_30d": random.randint(20, 450),
            "critical_assets": random.randint(5, 50),
            "last_incident": (datetime.now() - timedelta(hours=random.randint(1, 168))).isoformat(),
            "status": random.choice(["NORMAL", "ELEVATED", "HIGH ALERT", "CRITICAL"])
        })
    return sorted(sector_data, key=lambda x: x["risk_score"], reverse=True)
