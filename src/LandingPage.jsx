import React, { useState } from 'react';
import './LandingPage.css';

export default function LandingPage({ onJoinAction }) {
  const [openFaq, setOpenFaq] = useState(null);

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const modes = [
    {
      icon: "🎸",
      title: "Solo Match",
      desc: "One-on-one connections with someone on your wavelength. Deep conversations, real friendships."
    },
    {
      icon: "🔥",
      title: "Group Vibes",
      desc: "Connect with small groups sharing your energy. Fun, casual, and completely natural."
    },
    {
      icon: "⚡",
      title: "Speed Connect",
      desc: "Fast-paced matching based on instant chemistry. Skip the small talk and jump right in."
    }
  ];

  const steps = [
    { num: "i", title: "Build your profile", desc: "Share your vibe — interests, mood, what kind of connection you're looking for." },
    { num: "ii", title: "Pick your mode", desc: "Choose between Solo Match, Group Vibes, or rapid-fire Speed Connect." },
    { num: "iii", title: "Get matched", desc: "Our real-time engine pairs you up with live users instantly. No waiting." },
    { num: "iv", title: "Connect for real", desc: "Jump straight into a video chat and see if the energy matches." }
  ];

  return (
    <div className="vibe-container">
      
      {/* --- NAVBAR --- */}
      <nav className="vibe-nav">
        <div className="vibe-logo">
          the<span>.vibe</span>
        </div>
        <div className="vibe-nav-links">
          <a href="#how">How it works</a>
          <a href="#modes">Discover</a>
          <a href="#safety">Safety</a>
        </div>
        <button className="vibe-btn-primary nav-btn" onClick={onJoinAction}>
          Join now
        </button>
      </nav>

      {/* --- HERO SECTION --- */}
      <header className="vibe-hero">
        <div className="vibe-hero-left">
          <div className="vibe-badge">
            <span className="vibe-badge-dot"></span>
            12,000 active right now
          </div>
          
          <h1 className="vibe-hero-title">
            From strangers<br />
            to <span className="highlight">real friends</span>,<br />
            one click away.
          </h1>
          
          <p className="vibe-hero-desc">
            Match with people who share your energy — solo hangouts or group sessions. 
            No algorithms, no timelines. Just genuine connection.
          </p>
          
          <div className="vibe-hero-actions">
            <button className="vibe-btn-primary" onClick={onJoinAction}>
              Start connecting &rarr;
            </button>
            <button className="vibe-btn-secondary">
              See how it works
            </button>
          </div>
        </div>

        <div className="vibe-hero-right">
          <div className="phone-mockup">
            <div className="video-feed feed-top">
              <img 
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400" 
                alt="User 1" 
              />
              <span className="feed-tag">Marta, 22</span>
            </div>
            <div className="video-feed feed-bottom">
              <img 
                src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=400" 
                alt="User 2" 
              />
              <span className="feed-tag">You</span>
            </div>
          </div>
        </div>
      </header>

      {/* --- STATS SECTION --- */}
      <section className="vibe-stats">
        <div className="stat-box">
          <div className="stat-number">97%</div>
          <div className="stat-label">Match satisfaction</div>
        </div>
        <div className="stat-divider"></div>
        <div className="stat-box">
          <div className="stat-number">&gt;100k</div>
          <div className="stat-label">Satisfied users</div>
        </div>
      </section>

      {/* --- MODES SECTION --- */}
      <section id="modes" className="vibe-modes-section">
        <p className="section-tagline">Choose your mode</p>
        <div className="vibe-modes-grid">
          {modes.map((mode, i) => (
            <div key={i} className="mode-card">
              <div className="mode-icon-wrapper">{mode.icon}</div>
              <h3 className="mode-title">{mode.title}</h3>
              <p className="mode-desc">{mode.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* --- HOW IT WORKS SECTION --- */}
      <section id="how" className="vibe-how-section">
        <p className="section-tagline">How it works</p>
        <div className="vibe-how-grid">
          {steps.map((step, i) => (
            <div key={i} className="mode-card">
              <div className="mode-icon-wrapper font-serif-step">{step.num}</div>
              <h3 className="mode-title">{step.title}</h3>
              <p className="mode-desc">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* --- SAFETY SECTION --- */}
      <section id="safety" className="vibe-safety-section">
        <p className="section-tagline">Safety First</p>
        <div className="vibe-modes-grid">
          <div className="mode-card">
            <div className="mode-icon-wrapper">🔞</div>
            <h3 className="mode-title">Strict 18+ Gate</h3>
            <p className="mode-desc">Every profile undergoes biometric age estimation or secure ID verification during onboarding. If you are under 18, access is denied instantly.</p>
          </div>
          <div className="mode-card">
            <div className="mode-icon-wrapper">🛡️</div>
            <h3 className="mode-title">Real-Time AI Protection</h3>
            <p className="mode-desc">Our intelligent safety model scans video feeds locally. If explicit content or nudity is detected, the screen instantly blurs, the match drops, and the offender faces a permanent hardware ban.</p>
          </div>
          <div className="mode-card">
            <div className="mode-icon-wrapper">🚨</div>
            <h3 className="mode-title">One-Click Instant Reporting</h3>
            <p className="mode-desc">See something uncomfortable? Hit report to instantly cut the video feed. The system flags the offender for human review and guarantees your paths will never cross again.</p>
          </div>
        </div>
      </section>

      {/* --- CTA SECTION --- */}
      <section className="vibe-cta">
        <h2>Ready to find your <span className="highlight">people?</span></h2>
        <p>Free to join. No awkwardness. Just vibe.</p>
        <button className="vibe-btn-primary" onClick={onJoinAction}>
          Start connecting &rarr;
        </button>
      </section>

      {/* --- FAQs SECTION --- */}
      <section className="vibe-faqs">
        <h2>FAQs</h2>
        <div className="faq-list">
          {/* Static UI representation of specific FAQ schema items requested */}
          <div className="faq-item">
            <button className="faq-trigger" onClick={() => toggleFaq(0)}>
              <span>What is TheVibe?</span>
              <span className="faq-plus">＋</span>
            </button>
            <div className="faq-content" style={{maxHeight: openFaq === 0 ? '200px' : '0'}}>
              <p>the.vibe (formerly wonder) is a live video matching platform built to bridge the gap between digital strangers and genuine friends without pipelines or algorithm stress.</p>
            </div>
          </div>
          <div className="faq-item">
            <button className="faq-trigger" onClick={() => toggleFaq(1)}>
              <span>Can I video chat with strangers?</span>
              <span className="faq-plus">＋</span>
            </button>
            <div className="faq-content" style={{maxHeight: openFaq === 1 ? '200px' : '0'}}>
              <p>Yes! The platform is designed around safe, live video interactions where you can meet verified people sharing your exact mood.</p>
            </div>
          </div>
          <div className="faq-item">
            <button className="faq-trigger" onClick={() => toggleFaq(2)}>
              <span>Is wonder safe to use?</span>
              <span className="faq-plus">＋</span>
            </button>
            <div className="faq-content" style={{maxHeight: openFaq === 2 ? '200px' : '0'}}>
              <p>Absolutely. Safety is our priority. We feature real-time automated AI moderation filters and strict age validation gates to protect everyone.</p>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}