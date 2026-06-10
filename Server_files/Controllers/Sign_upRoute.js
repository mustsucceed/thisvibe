import bcrypt from "bcrypt";
import crypto from "node:crypto";
import User from "../Models/UserModel.js";
import { sendVerificationEmail } from "../Verify.js";

const getVerificationExpiry = () => new Date(Date.now() + 24 * 60 * 60 * 1000);

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
          message: "Email already exists",
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

      await sendVerificationEmail({
        email: normalizedEmail,
        token: emailVerificationToken,
      });

      return res.status(200).json({
        message: "We sent a fresh verification email.",
        email: existingUser.email,
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

    await sendVerificationEmail({
      email: normalizedEmail,
      token: emailVerificationToken,
    });

    res.status(201).json({
      message: "Account created. Check your email to verify your account.",
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


