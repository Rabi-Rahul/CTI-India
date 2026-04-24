/**
 * ============================================================
 *  LIVE CYBER THREAT MAP — CTIIndia
 *  Radware-Style | Leaflet.js + India GeoJSON + Canvas Arcs
 * ============================================================
 */

// ─────────────────────────────────────────────────────────────
//  CONSTANTS
// ─────────────────────────────────────────────────────────────
const TM = {
  INDIA_CITIES: [
    { name: 'Delhi',     lat: 28.6139,  lon: 77.2090,  weight: 0 },
    { name: 'Mumbai',    lat: 19.0760,  lon: 72.8777,  weight: 0 },
    { name: 'Bangalore', lat: 12.9716,  lon: 77.5946,  weight: 0 },
    { name: 'Chennai',   lat: 13.0827,  lon: 80.2707,  weight: 0 },
    { name: 'Hyderabad', lat: 17.3850,  lon: 78.4867,  weight: 0 },
    { name: 'Kolkata',   lat: 22.5726,  lon: 88.3639,  weight: 0 },
    { name: 'Pune',      lat: 18.5204,  lon: 73.8567,  weight: 0 },
  ],

  ATTACKER_REGIONS: [
    { country: 'China',       lat: 35.86,   lon: 104.19, weight: 30 },
    { country: 'Russia',      lat: 61.52,   lon: 105.31, weight: 20 },
    { country: 'USA',         lat: 37.09,   lon: -95.71, weight: 15 },
    { country: 'Iran',        lat: 32.43,   lon: 53.68,  weight: 12 },
    { country: 'North Korea', lat: 40.33,   lon: 127.51, weight: 10 },
    { country: 'Pakistan',    lat: 30.37,   lon: 69.34,  weight: 8  },
    { country: 'Brazil',      lat: -14.23,  lon: -51.92, weight: 5  },
    { country: 'UK',          lat: 55.37,   lon: -3.43,  weight: 4  },
    { country: 'Germany',     lat: 51.16,   lon: 10.45,  weight: 3  },
    { country: 'Israel',      lat: 31.04,   lon: 34.85,  weight: 3  },
    { country: 'Ukraine',     lat: 48.37,   lon: 31.16,  weight: 3  },
    { country: 'Vietnam',     lat: 14.05,   lon: 108.27, weight: 4  },
  ],

  VECTORS: [
    'UDP Flood','TCP SYN','DNS Flood','ICMP Flood','HTTP Flood',
    'XSS','SQL Injection','Access Violations','Brute Force','Port Scan',
  ],

  COLORS: {
    critical: '#ff1f1f',
    high:     '#ff6b00',
    medium:   '#b700ff',
    low:      '#00d4ff',
  },
};

// ─────────────────────────────────────────────────────────────
//  STATE
// ─────────────────────────────────────────────────────────────
let tmState = {
  leafletMap:     null,
  canvas:         null,
  ctx:            null,
  width:          0,
  height:         0,
  arcs:           [],
  ripples:        [],
  attackerStats:  {},
  cityStats:      {},
  vectorStats:    {},
  appAttackStats: { 'XSS': 0, 'SQL Injection': 0, 'Access Violations': 0 },
  rps:            127430,
  totalAttacks:   0,
  filters: {
    'Web Attacks':  true,
    'DDoS':         true,
    'Intrusions':   true,
    'Scanners':     true,
    'Anonymizers':  true,
  },
  interval:       null,
  rpsInterval:    null,
  animFrame:      null,
  _mainContent:   null,
  _resizeObs:     null,
};

// ─────────────────────────────────────────────────────────────
//  HTML
// ─────────────────────────────────────────────────────────────
const TM_HTML = `
<div class="tm-root" id="tm-root">

  <!-- LEAFLET MAP CONTAINER -->
  <div id="tm-leaflet-map"></div>

  <!-- CANVAS OVERLAY (attack arcs / particles) -->
  <canvas id="tm-canvas"></canvas>

  <!-- SCANLINES -->
  <div class="tm-scanlines"></div>

  <!-- TOP STRIP -->
  <div class="tm-top-strip">
    <div class="tm-top-left">
      <span class="tm-live-dot"></span>
      <span class="tm-live-label">LIVE THREAT MAP</span>
    </div>
    <div class="tm-top-center">
      <span class="tm-system-name">🛡 CTIIndia — National Cyber Threat Intelligence Platform &nbsp;|&nbsp; India Threat Operations Centre</span>
    </div>
    <div class="tm-top-right">
      <select id="tm-interval" class="tm-interval-select">
        <option value="1h">Past 1 Hour</option>
        <option value="24h">Past 24 Hours</option>
      </select>
    </div>
  </div>

  <!-- STATE HOVER TOOLTIP -->
  <div id="tm-state-tip" class="tm-state-tip"></div>

  <!-- LEFT FILTER PANEL -->
  <div class="tm-panel tm-panel-left" id="tm-left-panel">
    <div class="tm-panel-header">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>
      THREAT FILTERS
    </div>

    <div class="tm-filter-group">
      <label class="tm-filter-check active" data-filter="Web Attacks">
        <span class="tm-check-dot" style="background:#b700ff"></span>
        Web Attacks
        <span class="tm-filter-count" id="fc-web">0</span>
      </label>
      <label class="tm-filter-check active" data-filter="DDoS">
        <span class="tm-check-dot" style="background:#ff1f1f"></span>
        DDoS
        <span class="tm-filter-count" id="fc-ddos">0</span>
      </label>
      <label class="tm-filter-check active" data-filter="Intrusions">
        <span class="tm-check-dot" style="background:#ff6b00"></span>
        Intrusions
        <span class="tm-filter-count" id="fc-int">0</span>
      </label>
      <label class="tm-filter-check active" data-filter="Scanners">
        <span class="tm-check-dot" style="background:#00d4ff"></span>
        Scanners
        <span class="tm-filter-count" id="fc-scan">0</span>
      </label>
      <label class="tm-filter-check active" data-filter="Anonymizers">
        <span class="tm-check-dot" style="background:#ffd700"></span>
        Anonymizers
        <span class="tm-filter-count" id="fc-anon">0</span>
      </label>
    </div>

    <div class="tm-legend">
      <div class="tm-legend-title">SEVERITY SCALE</div>
      <div class="tm-legend-item"><span class="tm-leg-dot" style="background:#ff1f1f;box-shadow:0 0 8px #ff1f1f"></span> Critical (9–10)</div>
      <div class="tm-legend-item"><span class="tm-leg-dot" style="background:#ff6b00;box-shadow:0 0 8px #ff6b00"></span> High (7–8)</div>
      <div class="tm-legend-item"><span class="tm-leg-dot" style="background:#b700ff;box-shadow:0 0 8px #b700ff"></span> Medium (4–6)</div>
      <div class="tm-legend-item"><span class="tm-leg-dot" style="background:#00d4ff;box-shadow:0 0 8px #00d4ff"></span> Low (1–3)</div>
    </div>

    <div class="tm-counter-box">
      <div class="tm-counter-label">TOTAL ATTACKS</div>
      <div class="tm-counter-val" id="tm-total-attacks">0</div>
    </div>
  </div>

  <!-- RIGHT STATS PANEL -->
  <div class="tm-panel tm-panel-right" id="tm-right-panel">

    <div class="tm-rps-box">
      <div class="tm-rps-label">REQUESTS / SEC</div>
      <div class="tm-rps-val" id="tm-rps">0</div>
      <canvas id="tm-rps-spark" width="220" height="30"></canvas>
    </div>

    <div class="tm-section">
      <div class="tm-section-hdr">TOP ATTACKERS</div>
      <ul id="tm-attackers" class="tm-stat-list"></ul>
    </div>

    <div class="tm-section">
      <div class="tm-section-hdr">TARGETED CITIES — INDIA</div>
      <ul id="tm-cities" class="tm-stat-list"></ul>
    </div>

    <div class="tm-section">
      <div class="tm-section-hdr">ATTACK VECTORS</div>
      <div id="tm-vectors" class="tm-vector-grid"></div>
    </div>

    <div class="tm-section">
      <div class="tm-section-hdr">APPLICATION ATTACKS</div>
      <div id="tm-app-attacks" class="tm-app-attacks"></div>
    </div>
  </div>


  <!-- CRITICAL ALERT TOAST -->
  <div id="tm-alert-toast" class="tm-alert-toast"></div>
</div>
`;

// ─────────────────────────────────────────────────────────────
//  ENTRY POINT
// ─────────────────────────────────────────────────────────────
async function renderThreatMap() {
  tmCleanup();

  // 1. Inject CSS
  tmInjectCSS();

  // 2. Force fullscreen on main-content using direct inline styles
  const mainContent = document.querySelector('.main-content');
  if (mainContent) {
    tmState._mainContent       = mainContent;
    tmState._savedPadding      = mainContent.style.padding;
    tmState._savedOverflow     = mainContent.style.overflowY;
    tmState._savedBackground   = mainContent.style.background;
    mainContent.style.padding    = '0';
    mainContent.style.overflowY  = 'hidden';
    mainContent.style.background = 'transparent';
  }

  // 3. Fix page-container to fill full area
  const pageContainer = document.getElementById('page-container');
  tmState._savedPageStyle      = pageContainer.style.cssText;
  pageContainer.style.cssText  =
    'position:relative;width:100%;height:100%;max-width:none;margin:0;padding:0;overflow:hidden;';

  // 4. Inject HTML
  pageContainer.innerHTML = TM_HTML;

  // 5. Load Leaflet
  await tmLoadLibraries();

  // 6. Init Leaflet map
  tmInitLeaflet();

  // 7. Init canvas overlay
  tmInitCanvas();

  // 8. Wire controls
  tmWireControls();

  // 9. Start animation loop
  tmAnimLoop(0);

  // 10. Start polling
  tmStartPolling();

  // 11. Start RPS
  tmStartRPS();

  // 12. Re-sync canvas after layout settles
  setTimeout(tmSyncCanvasSize, 150);
}

// ─────────────────────────────────────────────────────────────
//  CLEANUP
// ─────────────────────────────────────────────────────────────
function tmCleanup() {
  if (tmState.interval)    clearInterval(tmState.interval);
  if (tmState.rpsInterval) clearInterval(tmState.rpsInterval);
  if (tmState.animFrame)   cancelAnimationFrame(tmState.animFrame);

  if (tmState.leafletMap) {
    try { tmState.leafletMap.remove(); } catch (e) {}
    tmState.leafletMap = null;
  }

  tmState.arcs    = [];
  tmState.ripples = [];

  // Restore main-content inline styles
  const mc = tmState._mainContent;
  if (mc) {
    if (tmState._savedPadding    !== undefined) mc.style.padding    = tmState._savedPadding;
    if (tmState._savedOverflow   !== undefined) mc.style.overflowY  = tmState._savedOverflow;
    if (tmState._savedBackground !== undefined) mc.style.background = tmState._savedBackground;
    mc.classList.remove('tm-active');
  }

  // Restore page-container
  const pc = document.getElementById('page-container');
  if (pc && tmState._savedPageStyle !== undefined) pc.style.cssText = tmState._savedPageStyle;

  if (window.__tmResizeHandler) {
    window.removeEventListener('resize', window.__tmResizeHandler);
    window.__tmResizeHandler = null;
  }
  const css = document.getElementById('tm-injected-css');
  if (css) css.remove();
}

// ─────────────────────────────────────────────────────────────
//  LIBRARY LOADING
// ─────────────────────────────────────────────────────────────
function tmLoadCSS(href) {
  if (document.querySelector(`link[href="${href}"]`)) return;
  const l = document.createElement('link');
  l.rel = 'stylesheet'; l.href = href;
  document.head.appendChild(l);
}

function tmLoadScript(src) {
  return new Promise((res, rej) => {
    if (document.querySelector(`script[src="${src}"]`)) return res();
    const s = document.createElement('script');
    s.src = src; s.onload = res; s.onerror = rej;
    document.head.appendChild(s);
  });
}

async function tmLoadLibraries() {
  tmLoadCSS('https://unpkg.com/leaflet@1.9.4/dist/leaflet.css');
  await tmLoadScript('https://unpkg.com/leaflet@1.9.4/dist/leaflet.js');
}

// ─────────────────────────────────────────────────────────────
//  LEAFLET MAP INITIALISATION
// ─────────────────────────────────────────────────────────────
function tmInitLeaflet() {
  const map = L.map('tm-leaflet-map', {
    center: [22.5, 82.0],
    zoom: 5,
    zoomControl: true,
    attributionControl: false,
    preferCanvas: true,
  });

  // Dark blank background tile (CartoDB Dark Matter - no labels)
  L.tileLayer(
    'https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png',
    { subdomains: 'abcd', maxZoom: 19 }
  ).addTo(map);

  tmState.leafletMap = map;

  // Load India GeoJSON
  fetch('/src/india_states.geojson')
    .then(r => r.json())
    .then(data => {
      L.geoJSON(data, {
        style: tmStateStyle,
        onEachFeature: tmOnEachState,
      }).addTo(map);
    })
    .catch(err => console.warn('GeoJSON load failed:', err));

  // Resync canvas every time map moves/zooms
  map.on('move zoom moveend zoomend', tmSyncCanvasSize);

  // Sync canvas on initial render
  map.whenReady(() => tmSyncCanvasSize());
}

// Leaflet feature styling — cyber neon theme
function tmStateStyle(feature) {
  return {
    fillColor:   '#07183a',
    fillOpacity: 0.75,
    color:       '#00f7ff',
    weight:      1.2,
    opacity:     0.85,
  };
}

function tmOnEachState(feature, layer) {
  const name = feature.properties.NAME_1 || 'Unknown';

  layer.on('mouseover', function (e) {
    this.setStyle({ fillColor: '#0d2a5c', fillOpacity: 0.95, weight: 2.2, color: '#00ffd5' });

    const tip = document.getElementById('tm-state-tip');
    if (tip) {
      tip.textContent = name;
      tip.style.opacity = '1';
    }

    // Move tooltip on mouse move
    const container = document.getElementById('tm-root');
    if (container) {
      const onMove = (ev) => {
        const bounds = container.getBoundingClientRect();
        const tip2 = document.getElementById('tm-state-tip');
        if (tip2) {
          tip2.style.left = (ev.clientX - bounds.left + 14) + 'px';
          tip2.style.top  = (ev.clientY - bounds.top  - 10) + 'px';
        }
      };
      container.addEventListener('mousemove', onMove);
      layer._moveHandler = onMove;
    }
  });

  layer.on('mouseout', function () {
    this.setStyle(tmStateStyle());
    const tip = document.getElementById('tm-state-tip');
    if (tip) tip.style.opacity = '0';
    const container = document.getElementById('tm-root');
    if (container && layer._moveHandler) {
      container.removeEventListener('mousemove', layer._moveHandler);
      layer._moveHandler = null;
    }
  });

  layer.on('click', function (e) {
    this.setStyle({ fillColor: '#152060', fillOpacity: 1, weight: 2.5, color: '#fff' });
    L.popup({ className: 'tm-leaflet-popup', closeButton: false, autoClose: true })
      .setLatLng(e.latlng)
      .setContent(`<div class="tm-popup-inner">📍 ${name}</div>`)
      .openOn(tmState.leafletMap);
    setTimeout(() => this.setStyle(tmStateStyle()), 800);
  });
}

// ─────────────────────────────────────────────────────────────
//  CANVAS OVERLAY
// ─────────────────────────────────────────────────────────────
function tmInitCanvas() {
  tmState.canvas = document.getElementById('tm-canvas');
  tmState.ctx    = tmState.canvas.getContext('2d');
  tmSyncCanvasSize();

  window.__tmResizeHandler = tmSyncCanvasSize;
  window.addEventListener('resize', window.__tmResizeHandler);
}

function tmSyncCanvasSize() {
  const mc = document.querySelector('.main-content');
  if (!mc || !tmState.canvas) return;
  const rect = mc.getBoundingClientRect();
  const W = rect.width  > 50 ? rect.width  : window.innerWidth  - 260;
  const H = rect.height > 50 ? rect.height : window.innerHeight - 60;
  tmState.width  = Math.max(W, 300);
  tmState.height = Math.max(H, 300);
  tmState.canvas.width  = tmState.width;
  tmState.canvas.height = tmState.height;
}

// Convert geo-coordinate → canvas pixel via Leaflet projection
function tmGeoToCanvas(lat, lon) {
  if (!tmState.leafletMap) return { x: 0, y: 0 };
  const pt = tmState.leafletMap.latLngToContainerPoint(L.latLng(lat, lon));
  return { x: pt.x, y: pt.y };
}

// ─────────────────────────────────────────────────────────────
//  ANIMATION LOOP
// ─────────────────────────────────────────────────────────────
function tmAnimLoop(timestamp) {
  if (!tmState.canvas || !tmState.ctx) return;

  const ctx = tmState.ctx;
  ctx.clearRect(0, 0, tmState.width, tmState.height);

  // Draw heat zones
  tmDrawHeatZones(ctx);

  // Draw city pulse markers
  tmDrawCityPulse(ctx);

  // Draw & advance arcs
  tmState.arcs = tmState.arcs.filter(arc => {
    arc.progress = Math.min(arc.progress + arc.speed, 1);
    if (arc.progress >= 1) {
      tmTriggerRipple(arc.destPt, arc.color, arc.severity);
      return false;
    }
    tmDrawArc(ctx, arc);
    return true;
  });

  // Draw ripples
  tmState.ripples = tmState.ripples.filter(r => {
    r.age++;
    r.radius += r.speed;
    r.opacity = 1 - r.age / r.maxAge;
    if (r.opacity <= 0) return false;
    tmDrawRipple(ctx, r);
    return true;
  });

  tmState.animFrame = requestAnimationFrame(tmAnimLoop);
}

// ─────────────────────────────────────────────────────────────
//  DRAWING PRIMITIVES
// ─────────────────────────────────────────────────────────────
function tmDrawArc(ctx, arc) {
  // Recalculate current endpoint position (map may have panned)
  const srcPt  = tmGeoToCanvas(arc.srcLat, arc.srcLon);
  const dstPt  = tmGeoToCanvas(arc.dstLat, arc.dstLon);
  const cpPt   = tmArcControlPoint(srcPt, dstPt);

  const t = arc.progress;

  // Partial bezier: draw from t=0 to t=progress
  const STEPS = 80;
  const steps = Math.max(2, Math.floor(t * STEPS));
  const pts = [];
  for (let i = 0; i <= steps; i++) {
    const u = (i / STEPS);
    pts.push(tmBezierPoint(srcPt, cpPt, dstPt, u));
  }

  if (pts.length < 2) return;

  // Glow shadow pass
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
  ctx.strokeStyle = arc.color;
  ctx.lineWidth   = 3;
  ctx.shadowColor = arc.color;
  ctx.shadowBlur  = 18;
  ctx.globalAlpha = 0.35;
  ctx.stroke();

  // Core bright line
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
  ctx.strokeStyle = arc.color;
  ctx.lineWidth   = 1.5;
  ctx.shadowBlur  = 6;
  ctx.globalAlpha = 0.9;
  ctx.stroke();

  ctx.globalAlpha = 1;
  ctx.shadowBlur  = 0;

  // Leading particle (head dot)
  const head = pts[pts.length - 1];
  ctx.beginPath();
  ctx.arc(head.x, head.y, 4, 0, Math.PI * 2);
  ctx.fillStyle   = '#ffffff';
  ctx.shadowColor = arc.color;
  ctx.shadowBlur  = 16;
  ctx.fill();
  ctx.shadowBlur = 0;

  // Trailing mini-particles
  [8, 18, 30].forEach((offset, i) => {
    const idx = Math.max(0, pts.length - 1 - offset);
    const tp  = pts[idx];
    ctx.beginPath();
    ctx.arc(tp.x, tp.y, 2.5 - i * 0.6, 0, Math.PI * 2);
    ctx.fillStyle   = arc.color;
    ctx.globalAlpha = 0.6 - i * 0.18;
    ctx.fill();
  });
  ctx.globalAlpha = 1;
}

function tmDrawRipple(ctx, r) {
  ctx.beginPath();
  ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
  ctx.strokeStyle = r.color;
  ctx.lineWidth   = 2;
  ctx.globalAlpha = r.opacity * 0.7;
  ctx.shadowColor = r.color;
  ctx.shadowBlur  = 14;
  ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.shadowBlur  = 0;

  ctx.beginPath();
  ctx.arc(r.x, r.y, Math.max(1, r.radius * 0.12), 0, Math.PI * 2);
  ctx.fillStyle   = r.color;
  ctx.globalAlpha = r.opacity;
  ctx.fill();
  ctx.globalAlpha = 1;
}

function tmDrawCityPulse(ctx) {
  const now = Date.now();
  TM.INDIA_CITIES.forEach(city => {
    const pt     = tmGeoToCanvas(city.lat, city.lon);
    const weight = city.weight || 0;
    const pulse  = Math.sin(now / 600 + city.lat) * 0.5 + 0.5;
    const baseR  = 3 + Math.min(weight * 0.12, 6);

    // Outer pulsing ring
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, baseR + 5 + pulse * 7, 0, Math.PI * 2);
    ctx.strokeStyle = '#00ffd5';
    ctx.lineWidth   = 1;
    ctx.globalAlpha = 0.18 * pulse;
    ctx.shadowColor = '#00ffd5';
    ctx.shadowBlur  = 10;
    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.shadowBlur  = 0;

    // Core dot
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, baseR, 0, Math.PI * 2);
    ctx.fillStyle   = '#00ffd5';
    ctx.shadowColor = '#00ffd5';
    ctx.shadowBlur  = 14;
    ctx.fill();
    ctx.shadowBlur  = 0;

    // City label
    ctx.fillStyle   = 'rgba(0,255,213,0.85)';
    ctx.font        = '11px "Share Tech Mono", monospace';
    ctx.shadowColor = '#00ffd5';
    ctx.shadowBlur  = 6;
    ctx.fillText(city.name, pt.x + 8, pt.y + 4);
    ctx.shadowBlur  = 0;
  });
}

function tmDrawHeatZones(ctx) {
  TM.INDIA_CITIES.forEach(city => {
    if (!city.weight || city.weight < 3) return;
    const pt        = tmGeoToCanvas(city.lat, city.lon);
    const intensity = Math.min(city.weight / 35, 1);
    const radius    = 25 + intensity * 55;

    const grad = ctx.createRadialGradient(pt.x, pt.y, 0, pt.x, pt.y, radius);
    grad.addColorStop(0,   `rgba(255,31,31,${0.28 * intensity})`);
    grad.addColorStop(0.5, `rgba(183,0,255,${0.12 * intensity})`);
    grad.addColorStop(1,   'rgba(0,0,0,0)');

    ctx.beginPath();
    ctx.arc(pt.x, pt.y, radius, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();
  });
}

// ─────────────────────────────────────────────────────────────
//  BEZIER ARC HELPERS
// ─────────────────────────────────────────────────────────────
function tmArcControlPoint(src, dst) {
  const dx   = dst.x - src.x;
  const dy   = dst.y - src.y;
  const len  = Math.sqrt(dx * dx + dy * dy);
  const lift = Math.min(len * 0.42, 220);
  return {
    x: (src.x + dst.x) / 2 - (dy / len) * lift,
    y: (src.y + dst.y) / 2 + (dx / len) * lift,
  };
}

function tmBezierPoint(p0, p1, p2, t) {
  const mt = 1 - t;
  return {
    x: mt * mt * p0.x + 2 * mt * t * p1.x + t * t * p2.x,
    y: mt * mt * p0.y + 2 * mt * t * p1.y + t * t * p2.y,
  };
}

function tmTriggerRipple(pt, color, severity) {
  const rings = severity >= 7 ? 3 : 2;
  for (let i = 0; i < rings; i++) {
    setTimeout(() => {
      tmState.ripples.push({
        x: pt.x, y: pt.y, color,
        radius: 2, speed: 1.4 + i * 0.4,
        opacity: 1, age: 0, maxAge: 55,
      });
    }, i * 220);
  }
}

// ─────────────────────────────────────────────────────────────
//  DATA POLLING
// ─────────────────────────────────────────────────────────────
async function tmStartPolling() {
  await tmFetch();
  tmState.interval = setInterval(tmFetch, 3000);
}

async function tmFetch() {
  try {
    const res     = await fetch('/api/threat-map/live');
    const attacks = await res.json();
    attacks.forEach(tmProcessAttack);
    tmUpdatePanels();
  } catch {
    tmSimulateLocally();
  }
}

function tmSimulateLocally() {
  const n = Math.floor(Math.random() * 3) + 1;
  for (let i = 0; i < n; i++) {
    const src = TM.ATTACKER_REGIONS[Math.floor(Math.random() * TM.ATTACKER_REGIONS.length)];
    const dst = TM.INDIA_CITIES[Math.floor(Math.random() * TM.INDIA_CITIES.length)];
    tmProcessAttack({
      id: 'T' + Math.floor(Math.random() * 9000 + 1000),
      source_country: src.country,
      source_coords:  [src.lon + (Math.random() - 0.5) * 4, src.lat + (Math.random() - 0.5) * 4],
      target_city:    dst.name,
      target_coords:  [dst.lon, dst.lat],
      severity:       Math.floor(Math.random() * 7) + 4,
      vector:         TM.VECTORS[Math.floor(Math.random() * TM.VECTORS.length)],
      timestamp:      new Date().toISOString(),
    });
  }
  tmUpdatePanels();
}

function tmProcessAttack(attack) {
  const vecType = tmClassifyVector(attack.vector);
  if (!tmState.filters[vecType]) return;

  const [srcLon, srcLat] = attack.source_coords;
  const [dstLon, dstLat] = attack.target_coords;
  const dstPt = tmGeoToCanvas(dstLat, dstLon);

  let color;
  const s = attack.severity;
  if (s >= 9)      color = TM.COLORS.critical;
  else if (s >= 7) color = TM.COLORS.high;
  else if (s >= 4) color = TM.COLORS.medium;
  else             color = TM.COLORS.low;

  tmState.arcs.push({
    srcLat, srcLon, dstLat, dstLon,
    destPt: { x: dstPt.x, y: dstPt.y },
    color, severity: attack.severity,
    progress: 0,
    speed: 0.005 + Math.random() * 0.006,
  });

  tmState.attackerStats[attack.source_country] = (tmState.attackerStats[attack.source_country] || 0) + 1;
  tmState.cityStats[attack.target_city]         = (tmState.cityStats[attack.target_city] || 0) + 1;
  tmState.vectorStats[attack.vector]            = (tmState.vectorStats[attack.vector] || 0) + 1;
  tmState.totalAttacks++;

  const city = TM.INDIA_CITIES.find(c => c.name === attack.target_city);
  if (city) city.weight = (city.weight || 0) + s * 0.4;

  if (attack.vector === 'XSS')              tmState.appAttackStats['XSS']++;
  if (attack.vector === 'SQL Injection')    tmState.appAttackStats['SQL Injection']++;
  if (['Access Violations','Brute Force'].includes(attack.vector))
    tmState.appAttackStats['Access Violations']++;

  if (s >= 9) { tmPlayAlert(); tmShowToast(attack); }
}

function tmClassifyVector(v) {
  if (['UDP Flood','TCP SYN','DNS Flood','ICMP Flood','HTTP Flood'].includes(v)) return 'DDoS';
  if (['XSS','SQL Injection','Access Violations'].includes(v))  return 'Web Attacks';
  if (v === 'Port Scan')   return 'Scanners';
  if (v === 'Brute Force') return 'Intrusions';
  return 'Anonymizers';
}

// ─────────────────────────────────────────────────────────────
//  PANEL RENDER
// ─────────────────────────────────────────────────────────────
function tmUpdatePanels() {
  const totEl = document.getElementById('tm-total-attacks');
  if (totEl) totEl.textContent = tmState.totalAttacks.toLocaleString();

  const atkEl = document.getElementById('tm-attackers');
  if (atkEl) {
    const sorted = Object.entries(tmState.attackerStats).sort((a,b)=>b[1]-a[1]).slice(0,6);
    const max    = sorted[0]?.[1] || 1;
    atkEl.innerHTML = sorted.map(([c,v]) => `
      <li class="tm-stat-item">
        <div class="tm-stat-row"><span class="tm-stat-name">${c}</span><span class="tm-stat-count">${v}</span></div>
        <div class="tm-bar-track"><div class="tm-bar-fill" style="width:${(v/max*100).toFixed(1)}%;background:#ff1f1f"></div></div>
      </li>`).join('');
  }

  const cityEl = document.getElementById('tm-cities');
  if (cityEl) {
    const sorted = Object.entries(tmState.cityStats).sort((a,b)=>b[1]-a[1]).slice(0,6);
    const max    = sorted[0]?.[1] || 1;
    cityEl.innerHTML = sorted.map(([c,v]) => `
      <li class="tm-stat-item">
        <div class="tm-stat-row"><span class="tm-stat-name">🇮🇳 ${c}</span><span class="tm-stat-count">${v}</span></div>
        <div class="tm-bar-track"><div class="tm-bar-fill" style="width:${(v/max*100).toFixed(1)}%;background:#00ffd5"></div></div>
      </li>`).join('');
  }

  const vecEl = document.getElementById('tm-vectors');
  if (vecEl) {
    const sorted = Object.entries(tmState.vectorStats).sort((a,b)=>b[1]-a[1]).slice(0,8);
    vecEl.innerHTML = sorted.map(([v,c]) => `
      <div class="tm-vector-chip">
        <span class="tm-vector-name">${v}</span>
        <span class="tm-vector-cnt">${c}</span>
      </div>`).join('');
  }

  const appEl = document.getElementById('tm-app-attacks');
  if (appEl) {
    const data = tmState.appAttackStats;
    const max  = Math.max(...Object.values(data), 1);
    appEl.innerHTML = Object.entries(data).map(([name,count]) => {
      const dot = name==='SQL Injection'?'#ff1f1f': name==='XSS'?'#b700ff':'#00d4ff';
      return `
        <div class="tm-app-row">
          <span class="tm-app-icon" style="background:${dot}"></span>
          <span class="tm-app-label">${name}</span>
          <div class="tm-bar-track" style="flex:1;margin:0 8px">
            <div class="tm-bar-fill" style="width:${(count/max*100).toFixed(1)}%;background:${dot}"></div>
          </div>
          <span class="tm-stat-count">${count}</span>
        </div>`;
    }).join('');
  }

  // Filter counts
  const typeCounts = {};
  Object.entries(tmState.vectorStats).forEach(([v,c]) => {
    const t = tmClassifyVector(v);
    typeCounts[t] = (typeCounts[t]||0) + c;
  });
  const fmap = { 'DDoS':'fc-ddos','Web Attacks':'fc-web','Intrusions':'fc-int','Scanners':'fc-scan','Anonymizers':'fc-anon' };
  Object.entries(fmap).forEach(([type,id]) => {
    const el = document.getElementById(id);
    if (el) el.textContent = typeCounts[type] || 0;
  });
}


// ─────────────────────────────────────────────────────────────
//  RPS + SPARKLINE
// ─────────────────────────────────────────────────────────────
let tmRpsHistory = [];
function tmStartRPS() {
  const update = () => {
    tmState.rps += Math.floor(Math.random() * 1800) - 900;
    if (tmState.rps < 50000)  tmState.rps = 50000;
    if (tmState.rps > 240000) tmState.rps = 240000;
    const el = document.getElementById('tm-rps');
    if (el) el.textContent = tmState.rps.toLocaleString();
    tmRpsHistory.push(tmState.rps);
    if (tmRpsHistory.length > 30) tmRpsHistory.shift();
    tmDrawSparkline();
  };
  update();
  tmState.rpsInterval = setInterval(update, 1200);
}

function tmDrawSparkline() {
  const c = document.getElementById('tm-rps-spark');
  if (!c) return;
  const ctx = c.getContext('2d');
  const W = c.width, H = c.height;
  ctx.clearRect(0,0,W,H);
  if (tmRpsHistory.length < 2) return;
  const min = Math.min(...tmRpsHistory), max = Math.max(...tmRpsHistory);
  const range = max - min || 1;
  ctx.beginPath();
  tmRpsHistory.forEach((v,i) => {
    const x = (i / (tmRpsHistory.length-1)) * W;
    const y = H - ((v-min)/range)*(H-4) - 2;
    i === 0 ? ctx.moveTo(x,y) : ctx.lineTo(x,y);
  });
  const g = ctx.createLinearGradient(0,0,W,0);
  g.addColorStop(0,'rgba(0,212,255,0.3)'); g.addColorStop(1,'#00d4ff');
  ctx.strokeStyle = g; ctx.lineWidth = 1.5;
  ctx.shadowColor = '#00d4ff'; ctx.shadowBlur = 6; ctx.stroke(); ctx.shadowBlur = 0;
}

// ─────────────────────────────────────────────────────────────
//  SOUND + TOAST
// ─────────────────────────────────────────────────────────────
function tmPlayAlert() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(0.07, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
    osc.start(); osc.stop(ctx.currentTime + 0.3);
  } catch {}
}

function tmShowToast(attack) {
  const el = document.getElementById('tm-alert-toast');
  if (!el) return;
  el.innerHTML = `
    <div class="tm-toast-inner">
      <div class="tm-toast-icon">⚠</div>
      <div>
        <div class="tm-toast-title">CRITICAL THREAT DETECTED</div>
        <div class="tm-toast-body">${attack.source_country} → ${attack.target_city} | ${attack.vector}</div>
      </div>
    </div>`;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 4000);
}

// ─────────────────────────────────────────────────────────────
//  CONTROLS
// ─────────────────────────────────────────────────────────────
function tmWireControls() {
  document.querySelectorAll('.tm-filter-check').forEach(label => {
    label.addEventListener('click', () => {
      const f = label.dataset.filter;
      tmState.filters[f] = !tmState.filters[f];
      label.classList.toggle('active',   tmState.filters[f]);
      label.classList.toggle('inactive', !tmState.filters[f]);
    });
  });

  const sel = document.getElementById('tm-interval');
  if (sel) sel.addEventListener('change', e => {
    tmState.activeInterval = e.target.value;
    tmState.attackerStats  = {};
    tmState.cityStats      = {};
    tmState.vectorStats    = {};
    tmState.totalAttacks   = 0;
    TM.INDIA_CITIES.forEach(c => c.weight = 0);
  });
}

// ─────────────────────────────────────────────────────────────
//  CSS
// ─────────────────────────────────────────────────────────────
function tmInjectCSS() {
  const existing = document.getElementById('tm-injected-css');
  if (existing) existing.remove();

  const style = document.createElement('style');
  style.id = 'tm-injected-css';
  style.textContent = `
/* ── FULLSCREEN MAIN OVERRIDE ───────────────────────── */
.main-content.tm-active {
  padding: 0 !important;
  overflow: hidden !important;
}
.main-content.tm-active .page-container {
  max-width: 100% !important; margin: 0 !important; padding: 0 !important;
  width: 100% !important; height: 100% !important;
  position: relative !important; overflow: hidden !important;
}

/* ── ROOT ───────────────────────────────────────────── */
#tm-root {
  position: absolute; inset: 0;
  background: #020b18;
  overflow: hidden;
  font-family: 'Share Tech Mono', 'Courier New', monospace;
  color: #c8e4ff;
}

/* ── LEAFLET MAP ────────────────────────────────────── */
#tm-leaflet-map {
  position: absolute; inset: 0;
  background: #020b18;
  z-index: 1;
}

/* Override leaflet default popup/attribution */
.leaflet-control-attribution { display: none !important; }
.leaflet-control-zoom {
  border: 1px solid rgba(0,247,255,0.25) !important;
  background: rgba(2,11,24,0.85) !important;
  top: 52px !important;
}
.leaflet-control-zoom a {
  color: #00f7ff !important;
  background: rgba(2,11,24,0.85) !important;
  border-color: rgba(0,247,255,0.2) !important;
}
.leaflet-control-zoom a:hover { background: rgba(0,247,255,0.1) !important; }

/* Popup */
.tm-leaflet-popup .leaflet-popup-content-wrapper {
  background: rgba(2,11,24,0.9);
  border: 1px solid rgba(0,247,255,0.35);
  border-radius: 4px;
  backdrop-filter: blur(10px);
  box-shadow: 0 0 20px rgba(0,247,255,0.2);
  padding: 0;
}
.tm-leaflet-popup .leaflet-popup-tip { background: rgba(0,247,255,0.3); }
.tm-popup-inner { padding: 7px 14px; font-size: 13px; color: #00ffd5; letter-spacing: 0.5px; }

/* ── CANVAS OVERLAY ─────────────────────────────────── */
#tm-canvas {
  position: absolute; inset: 0;
  pointer-events: none;
  z-index: 5;
}

/* ── SCANLINES ──────────────────────────────────────── */
.tm-scanlines {
  position: absolute; inset: 0;
  background: repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,0.025) 2px,rgba(0,0,0,0.025) 4px);
  pointer-events: none;
  z-index: 6;
}

/* ── STATE TOOLTIP ──────────────────────────────────── */
#tm-state-tip {
  position: absolute;
  background: rgba(2,11,24,0.9);
  border: 1px solid #00f7ff;
  border-radius: 3px;
  padding: 4px 10px;
  font-size: 12px;
  color: #00ffd5;
  letter-spacing: 0.5px;
  pointer-events: none;
  z-index: 40;
  opacity: 0;
  transition: opacity 0.15s;
  white-space: nowrap;
  box-shadow: 0 0 10px rgba(0,247,255,0.3);
}

/* ── TOP STRIP ──────────────────────────────────────── */
.tm-top-strip {
  position: absolute; top: 0; left: 0; right: 0; height: 40px;
  background: rgba(2,11,24,0.88);
  border-bottom: 1px solid rgba(0,212,255,0.2);
  display: flex; align-items: center; justify-content: space-between;
  padding: 0 16px; z-index: 20; backdrop-filter: blur(8px);
}
.tm-top-left  { display: flex; align-items: center; gap: 8px; }
.tm-live-dot  { width:8px;height:8px;border-radius:50%;background:#ff1f1f;box-shadow:0 0 8px #ff1f1f;animation:tmPulse 1s ease-in-out infinite; }
.tm-live-label { font-size:11px;letter-spacing:2px;color:#ff1f1f;font-weight:700; }
.tm-system-name { font-size:11px;color:rgba(0,212,255,0.7);letter-spacing:0.5px; }
.tm-interval-select {
  background:rgba(0,0,0,0.6);border:1px solid rgba(0,212,255,0.3);
  color:#00d4ff;padding:4px 10px;border-radius:4px;font-size:11px;
  font-family:inherit;outline:none;cursor:pointer;
}

/* ── PANELS ─────────────────────────────────────────── */
.tm-panel {
  position: absolute; top: 48px; bottom: 0; width: 242px;
  background: rgba(2,11,24,0.82);
  border: 1px solid rgba(0,212,255,0.15); border-radius: 6px;
  backdrop-filter: blur(14px); z-index: 20;
  overflow-y: auto; overflow-x: hidden;
  scrollbar-width: thin; scrollbar-color: rgba(0,212,255,0.2) transparent;
}
.tm-panel::-webkit-scrollbar { width: 3px; }
.tm-panel::-webkit-scrollbar-track { background: transparent; }
.tm-panel::-webkit-scrollbar-thumb { background: rgba(0,212,255,0.25); border-radius: 2px; }
.tm-panel-left  { left: 12px; }
.tm-panel-right { right: 12px; width: 260px; }

.tm-panel-header {
  display:flex;align-items:center;gap:8px;padding:12px 14px 8px;
  font-size:10px;letter-spacing:2px;color:#00d4ff;
  border-bottom:1px solid rgba(0,212,255,0.1);margin-bottom:6px;
}
.tm-filter-group { padding: 6px 14px; }
.tm-filter-check {
  display:flex;align-items:center;gap:10px;padding:9px 10px;border-radius:5px;
  cursor:pointer;font-size:12px;color:#8ab0cc;transition:all 0.2s;
  margin-bottom:3px;border:1px solid transparent;user-select:none;
}
.tm-filter-check.active  { color:#c8e4ff;background:rgba(0,212,255,0.05);border-color:rgba(0,212,255,0.12); }
.tm-filter-check.inactive { opacity:.4; }
.tm-filter-check:hover    { background:rgba(0,212,255,0.08); }
.tm-check-dot    { width:8px;height:8px;border-radius:50%;flex-shrink:0;box-shadow:0 0 6px currentColor; }
.tm-filter-count {
  margin-left:auto;background:rgba(0,212,255,0.1);padding:1px 6px;
  border-radius:10px;font-size:10px;color:#00d4ff;min-width:22px;text-align:center;
}
.tm-legend { padding:10px 14px;border-top:1px solid rgba(0,212,255,0.08);margin-top:4px; }
.tm-legend-title { font-size:9px;letter-spacing:2px;color:rgba(0,212,255,0.5);margin-bottom:8px; }
.tm-legend-item  { display:flex;align-items:center;gap:8px;font-size:11px;color:#8ab0cc;margin-bottom:6px; }
.tm-leg-dot { width:8px;height:8px;border-radius:50%;flex-shrink:0; }
.tm-counter-box {
  margin:10px 14px;padding:12px;
  background:rgba(255,31,31,0.07);border:1px solid rgba(255,31,31,0.2);
  border-radius:5px;text-align:center;
}
.tm-counter-label { font-size:9px;letter-spacing:2px;color:#ff6b6b;margin-bottom:4px; }
.tm-counter-val   { font-size:28px;font-weight:700;color:#ff1f1f;text-shadow:0 0 12px rgba(255,31,31,0.6); }

/* RIGHT PANEL */
.tm-rps-box { padding:12px 14px;border-bottom:1px solid rgba(0,212,255,0.1);text-align:center; }
.tm-rps-label { font-size:9px;letter-spacing:2px;color:rgba(0,212,255,0.5);margin-bottom:4px; }
.tm-rps-val   { font-size:26px;font-weight:700;color:#00d4ff;text-shadow:0 0 14px rgba(0,212,255,0.7);font-family:inherit;margin-bottom:6px; }
#tm-rps-spark { width:100%;height:30px;opacity:.9; }
.tm-section    { padding:10px 14px;border-bottom:1px solid rgba(0,212,255,0.06); }
.tm-section-hdr { font-size:9px;letter-spacing:2px;color:rgba(0,212,255,0.5);margin-bottom:8px; }
.tm-stat-list  { list-style:none;padding:0;margin:0; }
.tm-stat-item  { margin-bottom:10px; }
.tm-stat-row   { display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;font-size:11px; }
.tm-stat-name  { color:#c8e4ff; }
.tm-stat-count { color:rgba(0,212,255,0.7);font-size:10px; }
.tm-bar-track  { height:3px;background:rgba(255,255,255,0.06);border-radius:2px;overflow:hidden; }
.tm-bar-fill   { height:100%;border-radius:2px;transition:width .6s ease; }
.tm-vector-grid { display:flex;flex-wrap:wrap;gap:5px; }
.tm-vector-chip {
  display:flex;align-items:center;gap:4px;
  background:rgba(183,0,255,.1);border:1px solid rgba(183,0,255,.2);
  border-radius:3px;padding:3px 7px;font-size:10px;color:#cf7fff;transition:all .2s;
}
.tm-vector-chip:hover { background:rgba(183,0,255,.2);box-shadow:0 0 8px rgba(183,0,255,.3); }
.tm-vector-name { color:#d4a8ff; }
.tm-vector-cnt  { background:rgba(183,0,255,.25);border-radius:8px;padding:0 4px;font-size:9px;color:#b700ff; }
.tm-app-attacks { display:flex;flex-direction:column;gap:8px; }
.tm-app-row     { display:flex;align-items:center;gap:6px;font-size:11px;color:#c8e4ff; }
.tm-app-icon    { width:7px;height:7px;border-radius:50%;flex-shrink:0;box-shadow:0 0 6px currentColor; }
.tm-app-label   { min-width:90px;font-size:10px; }



/* ── TOAST ──────────────────────────────────────────── */
.tm-alert-toast {
  position:absolute;top:54px;left:50%;
  transform:translateX(-50%) translateY(-10px);
  z-index:999;background:rgba(255,31,31,0.12);
  border:1px solid rgba(255,31,31,0.5);border-radius:6px;
  max-width:380px;width:90%;backdrop-filter:blur(10px);
  transition:opacity .4s,transform .4s;opacity:0;pointer-events:none;
}
.tm-alert-toast.show { opacity:1;transform:translateX(-50%) translateY(0);pointer-events:auto; }
.tm-toast-inner { display:flex;align-items:center;gap:12px;padding:12px 16px; }
.tm-toast-icon  { font-size:20px;color:#ff4444;text-shadow:0 0 10px #ff4444; }
.tm-toast-title { font-size:11px;letter-spacing:1px;color:#ff6b6b;margin-bottom:2px; }
.tm-toast-body  { font-size:12px;color:#ffd4d4; }

/* ── ANIMATIONS ─────────────────────────────────────── */
@keyframes tmPulse { 0%,100%{opacity:1;transform:scale(1)}50%{opacity:.5;transform:scale(.8)} }
  `;
  document.head.appendChild(style);
}

// ─────────────────────────────────────────────────────────────
//  EXPORT
// ─────────────────────────────────────────────────────────────
window.renderThreatMap = renderThreatMap;
window.tmCleanup = tmCleanup;
