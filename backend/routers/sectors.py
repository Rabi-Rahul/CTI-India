from fastapi import APIRouter
from mock_data import get_sectors

router = APIRouter()

@router.get("/")
def list_sectors():
    return get_sectors()
