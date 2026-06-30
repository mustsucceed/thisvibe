import express from "express";
import {
  createRoomInvite,
  getRoomByInviteCode,
} from "../Controllers/Room_Route.js";
import { optionalAuth } from "../Models/Middleware.js";

const router = express.Router();

// ===== Group Call Invite Routes =====
router.post("/", optionalAuth, createRoomInvite);

router.get("/invite/:code", getRoomByInviteCode);

router.get("/:code", getRoomByInviteCode);

export default router;
