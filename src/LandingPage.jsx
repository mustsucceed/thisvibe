import { useState } from 'react';
import './LandingPage.css';

const ChevronDown = () => (
  <svg className="lp-faq-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);

const modes = [
  {
    icon: "🎸",
    title: "Solo Match",
    desc: "One-on-one connections with someone on your wavelength. Deep conversations, real friendships.",
  },
  {
    icon: "🔥",
    title: "Group Vibes",
    desc: "Connect with small groups sharing your energy. Fun, casual, and completely natural.",
  },
  {
    icon: "⚡",
    title: "Speed Connect",
    desc: "Fast-paced matching based on instant chemistry. Skip the small talk and jump right in.",
  },
];

const steps = [
  { num: "i",   title: "Build your profile",  desc: "Share your vibe — interests, mood, what kind of connection you're looking for." },
  { num: "ii",  title: "Pick your mode",       desc: "Choose between Solo Match, Group Vibes, or rapid-fire Speed Connect." },
  { num: "iii", title: "Get matched instantly", desc: "Our real-time engine pairs you with live users. No waiting, no algorithms." },
  { num: "iv",  title: "Connect for real",     desc: "Jump straight into a video chat and see if the energy matches." },
];

const safety = [
  {
    icon: "🔞",
    title: "Strict 18+ Gate",
    desc: "Every profile undergoes secure age verification during onboarding. Access is denied instantly for underage users.",
  },
  {
    icon: "🛡️",
    title: "Real-Time AI Protection",
    desc: "Our safety model scans video feeds locally. Explicit content triggers an instant blur, match drop, and hardware ban.",
  },
  {
    icon: "🚨",
    title: "One-Click Reporting",
    desc: "See something uncomfortable? Hit report to instantly cut the feed and flag the offender for human review.",
  },
];

const faqs = [
  {
    q: "What is the.vibe?",
    a: "the.vibe is a live video matching platform built to bridge the gap between digital strangers and genuine friends — no timelines, no algorithmic friction.",
  },
  {
    q: "Can I video chat with strangers?",
    a: "Yes. The platform is designed around safe, live video interactions where you meet verified people who share your exact mood.",
  },
  {
    q: "Is the.vibe safe to use?",
    a: "Absolutely. Safety is our top priority. We run real-time AI moderation on all video feeds alongside strict age-validation gates to protect everyone on the platform.",
  },
  {
    q: "Is it free to join?",
    a: "Yes — joining and basic matching are completely free. the.vibe Plus unlocks HD quality, priority matching, and advanced filters.",
  },
];

export default function LandingPage({ onJoinAction, onSignInAction }) {
  const [openFaq, setOpenFaq] = useState(null);

  return (
    <div className="lp-root">

      {/* ── Navbar ──────────────────────────────────────── */}
      <nav className="lp-nav">
        <span className="lp-logo">the<em>.vibe</em></span>

        <ul className="lp-nav-links">
          <li><a href="#modes">Discover</a></li>
          <li><a href="#how">How it works</a></li>
          <li><a href="#safety">Safety</a></li>
        </ul>

        <div className="lp-nav-actions">
          <button className="btn-ghost" onClick={onSignInAction} type="button">
            Sign in
          </button>
          <button className="btn-primary" onClick={onJoinAction} type="button">
            Join free
          </button>
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────── */}
      <header className="lp-hero">
        <div>
          <div className="lp-hero-badge">
            <span className="lp-hero-badge-dot" />
            12,000 people online right now
          </div>

          <h1 className="lp-hero-title">
            From strangers<br />
            to <span className="accent">real friends</span>,<br />
            one click away.
          </h1>

          <p className="lp-hero-desc">
            Match with people who share your energy — solo hangouts or group sessions.
            No algorithms, no timelines. Just genuine human connection.
          </p>

          <div className="lp-hero-actions">
            <button className="btn-primary btn-primary--lg" onClick={onJoinAction} type="button">
              Start connecting →
            </button>
            <button className="btn-ghost" onClick={onSignInAction} type="button">
              Sign in
            </button>
          </div>

          <div className="lp-hero-social-proof">
            <div className="lp-avatar-stack">
              <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=64&h=64&fit=crop" alt="" />
              <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=64&h=64&fit=crop" alt="" />
              <img src="https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=64&h=64&fit=crop" alt="" />
              <img src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=64&h=64&fit=crop" alt="" />
            </div>
            <p className="lp-social-proof-text">
              <strong>100,000+</strong> connections made<br />
              <strong>97%</strong> match satisfaction rate
            </p>
          </div>
        </div>

        <div className="lp-phone-wrap">
          <div className="lp-phone-glow" />
          <div className="lp-phone">
            <div className="lp-phone-notch" />
            <div className="lp-phone-video">
              <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400" alt="User" />
              <div className="lp-phone-label">
                <span className="lp-phone-label-dot" />
                Marta, 22
              </div>
            </div>
            <div className="lp-phone-divider" />
            <div className="lp-phone-video">
              <img src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=400" alt="You" />
              <div className="lp-phone-label">You</div>
            </div>
          </div>
        </div>
      </header>

      {/* ── Stats ───────────────────────────────────────── */}
      <section className="lp-stats">
        <div className="lp-stats-inner">
          <div className="lp-stat">
            <div className="lp-stat-num">97%</div>
            <div className="lp-stat-label">Match satisfaction</div>
          </div>
          <div className="lp-stat-divider" />
          <div className="lp-stat">
            <div className="lp-stat-num">100k+</div>
            <div className="lp-stat-label">Satisfied users</div>
          </div>
          <div className="lp-stat-divider" />
          <div className="lp-stat">
            <div className="lp-stat-num">&lt;3s</div>
            <div className="lp-stat-label">Avg. match time</div>
          </div>
        </div>
      </section>

      {/* ── Modes ───────────────────────────────────────── */}
      <section id="modes" className="lp-section">
        <p className="lp-section-tag">Choose your mode</p>
        <h2 className="lp-section-title">Connect your way</h2>
        <div className="lp-grid-3">
          {modes.map((m, i) => (
            <div key={i} className="lp-card">
              <div className="lp-card-icon">{m.icon}</div>
              <h3 className="lp-card-title">{m.title}</h3>
              <p className="lp-card-desc">{m.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── How it works ────────────────────────────────── */}
      <section id="how" className="lp-section-full">
        <div className="lp-section">
          <p className="lp-section-tag">How it works</p>
          <h2 className="lp-section-title">Live in four steps</h2>
          <div className="lp-grid-4">
            {steps.map((s, i) => (
              <div key={i} className="lp-card">
                <div className="lp-card-icon">
                  <span className="lp-step-num">{s.num}</span>
                </div>
                <h3 className="lp-card-title">{s.title}</h3>
                <p className="lp-card-desc">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Safety ──────────────────────────────────────── */}
      <section id="safety" className="lp-section">
        <p className="lp-section-tag">Safety first</p>
        <h2 className="lp-section-title">Built safe from day one</h2>
        <div className="lp-grid-3">
          {safety.map((s, i) => (
            <div key={i} className="lp-card">
              <div className="lp-card-icon">{s.icon}</div>
              <h3 className="lp-card-title">{s.title}</h3>
              <p className="lp-card-desc">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────────────── */}
      <div className="lp-section-full">
        <div className="lp-cta">
          <div className="lp-cta-inner">
            <h2 className="lp-cta-title">
              Ready to find your <span className="accent">people?</span>
            </h2>
            <p className="lp-cta-sub">Free to join. No awkwardness. Just vibe.</p>
            <button className="btn-primary btn-primary--lg" onClick={onJoinAction} type="button">
              Start connecting →
            </button>
          </div>
        </div>
      </div>

      {/* ── FAQ ─────────────────────────────────────────── */}
      <section className="lp-faq">
        <h2 className="lp-faq-title">Frequently asked questions</h2>
        <div className="lp-faq-list">
          {faqs.map((faq, i) => (
            <div key={i} className={`lp-faq-item ${openFaq === i ? "open" : ""}`}>
              <button
                className="lp-faq-trigger"
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
                type="button"
                aria-expanded={openFaq === i}
              >
                <span>{faq.q}</span>
                <ChevronDown />
              </button>
              <div className="lp-faq-body" role="region">
                <p>{faq.a}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────── */}
      <footer className="lp-footer">
        <div className="lp-footer-inner">
          <p className="lp-footer-copy">© {new Date().getFullYear()} the.vibe. All rights reserved.</p>
          <ul className="lp-footer-links">
            <li><a href="#">Privacy</a></li>
            <li><a href="#">Terms</a></li>
            <li><a href="#">Safety</a></li>
            <li><a href="#">Contact</a></li>
          </ul>
        </div>
      </footer>

    </div>
  );
}