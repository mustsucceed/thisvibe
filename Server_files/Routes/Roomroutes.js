import express from "express";
import {
  createRoomInvite,
  getRoomByInviteCode,
} from "../Controllers/Room_Route.js";
import Room from "../Models/Rooms.js";

const router = express.Router();

router.post("/", createRoomInvite);

router.get("/invite/:code", async (req, res) => {
  const room = await Room.findOne({
    inviteCode: req.params.code,
  });

  if (!room) {
    return res.status(404).json({
      message: "Invite not found",
    });
  }

  res.json(room);
});

router.get("/:code", getRoomByInviteCode);

export default router;
