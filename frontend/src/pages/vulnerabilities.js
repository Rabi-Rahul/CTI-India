/**
 * Vulnerability ML Analyzer + AI CVE Search
 */

// ─── Suggestion bank ──────────────────────────────────────────────────────────
const AI_SUGGESTIONS = [
  "apache remote code execution",
  "openssl critical vulnerabilities",
  "windows privilege escalation",
  "log4j exploits",
  "SQL injection high severity",
  "kubernetes container escape",
  "wordpress plugin RCE",
  "Microsoft Exchange zero-day",
  "Linux kernel local privilege escalation",
  "Chrome browser memory corruption",
  "SSH brute force vulnerabilities",
  "Docker container breakout",
  "PHP file upload bypass",
  "SSRF critical severity 2024",
  "Android remote code execution",
  "VMware critical CVEs",
  "nginx buffer overflow",
  "Cisco IOS vulnerabilities",
  "Spring framework RCE",
  "Active Directory attacks",
];

// ─── Search history (session) ────────────────────────────────────────────────
let _cveSearchHistory = JSON.parse(
  sessionStorage.getItem("cve_search_history") || "[]"
);

function _saveToHistory(query) {
  if (!_cveSearchHistory.includes(query)) {
    _cveSearchHistory.unshift(query);
    if (_cveSearchHistory.length > 10) _cveSearchHistory.pop();
    sessionStorage.setItem("cve_search_history", JSON.stringify(_cveSearchHistory));
  }
}

// ─── Page renderer ────────────────────────────────────────────────────────────
async function renderVulnerabilities() {
  const container = document.getElementById("page-container");

  _injectVulnStyles();

  container.innerHTML = `
    <!-- ── PAGE HEADER ── -->
    <div class="page-header">
      <div>
        <h2 class="page-title">Vulnerability Intelligence</h2>
        <p class="page-subtitle">AI-powered CVE search &amp; ML exploitation risk analyzer</p>
      </div>
    </div>

    <!-- ══════════════════════════════════════════════════════
         SECTION 1 — AI CVE SEARCH
    ══════════════════════════════════════════════════════ -->
    <div class="glass-card ai-search-card">
      <div class="card-inner">

        <!-- Header -->
        <div class="ai-search-header">
          <div class="ai-badge">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2a7 7 0 0 1 7 7c0 5.25-7 13-7 13S5 14.25 5 9a7 7 0 0 1 7-7z"/><circle cx="12" cy="9" r="2.5"/></svg>
            AI Engine
          </div>
          <div class="ai-search-title">Natural Language CVE Search</div>
          <div class="ai-search-sub">Search real vulnerabilities from NVD using plain English</div>
        </div>

        <!-- Search bar -->
        <div class="ai-search-wrap" id="ai-search-wrap">
          <div class="ai-search-icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          </div>
          <input
            id="ai-cve-input"
            class="ai-search-input"
            type="text"
            placeholder='e.g. "apache remote code execution" or "windows privilege escalation"'
            autocomplete="off"
            spellcheck="false"
          />
          <button id="ai-clear-btn" class="ai-clear-btn" onclick="aiClearSearch()" title="Clear" style="display:none">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
          <button id="ai-search-btn" class="ai-search-btn" onclick="aiCveSearch()">
            <span id="ai-btn-label">Search CVEs</span>
          </button>

          <!-- Dropdown (autocomplete) -->
          <div id="ai-dropdown" class="ai-dropdown" style="display:none"></div>
        </div>

        <!-- Quick chips -->
        <div class="ai-chips" id="ai-chips">
          ${AI_SUGGESTIONS.slice(0, 6).map(s =>
            `<button class="ai-chip" onclick="aiChipSearch('${s.replace(/'/g, "\\'")}')">${s}</button>`
          ).join("")}
        </div>

        <!-- Status / stats bar -->
        <div id="ai-status-bar" class="ai-status-bar" style="display:none"></div>

        <!-- Loading skeleton -->
        <div id="ai-loading" class="ai-loading" style="display:none">
          <div class="ai-spinner"></div>
          <div>
            <div class="ai-load-title">Querying NVD database…</div>
            <div class="ai-load-sub">Extracting keywords and ranking results</div>
          </div>
        </div>

        <!-- Results table -->
        <div id="ai-results" style="display:none">
          <div class="ai-result-table-wrap">
            <table class="ai-result-table" id="ai-result-table">
              <thead>
                <tr>
                  <th>CVE ID</th>
                  <th>Description</th>
                  <th>Severity</th>
                  <th>CVSS</th>
                  <th>Published</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody id="ai-result-body"></tbody>
            </table>
          </div>
        </div>

        <!-- Empty state -->
        <div id="ai-empty" class="ai-empty" style="display:none">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <p>No vulnerabilities found for this query.</p>
          <p class="ai-empty-sub">Try different keywords or check spelling.</p>
        </div>

        <!-- Error state -->
        <div id="ai-error" class="ai-error-box" style="display:none"></div>

        <!-- History -->
        <div id="ai-history-wrap" class="ai-history-wrap">
          <div class="ai-history-label">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 .49-4.5"/></svg>
            Recent searches
          </div>
          <div id="ai-history-list" class="ai-history-list"></div>
        </div>
      </div>
    </div>

    <!-- ══════════════════════════════════════════════════════
         SECTION 2 — ML RISK ANALYZER (unchanged)
    ══════════════════════════════════════════════════════ -->
    <div class="page-section-divider">
      <span>ML Exploitation Risk Analyzer</span>
    </div>

    <div class="vuln-grid">
      <div class="glass-card">
        <div class="card-inner">
          <div class="section-title mb16">Analyze Vulnerability</div>

          <div class="vuln-form-grid">
            <div class="full form-group">
              <label for="description">CVE Description</label>
              <textarea id="description" class="form-textarea" rows="6"
                placeholder="Describe the vulnerability behavior, attack path, and impact…"></textarea>
            </div>

            <div class="form-group">
              <label for="product">Product Name</label>
              <input id="product" class="form-input" type="text"
                placeholder="e.g. Apache Struts, OpenSSL" />
            </div>

            <div class="form-group">
              <label for="cvss">CVSS Score (0–10)</label>
              <input id="cvss" class="form-input" type="number"
                min="0" max="10" step="0.1" value="7.5" />
            </div>
          </div>

          <div style="display:flex; gap:12px; margin-top:6px; flex-wrap:wrap;">
            <button id="analyze-btn" class="btn-primary"
              onclick="analyzeVulnerability()">Analyze Vulnerability</button>
            <button class="btn-secondary" onclick="resetVulnForm()">Reset</button>
          </div>

          <div id="vuln-error" class="vuln-error"></div>
        </div>
      </div>

      <div class="glass-card">
        <div class="card-inner">
          <div class="section-title mb16">Prediction Result</div>
          <div class="result-card">
            <div class="result-row">
              <span style="color:var(--text-secondary)">Risk Score</span>
              <strong id="risk">-</strong>
            </div>
            <div class="result-row">
              <span style="color:var(--text-secondary)">Priority</span>
              <span id="priority" class="priority-pill">-</span>
            </div>
            <div class="result-row">
              <span style="color:var(--text-secondary)">Probability</span>
              <strong id="probability">-</strong>
            </div>
          </div>
          <p style="margin-top:12px; font-size:12px; color:var(--text-muted); line-height:1.7;">
            Priority is color coded: low (green), medium (amber), critical (red).
          </p>
        </div>
      </div>
    </div>
  `;

  _initAiSearchEvents();
  _renderHistory();
}

// ─── AI Search Logic ──────────────────────────────────────────────────────────

async function aiCveSearch(queryOverride) {
  const input = document.getElementById("ai-cve-input");
  const query = (queryOverride || input?.value || "").trim();
  if (!query) {
    input?.focus();
    return;
  }

  if (input) input.value = query;
  _saveToHistory(query);
  _renderHistory();

  // UI → loading
  _aiSetState("loading");

  try {
    const resp = await fetch("/api/ai-cve-search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
    });

    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}));
      throw new Error(err.detail || `HTTP ${resp.status}`);
    }

    const data = await resp.json();

    if (!data.results || data.results.length === 0) {
      _aiSetState("empty");
      return;
    }

    _renderResults(data, query);
    _aiSetState("results");

    const bar = document.getElementById("ai-status-bar");
    if (bar) {
      bar.style.display = "flex";
      bar.innerHTML = `
        <span class="ai-status-pill">🔍 Keywords: <strong>${_escape(data.keywords_used)}</strong></span>
        <span class="ai-status-pill">📊 NVD total matches: <strong>${data.total_found.toLocaleString()}</strong></span>
        <span class="ai-status-pill">✅ Showing top <strong>${data.results.length}</strong></span>
      `;
    }
  } catch (err) {
    _aiSetState("error", err.message);
  }
}

function aiChipSearch(text) {
  const input = document.getElementById("ai-cve-input");
  if (input) input.value = text;
  aiCveSearch(text);
}

function aiClearSearch() {
  const input = document.getElementById("ai-cve-input");
  if (input) input.value = "";
  _aiSetState("idle");
  const bar = document.getElementById("ai-status-bar");
  if (bar) bar.style.display = "none";
  const clearBtn = document.getElementById("ai-clear-btn");
  if (clearBtn) clearBtn.style.display = "none";
}

function _aiSetState(state, message) {
  const els = {
    loading: document.getElementById("ai-loading"),
    results: document.getElementById("ai-results"),
    empty:   document.getElementById("ai-empty"),
    error:   document.getElementById("ai-error"),
  };
  Object.values(els).forEach(el => { if (el) el.style.display = "none"; });

  const btn   = document.getElementById("ai-search-btn");
  const label = document.getElementById("ai-btn-label");

  if (state === "loading") {
    if (els.loading) els.loading.style.display = "flex";
    if (label) label.textContent = "Searching…";
    if (btn)   btn.disabled = true;
  } else {
    if (label) label.textContent = "Search CVEs";
    if (btn)   btn.disabled = false;
    if (state === "results" && els.results) els.results.style.display = "block";
    if (state === "empty"   && els.empty)   els.empty.style.display   = "flex";
    if (state === "error"   && els.error) {
      els.error.style.display = "block";
      els.error.innerHTML     = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <span>${_escape(message || "Unknown error. Please try again.")}</span>
      `;
    }
  }
}

// ─── Results renderer ─────────────────────────────────────────────────────────

function _renderResults(data, query) {
  const tbody = document.getElementById("ai-result-body");
  if (!tbody) return;

  const keywords = (data.keywords_used || query).toLowerCase().split(" ").filter(k => k.length > 2);

  tbody.innerHTML = data.results.map((cve, idx) => {
    const sev   = cve.severity || "UNKNOWN";
    const score = cve.cvss_score != null ? Number(cve.cvss_score).toFixed(1) : "N/A";
    const desc  = _highlightKeywords(_escape(cve.description), keywords);
    const sevCls = `sev-${sev.toLowerCase()}`;

    return `
      <tr class="ai-result-row" style="animation-delay:${idx * 30}ms">
        <td>
          <a class="cve-id-link" href="${cve.url}" target="_blank" rel="noopener">
            ${_escape(cve.cve_id)}
          </a>
        </td>
        <td class="ai-desc-cell" title="${_escape(cve.description)}">${desc}</td>
        <td><span class="sev-badge ${sevCls}">${sev}</span></td>
        <td class="cvss-score ${sevCls}">${score}</td>
        <td class="pub-date">${_escape(cve.published)}</td>
        <td>
          <button class="ai-analyze-btn"
            onclick="aiSendToAnalyzer('${_escape(cve.cve_id)}', \`${cve.description.replace(/`/g,"'")}\`)"
            title="Send to ML Analyzer">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
            </svg>
            Analyze
          </button>
        </td>
      </tr>
    `;
  }).join("");
}

// Auto-fill ML Analyzer from a CVE result
function aiSendToAnalyzer(cveId, description) {
  const descEl = document.getElementById("description");
  const prodEl = document.getElementById("product");

  if (descEl) descEl.value = description;
  if (prodEl) prodEl.value = cveId;

  // Scroll down to analyzer
  const analyzerEl = prodEl?.closest(".vuln-grid");
  if (analyzerEl) {
    analyzerEl.scrollIntoView({ behavior: "smooth", block: "start" });
    analyzerEl.style.boxShadow = "0 0 0 2px rgba(59,130,246,0.6)";
    setTimeout(() => { analyzerEl.style.boxShadow = ""; }, 2000);
  }
}

// ─── Autocomplete ─────────────────────────────────────────────────────────────

function _initAiSearchEvents() {
  const input    = document.getElementById("ai-cve-input");
  const dropdown = document.getElementById("ai-dropdown");
  const clearBtn = document.getElementById("ai-clear-btn");

  if (!input) return;

  input.addEventListener("input", () => {
    const val = input.value.trim().toLowerCase();
    if (clearBtn) clearBtn.style.display = val ? "flex" : "none";

    if (!val || val.length < 2) {
      if (dropdown) dropdown.style.display = "none";
      return;
    }

    const combined = [...AI_SUGGESTIONS, ..._cveSearchHistory];
    const matches  = [...new Set(combined)]
      .filter(s => s.toLowerCase().includes(val))
      .slice(0, 8);

    if (!matches.length) {
      if (dropdown) dropdown.style.display = "none";
      return;
    }

    if (dropdown) {
      dropdown.style.display = "block";
      dropdown.innerHTML = matches.map(m => `
        <div class="ai-dd-item" onmousedown="aiSelectSuggestion('${m.replace(/'/g,"\\'")}')">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          ${_highlightKeywords(_escape(m), [val])}
        </div>
      `).join("");
    }
  });

  input.addEventListener("keydown", e => {
    if (e.key === "Enter") {
      if (dropdown) dropdown.style.display = "none";
      aiCveSearch();
    }
    if (e.key === "Escape") {
      if (dropdown) dropdown.style.display = "none";
    }
  });

  input.addEventListener("blur", () => {
    setTimeout(() => { if (dropdown) dropdown.style.display = "none"; }, 150);
  });
}

function aiSelectSuggestion(text) {
  const input = document.getElementById("ai-cve-input");
  if (input) { input.value = text; input.focus(); }
  const dd = document.getElementById("ai-dropdown");
  if (dd) dd.style.display = "none";
  const clearBtn = document.getElementById("ai-clear-btn");
  if (clearBtn) clearBtn.style.display = "flex";
}

// ─── History ──────────────────────────────────────────────────────────────────

function _renderHistory() {
  const wrap = document.getElementById("ai-history-wrap");
  const list = document.getElementById("ai-history-list");
  if (!list) return;

  if (!_cveSearchHistory.length) {
    if (wrap) wrap.style.display = "none";
    return;
  }

  if (wrap) wrap.style.display = "block";
  list.innerHTML = _cveSearchHistory.map(q => `
    <button class="ai-history-item" onclick="aiChipSearch('${q.replace(/'/g,"\\'")}')">
      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="1 4 1 10 7 10"/>
        <path d="M3.51 15a9 9 0 1 0 .49-4.5"/>
      </svg>
      ${_escape(q)}
    </button>
  `).join("");
}

// ─── Utility ──────────────────────────────────────────────────────────────────

function _escape(str) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function _highlightKeywords(html, keywords) {
  keywords.forEach(kw => {
    if (kw.length < 3) return;
    const regex = new RegExp(`(${kw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
    html = html.replace(regex, `<mark class="ai-highlight">$1</mark>`);
  });
  return html;
}

// ─── ML Analyzer (preserved exactly) ─────────────────────────────────────────

function _showVulnError(message) {
  const el = document.getElementById("vuln-error");
  if (!el) return;
  el.textContent = message;
  el.style.display = "block";
}

function _clearVulnError() {
  const el = document.getElementById("vuln-error");
  if (!el) return;
  el.textContent = "";
  el.style.display = "none";
}

function _setPriorityPill(priority) {
  const pill = document.getElementById("priority");
  if (!pill) return;
  pill.className = "priority-pill";
  const n = String(priority || "").toLowerCase();
  if (n === "critical") pill.classList.add("priority-critical");
  else if (n === "medium") pill.classList.add("priority-medium");
  else if (n === "low") pill.classList.add("priority-low");
  pill.textContent = priority || "-";
}

function resetVulnForm() {
  const description = document.getElementById("description");
  const product     = document.getElementById("product");
  const cvss        = document.getElementById("cvss");
  if (description) description.value = "";
  if (product)     product.value     = "";
  if (cvss)        cvss.value        = "7.5";
  document.getElementById("risk").textContent = "-";
  _setPriorityPill("-");
  document.getElementById("probability").textContent = "-";
  _clearVulnError();
}

async function analyzeVulnerability() {
  _clearVulnError();
  const description = (document.getElementById("description")?.value || "").trim();
  const product     = (document.getElementById("product")?.value || "").trim();
  const cvssValue   = document.getElementById("cvss")?.value;
  const cvss        = Number.parseFloat(cvssValue);

  if (!description || !product || Number.isNaN(cvss)) {
    _showVulnError("Please provide description, product name, and a valid CVSS score.");
    return;
  }
  if (cvss < 0 || cvss > 10) {
    _showVulnError("CVSS score must be between 0 and 10.");
    return;
  }

  const analyzeBtn    = document.getElementById("analyze-btn");
  const originalLabel = analyzeBtn ? analyzeBtn.innerHTML : "";
  if (analyzeBtn) {
    analyzeBtn.disabled = true;
    analyzeBtn.innerHTML = '<span class="vuln-spinner"></span>Analyzing…';
  }

  try {
    const response = await fetch("/api/predict", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ description, product, cvss }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.detail || "Prediction request failed");

    document.getElementById("risk").textContent   = `${Number(data.risk_score).toFixed(2)}%`;
    _setPriorityPill(data.priority);
    document.getElementById("probability").textContent = data.probability;
  } catch (err) {
    _showVulnError(`Prediction failed: ${err.message}`);
  } finally {
    if (analyzeBtn) {
      analyzeBtn.disabled    = false;
      analyzeBtn.innerHTML   = originalLabel;
    }
  }
}

// ─── CSS Injection ────────────────────────────────────────────────────────────

function _injectVulnStyles() {
  if (document.getElementById("vuln-ai-styles")) return;
  const style = document.createElement("style");
  style.id = "vuln-ai-styles";
  style.textContent = `
/* ─── existing ML analyzer styles ──────────────────────────────── */
.vuln-grid        { display:grid; grid-template-columns:2fr 1fr; gap:18px; }
.vuln-form-grid   { display:grid; grid-template-columns:1fr 1fr; gap:12px; }
.vuln-form-grid .full { grid-column:1/-1; }
.vuln-spinner     { display:inline-block; width:14px; height:14px;
  border:2px solid rgba(255,255,255,.2); border-top-color:#020617;
  border-radius:50%; animation:vuln-spin .7s linear infinite;
  margin-right:8px; vertical-align:-2px; }
@keyframes vuln-spin { to { transform:rotate(360deg); } }
.result-card      { border:1px solid var(--border); border-radius:var(--radius);
  padding:14px; background:rgba(0,0,0,.2); }
.result-row       { display:flex; justify-content:space-between; gap:10px;
  padding:8px 0; border-bottom:1px solid rgba(255,255,255,.05); }
.result-row:last-child { border-bottom:none; }
.priority-pill    { display:inline-block; padding:3px 10px; border-radius:999px;
  font-size:11px; font-weight:700; border:1px solid; }
.priority-low     { color:#22c55e; border-color:rgba(34,197,94,.4); background:rgba(34,197,94,.12); }
.priority-medium  { color:#f59e0b; border-color:rgba(245,158,11,.4); background:rgba(245,158,11,.12); }
.priority-critical{ color:#ef4444; border-color:rgba(239,68,68,.4); background:rgba(239,68,68,.12); }
.vuln-error       { margin-top:12px; padding:10px 12px;
  border-left:3px solid #ef4444; border-radius:0 var(--radius) var(--radius) 0;
  background:rgba(239,68,68,.08); color:#fecaca; font-size:12px; display:none; }
@media(max-width:860px){ .vuln-grid{ grid-template-columns:1fr; } }
@media(max-width:640px){ .vuln-form-grid{ grid-template-columns:1fr; } }

/* ─── section divider ───────────────────────────────────────────── */
.page-section-divider {
  display:flex; align-items:center; gap:14px; margin:28px 0 18px;
  color:rgba(148,163,184,.6); font-size:11px; letter-spacing:1.5px; text-transform:uppercase;
}
.page-section-divider::before,
.page-section-divider::after {
  content:""; flex:1; height:1px; background:rgba(255,255,255,.06);
}

/* ─── AI search card ────────────────────────────────────────────── */
.ai-search-card { margin-bottom:6px; }

.ai-search-header { margin-bottom:20px; }
.ai-badge {
  display:inline-flex; align-items:center; gap:6px;
  background:rgba(99,102,241,.12); border:1px solid rgba(99,102,241,.3);
  border-radius:999px; padding:3px 10px; font-size:10px; font-weight:700;
  letter-spacing:1px; color:#a5b4fc; margin-bottom:10px; text-transform:uppercase;
}
.ai-search-title { font-size:18px; font-weight:700; color:var(--text-primary); margin-bottom:4px; }
.ai-search-sub   { font-size:12px; color:var(--text-muted); }

/* search bar */
.ai-search-wrap {
  position:relative; display:flex; align-items:center;
  background:rgba(15,23,42,.8); border:1px solid rgba(99,102,241,.35);
  border-radius:10px; padding:0 10px 0 14px; gap:8px;
  transition:border-color .2s, box-shadow .2s;
}
.ai-search-wrap:focus-within {
  border-color:rgba(99,102,241,.7);
  box-shadow:0 0 0 3px rgba(99,102,241,.12), 0 0 20px rgba(99,102,241,.08);
}
.ai-search-icon { color:rgba(148,163,184,.5); flex-shrink:0; }
.ai-search-input {
  flex:1; background:transparent; border:none; outline:none;
  color:var(--text-primary); font-size:14px; padding:14px 0;
  font-family:inherit; min-width:0;
}
.ai-search-input::placeholder { color:rgba(100,116,139,.7); }
.ai-clear-btn {
  display:flex; align-items:center; justify-content:center;
  width:22px; height:22px; border:none; background:rgba(148,163,184,.1);
  border-radius:50%; cursor:pointer; color:rgba(148,163,184,.7);
  transition:background .15s; flex-shrink:0; padding:0;
}
.ai-clear-btn:hover { background:rgba(148,163,184,.2); }
.ai-search-btn {
  flex-shrink:0; background:linear-gradient(135deg,#6366f1,#4f46e5);
  border:none; border-radius:7px; color:#fff; font-weight:600;
  font-size:13px; padding:9px 18px; cursor:pointer; white-space:nowrap;
  transition:all .2s; font-family:inherit;
}
.ai-search-btn:hover:not(:disabled) {
  background:linear-gradient(135deg,#818cf8,#6366f1);
  box-shadow:0 0 16px rgba(99,102,241,.35);
}
.ai-search-btn:disabled { opacity:.55; cursor:not-allowed; }

/* dropdown */
.ai-dropdown {
  position:absolute; top:calc(100% + 6px); left:0; right:0; z-index:100;
  background:#0f172a; border:1px solid rgba(99,102,241,.25);
  border-radius:8px; overflow:hidden;
  box-shadow:0 12px 32px rgba(0,0,0,.5);
}
.ai-dd-item {
  display:flex; align-items:center; gap:8px; padding:10px 14px;
  font-size:13px; color:var(--text-secondary); cursor:pointer;
  transition:background .12s;
}
.ai-dd-item:hover { background:rgba(99,102,241,.1); color:var(--text-primary); }
.ai-dd-item svg { flex-shrink:0; color:rgba(99,102,241,.6); }

/* quick chips */
.ai-chips { display:flex; flex-wrap:wrap; gap:7px; margin-top:12px; }
.ai-chip {
  background:rgba(30,41,59,.7); border:1px solid rgba(99,102,241,.2);
  border-radius:999px; color:rgba(148,163,184,.85); font-size:11px;
  padding:4px 12px; cursor:pointer; transition:all .2s; font-family:inherit;
}
.ai-chip:hover {
  background:rgba(99,102,241,.15); border-color:rgba(99,102,241,.5);
  color:#c7d2fe; box-shadow:0 0 8px rgba(99,102,241,.15);
}

/* status bar */
.ai-status-bar {
  display:flex; flex-wrap:wrap; gap:8px; margin-top:16px;
  padding:8px 12px; background:rgba(99,102,241,.06);
  border:1px solid rgba(99,102,241,.12); border-radius:6px;
}
.ai-status-pill { font-size:11px; color:rgba(148,163,184,.8); }
.ai-status-pill strong { color:#c7d2fe; }

/* loading */
.ai-loading {
  display:flex; align-items:center; gap:16px;
  margin-top:20px; padding:16px;
  background:rgba(99,102,241,.05); border:1px solid rgba(99,102,241,.1);
  border-radius:8px;
}
.ai-spinner {
  width:28px; height:28px; border:2px solid rgba(99,102,241,.2);
  border-top-color:#6366f1; border-radius:50%; flex-shrink:0;
  animation:ai-spin .8s linear infinite;
}
@keyframes ai-spin { to { transform:rotate(360deg); } }
.ai-load-title { font-size:14px; font-weight:600; color:var(--text-primary); }
.ai-load-sub   { font-size:12px; color:var(--text-muted); margin-top:2px; }

/* results table */
.ai-result-table-wrap { overflow-x:auto; margin-top:16px; border-radius:8px; overflow:hidden; }
.ai-result-table {
  width:100%; border-collapse:collapse; font-size:12px;
}
.ai-result-table thead tr {
  background:rgba(15,23,42,.9);
  border-bottom:1px solid rgba(99,102,241,.2);
}
.ai-result-table th {
  padding:10px 14px; text-align:left; font-size:10px;
  letter-spacing:1px; text-transform:uppercase; color:rgba(100,116,139,.8);
  white-space:nowrap;
}
.ai-result-row {
  border-bottom:1px solid rgba(255,255,255,.04);
  transition:background .15s;
  animation:ai-row-in .25s ease both;
}
@keyframes ai-row-in { from { opacity:0; transform:translateY(6px); } to { opacity:1; } }
.ai-result-row:hover { background:rgba(99,102,241,.07); }
.ai-result-table td  { padding:11px 14px; vertical-align:middle; }

.cve-id-link {
  font-family:'Share Tech Mono',monospace; font-size:11px; font-weight:700;
  color:#818cf8; text-decoration:none; white-space:nowrap;
}
.cve-id-link:hover { color:#c7d2fe; text-decoration:underline; }

.ai-desc-cell {
  max-width:420px; overflow:hidden;
  display:-webkit-box; -webkit-box-orient:vertical; -webkit-line-clamp:2;
  color:rgba(148,163,184,.9); line-height:1.5;
}

/* severity badges */
.sev-badge {
  display:inline-block; padding:3px 9px; border-radius:4px;
  font-size:10px; font-weight:700; letter-spacing:.5px; white-space:nowrap;
}
.sev-critical { background:rgba(239,68,68,.15); color:#f87171; border:1px solid rgba(239,68,68,.3); }
.sev-high     { background:rgba(245,158,11,.12); color:#fbbf24; border:1px solid rgba(245,158,11,.25); }
.sev-medium   { background:rgba(234,179,8,.1);  color:#facc15; border:1px solid rgba(234,179,8,.2); }
.sev-low      { background:rgba(34,197,94,.1);  color:#4ade80; border:1px solid rgba(34,197,94,.2); }
.sev-unknown  { background:rgba(100,116,139,.1); color:#94a3b8; border:1px solid rgba(100,116,139,.2); }

.cvss-score   { font-weight:700; font-size:13px; }
.cvss-score.sev-critical { color:#f87171; }
.cvss-score.sev-high     { color:#fbbf24; }
.cvss-score.sev-medium   { color:#facc15; }
.cvss-score.sev-low      { color:#4ade80; }

.pub-date { color:rgba(100,116,139,.8); font-size:11px; white-space:nowrap; }

.ai-analyze-btn {
  display:inline-flex; align-items:center; gap:5px;
  background:rgba(99,102,241,.1); border:1px solid rgba(99,102,241,.25);
  border-radius:5px; color:#818cf8; font-size:11px; padding:4px 9px;
  cursor:pointer; transition:all .15s; white-space:nowrap; font-family:inherit;
}
.ai-analyze-btn:hover {
  background:rgba(99,102,241,.2); border-color:rgba(99,102,241,.5);
  box-shadow:0 0 8px rgba(99,102,241,.2);
}

/* highlight */
.ai-highlight {
  background:rgba(250,204,21,.18); color:#fef08a;
  border-radius:2px; padding:0 2px;
}

/* empty & error */
.ai-empty {
  flex-direction:column; align-items:center; gap:10px;
  padding:40px 20px; text-align:center;
  color:rgba(100,116,139,.7); font-size:14px;
}
.ai-empty svg { opacity:.4; }
.ai-empty-sub { font-size:12px; color:rgba(100,116,139,.5); }
.ai-error-box {
  display:flex; align-items:flex-start; gap:10px; margin-top:16px;
  padding:12px 14px; background:rgba(239,68,68,.08);
  border:1px solid rgba(239,68,68,.25); border-radius:7px;
  color:#fca5a5; font-size:13px;
}
.ai-error-box svg { flex-shrink:0; margin-top:2px; }

/* history */
.ai-history-wrap { margin-top:14px; }
.ai-history-label {
  display:flex; align-items:center; gap:5px; font-size:10px;
  letter-spacing:1px; text-transform:uppercase; color:rgba(100,116,139,.6);
  margin-bottom:6px;
}
.ai-history-list { display:flex; flex-wrap:wrap; gap:6px; }
.ai-history-item {
  background:rgba(15,23,42,.7); border:1px solid rgba(255,255,255,.07);
  border-radius:5px; color:rgba(148,163,184,.7); font-size:11px;
  padding:4px 10px; cursor:pointer; display:flex; align-items:center;
  gap:5px; transition:all .15s; font-family:inherit;
}
.ai-history-item:hover {
  background:rgba(99,102,241,.1); border-color:rgba(99,102,241,.3);
  color:#c7d2fe;
}
  `;
  document.head.appendChild(style);
}
