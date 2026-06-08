import { useState } from "react";
import { Mail, Lock, User, Eye, EyeOff, ArrowRight } from "lucide-react";
import "./AuthPage.css";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

export default function AuthPage({
  initialIsSignUp = true,
  canUseLocalLogin,
  onAccountCreated,
  onAuthSuccess,
}) {
  const [isSignUp,      setIsSignUp]      = useState(initialIsSignUp);
  const [showPassword,  setShowPassword]  = useState(false);
  const [isLoading,     setIsLoading]     = useState(false);
  const [error,         setError]         = useState("");

  const [formData, setFormData] = useState({
    username: "Ab",
    email:    "admin@gmail.com",
    password: "admin123",
  });

  const setField = (key) => (e) => {
    setError("");
    setFormData((prev) => ({ ...prev, [key]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      /* ── Local account check (created in this session) ── */
      if (!isSignUp && canUseLocalLogin) {
        const ok = await canUseLocalLogin({
          email:    formData.email,
          password: formData.password,
        });
        if (ok) {
          onAuthSuccess({ user: { email: formData.email } });
          return;
        }
      }

      /* ── Register a new local account ─────────────────── */
      if (isSignUp && onAccountCreated) {
        await onAccountCreated({ email: formData.email, password: formData.password });
        onAuthSuccess({ user: { email: formData.email } });
        return;
      }

      /* ── Backend auth ──────────────────────────────────── */
      const endpoint = isSignUp ? "/signup" : "/login";
      const payload  = isSignUp
        ? { username: formData.username, email: formData.email, password: formData.password }
        : { email: formData.email, password: formData.password };

      const res  = await fetch(`${API_BASE_URL}${endpoint}`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(payload),
      });
      const data = await res.json();

      if (res.ok) {
        onAuthSuccess(data);
      } else {
        setError(data.message || "Authentication failed. Please try again.");
      }
    } catch {
      setError("Unable to connect. Please check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const switchMode = () => {
    setIsSignUp((v) => !v);
    setError("");
    setFormData({ username: "", email: "", password: "" });
  };

  return (
    <div className="auth-page-wrapper">
      <div className="auth-orb auth-orb--purple" aria-hidden="true" />
      <div className="auth-orb auth-orb--blue"   aria-hidden="true" />

      <div className="auth-card" role="main">
        {/* Header */}
        <div className="auth-header">
          <div className="auth-logo">the<em>.vibe</em></div>
          <h2>{isSignUp ? "Create your account" : "Welcome back"}</h2>
          <p>
            {isSignUp
              ? "Join thousands of people making real connections."
              : "Enter your details to access your account."}
          </p>
        </div>

        {/* Social auth */}
        <div className="auth-social-row">
          <button type="button" className="auth-social-btn" aria-label="Continue with Google">
            <svg viewBox="0 0 24 24" width="18" height="18">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Google
          </button>
          <button type="button" className="auth-social-btn" aria-label="Continue with Apple">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
              <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.62-1.468 3.608-2.983 1.15-1.674 1.623-3.295 1.64-3.376-.039-.013-3.159-1.213-3.193-4.838-.026-3.035 2.482-4.502 2.598-4.577-1.425-2.083-3.626-2.366-4.417-2.404-2.072-.117-4.103 1.314-5.116 1.314s-2.73-1.197-4.406-1.197zm2.744-2.883c.801-.973 1.341-2.325 1.193-3.663-1.153.047-2.553.77-3.38 1.733-.74.81-1.346 2.186-1.168 3.493 1.288.104 2.554-.593 3.355-1.563z"/>
            </svg>
            Apple
          </button>
        </div>

        <div className="auth-divider"><span>or continue with email</span></div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          {isSignUp && (
            <div className="auth-field">
              <label className="auth-label" htmlFor="auth-username">Username</label>
              <div className="auth-input-wrap">
                <span className="auth-input-icon"><User size={16} /></span>
                <input
                  id="auth-username"
                  className="auth-input"
                  type="text"
                  required
                  autoComplete="username"
                  placeholder="e.g. vibe_master"
                  value={formData.username}
                  onChange={setField("username")}
                />
              </div>
            </div>
          )}

          <div className="auth-field">
            <label className="auth-label" htmlFor="auth-email">Email address</label>
            <div className="auth-input-wrap">
              <span className="auth-input-icon"><Mail size={16} /></span>
              <input
                id="auth-email"
                className="auth-input"
                type="email"
                required
                autoComplete="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={setField("email")}
              />
            </div>
          </div>

          <div className="auth-field">
            <div className="auth-field-header">
              <label className="auth-label" htmlFor="auth-password">Password</label>
              {!isSignUp && (
                <button type="button" className="auth-forgot">Forgot password?</button>
              )}
            </div>
            <div className="auth-input-wrap">
              <span className="auth-input-icon"><Lock size={16} /></span>
              <input
                id="auth-password"
                className="auth-input"
                type={showPassword ? "text" : "password"}
                required
                autoComplete={isSignUp ? "new-password" : "current-password"}
                placeholder="••••••••"
                value={formData.password}
                onChange={setField("password")}
              />
              <button
                type="button"
                className="auth-pw-toggle"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {error && (
            <p style={{ fontSize: 13, color: "#F87171", textAlign: "center", marginTop: -4 }}>
              {error}
            </p>
          )}

          <button type="submit" className="auth-submit" disabled={isLoading}>
            {isLoading ? (
              <div className="auth-spinner" />
            ) : (
              <>
                {isSignUp ? "Create account" : "Sign in"}
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        {/* Switch mode */}
        <div className="auth-footer">
          {isSignUp ? "Already have an account?" : "Don't have an account?"}
          <button type="button" className="auth-switch-btn" onClick={switchMode}>
            {isSignUp ? "Sign in" : "Sign up"}
          </button>
        </div>

        {isSignUp && (
          <p className="auth-terms">
            By creating an account you agree to our{" "}
            <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>.
          </p>
        )}
      </div>
    </div>
  );
}