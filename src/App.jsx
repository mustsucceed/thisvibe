import { useEffect, useRef, useState } from "react";
import AuthPage from "./AuthPage";
import CallPage from "./CallPage";
import LandingPage from "./LandingPage";
import "./App.css";

// Dev shortcut credentials — remove before production
const ADMIN_EMAIL = "admin@gmail.com";
const ADMIN_PASSWORD = "admin123";

// Simple hash so raw password never sits in state
async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export default function App() {
  const [currentView, setCurrentView] = useState("landing");
  const [startWithSignUp, setStartWithSignUp] = useState(true);
  // Store email + hashed password only — never the raw password
  const [createdAccount, setCreatedAccount] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const transitionTimerRef = useRef(null);

  useEffect(() => {
    return () => {
      window.clearTimeout(transitionTimerRef.current);
    };
  }, []);

  // Reduced from 850ms → 350ms for snappier navigation
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
    const hashed = await hashPassword(password);
    setCreatedAccount({ email: email.trim().toLowerCase(), passwordHash: hashed });
  };

  const handleAuthSuccess = () => {
    navigateWithTransition("call", () => {
      setIsAuthenticated(true);
    });
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCreatedAccount(null);
    navigateWithTransition("landing");
  };

  // canUseLocalLogin is async now because we compare hashed passwords
  const canUseLocalLogin = async ({ email, password }) => {
    const normalizedEmail = email.trim().toLowerCase();

    // Admin shortcut
    if (normalizedEmail === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      return true;
    }

    if (!createdAccount) return false;
    const hashed = await hashPassword(password);
    return (
      createdAccount.email === normalizedEmail &&
      createdAccount.passwordHash === hashed
    );
  };

  if (currentView === "loading") {
    return (
      <div className="app-page-transition">
        <div className="app-loader" />
      </div>
    );
  }

  if (isAuthenticated && currentView === "call") {
    return <CallPage onLogout={handleLogout} />;
  }

  if (currentView === "auth") {
    return (
      <div
        className="animate-fade-in"
        style={{ backgroundColor: "#0A0712", minHeight: "100vh" }}
      >
        <div
          style={{
            maxWidth: "1200px",
            margin: "0 auto",
            padding: "24px 40px 0",
          }}
        >
          <button
            onClick={() => navigateWithTransition("landing")}
            style={{
              background: "rgba(255, 255, 255, 0.03)",
              border: "1px solid #1F192E",
              color: "#9ca3af",
              cursor: "pointer",
              fontSize: "13px",
              fontWeight: "600",
              padding: "10px 20px",
              borderRadius: "9999px",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => {
              e.target.style.color = "#ffffff";
              e.target.style.borderColor = "#8B5CF6";
            }}
            onMouseLeave={(e) => {
              e.target.style.color = "#9ca3af";
              e.target.style.borderColor = "#1F192E";
            }}
            type="button"
          >
            ← Back to home
          </button>
        </div>
        <AuthPage
          canUseLocalLogin={canUseLocalLogin}
          initialIsSignUp={startWithSignUp}
          onAccountCreated={handleAccountCreated}
          onAuthSuccess={handleAuthSuccess}
        />
      </div>
    );
  }

  return <LandingPage onJoinAction={() => handleNavigateToAuth(true)} />;
}
