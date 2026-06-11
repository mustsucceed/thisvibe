import User from "../Models/UserModel.js";
import jwt from "jsonwebtoken";

const getFrontendOrigin = () => {
  const configuredOrigin =
    process.env.VERIFICATION_FRONTEND_ORIGIN || process.env.FRONTEND_ORIGIN;

  return configuredOrigin.split(",")[0].trim();
};

const getFrontendAuthUrl = (params = {}) => {
  const url = new URL("/auth", getFrontendOrigin());

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      url.searchParams.set(key, String(value));
    }
  });

  return url.toString();
};

export const VerifyEmail = async (req, res) => {
  try {
    const { token, redirect } = req.query;
    const shouldRedirect = redirect === "1";

    if (!token) {
      if (shouldRedirect) {
        return res.redirect(
          getFrontendAuthUrl({ verifyError: "missing-token" }),
        );
      }

      return res.status(400).json({
        message: "Verification token is required",
      });
    }

    const user = await User.findOne({
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: new Date() },
    });

    if (!user) {
      if (shouldRedirect) {
        return res.redirect(
          getFrontendAuthUrl({ verifyError: "invalid-or-expired" }),
        );
      }

      return res.status(400).json({
        message: "Invalid or expired verification link",
      });
    }

    user.status = true;
    user.isEmailVerified = true;
    user.emailVerifiedAt = new Date();
    user.emailVerificationToken = null;
    user.emailVerificationExpires = null;
    await user.save();

    if (shouldRedirect) {
      return res.redirect(
        getFrontendAuthUrl({
          verified: "true",
          email: user.email,
        }),
      );
    }

    res.json({
      message: "Email successfully verified",
      email: user.email,
      verified: true,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

export const CheckEmailVerification = async (req, res) => {
  try {
    const email = String(req.query.email || "")
      .trim()
      .toLowerCase();

    if (!email) {
      return res.status(400).json({
        message: "Email is required",
      });
    }

    const user = await User.findOne({ email }).select(
      "status isEmailVerified email",
    );

    if (!user) {
      return res.status(404).json({
        message: "Account not found",
      });
    }

    res.json({
      email: user.email,
      verified: Boolean(user.isEmailVerified || user.status),
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

export const CompleteProfile = async (req, res) => {
  try {
    const { email, username, image } = req.body;
    const normalizedEmail = String(email || "")
      .trim()
      .toLowerCase();
    const trimmedUsername = String(username || "").trim();

    if (!normalizedEmail || !trimmedUsername) {
      return res.status(400).json({
        message: "Email and username are required",
      });
    }

    if (trimmedUsername.length < 3 || trimmedUsername.length > 32) {
      return res.status(400).json({
        message: "Username must be between 3 and 32 characters",
      });
    }

    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(404).json({
        message: "Account not found",
      });
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
      return res.status(409).json({
        message: "Username already exists",
      });
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
      return res.status(500).json({
        message: "JWT_SECRET is missing from the environment",
      });
    }

    const token = jwt.sign(
      {
        id: user._id,
        email: user.email,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      },
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      message: "Profile created",
      user: {
        email: user.email,
        username: user.username,
        profile: user.profile,
      },
    });
  } catch (error) {
    if (error.code === 11000 && error.keyPattern?.username) {
      return res.status(409).json({
        message: "Username already exists",
      });
    }

    res.status(500).json({
      message: error.message,
    });
  }
};
