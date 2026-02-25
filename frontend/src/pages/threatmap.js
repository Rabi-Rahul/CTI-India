/**
 * Threat Map Page - India interactive attack visualization
 */
const STATE_COORDS = {
    'Delhi': { x: 320, y: 200 },
    'Maharashtra': { x: 260, y: 350 },
    'Karnataka': { x: 265, y: 430 },
    'Tamil Nadu': { x: 290, y: 490 },
    'Uttar Pradesh': { x: 360, y: 220 },
    'West Bengal': { x: 455, y: 280 },
    'Telangana': { x: 295, y: 390 },
    'Gujarat': { x: 195, y: 310 },
    'Rajasthan': { x: 245, y: 245 },
    'Kerala': { x: 255, y: 500 },
    'Madhya Pradesh': { x: 305, y: 295 },
    'Andhra Pradesh': { x: 310, y: 425 },
    'Punjab': { x: 295, y: 175 },
    'Haryana': { x: 305, y: 195 },
    'Bihar': { x: 405, y: 250 },
};

const THREAT_COLORS = {
    'DDoS': '#38BDF8',
    'Phishing': '#F59E0B',
    'Malware': '#EF4444',
    'Ransomware': '#8B5CF6',
    'APT': '#EC4899',
    'Data Breach': '#22C55E',
    'SQL Injection': '#3B82F6',
    'Insider Threat': '#F97316'
};

let mapAttacks = [];
let mapFilter = 'ALL';
let mapAnimInterval = null;

async function renderThreatMap() {
    const container = document.getElementById('page-container');
    mapAttacks = (await API.get('/dashboard/threat-map')) || MockData.threatMap(30);

    container.innerHTML = `
    <div class="page-header">
      <div>
        <h2 class="page-title">🗺️ India Cyber Threat Map</h2>
        <p class="page-subtitle">Real-time state-to-state attack visualization across India's critical infrastructure</p>
      </div>
      <div class="page-actions">
        <div class="status-dot-group">
          <span class="status-dot green"></span>
          <span class="status-text">LIVE TRACKING</span>
        </div>
      </div>
    </div>

    <!-- FILTERS -->
    <div class="glass-card mb16">
      <div class="card-inner" style="padding:12px 20px">
        <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap">
          <span style="font-size:11px;color:var(--text-secondary);font-weight:600;text-transform:uppercase;letter-spacing:0.8px;">Filter:</span>
          ${['ALL', 'DDoS', 'Phishing', 'Malware', 'Ransomware', 'APT'].map(t => `
            <button class="type-chip ${t === 'ALL' ? 'active' : ''}" data-filter="${t}" onclick="setMapFilter('${t}')"
              style="${t !== 'ALL' ? `--chip-color:${THREAT_COLORS[t] || 'var(--cyan)'}` : ''}">${t}</button>
          `).join('')}
          <span style="margin-left:auto;font-family:var(--font-mono);font-size:11px;color:var(--text-muted)" id="map-attack-count">${mapAttacks.length} attacks tracked</span>
        </div>
      </div>
    </div>

    <div class="grid-2-1">
      <!-- MAP -->
      <div class="glass-card">
        <div class="card-inner" style="padding:0">
          <div class="threat-map-container">
            <svg id="india-map" viewBox="0 80 550 520" width="100%" height="520"
              style="background:radial-gradient(ellipse at center, #0d2040 0%, #050d1a 100%)">
              <!-- Grid lines -->
              ${Array.from({ length: 12 }, (_, i) => `<line x1="${i * 50}" y1="0" x2="${i * 50}" y2="600" stroke="rgba(56,189,248,0.04)" stroke-width="1"/>`).join('')}
              ${Array.from({ length: 14 }, (_, i) => `<line x1="0" y1="${i * 50}" x2="600" y2="${i * 50}" stroke="rgba(56,189,248,0.04)" stroke-width="1"/>`).join('')}

              <!-- State nodes -->
              ${Object.entries(STATE_COORDS).map(([state, pos]) => `
                <g class="state-node" id="state-${state.replace(/ /g, '-')}">
                  <circle cx="${pos.x}" cy="${pos.y}" r="14"
                    fill="rgba(56,189,248,0.08)" stroke="rgba(56,189,248,0.3)" stroke-width="1"/>
                  <circle cx="${pos.x}" cy="${pos.y}" r="5"
                    fill="#38BDF8" opacity="0.8"/>
                  <circle cx="${pos.x}" cy="${pos.y}" r="5"
                    fill="transparent" stroke="#38BDF8" stroke-width="1"
                    style="animation: pingPulse 3s ease-out infinite; animation-delay: ${Math.random() * 2}s"/>
                  <text x="${pos.x}" y="${pos.y + 26}" text-anchor="middle"
                    fill="#64748B" font-size="9" font-family="Inter">${state}</text>
                </g>
              `).join('')}

              <!-- Attack lines container -->
              <g id="attack-lines"></g>
            </svg>
          </div>
        </div>
      </div>

      <!-- RIGHT PANEL -->
      <div style="display:flex;flex-direction:column;gap:16px">
        <!-- Legend -->
        <div class="glass-card">
          <div class="card-inner">
            <div class="card-header"><span class="section-title">Threat Legend</span></div>
            ${Object.entries(THREAT_COLORS).slice(0, 7).map(([t, c]) => `
              <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">
                <div style="width:12px;height:12px;border-radius:50%;background:${c};box-shadow:0 0 6px ${c}"></div>
                <span style="font-size:12px;color:var(--text-secondary)">${t}</span>
                <span style="margin-left:auto;font-family:var(--font-mono);font-size:11px;color:var(--text-muted)">${mapAttacks.filter(a => a.threat_type === t).length}</span>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Live attack log -->
        <div class="glass-card" style="flex:1">
          <div class="card-inner">
            <div class="card-header"><span class="section-title">Live Attack Log</span></div>
            <div id="map-attack-log" style="max-height:300px;overflow-y:auto">
              ${mapAttacks.slice(0, 8).map(a => `
                <div style="display:flex;align-items:center;gap:8px;padding:8px 0;border-bottom:1px solid var(--border)">
                  <div style="width:8px;height:8px;border-radius:50%;background:${THREAT_COLORS[a.threat_type] || '#94A3B8'};flex-shrink:0"></div>
                  <div style="flex:1;min-width:0">
                    <div style="font-size:11px;font-weight:600;color:var(--text-primary)">${a.source_state} → ${a.target_state}</div>
                    <div style="font-size:10px;color:var(--text-muted)">${a.threat_type}</div>
                  </div>
                  <span class="badge badge-${a.severity.toLowerCase()}" style="font-size:9px">${a.severity}</span>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

    // Add ping animation style
    if (!document.getElementById('map-style')) {
        const s = document.createElement('style');
        s.id = 'map-style';
        s.textContent = `
      @keyframes pingPulse {
        0% { transform: scale(1); opacity:0.8; }
        50% { transform: scale(4); opacity:0; }
        100% { transform: scale(1); opacity:0; }
      }
    `;
        document.head.appendChild(s);
    }

    startMapAnimation();
}

function setMapFilter(filter) {
    mapFilter = filter;
    document.querySelectorAll('[data-filter]').forEach(b => b.classList.toggle('active', b.dataset.filter === filter));
}

let mapAnimQueue = [];
function startMapAnimation() {
    const attacks = MockData.threatMap(40);
    let idx = 0;
    clearInterval(mapAnimInterval);
    mapAnimInterval = setInterval(() => {
        if (idx >= attacks.length) idx = 0;
        const atk = attacks[idx++];
        if (mapFilter !== 'ALL' && atk.threat_type !== mapFilter) return;
        const src = STATE_COORDS[atk.source_state];
        const dst = STATE_COORDS[atk.target_state];
        if (!src || !dst) return;

        const color = THREAT_COLORS[atk.threat_type] || '#38BDF8';
        const linesContainer = document.getElementById('attack-lines');
        if (!linesContainer) { clearInterval(mapAnimInterval); return; }

        const lineId = `line-${Date.now()}`;
        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('id', lineId);
        line.setAttribute('x1', src.x); line.setAttribute('y1', src.y);
        line.setAttribute('x2', dst.x); line.setAttribute('y2', dst.y);
        line.setAttribute('stroke', color); line.setAttribute('stroke-width', '1.5');
        line.setAttribute('stroke-dasharray', '200');
        line.setAttribute('stroke-dashoffset', '200');
        line.setAttribute('opacity', '0.8');
        linesContainer.appendChild(line);

        // Animate
        line.animate([{ strokeDashoffset: 200 }, { strokeDashoffset: 0 }], { duration: 1500 }).onfinish = () => {
            line.animate([{ opacity: 0.8 }, { opacity: 0 }], { duration: 500 }).onfinish = () => line.remove();
        };

        // Flash destination
        const dstNode = document.getElementById(`state-${atk.target_state.replace(/ /g, '-')}`);
        if (dstNode) {
            const flash = dstNode.querySelector('circle');
            if (flash) {
                flash.animate([{ fill: color, r: '12' }, { fill: '#38BDF8', r: '5' }], { duration: 800 });
            }
        }

        // Update log
        const log = document.getElementById('map-attack-log');
        if (log) {
            const entry = document.createElement('div');
            entry.style.cssText = `display:flex;align-items:center;gap:8px;padding:8px 0;border-bottom:1px solid var(--border);animation:slideInAlert 0.3s ease`;
            entry.innerHTML = `
        <div style="width:8px;height:8px;border-radius:50%;background:${color};flex-shrink:0"></div>
        <div style="flex:1"><div style="font-size:11px;font-weight:600;color:var(--text-primary)">${atk.source_state} → ${atk.target_state}</div><div style="font-size:10px;color:var(--text-muted)">${atk.threat_type}</div></div>
        <span class="badge badge-${atk.severity.toLowerCase()}" style="font-size:9px">${atk.severity}</span>
      `;
            log.prepend(entry);
            if (log.children.length > 12) log.lastChild.remove();
        }
    }, 2000);
}
