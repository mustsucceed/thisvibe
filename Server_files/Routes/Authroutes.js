import express from "express";
import Signup from "../Controllers/Sign_upRoute.js";
import Signin from "../Controllers/Signinroute.js";

const router = express.Router();

router.post("/signup", Signup);
router.post("/signin", Signin);

export default router;
