/**
 * National Alerts Page
 */
function renderNationalAlerts() {
    const container = document.getElementById('page-container');
    const alerts = MockData.nationalAlerts();

    container.innerHTML = `
    <div class="page-header">
      <div>
        <h2 class="page-title">🔔 National Cyber Alerts</h2>
        <p class="page-subtitle">Official advisories and alerts issued by CERT-In and NCIIPC</p>
      </div>
    </div>
    ${alerts.map(a => `
      <div class="glass-card mb16" style="border-left:3px solid ${severityColor(a.severity)}">
        <div class="card-inner">
          <div style="display:flex;align-items:flex-start;gap:16px">
            <div style="flex-shrink:0;font-size:28px">${a.severity === 'CRITICAL' ? '🚨' : a.severity === 'HIGH' ? '⚠️' : 'ℹ️'}</div>
            <div style="flex:1">
              <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;flex-wrap:wrap">
                <span class="mono" style="font-size:12px;color:var(--blue)">${a.id}</span>
                <span class="badge badge-${a.severity.toLowerCase()}">${a.severity}</span>
                <span style="font-size:11px;color:var(--text-muted)">Issued by ${a.issued_by} · ${relativeTime(a.hours_ago * 60)}</span>
              </div>
              <div style="font-size:15px;font-weight:700;color:var(--text-heading);margin-bottom:8px">${a.title}</div>
              <p style="font-size:13px;color:var(--text-secondary);line-height:1.6;margin-bottom:10px">${a.description}</p>
              <div style="display:flex;gap:6px;flex-wrap:wrap">
                <span style="font-size:11px;color:var(--text-muted)">Sectors affected:</span>
                ${a.sectors.map(s => `<span style="font-size:10px;background:rgba(245,158,11,0.12);color:var(--orange);border:1px solid rgba(245,158,11,0.25);padding:2px 8px;border-radius:4px">${s}</span>`).join('')}
              </div>
            </div>
            <div>
              <button class="btn-secondary btn-sm">View Details</button>
            </div>
          </div>
        </div>
      </div>
    `).join('')}
  `;
}
