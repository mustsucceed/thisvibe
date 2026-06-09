import mongoose from "mongoose";

const UserSchema = mongoose.Schema(
  {
    firstname: {
      type: String,
      required: true,
      trim: true,
    },
    lastname: {
      type: String,
      required: true,
      trim: true,
    },
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
    dob: {
      type: Date,
      required: true,
    },
    phone: {
      type: String,
      trim: true,
      default: "",
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
    emailVerificationToken: {
      type: String,
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
