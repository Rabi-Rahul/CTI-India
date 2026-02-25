/**
 * Vulnerabilities Page - CVE feed with severity tagging
 */
let allVulns = [];
let vulnFilter = 'ALL';

async function renderVulnerabilities() {
    const container = document.getElementById('page-container');
    container.innerHTML = `<div class="loading-state"><div class="loading-spinner"></div><p class="loading-text">Loading CVE database...</p></div>`;
    allVulns = (await API.get('/vulnerabilities/')) || MockData.vulnerabilities(25);
    renderVulnTable();
}

function renderVulnTable() {
    const container = document.getElementById('page-container');
    const filtered = vulnFilter === 'ALL' ? allVulns : allVulns.filter(v => v.severity === vulnFilter);

    container.innerHTML = `
    <div class="page-header">
      <div>
        <h2 class="page-title">🔓 Vulnerability Database</h2>
        <p class="page-subtitle">CVE feed with severity tagging and patch advisories — ${allVulns.length} vulnerabilities tracked</p>
      </div>
      <div class="page-actions">
        <button class="btn-secondary btn-sm" onclick="renderVulnerabilities()">↻ Refresh</button>
      </div>
    </div>

    <!-- Summary stats -->
    <div class="stats-grid mb24" style="grid-template-columns: repeat(5, 1fr)">
      ${[
            { label: 'CRITICAL', count: allVulns.filter(v => v.severity === 'CRITICAL').length, color: 'var(--red)' },
            { label: 'HIGH', count: allVulns.filter(v => v.severity === 'HIGH').length, color: 'var(--orange)' },
            { label: 'MEDIUM', count: allVulns.filter(v => v.severity === 'MEDIUM').length, color: 'var(--blue)' },
            { label: 'LOW', count: allVulns.filter(v => v.severity === 'LOW').length, color: 'var(--green)' },
            { label: 'PATCHED', count: allVulns.filter(v => v.patch_available).length, color: 'var(--cyan)' }
        ].map(s => `
        <div class="glass-card stat-card" style="--card-accent:${s.color}">
          <div class="stat-value" style="color:${s.color}">${s.count}</div>
          <div class="stat-label">${s.label}</div>
        </div>
      `).join('')}
    </div>

    <!-- Filter bar -->
    <div class="glass-card mb16">
      <div class="card-inner" style="padding:12px 20px">
        <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap">
          ${['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map(f => `
            <button class="type-chip ${f === vulnFilter ? 'active' : ''}" onclick="filterVulns('${f}')">${f}</button>
          `).join('')}
          <div class="search-bar" style="margin-left:auto;width:260px">
            <input type="text" class="form-input" placeholder="Search CVE ID or vendor..." id="vuln-search" oninput="searchVulns(this.value)" style="padding-left:36px"/>
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
                <th>CVE ID</th>
                <th>Title</th>
                <th>Vendor</th>
                <th>CVSS</th>
                <th>Severity</th>
                <th>Age</th>
                <th>Patch</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody id="vuln-tbody">
              ${filtered.map(v => `
                <tr>
                  <td class="mono" style="color:var(--cyan)">${v.id}</td>
                  <td style="max-width:300px;font-size:12px">${v.title}</td>
                  <td style="color:var(--text-secondary);font-size:12px">${v.vendor}</td>
                  <td>
                    <span style="font-family:var(--font-mono);font-weight:700;color:${cvssColor(v.cvss_score)}">${v.cvss_score}</span>
                  </td>
                  <td><span class="badge badge-${v.severity.toLowerCase()}">${v.severity}</span></td>
                  <td style="font-size:12px;color:var(--text-muted)">${v.days_ago}d ago</td>
                  <td>
                    ${v.patch_available ?
                `<span style="color:var(--green);font-size:12px;font-weight:600">✓ Available</span>` :
                `<span style="color:var(--orange);font-size:12px">⚠ Pending</span>`
            }
                  </td>
                  <td>
                    <a href="https://nvd.nist.gov/vuln/detail/${v.id}" target="_blank">
                      <button class="btn-secondary btn-sm">Advisory →</button>
                    </a>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `;
}

function filterVulns(f) {
    vulnFilter = f;
    document.querySelectorAll('[onclick^="filterVulns"]').forEach(b => b.classList.toggle('active', b.textContent.trim() === f));
    const filtered = f === 'ALL' ? allVulns : allVulns.filter(v => v.severity === f);
    const tbody = document.getElementById('vuln-tbody');
    if (tbody) tbody.innerHTML = filtered.map(v => `
    <tr>
      <td class="mono" style="color:var(--cyan)">${v.id}</td>
      <td style="max-width:300px;font-size:12px">${v.title}</td>
      <td style="color:var(--text-secondary);font-size:12px">${v.vendor}</td>
      <td><span style="font-family:var(--font-mono);font-weight:700;color:${cvssColor(v.cvss_score)}">${v.cvss_score}</span></td>
      <td><span class="badge badge-${v.severity.toLowerCase()}">${v.severity}</span></td>
      <td style="font-size:12px;color:var(--text-muted)">${v.days_ago}d ago</td>
      <td>${v.patch_available ? '<span style="color:var(--green);font-size:12px;font-weight:600">✓ Available</span>' : '<span style="color:var(--orange);font-size:12px">⚠ Pending</span>'}</td>
      <td><button class="btn-secondary btn-sm">Advisory →</button></td>
    </tr>
  `).join('');
}

function searchVulns(q) {
    const lower = q.toLowerCase();
    const filtered = allVulns.filter(v => v.id.toLowerCase().includes(lower) || v.vendor.toLowerCase().includes(lower) || v.title.toLowerCase().includes(lower));
    const tbody = document.getElementById('vuln-tbody');
    if (tbody) tbody.innerHTML = filtered.map(v => `
    <tr>
      <td class="mono" style="color:var(--cyan)">${v.id}</td>
      <td style="max-width:300px;font-size:12px">${v.title}</td>
      <td style="color:var(--text-secondary);font-size:12px">${v.vendor}</td>
      <td><span style="font-family:var(--font-mono);font-weight:700;color:${cvssColor(v.cvss_score)}">${v.cvss_score}</span></td>
      <td><span class="badge badge-${v.severity.toLowerCase()}">${v.severity}</span></td>
      <td style="font-size:12px;color:var(--text-muted)">${v.days_ago}d ago</td>
      <td>${v.patch_available ? '<span style="color:var(--green);font-size:12px;font-weight:600">✓ Available</span>' : '<span style="color:var(--orange);font-size:12px">⚠ Pending</span>'}</td>
      <td><button class="btn-secondary btn-sm">Advisory →</button></td>
    </tr>
  `).join('');
}

function cvssColor(score) {
    if (score >= 9) return '#EF4444';
    if (score >= 7) return '#F59E0B';
    if (score >= 4) return '#3B82F6';
    return '#22C55E';
}
