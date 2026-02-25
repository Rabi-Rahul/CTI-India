/**
 * About Page
 */
function renderAbout() {
    const container = document.getElementById('page-container');
    container.innerHTML = `
    <div class="about-hero">
      <span class="about-hero-emblem">🇮🇳</span>
      <div class="about-hero-title">CTI<span class="accent-green">India</span></div>
      <div style="font-size:16px;color:var(--text-secondary);margin-top:6px">National Cyber Threat Intelligence Platform</div>
      <div class="about-hero-sub">v2.5.1 • Powered by NCIIPC • Ministry of Electronics & Information Technology</div>
      <div style="display:flex;gap:12px;justify-content:center;margin-top:20px;flex-wrap:wrap">
        <span class="badge badge-critical" style="font-size:12px;">🔒 TOP SECRET CLEARANCE REQUIRED</span>
        <span class="badge badge-medium" style="font-size:12px;">IT Act 2000 Compliant</span>
        <span class="badge badge-low" style="font-size:12px;">ISO 27001 Certified</span>
      </div>
    </div>

    <div class="grid-2">
      <div class="glass-card">
        <div class="card-inner">
          <div class="section-title mb16">Platform Overview</div>
          <p style="font-size:13px;color:var(--text-secondary);line-height:1.8;margin-bottom:12px">The CTIIndia platform is India's premier national cyber threat intelligence system, providing real-time threat monitoring, early warning capabilities, and coordinated incident response across all critical national infrastructure sectors.</p>
          <p style="font-size:13px;color:var(--text-secondary);line-height:1.8">Developed in partnership with CERT-In, NCIIPC, and MeitY, the platform consolidates threat intelligence from 500+ government agencies, ISPs, and private sector partners to deliver actionable security insights 24×7.</p>
        </div>
      </div>
      <div class="glass-card">
        <div class="card-inner">
          <div class="section-title mb16">Platform Statistics</div>
          ${[
            { label: 'Threat Indicators', val: '${(randInt(14,22))}K+' },
            { label: 'Partner Agencies', val: '500+' },
            { label: 'States Monitored', val: '28 States + 8 UTs' },
            { label: 'Uptime SLA', val: '99.99%' },
            { label: 'Daily Alerts Processed', val: '${randInt(5,12)}K+' },
            { label: 'Incidents Resolved', val: '${randInt(1200,2000)}+' },
        ].map(s => `
            <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border)">
              <span style="font-size:13px;color:var(--text-secondary)">${s.label}</span>
              <span style="font-size:13px;font-weight:700;color:var(--cyan);font-family:var(--font-mono)">${s.val}</span>
            </div>
          `).join('')}
        </div>
      </div>
    </div>

    <div class="glass-card mt24">
      <div class="card-inner">
        <div class="section-title mb16">Partner Organizations</div>
        <div style="display:flex;gap:16px;flex-wrap:wrap">
          ${['CERT-In', 'NCIIPC', 'MeitY', 'NIC', 'DRDO', 'CBI Cyber Cell', 'RBI DPSS', 'SEBI', 'TRAI', 'Railway Ministry'].map(org => `
            <div style="padding:10px 18px;background:rgba(59,130,246,0.08);border:1px solid rgba(59,130,246,0.2);border-radius:8px;font-size:13px;font-weight:600;color:var(--blue)">${org}</div>
          `).join('')}
        </div>
      </div>
    </div>
  `;
}
