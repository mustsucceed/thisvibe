import mongoose from "mongoose";

// ===== Group Call Capacity Rules =====
export const GROUP_CALL_CAPACITY_BY_PLAN = {
  free: 3,
  premium: 6,
};

const getGroupCallCapacity = (plan = "free") =>
  GROUP_CALL_CAPACITY_BY_PLAN[plan] || GROUP_CALL_CAPACITY_BY_PLAN.free;

// ===== Group Call Schema =====
const GroupCallSchema = new mongoose.Schema(
  {
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Room",
      required: true,
      index: true,
    },
    host: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
      index: true,
    },
    plan: {
      type: String,
      enum: Object.keys(GROUP_CALL_CAPACITY_BY_PLAN),
      default: "free",
      required: true,
    },
    maxCapacity: {
      type: Number,
      default() {
        return getGroupCallCapacity(this.plan);
      },
      validate: {
        validator(value) {
          return value === getGroupCallCapacity(this.plan);
        },
        message: "Max capacity must match the group call plan.",
      },
    },
    participants: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        joinedAt: {
          type: Date,
          default: Date.now,
        },
        leftAt: {
          type: Date,
          default: null,
        },
      },
    ],
    status: {
      type: String,
      enum: ["waiting", "active", "ended"],
      default: "waiting",
      index: true,
    },
    startedAt: {
      type: Date,
      default: null,
    },
    endedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
);

// ===== Group Call Capacity Guard =====
GroupCallSchema.pre("validate", function syncCapacity() {
  this.maxCapacity = getGroupCallCapacity(this.plan);

  if (this.participants.length > this.maxCapacity) {
    throw new Error(`Group call cannot exceed ${this.maxCapacity} participants.`);
  }
});

const GroupCall =
  mongoose.models.GroupCall || mongoose.model("GroupCall", GroupCallSchema);

export default GroupCall;
