import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from routers import dashboard, incidents, ioc, sectors, vulnerabilities, ws, link_scanner

app = FastAPI(title="CTIIndia Platform API", version="1.0.0")

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Routers
app.include_router(dashboard.router, prefix="/api/dashboard", tags=["Dashboard"])
app.include_router(incidents.router, prefix="/api/incidents", tags=["Incidents"])
app.include_router(ioc.router, prefix="/api/ioc", tags=["IOCs"])
app.include_router(sectors.router, prefix="/api/sectors", tags=["Sectors"])
app.include_router(vulnerabilities.router, prefix="/api/vulnerabilities", tags=["Vulnerabilities"])
app.include_router(link_scanner.router, prefix="/api", tags=["Tools"])
app.include_router(ws.router, prefix="/ws", tags=["WebSockets"])

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
