from fastapi import APIRouter
from mock_data import get_vulnerabilities

router = APIRouter()

@router.get("/")
def list_vulnerabilities(severity: str = None):
    vulns = get_vulnerabilities()
    if severity:
        vulns = [v for v in vulns if v["severity"] == severity.upper()]
    return vulns
