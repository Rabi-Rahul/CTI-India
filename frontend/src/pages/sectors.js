/**
 * Sectors Page (Critical Infrastructure + Sector Risk Scores)
 */
async function renderCriticalInfrastructure() {
    const container = document.getElementById('page-container');
    container.innerHTML = `<div class="loading-state"><div class="loading-spinner"></div><p class="loading-text">Loading sector data...</p></div>`;
    const sectors = (await API.get('/sectors/')) || MockData.sectors();
    renderSectorsDashboard(container, sectors);
}

async function renderSectorRisk() {
    renderCriticalInfrastructure();
}

function renderSectorsDashboard(container, sectors) {
    const sectorIcons = {
        'Power & Energy': '⚡', Telecom: '📡', 'Banking & Finance': '🏦', Railways: '🚂',
        Healthcare: '🏥', 'Government IT': '🖥', Defence: '🛡', 'Water Supply': '💧'
    };

    container.innerHTML = `
    <div class="page-header">
      <div>
        <h2 class="page-title">🏭 Critical Infrastructure Dashboard</h2>
        <p class="page-subtitle">Real-time risk scores across India's critical national infrastructure sectors</p>
      </div>
      <div class="page-actions">
        <button class="btn-secondary btn-sm" onclick="renderCriticalInfrastructure()">↻ Refresh</button>
      </div>
    </div>

    <!-- Sector Cards -->
    <div class="sectors-grid mb24">
      ${sectors.map(s => {
        const riskColor = s.risk_score >= 8 ? 'var(--red)' : s.risk_score >= 6 ? 'var(--orange)' : s.risk_score >= 4 ? 'var(--blue)' : 'var(--green)';
        const barWidth = (s.risk_score / 10) * 100;
        const statusClass = {
            'NORMAL': 'badge-normal',
            'ELEVATED': 'badge-elevated',
            'HIGH ALERT': 'badge-high-alert',
            'CRITICAL': 'badge-critical'
        }[s.status] || 'badge-medium';

        return `
          <div class="glass-card sector-card" style="--card-accent:${riskColor}">
            <div style="position:absolute;top:0;left:0;right:0;height:2px;background:${riskColor}"></div>
            <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:12px">
              <div class="sector-card-icon">${sectorIcons[s.name] || '🏭'}</div>
              <span class="badge ${statusClass}" style="font-size:9px">${s.status}</span>
            </div>
            <div class="sector-card-name">${s.name}</div>
            <div class="sector-risk-score" style="color:${riskColor}">${s.risk_score}</div>
            <div class="sector-risk-label">Risk Score / 10</div>
            <div class="risk-bar-track">
              <div class="risk-bar-fill" style="width:${barWidth}%;background:${riskColor}"></div>
            </div>
            <div class="sector-incidents">
              <span style="color:var(--red)">🔴 ${s.active_incidents} active</span>
              <span style="margin-left:8px;color:var(--text-muted)">| ${s.threats_last_30d} threats/30d</span>
            </div>
          </div>
        `;
    }).join('')}
    </div>

    <!-- Sector Risk Table -->
    <div class="glass-card">
      <div class="card-inner">
        <div class="card-header"><span class="section-title">Sector Risk Comparison</span></div>
        <div class="chart-container" style="height:300px"><canvas id="sectorRiskChart"></canvas></div>
      </div>
    </div>
  `;

    // Horizontal bar chart
    const ctx = document.getElementById('sectorRiskChart');
    if (ctx) new Chart(ctx, {
        type: 'bar',
        data: {
            labels: sectors.map(s => s.name),
            datasets: [
                {
                    label: 'Risk Score',
                    data: sectors.map(s => s.risk_score),
                    backgroundColor: sectors.map(s => s.risk_score >= 8 ? '#EF444488' : s.risk_score >= 6 ? '#F59E0B88' : '#3B82F688'),
                    borderColor: sectors.map(s => s.risk_score >= 8 ? '#EF4444' : s.risk_score >= 6 ? '#F59E0B' : '#3B82F6'),
                    borderWidth: 1,
                    borderRadius: 4
                },
                {
                    label: 'Active Incidents',
                    data: sectors.map(s => s.active_incidents),
                    backgroundColor: '#22C55E44',
                    borderColor: '#22C55E',
                    borderWidth: 1,
                    borderRadius: 4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            indexAxis: 'y',
            plugins: { legend: { labels: { color: '#94A3B8', font: { size: 11 } } } },
            scales: {
                x: { ticks: { color: '#94A3B8' }, grid: { color: 'rgba(255,255,255,0.04)' } },
                y: { ticks: { color: '#94A3B8', font: { size: 11 } }, grid: { display: false } }
            }
        }
    });
}
