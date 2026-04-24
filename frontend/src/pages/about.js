/**
 * About Page
 */
function renderAbout() {
  const container = document.getElementById('page-container');
  container.innerHTML = `
    <div class="about-hero">
      <div class="about-hero-title">CTI<span class="accent-green">India</span></div>
      <div style="font-size:16px;color:var(--text-secondary);margin-top:6px">National Cyber Threat Intelligence Platform</div>
      <div class="about-hero-sub">Final Year Project • Technical Prototype</div>
    </div>

    <div class="grid-1 mt24">
      <div class="glass-card">
        <div class="card-inner">
          <div class="section-title mb16">About the Platform</div>
          <p style="font-size:14px;color:var(--text-secondary);line-height:1.8;margin-bottom:12px">
            CTI India (Cyber Threat Intelligence India) is a centralized, real-time monitoring and threat intelligence platform designed to aggregate, analyze, and disseminate critical cybersecurity information. Built with a focus on India's digital ecosystem, the platform equips security professionals, organizations, and infrastructure defenders with the visibility needed to track emerging cyber threats and national alerts.
          </p>
        </div>
      </div>
    </div>

    <div class="grid-2 mt24">
      <div class="glass-card">
        <div class="card-inner">
          <div class="section-title mb16">Our Mission</div>
          <p style="font-size:14px;color:var(--text-secondary);line-height:1.8">
            Our mission is to strengthen India’s cybersecurity posture by providing actionable, timely, and verified intelligence. We aim to bridge the gap between complex cyber threat data and practical situational awareness, enabling incident responders, researchers, and administrators to proactively defend against nation-state actors, ransomware campaigns, and localized cyber attacks.
          </p>
        </div>
      </div>
      
      <div class="glass-card">
        <div class="card-inner">
          <div class="section-title mb16">What We Provide</div>
          <ul style="font-size:13px;color:var(--text-secondary);line-height:1.8;padding-left:20px;margin-top:8px;">
            <li style="margin-bottom:8px"><strong>Real-Time Cyber News:</strong> Continuous aggregation of verified cybersecurity advisories, threat reports, and intelligence localized to the Indian digital landscape.</li>
            <li style="margin-bottom:8px"><strong>National Alerts:</strong> High-severity warnings and critical vulnerability tracking, offering immediate visibility into active exploitations and infrastructure risks.</li>
            <li style="margin-bottom:8px"><strong>Centralized Dashboarding:</strong> A consolidated, distraction-free view of localized breach reports, phishing campaigns, and malware distribution tracking.</li>
            <li style="margin-bottom:8px"><strong>Actionable Insights:</strong> Clean, fast, and structured data delivery designed for rapid decision-making during active incident response scenarios.</li>
          </ul>
        </div>
      </div>
    </div>

    <div class="grid-2 mt24">
      <div class="glass-card">
        <div class="card-inner">
          <div class="section-title mb16" style="color:var(--status-warning)">Development Status</div>
          <p style="font-size:13px;color:var(--text-secondary);line-height:1.8;margin-bottom:12px;font-style:italic;">
            Please Note: CTI India is currently under active development. This environment represents a functional prototype designed for technical demonstration and academic review (Final Year Project). It is not yet deployed as a final production system.
          </p>
          <p style="font-size:13px;color:var(--text-secondary);line-height:1.8">
            While the core aggregation and real-time synchronization engines are operational, certain advanced data models and analytics capabilities are still in the testing phase. The platform's features and interfaces are subject to ongoing refinement.
          </p>
        </div>
      </div>

      <div class="glass-card">
        <div class="card-inner">
          <div class="section-title mb16">Future Roadmap</div>
          <ul style="font-size:13px;color:var(--text-secondary);line-height:1.8;padding-left:20px;margin-top:8px;">
            <li style="margin-bottom:6px"><strong>Automated Threat Mapping:</strong> Visual correlation and geographical tracking of cyber incidents originating from or targeting different Indian states.</li>
            <li style="margin-bottom:6px"><strong>Advanced Vulnerability Tracking:</strong> Deeper integration with national CVE databases to instantly alert organizations about zero-day vulnerabilities affecting regional infrastructure.</li>
            <li style="margin-bottom:6px"><strong>Developer API Access:</strong> Providing secure, RESTful API endpoints for external systems to dynamically query our threat intelligence database programmatically.</li>
          </ul>
        </div>
      </div>
    </div>
  `;
}
