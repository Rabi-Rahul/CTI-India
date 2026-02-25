from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
from mock_data import get_incidents
import random

router = APIRouter()

class IncidentReport(BaseModel):
    title: str
    description: str
    sector: str
    severity: str
    state: str
    reporter_name: str
    reporter_email: str
    contact_number: Optional[str] = None

@router.get("/tracker")
def get_incident_tracker(status: str = None):
    incidents = get_incidents()
    if status:
        incidents = [i for i in incidents if i["status"] == status.upper()]
    return incidents

@router.post("/report")
def report_incident(incident: IncidentReport):
    ticket_id = f"INC-{random.randint(2025100, 2025999)}"
    return {
        "success": True,
        "ticket_id": ticket_id,
        "message": f"Incident '{incident.title}' reported successfully. Ticket ID: {ticket_id}",
        "status": "OPEN",
        "severity": incident.severity,
        "estimated_response": "Within 2 hours for CRITICAL, 4 hours for HIGH"
    }
