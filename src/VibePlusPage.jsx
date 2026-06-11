import { useState } from "react";

const vibePlusStyles = `
  :root {
    --vp-bg: #0A0712;
    --vp-surface: #120E24;
    --vp-surface-hover: #181330;
    --vp-primary: #8B5CF6;
    --vp-primary-hover: #7C3AED;
    --vp-text: #FFFFFF;
    --vp-text-muted: #8B8A9A;
    --vp-border: rgba(255, 255, 255, 0.08);
  }

  .vp-wrapper {
    min-height: 100vh;
    background-color: var(--vp-bg);
    background-image: 
      radial-gradient(circle at 15% 50%, rgba(139, 92, 246, 0.08), transparent 25%),
      radial-gradient(circle at 85% 30%, rgba(56, 189, 248, 0.05), transparent 25%);
    color: var(--vp-text);
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    padding: 80px 24px;
    position: relative;
    overflow-x: hidden;
  }

  .vp-back-btn {
    position: absolute;
    top: 32px;
    left: 32px;
    background: transparent;
    border: 1px solid var(--vp-border);
    color: var(--vp-text-muted);
    padding: 10px 20px;
    border-radius: 100px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 8px;
    transition: all 0.2s ease;
    backdrop-filter: blur(10px);
  }

  .vp-back-btn:hover {
    color: var(--vp-text);
    background: rgba(255, 255, 255, 0.05);
    border-color: rgba(255, 255, 255, 0.15);
    transform: translateX(-4px);
  }

  .vp-container {
    max-width: 1100px;
    margin: 0 auto;
  }

  .vp-header {
    text-align: center;
    margin-bottom: 64px;
    animation: vpFadeUp 0.6s ease-out forwards;
  }

  .vp-badge {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: rgba(234, 179, 8, 0.1);
    border: 1px solid rgba(234, 179, 8, 0.2);
    color: #FBBF24;
    padding: 6px 16px;
    border-radius: 100px;
    font-size: 13px;
    font-weight: 700;
    letter-spacing: 0.5px;
    margin-bottom: 24px;
    text-transform: uppercase;
  }

  .vp-title {
    font-size: clamp(36px, 5vw, 56px);
    font-weight: 800;
    line-height: 1.1;
    margin: 0 0 16px 0;
    letter-spacing: -1px;
  }

  .vp-title span {
    background: linear-gradient(135deg, #A78BFA, #8B5CF6);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  .vp-subtitle {
    font-size: 18px;
    color: var(--vp-text-muted);
    max-width: 540px;
    margin: 0 auto;
    line-height: 1.6;
  }

  .vp-grid {
    display: grid;
    grid-template-columns: 1.1fr 0.9fr;
    gap: 64px;
    align-items: center;
  }

  @media (max-width: 900px) {
    .vp-grid {
      grid-template-columns: 1fr;
      gap: 48px;
    }
  }

  .vp-features {
    display: flex;
    flex-direction: column;
    gap: 32px;
  }

  .vp-feature-item {
    display: flex;
    gap: 20px;
    align-items: flex-start;
    opacity: 0;
    animation: vpFadeUp 0.6s ease-out forwards;
  }

  .vp-icon-box {
    width: 52px;
    height: 52px;
    border-radius: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    box-shadow: 0 8px 16px rgba(0,0,0,0.2);
  }

  .vp-feature-text h3 {
    font-size: 18px;
    font-weight: 700;
    margin: 0 0 6px 0;
    color: var(--vp-text);
  }

  .vp-feature-text p {
    font-size: 15px;
    color: var(--vp-text-muted);
    margin: 0;
    line-height: 1.5;
  }

  .vp-pricing-panel {
    background: rgba(18, 14, 36, 0.6);
    border: 1px solid var(--vp-border);
    border-radius: 24px;
    padding: 40px;
    backdrop-filter: blur(20px);
    box-shadow: 0 24px 80px rgba(0, 0, 0, 0.4);
    opacity: 0;
    animation: vpFadeUp 0.6s ease-out 0.4s forwards;
  }

  .vp-plan-card {
    background: var(--vp-surface);
    border: 2px solid transparent;
    border-radius: 16px;
    padding: 24px;
    cursor: pointer;
    position: relative;
    transition: all 0.2s ease;
    margin-bottom: 16px;
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .vp-plan-card:hover {
    background: var(--vp-surface-hover);
    border-color: rgba(139, 92, 246, 0.3);
  }

  .vp-plan-card.active {
    background: rgba(139, 92, 246, 0.08);
    border-color: var(--vp-primary);
  }

  .vp-radio {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    border: 2px solid #4A4563;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    transition: all 0.2s;
  }

  .vp-plan-card.active .vp-radio {
    border-color: var(--vp-primary);
  }

  .vp-radio-inner {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: var(--vp-primary);
    transform: scale(0);
    transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
  }

  .vp-plan-card.active .vp-radio-inner {
    transform: scale(1);
  }

  .vp-plan-info {
    flex-grow: 1;
  }

  .vp-plan-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 4px;
  }

  .vp-plan-name {
    font-size: 16px;
    font-weight: 700;
  }

  .vp-plan-price {
    font-size: 20px;
    font-weight: 800;
  }

  .vp-plan-sub {
    font-size: 13px;
    color: var(--vp-text-muted);
  }

  .vp-save-badge {
    position: absolute;
    top: -12px;
    right: 24px;
    background: var(--vp-primary);
    color: #fff;
    font-size: 11px;
    font-weight: 800;
    padding: 4px 12px;
    border-radius: 100px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    box-shadow: 0 4px 12px rgba(139, 92, 246, 0.4);
  }

  .vp-cta-btn {
    width: 100%;
    background: var(--vp-primary);
    color: #fff;
    border: none;
    border-radius: 14px;
    padding: 18px;
    font-size: 16px;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.2s;
    margin-top: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
  }

  .vp-cta-btn:hover {
    background: var(--vp-primary-hover);
    transform: translateY(-2px);
  }

  .vp-cta-btn:active {
    transform: translateY(0);
  }

  .vp-footer-note {
    text-align: center;
    font-size: 13px;
    color: var(--vp-text-muted);
    margin-top: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
  }

  @keyframes vpFadeUp {
    from { opacity: 0; transform: translateY(30px); }
    to { opacity: 1; transform: translateY(0); }
  }
`;

const features = [
  {
    iconBg: "rgba(139, 92, 246, 0.15)",
    iconColor: "#A78BFA",
    title: "HD Video Quality",
    desc: "Crystal clear 1080p calls, always. Because blurry connections kill the vibe.",
    svg: (
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="2" y="7" width="15" height="10" rx="2" />
        <path d="M17 9l5-3v12l-5-3V9z" />
      </svg>
    ),
  },
  {
    iconBg: "rgba(245, 158, 11, 0.15)",
    iconColor: "#FBBF24",
    title: "Priority Matching",
    desc: "Skip the queue. Our algorithm puts you at the front of the line for instant connections.",
    svg: (
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
      </svg>
    ),
  },
  {
    iconBg: "rgba(16, 185, 129, 0.15)",
    iconColor: "#34D399",
    title: "Advanced Filters",
    desc: "Dial in your exact preferences. Filter by gender, city, and specific interests.",
    svg: (
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <line x1="4" y1="6" x2="20" y2="6" />
        <line x1="8" y1="12" x2="16" y2="12" />
        <line x1="11" y1="18" x2="13" y2="18" />
      </svg>
    ),
  },
  {
    iconBg: "rgba(239, 68, 68, 0.15)",
    iconColor: "#F87171",
    title: "Ad-Free Experience",
    desc: "Zero interruptions. Just pure, continuous connection without the pop-ups.",
    svg: (
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="12" cy="12" r="10" />
        <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
      </svg>
    ),
  },
];

const plans = [
  {
    id: "monthly",
    label: "Monthly Pass",
    price: "₦3,000",
    sub: "Billed automatically every month",
    highlight: false,
  },
  {
    id: "yearly",
    label: "Annual Premium",
    price: "₦1,800",
    sub: "₦21,600 billed yearly",
    highlight: true,
  },
];

export default function VibePlusPage({ onBack }) {
  const [selectedPlan, setSelectedPlan] = useState("yearly");

  return (
    <>
      {/* Injecting styles directly into the component's JSX render tree 
        prevents the Flash of Unstyled Content (FOUC) glitch.
      */}
      <style dangerouslySetInnerHTML={{ __html: vibePlusStyles }} />

      <div className="vp-wrapper">
        <button
          className="vp-back-btn"
          onClick={onBack}
          aria-label="Back to dashboard"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          Back
        </button>

        <div className="vp-container">
          <header className="vp-header">
            <div className="vp-badge">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="currentColor"
                stroke="none"
              >
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
              THE.VIBE PLUS
            </div>
            <h1 className="vp-title">
              Unlock the <span>full experience</span>
            </h1>
            <p className="vp-subtitle">
              Upgrade your account to access priority matching, HD video, and
              advanced filters. Less waiting, more connecting.
            </p>
          </header>

          <div className="vp-grid">
            {/* Left Column: Features */}
            <div className="vp-features">
              {features.map((feature, i) => (
                <div
                  key={i}
                  className="vp-feature-item"
                  style={{ animationDelay: `${i * 0.1}s` }}
                >
                  <div
                    className="vp-icon-box"
                    style={{
                      background: feature.iconBg,
                      color: feature.iconColor,
                    }}
                  >
                    {feature.svg}
                  </div>
                  <div className="vp-feature-text">
                    <h3>{feature.title}</h3>
                    <p>{feature.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Right Column: Pricing */}
            <div className="vp-pricing-panel">
              {plans.map((plan) => {
                const isActive = selectedPlan === plan.id;
                return (
                  <div
                    key={plan.id}
                    className={`vp-plan-card ${isActive ? "active" : ""}`}
                    onClick={() => setSelectedPlan(plan.id)}
                  >
                    {plan.highlight && (
                      <div className="vp-save-badge">Save 40%</div>
                    )}

                    <div className="vp-radio">
                      <div className="vp-radio-inner"></div>
                    </div>

                    <div className="vp-plan-info">
                      <div className="vp-plan-header">
                        <span className="vp-plan-name">{plan.label}</span>
                        <span className="vp-plan-price">
                          {plan.price}
                          <span
                            style={{
                              fontSize: "14px",
                              color: "var(--vp-text-muted)",
                              fontWeight: "500",
                            }}
                          >
                            /mo
                          </span>
                        </span>
                      </div>
                      <div className="vp-plan-sub">{plan.sub}</div>
                    </div>
                  </div>
                );
              })}

              <button className="vp-cta-btn">
                Upgrade to Plus
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                  <polyline points="12 5 19 12 12 19"></polyline>
                </svg>
              </button>

              <div className="vp-footer-note">
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect
                    x="3"
                    y="11"
                    width="18"
                    height="11"
                    rx="2"
                    ry="2"
                  ></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                </svg>
                Secure payment · Cancel anytime
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
