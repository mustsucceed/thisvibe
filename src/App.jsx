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
  const [startWithSignUp, setStartWithSignUp] = useState(true);
  const [createdAccount, setCreatedAccount] = useState(null);
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
    setIsTransitioning(true);
    window.scrollTo({ top: 0, behavior: "instant" });

    transitionTimerRef.current = window.setTimeout(() => {
      onComplete?.();
      window.history.pushState({}, "", nextRoute);
      setCurrentRoute(nextRoute);
      setIsTransitioning(false);
      window.scrollTo({ top: 0, behavior: "instant" });
    }, 850);
  };

  const handleNavigateToAuth = (showSignUp = true) => {
    setStartWithSignUp(showSignUp);
    navigateWithTransition(showSignUp ? "/auth" : "/signin");
  };

  const handleAccountCreated = (account) => {
    setCreatedAccount(account);
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
        <div className="app-loader" />
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
            onClick={handleNavigateHome}
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
            &larr; Back to home
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

  return <LandingPage onJoinAction={() => handleNavigateToAuth(true)} />;
}
