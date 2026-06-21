const getVerificationUrl = (token) => {
  const apiBaseUrl =
    process.env.API_BASE_URL || `http://localhost:${process.env.PORT || 3001}`;
  const url = new URL("/api/auth/verify-email", apiBaseUrl);
  url.searchParams.set("token", token);
  url.searchParams.set("redirect", "1");
  return url.toString();
};

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

export { getVerificationUrl, sendVerificationEmail };