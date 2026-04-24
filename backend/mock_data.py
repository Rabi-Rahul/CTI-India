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
