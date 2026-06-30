import mongoose from "mongoose";

const UserSchema = mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: true,
    },
tier: {
      type: String,
      enum: ["free", "pro", "premium", "enterprise"],
      default: "free",
},
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    emailVerificationToken: {
      type: String,
      default: null,
      index: true,
    },
    emailVerificationExpires: {
      type: Date,
      default: null,
    },
    emailVerifiedAt: {
      type: Date,
      default: null,
    },
    passwordResetToken: {
      type: String,
      default: null,
      index: true,
    },
    passwordResetExpires: {
      type: Date,
      default: null,
    },
    activeSessionId: {
      type: String,
      default: null,
      index: true,
    },
    usernameChangedAt: {
      type: Date,
      default: null,
    },
    profile: {
      displayName: {
        type: String,
        trim: true,
        default: "",
      },
      vibe: {
        type: String,
        trim: true,
        default: "",
      },
      lookingFor: {
        type: String,
        trim: true,
        default: "",
      },
      gender: {
        type: String,
        enum: ["boy", "girl"],
        default: "boy",
      },
      location: {
        type: String,
        trim: true,
        default: "Abuja",
      },
      images: {
        type: [String],
        default: [],
      },
      completedAt: {
        type: Date,
        default: null,
      },
    },
    status: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

const User = mongoose.model("User", UserSchema);

export default User;


