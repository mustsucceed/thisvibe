import { useEffect, useRef, useState } from "react";
import AuthPage from "./AuthPage";
import CallPage from "./CallPage";
import LandingPage from "./LandingPage";
import VibePlusPage from "./VibePlusPage";
import "./App.css";

const ADMIN_EMAIL = "admin@gmail.com";
const ADMIN_PASSWORD = "admin123";
const VALID_ROUTES = new Set([
  "/",
  "/auth",
  "/signin",
  "/call",
  "/vibe-plus",
  "/plus",
]);

const getRouteFromLocation = () => {
  const { pathname } = window.location;
  return VALID_ROUTES.has(pathname) ? pathname : "/";
};

export default function App() {
  const [currentRoute, setCurrentRoute] = useState(getRouteFromLocation);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionLabel, setTransitionLabel] = useState("Loading");
  const [startWithSignUp, setStartWithSignUp] = useState(true);
  const [createdAccount,  setCreatedAccount]  = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const transitionTimerRef = useRef(null);

  useEffect(() => {
    const handlePopState = () => {
      setCurrentRoute(getRouteFromLocation());
      window.scrollTo({ top: 0, behavior: "instant" });
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.clearTimeout(transitionTimerRef.current);
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  const navigateWithTransition = (nextRoute, onComplete) => {
    window.clearTimeout(transitionTimerRef.current);
    const isAuthRoute = nextRoute === "/auth" || nextRoute === "/signin";
    setTransitionLabel(isAuthRoute ? "Loading auth" : "Loading");
    setIsTransitioning(true);
    window.scrollTo({ top: 0, behavior: "instant" });
    transitionTimerRef.current = window.setTimeout(() => {
      onComplete?.();
      window.history.pushState({}, "", nextRoute);
      setCurrentRoute(nextRoute);
      setIsTransitioning(false);
      window.scrollTo({ top: 0, behavior: "instant" });
    }, isAuthRoute ? 650 : 350);
  };

  const handleNavigateToAuth = (showSignUp = true) => {
    setStartWithSignUp(showSignUp);
    navigateWithTransition(showSignUp ? "/auth" : "/signin");
  };

  const handleAccountCreated = ({ email, password }) => {
    setCreatedAccount({
      email: email.trim().toLowerCase(),
      password,
      isVerified: true,
    });
  };

  const handleAuthSuccess = () => {
    navigateWithTransition("/call", () => {
      setIsAuthenticated(true);
    });
  };

  const handleNavigateHome = () => {
    navigateWithTransition("/");
  };

  const handleNavigateToPlus = () => {
    navigateWithTransition("/vibe-plus");
  };

  const canUseLocalLogin = ({ email, password }) => {
    const normalizedEmail = email.trim().toLowerCase();

    if (normalizedEmail === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      return true;
    }

    return (
      createdAccount?.email === normalizedEmail &&
      createdAccount?.password === password &&
      createdAccount?.isVerified
    );
  };

  if (isTransitioning) {
    return (
      <div className="app-page-transition">
        <div className="app-loader" aria-label={transitionLabel}>
          {"the vibe".split("").map((letter, index) => (
            <span
              className={[
                letter === " " ? "app-loader-space" : "",
                index > 3 ? "app-loader-vibe" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              key={`${letter}-${index}`}
            >
              {letter}
            </span>
          ))}
        </div>
      </div>
    );
  }

  if (currentRoute === "/call") {
    return isAuthenticated ? (
      <CallPage onNavigateToPlus={handleNavigateToPlus} />
    ) : (
      <LandingPage onJoinAction={() => handleNavigateToAuth(true)} />
    );
  }

  if (currentRoute === "/vibe-plus" || currentRoute === "/plus") {
    return <VibePlusPage />;
  }

  if (currentRoute === "/auth" || currentRoute === "/signin") {
    return (
      <div className="animate-fade-in" style={{ background: "var(--bg)", minHeight: "100vh" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "24px 40px 0" }}>
          <button
            onClick={handleNavigateHome}
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
          canUseLocalLogin={canUseLocalLogin}
          initialIsSignUp={currentRoute === "/signin" ? false : startWithSignUp}
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
