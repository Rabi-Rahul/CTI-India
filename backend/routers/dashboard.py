from fastapi import APIRouter
from mock_data import get_overview_stats, get_early_warning_alerts, get_threat_map_data, get_analytics_data

router = APIRouter()

@router.get("/overview")
def overview():
    return get_overview_stats()

@router.get("/early-warning")
def early_warning():
    return get_early_warning_alerts()

@router.get("/threat-map")
def threat_map():
    return get_threat_map_data()

@router.get("/analytics")
def analytics():
    return get_analytics_data()
