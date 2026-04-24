import asyncio
import httpx
import feedparser
import warnings

# Suppress SSL warnings when verify=False is used (Windows cert store issue)
warnings.filterwarnings("ignore", message="Unverified HTTPS request")
from datetime import datetime
from email.utils import parsedate_to_datetime
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from typing import List, Dict, Any
import hashlib

from database import get_db, SessionLocal
from models import Incident

router = APIRouter()

# -------------------------------------------------------------------------
# CLASSIFICATION LOGIC
# -------------------------------------------------------------------------
def classify_incident(title: str, description: str, origin: str) -> tuple[str, str]:
    text = (title + " " + description).lower()
    
    # Severity Classification
    if "ransomware" in text or "breach" in text or "leak" in text or "attack confirmed" in text or origin == "URLHaus":
        severity = "High"
    elif "phishing" in text or "malware" in text or "vulnerability" in text or "exploit" in text:
        severity = "Medium"
    else:
        severity = "Low"

    # Sector Classification
    if any(keyword in text for keyword in ["rbi", "bank", "upi", "payment"]):
        sector = "Banking"
    elif any(keyword in text for keyword in ["ministry", "gov.in", "nic"]):
        sector = "Government"
    elif any(keyword in text for keyword in ["power", "telecom", "airport", "oil"]):
        sector = "Infrastructure"
    else:
        sector = "General"

    return severity, sector

# -------------------------------------------------------------------------
# FETCHERS
# -------------------------------------------------------------------------
async def fetch_google_news() -> List[Dict[str, Any]]:
    queries = ["cybersecurity India", "data breach India", "ransomware India"]
    
    async def fetch_and_parse(query):
        results = []
        url = f"https://news.google.com/rss/search?q={query.replace(' ', '+')}&hl=en-IN&gl=IN&ceid=IN:en"
        try:
            async with httpx.AsyncClient(timeout=5.0, verify=False) as client:
                resp = await client.get(url)
                if resp.status_code == 200:
                    feed = feedparser.parse(resp.text)
                    for entry in feed.entries[:5]: # limit to top 5 per query
                        try:
                            pub_date = parsedate_to_datetime(entry.published)
                        except Exception:
                            pub_date = datetime.utcnow()
                        results.append({
                            "title": entry.title,
                            "source": entry.source.title if hasattr(entry, 'source') else "Google News",
                            "link": entry.link,
                            "description": entry.description,
                            "origin": "Google News RSS",
                            "published_at": pub_date
                        })
        except Exception as e:
            print(f"Error fetching Google query {query}: {e}")
        return results

    tasks = [fetch_and_parse(q) for q in queries]
    results = await asyncio.gather(*tasks)
    return [item for sublist in results for item in sublist]

from routers.ws import live_incidents_manager

# -------------------------------------------------------------------------
# BACKGROUND TASK
# -------------------------------------------------------------------------
async def sync_incidents_task():
    print("Running background cyber incidents sync (Google News Only)...")
    raw_incidents = await fetch_google_news()
    
    # Sort incidents by published_at explicitly before inserting to satisfy date ordering requirement
    raw_incidents.sort(key=lambda x: x["published_at"], reverse=True)
    
    db = SessionLocal()
    new_incidents_for_broadcast = []
    
    try:
        for item in raw_incidents:
            if not item.get("link"):
                continue
                
            severity, sector = classify_incident(item["title"], item["description"], item["origin"])
            
            link_hash = hashlib.sha256(item["link"].encode('utf-8')).hexdigest()
            incident_db = Incident(
                title=item["title"][:500],
                source=item["source"][:200],
                severity=severity,
                sector=sector,
                link=item["link"],
                link_hash=link_hash,
                origin=item["origin"][:100],
                published_at=item["published_at"]
            )
            
            try:
                db.add(incident_db)
                db.commit()
                db.refresh(incident_db)
                
                # If we successfully committed, it's new!
                new_incidents_for_broadcast.append({
                    "id": incident_db.id,
                    "title": incident_db.title,
                    "source": incident_db.source,
                    "severity": incident_db.severity,
                    "sector": incident_db.sector,
                    "link": incident_db.link,
                    "origin": incident_db.origin,
                    "published_at": incident_db.published_at.isoformat() + "Z" if incident_db.published_at else None,
                    "created_at": incident_db.created_at.isoformat() + "Z" if incident_db.created_at else None
                })
            except IntegrityError:
                db.rollback() # Duplicate link
            except Exception as e:
                db.rollback()
                print(f"DB Error logic: {e}")
                
        # Broadcast all new incidents to connected WebSocket clients
        for new_item in new_incidents_for_broadcast:
            await live_incidents_manager.broadcast({
                "type": "new_incident",
                "data": new_item
            })
            
    finally:
        db.close()


# -------------------------------------------------------------------------
# ENDPOINT
# -------------------------------------------------------------------------
@router.get("/india-incidents")
async def get_india_incidents(db: Session = Depends(get_db)):
    """
    Returns the latest India-focused cyber incidents instantly from the database.
    (Fetching occurs in the background task via APScheduler)
    """
    db_incidents = db.query(Incident).order_by(Incident.published_at.desc()).limit(100).all()
    
    return {
        "total_incidents": len(db_incidents),
        "last_updated": datetime.utcnow().isoformat() + "Z",
        "incidents": [
            {
                "id": i.id,
                "title": i.title,
                "source": i.source,
                "severity": i.severity,
                "sector": i.sector,
                "link": i.link,
                "origin": i.origin,
                "published_at": i.published_at.isoformat() + "Z" if i.published_at else None,
                "created_at": i.created_at.isoformat() + "Z" if i.created_at else None
            }
            for i in db_incidents
        ]
    }
