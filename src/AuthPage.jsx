import { useState } from "react";
import "./AuthPage.css";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

export default function AuthPage({
  initialIsSignUp = true,
  canUseLocalLogin,
  onAccountCreated,
  onAuthSuccess,
}) {
  const [isSignUp, setIsSignUp] = useState(initialIsSignUp);
  const [signupForm, setSignupForm] = useState({
    firstname: "",
    lastname: "",
    username: "",
    email: "",
    countryCode: "+234",
    phone: "",
    dobMonth: "",
    dobDay: "",
    dobYear: "",
    password: "",
    confirmPassword: "",
  });
  const [signinForm, setSigninForm] = useState({
    email: "",
    password: "",
  });
  const [statusMessage, setStatusMessage] = useState("");
  const [statusType, setStatusType] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateSignupField = (field, value) => {
    setSignupForm((currentForm) => ({
      ...currentForm,
      [field]: value,
    }));
  };

  const updateSigninField = (field, value) => {
    setSigninForm((currentForm) => ({
      ...currentForm,
      [field]: value,
    }));
  };

  const resetStatus = () => {
    setStatusMessage("");
    setStatusType("");
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
    <div className="vibe-auth-container">
      <div className="auth-card-wrapper">
        <div className="auth-toggle-bar">
          <button
            className={`toggle-btn ${isSignUp ? "active" : ""}`}
            onClick={() => {
              setIsSignUp(true);
              resetStatus();
            }}
            type="button"
          >
            Create account
          </button>
          <button type="button" className="auth-social-btn" aria-label="Continue with Apple">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
              <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.62-1.468 3.608-2.983 1.15-1.674 1.623-3.295 1.64-3.376-.039-.013-3.159-1.213-3.193-4.838-.026-3.035 2.482-4.502 2.598-4.577-1.425-2.083-3.626-2.366-4.417-2.404-2.072-.117-4.103 1.314-5.116 1.314s-2.73-1.197-4.406-1.197zm2.744-2.883c.801-.973 1.341-2.325 1.193-3.663-1.153.047-2.553.77-3.38 1.733-.74.81-1.346 2.186-1.168 3.493 1.288.104 2.554-.593 3.355-1.563z"/>
            </svg>
            Apple
          </button>
        </div>

        {isSignUp ? (
          <div className="auth-view-content animate-fade-in">
            <div className="step-tracker">
              <div className="step-item active">
                <span className="step-number">1</span>
                <span className="step-label">Account</span>
              </div>
              <div className="step-line"></div>
              <div className="step-item generic">
                <span className="step-number">2</span>
                <span className="step-label">Verify</span>
              </div>
              <div className="step-line"></div>
              <div className="step-item generic">
                <span className="step-number">3</span>
                <span className="step-label">Profile</span>
              </div>
            </div>

            <h1 className="auth-main-title">Create your account</h1>
            <p className="auth-subtext-marker">
              All fields marked <span className="req-asterisk">*</span> are
              required.
            </p>

            <div className="oauth-row grid-3">
              <button className="oauth-btn" type="button">
                <span className="g-brand">G</span> Google
              </button>
              <button className="oauth-btn" type="button">
                Apple
              </button>
              <button className="oauth-btn" type="button">
                <span className="f-brand">f</span> Facebook
              </button>
            </div>

            <div className="auth-divider-line">
              <span>or with email</span>
            </div>

            <form onSubmit={handleSubmitForSignup} className="auth-form-flow">
              <div className="input-group-row">
                <div className="field-block">
                  <label>
                    First name <span className="req-asterisk">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Alex"
                    value={signupForm.firstname}
                    onChange={(e) =>
                      updateSignupField("firstname", e.target.value)
                    }
                    required
                  />
                </div>
                <div className="field-block">
                  <label>
                    Last name <span className="req-asterisk">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Jordan"
                    value={signupForm.lastname}
                    onChange={(e) =>
                      updateSignupField("lastname", e.target.value)
                    }
                    required
                  />
                </div>
              </div>

              <div className="field-block">
                <label>
                  Username <span className="req-asterisk">*</span>
                </label>
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
                type="submit"
                className="vibe-btn-action-submit continuous-orange"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Creating account..." : "Continue - Verify Phone ->"}
              </button>
            </form>
          </div>
        ) : (
          <div className="auth-view-content animate-fade-in">
            <h1 className="auth-main-title">Welcome back</h1>
            <p className="auth-subtext-marker">
              Sign in to continue your journey.
            </p>

            <div className="oauth-row grid-2">
              <button className="oauth-btn" type="button">
                <span className="g-brand">G</span> Google
              </button>
              <button className="oauth-btn" type="button">
                Apple
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

            <div className="auth-footer-alternate-notice">
              No account yet?{" "}
              <span
                onClick={() => {
                  setIsSignUp(true);
                  resetStatus();
                }}
                className="orange-inline-link high-action-trigger"
              >
                Sign up free
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}