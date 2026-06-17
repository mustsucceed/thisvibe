import crypto from "node:crypto";
import Room from "../Models/Rooms.js";

const getRoomExpiry = () => new Date(Date.now() + 24 * 60 * 60 * 1000);

export const generateInviteCode = () =>
  crypto.randomBytes(4).toString("hex").toUpperCase();

export const createRoomInvite = async (req, res) => {
  try {
    let code = generateInviteCode();
    let existingRoom = await Room.findOne({ inviteCode: code }).select("_id");

    while (existingRoom) {
      code = generateInviteCode();
      existingRoom = await Room.findOne({ inviteCode: code }).select("_id");
    }

    const room = await Room.create({
      Roomcode: code,
      inviteCode: code,
      createdBy: req.authUser?._id || null,
      Members: req.authUser?._id ? [req.authUser._id] : [],
      Messages: [],
      Expires: getRoomExpiry(),
    });

    res.status(201).json(room);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

export const getRoomByInviteCode = async (req, res) => {
  try {
    const room = await Room.findOne({
      inviteCode: req.params.code,
    });

    if (!room) {
      return res.status(404).json({
        message: "Invite not found",
      });
    }

    res.json(room);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};
