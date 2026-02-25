/**
 * Cyber News Page
 */
function renderCyberNews() {
    const container = document.getElementById('page-container');
    const news = MockData.cyberNews();
    const catColors = { Advisory: 'var(--blue)', 'Threat Intel': 'var(--orange)', Incident: 'var(--red)', Phishing: 'var(--orange)', Vulnerability: 'var(--red)', Report: 'var(--cyan)', Malware: 'var(--red)' };

    container.innerHTML = `
    <div class="page-header">
      <div>
        <h2 class="page-title">📰 Cyber Security News</h2>
        <p class="page-subtitle">Latest advisories and threat intelligence from CERT-In, NCIIPC, and partner agencies</p>
      </div>
    </div>
    <div class="glass-card">
      <div class="card-inner" style="padding:0">
        ${news.map(n => `
          <div class="news-item">
            <div style="display:flex;align-items:flex-start;gap:12px">
              <div style="flex:1">
                <div style="display:flex;gap:8px;align-items:center;margin-bottom:6px">
                  <span style="font-size:10px;background:${catColors[n.category] || 'var(--cyan)'}22;color:${catColors[n.category] || 'var(--cyan)'};border:1px solid ${catColors[n.category] || 'var(--cyan)'}44;padding:2px 8px;border-radius:4px;font-weight:700">${n.category}</span>
                  <span style="font-size:11px;color:var(--text-muted)">${n.source}</span>
                </div>
                <div class="news-item-title">${n.headline}</div>
                <div class="news-item-body">${n.body}</div>
                <div class="news-item-meta">
                  <span>🕒 ${relativeTime(n.hours_ago * 60)}</span>
                  <a href="#" style="color:var(--cyan);font-size:11px">Read Full Advisory →</a>
                </div>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}
