import { useState } from "react";
import "./AuthPage.css";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const getApiBaseUrl = () => {
  if (!API_BASE_URL) {
    throw new Error("VITE_API_BASE_URL is missing from .env");
  }

  return API_BASE_URL.replace(/\/$/, "");
};

export default function AuthPage({
  canUseLocalLogin,
  initialIsSignUp = true,
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

  const handleSubmitForSignup = async (e) => {
    e.preventDefault();
    resetStatus();

    if (signupForm.password !== signupForm.confirmPassword) {
      setStatusType("error");
      setStatusMessage("Passwords do not match.");
      return;
    }

    const dob = `${signupForm.dobYear}-${signupForm.dobMonth.padStart(
      2,
      "0",
    )}-${signupForm.dobDay.padStart(2, "0")}`;

    setIsSubmitting(true);

    try {
      const response = await fetch(`${getApiBaseUrl()}/signup`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          firstname: signupForm.firstname.trim(),
          lastname: signupForm.lastname.trim(),
          username: signupForm.username.trim(),
          email: signupForm.email.trim().toLowerCase(),
          phone: `${signupForm.countryCode}${signupForm.phone.replace(
            /\D/g,
            "",
          )}`,
          dob,
          password: signupForm.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to create account.");
      }

      setStatusType("success");
      setStatusMessage(data.message || "Account created.");
      onAccountCreated?.({
        email: signupForm.email.trim().toLowerCase(),
        password: signupForm.password,
      });
      setIsSignUp(false);
    } catch (error) {
      setStatusType("error");
      setStatusMessage(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitForSignin = async (e) => {
    e.preventDefault();
    resetStatus();
    setIsSubmitting(true);

    try {
      const credentials = {
        email: signinForm.email.trim().toLowerCase(),
        password: signinForm.password,
      };

      if (canUseLocalLogin?.(credentials)) {
        setStatusType("success");
        setStatusMessage("Login successful.");
        onAuthSuccess?.();
        return;
      }

      const response = await fetch(`${getApiBaseUrl()}/signin`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(credentials),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to sign in.");
      }

      setStatusType("success");
      setStatusMessage(data.message || "Login successful.");
      onAuthSuccess?.();
    } catch (error) {
      setStatusType("error");
      setStatusMessage(error.message);
    } finally {
      setIsSubmitting(false);
    }
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
          <button
            className={`toggle-btn ${!isSignUp ? "active" : ""}`}
            onClick={() => {
              setIsSignUp(false);
              resetStatus();
            }}
            type="button"
          >
            Sign in
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
                  type="text"
                  placeholder="alexjordan"
                  value={signupForm.username}
                  onChange={(e) =>
                    updateSignupField("username", e.target.value)
                  }
                  required
                />
              </div>

              <div className="field-block">
                <label>
                  Email address <span className="req-asterisk">*</span>
                </label>
                <input
                  type="email"
                  placeholder="alex@example.com"
                  value={signupForm.email}
                  onChange={(e) => updateSignupField("email", e.target.value)}
                  required
                />
              </div>

              <div className="field-block">
                <div className="label-justify-row">
                  <label>
                    Phone number <span className="req-asterisk">*</span>
                  </label>
                  <span className="input-context-hint">For verification</span>
                </div>
                <div className="phone-input-split">
                  <select
                    className="country-select"
                    value={signupForm.countryCode}
                    onChange={(e) =>
                      updateSignupField("countryCode", e.target.value)
                    }
                  >
                    <option value="+234">NG +234</option>
                    <option value="+1">US +1</option>
                    <option value="+44">GB +44</option>
                  </select>
                  <input
                    type="tel"
                    placeholder="801 234 5678"
                    value={signupForm.phone}
                    onChange={(e) => updateSignupField("phone", e.target.value)}
                    required
                  />
                </div>
                <p className="input-explanatory-note">
                  A 6-digit verification code will be sent to this number.
                </p>
              </div>

              <div className="field-block">
                <label>
                  Date of Birth <span className="req-asterisk">*</span>
                </label>
                <div className="dob-triple-row">
                  <select
                    required
                    value={signupForm.dobMonth}
                    onChange={(e) =>
                      updateSignupField("dobMonth", e.target.value)
                    }
                  >
                    <option value="" disabled>
                      Month
                    </option>
                    <option value="1">January</option>
                    <option value="2">February</option>
                    <option value="3">March</option>
                    <option value="4">April</option>
                    <option value="5">May</option>
                    <option value="6">June</option>
                    <option value="7">July</option>
                    <option value="8">August</option>
                    <option value="9">September</option>
                    <option value="10">October</option>
                    <option value="11">November</option>
                    <option value="12">December</option>
                  </select>
                  <input
                    type="number"
                    placeholder="Day"
                    min="1"
                    max="31"
                    value={signupForm.dobDay}
                    onChange={(e) =>
                      updateSignupField("dobDay", e.target.value)
                    }
                    required
                  />
                  <input
                    type="number"
                    placeholder="Year"
                    min="1920"
                    max="2008"
                    value={signupForm.dobYear}
                    onChange={(e) =>
                      updateSignupField("dobYear", e.target.value)
                    }
                    required
                  />
                </div>
              </div>

              <div className="field-block">
                <label>
                  Password <span className="req-asterisk">*</span>
                </label>
                <input
                  type="password"
                  placeholder="At least 8 characters"
                  minLength={8}
                  value={signupForm.password}
                  onChange={(e) =>
                    updateSignupField("password", e.target.value)
                  }
                  required
                />
                <div className="strength-meter-bar">
                  <span></span>
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>

              <div className="field-block">
                <label>
                  Confirm password <span className="req-asterisk">*</span>
                </label>
                <input
                  type="password"
                  placeholder="Repeat your password"
                  value={signupForm.confirmPassword}
                  onChange={(e) =>
                    updateSignupField("confirmPassword", e.target.value)
                  }
                  required
                />
              </div>

              <div className="legal-checkbox-container">
                <p>
                  I agree to the <a href="#terms">Terms of Service</a> and{" "}
                  <a href="#privacy">Privacy Policy</a>. I confirm I am 18 years
                  or older.
                </p>
              </div>

              {statusMessage && (
                <p className={`auth-status-message ${statusType}`}>
                  {statusMessage}
                </p>
              )}

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

            <div className="auth-divider-line">
              <span>or with email</span>
            </div>

            <form onSubmit={handleSubmitForSignin} className="auth-form-flow">
              <div className="field-block">
                <label>
                  Email address <span className="req-asterisk">*</span>
                </label>
                <input
                  type="email"
                  placeholder="alex@example.com"
                  value={signinForm.email}
                  onChange={(e) => updateSigninField("email", e.target.value)}
                  required
                />
              </div>

              <div className="field-block">
                <div className="label-justify-row">
                  <label>
                    Password <span className="req-asterisk">*</span>
                  </label>
                  <a href="#forgot" className="orange-inline-link">
                    Forgot password?
                  </a>
                </div>
                <input
                  type="password"
                  placeholder="Your password"
                  value={signinForm.password}
                  onChange={(e) =>
                    updateSigninField("password", e.target.value)
                  }
                  required
                />
              </div>

              <div className="keep-signed-in-row">
                <input type="checkbox" id="keep-me-signed" />
                <label htmlFor="keep-me-signed">Keep me signed in</label>
              </div>

              {statusMessage && (
                <p className={`auth-status-message ${statusType}`}>
                  {statusMessage}
                </p>
              )}

              <button
                type="submit"
                className="vibe-btn-action-submit continuous-orange"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Signing in..." : "Sign In ->"}
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
