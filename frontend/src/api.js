/**
 * CTIIndia API Service
 * Centralized API calls and WebSocket connection management
 */

const API_BASE = 'http://localhost:8000/api';
const WS_BASE = 'ws://localhost:8000/ws';

const API = {
  async get(path) {
    try {
      const resp = await fetch(`${API_BASE}${path}`);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      return await resp.json();
    } catch (err) {
      console.warn(`API call failed: ${path}`, err);
      return null;
    }
  },
  async post(path, body) {
    try {
      const resp = await fetch(`${API_BASE}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      return await resp.json();
    } catch (err) {
      console.warn(`API POST failed: ${path}`, err);
      return null;
    }
  }
};

let wsConnections = {};

function connectWS(path, onMessage, onOpen) {
  if (wsConnections[path]) wsConnections[path].close();
  try {
    const ws = new WebSocket(`${WS_BASE}${path}`);
    ws.onopen = () => onOpen && onOpen();
    ws.onmessage = (e) => onMessage(JSON.parse(e.data));
    ws.onerror = () => console.warn(`WS error on ${path}`);
    ws.onclose = () => delete wsConnections[path];
    wsConnections[path] = ws;
    return ws;
  } catch {
    console.warn('WebSocket not available, using mock data');
    return null;
  }
}

function disconnectAllWS() {
  Object.values(wsConnections).forEach(ws => { try { ws.close(); } catch{} });
  wsConnections = {};
}

// ============================================================
// MOCK DATA (fallback when backend is unavailable)
// ============================================================
const THREAT_TYPES = ['DDoS', 'Phishing', 'Malware', 'Ransomware', 'APT', 'Data Breach', 'SQL Injection'];
const SEVERITIES = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];
const INDIA_STATES = ['Delhi', 'Maharashtra', 'Karnataka', 'Tamil Nadu', 'Uttar Pradesh', 'West Bengal', 'Telangana', 'Gujarat', 'Rajasthan', 'Kerala', 'Madhya Pradesh', 'Andhra Pradesh', 'Punjab', 'Haryana', 'Bihar'];
const SECTORS = ['Power & Energy', 'Telecom', 'Banking & Finance', 'Railways', 'Healthcare', 'Government IT', 'Defence', 'Water Supply'];
const CVE_VENDORS = ['Microsoft', 'Cisco', 'Apache', 'Linux Kernel', 'OpenSSL', 'Fortinet', 'VMware', 'Oracle'];
const CVE_TYPES = ['Remote Code Execution', 'Privilege Escalation', 'Authentication Bypass', 'Buffer Overflow', 'XSS', 'SSRF'];

function rand(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function randFloat(min, max) { return +(Math.random() * (max - min) + min).toFixed(1); }
function randIP() { return `${randInt(1,254)}.${randInt(0,254)}.${randInt(0,254)}.${randInt(1,254)}`; }
function randId(prefix, n=5) { return `${prefix}-${randInt(10**n, (10**(n+1))-1)}`; }
function relativeTime(minutesAgo) {
  if (minutesAgo < 1) return 'Just now';
  if (minutesAgo < 60) return `${minutesAgo}m ago`;
  const h = Math.floor(minutesAgo / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h/24)}d ago`;
}

const MockData = {
  overview: () => ({
    active_incidents: randInt(42, 78),
    critical_alerts: randInt(8, 22),
    threats_blocked_today: randInt(1200, 2800),
    sectors_affected: randInt(3, 7),
    national_risk_score: randFloat(6.5, 9.2),
    risk_level: 'HIGH',
    ioc_count: randInt(14500, 21000),
    vulnerabilities_open: randInt(230, 480)
  }),

  earlyWarningAlerts: (n = 12) => Array.from({length: n}, () => ({
    id: randId('EWA'),
    title: `${rand(THREAT_TYPES)} attack detected targeting ${rand(SECTORS)} in ${rand(INDIA_STATES)}`,
    severity: rand(SEVERITIES),
    state: rand(INDIA_STATES),
    sector: rand(SECTORS),
    threat_type: rand(THREAT_TYPES),
    minutes_ago: randInt(1, 120),
    source_ip: randIP(),
    confidence: randInt(75, 99)
  })).sort((a,b) => a.minutes_ago - b.minutes_ago),

  threatMap: (n = 30) => Array.from({length: n}, () => {
    const src = rand(INDIA_STATES);
    const dst = rand(INDIA_STATES.filter(s => s !== src));
    return { id: randId('ATK'), source_state: src, target_state: dst, threat_type: rand(THREAT_TYPES), severity: rand(SEVERITIES) };
  }),

  analytics: () => {
    const months = ['Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb'];
    return {
      monthly_trend: months.map(m => ({ month: m, attacks: randInt(800, 3000) })),
      sector_analysis: SECTORS.map(s => ({ sector: s, attacks: randInt(50, 500), risk_score: randFloat(4.0, 9.8) })),
      threat_distribution: THREAT_TYPES.map(t => ({ type: t, count: randInt(100, 800) }))
    };
  },

  vulnerabilities: (n = 25) => Array.from({length: n}, (_, i) => {
    const vendor = rand(CVE_VENDORS);
    return {
      id: `CVE-${[2023,2024,2025][randInt(0,2)]}-${randInt(10000, 50000)}`,
      title: `${vendor} ${rand(CVE_TYPES)} Vulnerability`,
      severity: rand(SEVERITIES),
      cvss_score: randFloat(4.0, 10.0),
      vendor,
      affected_product: `${vendor} Suite v${randInt(1,15)}.${randInt(0,9)}`,
      days_ago: randInt(1, 90),
      patch_available: Math.random() > 0.4,
      sectors_affected: Array.from({length: randInt(1,4)}, () => rand(SECTORS))
    };
  }).sort((a,b) => b.cvss_score - a.cvss_score),

  iocs: (n = 50) => Array.from({length: n}, () => {
    const types = ['IP Address', 'Domain', 'File Hash (MD5)', 'SHA256 Hash', 'URL', 'Email'];
    const t = rand(types);
    let value;
    if (t === 'IP Address') value = randIP();
    else if (t === 'Domain') value = `${'abcdefghij'.split('').sort(() => .5 - Math.random()).join('').slice(0,8)}.malicious.xyz`;
    else if (t.includes('Hash')) value = '0123456789abcdef'.repeat(4).slice(0, t === 'File Hash (MD5)' ? 32 : 64);
    else if (t === 'URL') value = `https://malware-cdn.xyz/${Math.random().toString(36).slice(2,10)}/payload.exe`;
    else value = `phish_${Math.random().toString(36).slice(2,8)}@spoof.net`;
    return {
      id: randId('IOC'),
      type: t, value,
      reputation_score: randInt(10, 99),
      tags: Array.from({length: randInt(1,3)}, () => rand(THREAT_TYPES)),
      days_ago: randInt(0, 30),
      source: rand(['CERT-In', 'NCIIPC', 'Manual Report', 'Honeypot', 'Open Source Intel']),
      country: rand(['China', 'Russia', 'North Korea', 'Unknown', 'Pakistan', 'Iran'])
    };
  }),

  incidents: (n = 20) => Array.from({length: n}, (_, i) => {
    const status = rand(['OPEN', 'INVESTIGATING', 'RESOLVED', 'ESCALATED']);
    return {
      ticket_id: `INC-${2025000 + i}`,
      title: `${rand(THREAT_TYPES)} Incident in ${rand(INDIA_STATES)} ${rand(SECTORS)}`,
      status, severity: rand(SEVERITIES),
      sector: rand(SECTORS), state: rand(INDIA_STATES),
      hours_ago: randInt(1, 720),
      assigned_to: `Team_${rand(['Alpha','Bravo','Charlie','Delta'])}`,
      description: `Detected suspicious activity targeting critical infrastructure.`,
      iocs_linked: randInt(0, 8)
    };
  }),

  sectors: () => SECTORS.map(name => ({
    name,
    risk_score: randFloat(3.5, 9.8),
    active_incidents: randInt(0, 15),
    threats_last_30d: randInt(20, 450),
    status: rand(['NORMAL', 'ELEVATED', 'HIGH ALERT', 'CRITICAL']),
    icon: { 'Power & Energy':'⚡', Telecom:'📡', 'Banking & Finance':'🏦', Railways:'🚂', Healthcare:'🏥', 'Government IT':'🖥', Defence:'🛡', 'Water Supply':'💧' }[name]
  })).sort((a,b) => b.risk_score - a.risk_score),

  cyberNews: () => [
    { headline: 'CERT-In Issues Advisory on Critical Infrastructure Vulnerabilities', body: 'The Indian Computer Emergency Response Team has issued an advisory regarding multiple critical vulnerabilities affecting power grid SCADA systems.', source: 'CERT-In', hours_ago: 2, category: 'Advisory' },
    { headline: 'State-Sponsored APT Group Targets Indian Banking Sector', body: 'A sophisticated APT group has been identified launching targeted spear-phishing campaigns against major Indian banks.', source: 'NCIIPC', hours_ago: 5, category: 'Threat Intel' },
    { headline: 'Ransomware Attack Disrupts Healthcare Network in UP', body: 'A ransomware strain has been detected affecting hospital management systems across Uttar Pradesh, with operations partially disrupted.', source: 'MHA Cyber Division', hours_ago: 8, category: 'Incident' },
    { headline: 'New Phishing Campaign Impersonates Income Tax Department', body: 'Cybercriminals are deploying mass phishing campaigns impersonating the Income Tax Department ahead of the filing season.', source: 'CERT-In', hours_ago: 12, category: 'Phishing' },
    { headline: 'Critical Zero-Day in Widely Used VPN Software Exploited', body: 'A zero-day vulnerability in a popular enterprise VPN solution is being actively exploited, affecting Indian government networks.', source: 'NCIIPC', hours_ago: 18, category: 'Vulnerability' },
    { headline: 'India Ranks 4th in Global DDoS Attack Target List', body: 'According to the latest global threat report, India has climbed to 4th place as a primary target of DDoS attacks in Q4 2025.', source: 'Threat Report 2025', hours_ago: 24, category: 'Report' },
    { headline: 'Telegram-Based C2 Malware Targets Indian Defence Contractors', body: 'A sophisticated malware campaign using Telegram as a command-and-control channel has been targeting Indian defence supply chain companies.', source: 'DRDO CERT', hours_ago: 36, category: 'Malware' },
  ],

  nationalAlerts: () => [
    { id: 'NCIIPC-2025-001', title: 'CRITICAL: Active Exploitation of CVE-2025-23811 in Industrial Control Systems', severity: 'CRITICAL', issued_by: 'NCIIPC', hours_ago: 1, sectors: ['Power & Energy', 'Water Supply'], description: 'Actively exploited by nation-state actors. Immediate patching required.' },
    { id: 'CERT-2025-089', title: 'HIGH: Mass Credential Stuffing Campaign Targeting .gov.in Portals', severity: 'HIGH', issued_by: 'CERT-In', hours_ago: 4, sectors: ['Government IT'], description: 'Large-scale automated credential stuffing attacks observed against government login portals.' },
    { id: 'NCIIPC-2025-097', title: 'HIGH: BGP Hijacking Attempts Against Indian Telecom Providers', severity: 'HIGH', issued_by: 'NCIIPC', hours_ago: 6, sectors: ['Telecom'], description: 'Multiple BGP route hijacking attempts detected targeting major Indian ISPs.' },
    { id: 'CERT-2025-102', title: 'MEDIUM: Spike in Banking Trojan Distribution via Android APKs', severity: 'MEDIUM', issued_by: 'CERT-In', hours_ago: 12, sectors: ['Banking & Finance'], description: 'Fake UPI apps distributing banking trojans detected on third-party app stores.' },
    { id: 'NCIIPC-2025-108', title: 'MEDIUM: Supply Chain Compromise in Open-Source Library', severity: 'MEDIUM', issued_by: 'NCIIPC', hours_ago: 20, sectors: ['Government IT', 'Defence'], description: 'Malicious code injected into a widely-used open-source cryptography library.' },
  ]
};
