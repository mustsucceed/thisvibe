import crypto from "node:crypto";
import GroupCall from "../Models/GroupCall.js";
import Room from "../Models/Rooms.js";

// ===== Invite Link Expiry Config =====
const INVITE_LINK_TTL_MS = 5 * 60 * 1000;

const getRoomExpiry = () => new Date(Date.now() + INVITE_LINK_TTL_MS);

// ===== Invite Token Generation =====
export const generateInviteCode = () =>
  crypto.randomBytes(32).toString("base64url");

// ===== Previous Invite Invalidation =====
const invalidateInviteCode = async (inviteCode) => {
  if (!inviteCode) return false;

  const room = await Room.findOneAndDelete({ inviteCode }).select("_id");

  if (!room) {
    return false;
  }

  await GroupCall.deleteMany({ room: room._id });
  return true;
};

// ===== Create Group Call Invite =====
export const createRoomInvite = async (req, res) => {
  try {
    const plan = req.authUser?.tier === "premium" ? "premium" : "free";
    const invalidatedPrevious = await invalidateInviteCode(
      req.body?.previousInviteCode,
    );
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

    const groupCall = await GroupCall.create({
      room: room._id,
      host: req.authUser?._id || null,
      plan,
      participants: req.authUser?._id ? [{ user: req.authUser._id }] : [],
    });

    res.status(201).json({
      ...room.toObject(),
      groupCall: {
        id: groupCall._id,
        plan: groupCall.plan,
        maxCapacity: groupCall.maxCapacity,
        participantCount: groupCall.participants.length,
      },
      invalidatedPrevious,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

// ===== Read Group Call Invite =====
export const getRoomByInviteCode = async (req, res) => {
  try {
    const room = await Room.findOne({
      inviteCode: req.params.code,
      Expires: { $gt: new Date() },
    });

    if (!room) {
      return res.status(404).json({
        message: "Invite not found or expired",
      });
    }

    res.json(room);
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};
