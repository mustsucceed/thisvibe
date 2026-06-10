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
      required() {
        return !this.authProvider || this.authProvider === "local";
      },
    },
tier: {
      type: String,
      enum: ["free", "pro", "premium", "enterprise"],
      default: "free",
},
    authProvider: {
      type: String,
      enum: ["local", "google", "facebook", "apple"],
      default: "local",
    },
    providerId: {
      type: String,
      trim: true,
      default: "",
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


