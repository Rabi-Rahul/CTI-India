import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from routers import vulnerabilities, ws, link_scanner, cyber_incidents, predict, threat_map, ai_cve_search
from routers.cyber_incidents import sync_incidents_task
from database import engine, Base

# Create tables if they don't exist
Base.metadata.create_all(bind=engine)

app = FastAPI(title="CTIIndia Platform API", version="1.0.0")

# Setup Scheduler
scheduler = AsyncIOScheduler()

@app.on_event("startup")
async def start_scheduler():
    scheduler.add_job(sync_incidents_task, 'interval', seconds=30)
    scheduler.start()
    # Trigger first run immediately
    import asyncio
    asyncio.create_task(sync_incidents_task())

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Routers
app.include_router(vulnerabilities.router, prefix="/api/vulnerabilities", tags=["Vulnerabilities"])
app.include_router(link_scanner.router, prefix="/api", tags=["Tools"])
app.include_router(cyber_incidents.router, prefix="/api", tags=["Cyber Incidents"])
app.include_router(predict.router, prefix="/api", tags=["ML Prediction"])
app.include_router(ws.router, prefix="/ws", tags=["WebSockets"])
app.include_router(threat_map.router, prefix="/api/threat-map", tags=["Threat Map"])
app.include_router(ai_cve_search.router, prefix="/api", tags=["AI CVE Search"])

@app.get("/api/health")
def health_check():
    return {"status": "ok", "message": "CTIIndia API is running"}

# ── Serve Frontend ──────────────────────────────────────────
_FRONTEND = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "frontend")
_FRONTEND_SRC = os.path.join(_FRONTEND, "src")

# Serve /src/* static assets (CSS, JS)
if os.path.isdir(_FRONTEND_SRC):
    app.mount("/src", StaticFiles(directory=_FRONTEND_SRC), name="src")

# Catch-all: serve index.html for any other path
@app.get("/{full_path:path}")
async def serve_frontend(full_path: str):
    index = os.path.join(_FRONTEND, "index.html")
    if os.path.isfile(index):
        return FileResponse(index)
    return {"error": "Frontend not found"}
