/**
 * Cyber News Page
 * Professional grid layout with source filtering, domain badges, and About section.
 * Backend API and WebSocket logic unchanged.
 */
async function renderCyberNews() {
  const container = document.getElementById('page-container');

  const styleId = 'cyber-news-styles';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      /* ── Filter bar ── */
      .cn-controls {
        display: flex;
        gap: 12px;
        align-items: center;
        flex-wrap: wrap;
        margin-bottom: 24px;
      }
      .cn-meta-pill {
        font-size: 11px;
        font-weight: 600;
        color: var(--text-muted);
        background: rgba(255,255,255,0.04);
        border: 1px solid var(--border);
        padding: 5px 12px;
        border-radius: var(--radius);
        white-space: nowrap;
      }
      .cn-meta-pill span { color: var(--cyan); }
      .cn-select {
        height: 34px;
        padding: 0 12px;
        background: var(--bg-input, rgba(0,0,0,0.25));
        border: 1px solid var(--border);
        border-radius: var(--radius);
        color: var(--text-primary);
        font-size: 12px;
        cursor: pointer;
        outline: none;
        transition: border-color 0.2s;
      }
      .cn-select:focus { border-color: var(--cyan); }

      /* ── News grid ── */
      .cn-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 18px;
        margin-bottom: 28px;
      }
      @media (max-width: 680px) { .cn-grid { grid-template-columns: 1fr; } }

      /* ── News card ── */
      .cn-card {
        background: var(--bg-card, #122A3F);
        border: 1px solid var(--border);
        border-radius: 10px;
        display: flex;
        flex-direction: column;
        transition: border-color 0.2s, filter 0.2s;
        overflow: hidden;
      }
      .cn-card:hover {
        border-color: rgba(56,189,248,0.3);
        filter: brightness(1.06);
      }
      .cn-card-body {
        padding: 20px 22px;
        display: flex;
        flex-direction: column;
        flex: 1;
      }
      .cn-card-meta {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 12px;
        flex-wrap: wrap;
        gap: 6px;
      }
      .cn-domain-badge {
        font-size: 10px;
        font-weight: 700;
        letter-spacing: 0.4px;
        color: var(--text-muted);
        background: rgba(255,255,255,0.04);
        border: 1px solid var(--border);
        padding: 2px 8px;
        border-radius: 4px;
        font-family: var(--font-mono);
      }
      .cn-date {
        font-size: 11px;
        color: var(--text-muted);
        font-family: var(--font-mono);
      }
      .cn-card-title {
        font-size: 14px;
        font-weight: 700;
        line-height: 1.55;
        color: var(--text-heading);
        margin-bottom: 10px;
        flex-grow: 1;
      }
      .cn-card-source {
        font-size: 11px;
        color: var(--text-secondary);
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.6px;
        margin-bottom: 16px;
        padding-bottom: 14px;
        border-bottom: 1px solid var(--border);
      }
      .cn-read-btn {
        display: inline-block;
        align-self: flex-start;
        padding: 7px 16px;
        border: 1px solid var(--cyan);
        border-radius: var(--radius);
        color: var(--cyan);
        font-size: 12px;
        font-weight: 600;
        text-decoration: none;
        background: transparent;
        transition: background 0.2s, box-shadow 0.2s;
      }
      .cn-read-btn:hover {
        background: rgba(56,189,248,0.08);
        box-shadow: 0 0 10px rgba(56,189,248,0.15);
      }

      /* ── New card highlight ── */
      @keyframes cn-fade-in {
        from { opacity: 0; transform: translateY(-8px); }
        to   { opacity: 1; transform: translateY(0); }
      }
      .cn-new-item {
        animation: cn-fade-in 0.5s ease forwards;
        border-color: rgba(56,189,248,0.4) !important;
      }

      /* ── Empty state ── */
      .cn-empty {
        grid-column: 1 / -1;
        padding: 48px;
        text-align: center;
        color: var(--text-muted);
        font-size: 13px;
        background: var(--bg-card, #122A3F);
        border: 1px solid var(--border);
        border-radius: 10px;
      }

      /* ── About block ── */
      .cn-about-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        gap: 14px;
        margin-top: 18px;
      }
      .cn-about-cell {
        background: rgba(56,189,248,0.03);
        border: 1px solid rgba(56,189,248,0.1);
        border-radius: var(--radius);
        padding: 16px;
      }
      .cn-about-cell-title {
        font-size: 12px;
        font-weight: 700;
        color: var(--text-heading);
        margin-bottom: 5px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      .cn-about-cell-desc { font-size: 12px; color: var(--text-secondary); line-height: 1.65; }
    `;
    document.head.appendChild(style);
  }

  container.innerHTML = `
    <!-- PAGE HEADER -->
    <div class="page-header" style="margin-bottom:24px;">
      <div>
        <h2 class="page-title">Cyber Security News &amp; National Updates</h2>
        <p class="page-subtitle">Latest verified cybersecurity developments across India</p>
      </div>
    </div>

    <!-- NEWS GRID -->
    <div class="cn-grid" id="cn-feed">
      <div class="cn-empty">Connecting to news feed...</div>
    </div>

    <!-- ABOUT SECTION -->
    <div class="glass-card">
      <div class="card-inner" style="padding:26px 30px;">
        <div class="section-title mb16">About This News Feed</div>
        <p style="font-size:13px;color:var(--text-secondary);line-height:1.8;margin-bottom:0;">
          This feed aggregates verified cybersecurity updates and advisories directly relevant to India's digital infrastructure, government networks, and critical sectors.
        </p>
        <div class="cn-about-grid">
          ${[
      { title: 'Verified Sources', desc: 'All news items are sourced from recognized cybersecurity bodies, national agencies, and established media outlets.' },
      { title: 'Coverage Scope', desc: 'Focused on incidents affecting government IT, banking, critical infrastructure, telecom, and defence sectors.' },
      { title: 'Feed Refresh', desc: 'The feed is updated periodically via live sync from backend aggregators and monitored threat intelligence services.' },
      { title: 'Platform Status', desc: 'This platform is under active development. Additional filtering, tagging, and analysis features are planned.' },
    ].map(b => `
            <div class="cn-about-cell">
              <div class="cn-about-cell-title">${b.title}</div>
              <div class="cn-about-cell-desc">${b.desc}</div>
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;

  /* ── State ── */
  let _allItems = [];

  function cnCard(n, isNew = false) {
    const date = new Date(n.published_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
    return `
      <div class="cn-card ${isNew ? 'cn-new-item' : ''}" id="incident-${n.id}">
        <div class="cn-card-body">
          <div class="cn-card-meta">
            <span></span>
            <span class="cn-date">${date}</span>
          </div>
          <div class="cn-card-title">${n.title}</div>
          <div class="cn-card-source">${n.source || 'Unknown Source'}</div>
          <a href="${n.link}" target="_blank" rel="noopener" class="cn-read-btn">Read Full Article</a>
        </div>
      </div>`;
  }

  /* ── Fetch ── */
  try {
    const data = await API.get('/india-incidents');
    const feed = document.getElementById('cn-feed');

    if (!data || !data.incidents || data.incidents.length === 0) {
      feed.innerHTML = '<div class="cn-empty">No recent advisories at this time.</div>';
      return;
    }

    // Sort latest first and render
    const items = data.incidents.sort((a, b) => new Date(b.published_at) - new Date(a.published_at));
    feed.innerHTML = items.map(n => cnCard(n)).join('');

    /* WebSocket for live inserts */
    const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${protocol}//${location.host}/ws/live-incidents`);
    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'new_incident' && msg.data) {
          _allItems.unshift(msg.data);
          const feedEl = document.getElementById('cn-feed');
          if (feedEl) {
            feedEl.insertAdjacentHTML('afterbegin', cnCard(msg.data, true));
            setTimeout(() => {
              const el = document.getElementById(`incident-${msg.data.id}`);
              if (el) el.classList.remove('cn-new-item');
            }, 3000);
          }
        }
      } catch (err) { console.error('Error parsing live incident:', err); }
    };
    window.activeWebSockets = window.activeWebSockets || [];
    window.activeWebSockets.push(ws);

  } catch (e) {
    console.error(e);
    const feed = document.getElementById('cn-feed');
    if (feed) feed.innerHTML = '<div class="cn-empty" style="color:var(--red);">Failed to connect to the news feed. Ensure the backend is running.</div>';
  }
}
