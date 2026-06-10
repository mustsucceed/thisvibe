const getFrontendOrigin = () => {
  const configuredOrigin =
    process.env.VERIFICATION_FRONTEND_ORIGIN ||
    process.env.FRONTEND_ORIGIN ||
    "http://localhost:5173";

  return configuredOrigin.split(",")[0].trim();
};

const getVerificationUrl = (token) => {
  const url = new URL("/auth", getFrontendOrigin());
  url.searchParams.set("verifyToken", token);
  return url.toString();
};

export const sendVerificationEmail = async ({ email, token }) => {
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
      from: process.env.RESEND_FROM_EMAIL || "ThisVibe <onboarding@resend.dev>",
      to: email,
      subject: "Verify your ThisVibe email",
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #171321;">
          <h2>Verify your email</h2>
          <p>Tap the button below to finish setting up your ThisVibe account.</p>
          <p>
            <a href="${verificationUrl}" style="background: #ff6b00; color: white; padding: 12px 18px; border-radius: 10px; display: inline-block; text-decoration: none;">
              Verify email
            </a>
          </p>
          <p>If the button does not work, copy and paste this link into your browser:</p>
          <p>${verificationUrl}</p>
        </div>
      `,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || "Failed to send verification email");
  }
};

