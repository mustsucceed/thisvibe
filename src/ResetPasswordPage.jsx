import { useState } from "react";
import { Check, Eye, EyeOff, Lock } from "lucide-react";
import "./ResetPasswordPage.css";

// ===== Password Reset API Config =====
const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "") + "/api/auth";

export default function ResetPasswordPage({ email, token, onComplete }) {
  // ===== Password Reset Form State =====
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // ===== Password Reset Submit Logic =====
  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!email || !token) {
      setError("Reset link is invalid.");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsSaving(true);

    try {
      const response = await fetch(`${API_BASE_URL}/reset-password`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          token,
          password,
          confirmPassword,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Unable to reset password.");
        return;
      }

      onComplete();
    } catch {
      setError("Unable to reset password. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  // ===== Password Reset Page Layout =====
  return (
    <main className="reset-password-page">
      <form className="reset-password-card" onSubmit={handleSubmit}>
        <div className="reset-password-emoji-field" aria-hidden="true">
          <span>✦</span>
          <span>🔐</span>
          <span>✨</span>
          <span>💜</span>
        </div>
        <div className="reset-password-logo">
          the<em>.vibe</em>
        </div>
        <p className="reset-password-kicker">PASSWORD RESET</p>
        <h1>Choose a new password</h1>
        <p className="reset-password-copy">
          Set a new password for <strong>{email || "your account"}</strong>.
        </p>

        <label className="reset-password-label" htmlFor="new-password">
          New password
        </label>
        <div className="reset-password-input-wrap">
          <Lock size={16} />
          <input
            id="new-password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="new-password"
            placeholder="New password"
            required
          />
          <button
            type="button"
            className="reset-password-toggle"
            onClick={() => setShowPassword((value) => !value)}
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
          </button>
        </div>

        <label className="reset-password-label" htmlFor="confirm-password">
          Confirm password
        </label>
        <div className="reset-password-input-wrap">
          <Lock size={16} />
          <input
            id="confirm-password"
            type={showPassword ? "text" : "password"}
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            autoComplete="new-password"
            placeholder="Confirm password"
            required
          />
        </div>

        {error && <p className="reset-password-error">{error}</p>}

        <button
          className="reset-password-submit"
          type="submit"
          disabled={isSaving}
        >
          {isSaving ? (
            "Resetting..."
          ) : (
            <>
              <span>Reset password</span>
              <Check size={18} />
            </>
          )}
        </button>
      </form>
    </main>
  );
}
