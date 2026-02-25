/**
 * Overview Page - National Threat Statistics
 */
async function renderOverview() {
    const container = document.getElementById('page-container');
    container.innerHTML = `<div class="loading-state"><div class="loading-spinner"></div><p class="loading-text">Loading threat intelligence...</p></div>`;

    const data = (await API.get('/dashboard/overview')) || MockData.overview();

    const riskColor = data.national_risk_score >= 8 ? 'var(--red)' : data.national_risk_score >= 6 ? 'var(--orange)' : 'var(--green)';

    container.innerHTML = `
    <div class="page-header">
      <div>
        <h2 class="page-title">🔭 National Threat Overview</h2>
        <p class="page-subtitle">Real-time national cyber security status — Updated ${new Date().toLocaleTimeString('en-IN')}</p>
      </div>
      <div class="page-actions">
        <button class="btn-secondary btn-sm" onclick="renderOverview()">↻ Refresh</button>
        <button class="btn-primary btn-sm" onclick="navigateTo('report-threat')">⚠ Report Threat</button>
      </div>
    </div>

    <!-- STAT CARDS -->
    <div class="stats-grid">
      <div class="glass-card stat-card" style="--card-accent: var(--red)">
        <span class="stat-card-icon">🚨</span>
        <div class="stat-value">${data.active_incidents}</div>
        <div class="stat-label">Active Incidents</div>
        <div class="stat-trend up">▲ 12% from yesterday</div>
      </div>
      <div class="glass-card stat-card" style="--card-accent: var(--orange)">
        <span class="stat-card-icon">⚠️</span>
        <div class="stat-value">${data.critical_alerts}</div>
        <div class="stat-label">Critical Alerts</div>
        <div class="stat-trend up">▲ 3 new in last hour</div>
      </div>
      <div class="glass-card stat-card" style="--card-accent: var(--green)">
        <span class="stat-card-icon">🛡️</span>
        <div class="stat-value">${data.threats_blocked_today.toLocaleString()}</div>
        <div class="stat-label">Threats Blocked Today</div>
        <div class="stat-trend down">▼ Systems performing well</div>
      </div>
      <div class="glass-card stat-card" style="--card-accent: var(--cyan)">
        <span class="stat-card-icon">🔍</span>
        <div class="stat-value">${(data.ioc_count / 1000).toFixed(1)}K</div>
        <div class="stat-label">IOC Indicators</div>
        <div class="stat-trend up">▲ 234 added today</div>
      </div>
      <div class="glass-card stat-card" style="--card-accent: var(--blue)">
        <span class="stat-card-icon">🏭</span>
        <div class="stat-value">${data.sectors_affected}</div>
        <div class="stat-label">Sectors Affected</div>
        <div class="stat-trend">of 8 critical sectors</div>
      </div>
      <div class="glass-card stat-card" style="--card-accent: var(--red)">
        <span class="stat-card-icon">🔓</span>
        <div class="stat-value">${data.vulnerabilities_open}</div>
        <div class="stat-label">Open Vulnerabilities</div>
        <div class="stat-trend up">▲ 18 unpatched CRITICAL</div>
      </div>
    </div>

    <!-- RISK METER + SECTOR IMPACT -->
    <div class="grid-2 mb24">
      <div class="glass-card">
        <div class="card-inner">
          <div class="card-header"><span class="section-title">National Risk Meter</span></div>
          <div class="risk-meter-container">
            <div style="display:flex; align-items:center; justify-content: center; margin-bottom: 16px;">
              <div style="position:relative; width:200px; height:120px;">
                <svg viewBox="0 0 200 120" width="200" height="120">
                  <!-- Track -->
                  <path d="M 20 100 A 80 80 0 0 1 180 100" stroke="rgba(255,255,255,0.08)" fill="none" stroke-width="16" stroke-linecap="round"/>
                  <!-- Zone: Low (green) -->
                  <path d="M 20 100 A 80 80 0 0 1 72 34" stroke="#22C55E" fill="none" stroke-width="16" stroke-linecap="round"/>
                  <!-- Zone: Medium (orange) -->
                  <path d="M 72 34 A 80 80 0 0 1 128 34" stroke="#F59E0B" fill="none" stroke-width="16" stroke-linecap="round"/>
                  <!-- Zone: High (red) -->
                  <path d="M 128 34 A 80 80 0 0 1 180 100" stroke="#EF4444" fill="none" stroke-width="16" stroke-linecap="round"/>
                  <!-- Needle -->
                  <line id="risk-needle" x1="100" y1="100" x2="100" y2="30" stroke="white" stroke-width="3" stroke-linecap="round"
                    style="transform-origin: 100px 100px; transform: rotate(${(data.national_risk_score / 10) * 180 - 90}deg)"/>
                  <circle cx="100" cy="100" r="8" fill="white" opacity="0.9"/>
                  <text x="100" y="88" text-anchor="middle" fill="${riskColor}" font-size="18" font-weight="800" font-family="JetBrains Mono">${data.national_risk_score}</text>
                  <text x="100" y="110" text-anchor="middle" fill="#94A3B8" font-size="9">/10</text>
                </svg>
              </div>
            </div>
            <div style="font-size:22px; font-weight:800; color:${riskColor}; letter-spacing:1px;">${data.risk_level} RISK</div>
            <div style="font-size:12px; color:var(--text-secondary); margin-top:6px; text-align:center;">National Cyber Security Risk Index<br>Based on active incidents and threat indicators</div>
          </div>
        </div>
      </div>

      <div class="glass-card">
        <div class="card-inner">
          <div class="card-header"><span class="section-title">Sector Impact Distribution</span></div>
          <div class="chart-container"><canvas id="sectorPieChart"></canvas></div>
        </div>
      </div>
    </div>

    <!-- ACTIVITY LOG -->
    <div class="glass-card">
      <div class="card-inner">
        <div class="card-header">
          <span class="section-title">Recent Activity Log</span>
          <button class="btn-secondary btn-sm" onclick="navigateTo('early-warning')">View All Alerts →</button>
        </div>
        <div id="activity-log">
          ${MockData.earlyWarningAlerts(5).map(a => `
            <div class="alert-ticker-item">
              <div class="alert-severity-indicator" style="background:${severityColor(a.severity)}"></div>
              <div class="alert-body">
                <div class="alert-title">${a.title}</div>
                <div class="alert-meta">
                  <span class="badge badge-${a.severity.toLowerCase()}">${a.severity}</span>
                  <span>🗺 ${a.state}</span>
                  <span>⚡ ${a.sector}</span>
                  <span class="mono">${a.source_ip}</span>
                </div>
              </div>
              <div class="alert-time">${relativeTime(a.minutes_ago)}</div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;

    // Chart: Sector Pie
    const sectors = MockData.analytics().sector_analysis.slice(0, 6);
    const ctx = document.getElementById('sectorPieChart');
    if (ctx) {
        new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: sectors.map(s => s.sector),
                datasets: [{
                    data: sectors.map(s => s.attacks),
                    backgroundColor: ['#EF4444', '#F59E0B', '#3B82F6', '#22C55E', '#38BDF8', '#8B5CF6'],
                    borderColor: 'rgba(0,0,0,0.4)', borderWidth: 2
                }]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'bottom', labels: { color: '#94A3B8', font: { size: 11 }, padding: 12 } }
                }
            }
        });
    }
}

function severityColor(s) {
    return { CRITICAL: '#EF4444', HIGH: '#F59E0B', MEDIUM: '#3B82F6', LOW: '#22C55E' }[s] || '#94A3B8';
}

function severityBadgeClass(s) {
    return `badge-${s.toLowerCase()}`;
}
