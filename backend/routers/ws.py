import asyncio
import json
from fastapi import APIRouter, WebSocket, WebSocketDisconnect

router = APIRouter()

class ConnectionManager:
    def __init__(self):
        self.active_connections: list[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        to_remove = []
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception:
                to_remove.append(connection)
        for conn in to_remove:
            self.active_connections.remove(conn)

manager = ConnectionManager()

# Create a dedicated manager for live cyber incidents
live_incidents_manager = ConnectionManager()

@router.websocket("/live-incidents")
async def live_incidents_ws(websocket: WebSocket):
    await live_incidents_manager.connect(websocket)
    try:
        # Client just listens for broadcasts from the background task
        while True:
            await websocket.receive_text() # Keep connection alive
    except WebSocketDisconnect:
        live_incidents_manager.disconnect(websocket)
