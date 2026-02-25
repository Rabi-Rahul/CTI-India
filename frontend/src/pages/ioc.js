/**
 * IOC Database Page - Searchable indicator database
 */
let allIOCs = [];
let iocTypeFilter = 'ALL';

async function renderIOCDatabase() {
    const container = document.getElementById('page-container');
    container.innerHTML = `<div class="loading-state"><div class="loading-spinner"></div><p class="loading-text">Loading IOC database...</p></div>`;
    allIOCs = (await API.get('/ioc/')) || MockData.iocs(50);
    renderIOCView();
}

function renderIOCView() {
    const container = document.getElementById('page-container');
    const filtered = iocTypeFilter === 'ALL' ? allIOCs : allIOCs.filter(i => i.type === iocTypeFilter);
    const types = ['ALL', ...new Set(allIOCs.map(i => i.type))];

    container.innerHTML = `
    <div class="page-header">
      <div>
        <h2 class="page-title">🔍 IOC Database</h2>
        <p class="page-subtitle">Indicators of Compromise — ${allIOCs.length} indicators tracked</p>
      </div>
    </div>

    <!-- Stats -->
    <div class="stats-grid mb24" style="grid-template-columns: repeat(4, 1fr)">
      ${['IP Address', 'Domain', 'URL', 'File Hash (MD5)'].map(t => `
        <div class="glass-card stat-card" style="--card-accent:var(--cyan)">
          <div class="stat-value" style="font-size:24px">${allIOCs.filter(i => i.type === t).length}</div>
          <div class="stat-label">${t}</div>
        </div>
      `).join('')}
    </div>

    <!-- Filter + Search -->
    <div class="glass-card mb16">
      <div class="card-inner" style="padding:12px 20px">
        <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">
          <div class="ioc-grid" style="margin:0;flex:1">
            ${types.map(t => `<button class="type-chip ${t === iocTypeFilter ? 'active' : ''}" onclick="filterIOC('${t}')">${t}</button>`).join('')}
          </div>
          <div class="search-bar" style="width:320px">
            <input type="text" class="form-input" placeholder="Search IP, domain, hash, URL..." id="ioc-search" oninput="searchIOC(this.value)" style="padding-left:36px"/>
          </div>
        </div>
      </div>
    </div>

    <!-- Table -->
    <div class="glass-card">
      <div class="card-inner" style="padding:0">
        <div class="data-table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>IOC ID</th><th>Type</th><th>Indicator Value</th>
                <th>Reputation</th><th>Tags</th><th>Source</th><th>Country</th><th>Last Seen</th>
              </tr>
            </thead>
            <tbody id="ioc-tbody">
              ${renderIOCRows(filtered)}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

function renderIOCRows(iocs) {
    return iocs.map(i => {
        const repColor = i.reputation_score < 30 ? 'var(--red)' : i.reputation_score < 60 ? 'var(--orange)' : 'var(--green)';
        return `
      <tr>
        <td class="mono" style="font-size:11px;color:var(--text-muted)">${i.id}</td>
        <td><span class="badge badge-medium" style="font-size:9px">${i.type}</span></td>
        <td class="mono" style="font-size:11px;max-width:220px;word-break:break-all">${i.value}</td>
        <td>
          <div style="display:flex;align-items:center;gap:8px">
            <div style="flex:1;height:4px;background:rgba(255,255,255,0.08);border-radius:2px">
              <div style="width:${100 - i.reputation_score}%;height:100%;background:${repColor};border-radius:2px"></div>
            </div>
            <span style="font-size:11px;font-family:var(--font-mono);color:${repColor}">${100 - i.reputation_score}% malicious</span>
          </div>
        </td>
        <td>
          <div style="display:flex;gap:4px;flex-wrap:wrap">
            ${i.tags.map(t => `<span style="font-size:9px;background:rgba(59,130,246,0.15);color:var(--blue);border:1px solid rgba(59,130,246,0.25);padding:2px 6px;border-radius:3px">${t}</span>`).join('')}
          </div>
        </td>
        <td style="font-size:11px;color:var(--text-secondary)">${i.source}</td>
        <td style="font-size:11px;color:var(--text-secondary)">${i.country}</td>
        <td style="font-size:11px;color:var(--text-muted)">${i.days_ago}d ago</td>
      </tr>
    `;
    }).join('');
}

function filterIOC(type) {
    iocTypeFilter = type;
    document.querySelectorAll('[onclick^="filterIOC"]').forEach(b => b.classList.toggle('active', b.textContent.trim() === type));
    const filtered = type === 'ALL' ? allIOCs : allIOCs.filter(i => i.type === type);
    const tbody = document.getElementById('ioc-tbody');
    if (tbody) tbody.innerHTML = renderIOCRows(filtered);
}

function searchIOC(q) {
    const lower = q.toLowerCase();
    const filtered = allIOCs.filter(i => i.value.toLowerCase().includes(lower) || i.source.toLowerCase().includes(lower) || i.country.toLowerCase().includes(lower));
    const tbody = document.getElementById('ioc-tbody');
    if (tbody) tbody.innerHTML = renderIOCRows(filtered);
}
