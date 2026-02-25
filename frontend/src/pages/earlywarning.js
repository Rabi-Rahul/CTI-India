/**
 * Early Warning Page - Live Alert Feed
 */
let ewWS = null;
let ewAlerts = [];

async function renderEarlyWarning() {
    const container = document.getElementById('page-container');

    ewAlerts = (await API.get('/dashboard/early-warning')) || MockData.earlyWarningAlerts(12);

    container.innerHTML = `
    <div class="page-header">
      <div>
        <h2 class="page-title">⚠️ Early Warning System</h2>
        <p class="page-subtitle">Live high-severity threat intelligence feed connected to CERT-In and NCIIPC</p>
      </div>
      <div class="page-actions">
        <div class="status-dot-group">
          <span class="status-dot green" id="ew-live-dot"></span>
          <span class="status-text" id="ew-live-label">LIVE</span>
        </div>
      </div>
    </div>

    <!-- RISK LEVELS -->
    <div class="stats-grid mb24" style="grid-template-columns: repeat(4, 1fr)">
      ${[
            { label: 'CRITICAL', count: ewAlerts.filter(a => a.severity === 'CRITICAL').length, color: 'var(--red)', icon: '🔴' },
            { label: 'HIGH', count: ewAlerts.filter(a => a.severity === 'HIGH').length, color: 'var(--orange)', icon: '🟠' },
            { label: 'MEDIUM', count: ewAlerts.filter(a => a.severity === 'MEDIUM').length, color: 'var(--blue)', icon: '🔵' },
            { label: 'LOW', count: ewAlerts.filter(a => a.severity === 'LOW').length, color: 'var(--green)', icon: '🟢' }
        ].map(r => `
        <div class="glass-card stat-card" style="--card-accent: ${r.color}">
          <span class="stat-card-icon">${r.icon}</span>
          <div class="stat-value" style="color:${r.color}">${r.count}</div>
          <div class="stat-label">${r.label} Severity</div>
        </div>
      `).join('')}
    </div>

    <div class="grid-2">
      <!-- LIVE ALERT PANEL -->
      <div class="glass-card">
        <div class="card-inner">
          <div class="card-header">
            <span class="section-title">Live Alert Stream</span>
            <span style="font-size:11px;color:var(--text-muted);font-family:var(--font-mono)">Auto-refresh: 5s</span>
          </div>
          <div class="alert-ticker-panel" id="ew-alerts-list">
            ${renderAlertItems(ewAlerts)}
          </div>
        </div>
      </div>

      <!-- THREAT CLASSIFICATION -->
      <div style="display:flex;flex-direction:column;gap:16px">
        <div class="glass-card">
          <div class="card-inner">
            <div class="card-header"><span class="section-title">Threat by Type</span></div>
            <div class="chart-container" style="height:200px"><canvas id="ewTypeChart"></canvas></div>
          </div>
        </div>
        <div class="glass-card">
          <div class="card-inner">
            <div class="card-header"><span class="section-title">Classification Guide</span></div>
            ${[
            { level: 'CRITICAL', desc: 'Immediate national security threat. Coordinated attack on multiple critical sectors.', color: 'var(--red)' },
            { level: 'HIGH', desc: 'Significant threat to sensitive systems. Active exploitation observed.', color: 'var(--orange)' },
            { level: 'MEDIUM', desc: 'Targeted but limited threat. Monitoring required.', color: 'var(--blue)' },
            { level: 'LOW', desc: 'Informational. Potential future threat indicator.', color: 'var(--green)' }
        ].map(c => `
              <div style="display:flex;gap:12px;align-items:flex-start;margin-bottom:12px;">
                <span class="badge badge-${c.level.toLowerCase()}" style="white-space:nowrap;min-width:72px;justify-content:center">${c.level}</span>
                <p style="font-size:12px;color:var(--text-secondary);line-height:1.5">${c.desc}</p>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    </div>
  `;

    // Charts
    const typeData = {};
    ewAlerts.forEach(a => typeData[a.threat_type] = (typeData[a.threat_type] || 0) + 1);
    const ctx = document.getElementById('ewTypeChart');
    if (ctx) {
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: Object.keys(typeData),
                datasets: [{ label: 'Alerts', data: Object.values(typeData), backgroundColor: '#3B82F6', borderRadius: 4 }]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: { ticks: { color: '#94A3B8', font: { size: 11 } }, grid: { color: 'rgba(255,255,255,0.04)' } },
                    y: { ticks: { color: '#94A3B8' }, grid: { color: 'rgba(255,255,255,0.04)' } }
                }
            }
        });
    }

    // WebSocket for live updates
    connectWS('/early-warning', (msg) => {
        if (msg.type === 'new_alert') {
            ewAlerts.unshift(msg.data);
            if (ewAlerts.length > 15) ewAlerts.pop();
            const list = document.getElementById('ew-alerts-list');
            if (list) list.innerHTML = renderAlertItems(ewAlerts);
        }
    });

    // Fallback mock ticker
    if (!wsConnections['/early-warning']) {
        setInterval(() => {
            const mockAlert = MockData.earlyWarningAlerts(1)[0];
            ewAlerts.unshift(mockAlert);
            if (ewAlerts.length > 15) ewAlerts.pop();
            const list = document.getElementById('ew-alerts-list');
            if (list) list.innerHTML = renderAlertItems(ewAlerts);
        }, 6000);
    }
}

function renderAlertItems(alerts) {
    return alerts.map(a => `
    <div class="alert-ticker-item">
      <div class="alert-severity-indicator" style="background:${severityColor(a.severity)}"></div>
      <div class="alert-body">
        <div class="alert-title">${a.title}</div>
        <div class="alert-meta">
          <span class="badge badge-${a.severity.toLowerCase()}">${a.severity}</span>
          <span>📍 ${a.state || 'National'}</span>
          <span>🏭 ${a.sector}</span>
          <span class="mono">${a.source_ip || ''}</span>
          <span style="color:var(--green);font-size:10px">✓ ${a.confidence || randInt(75, 99)}% confidence</span>
        </div>
      </div>
      <div class="alert-time">${relativeTime(a.minutes_ago || 1)}</div>
    </div>
  `).join('');
}
