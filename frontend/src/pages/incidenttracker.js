/**
 * Incident Tracker Page - Ticket-style incident management
 */
let allIncidents = [];
let incStatusFilter = 'ALL';

async function renderIncidentTracker() {
    const container = document.getElementById('page-container');
    container.innerHTML = `<div class="loading-state"><div class="loading-spinner"></div><p class="loading-text">Loading incidents...</p></div>`;
    allIncidents = (await API.get('/incidents/tracker')) || MockData.incidents(20);
    renderIncidentView();
}

function renderIncidentView() {
    const container = document.getElementById('page-container');
    const filtered = incStatusFilter === 'ALL' ? allIncidents : allIncidents.filter(i => i.status === incStatusFilter);

    container.innerHTML = `
    <div class="page-header">
      <div>
        <h2 class="page-title">📋 Incident Tracker</h2>
        <p class="page-subtitle">Track, manage, and resolve cyber incidents across India</p>
      </div>
      <div class="page-actions">
        <button class="btn-primary btn-sm" onclick="navigateTo('report-threat')">+ New Incident</button>
        <button class="btn-secondary btn-sm" onclick="renderIncidentTracker()">↻ Refresh</button>
      </div>
    </div>

    <!-- Status counters -->
    <div class="stats-grid mb24" style="grid-template-columns: repeat(4, 1fr)">
      ${[
            { status: 'OPEN', icon: '🔴', color: 'var(--red)' },
            { status: 'INVESTIGATING', icon: '🔍', color: 'var(--orange)' },
            { status: 'ESCALATED', icon: '⬆', color: 'var(--blue)' },
            { status: 'RESOLVED', icon: '✅', color: 'var(--green)' }
        ].map(s => `
        <div class="glass-card stat-card" style="--card-accent:${s.color};cursor:pointer" onclick="filterIncidents('${s.status}')">
          <span class="stat-card-icon">${s.icon}</span>
          <div class="stat-value" style="color:${s.color}">${allIncidents.filter(i => i.status === s.status).length}</div>
          <div class="stat-label">${s.status}</div>
        </div>
      `).join('')}
    </div>

    <!-- Filter bar -->
    <div class="glass-card mb16">
      <div class="card-inner" style="padding:12px 20px">
        <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">
          ${['ALL', 'OPEN', 'INVESTIGATING', 'ESCALATED', 'RESOLVED'].map(f => `
            <button class="type-chip ${f === incStatusFilter ? 'active' : ''}" onclick="filterIncidents('${f}')">${f}</button>
          `).join('')}
        </div>
      </div>
    </div>

    <!-- Incidents -->
    <div class="glass-card">
      <div class="card-inner" style="padding:0">
        <div class="data-table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>Ticket ID</th><th>Title</th><th>Severity</th><th>Sector</th>
                <th>State</th><th>Status</th><th>Assigned To</th><th>IOCs</th><th>Age</th>
              </tr>
            </thead>
            <tbody id="inc-tbody">
              ${renderIncidentRows(filtered)}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

function renderIncidentRows(incidents) {
    return incidents.map(i => {
        const statusClass = `badge-${i.status.toLowerCase().replace(' ', '-')}`;
        return `
      <tr style="cursor:pointer" onclick="showIncidentDetail('${i.ticket_id}')">
        <td class="mono" style="color:var(--cyan);font-size:12px">${i.ticket_id}</td>
        <td style="font-size:12px;max-width:260px">${i.title}</td>
        <td><span class="badge badge-${i.severity.toLowerCase()}">${i.severity}</span></td>
        <td style="font-size:12px;color:var(--text-secondary)">${i.sector}</td>
        <td style="font-size:12px;color:var(--text-secondary)">${i.state}</td>
        <td><span class="badge ${statusClass}">${i.status}</span></td>
        <td style="font-size:12px;color:var(--text-secondary)">${i.assigned_to}</td>
        <td style="font-family:var(--font-mono);font-size:12px;color:${i.iocs_linked > 0 ? 'var(--orange)' : 'var(--text-muted)'}">${i.iocs_linked}</td>
        <td style="font-size:11px;color:var(--text-muted)">${relativeTime(i.hours_ago * 60)}</td>
      </tr>
    `;
    }).join('');
}

function filterIncidents(status) {
    incStatusFilter = status;
    document.querySelectorAll('[onclick^="filterIncidents"]').forEach(b => b.classList.toggle('active', b.textContent.trim() === status));
    const filtered = status === 'ALL' ? allIncidents : allIncidents.filter(i => i.status === status);
    const tbody = document.getElementById('inc-tbody');
    if (tbody) tbody.innerHTML = renderIncidentRows(filtered);
}

function showIncidentDetail(ticketId) {
    const inc = allIncidents.find(i => i.ticket_id === ticketId);
    if (!inc) return;
    const statusClass = `badge-${inc.status.toLowerCase()}`;
    const modal = document.createElement('div');
    modal.style.cssText = `position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:200;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(4px)`;
    modal.innerHTML = `
    <div class="glass-card" style="width:580px;max-width:95vw;animation:loginFadeIn 0.3s ease">
      <div class="card-inner">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px">
          <div>
            <div class="mono" style="font-size:13px;color:var(--cyan)">${inc.ticket_id}</div>
            <div style="font-size:16px;font-weight:700;color:var(--text-heading);margin-top:4px">${inc.title}</div>
          </div>
          <button onclick="this.closest('div[style*=\"fixed\"]').remove()" style="background:none;border:none;color:var(--text-secondary);font-size:20px;cursor:pointer">✕</button>
        </div>
        <div class="grid-2 mb16">
          <div><div style="font-size:10px;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.8px;margin-bottom:4px">Status</div><span class="badge ${statusClass}">${inc.status}</span></div>
          <div><div style="font-size:10px;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.8px;margin-bottom:4px">Severity</div><span class="badge badge-${inc.severity.toLowerCase()}">${inc.severity}</span></div>
          <div><div style="font-size:10px;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.8px;margin-bottom:4px">Sector</div><span style="font-size:13px;color:var(--text-primary)">${inc.sector}</span></div>
          <div><div style="font-size:10px;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.8px;margin-bottom:4px">Location</div><span style="font-size:13px;color:var(--text-primary)">${inc.state}</span></div>
          <div><div style="font-size:10px;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.8px;margin-bottom:4px">Assigned To</div><span style="font-size:13px;color:var(--cyan)">${inc.assigned_to}</span></div>
          <div><div style="font-size:10px;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.8px;margin-bottom:4px">IOCs Linked</div><span style="font-size:13px;color:var(--orange)">${inc.iocs_linked}</span></div>
        </div>
        <div style="background:rgba(0,0,0,0.3);border-radius:8px;padding:14px;margin-bottom:16px">
          <div style="font-size:11px;color:var(--text-muted);margin-bottom:6px">DESCRIPTION</div>
          <p style="font-size:13px;color:var(--text-secondary);line-height:1.6">${inc.description}</p>
        </div>
        <div style="display:flex;gap:10px">
          <button class="btn-secondary" onclick="this.closest('div[style*=\"fixed\"]').remove()">Close</button>
          <button class="btn-danger btn-sm">Escalate</button>
          <button class="btn-primary btn-sm">Mark Resolved</button>
        </div>
      </div>
    </div>
  `;
    document.body.appendChild(modal);
    modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
}
