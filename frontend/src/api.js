/**
 * CTIIndia API Service
 * Centralized API calls and WebSocket connection management
 */

const API_BASE = 'http://localhost:8000/api';

const API = {
  async get(path) {
    try {
      const resp = await fetch(`${API_BASE}${path}`);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      return await resp.json();
    } catch (err) {
      console.warn(`API call failed: ${path}`, err);
      return null;
    }
  },
  async post(path, body) {
    try {
      const resp = await fetch(`${API_BASE}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      return await resp.json();
    } catch (err) {
      console.warn(`API POST failed: ${path}`, err);
      return null;
    }
  }
};

let wsConnections = {};

function disconnectAllWS() {
  Object.values(wsConnections).forEach(ws => { try { ws.close(); } catch { } });
  wsConnections = {};
}
