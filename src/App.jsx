import { useEffect, useRef, useState } from "react";
import AuthPage from "./AuthPage";
import CallPage from "./CallPage";
import LandingPage from "./LandingPage";
import "./App.css";

async function hashPassword(password) {
  const data = new TextEncoder().encode(password);
  const buf  = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export default function App() {
  const [currentView,     setCurrentView]     = useState("landing");
  const [startWithSignUp, setStartWithSignUp] = useState(true);
  const [createdAccount,  setCreatedAccount]  = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const transitionTimerRef = useRef(null);

  useEffect(() => () => window.clearTimeout(transitionTimerRef.current), []);

  const navigateWithTransition = (nextView, onComplete) => {
    window.clearTimeout(transitionTimerRef.current);
    setCurrentView("loading");
    window.scrollTo({ top: 0, behavior: "instant" });
    transitionTimerRef.current = window.setTimeout(() => {
      onComplete?.();
      setCurrentView(nextView);
      window.scrollTo({ top: 0, behavior: "instant" });
    }, 350);
  };

  const handleNavigateToAuth = (showSignUp = true) => {
    setStartWithSignUp(showSignUp);
    navigateWithTransition("auth");
  };

  const handleAccountCreated = async ({ email, password }) => {
    const hash = await hashPassword(password);
    setCreatedAccount({ email: email.trim().toLowerCase(), passwordHash: hash });
  };

  const handleAuthSuccess = () =>
    navigateWithTransition("call", () => setIsAuthenticated(true));

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCreatedAccount(null);
    navigateWithTransition("landing");
  };

  const canUseLocalLogin = async ({ email, password }) => {
    if (!createdAccount) return false;
    const hash = await hashPassword(password);
    return (
      createdAccount.email === email.trim().toLowerCase() &&
      createdAccount.passwordHash === hash
    );
  };

  /* ── Loading ─────────────────────────────────────────── */
  if (currentView === "loading") {
    return (
      <div className="app-page-transition">
        <div className="app-loader" />
      </div>
    );
  }

  /* ── Authenticated call view ─────────────────────────── */
  if (isAuthenticated && currentView === "call") {
    return <CallPage onLogout={handleLogout} />;
  }

  /* ── Auth view ───────────────────────────────────────── */
  if (currentView === "auth") {
    return (
      <div className="animate-fade-in" style={{ background: "var(--bg)", minHeight: "100vh" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "24px 40px 0" }}>
          <button
            type="button"
            onClick={() => navigateWithTransition("landing")}
            style={{
              background: "transparent",
              border: "1px solid var(--border-md)",
              color: "var(--text-secondary)",
              fontSize: 13,
              fontFamily: "var(--font-body)",
              fontWeight: 600,
              padding: "9px 20px",
              borderRadius: "var(--radius-full)",
              cursor: "pointer",
              transition: "all var(--transition)",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color        = "var(--text)";
              e.currentTarget.style.borderColor  = "var(--purple)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color        = "var(--text-secondary)";
              e.currentTarget.style.borderColor  = "var(--border-md)";
            }}
          >
            ← Back to home
          </button>
        </div>
        <AuthPage
          initialIsSignUp={startWithSignUp}
          canUseLocalLogin={canUseLocalLogin}
          onAccountCreated={handleAccountCreated}
          onAuthSuccess={handleAuthSuccess}
        />
      </div>
    );
  }

  /* ── Landing ─────────────────────────────────────────── */
  return (
    <LandingPage
      onJoinAction={() => handleNavigateToAuth(true)}
      onSignInAction={() => handleNavigateToAuth(false)}
    />
  );
}