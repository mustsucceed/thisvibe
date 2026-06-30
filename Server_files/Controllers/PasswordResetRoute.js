import bcrypt from "bcrypt";
import crypto from "node:crypto";
import User from "../Models/UserModel.js";
import {
  getPasswordResetUrl,
  sendPasswordResetEmail,
} from "../Routes/emailService.js";

// ===== Password Reset Token Config =====
const PASSWORD_RESET_TOKEN_BYTES = 32;
const PASSWORD_RESET_TOKEN_TTL_MS = 15 * 60 * 1000;

// ===== Password Reset Token Helpers =====
const hashResetToken = (token) =>
  crypto.createHash("sha256").update(token).digest("hex");

const canExposeDevResetLink = () =>
  process.env.NODE_ENV !== "production" ||
  process.env.EXPOSE_PASSWORD_RESET_LINK === "true";

// ===== Request Password Reset Link =====
export const RequestPasswordReset = async (req, res) => {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ message: "Enter a valid email address" });
    }

    const user = await User.findOne({ email });
    const genericResponse = {
      message: "If that account exists, a password reset link has been sent.",
    };

    if (!user) {
      return res.json(genericResponse);
    }

    const resetToken = crypto
      .randomBytes(PASSWORD_RESET_TOKEN_BYTES)
      .toString("base64url");

    user.passwordResetToken = hashResetToken(resetToken);
    user.passwordResetExpires = new Date(
      Date.now() + PASSWORD_RESET_TOKEN_TTL_MS,
    );
    await user.save();

    const resetUrl = getPasswordResetUrl({ token: resetToken, email });

    try {
      await sendPasswordResetEmail({ email, token: resetToken });
      return res.json({
        ...genericResponse,
        resetUrl: canExposeDevResetLink() ? resetUrl : undefined,
      });
    } catch (error) {
      if (!canExposeDevResetLink()) {
        throw error;
      }

      console.warn(
        `Password reset email could not be sent to ${email}. Dev reset URL: ${resetUrl}`,
      );

      return res.json({
        ...genericResponse,
        emailSent: false,
        emailError: error.message,
        resetUrl,
      });
    }
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// ===== Save New Password From Reset Link =====
export const ResetPassword = async (req, res) => {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    const token = String(req.body.token || "").trim();
    const password = String(req.body.password || "");
    const confirmPassword = String(req.body.confirmPassword || "");

    if (!email || !token) {
      return res.status(400).json({ message: "Reset link is invalid" });
    }

    if (password.length < 8) {
      return res
        .status(400)
        .json({ message: "Password must be at least 8 characters" });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    const user = await User.findOne({
      email,
      passwordResetToken: hashResetToken(token),
      passwordResetExpires: { $gt: new Date() },
    });

    if (!user) {
      return res
        .status(400)
        .json({ message: "Reset link is invalid or expired" });
    }

    user.password = await bcrypt.hash(password, 12);
    user.passwordResetToken = null;
    user.passwordResetExpires = null;
    user.activeSessionId = null;
    await user.save();

    res.clearCookie("token", {
      httpOnly: true,
      secure: true,
      sameSite: "none",
    });

    return res.json({ message: "Password reset successful" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
