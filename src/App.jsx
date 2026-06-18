import { useEffect, useRef, useState } from "react";
import AuthPage from "./AuthPage";
import CallPage from "./CallPage";
import LandingPage from "./LandingPage";
import VibePlusPage from "./VibePlusPage";
import "./App.css";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api/auth";
const ADMIN_EMAIL = "admin@gmail.com";
const ADMIN_USERNAME = "admin";
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
  if (/^\/invite\/[^/]+$/.test(pathname)) {
    return pathname;
  }

  return VALID_ROUTES.has(pathname) ? pathname : "/";
};

export default function App() {
  const [currentRoute, setCurrentRoute] = useState(getRouteFromLocation);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionLabel, setTransitionLabel] = useState("Loading");
  const [startWithSignUp, setStartWithSignUp] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUserProfile, setCurrentUserProfile] = useState(null);
  const [initialMatchMode, setInitialMatchMode] = useState("SOLO");
  const [pendingMatchMode, setPendingMatchMode] = useState("SOLO");
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

  useEffect(() => {
    if (!isAuthenticated || currentUserProfile?.localOnly) {
      return undefined;
    }

    let cancelled = false;

    const signOutCurrentDevice = () => {
      if (cancelled) {
        return;
      }

      setIsAuthenticated(false);
      setCurrentUserProfile(null);
      setInitialMatchMode("SOLO");

      if (window.location.pathname !== "/") {
        window.history.pushState({}, "", "/");
      }

      setCurrentRoute("/");
    };

    const checkSession = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/session`, {
          credentials: "include",
        });

        if (!res.ok) {
          signOutCurrentDevice();
          return;
        }

        const data = await res.json();

        if (!data.authenticated) {
          signOutCurrentDevice();
        }
      } catch {
        // Temporary network drops should not immediately kick the user out.
      }
    };

    checkSession();
    const intervalId = window.setInterval(checkSession, 10000);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
    };
  }, [currentUserProfile, isAuthenticated]);

  const navigateWithTransition = (nextRoute, onComplete) => {
    window.clearTimeout(transitionTimerRef.current);
    const isAuthRoute = nextRoute === "/auth" || nextRoute === "/signin";
    setTransitionLabel(isAuthRoute ? "Loading auth" : "Loading");
    setIsTransitioning(true);
    window.scrollTo({ top: 0, behavior: "instant" });
    transitionTimerRef.current = window.setTimeout(
      () => {
        onComplete?.();
        window.history.pushState({}, "", nextRoute);
        setCurrentRoute(nextRoute);
        setIsTransitioning(false);
        window.scrollTo({ top: 0, behavior: "instant" });
      },
      isAuthRoute ? 650 : 350,
    );
  };

  const handleNavigateToAuth = (showSignUp = true, nextMatchMode = "SOLO") => {
    setPendingMatchMode(nextMatchMode);
    setInitialMatchMode(nextMatchMode);
    setStartWithSignUp(showSignUp);
    navigateWithTransition(showSignUp ? "/auth" : "/signin");
  };

  const handleAuthSuccess = (data) => {
    navigateWithTransition("/call", () => {
      setCurrentUserProfile(data?.user || null);
      setIsAuthenticated(true);
      setInitialMatchMode(pendingMatchMode);
    });
  };

  const handleNavigateToCallMode = (mode = "SOLO") => {
    setPendingMatchMode(mode);
    setInitialMatchMode(mode);

    if (isAuthenticated) {
      navigateWithTransition("/call");
      return;
    }

    handleNavigateToAuth(true, mode);
  };

  const handleNavigateHome = () => {
    navigateWithTransition("/");
  };

  const handleNavigateToPlus = () => {
    navigateWithTransition("/vibe-plus");
  };

  const canUseLocalLogin = ({ email = "", username = "", password }) => {
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedUsername = username.trim().toLowerCase();

    if (
      (normalizedEmail === ADMIN_EMAIL ||
        normalizedUsername === ADMIN_USERNAME) &&
      password === ADMIN_PASSWORD
    ) {
      return true;
    }

    return false;
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
      <CallPage
        currentUserProfile={currentUserProfile}
        initialMatchMode={initialMatchMode}
        onNavigateToPlus={handleNavigateToPlus}
      />
    ) : (
      <LandingPage
        onJoinAction={() => handleNavigateToAuth(true, "SOLO")}
        onSignInAction={() => handleNavigateToAuth(false, "SOLO")}
        onModeAction={handleNavigateToCallMode}
        onGroupVibesAction={() => handleNavigateToCallMode("GROUP")}
      />
    );
  }

  if (currentRoute === "/vibe-plus" || currentRoute === "/plus") {
    return <VibePlusPage />;
  }

  if (currentRoute === "/auth" || currentRoute === "/signin") {
    return (
      <div
        className="animate-fade-in auth-route-shell"
        style={{ minHeight: "100vh" }}
      >
        <div
          className="auth-back-shell"
          style={{ maxWidth: 1200, margin: "0 auto", padding: "24px 40px 0" }}
        >
          <button className="auth-back-button" onClick={handleNavigateHome}>
            <span className="auth-back-icon" aria-hidden="true">
              <svg
                width="22"
                height="22"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M19 12H5"
                  stroke="currentColor"
                  strokeWidth="2.6"
                  strokeLinecap="round"
                />
                <path
                  d="M11 6L5 12L11 18"
                  stroke="currentColor"
                  strokeWidth="2.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
          </button>
        </div>
        <AuthPage
          canUseLocalLogin={canUseLocalLogin}
          initialIsSignUp={currentRoute === "/signin" ? false : startWithSignUp}
          onAuthSuccess={handleAuthSuccess}
        />
      </div>
    );
  }

  /* ── Landing ─────────────────────────────────────────── */
  return (
    <LandingPage
      onJoinAction={() => handleNavigateToAuth(true, "SOLO")}
      onSignInAction={() => handleNavigateToAuth(false, "SOLO")}
      onModeAction={handleNavigateToCallMode}
      onGroupVibesAction={() => handleNavigateToCallMode("GROUP")}
    />
  );
}

