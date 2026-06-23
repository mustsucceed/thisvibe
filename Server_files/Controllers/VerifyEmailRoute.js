import User from "../Models/UserModel.js";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";

const getFrontendOrigin = () => {
  const configuredOrigin =
    process.env.VERIFICATION_FRONTEND_ORIGIN ||
    process.env.FRONTEND_ORIGIN ||
    "http://localhost:5173";
  return configuredOrigin.split(",")[0].trim();
};

const getFrontendAuthUrl = (params = {}) => {
  const url = new URL("/verify-email", getFrontendOrigin());
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      url.searchParams.set(key, String(value));
    }
  });
  return url.toString();
};

const createProfileSetupToken = (user) =>
  jwt.sign(
    { id: user._id, email: user.email, purpose: "profile-setup" },
    process.env.JWT_SECRET,
    { expiresIn: "30m" },
  );

const profileSetupCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  maxAge: 30 * 60 * 1000,
};

export const VerifyEmail = async (req, res) => {
  try {
    const { token, redirect } = req.query;
    const shouldRedirect = redirect === "1";

    if (!token) {
      if (shouldRedirect) {
        return res.redirect(getFrontendAuthUrl({ verifyError: "missing-token" }));
      }
      return res.status(400).json({ message: "Verification token is required" });
    }

    const user = await User.findOne({
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: new Date() },
    });

    if (!user) {
      if (shouldRedirect) {
        return res.redirect(getFrontendAuthUrl({ verifyError: "invalid-or-expired" }));
      }
      return res.status(400).json({ message: "Invalid or expired verification link" });
    }

    user.status = true;
    user.isEmailVerified = true;
    user.emailVerifiedAt = new Date();
    user.emailVerificationToken = null;
    user.emailVerificationExpires = null;
    await user.save();

    if (shouldRedirect) {
      if (!process.env.JWT_SECRET) {
        return res.status(500).json({ message: "JWT_SECRET is missing from the environment" });
      }
      const setupToken = jwt.sign(
        { id: user._id, email: user.email, purpose: "profile-setup" },
        process.env.JWT_SECRET,
        { expiresIn: "30m" },
      );
      res.cookie("profileSetupToken", setupToken, profileSetupCookieOptions);
      return res.redirect(getFrontendAuthUrl({ verified: "true", email: user.email, setupToken }));
    }

    const setupToken = process.env.JWT_SECRET ? createProfileSetupToken(user) : undefined;
    if (setupToken) res.cookie("profileSetupToken", setupToken, profileSetupCookieOptions);
    res.json({ message: "Email successfully verified", email: user.email, verified: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const CheckEmailVerification = async (req, res) => {
  try {
    const email = String(req.query.email || "").trim().toLowerCase();

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const user = await User.findOne({ email }).select("status isEmailVerified email");

    if (!user) {
      return res.status(404).json({ message: "Account not found" });
    }

    let setupToken;
    const cookieToken = req.cookies?.profileSetupToken;
    if (cookieToken && process.env.JWT_SECRET) {
      try {
        const claims = jwt.verify(cookieToken, process.env.JWT_SECRET);
        if (claims.purpose === "profile-setup" && claims.email === user.email) {
          setupToken = cookieToken;
        }
      } catch {
        // A stale setup cookie means the verification link must be opened again.
      }
    }

    res.json({
      email: user.email,
      verified: Boolean(user.isEmailVerified || user.status),
      setupToken,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const CompleteProfile = async (req, res) => {
  try {
    const { email, username, image, setupToken } = req.body;
    const normalizedEmail = String(email || "").trim().toLowerCase();
    const trimmedUsername = String(username || "").trim();

    if (!normalizedEmail || !trimmedUsername) {
      return res.status(400).json({ message: "Email and username are required" });
    }

    if (!setupToken || !process.env.JWT_SECRET) {
      return res.status(401).json({ message: "Your profile setup session has expired. Verify your email again." });
    }

    let setupClaims;
    try {
      setupClaims = jwt.verify(setupToken, process.env.JWT_SECRET);
    } catch {
      return res.status(401).json({ message: "Your profile setup session has expired. Verify your email again." });
    }

    if (setupClaims.purpose !== "profile-setup" || setupClaims.email !== normalizedEmail) {
      return res.status(403).json({ message: "This profile setup session is not valid for this account." });
    }

    if (trimmedUsername.length < 3 || trimmedUsername.length > 32) {
      return res.status(400).json({
        message: "Username must be between 3 and 32 characters",
      });
    }

    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(404).json({ message: "Account not found" });
    }

    if (!(user.isEmailVerified || user.status)) {
      return res.status(403).json({
        message: "Please verify your email before creating a profile.",
      });
    }

    const existingUsername = await User.findOne({
      username: trimmedUsername,
      _id: { $ne: user._id },
    }).select("_id");

    if (existingUsername) {
      return res.status(409).json({ message: "Username already exists" });
    }

    user.username = trimmedUsername;
    user.profile = {
      ...user.profile,
      displayName: trimmedUsername,
      images: image ? [image] : [],
      completedAt: new Date(),
    };
    await user.save();

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({ message: "JWT_SECRET is missing from the environment" });
    }

    const activeSessionId = uuidv4();
    user.activeSessionId = activeSessionId;
    await user.save();

    const token = jwt.sign(
      { id: user._id, email: user.email, sessionId: activeSessionId },
      process.env.JWT_SECRET,
      { expiresIn: "7d" },
    );

    // sameSite must be "none" for cross-origin cookie (Vercel → Render)
    res.cookie("token", token, {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      message: "Profile created",
      token,
      user: {
        email: user.email,
        username: user.username,
        profile: user.profile,
      },
    });
  } catch (error) {
    if (error.code === 11000 && error.keyPattern?.username) {
      return res.status(409).json({ message: "Username already exists" });
    }
    res.status(500).json({ message: error.message });
  }
};

export const UpdateProfile = async (req, res) => {
  try {
    const trimmedUsername = String(req.body.username || "").trim();
    const image = String(req.body.image || "");

    if (trimmedUsername.length < 3 || trimmedUsername.length > 32) {
      return res.status(400).json({ message: "Username must be between 3 and 32 characters" });
    }

    const existingUsername = await User.findOne({
      username: trimmedUsername,
      _id: { $ne: req.authUser._id },
    }).select("_id");

    if (existingUsername) {
      return res.status(409).json({ message: "Username already exists" });
    }

    const user = await User.findById(req.authUser._id);
    user.username = trimmedUsername;
    user.profile = {
      ...user.profile,
      displayName: trimmedUsername,
      images: image ? [image] : [],
    };
    await user.save();

    return res.json({
      message: "Profile updated",
      user: { email: user.email, username: user.username, profile: user.profile },
    });
  } catch (error) {
    if (error.code === 11000 && error.keyPattern?.username) {
      return res.status(409).json({ message: "Username already exists" });
    }
    return res.status(500).json({ message: error.message });
  }
};
