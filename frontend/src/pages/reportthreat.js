/**
 * Report Threat Page - Incident submission form
 */
async function renderReportThreat() {
    const container = document.getElementById('page-container');
    container.innerHTML = `
    <div class="page-header">
      <div>
        <h2 class="page-title">📝 Report a Cyber Threat</h2>
        <p class="page-subtitle">Submit incident report to CERT-In and NCIIPC for immediate response</p>
      </div>
    </div>

    <div id="report-success" class="report-success-banner">
      ✅ <span id="report-success-msg">Incident reported successfully!</span>
    </div>

    <div class="grid-2-1">
      <div class="glass-card report-form">
        <div class="card-inner">
          <div class="section-title mb16">Incident Details</div>
          <form id="threat-report-form" onsubmit="submitThreatReport(event)">
            <div class="form-group">
              <label>Incident Title *</label>
              <input type="text" class="form-input" id="inc-title" placeholder="Brief description of the incident" required />
            </div>
            <div class="form-grid-2">
              <div class="form-group">
                <label>Affected Sector *</label>
                <select class="form-input" id="inc-sector" required>
                  <option value="">-- Select Sector --</option>
                  ${SECTORS.map(s => `<option>${s}</option>`).join('')}
                </select>
              </div>
              <div class="form-group">
                <label>Severity Level *</label>
                <select class="form-input" id="inc-severity" required>
                  <option value="">-- Select Severity --</option>
                  <option value="CRITICAL" style="color:#EF4444">🔴 CRITICAL</option>
                  <option value="HIGH" style="color:#F59E0B">🟠 HIGH</option>
                  <option value="MEDIUM">🔵 MEDIUM</option>
                  <option value="LOW">🟢 LOW</option>
                </select>
              </div>
            </div>
            <div class="form-grid-2">
              <div class="form-group">
                <label>State / UT *</label>
                <select class="form-input" id="inc-state" required>
                  <option value="">-- Select State --</option>
                  ${INDIA_STATES.map(s => `<option>${s}</option>`).join('')}
                  <option>Pan-India</option>
                  <option>International</option>
                </select>
              </div>
              <div class="form-group">
                <label>Threat Type</label>
                <select class="form-input" id="inc-type">
                  ${THREAT_TYPES.map(t => `<option>${t}</option>`).join('')}
                  <option>Other</option>
                </select>
              </div>
            </div>
            <div class="form-group">
              <label>Incident Description *</label>
              <textarea class="form-textarea" id="inc-description" rows="5" placeholder="Describe the incident in detail: what happened, when, what systems are affected, initial impact..." required></textarea>
            </div>
            <div class="form-grid-2">
              <div class="form-group">
                <label>Affected IP / Domain</label>
                <input type="text" class="form-input" id="inc-ioc" placeholder="e.g. 192.168.1.1 or evil.com" />
              </div>
              <div class="form-group">
                <label>Systems Affected</label>
                <input type="text" class="form-input" id="inc-systems" placeholder="e.g. Web Server, DB, SCADA..." />
              </div>
            </div>

            <div class="section-title mb16 mt16">Reporter Information</div>
            <div class="form-grid-2">
              <div class="form-group">
                <label>Your Name *</label>
                <input type="text" class="form-input" id="rep-name" placeholder="Full Name" required />
              </div>
              <div class="form-group">
                <label>Official Email *</label>
                <input type="email" class="form-input" id="rep-email" placeholder="name@gov.in" required />
              </div>
            </div>
            <div class="form-grid-2">
              <div class="form-group">
                <label>Contact Number</label>
                <input type="tel" class="form-input" id="rep-phone" placeholder="+91 XXXXX XXXXX" />
              </div>
              <div class="form-group">
                <label>Organization</label>
                <input type="text" class="form-input" id="rep-org" placeholder="Ministry / Department / Agency" />
              </div>
            </div>
            <div class="form-group">
              <label>Attach Log Files / Evidence</label>
              <div style="border: 2px dashed var(--border); border-radius: var(--radius); padding: 20px; text-align: center; cursor: pointer;" onclick="document.getElementById('log-upload').click()">
                <div style="font-size: 24px; margin-bottom: 6px;">📎</div>
                <div style="font-size: 13px; color: var(--text-secondary)">Click to attach logs, screenshots, or PCAP files</div>
                <div style="font-size: 11px; color: var(--text-muted); margin-top: 4px">Max 50MB per file • .log, .txt, .pcap, .png, .pdf</div>
              </div>
              <input type="file" id="log-upload" multiple style="display:none" accept=".log,.txt,.pcap,.png,.pdf" onchange="showFileNames(this)" />
              <div id="file-names" style="margin-top:8px;font-size:12px;color:var(--green)"></div>
            </div>
            <div style="display:flex;gap:12px;margin-top:4px">
              <button type="submit" class="btn-primary btn-full" id="submit-btn">
                🚨 Submit Incident Report
              </button>
              <button type="button" class="btn-secondary" style="min-width:120px" onclick="document.getElementById('threat-report-form').reset()">
                ↺ Reset
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Sidebar info -->
      <div style="display:flex;flex-direction:column;gap:16px">
        <div class="glass-card" style="--card-accent:var(--orange)">
          <div class="card-inner">
            <div class="section-title mb16">Response SLA</div>
            ${[
            { sev: 'CRITICAL', time: 'Within 1 Hour', color: 'var(--red)' },
            { sev: 'HIGH', time: 'Within 4 Hours', color: 'var(--orange)' },
            { sev: 'MEDIUM', time: 'Within 24 Hours', color: 'var(--blue)' },
            { sev: 'LOW', time: 'Within 72 Hours', color: 'var(--green)' }
        ].map(r => `
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;padding-bottom:12px;border-bottom:1px solid var(--border)">
                <span class="badge badge-${r.sev.toLowerCase()}">${r.sev}</span>
                <span style="font-size:13px;font-weight:600;color:${r.color}">${r.time}</span>
              </div>
            `).join('')}
          </div>
        </div>

        <div class="glass-card">
          <div class="card-inner">
            <div class="section-title mb16">Emergency Contacts</div>
            ${[
            { name: 'CERT-In Helpdesk', num: '1800-11-4949', hrs: '24x7' },
            { name: 'NCIIPC NOC', num: '+91-11-2430-1900', hrs: '24x7' },
            { name: 'Cyber Crime Cell', num: '1930', hrs: '24x7' },
        ].map(c => `
              <div style="margin-bottom:12px;padding-bottom:12px;border-bottom:1px solid var(--border)">
                <div style="font-size:13px;font-weight:600;color:var(--text-heading)">${c.name}</div>
                <div style="font-size:16px;font-weight:700;color:var(--green);font-family:var(--font-mono);margin-top:2px">${c.num}</div>
                <div style="font-size:10px;color:var(--text-muted)">${c.hrs}</div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    </div>
  `;
}

async function submitThreatReport(e) {
    e.preventDefault();
    const btn = document.getElementById('submit-btn');
    btn.disabled = true;
    btn.innerHTML = '<div class="loading-spinner" style="width:18px;height:18px;margin-right:8px"></div> Submitting...';

    const payload = {
        title: document.getElementById('inc-title').value,
        description: document.getElementById('inc-description').value,
        sector: document.getElementById('inc-sector').value,
        severity: document.getElementById('inc-severity').value,
        state: document.getElementById('inc-state').value,
        reporter_name: document.getElementById('rep-name').value,
        reporter_email: document.getElementById('rep-email').value,
        contact_number: document.getElementById('rep-phone').value
    };

    await new Promise(r => setTimeout(r, 1500)); // simulate network

    const result = (await API.post('/incidents/report', payload)) || {
        success: true,
        ticket_id: `INC-${randInt(2025100, 2025999)}`,
        message: `Incident reported successfully.`
    };

    btn.disabled = false;
    btn.innerHTML = '🚨 Submit Incident Report';

    if (result.success) {
        const banner = document.getElementById('report-success');
        const msg = document.getElementById('report-success-msg');
        msg.textContent = `✅ ${result.message} | Ticket: ${result.ticket_id}`;
        banner.classList.add('show');
        banner.style.display = 'flex';
        document.getElementById('threat-report-form').reset();
        banner.scrollIntoView({ behavior: 'smooth' });
    }
}

function showFileNames(input) {
    const div = document.getElementById('file-names');
    if (div) div.textContent = [...input.files].map(f => `✓ ${f.name}`).join(' · ');
}
