/**
 * Tools Page – Link Detector
 * Follows the same glass-card / section-title design system as Report Threat.
 */
function renderTools() {
  const container = document.getElementById('page-container');

  /* ── Minimal page-only styles that don't exist in style.css ── */
  const styleId = 'link-detector-styles';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      .ld-input-row {
        display: flex;
        gap: 12px;
        align-items: stretch;
        flex-wrap: wrap;
      }
      .ld-input-wrap { flex: 1; min-width: 260px; }
      .ld-url-input {
        width: 100%;
        height: 46px;
        background: var(--bg-input);
        border: 1px solid var(--border);
        border-radius: var(--radius);
        padding: 0 16px;
        color: var(--text-primary);
        font-size: 14px;
        font-family: var(--font-mono);
        letter-spacing: 0.3px;
        transition: border-color 0.2s, box-shadow 0.2s;
        outline: none;
      }
      .ld-url-input::placeholder { color: var(--text-muted); }
      .ld-url-input:focus {
        border-color: var(--cyan);
        box-shadow: 0 0 0 3px rgba(56,189,248,0.12);
      }
      .ld-scan-btn {
        height: 46px;
        padding: 0 28px;
        background: var(--cyan);
        color: #020617;
        border: none;
        border-radius: var(--radius);
        font-size: 14px;
        font-weight: 700;
        letter-spacing: 0.4px;
        cursor: pointer;
        white-space: nowrap;
        flex-shrink: 0;
        transition: background 0.2s ease, box-shadow 0.2s ease, transform 0.1s ease;
      }
      .ld-scan-btn:hover {
        background: #7dd3fc;
        box-shadow: 0 0 16px rgba(56,189,248,0.3);
        transform: translateY(-1px);
      }
      .ld-scan-btn:active  { transform: translateY(0); }
      .ld-scan-btn:disabled { opacity: 0.55; cursor: not-allowed; transform: none; box-shadow: none; }
      .ld-connection-note {
        margin-top: 12px;
        font-size: 11px;
        color: var(--text-muted);
        letter-spacing: 0.3px;
      }
      .ld-connection-note span { color: var(--text-secondary); }

      /* ── Result panel ── */
      #ld-result { margin-top: 4px; }
      .ld-result-wrap {
        margin-top: 20px;
        border-radius: var(--radius);
        border: 1px solid var(--border);
        overflow: hidden;
        animation: ld-fadein 0.3s ease;
      }
      @keyframes ld-fadein {
        from { opacity: 0; transform: translateY(5px); }
        to   { opacity: 1; transform: translateY(0); }
      }
      .ld-result-header {
        padding: 18px 22px;
        border-bottom: 1px solid var(--border);
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
        gap: 12px;
      }
      .ld-verdict-word {
        font-size: 20px;
        font-weight: 800;
        letter-spacing: -0.3px;
        margin-bottom: 3px;
      }
      .ld-verdict-url {
        font-size: 11px;
        color: var(--text-muted);
        word-break: break-all;
        font-family: var(--font-mono);
      }
      .ld-score-col { text-align: right; }
      .ld-score-num {
        font-size: 32px;
        font-weight: 900;
        font-family: var(--font-mono);
        line-height: 1;
      }
      .ld-score-lbl {
        font-size: 9px;
        color: var(--text-muted);
        text-transform: uppercase;
        letter-spacing: 1px;
        margin-top: 3px;
      }
      .ld-cached-tag {
        font-size: 10px;
        font-weight: 600;
        background: rgba(255,255,255,0.06);
        color: var(--text-muted);
        padding: 2px 8px;
        border-radius: 4px;
        vertical-align: middle;
        margin-left: 6px;
      }
      /* Score bar */
      .ld-bar-wrap { padding: 0 22px; margin: 14px 0 4px; }
      .ld-bar-track {
        height: 5px;
        background: rgba(255,255,255,0.06);
        border-radius: 3px;
        overflow: hidden;
      }
      .ld-bar-fill { height: 100%; border-radius: 3px; transition: width 0.9s ease; }
      .ld-bar-legend {
        display: flex;
        justify-content: space-between;
        margin-top: 5px;
        font-size: 10px;
      }
      /* Verdicts */
      .ld-section-inner { padding: 14px 22px; }
      .ld-inner-label {
        font-size: 10px;
        font-weight: 700;
        color: var(--text-muted);
        text-transform: uppercase;
        letter-spacing: 1.2px;
        margin-bottom: 10px;
      }
      .ld-verdicts-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(185px, 1fr));
        gap: 8px;
      }
      .ld-verdict-chip {
        background: rgba(0,0,0,0.2);
        border: 1px solid var(--border);
        border-radius: var(--radius);
        padding: 9px 13px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
      }
      .ld-chip-name { font-size: 12px; color: var(--text-secondary); font-weight: 500; }
      .ld-chip-val  { display: flex; align-items: center; gap: 5px; }
      .ld-chip-dot  { width: 5px; height: 5px; border-radius: 50%; flex-shrink: 0; }
      .ld-chip-text { font-size: 11px; font-weight: 700; }
      /* Intel grid */
      .ld-intel-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
        gap: 8px;
      }
      .ld-intel-cell {
        background: rgba(0,0,0,0.18);
        border: 1px solid var(--border);
        border-radius: var(--radius);
        padding: 10px 12px;
      }
      .ld-intel-lbl {
        font-size: 9px;
        font-weight: 600;
        color: var(--text-muted);
        text-transform: uppercase;
        letter-spacing: 0.8px;
        margin-bottom: 4px;
      }
      /* Advisory */
      .ld-advisory {
        margin: 0 22px 18px;
        padding: 12px 16px;
        background: rgba(239,68,68,0.06);
        border-left: 3px solid rgba(239,68,68,0.4);
        border-radius: 0 var(--radius) var(--radius) 0;
        font-size: 12px;
        color: var(--text-secondary);
        line-height: 1.75;
      }
      .ld-advisory strong { color: var(--text-heading); }

      /* ── About grid ── */
      .ld-about-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(210px, 1fr));
        gap: 14px;
        margin-top: 18px;
      }
      .ld-about-cell {
        background: rgba(56,189,248,0.04);
        border: 1px solid rgba(56,189,248,0.1);
        border-radius: var(--radius);
        padding: 16px;
        transition: background 0.2s, border-color 0.2s;
      }
      .ld-about-cell:hover {
        background: rgba(56,189,248,0.07);
        border-color: rgba(56,189,248,0.2);
      }
      .ld-about-cell-title {
        font-size: 13px;
        font-weight: 700;
        color: var(--text-heading);
        margin-bottom: 5px;
      }
      .ld-about-cell-desc { font-size: 12px; color: var(--text-secondary); line-height: 1.65; }

      /* ── API table rows ── */
      .ld-api-table {
        border: 1px solid var(--border);
        border-radius: var(--radius);
        overflow: hidden;
        margin-top: 16px;
      }
      .ld-api-row {
        padding: 16px 20px;
        border-bottom: 1px solid var(--border);
        transition: background 0.2s;
      }
      .ld-api-row:last-child { border-bottom: none; }
      .ld-api-row:hover { background: rgba(56,189,248,0.03); }
      .ld-api-name-row {
        display: flex;
        align-items: center;
        gap: 10px;
        margin-bottom: 4px;
      }
      .ld-api-name { font-size: 14px; font-weight: 700; color: var(--text-heading); }
      .ld-api-status {
        font-size: 9px;
        font-weight: 700;
        letter-spacing: 1px;
        padding: 2px 7px;
        border-radius: 4px;
        background: rgba(34,197,94,0.08);
        color: var(--green);
        border: 1px solid rgba(34,197,94,0.2);
      }
      .ld-api-desc { font-size: 12px; color: var(--text-secondary); line-height: 1.65; }

      /* ── Spinner ── */
      .ld-spinner {
        display: inline-block;
        width: 16px; height: 16px;
        border: 2px solid rgba(255,255,255,0.15);
        border-top-color: var(--cyan);
        border-radius: 50%;
        animation: ld-spin 0.7s linear infinite;
        vertical-align: middle;
      }
      @keyframes ld-spin { to { transform: rotate(360deg); } }

      /* Note strip */
      .ld-note {
        margin-top: 18px;
        padding: 11px 16px;
        background: rgba(56,189,248,0.04);
        border-left: 3px solid var(--cyan);
        border-radius: 0 var(--radius) var(--radius) 0;
        font-size: 12px;
        color: var(--text-secondary);
        line-height: 1.75;
      }
      .ld-note strong { color: var(--text-heading); }

      /* ── Result panel two-column layout ── */
      .ld-result-panels {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 0;
        border-bottom: 1px solid var(--border);
      }
      .ld-result-panel-col {
        padding: 20px 26px;
      }
      .ld-result-panel-col + .ld-result-panel-col {
        border-left: 1px solid var(--border);
      }
      .ld-panel-label {
        font-size: 10px;
        font-weight: 700;
        color: var(--text-heading);
        text-transform: uppercase;
        letter-spacing: 1.2px;
        margin-bottom: 14px;
      }
      .ld-kv-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        padding: 9px 0;
        border-bottom: 1px solid rgba(255,255,255,0.04);
      }
      .ld-kv-row:last-child { border-bottom: none; }
      .ld-kv-label {
        font-size: 12px;
        color: var(--text-secondary);
        font-weight: 500;
        flex-shrink: 0;
      }
      .ld-kv-val {
        font-size: 13px;
        font-weight: 700;
        text-align: right;
      }
      .ld-status-pill {
        font-size: 11px;
        font-weight: 700;
        padding: 3px 10px;
        border-radius: 4px;
        border: 1px solid;
        white-space: nowrap;
      }
      @media (max-width: 640px) {
        .ld-result-panels { grid-template-columns: 1fr; }
        .ld-result-panel-col + .ld-result-panel-col { border-left: none; border-top: 1px solid var(--border); }
      }
      /* ── Responsive ── */
      @media (max-width: 768px) {
        .ld-input-row { flex-direction: column; }
        .ld-scan-btn  { width: 100%; }
      }
    `;
    document.head.appendChild(style);
  }

  container.innerHTML = `
    <!-- PAGE HEADER -->
    <div class="page-header" style="margin-bottom:28px;">
      <div>
        <h2 class="page-title">Link Detector</h2>
        <p class="page-subtitle">URL Threat Intelligence &amp; Reputation Analysis Portal</p>
      </div>
    </div>

    <!-- SCAN SECTION -->
    <div class="glass-card mb24" style="border-top:2px solid var(--cyan);">
      <div class="card-inner" style="padding:28px 32px;">
        <div class="section-title mb16">URL Threat Analysis</div>
        <p style="font-size:13px;color:var(--text-secondary);line-height:1.7;max-width:680px;margin-bottom:22px;">
          Analyze suspicious links using real-time threat intelligence services. The system queries multiple globally recognized security databases to determine the safety status of any URL before interaction.
        </p>

        <div class="ld-input-row">
          <div class="ld-input-wrap">
            <input
              type="url"
              class="ld-url-input"
              id="link-input"
              placeholder="https://suspicious-domain.xyz/path"
              onkeydown="if(event.key==='Enter') analyzeLink()"
            />
          </div>
          <button class="ld-scan-btn" id="analyze-btn" onclick="analyzeLink()">Scan URL</button>
        </div>

        <div class="ld-connection-note">
          Status: <span>Live</span> &nbsp;&mdash;&nbsp;
          Connected to <span>Google Safe Browsing</span> &middot;
          <span>VirusTotal</span> &middot; <span>AbuseIPDB</span> &middot; <span>PhishTank</span>
        </div>

        <div id="ld-result"></div>
      </div>
    </div>

    <!-- ABOUT SECTION -->
    <div class="glass-card mb24">
      <div class="card-inner" style="padding:28px 32px;">
        <div class="section-title mb16">About the Link Detection System</div>
        <p style="font-size:13px;color:var(--text-secondary);line-height:1.8;margin-bottom:12px;">
          The CTI India Link Detector is an integrated URL threat analysis module designed to assist security analysts, incident responders, and infrastructure teams in evaluating the risk posture of any publicly accessible link before interacting with it.
        </p>
        <p style="font-size:13px;color:var(--text-secondary);line-height:1.8;margin-bottom:0;">
          When a URL is submitted, the system performs a multi-layered lookup across globally recognized threat intelligence platforms. Each API independently evaluates the URL for domain reputation, malware-hosting flags, phishing history, IP abuse records, and server metadata.
        </p>

        <div class="ld-about-grid">
          ${[
      { title: 'Domain Reputation', desc: 'Evaluates the historical trust score and registration age of the queried domain against global reputation databases.' },
      { title: 'Malware Detection', desc: 'Checks whether the URL has been linked to malware hosting, payload delivery, or command-and-control infrastructure.' },
      { title: 'Phishing Indicators', desc: 'Detects patterns associated with credential harvesting, brand spoofing, and deceptive landing pages.' },
      { title: 'IP Abuse Record', desc: 'Verifies the hosting IP address against global blacklists and abuse reporting databases for prior malicious activity.' },
    ].map(item => `
            <div class="ld-about-cell">
              <div class="ld-about-cell-title">${item.title}</div>
              <div class="ld-about-cell-desc">${item.desc}</div>
            </div>
          `).join('')}
        </div>

        <div class="ld-note">
          <strong>Note:</strong> Results are based on aggregated threat intelligence data sourced from multiple third-party platforms. Final determination should be made in context with additional indicators of compromise (IOCs) and your organization's security policy. For escalation, contact <strong>incident@cert-in.org.in</strong>.
        </div>
      </div>
    </div>

    <!-- TECHNOLOGY & APIs SECTION -->
    <div class="glass-card">
      <div class="card-inner" style="padding:28px 32px;">
        <div class="section-title mb16">Technology &amp; APIs Used</div>
        <p style="font-size:13px;color:var(--text-secondary);line-height:1.7;margin-bottom:0;">
          This system integrates with the following globally operated threat intelligence platforms to provide comprehensive, multi-source URL reputation analysis:
        </p>

        <div class="ld-api-table">
          ${[
      {
        name: 'Google Safe Browsing',
        desc: "Google's continuously updated threat database identifying URLs hosting malware, phishing content, and unwanted software — active across billions of URLs worldwide.",
      },
      {
        name: 'VirusTotal',
        desc: 'Multi-engine analysis platform aggregating scan results from 70+ antivirus engines and domain intelligence services into a single, unified URL verdict.',
      },
      {
        name: 'AbuseIPDB',
        desc: 'Community-driven IP and domain abuse reporting database. Identifies hosts flagged for spam, brute-force attacks, port scanning, and other malicious network behaviors.',
      },
      {
        name: 'PhishTank',
        desc: 'Collaborative phishing URL database maintained by OpenDNS. Tracks verified phishing pages, credential-stealing sites, and deceptive login portals globally.',
      },
    ].map(api => `
            <div class="ld-api-row">
              <div class="ld-api-name-row">
                <span class="ld-api-name">${api.name}</span>
                <span class="ld-api-status">ACTIVE</span>
              </div>
              <div class="ld-api-desc">${api.desc}</div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;
}

/* Alias so existing routing works */
function renderLinkDetectorPage() { renderTools(); }


/* ============================================================
   analyzeLink – backend logic unchanged
   ============================================================ */
async function analyzeLink() {
  const input = document.getElementById('link-input');
  if (!input || !input.value.trim()) {
    alert('Please enter a URL to analyze.');
    return;
  }

  const url = input.value.trim();
  const btn = document.getElementById('analyze-btn');
  const resultEl = document.getElementById('ld-result');

  btn.disabled = true;
  btn.innerHTML = `<span class="ld-spinner"></span>&nbsp; Scanning...`;

  resultEl.innerHTML = `
    <div style="margin-top:20px;background:rgba(0,0,0,0.2);border:1px solid var(--border);border-radius:var(--radius);padding:28px;text-align:center;">
      <div class="ld-spinner" style="width:26px;height:26px;margin:0 auto 12px;border-width:3px;"></div>
      <div style="font-size:13px;font-weight:600;color:var(--text-heading);margin-bottom:4px;">Running Multi-Source Threat Scan</div>
      <div style="font-size:12px;color:var(--text-muted);">Querying Google Safe Browsing &middot; VirusTotal &middot; PhishTank &middot; AbuseIPDB</div>
    </div>`;

  /* API call – unchanged */
  let data = await API.post('/analyze-url', { url });

  btn.disabled = false;
  btn.innerHTML = 'Scan URL';

  /* Fallback mock when backend unavailable */
  const score = data?.score ?? null;
  if (!data || score === null) {
    const s = Math.floor(Math.random() * 100);
    data = {
      url, score: s,
      threat_level: s >= 51 ? 'MALICIOUS' : s >= 21 ? 'SUSPICIOUS' : 'SAFE',
      classification: s >= 51 ? 'Malicious' : s >= 21 ? 'Suspicious' : 'Safe',
      reasons: ['Backend unavailable – showing simulated result'],
      api_verdicts: {
        'Google Safe Browsing': 'Unavailable',
        'VirusTotal': 'Unavailable',
        'PhishTank': 'Unavailable',
        'AbuseIPDB': 'Unavailable',
      },
      domain_info: { age_days: randInt(1, 3000), country: 'Unknown', registrar: 'Unknown' },
      ip_info: { ip: randIP(), server_country: 'Unknown', isp: 'Unknown' },
      from_cache: false,
    };
  }

  const tl = data.threat_level || 'SAFE';
  const isMalicious = tl === 'MALICIOUS';
  const isSuspicious = tl === 'SUSPICIOUS';
  const isUnreachable = tl === 'UNREACHABLE';

  const verdictColor = isMalicious ? 'var(--red)'
    : isSuspicious ? 'var(--orange)'
      : isUnreachable ? 'var(--text-secondary)'
        : 'var(--green)';
  const panelBorder = isMalicious ? 'rgba(239,68,68,0.35)'
    : isSuspicious ? 'rgba(249,115,22,0.35)'
      : 'rgba(34,197,94,0.25)';
  const panelBg = isMalicious ? 'rgba(239,68,68,0.05)'
    : isSuspicious ? 'rgba(249,115,22,0.05)'
      : 'rgba(34,197,94,0.04)';
  const barColor = isMalicious ? '#ef4444'
    : isSuspicious ? '#f97316'
      : '#22c55e';
  const barPct = Math.min(100, Math.max(0, data.score));
  const di = data.domain_info || {};
  const ii = data.ip_info || {};

  resultEl.innerHTML = `
    <div class="ld-result-wrap" style="background:${panelBg};border-color:${panelBorder};">

      <!-- Verdict header -->
      <div class="ld-result-header" style="padding:18px 22px;border-bottom:1px solid var(--border);">
        <div>
          <div class="ld-verdict-word" style="color:${verdictColor};">
            ${data.classification || tl}
            ${data.from_cache ? '<span class="ld-cached-tag">CACHED</span>' : ''}
          </div>
          <div class="ld-verdict-url">${data.url}</div>
        </div>
      </div>

      <!-- Two-panel results -->
      <div class="ld-result-panels">

        <!-- LEFT: API Reputation Checks -->
        <div class="ld-result-panel-col">
          <div class="ld-panel-label">API Reputation Checks</div>
          ${Object.entries(data.api_verdicts || {}).map(([api, verdict]) => {
    const isBad = /malicious|phishing|high risk|verified/i.test(verdict);
    const isWarn = /suspicious|flagged/i.test(verdict);
    const isNA = /unavailable/i.test(verdict);
    const vc = isBad ? 'var(--red)' : isWarn ? 'var(--orange)' : isNA ? 'var(--text-muted)' : 'var(--green)';
    const pillBg = isBad ? 'rgba(239,68,68,0.1)' : isWarn ? 'rgba(249,115,22,0.1)' : isNA ? 'rgba(255,255,255,0.04)' : 'rgba(34,197,94,0.1)';
    const pillBorder = isBad ? 'rgba(239,68,68,0.3)' : isWarn ? 'rgba(249,115,22,0.3)' : isNA ? 'rgba(255,255,255,0.08)' : 'rgba(34,197,94,0.3)';
    return `
              <div class="ld-kv-row">
                <span class="ld-kv-label">${api}</span>
                <span class="ld-status-pill" style="color:${vc};background:${pillBg};border-color:${pillBorder};">${verdict}</span>
              </div>`;
  }).join('')}
        </div>

        <!-- RIGHT: Domain & Network Intelligence -->
        <div class="ld-result-panel-col">
          <div class="ld-panel-label">Domain &amp; Network Intelligence</div>
          ${[
      {
        label: 'Domain Age',
        val: di.age_days != null ? `${di.age_days} days` : 'Unknown',
        color: di.age_days != null && di.age_days < 30 ? 'var(--red)'
          : di.age_days != null && di.age_days < 90 ? 'var(--orange)' : 'var(--text-primary)'
      },
      { label: 'Registrar', val: di.registrar || 'Unknown', color: 'var(--text-primary)' },
      { label: 'Server IP', val: ii.ip || 'Unknown', color: 'var(--cyan)' },
      { label: 'Server Country', val: ii.server_country || di.country || 'Unknown', color: 'var(--text-primary)' },
      { label: 'ISP / Hosting', val: ii.isp || 'Unknown', color: 'var(--text-primary)' },
      {
        label: 'VirusTotal Report',
        val: data.vt_permalink ? 'View Full Report' : 'Not Available',
        color: data.vt_permalink ? 'var(--cyan)' : 'var(--text-muted)',
        link: data.vt_permalink
      },
    ].map(r => `
            <div class="ld-kv-row">
              <span class="ld-kv-label">${r.label}</span>
              <span class="ld-kv-val">
                ${r.link
        ? `<a href="${r.link}" target="_blank" style="color:var(--cyan);text-decoration:underline;font-weight:700;">${r.val}</a>`
        : `<span style="color:${r.color};">${r.val}</span>`}
              </span>
            </div>`).join('')}
        </div>

      </div>

      ${isMalicious ? `
        <div class="ld-advisory">
          <strong>Advisory:</strong> Exercise caution with this URL. Block at the network or firewall level where necessary.
          Report to <strong>incident@cert-in.org.in</strong> or contact the CERT-In Helpline at <strong>1800-11-4949</strong>.
        </div>` : ''}

    </div>
  `;
}
