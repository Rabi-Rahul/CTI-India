/**
 * Analytics Page - Trend charts and sector analysis
 */
async function renderAnalytics() {
    const container = document.getElementById('page-container');
    container.innerHTML = `<div class="loading-state"><div class="loading-spinner"></div><p class="loading-text">Building analytics...</p></div>`;

    const data = (await API.get('/dashboard/analytics')) || MockData.analytics();

    container.innerHTML = `
    <div class="page-header">
      <div>
        <h2 class="page-title">📈 Threat Analytics</h2>
        <p class="page-subtitle">Trend analysis, sector breakdown, and threat distribution insights</p>
      </div>
      <div class="page-actions">
        <select class="form-input btn-sm" style="width:auto;padding:7px 32px 7px 12px;">
          <option>Last 7 Months</option>
          <option>Last 30 Days</option>
          <option>Last Year</option>
        </select>
      </div>
    </div>

    <!-- MONTHLY TREND -->
    <div class="glass-card mb24">
      <div class="card-inner">
        <div class="card-header">
          <span class="section-title">Monthly Attack Trend</span>
          <span style="font-size:12px;color:var(--text-muted)">India-wide cyber incidents</span>
        </div>
        <div class="chart-container" style="height:280px"><canvas id="monthlyChart"></canvas></div>
      </div>
    </div>

    <div class="grid-2 mb24">
      <!-- Sector Analysis -->
      <div class="glass-card">
        <div class="card-inner">
          <div class="card-header"><span class="section-title">Sector-wise Attacks</span></div>
          <div class="chart-container" style="height:280px"><canvas id="sectorBarChart"></canvas></div>
        </div>
      </div>

      <!-- Threat Distribution -->
      <div class="glass-card">
        <div class="card-inner">
          <div class="card-header"><span class="section-title">Threat Type Distribution</span></div>
          <div class="chart-container" style="height:280px"><canvas id="threatDistChart"></canvas></div>
        </div>
      </div>
    </div>

    <!-- Sector risk table -->
    <div class="glass-card">
      <div class="card-inner">
        <div class="card-header"><span class="section-title">Sector Risk Analysis Table</span></div>
        <div class="data-table-wrap">
          <table class="data-table">
            <thead>
              <tr><th>Sector</th><th>Total Attacks</th><th>Risk Score</th><th>Risk Level</th><th>Trend</th></tr>
            </thead>
            <tbody>
              ${data.sector_analysis.map(s => {
        const risk = s.risk_score;
        const rClass = risk >= 8 ? 'critical' : risk >= 6 ? 'high' : risk >= 4 ? 'medium' : 'low';
        return `
                  <tr>
                    <td style="font-weight:600">${s.sector}</td>
                    <td class="mono">${s.attacks}</td>
                    <td><span style="font-family:var(--font-mono);font-weight:700;color:${severityColor(rClass.toUpperCase())}">${risk}/10</span></td>
                    <td><span class="badge badge-${rClass}">${rClass.toUpperCase()}</span></td>
                    <td style="color:${Math.random() > 0.5 ? 'var(--red)' : 'var(--green)'}">${Math.random() > 0.5 ? '▲' : '▼'} ${randInt(2, 25)}%</td>
                  </tr>
                `;
    }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;

    const chartDefaults = {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { labels: { color: '#94A3B8', font: { size: 11 } } } },
        scales: {
            x: { ticks: { color: '#94A3B8' }, grid: { color: 'rgba(255,255,255,0.04)' } },
            y: { ticks: { color: '#94A3B8' }, grid: { color: 'rgba(255,255,255,0.04)' } }
        }
    };

    // Monthly trend
    const mc = document.getElementById('monthlyChart');
    if (mc) new Chart(mc, {
        type: 'line',
        data: {
            labels: data.monthly_trend.map(m => m.month),
            datasets: [{
                label: 'Total Attacks', data: data.monthly_trend.map(m => m.attacks),
                borderColor: '#38BDF8', backgroundColor: 'rgba(56,189,248,0.1)',
                fill: true, tension: 0.4, pointBackgroundColor: '#38BDF8', pointRadius: 5
            }, {
                label: 'Critical Incidents', data: data.monthly_trend.map(m => Math.floor(m.attacks * 0.15)),
                borderColor: '#EF4444', backgroundColor: 'rgba(239,68,68,0.05)',
                fill: true, tension: 0.4, pointBackgroundColor: '#EF4444', pointRadius: 5
            }]
        },
        options: { ...chartDefaults }
    });

    // Sector bar
    const sb = document.getElementById('sectorBarChart');
    if (sb) new Chart(sb, {
        type: 'bar',
        data: {
            labels: data.sector_analysis.map(s => s.sector.split(' ')[0]),
            datasets: [{
                label: 'Attack Count', data: data.sector_analysis.map(s => s.attacks),
                backgroundColor: data.sector_analysis.map(s =>
                    s.risk_score >= 8 ? '#EF4444' : s.risk_score >= 6 ? '#F59E0B' : '#3B82F6'
                ),
                borderRadius: 4
            }]
        },
        options: { ...chartDefaults, plugins: { legend: { display: false } } }
    });

    // Threat distribution pie
    const td = document.getElementById('threatDistChart');
    if (td) new Chart(td, {
        type: 'polarArea',
        data: {
            labels: data.threat_distribution.map(t => t.type),
            datasets: [{
                data: data.threat_distribution.map(t => t.count),
                backgroundColor: ['#EF444488', '#F59E0B88', '#3B82F688', '#22C55E88', '#38BDF888', '#8B5CF688', '#EC489988']
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { position: 'right', labels: { color: '#94A3B8', font: { size: 11 } } } }
        }
    });
}
