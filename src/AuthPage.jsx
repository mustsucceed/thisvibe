import { useEffect, useState } from "react";
import { ArrowRight, Eye, EyeOff, Lock, Mail, User } from "lucide-react";
import "./AuthPage.css";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:3000/api/auth";

const emptyForm = {
  email: "",
  username: "",
  password: "",
};

const emptyProfile = {
  username: "",
  image: "",
};

const MAX_PROFILE_IMAGE_SIZE = 3 * 1024 * 1024;

export default function AuthPage({
  initialIsSignUp = true,
  canUseLocalLogin,
  onAuthSuccess,
}) {
  const [isSignUp, setIsSignUp] = useState(initialIsSignUp);
  const [authStep, setAuthStep] = useState("form");
  const [formData, setFormData] = useState(emptyForm);
  const [profileData, setProfileData] = useState(emptyProfile);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [statusType, setStatusType] = useState("");
  const [emailNotVerified, setEmailNotVerified] = useState(false);
  const [verificationConfirmed, setVerificationConfirmed] = useState(false);

  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const verifyToken = searchParams.get("verifyToken");
    const verifiedEmail = searchParams.get("email");
    const verifyError = searchParams.get("verifyError");

    if (searchParams.get("verified") === "true") {
      setIsSignUp(true);
      setAuthStep("profile");
      setFormData((currentForm) => ({
        ...currentForm,
        email: verifiedEmail || currentForm.email,
      }));
      window.history.replaceState({}, "", window.location.pathname);
      return;
    }

    if (verifyError) {
      setIsSignUp(true);
      setAuthStep("confirm");
      setStatusMessage("Invalid or expired verification link.");
      setStatusType("error");
      window.history.replaceState({}, "", window.location.pathname);
      return;
    }

    if (!verifyToken) return;

    let cancelled = false;

    const verifyEmail = async () => {
      setIsSignUp(true);
      setAuthStep("confirm");
      setIsLoading(true);
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
          setStatusMessage(data.message || "Invalid verification link.");
          setStatusType("error");
          return;
        }

        setFormData((currentForm) => ({
          ...currentForm,
          email: data.email || currentForm.email,
        }));
        setEmailNotVerified(false);
        setAuthStep("profile");
        window.history.replaceState({}, "", window.location.pathname);
      } catch {
        if (!cancelled) {
          setStatusMessage("Unable to verify email. Please try again.");
          setStatusType("error");
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    verifyEmail();

    return () => {
      cancelled = true;
    };
  }, [onAuthSuccess]);

  const setField = (key) => (event) => {
    setStatusMessage("");
    setStatusType("");
    setEmailNotVerified(false);
    setVerificationConfirmed(false);
    setFormData((currentForm) => ({
      ...currentForm,
      [key]: event.target.value,
    }));
  };

  const setProfileField = (key) => (event) => {
    setStatusMessage("");
    setStatusType("");
    setProfileData((currentProfile) => ({
      ...currentProfile,
      [key]: event.target.value,
    }));
  };

  const handleProfileImage = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showStatus("Please choose an image file.");
      return;
    }

    if (file.size > MAX_PROFILE_IMAGE_SIZE) {
      showStatus("Image is too big.");
      event.target.value = "";
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      setProfileData((currentProfile) => ({
        ...currentProfile,
        image: String(reader.result || ""),
      }));
      setStatusMessage("");
      setStatusType("");
    };

    reader.readAsDataURL(file);
  };

  const showStatus = (message, type = "error") => {
    setStatusMessage(message);
    setStatusType(type);
  };

  const sendVerificationEmail = async () => {
    const response = await fetch(`${API_BASE_URL}/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Unable to send verification email.");
    }

    return data;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setStatusMessage("");
    setStatusType("");
    setIsLoading(true);
    setVerificationConfirmed(false);

    try {
      if (!isSignUp && canUseLocalLogin?.(formData)) {
        onAuthSuccess?.({ user: { email: formData.email } });
        return;
      }

      if (isSignUp) {
        const data = await sendVerificationEmail();
        setEmailNotVerified(false);

        if (data.verified) {
          setAuthStep("profile");
          showStatus(data.message || "Email already verified.", "success");
          return;
        }

        setVerificationConfirmed(false);
        setAuthStep("confirm");
        showStatus(
          data.message || "We sent a verification link to your email.",
          "success",
        );
        return;
      }

      const response = await fetch(`${API_BASE_URL}/signin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          username: formData.username,
          password: formData.password,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        showStatus(data.message || "Username or password is incorrect.");
        return;
      }

      onAuthSuccess?.(data);
    } catch (error) {
      showStatus(
        error.message ||
          "Unable to connect. Please check your connection and try again.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendEmail = async () => {
    setStatusMessage("");
    setStatusType("");
    setEmailNotVerified(false);
    setVerificationConfirmed(false);
    setIsLoading(true);

    try {
      const data = await sendVerificationEmail();
      showStatus(
        data.message || "We sent another verification link to your email.",
        "success",
      );
    } catch (error) {
      showStatus(error.message || "Unable to resend verification email.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckVerification = async () => {
    setStatusMessage("");
    setStatusType("");
    setIsLoading(true);

    try {
      const response = await fetch(
        `${API_BASE_URL}/verification-status?email=${encodeURIComponent(
          formData.email,
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
        setEmailNotVerified(false);
        setVerificationConfirmed(true);
        window.setTimeout(() => {
          setAuthStep("profile");
        }, 1300);
        return;
      }

      setEmailNotVerified(true);
      showStatus("Open the verification link in your email first.");
    } catch {
      showStatus("Unable to check verification right now.");
    } finally {
      setIsLoading(false);
    }
  };

  const switchMode = () => {
    setIsSignUp((currentMode) => !currentMode);
    setAuthStep("form");
    setEmailNotVerified(false);
    setVerificationConfirmed(false);
    setStatusMessage("");
    setStatusType("");
    setFormData(emptyForm);
    setProfileData(emptyProfile);
  };

  const returnToEmailForm = () => {
    setAuthStep("form");
    setEmailNotVerified(false);
    setVerificationConfirmed(false);
    setStatusMessage("");
    setStatusType("");
  };

  const handleProfileSubmit = async (event) => {
    event.preventDefault();
    setStatusMessage("");
    setStatusType("");
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/complete-profile`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          email: formData.email,
          username: profileData.username,
          image: profileData.image,
        }),
      });
      const responseText = await response.text();
      let data = {};

      try {
        data = responseText ? JSON.parse(responseText) : {};
      } catch {
        data = { message: responseText };
      }

      if (!response.ok) {
        showStatus(data.message || "Unable to create your profile.");
        return;
      }

      setAuthStep("complete");
      window.setTimeout(() => onAuthSuccess?.(data), 900);
    } catch {
      showStatus("Unable to create your profile right now.");
    } finally {
      setIsLoading(false);
    }
  };

  if (authStep === "confirm") {
    return (
      <div className="auth-page-wrapper">
        <div className="auth-card auth-card--wide" role="main">
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
                <strong>{formData.email || "your email"}</strong> for
                verification, and you will only do this once.
              </p>

              <p className="email-verify-change">
                Not the correct email?{" "}
                <button type="button" onClick={returnToEmailForm}>
                  Change email address
                </button>
              </p>

              {verificationConfirmed ? (
                <div
                  className="verification-inline-complete"
                  aria-live="polite"
                >
                  <span className="verification-inline-ripple" />
                  <svg viewBox="0 0 80 80" aria-hidden="true">
                    <circle cx="40" cy="40" r="32" />
                    <path d="M26 41.5 36.5 52 56 29" />
                  </svg>
                </div>
              ) : (
                <span
                  className={`waiting-email-note ${
                    emailNotVerified ? "waiting-email-note--error" : ""
                  }`}
                >
                  {emailNotVerified
                    ? "Email not verified"
                    : "Waiting for verification"}
                </span>
              )}

              <button
                className="email-open-mail-btn"
                type="button"
                onClick={handleCheckVerification}
                disabled={isLoading || verificationConfirmed}
              >
                {isLoading ? "Checking..." : "Verify email"}
              </button>

              <p className="email-verify-resend">
                Did not receive?{" "}
                <button
                  type="button"
                  onClick={handleResendEmail}
                  disabled={isLoading}
                >
                  {isLoading ? "Sending..." : "Resend email"}
                </button>
              </p>

              {statusMessage && (
                <p className={`auth-status auth-status--${statusType}`}>
                  {statusMessage}
                </p>
              )}

            </div>

            <p className="email-verify-login">
              Have an account?{" "}
              <button type="button" onClick={switchMode}>
                Log in
              </button>
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (authStep === "complete") {
    return (
      <div className="auth-page-wrapper">
        <div className="auth-card" role="main">
          <div className="verification-complete-panel">
            <div className="verification-complete-mark">
              <span className="verification-firework verification-firework--one" />
              <span className="verification-firework verification-firework--two" />
              <span className="verification-firework verification-firework--three" />
              <span className="verification-ripple" />
              <svg viewBox="0 0 80 80" aria-hidden="true">
                <circle cx="40" cy="40" r="32" />
                <path d="M26 41.5 36.5 52 56 29" />
              </svg>
            </div>
            <h1 className="auth-main-title">Account created</h1>
            <p className="verification-complete-copy">
              Your profile is ready. Taking you in now.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (authStep === "profile") {
    return (
      <div className="auth-page-wrapper">
        <div className="auth-card" role="main">
          <div className="auth-header">
            <div className="auth-logo">
              the<em>.vibe</em>
            </div>
            <h2>Create your profile</h2>
            <p>Add a profile image and choose the username people will see.</p>
          </div>

          <form className="auth-form" onSubmit={handleProfileSubmit}>
            <label className="profile-create-upload" htmlFor="profile-image">
              {profileData.image ? (
                <img src={profileData.image} alt="Profile preview" />
              ) : (
                <span>Upload image</span>
              )}
              <input
                id="profile-image"
                type="file"
                accept="image/*"
                onChange={handleProfileImage}
              />
            </label>

            <div className="auth-field">
              <label className="auth-label" htmlFor="profile-username">
                Username
              </label>
              <input
                id="profile-username"
                className="auth-input"
                type="text"
                minLength={3}
                maxLength={32}
                required
                autoComplete="username"
                placeholder="choose_a_username"
                value={profileData.username}
                onChange={setProfileField("username")}
              />
            </div>

            {statusMessage && (
              <p className={`auth-status auth-status--${statusType}`}>
                {statusMessage}
              </p>
            )}

            <button type="submit" className="auth-submit" disabled={isLoading}>
              {isLoading ? <div className="auth-spinner" /> : "Create profile"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page-wrapper">
      <div className="auth-orb auth-orb--purple" aria-hidden="true" />
      <div className="auth-orb auth-orb--blue" aria-hidden="true" />

      <div className="auth-card" role="main">
        <div className="auth-header">
          <div className="auth-logo">
            the<em>.vibe</em>
          </div>
          <h2>{isSignUp ? "Create your account" : "Welcome back"}</h2>
          <p>
            {isSignUp
              ? "Start with your email and password."
              : "Enter your username and password to continue."}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form" noValidate>
          <div className="auth-field">
            <label
              className="auth-label"
              htmlFor={isSignUp ? "auth-email" : "auth-username"}
            >
              {isSignUp ? "Email address" : "Username"}
            </label>
            <div className="auth-input-wrap">
              <span className="auth-input-icon">
                {isSignUp ? <Mail size={16} /> : <User size={16} />}
              </span>
              <input
                id={isSignUp ? "auth-email" : "auth-username"}
                className="auth-input"
                type={isSignUp ? "email" : "text"}
                required
                autoComplete={isSignUp ? "email" : "username"}
                placeholder={isSignUp ? "you@example.com" : "your_username"}
                value={isSignUp ? formData.email : formData.username}
                onChange={setField(isSignUp ? "email" : "username")}
              />
            </div>
          </div>

          <div className="auth-field">
            <div className="auth-field-header">
              <label className="auth-label" htmlFor="auth-password">
                Password
              </label>
              {!isSignUp && (
                <button type="button" className="auth-forgot">
                  Forgot password?
                </button>
              )}
            </div>
            <div className="auth-input-wrap">
              <span className="auth-input-icon">
                <Lock size={16} />
              </span>
              <input
                id="auth-password"
                className="auth-input"
                type={showPassword ? "text" : "password"}
                required
                minLength={8}
                autoComplete={isSignUp ? "new-password" : "current-password"}
                placeholder="••••••••"
                value={formData.password}
                onChange={setField("password")}
              />
              <button
                type="button"
                className="auth-pw-toggle"
                onClick={() => setShowPassword((currentValue) => !currentValue)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {statusMessage && (
            <p className={`auth-status auth-status--${statusType}`}>
              {statusMessage}
            </p>
          )}

          <button type="submit" className="auth-submit" disabled={isLoading}>
            {isLoading ? (
              <div className="auth-spinner" />
            ) : (
              <>
                {isSignUp ? "Send verification email" : "Sign in"}
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        <div className="auth-footer">
          {isSignUp ? "Already have an account?" : "Don't have an account?"}
          <button
            type="button"
            className="auth-switch-btn"
            onClick={switchMode}
          >
            {isSignUp ? "Sign in" : "Sign up"}
          </button>
        </div>
      </div>
    </div>
  );
}
