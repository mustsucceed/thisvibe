import express from "express";
import passport, {
  handleOAuthCallback,
  requireOAuthProvider,
} from "../Controllers/OAuthRoutes.js";
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
router.get(
  "/oauth/google",
  requireOAuthProvider("google"),
  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false,
  }),
);
router.get(
  "/oauth/google/callback",
  requireOAuthProvider("google"),
  passport.authenticate("google", {
    failureRedirect: "/auth?socialAuth=error&provider=google",
    session: false,
  }),
  handleOAuthCallback("google"),
);
router.get(
  "/oauth/facebook",
  requireOAuthProvider("facebook"),
  passport.authenticate("facebook", {
    scope: ["email"],
    session: false,
  }),
);
router.get(
  "/oauth/facebook/callback",
  requireOAuthProvider("facebook"),
  passport.authenticate("facebook", {
    failureRedirect: "/auth?socialAuth=error&provider=facebook",
    session: false,
  }),
  handleOAuthCallback("facebook"),
);
router.get(
  "/oauth/apple",
  requireOAuthProvider("apple"),
  passport.authenticate("apple", {
    session: false,
  }),
);
router.post(
  "/oauth/apple/callback",
  requireOAuthProvider("apple"),
  passport.authenticate("apple", {
    failureRedirect: "/auth?socialAuth=error&provider=apple",
    session: false,
  }),
  handleOAuthCallback("apple"),
);

export default router;
