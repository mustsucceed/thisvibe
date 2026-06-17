import express from "express";
import Signin from "../Controllers/Signinroute.js";
import Signup from "../Controllers/Sign_upRoute.js";
import {
  CheckEmailVerification,
  CompleteProfile,
  VerifyEmail,
} from "../Controllers/VerifyEmailRoute.js";
import { protect } from "../Models/Middleware.js";

const router = express.Router();

router.post("/signup", Signup);
router.post("/signin", Signin);
router.get("/verify-email", VerifyEmail);
router.get("/verification-status", CheckEmailVerification);
router.get("/check-email", CheckEmailVerification);
router.post("/complete-profile", CompleteProfile);
router.get("/session", protect, (req, res) => {
  res.json({
    authenticated: true,
    user: {
      email: req.authUser.email,
      username: req.authUser.username,
      profile: req.authUser.profile,
    },
  });
});

export default router;
