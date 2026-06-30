import mongoose from "mongoose";

// ===== Room Invite Schema =====
const RoomSchema = new mongoose.Schema(
  {
    Roomcode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    inviteCode: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    Members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    Messages: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Message",
      },
    ],
    Expires: {
      type: Date,
      required: true,
      index: { expires: 0 },
    },
  },
  { timestamps: true },
);

const Room = mongoose.models.Room || mongoose.model("Room", RoomSchema);

export default Room;
