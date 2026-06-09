import express from "express";
import Signup from "../Controllers/Sign_upRoute.js";
import Signin from "../Controllers/Signinroute.js";
import {
  CheckEmailVerification,
  CompleteProfile,
  VerifyEmail,
} from "../Controllers/VerifyEmailRoute.js";

const router = express.Router();

router.post("/signup", Signup);
router.post("/signin", Signin);
router.get("/verify-email", VerifyEmail);
router.get("/verification-status", CheckEmailVerification);
router.post("/complete-profile", CompleteProfile);

export default router;
