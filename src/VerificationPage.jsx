import { useEffect, useState } from "react";
import { MailCheck } from "lucide-react";
import "./VerificationPage.css";

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "") + "/api/auth";

export default function VerificationPage({ email, setupToken, verificationUrl, emailError, onContinue, onBackToSignIn }) {
  const [error] = useState(emailError || "");
  const [isChecking, setIsChecking] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  useEffect(() => {
    if (setupToken) onContinue({ email, setupToken });
    return undefined;
  }, [email, onContinue, setupToken]);

  const checkVerificationStatus = async () => {
    if (!email) return;
    setIsChecking(true);
    setStatusMessage("");
    try {
      const response = await fetch(
        `${API_BASE_URL}/verification-status?email=${encodeURIComponent(email)}`,
        { credentials: "include" },
      );
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Unable to check your verification status.");
      if (data.verified && data.setupToken) {
        onContinue({ email, setupToken: data.setupToken });
        return;
      }
      setStatusMessage(
        data.verified
          ? "Your email was verified in another browser. Open the verification link again to continue here."
          : "We are still waiting for you to click the verification link in your email.",
      );
    } catch (requestError) {
      setStatusMessage(requestError.message || "Unable to check your verification status.");
    } finally {
      setIsChecking(false);
    }
  };

  if (setupToken) return null;

  return (
    <main className="verification-page">
      <section className="verification-card" aria-live="polite">
        <div className="verification-emoji-field" aria-hidden="true">
          <span>✦</span><span>✉</span><span>✦</span><span>☻</span>
        </div>
        <div className="verification-icon"><MailCheck size={34} /></div>
        <div className="verification-logo">the<em>.vibe</em></div>
        <p className="verification-kicker">EMAIL VERIFICATION</p>
        <h1>Check your inbox</h1>
        <p className="verification-copy">
          <>We sent a verification link to <strong>{email || "your email address"}</strong>. Open that link to verify your email and continue.</>
        </p>
        {error && <p className="verification-error">{error}</p>}
        {statusMessage && <p className="verification-status-message">{statusMessage}</p>}
        <button className="verification-submit" onClick={checkVerificationStatus} disabled={isChecking || !email}>
          {isChecking ? "Checking..." : "Check verification"}
        </button>
        {verificationUrl && (
          <a className="verification-dev-link" href={verificationUrl} target="_blank" rel="noreferrer">Open verification link</a>
        )}
        <button className="verification-back" onClick={onBackToSignIn}>Back to sign in</button>
      </section>
    </main>
  );
}
