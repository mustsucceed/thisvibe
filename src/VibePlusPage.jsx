import { useState } from "react";

const sheenKeyframes = `
  @keyframes pillSheen {
    0% { transform: translateX(-100%) skewX(-15deg); }
    100% { transform: translateX(300%) skewX(-15deg); }
  }
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }
`;

const features = [
  {
    icon: "🎬",
    iconBg: "#2d1e6b",
    iconColor: "#a78bfa",
    title: "HD Video Quality",
    desc: "Crystal clear 1080p calls, always",
    svg: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="7" width="15" height="10" rx="2" />
        <path d="M17 9l5-3v12l-5-3V9z" />
      </svg>
    ),
  },
  {
    iconBg: "#2b1f0e",
    title: "Priority Matching",
    desc: "Skip the queue, match instantly",
    svg: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
      </svg>
    ),
  },
  {
    iconBg: "#0f2a24",
    title: "Advanced Filters",
    desc: "Filter by age, city, interests & more",
    svg: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="4" y1="6" x2="20" y2="6" /><line x1="8" y1="12" x2="16" y2="12" /><line x1="11" y1="18" x2="13" y2="18" />
      </svg>
    ),
  },
  {
    iconBg: "#2a0f14",
    title: "Ad-Free Experience",
    desc: "Zero interruptions, pure connection",
    svg: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" /><line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
      </svg>
    ),
  },
];

export default function VibePlusPage() {
  const [selected, setSelected] = useState("yearly");
  const [hoveredPlan, setHoveredPlan] = useState(null);

  return (
    <>
      <style>{sheenKeyframes}</style>
      <div style={{
        background: "#0e0b1a",
        minHeight: "100vh",
        width: "100vw",
        padding: "40px 48px",
        fontFamily: "'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        color: "#fff",
        boxSizing: "border-box",
      }}>

        {/* Badge */}
        <div style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 7,
          background: "#2a1f0f",
          border: "1px solid #6b4a1a",
          borderRadius: 999,
          padding: "7px 16px",
          fontSize: 14,
          fontWeight: 600,
          color: "#f5c842",
          position: "relative",
          overflow: "hidden",
          marginBottom: 40,
        }}>
          <span style={{ fontSize: 16 }}>★</span>
          the.vibe Plus
          <span style={{
            position: "absolute", top: 0, left: 0,
            width: "40%", height: "100%",
            background: "linear-gradient(90deg, transparent 0%, rgba(255,210,80,0.55) 50%, transparent 100%)",
            animation: "pillSheen 2.4s ease-in-out infinite",
            pointerEvents: "none",
          }} />
        </div>

        {/* Main grid */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 56,
          alignItems: "start",
          maxWidth: 1000,
          margin: "0 auto",
        }}>

          {/* Left — features */}
          <div style={{ animation: "fadeUp 0.5s ease both" }}>
            <h1 style={{
              fontSize: 46,
              fontWeight: 800,
              lineHeight: 1.12,
              margin: "0 0 14px",
              color: "#fff",
              letterSpacing: "-0.5px",
            }}>
              Unlock the full<br />
              <span style={{ color: "#a855f7" }}>experience</span>
            </h1>
            <p style={{
              fontSize: 15,
              color: "#9b8db8",
              lineHeight: 1.7,
              margin: "0 0 30px",
              maxWidth: 420,
            }}>
              Get priority matching, HD video, and advanced filters — so you spend less time waiting and more time connecting.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {features.map((f, i) => (
                <div key={i} style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                  background: "#1c1630",
                  border: "1px solid #2a2245",
                  borderRadius: 12,
                  padding: "16px 20px",
                  animation: `fadeUp 0.5s ease ${0.1 + i * 0.07}s both`,
                }}>
                  <div style={{
                    width: 42, height: 42,
                    borderRadius: 10,
                    background: f.iconBg,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0,
                  }}>
                    {f.svg}
                  </div>
                  <div>
                    <p style={{ margin: 0, fontWeight: 600, fontSize: 15 }}>{f.title}</p>
                    <p style={{ margin: "4px 0 0", fontSize: 13, color: "#9b8db8" }}>{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right — plans */}
          <div style={{ animation: "fadeUp 0.5s ease 0.15s both" }}>
            <p style={{
              fontSize: 11,
              letterSpacing: "2px",
              color: "#7c6fa0",
              textTransform: "uppercase",
              margin: "0 0 16px",
              textAlign: "center",
            }}>
              Choose a plan
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 14, marginBottom: 16 }}>
              {[
                { id: "monthly", label: "Monthly", price: "$4.99", sub: "Billed monthly", featured: false, topMargin: 0 },
                { id: "yearly", label: "Yearly", price: "$2.99", sub: "$35.99 billed yearly", featured: true, topMargin: 14 },
              ].map(plan => {
                const isSelected = selected === plan.id;
                const isHovered = hoveredPlan === plan.id;
                return (
                  <div
                    key={plan.id}
                    onClick={() => setSelected(plan.id)}
                    onMouseEnter={() => setHoveredPlan(plan.id)}
                    onMouseLeave={() => setHoveredPlan(null)}
                    style={{
                      background: "#1e1a2e",
                      border: `1px solid ${isHovered ? "#8c50ff" : plan.featured ? "#7c3aed" : "#2d2748"}`,
                      borderRadius: 14,
                      padding: "20px 24px",
                      cursor: "pointer",
                      position: "relative",
                      marginTop: plan.topMargin,
                      transform: isHovered ? "translateY(-6px)" : "translateY(0)",
                      boxShadow: isHovered
                        ? "0 0 28px 6px rgba(140,80,255,0.35), 0 0 60px 10px rgba(140,80,255,0.12)"
                        : plan.featured
                        ? "0 0 18px 3px rgba(124,58,237,0.25)"
                        : "none",
                      transition: "transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease",
                    }}
                  >
                    {plan.featured && (
                      <div style={{
                        position: "absolute",
                        top: -13,
                        left: "50%",
                        transform: "translateX(-50%)",
                        background: "#8b5cf6",
                        color: "#fff",
                        fontSize: 11,
                        fontWeight: 700,
                        padding: "4px 14px",
                        borderRadius: 999,
                        letterSpacing: "0.5px",
                        textTransform: "uppercase",
                        whiteSpace: "nowrap",
                      }}>
                        Best value
                      </div>
                    )}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                      <span style={{ fontSize: 15, fontWeight: 600 }}>{plan.label}</span>
                      <div style={{
                        width: 18, height: 18,
                        borderRadius: "50%",
                        border: `2px solid ${isSelected || isHovered ? "#8b5cf6" : "#4a4060"}`,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        transition: "border-color 0.2s",
                        flexShrink: 0,
                      }}>
                        <div style={{
                          width: 8, height: 8,
                          borderRadius: "50%",
                          background: "#8b5cf6",
                          opacity: isSelected ? 1 : 0,
                          transition: "opacity 0.2s",
                        }} />
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 3 }}>
                      <span style={{ fontSize: 34, fontWeight: 800 }}>{plan.price}</span>
                      <span style={{ fontSize: 14, color: "#9b8db8" }}>/mo</span>
                    </div>
                    <p style={{ margin: "4px 0 0", fontSize: 13, color: "#7c6fa0" }}>{plan.sub}</p>
                  </div>
                );
              })}
            </div>

            <button
              style={{
                width: "100%",
                background: "#8b5cf6",
                color: "#fff",
                border: "none",
                borderRadius: 50,
                padding: "17px",
                fontSize: 16,
                fontWeight: 600,
                cursor: "pointer",
                letterSpacing: "0.3px",
                transition: "background 0.2s ease, transform 0.1s ease",
              }}
              onMouseEnter={e => e.currentTarget.style.background = "#9d6fff"}
              onMouseLeave={e => e.currentTarget.style.background = "#8b5cf6"}
              onMouseDown={e => e.currentTarget.style.transform = "scale(0.98)"}
              onMouseUp={e => e.currentTarget.style.transform = "scale(1)"}
            >
              Get Plus →
            </button>
            <p style={{ textAlign: "center", fontSize: 12, color: "#6b5e82", margin: "10px 0 0" }}>
              Cancel anytime · No hidden fees
            </p>
          </div>

        </div>
      </div>
    </>
  );
}
