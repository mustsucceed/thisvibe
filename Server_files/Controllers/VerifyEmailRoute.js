import User from "../Models/UserModel.js";
import jwt from "jsonwebtoken";

export const VerifyEmail = async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({
        message: "Verification token is required",
      });
    }

    const user = await User.findOne({ emailVerificationToken: token });

    if (!user) {
      return res.status(400).json({
        message: "Invalid or expired verification link",
      });
    }

    user.status = true;
    user.emailVerifiedAt = new Date();
    user.emailVerificationToken = null;
    await user.save();

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
    const email = String(req.query.email || "").trim().toLowerCase();

    if (!email) {
      return res.status(400).json({
        message: "Email is required",
      });
    }

    const user = await User.findOne({ email }).select("status email");

    if (!user) {
      return res.status(404).json({
        message: "Account not found",
      });
    }

    res.json({
      email: user.email,
      verified: user.status,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

export const CompleteProfile = async (req, res) => {
  try {
    const { email, displayName, vibe, lookingFor, images } = req.body;
    const normalizedEmail = String(email || "").trim().toLowerCase();

    if (!normalizedEmail || !displayName || !vibe) {
      return res.status(400).json({
        message: "Email, display name, and vibe are required",
      });
    }

    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(404).json({
        message: "Account not found",
      });
    }

    if (!user.status) {
      return res.status(403).json({
        message: "Please verify your email before creating a profile.",
      });
    }

    user.profile = {
      displayName,
      vibe,
      lookingFor: lookingFor || "",
      images: Array.isArray(images) ? images.slice(0, 6) : [],
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
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};
