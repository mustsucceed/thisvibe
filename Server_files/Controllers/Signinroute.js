import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from "uuid";
import User from "../Models/UserModel.js";

const MAX_FAILED_SIGNIN_ATTEMPTS = 5;
const SIGNIN_LOCK_MS = 15 * 60 * 1000;
const signinAttempts = new Map();

const getSigninAttemptKey = (req, login) =>
  `${req.ip || req.socket?.remoteAddress || "unknown"}:${login}`;

const getSigninAttempt = (key) => {
  const attempt = signinAttempts.get(key);
  if (!attempt) return { count: 0, lockedUntil: 0 };
  if (attempt.lockedUntil && attempt.lockedUntil <= Date.now()) {
    signinAttempts.delete(key);
    return { count: 0, lockedUntil: 0 };
  }
  return attempt;
};

const recordFailedSignin = (key) => {
  const attempt = getSigninAttempt(key);
  const nextCount = attempt.count + 1;
  const lockedUntil =
    nextCount >= MAX_FAILED_SIGNIN_ATTEMPTS
      ? Date.now() + SIGNIN_LOCK_MS
      : attempt.lockedUntil;
  signinAttempts.set(key, { count: nextCount, lockedUntil });
};

const clearFailedSignin = (key) => {
  signinAttempts.delete(key);
};

const Signin = async (req, res) => {
  try {
    const { email, username, password } = req.body;
    const login = String(email || username || "").trim().toLowerCase();

    if (!login || !password) {
      return res.status(400).json({
        message: "Email or username and password are required",
      });
    }

    const attemptKey = getSigninAttemptKey(req, login);
    const attempt = getSigninAttempt(attemptKey);

    if (attempt.lockedUntil > Date.now()) {
      const retryAfterSeconds = Math.ceil(
        (attempt.lockedUntil - Date.now()) / 1000,
      );
      res.set("Retry-After", String(retryAfterSeconds));
      return res.status(429).json({
        message: "Too many failed sign-in attempts. Please try again in 15 minutes.",
      });
    }

    const user = await User.findOne({
      $or: [{ email: login }, { username: login }],
    });

    if (!user) {
      recordFailedSignin(attemptKey);
      return res.status(401).json({ message: "Username or password is incorrect" });
    }

    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      recordFailedSignin(attemptKey);
      return res.status(401).json({ message: "Username or password is incorrect" });
    }

    if (!(user.isEmailVerified || user.status)) {
      return res.status(403).json({
        message: "Please verify your email before signing in.",
      });
    }

    clearFailedSignin(attemptKey);

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({
        message: "JWT_SECRET is missing from the environment",
      });
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
  message: "Login successful",
  token, // ← frontend stores this in memory
  user: {
    email: user.email,
    username: user.username,
    profile: user.profile,
  },
  });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export default Signin;