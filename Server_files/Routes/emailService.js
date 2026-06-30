// ===== Email Verification Link Builder =====
const getVerificationUrl = (token) => {
  const apiBaseUrl =
    process.env.API_BASE_URL || `http://localhost:${process.env.PORT || 3001}`;
  const url = new URL("/api/auth/verify-email", apiBaseUrl);
  url.searchParams.set("token", token);
  url.searchParams.set("redirect", "1");
  return url.toString();
};

// ===== Frontend Reset Origin Builder =====
const getFrontendOrigin = () => {
  const configured =
    process.env.PASSWORD_RESET_FRONTEND_ORIGIN ||
    process.env.VERIFICATION_FRONTEND_ORIGIN ||
    process.env.FRONTEND_ORIGIN ||
    "http://localhost:5173";

  return configured
    .split(",")[0]
    .trim()
    .replace(/\/$/, "");
};

// ===== Password Reset Link Builder =====
const getPasswordResetUrl = ({ token, email }) => {
  const url = new URL("/reset-password", getFrontendOrigin());
  url.searchParams.set("token", token);
  url.searchParams.set("email", email);
  return url.toString();
};

// ===== Verification Email Sender =====
const sendVerificationEmail = async ({ email, token }) => {
  if (!process.env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY is missing from the environment");
  }

  const verificationUrl = getVerificationUrl(token);

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from:
        process.env.VERIFICATION_EMAIL_FROM ||
        "TheVibe <onboarding@resend.dev>",
      to: email,
      subject: "Verify your email",
      html: `
        <p>Welcome to TheVibe.</p>
        <p>Click the link below to verify your email address:</p>
        <p><a href="${verificationUrl}">Verify your email</a></p>
        <p>This link expires in 24 hours.</p>
      `,
      text: `Welcome to TheVibe. Verify your email: ${verificationUrl}`,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Could not send verification email: ${errorText}`);
  }

  return response.json();
};

// ===== Password Reset Email Sender =====
const sendPasswordResetEmail = async ({ email, token }) => {
  if (!process.env.RESEND_API_KEY) {
    throw new Error("RESEND_API_KEY is missing from the environment");
  }

  const resetUrl = getPasswordResetUrl({ token, email });

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from:
        process.env.PASSWORD_RESET_EMAIL_FROM ||
        process.env.VERIFICATION_EMAIL_FROM ||
        "TheVibe <onboarding@resend.dev>",
      to: email,
      subject: "Reset your the.vibe password",
      html: `
        <p>You requested a password reset for TheVibe.</p>
        <p>Click the link below to choose a new password:</p>
        <p><a href="${resetUrl}">Reset your password</a></p>
        <p>This link expires in 15 minutes. If you did not request this, you can ignore this email.</p>
      `,
      text: `Reset your TheVibe password: ${resetUrl}`,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Could not send password reset email: ${errorText}`);
  }

  return response.json();
};

export {
  getPasswordResetUrl,
  getVerificationUrl,
  sendPasswordResetEmail,
  sendVerificationEmail,
};
