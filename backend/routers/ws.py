import asyncio
import json
import random
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from mock_data import get_early_warning_alerts, get_threat_map_data, INDIA_STATES, THREAT_TYPES, SEVERITIES, SECTORS

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


@router.websocket("/early-warning")
async def early_warning_ws(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        # Send initial batch
        await websocket.send_json({"type": "initial", "data": get_early_warning_alerts()})
        # Send live updates every 5 seconds
        while True:
            await asyncio.sleep(5)
            new_alert = {
                "type": "new_alert",
                "data": {
                    "id": f"EWA-{random.randint(10000, 99999)}",
                    "title": f"{random.choice(THREAT_TYPES)} attack detected in {random.choice(INDIA_STATES)}",
                    "severity": random.choice(SEVERITIES),
                    "sector": random.choice(SECTORS),
                    "threat_type": random.choice(THREAT_TYPES),
                    "timestamp": asyncio.get_event_loop().time(),
                    "source_ip": f"{random.randint(1,254)}.{random.randint(0,254)}.{random.randint(0,254)}.{random.randint(1,254)}",
                    "confidence": random.randint(75, 99)
                }
            }
            await websocket.send_json(new_alert)
    except WebSocketDisconnect:
        manager.disconnect(websocket)


@router.websocket("/threat-map")
async def threat_map_ws(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        await websocket.send_json({"type": "initial", "data": get_threat_map_data()})
        while True:
            await asyncio.sleep(3)
            src = random.choice(INDIA_STATES)
            dst = random.choice([s for s in INDIA_STATES if s != src])
            new_attack = {
                "type": "new_attack",
                "data": {
                    "id": f"ATK-{random.randint(10000, 99999)}",
                    "source_state": src,
                    "target_state": dst,
                    "threat_type": random.choice(THREAT_TYPES),
                    "severity": random.choice(SEVERITIES)
                }
            }
            await websocket.send_json(new_attack)
    except WebSocketDisconnect:
        manager.disconnect(websocket)
