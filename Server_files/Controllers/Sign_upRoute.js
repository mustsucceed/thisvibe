import bcrypt from "bcrypt";
import crypto from "node:crypto";
import User from "../Models/UserModel.js";
import { getVerificationUrl, sendVerificationEmail } from "../Routes/emailService.js";

const getVerificationExpiry = () => new Date(Date.now() + 24 * 60 * 60 * 1000);
const canExposeDevVerificationLink = () =>
  process.env.NODE_ENV !== "production" ||
  process.env.EXPOSE_VERIFICATION_LINK === "true";

const sendVerificationEmailForSignup = async ({ email, token }) => {
  const verificationUrl = getVerificationUrl(token);

  try {
    await sendVerificationEmail({ email, token });

    return {
      emailSent: true,
      verificationUrl: canExposeDevVerificationLink()
        ? verificationUrl
        : undefined,
    };
  } catch (error) {
    if (!canExposeDevVerificationLink()) {
      throw error;
    }

    console.warn(
      `Verification email could not be sent to ${email}. Dev verification URL: ${verificationUrl}`,
    );

    return {
      emailSent: false,
      emailError: error.message,
      verificationUrl,
    };
  }
};

const Signup = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const usernameBase =
      normalizedEmail
        .split("@")[0]
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, "_")
        .replace(/_+/g, "_")
        .replace(/^_+|_+$/g, "")
        .slice(0, 24) || "vibe_user";
    let trimmedUsername = usernameBase;
    let suffix = 0;

    const existingUser = await User.findOne({ email: normalizedEmail });

    if (existingUser) {
      if (existingUser.profile?.completedAt) {
        return res.status(409).json({
          message: "Verification email has been sent",
        });
      }

      if (existingUser.isEmailVerified || existingUser.status) {
        return res.status(200).json({
          message: "Email already verified. Create your profile.",
          verified: true,
          email: existingUser.email,
        });
      }

      const emailVerificationToken = crypto.randomBytes(32).toString("hex");

      existingUser.emailVerificationToken = emailVerificationToken;
      existingUser.emailVerificationExpires = getVerificationExpiry();
      existingUser.emailVerifiedAt = null;
      existingUser.isEmailVerified = false;
      existingUser.status = false;
      await existingUser.save();

      const verificationDelivery = await sendVerificationEmailForSignup({
        email: normalizedEmail,
        token: emailVerificationToken,
      });

      return res.status(200).json({
        message: verificationDelivery.emailSent
          ? "We sent a fresh verification email."
          : "Account ready for testing. Use the verification link below.",
        email: existingUser.email,
        ...verificationDelivery,
      });
    }

    while (await User.exists({ username: trimmedUsername })) {
      suffix += 1;
      trimmedUsername = `${usernameBase}_${suffix}`.slice(0, 32);
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const emailVerificationToken = crypto.randomBytes(32).toString("hex");

    await User.create({
      username: trimmedUsername,
      email: normalizedEmail,
      password: hashedPassword,
      isEmailVerified: false,
      emailVerificationToken,
      emailVerificationExpires: getVerificationExpiry(),
    });

    const verificationDelivery = await sendVerificationEmailForSignup({
      email: normalizedEmail,
      token: emailVerificationToken,
    });

    res.status(201).json({
      message: verificationDelivery.emailSent
        ? "Account created. Check your email to verify your account."
        : "Account created for testing. Use the verification link below.",
      email: normalizedEmail,
      ...verificationDelivery,
    });
  } catch (error) {
    if (error.code === 11000 && error.keyPattern?.email) {
      return res.status(409).json({
        message: "Email already exists",
      });
    }

    res.status(500).json({
      message: error.message,
    });
  }
};

export default Signup;