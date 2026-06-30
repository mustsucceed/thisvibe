import express from "express";
import Signin from "../Controllers/Signinroute.js";
import Signup from "../Controllers/Sign_upRoute.js";
import {
  CheckEmailVerification,
  CompleteProfile,
  UpdateProfile,
  VerifyEmail,
} from "../Controllers/VerifyEmailRoute.js";
import {
  RequestPasswordReset,
  ResetPassword,
} from "../Controllers/PasswordResetRoute.js";
import { protect } from "../Models/Middleware.js";

const router = express.Router();

// ===== Authentication Routes =====
router.post("/signup", Signup);
router.post("/signin", Signin);

// ===== Password Reset Routes =====
router.post("/forgot-password", RequestPasswordReset);
router.post("/reset-password", ResetPassword);

// ===== Email Verification Routes =====
router.get("/verify-email", VerifyEmail);
router.get("/verification-status", CheckEmailVerification);
router.get("/check-email", CheckEmailVerification);

// ===== Profile Routes =====
router.post("/complete-profile", CompleteProfile);
router.patch("/profile", protect, UpdateProfile);

// ===== Session Route =====
router.get("/session", protect, (req, res) => {
  res.json({
    authenticated: true,
    user: {
      email: req.authUser.email,
      username: req.authUser.username,
      tier: req.authUser.tier,
      profile: req.authUser.profile,
    },
  });
});

export default router;
