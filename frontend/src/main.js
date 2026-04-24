/**
 * CTIIndia – National Cyber Threat Intelligence Platform
 * Main Application Router & Controller
 */


// ROUTER

const PAGE_MAP = {
    'threat-map': renderThreatMap,
    'vulnerabilities': renderVulnerabilities,
    'cyber-news': renderCyberNews,
    'report-threat': renderReportThreat,
    'link-detector': renderLinkDetectorPage,
    'api': renderApi,
    'about': renderAbout,
};

let currentPage = '';

function navigateTo(pageId) {
    // Cleanup previous page state
    disconnectAllWS();
    if (typeof window.tmCleanup === 'function') window.tmCleanup();

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
        <h2 style="color:var(--text-heading)">Page Not Found</h2>
        <p style="color:var(--text-muted);margin-top:6px">The requested module is not available.</p>
      </div>
    `;
    }
}


// HEADER CLOCK

function updateClock() {
    const el = document.getElementById('header-clock');
    if (!el) return;
    const now = new Date();
    el.textContent = now.toLocaleTimeString('en-IN', { hour12: false }) + ' IST';
}


// SIDEBAR TOGGLE

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

// INIT APP

function initApp() {
    initSidebar();
    updateClock();
    setInterval(updateClock, 1000);
    navigateTo('threat-map');
}


// BOOTSTRAP

document.addEventListener('DOMContentLoaded', () => {
    initApp();
});
