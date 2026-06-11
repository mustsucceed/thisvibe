import { useState, useEffect, useRef } from "react";
import landingHeroBg from "./assets/landing-hero-bg.png";
import modesEnergyBg from "./assets/modes-energy-bg.png";
import "./LandingPage.css";

// ── Intersection Observer hook for scroll reveals ──────────
function useReveal(threshold = 0.15) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { threshold },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);

  return [ref, visible];
}

// ── Animated counter ──────────────────────────────────────
function AnimatedCounter({
  target,
  duration = 2000,
  suffix = "",
  prefix = "",
}) {
  const [count, setCount] = useState(0);
  const [ref, visible] = useReveal(0.3);
  const started = useRef(false);

  useEffect(() => {
    if (!visible || started.current) return;
    started.current = true;
    const start = Date.now();
    const tick = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * target));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [visible, target, duration]);

  const formatted =
    count >= 1000000
      ? (count / 1000000).toFixed(1) + "M"
      : count >= 1000
        ? (count / 1000).toFixed(0) + "k"
        : count.toString();

  return (
    <span ref={ref} className="counter-value">
      {prefix}
      {formatted}
      {suffix}
    </span>
  );
}

// ── Reveal wrapper ────────────────────────────────────────
function Reveal({ children, className = "", delay = 0, direction = "up" }) {
  const [ref, visible] = useReveal(0.1);
  return (
    <div
      ref={ref}
      className={`reveal reveal-${direction} ${visible ? "revealed" : ""} ${className}`}
      style={{ transitionDelay: visible ? `${delay}ms` : "0ms" }}
    >
      {children}
    </div>
  );
}

// ── Live user counter (simulates real-time fluctuation) ───
function LiveCounter() {
  const [count, setCount] = useState(12847);
  useEffect(() => {
    const interval = setInterval(() => {
      setCount((c) => c + Math.floor(Math.random() * 7) - 3);
    }, 2800);
    return () => clearInterval(interval);
  }, []);
  return <span className="hero-live-num">{count.toLocaleString()}</span>;
}

const yellowFaceEmojis = [
  "😀",
  "😄",
  "😁",
  "😆",
  "😊",
  "😎",
  "🤩",
  "😘",
  "😜",
  "🤪",
  "🥳",
  "😇",
];

export default function LandingPage({
  onJoinAction,
  onSignInAction,
  onGroupVibesAction,
}) {
  const [openFaq, setOpenFaq] = useState(null);
  const [scrolled, setScrolled] = useState(false);
  const [scrollEmoji, setScrollEmoji] = useState(
    () => yellowFaceEmojis[Math.floor(Math.random() * yellowFaceEmojis.length)],
  );
  const [scrollEmojiSize, setScrollEmojiSize] = useState(48);
  const lastEmojiCornerRef = useRef(-1);

  const toggleFaq = (i) => setOpenFaq(openFaq === i ? null : i);

  const scrollTo = (id) =>
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });

  const handleModeAction = (modeId) => {
    if (modeId === "vibes") {
      onGroupVibesAction?.();
      return;
    }

    onJoinAction?.(true);
  };

  // Navbar background on scroll
  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  useEffect(() => {
    let frameId = 0;

    const getScrollProgress = () => {
      const scrollable =
        document.documentElement.scrollHeight - window.innerHeight;

      if (scrollable <= 0) {
        return 0;
      }

      return Math.min(Math.max(window.scrollY / scrollable, 0), 1);
    };

    const getCornerIndex = (progress) => {
      const cornerStops = [0, 0.18, 0.28, 0.5, 0.58, 0.76, 1];
      const activeCorner = cornerStops.findIndex(
        (stop) => Math.abs(progress - stop) < 0.025,
      );

      return activeCorner;
    };

    const updateEmoji = () => {
      const progress = getScrollProgress();
      const wave = Math.sin(progress * Math.PI * 8);
      const wobble = Math.sin(progress * Math.PI * 21);
      const nextSize = Math.round(48 + wave * 8 + wobble * 4);
      const cornerIndex = getCornerIndex(progress);

      setScrollEmojiSize(Math.max(38, Math.min(62, nextSize)));

      if (cornerIndex !== -1 && cornerIndex !== lastEmojiCornerRef.current) {
        lastEmojiCornerRef.current = cornerIndex;
        setScrollEmoji((currentEmoji) => {
          const nextOptions = yellowFaceEmojis.filter(
            (emoji) => emoji !== currentEmoji,
          );

          return nextOptions[Math.floor(Math.random() * nextOptions.length)];
        });
      }

      if (cornerIndex === -1) {
        lastEmojiCornerRef.current = -1;
      }
    };

    const handleScroll = () => {
      window.cancelAnimationFrame(frameId);
      frameId = window.requestAnimationFrame(updateEmoji);
    };

    updateEmoji();
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll);

    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, []);

  const modes = [
    {
      id: "solo",
      icon: "🎯",
      tag: "Most popular",
      tagColor: "purple",
      title: "Solo Matching",
      desc: "One-on-one live video with someone on your exact wavelength. Skip the small talk and get to the real stuff.",
    },
    {
      id: "vibes",
      icon: "🔥",
      tag: "New",
      tagColor: "orange",
      title: "Group Vibes",
      desc: "Jump into a small group room — 2 to 4 people, shared energy, and zero pressure to perform.",
    },
    {
      id: "speed",
      icon: "⚡",
      tag: "",
      title: "Speed Connect",
      desc: "Fast-paced rapid matching. If the chemistry isn't instant, move on in seconds.",
    },
  ];

  const features = [
    {
      icon: "⚡",
      title: "Matched in seconds",
      desc: "Our real-time engine pairs you with a live person the moment you tap Start. No loading screens, no queues.",
    },
    {
      icon: "🎮",
      title: "In-call games",
      desc: "Break the ice with Hot Seat questions or Would You Rather — built right into every call.",
    },
    {
      icon: "🎛️",
      title: "Smart filters",
      desc: "Plus members can filter by city, interests, and more. Meet people who actually share your world.",
    },
    {
      icon: "🛡️",
      title: "AI-powered safety",
      desc: "Real-time local moderation. One tap reports and permanently blocks anyone who violates the rules.",
    },
    {
      icon: "📱",
      title: "Any device",
      desc: "Works on desktop, tablet, and mobile in any modern browser. No download required.",
    },
    {
      icon: "🔞",
      title: "18+ verified",
      desc: "Age verification at signup — no exceptions. the.vibe is a space built for adults.",
    },
  ];

  const faqs = [
    {
      q: "What is the.vibe?",
      a: "the.vibe is a live video matching platform. You connect with real people in real time — one-on-one or in groups. No feeds, no followers, no algorithms. Just genuine face-to-face conversation.",
    },
    {
      q: "Is it completely free?",
      a: "Yes. The core experience — matching, calling, chatting — is completely free with no time limits. the.vibe Plus unlocks HD video, priority matching, advanced filters, and group rooms up to 4 people.",
    },
    {
      q: "How does safety actually work?",
      a: "Every user is age-verified during signup. Our AI moderation monitors sessions locally in real time. Any violation ends the call instantly, bans the user, and the person who reported is never matched with them again.",
    },
    {
      q: "Does it work on mobile?",
      a: "Yes — the.vibe runs on any modern browser on iOS and Android. A native app is in active development.",
    },
    {
      q: "What happens if I see something inappropriate?",
      a: "The report button is always visible during every call. One tap ends the session immediately, flags the account for review, and guarantees your paths never cross again.",
    },
    {
      q: "What is the.vibe Plus?",
      a: "Plus is our premium tier — ₦3,000/month or ₦1,800/month billed yearly. It unlocks HD video quality, priority matching (shorter wait times), advanced filters, and access to group rooms of 4.",
    },
  ];

  return (
    <div className="lp">
      {/* ── NAVBAR ── */}
      <nav className={`lp-nav ${scrolled ? "lp-nav-scrolled" : ""}`}>
        <div className="lp-nav-logo">
          the<span>.vibe</span>
        </div>
        <div className="lp-nav-center">
          <button onClick={() => scrollTo("modes")}>Modes</button>
          <button onClick={() => scrollTo("features")}>Features</button>
          <button onClick={() => scrollTo("safety")}>Safety</button>
        </div>
        <div className="lp-nav-right">
          <button
            className="lp-nav-signin"
            onClick={() => onSignInAction?.()}
          >
            Sign in
          </button>
          <button className="lp-nav-cta" onClick={() => onJoinAction(true)}>
            Get started free
          </button>
        </div>
      </nav>

      <div
        className="lp-scroll-emoji"
        style={{
          "--modes-emoji-size": `${scrollEmojiSize + 26}px`,
          fontSize: `${scrollEmojiSize}px`,
        }}
        aria-hidden="true"
      >
        {scrollEmoji}
      </div>

      {/* ── HERO ── */}
      <section className="lp-hero">
        <div
          className="lp-hero-bg"
          style={{ "--lp-hero-image": `url(${landingHeroBg})` }}
        >
          <div className="lp-hero-image" />
          <div className="lp-hero-orb lp-orb-1" />
          <div className="lp-hero-orb lp-orb-2" />
          <div className="lp-hero-orb lp-orb-3" />
          <div className="lp-hero-noise" />
        </div>

        <div className="lp-hero-inner">
          <div className="lp-hero-left">
            {/* Live badge */}
            <div className="lp-hero-badge">
              <span className="lp-hero-badge-dot" />
              <LiveCounter />
              <span className="lp-hero-badge-label">
                &nbsp;people live right now
              </span>
            </div>

            <h1 className="lp-hero-h1">
              Stop scrolling.
              <br />
              <span className="lp-hero-gradient-text">Start connecting.</span>
            </h1>

            <p className="lp-hero-sub">
              Meet real people over live video — solo or in groups. No feeds. No
              likes. No algorithms. Just face-to-face.
            </p>

            <div className="lp-hero-actions">
              <button
                className="lp-btn-hero-primary"
                onClick={() => onJoinAction(true)}
              >
                Start for free
              </button>
              <button
                className="lp-btn-hero-ghost"
                onClick={() => scrollTo("modes")}
              >
                Explore modes ↓
              </button>
            </div>

            <div className="lp-hero-trust">
              <div className="lp-hero-trust-item">
                <span>✓</span> Free forever
              </div>
              <div className="lp-hero-trust-sep" />
              <div className="lp-hero-trust-item">
                <span>✓</span> 18+ verified
              </div>
              <div className="lp-hero-trust-sep" />
              <div className="lp-hero-trust-item">
                <span>✓</span> No download needed
              </div>
            </div>
          </div>

          <div className="lp-hero-right">
            <div className="lp-hero-phone-wrap">
              <div className="lp-hero-phone">
                <div className="lp-hero-phone-notch" />
                <div className="lp-hero-slot lp-hero-slot-top">
                  <img
                    src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=400"
                    alt="Person on live video call"
                    loading="eager"
                  />
                  <div className="lp-hero-slot-tag">
                    <span className="lp-dot-live" />
                    Amara · Lagos
                  </div>
                  <div className="lp-hero-slot-badge">LIVE</div>
                </div>
                <div className="lp-hero-divider" />
                <div className="lp-hero-slot lp-hero-slot-bottom">
                  <img
                    src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=400"
                    alt="You on live video call"
                    loading="eager"
                  />
                  <div className="lp-hero-slot-tag lp-slot-tag-right">
                    <span className="lp-dot-live" />
                    You
                  </div>
                </div>
                <div className="lp-hero-phone-controls">
                  <div className="lp-phone-ctrl lp-phone-ctrl-red">✕</div>
                  <div className="lp-phone-ctrl lp-phone-ctrl-skip">⏭</div>
                  <div className="lp-phone-ctrl lp-phone-ctrl-chat">💬</div>
                </div>
              </div>
              <div className="lp-phone-glow" />
            </div>
          </div>
        </div>
      </section>

      {/* ── STATS COUNTER BAND ── */}
      <section className="lp-stats-band">
        <div className="lp-stats-inner">
          <Reveal delay={0}>
            <div className="lp-stat-block">
              <AnimatedCounter target={2400000} duration={2200} />
              <span className="lp-stat-label">Connections made</span>
            </div>
          </Reveal>
          <div className="lp-stat-sep" />
          <Reveal delay={100}>
            <div className="lp-stat-block">
              <AnimatedCounter target={100000} duration={1800} suffix="+" />
              <span className="lp-stat-label">Registered users</span>
            </div>
          </Reveal>
          <div className="lp-stat-sep" />
          <Reveal delay={200}>
            <div className="lp-stat-block">
              <AnimatedCounter target={97} duration={1400} suffix="%" />
              <span className="lp-stat-label">Match satisfaction</span>
            </div>
          </Reveal>
          <div className="lp-stat-sep" />
          <Reveal delay={300}>
            <div className="lp-stat-block">
              <AnimatedCounter target={36} duration={1600} suffix=" States" />
              <span className="lp-stat-label">Users worldwide</span>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── MODES ── */}
      <section
        id="modes"
        className="lp-section lp-modes-section"
        style={{ "--lp-modes-bg": `url(${modesEnergyBg})` }}
      >
        <div className="lp-container">
          <Reveal>
            <p className="lp-eyebrow">Choose your energy</p>
            <h2 className="lp-section-h2">Three ways to connect</h2>
            <p className="lp-section-p">
              Pick the format that fits your mood right now. Switch anytime, no
              commitment.
            </p>
          </Reveal>
          <div className="lp-modes-grid">
            {modes.map((m, i) => (
              <Reveal key={i} delay={i * 80}>
                <div className={`lp-mode-card lp-mode-card-${m.id}`}>
                  <div className="lp-mode-effect" aria-hidden="true" />
                  {m.tag && (
                    <span
                      className={`lp-mode-tag lp-mode-tag-${m.tagColor || "purple"}`}
                    >
                      {m.tag}
                    </span>
                  )}
                  <div className="lp-mode-icon-wrap">{m.icon}</div>
                  <h3 className="lp-mode-title">{m.title}</h3>
                  <p className="lp-mode-desc">{m.desc}</p>
                  <button
                    className="lp-mode-cta"
                    onClick={() => handleModeAction(m.id)}
                  >
                    Try {m.title} →
                  </button>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="lp-section lp-section-dark">
        <div className="lp-container">
          <Reveal>
            <p className="lp-eyebrow">Why the.vibe</p>
            <h2 className="lp-section-h2">
              Everything you need.
              <br />
              Nothing you don't.
            </h2>
          </Reveal>
          <div className="lp-features-grid">
            {features.map((f, i) => (
              <Reveal key={i} delay={i * 60}>
                <div className="lp-feature-card">
                  <span className="lp-feature-icon">{f.icon}</span>
                  <h3 className="lp-feature-title">{f.title}</h3>
                  <p className="lp-feature-desc">{f.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how" className="lp-section lp-how-section">
        <div className="lp-container">
          <Reveal>
            <p className="lp-eyebrow">Simple by design</p>
            <h2 className="lp-section-h2">Live in under 60 seconds</h2>
          </Reveal>
          <div className="lp-steps-track">
            {[
              {
                n: "01",
                color: "purple",
                title: "Create your account",
                desc: "Set your username and pick your interests. No credit card, no friction.",
              },
              {
                n: "02",
                color: "cyan",
                title: "Choose your mode",
                desc: "Solo, Group, or Speed Connect — pick the energy that fits the moment.",
              },
              {
                n: "03",
                color: "pink",
                title: "Get matched instantly",
                desc: "Our engine finds someone live and compatible in seconds. No waiting rooms.",
              },
            ].map((s, i) => (
              <Reveal key={i} delay={i * 100} direction="up">
                <div className="lp-step">
                  <div className={`lp-step-icon lp-step-icon-${s.color}`}>
                    <span>{s.n}</span>
                  </div>
                  {i < 2 && <div className="lp-step-connector" />}
                  <div className="lp-step-num">{s.n}</div>
                  <div className="lp-step-body">
                    <h3 className="lp-step-title">{s.title}</h3>
                    <p className="lp-step-desc">{s.desc}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── SAFETY ── */}
      <section id="safety" className="lp-section lp-section-dark">
        <div className="lp-container">
          <Reveal>
            <p className="lp-eyebrow">Built for trust</p>
            <h2 className="lp-section-h2">
              Safety isn't a feature.
              <br />
              It's the foundation.
            </h2>
            <p className="lp-section-p lp-section-p-wide">
              We designed the moderation system before we designed anything
              else.
            </p>
          </Reveal>
          <div className="lp-safety-grid">
            {[
              {
                icon: "🔞",
                color: "#f97316",
                title: "Strict 18+ Gate",
                desc: "Every account is age-verified at signup. Under 18 means no access, no exceptions, no workarounds.",
              },
              {
                icon: "🤖",
                color: "#8b5cf6",
                title: "Real-Time AI Moderation",
                desc: "Video is monitored locally in real time. Violations trigger an instant match drop and a permanent hardware ban.",
              },
              {
                icon: "🚨",
                color: "#ef4444",
                title: "One-Tap Report",
                desc: "Always visible during every call. One tap ends the session, flags the account, and guarantees you never meet them again.",
              },
            ].map((item, i) => (
              <Reveal key={i} delay={i * 90}>
                <div className="lp-safety-card">
                  <div
                    className="lp-safety-icon-wrap"
                    style={{
                      background: `${item.color}18`,
                      border: `1px solid ${item.color}30`,
                    }}
                  >
                    <span style={{ fontSize: 22 }}>{item.icon}</span>
                  </div>
                  <h3 className="lp-safety-title">{item.title}</h3>
                  <p className="lp-safety-desc">{item.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BAND ── */}
      <section className="lp-cta-band">
        <div className="lp-cta-orb lp-cta-orb-left" />
        <div className="lp-cta-orb lp-cta-orb-right" />
        <Reveal>
          <div className="lp-cta-inner">
            <p className="lp-eyebrow lp-center">Ready when you are</p>
            <h2 className="lp-cta-h2">
              Your next real conversation
              <br />
              is <em>one click away.</em>
            </h2>
            <p className="lp-cta-p">
              Free to join. No credit card. No download. No awkwardness.
            </p>
            <button
              className="lp-btn-hero-primary"
              onClick={() => onJoinAction(true)}
            >
              Create your free account →
            </button>
            <div className="lp-cta-or">
              Already have an account?{" "}
              <button
                className="lp-cta-signin-link"
                onClick={() => onSignInAction?.()}
              >
                Sign in
              </button>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ── FAQ ── */}
      <section className="lp-faq-section">
        <div className="lp-container lp-faq-container">
          <Reveal>
            <h2 className="lp-section-h2 lp-center">Common questions</h2>
          </Reveal>
          <div className="lp-faq-list">
            {faqs.map((faq, i) => (
              <Reveal key={i} delay={i * 40}>
                <div
                  className={`lp-faq-item ${openFaq === i ? "lp-faq-open" : ""}`}
                >
                  <button className="lp-faq-q" onClick={() => toggleFaq(i)}>
                    <span>{faq.q}</span>
                    <span className="lp-faq-chevron">
                      {openFaq === i ? "−" : "+"}
                    </span>
                  </button>
                  <div
                    className="lp-faq-a"
                    style={{ maxHeight: openFaq === i ? "300px" : "0" }}
                  >
                    <p>{faq.a}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="lp-footer">
        <div className="lp-container">
          <div className="lp-footer-top">
            <div className="lp-footer-brand">
              <div className="lp-footer-logo">
                the<span>.vibe</span>
              </div>
              <p>Real connections. Real people. Real time.</p>
              <div className="lp-footer-socials">
                {["𝕏", "IG", "TT"].map((s, i) => (
                  <div key={i} className="lp-social-icon">
                    {s}
                  </div>
                ))}
              </div>
            </div>
            <div className="lp-footer-cols">
              <div className="lp-footer-col">
                <p className="lp-footer-col-head">Product</p>
                <button onClick={() => scrollTo("modes")}>Modes</button>
                <button onClick={() => scrollTo("features")}>Features</button>
                <button onClick={() => onJoinAction(true)}>
                  the.vibe Plus
                </button>
                <button onClick={() => scrollTo("safety")}>Safety</button>
              </div>
              <div className="lp-footer-col">
                <p className="lp-footer-col-head">Company</p>
                <button>About</button>
                <button>Blog</button>
                <button>Careers</button>
                <button>Contact</button>
              </div>
              <div className="lp-footer-col">
                <p className="lp-footer-col-head">Legal</p>
                <button>Terms of Service</button>
                <button>Privacy Policy</button>
                <button>Cookie Policy</button>
                <button>DMCA</button>
              </div>
            </div>
          </div>
          <div className="lp-footer-bottom">
            <p>© 2026 the.vibe. All rights reserved.</p>
            <p>Made with care in Nigeria 🇳🇬</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
