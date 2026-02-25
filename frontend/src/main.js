/**
 * CTIIndia – National Cyber Threat Intelligence Platform
 * Main Application Router & Controller
 */

// ============================================================
// ROUTER
// ============================================================
const PAGE_MAP = {
    'overview': renderOverview,
    'early-warning': renderEarlyWarning,
    'threat-map': renderThreatMap,
    'analytics': renderAnalytics,
    'vulnerabilities': renderVulnerabilities,
    'ioc-database': renderIOCDatabase,
    'cyber-news': renderCyberNews,
    'national-alerts': renderNationalAlerts,
    'report-threat': renderReportThreat,
    'incident-tracker': renderIncidentTracker,
    'critical-infrastructure': renderCriticalInfrastructure,
    'sector-risk': renderSectorRisk,
    'link-detector': renderLinkDetectorPage,
    'ioc-search': renderIOCSearchPage,
    'about': renderAbout,
};

let currentPage = '';
let mapAnimCleanup = null;

function navigateTo(pageId) {
    // Cleanup previous page state
    disconnectAllWS();
    if (typeof mapAnimInterval !== 'undefined') clearInterval(mapAnimInterval);

    // Activate nav item
    document.querySelectorAll('.nav-item').forEach(el => {
        el.classList.toggle('active', el.dataset.page === pageId);
    });

    currentPage = pageId;
    const renderFn = PAGE_MAP[pageId];
    if (renderFn) {
        renderFn();
    } else {
        document.getElementById('page-container').innerHTML = `
      <div style="text-align:center;padding:80px 20px">
        <div style="font-size:60px;margin-bottom:16px">🔒</div>
        <h2 style="color:var(--text-heading)">Page Not Found</h2>
        <p style="color:var(--text-muted);margin-top:6px">The requested module is not available.</p>
      </div>
    `;
    }
}

// ============================================================
// HEADER CLOCK
// ============================================================
function updateClock() {
    const el = document.getElementById('header-clock');
    if (!el) return;
    const now = new Date();
    el.textContent = now.toLocaleTimeString('en-IN', { hour12: false }) + ' IST';
}

// ============================================================
// SIDEBAR TOGGLE
// ============================================================
function initSidebar() {
    const toggle = document.getElementById('sidebar-toggle');
    const sidebar = document.getElementById('sidebar');
    const main = document.querySelector('.main-content');

    if (!toggle || !sidebar || !main) return;

    toggle.addEventListener('click', () => {
        sidebar.classList.toggle('collapsed');
        main.classList.toggle('expanded');
    });

    // Nav groups toggle
    document.querySelectorAll('.nav-group-header').forEach(header => {
        header.addEventListener('click', () => {
            const groupId = header.dataset.group;
            const items = document.getElementById('group-' + groupId);
            if (items) {
                items.classList.toggle('collapsed');
                header.classList.toggle('collapsed');
            }
        });
    });

    // Nav item click
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            navigateTo(item.dataset.page);
        });
    });
}

// ============================================================
// HEADER TICKER
// ============================================================
function buildTicker() {
    const items = MockData.earlyWarningAlerts(8);
    const ticker = document.getElementById('header-ticker');
    if (ticker) {
        ticker.textContent = items.map(a =>
            `🔴 [${a.severity}] ${a.threat_type} → ${a.state} | ${a.sector}`
        ).join('   ◆   ');
    }
    // Refresh ticker every 30s
    setInterval(() => {
        const newItems = MockData.earlyWarningAlerts(8);
        if (ticker) ticker.textContent = newItems.map(a =>
            `🔴 [${a.severity}] ${a.threat_type} → ${a.state} | ${a.sector}`
        ).join('   ◆   ');
    }, 30000);
}

// ============================================================
// LOGIN
// ============================================================
function initLogin() {
    const form = document.getElementById('login-form');
    if (!form) return;

    form.addEventListener('submit', (e) => {
        e.preventDefault();
        const role = document.getElementById('role-select').value;
        const btn = form.querySelector('.login-btn');
        btn.disabled = true;
        btn.innerHTML = '<div class="loading-spinner" style="width:18px;height:18px;display:inline-block;margin-right:10px;vertical-align:middle"></div> Authenticating...';

        setTimeout(() => {
            // Show main app
            document.getElementById('login-screen').style.display = 'none';
            document.getElementById('app').style.display = 'block';

            // Set display role
            const roleLabel = { admin: 'ADMIN', analyst: 'ANALYST', officer: 'SECTOR OFFICER' };
            const el = document.getElementById('user-role-display');
            if (el) el.textContent = roleLabel[role] || 'ANALYST';

            initApp();
        }, 1800);
    });
}

// ============================================================
// LOGOUT
// ============================================================
function initLogout() {
    const btn = document.getElementById('logout-btn');
    if (!btn) return;
    btn.addEventListener('click', () => {
        if (confirm('Are you sure you want to logout?')) {
            disconnectAllWS();
            clearInterval(mapAnimInterval);
            document.getElementById('app').style.display = 'none';
            document.getElementById('login-screen').style.display = 'flex';
            document.getElementById('username').value = '';
            document.getElementById('password').value = '';
            const btn = document.querySelector('.login-btn');
            if (btn) { btn.disabled = false; btn.innerHTML = '<span class="btn-icon">🔐</span> Authenticate & Enter Platform'; }
        }
    });
}

// ============================================================
// INIT APP (after login)
// ============================================================
function initApp() {
    initSidebar();
    buildTicker();
    updateClock();
    setInterval(updateClock, 1000);
    navigateTo('overview');
}

// ============================================================
// BOOTSTRAP
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
    initApp();
});
