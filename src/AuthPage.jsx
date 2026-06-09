import { useEffect, useState } from "react";
import {
  ArrowRight,
  ImagePlus,
  Lock,
  Phone,
  User,
} from "lucide-react";
import "./AuthPage.css";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api/auth";

const initialSignupForm = {
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
  bio: "",
  photos: [],
};

const initialSigninForm = {
  email: "",
  password: "",
};

const steps = ["account", "verify", "profile"];

export default function AuthPage({
  initialIsSignUp = true,
  canUseLocalLogin,
  onAuthSuccess,
}) {
  const [modeOverride, setModeOverride] = useState(null);
  const isSignUp = modeOverride ?? initialIsSignUp;
  const [signupForm, setSignupForm] = useState(initialSignupForm);
  const [signinForm, setSigninForm] = useState(initialSigninForm);
  const [signupStep, setSignupStep] = useState("account");
  const [statusMessage, setStatusMessage] = useState("");
  const [statusType, setStatusType] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const verifyToken = searchParams.get("verifyToken");
    const socialAuth = searchParams.get("socialAuth");
    const socialEmail = searchParams.get("email");
    const socialMessage = searchParams.get("message");

    if (socialAuth === "success") {
      queueMicrotask(() => {
        setModeOverride(true);
        setSignupForm((currentForm) => ({
          ...currentForm,
          email: socialEmail || currentForm.email,
        }));
        setSignupStep("complete");
        window.history.replaceState({}, "", window.location.pathname);
        window.setTimeout(() => {
          setSignupStep("profile");
        }, 1300);
      });
      return;
    }

    if (socialAuth === "error") {
      queueMicrotask(() => {
        setStatusMessage(
          socialMessage ||
            "Social account verification is not configured for this provider yet.",
        );
        setStatusType("error");
        window.history.replaceState({}, "", window.location.pathname);
      });
      return;
    }

    if (!verifyToken) return;

    let cancelled = false;

    const verifyEmailToken = async () => {
      setModeOverride(true);
      setSignupStep("verify");
      setIsSubmitting(true);
      setStatusMessage("");
      setStatusType("");

      try {
        const response = await fetch(
          `${API_BASE_URL}/verify-email?token=${encodeURIComponent(
            verifyToken,
          )}`,
          {
            credentials: "include",
          },
        );
        const data = await response.json();

        if (cancelled) return;

        if (!response.ok) {
          setStatusMessage(
            data.message || "Invalid or expired verification link.",
          );
          setStatusType("error");
          return;
        }

        setSignupForm((currentForm) => ({
          ...currentForm,
          email: data.email || currentForm.email,
        }));
        setSignupStep("complete");
        window.history.replaceState({}, "", window.location.pathname);
        window.setTimeout(() => {
          if (!cancelled) setSignupStep("profile");
        }, 1300);
      } catch {
        if (!cancelled) {
          setStatusMessage(
            "Unable to verify your email. Please check your connection and try again.",
          );
          setStatusType("error");
        }
      } finally {
        if (!cancelled) setIsSubmitting(false);
      }
    };

    verifyEmailToken();

    return () => {
      cancelled = true;
    };
  }, []);

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

  const showStatus = (message, type = "error") => {
    setStatusMessage(message);
    setStatusType(type);
  };

  const handleSocialAuth = (providerName) => {
    resetStatus();
    window.location.href = `${API_BASE_URL}/oauth/${providerName}`;
  };

  const switchMode = (nextIsSignUp) => {
    setModeOverride(nextIsSignUp);
    setSignupStep("account");
    resetStatus();
  };

  const handlePhotoUpload = (event) => {
    const files = Array.from(event.target.files ?? []).slice(0, 3);
    if (!files.length) return;

    const readers = files.map(
      (file) =>
        new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result));
          reader.readAsDataURL(file);
        }),
    );

    Promise.all(readers).then((photos) => {
      setSignupForm((currentForm) => ({
        ...currentForm,
        photos: [...currentForm.photos, ...photos].slice(0, 3),
      }));
    });
  };

  const removePhoto = (indexToRemove) => {
    setSignupForm((currentForm) => ({
      ...currentForm,
      photos: currentForm.photos.filter((_, index) => index !== indexToRemove),
    }));
  };

  const getSignupPayload = () => {
    const dob = `${signupForm.dobYear}-${signupForm.dobMonth.padStart(
      2,
      "0",
    )}-${signupForm.dobDay.padStart(2, "0")}`;
    const phone = `${signupForm.countryCode}${signupForm.phone}`.replace(
      /\s+/g,
      "",
    );

    return {
      firstname: signupForm.firstname,
      lastname: signupForm.lastname,
      username: signupForm.username,
      email: signupForm.email,
      phone,
      dob,
      password: signupForm.password,
    };
  };

  const sendVerificationEmail = async () => {
    const response = await fetch(`${API_BASE_URL}/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(getSignupPayload()),
    });
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Unable to send verification email.");
    }

    return data;
  };

  const handleAccountSubmit = async (event) => {
    event.preventDefault();
    resetStatus();

    if (signupForm.password !== signupForm.confirmPassword) {
      showStatus("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);

    try {
      const data = await sendVerificationEmail();

      setSignupStep("verify");
      showStatus(
        data.message || "We sent a verification link to your email.",
        "success",
      );
    } catch {
      showStatus("Unable to connect. Please check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendEmail = async () => {
    resetStatus();
    setIsSubmitting(true);

    try {
      const data = await sendVerificationEmail();
      showStatus(
        data.message || "We sent another verification link to your email.",
        "success",
      );
    } catch (error) {
      showStatus(error.message || "Unable to resend verification email.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const checkEmailVerification = async () => {
    resetStatus();
    setIsSubmitting(true);

    try {
      const response = await fetch(
        `${API_BASE_URL}/verification-status?email=${encodeURIComponent(
          signupForm.email,
        )}`,
        {
          credentials: "include",
        },
      );
      const data = await response.json();

      if (!response.ok) {
        showStatus(data.message || "Unable to check verification status.");
        return;
      }

      if (data.verified) {
        setSignupStep("complete");
        window.setTimeout(() => {
          setSignupStep("profile");
        }, 1300);
        return;
      }

      showStatus("Still waiting on email verification. Open the link we sent you.");
    } catch {
      showStatus("Unable to connect. Please check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const completeSignup = async (event) => {
    event.preventDefault();
    resetStatus();
    setIsSubmitting(true);

    try {
      const response = await fetch(`${API_BASE_URL}/complete-profile`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          email: signupForm.email,
          displayName: signupForm.username,
          vibe: signupForm.bio || "Here to meet new people.",
          lookingFor: "Real conversations",
          images: signupForm.photos,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        showStatus(data.message || "Unable to complete your profile.");
        return;
      }

      setSignupForm(initialSignupForm);
      onAuthSuccess?.(data);
    } catch {
      showStatus("Unable to connect. Please check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSigninSubmit = async (event) => {
    event.preventDefault();
    resetStatus();
    setIsSubmitting(true);

    try {
      if (canUseLocalLogin?.(signinForm)) {
        onAuthSuccess?.({ user: { email: signinForm.email } });
        return;
      }

      const response = await fetch(`${API_BASE_URL}/signin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(signinForm),
      });
      const data = await response.json();

      if (!response.ok) {
        showStatus(data.message || "Email or password is incorrect.");
        return;
      }

      onAuthSuccess?.(data);
    } catch {
      showStatus("Unable to connect. Please check your connection and try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeStepIndex =
    signupStep === "complete" ? steps.length : steps.indexOf(signupStep);

  return (
    <div className="auth-page-wrapper">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">
            the<em>.vibe</em>
          </div>
          <div className="auth-toggle-bar" aria-label="Authentication mode">
            <button
              className={`auth-toggle-btn ${isSignUp ? "active" : ""}`}
              onClick={() => switchMode(true)}
              type="button"
            >
              Create account
            </button>
            <button
              className={`auth-toggle-btn ${!isSignUp ? "active" : ""}`}
              onClick={() => switchMode(false)}
              type="button"
            >
              Sign in
            </button>
          </div>
        </div>

        {isSignUp ? (
          <div className="auth-view-content animate-fade-in">
            <div className="step-tracker">
              {steps.map((step, index) => {
                const isActive = activeStepIndex === index;
                const isDone = activeStepIndex > index;

                return (
                  <div
                    className={`step-segment ${isActive ? "active" : ""} ${
                      isDone ? "complete" : ""
                    }`}
                    key={step}
                  >
                    <span className="step-bar" />
                    <span className="step-label">
                      {step === "account"
                        ? "Account"
                        : step === "verify"
                          ? "Verify"
                          : "Profile"}
                    </span>
                  </div>
                );
              })}
            </div>

            {signupStep === "account" && (
              <>
                <h1 className="auth-main-title">Create your account</h1>
                <p className="auth-subtext-marker">
                  All fields marked <span className="req-asterisk">*</span> are
                  required.
                </p>

                <div className="auth-social-row">
                  <button
                    className="auth-social-btn"
                    type="button"
                    onClick={() => handleSocialAuth("google")}
                  >
                    <span className="g-brand">G</span> Google
                  </button>
                  <button
                    className="auth-social-btn"
                    type="button"
                    onClick={() => handleSocialAuth("apple")}
                  >
                    Apple
                  </button>
                  <button
                    className="auth-social-btn"
                    type="button"
                    onClick={() => handleSocialAuth("facebook")}
                  >
                    <span className="f-brand">f</span> Facebook
                  </button>
                </div>

                <div className="auth-divider">
                  <span>or with email</span>
                </div>

                <form onSubmit={handleAccountSubmit} className="auth-form-flow">
                  <div className="input-group-row">
                    <div className="field-block">
                      <label>
                        First name <span className="req-asterisk">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="Alex"
                        value={signupForm.firstname}
                        onChange={(event) =>
                          updateSignupField("firstname", event.target.value)
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
                        onChange={(event) =>
                          updateSignupField("lastname", event.target.value)
                        }
                        required
                      />
                    </div>
                  </div>

                  <div className="field-block">
                    <label>
                      Username <span className="req-asterisk">*</span>
                    </label>
                    <div className="auth-input-wrap">
                      <span className="auth-input-icon">
                        <User size={16} />
                      </span>
                      <input
                        className="auth-input auth-placeholder-right"
                        type="text"
                        placeholder="e.g. vibe_master"
                        value={signupForm.username}
                        onChange={(event) =>
                          updateSignupField("username", event.target.value)
                        }
                        required
                      />
                    </div>
                  </div>

                  <div className="field-block">
                    <label>
                      Email address <span className="req-asterisk">*</span>
                    </label>
                    <div className="auth-input-wrap">
                      <span className="auth-input-icon">
                        <i className="fa-regular fa-envelope" aria-hidden="true" />
                      </span>
                      <input
                        className="auth-input auth-placeholder-right"
                        type="email"
                        placeholder="alex@example.com"
                        value={signupForm.email}
                        onChange={(event) =>
                          updateSignupField("email", event.target.value)
                        }
                        required
                      />
                    </div>
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
                        onChange={(event) =>
                          updateSignupField("countryCode", event.target.value)
                        }
                      >
                        <option value="+234">NG +234</option>
                        <option value="+1">US +1</option>
                        <option value="+44">GB +44</option>
                      </select>
                      <div className="auth-input-wrap">
                        <span className="auth-input-icon">
                          <Phone size={16} />
                        </span>
                        <input
                          className="auth-input auth-placeholder-right"
                          type="tel"
                          placeholder="801 234 5678"
                          value={signupForm.phone}
                          onChange={(event) =>
                            updateSignupField("phone", event.target.value)
                          }
                          required
                        />
                      </div>
                    </div>
                    <p className="input-explanatory-note">
                      Your email will be used for account verification.
                    </p>
                  </div>

                  <div className="field-block">
                    <label>
                      Date of birth <span className="req-asterisk">*</span>
                    </label>
                    <div className="dob-triple-row">
                      <select
                        required
                        value={signupForm.dobMonth}
                        onChange={(event) =>
                          updateSignupField("dobMonth", event.target.value)
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
                        className="auth-placeholder-right"
                        type="number"
                        placeholder="Day"
                        min="1"
                        max="31"
                        value={signupForm.dobDay}
                        onChange={(event) =>
                          updateSignupField("dobDay", event.target.value)
                        }
                        required
                      />
                      <input
                        className="auth-placeholder-right"
                        type="number"
                        placeholder="Year"
                        min="1920"
                        max="2008"
                        value={signupForm.dobYear}
                        onChange={(event) =>
                          updateSignupField("dobYear", event.target.value)
                        }
                        required
                      />
                    </div>
                  </div>

                  <div className="field-block">
                    <label>
                      Password <span className="req-asterisk">*</span>
                    </label>
                    <div className="auth-input-wrap">
                      <span className="auth-input-icon">
                        <Lock size={16} />
                      </span>
                      <input
                        className="auth-input auth-placeholder-right"
                        type="password"
                        placeholder="At least 8 characters"
                        minLength={8}
                        value={signupForm.password}
                        onChange={(event) =>
                          updateSignupField("password", event.target.value)
                        }
                        required
                      />
                    </div>
                    <div className="strength-meter-bar">
                      <span />
                      <span />
                      <span />
                      <span />
                    </div>
                  </div>

                  <div className="field-block">
                    <label>
                      Confirm password <span className="req-asterisk">*</span>
                    </label>
                    <input
                      className="auth-placeholder-right"
                      type="password"
                      placeholder="Repeat your password"
                      value={signupForm.confirmPassword}
                      onChange={(event) =>
                        updateSignupField("confirmPassword", event.target.value)
                      }
                      required
                    />
                  </div>

                  <div className="legal-checkbox-container">
                    <p>
                      I agree to the <a href="#terms">Terms of Service</a> and{" "}
                      <a href="#privacy">Privacy Policy</a>. I confirm I am 18
                      years or older.
                    </p>
                  </div>

                  {statusMessage && (
                    <p className={`auth-status auth-status--${statusType}`}>
                      {statusMessage}
                    </p>
                  )}

                  <button className="auth-submit" type="submit">
                    Send verification email
                    <ArrowRight size={16} />
                  </button>
                </form>
              </>
            )}

            {signupStep === "verify" && (
              <>
                <div className="email-verify-shell">
                  <div className="email-verify-card">
                    <div className="email-verify-icon-wrap">
                      <i className="fa-regular fa-envelope" aria-hidden="true" />
                      <span className="email-spark email-spark-one">✦</span>
                      <span className="email-spark email-spark-two">✦</span>
                    </div>

                    <h1 className="email-verify-title">Verify your email</h1>
                    <p className="email-verify-copy">
                      To keep a trusted and safe community, we sent an email to{" "}
                      <strong>{signupForm.email || "your email"}</strong> for
                      verification, and you will only do this once.
                    </p>

                    <p className="email-verify-change">
                      Wrong email?{" "}
                      <button
                        type="button"
                        onClick={() => {
                          resetStatus();
                          setSignupStep("account");
                        }}
                      >
                        Change email address
                      </button>
                    </p>

                    <span className="waiting-email-note">
                      Waiting for verification
                    </span>
                    <button
                      className="email-open-mail-btn"
                      type="button"
                      onClick={() => {
                        window.location.href = `mailto:${signupForm.email}`;
                      }}
                    >
                      Open my mail now
                    </button>

                    <p className="email-verify-resend">
                      Did not receive?{" "}
                      <button
                        type="button"
                        onClick={handleResendEmail}
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? "Sending..." : "Resend email"}
                      </button>
                    </p>

                    {statusMessage && (
                      <p className={`auth-status auth-status--${statusType}`}>
                        {statusMessage}
                      </p>
                    )}

                    <button
                      className="email-verify-check-btn"
                      type="button"
                      onClick={checkEmailVerification}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? "Checking..." : "I have verified"}
                    </button>
                  </div>

                  <p className="email-verify-login">
                    Have an account?{" "}
                    <button type="button" onClick={() => switchMode(false)}>
                      Log in
                    </button>
                  </p>
                </div>
              </>
            )}

            {signupStep === "profile" && (
              <>
                <h1 className="auth-main-title">Set up your profile</h1>
                <p className="auth-subtext-marker">
                  Add a few finishing touches before your first match.
                </p>

                <form onSubmit={completeSignup} className="auth-form-flow">
                  <div className="field-block">
                    <label>Profile photos</label>
                    <div className="profile-image-grid">
                      {signupForm.photos.map((photo, index) => (
                        <div className="profile-image-tile" key={photo}>
                          <img src={photo} alt="Profile preview" />
                          <button
                            type="button"
                            onClick={() => removePhoto(index)}
                            aria-label="Remove photo"
                          >
                            x
                          </button>
                        </div>
                      ))}
                      {signupForm.photos.length < 3 && (
                        <label className="profile-image-upload">
                          <ImagePlus size={24} />
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={handlePhotoUpload}
                          />
                        </label>
                      )}
                    </div>
                  </div>

                  <div className="field-block">
                    <label>Short bio</label>
                    <textarea
                      className="auth-placeholder-right"
                      placeholder="Tell people what kind of conversations you like."
                      value={signupForm.bio}
                      onChange={(event) =>
                        updateSignupField("bio", event.target.value)
                      }
                    />
                  </div>

                  {statusMessage && (
                    <p className={`auth-status auth-status--${statusType}`}>
                      {statusMessage}
                    </p>
                  )}

                  <button
                    className="auth-submit"
                    type="submit"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Creating account..." : "Complete setup"}
                    {!isSubmitting && <ArrowRight size={16} />}
                  </button>
                </form>
              </>
            )}

            {signupStep === "complete" && (
              <div className="verification-complete-panel">
                <div className="verification-complete-mark">
                  <span className="verification-ripple" />
                  <svg viewBox="0 0 80 80" aria-hidden="true">
                    <circle cx="40" cy="40" r="32" />
                    <path d="M26 41.5 36.5 52 56 29" />
                  </svg>
                </div>
                <h1 className="auth-main-title">Verification complete</h1>
                <p className="verification-complete-copy">
                  Your account is ready. Taking you to the call room now.
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="auth-view-content animate-fade-in">
            <h1 className="auth-main-title">Welcome back</h1>
            <p className="auth-subtext-marker">
              Sign in to continue your journey.
            </p>

            <div className="auth-social-row auth-social-row--two">
              <button
                className="auth-social-btn"
                type="button"
                onClick={() => handleSocialAuth("google")}
              >
                <span className="g-brand">G</span> Google
              </button>
              <button
                className="auth-social-btn"
                type="button"
                onClick={() => handleSocialAuth("apple")}
              >
                Apple
              </button>
            </div>

            <div className="auth-divider">
              <span>or with email</span>
            </div>

            <form onSubmit={handleSigninSubmit} className="auth-form-flow">
              <div className="field-block">
                <label>
                  Email address <span className="req-asterisk">*</span>
                </label>
                <div className="auth-input-wrap">
                  <span className="auth-input-icon">
                    <i className="fa-regular fa-envelope" aria-hidden="true" />
                  </span>
                  <input
                    className="auth-input auth-placeholder-right"
                    type="email"
                    placeholder="alex@example.com"
                    value={signinForm.email}
                    onChange={(event) =>
                      updateSigninField("email", event.target.value)
                    }
                    required
                  />
                </div>
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
                <div className="auth-input-wrap">
                  <span className="auth-input-icon">
                    <Lock size={16} />
                  </span>
                  <input
                    className="auth-input auth-placeholder-right"
                    type="password"
                    placeholder="Your password"
                    value={signinForm.password}
                    onChange={(event) =>
                      updateSigninField("password", event.target.value)
                    }
                    required
                  />
                </div>
              </div>

              <div className="keep-signed-in-row">
                <input type="checkbox" id="keep-me-signed" />
                <label htmlFor="keep-me-signed">Keep me signed in</label>
              </div>

              {statusMessage && (
                <p className={`auth-status auth-status--${statusType}`}>
                  {statusMessage}
                </p>
              )}

              <button
                className="auth-submit"
                type="submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Signing in..." : "Sign in"}
                {!isSubmitting && <ArrowRight size={16} />}
              </button>
            </form>

            <div className="auth-footer">
              No account yet?{" "}
              <button
                className="auth-switch-btn"
                type="button"
                onClick={() => switchMode(true)}
              >
                Sign up free
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
