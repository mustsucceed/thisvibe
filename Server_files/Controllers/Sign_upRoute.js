import bcrypt from "bcrypt";
import crypto from "node:crypto";
import User from "../Models/UserModel.js";
import { sendVerificationEmail } from "../Verify.js";

const Signup = async (req, res) => {
  try {
    const { firstname, lastname, username, email, phone, dob, password } =
      req.body;

    if (
      !firstname ||
      !lastname ||
      !username ||
      !email ||
      !phone ||
      !dob ||
      !password
    ) {
      return res.status(400).json({
        message: "All signup fields are required",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const trimmedUsername = username.trim();

    const existingUser = await User.findOne({
      $or: [{ email: normalizedEmail }, { username: trimmedUsername }],
    });

    if (existingUser) {
      if (existingUser.email === normalizedEmail && !existingUser.status) {
        const emailVerificationToken = crypto.randomBytes(32).toString("hex");

        existingUser.emailVerificationToken = emailVerificationToken;
        existingUser.emailVerifiedAt = null;
        existingUser.status = false;
        await existingUser.save();

        await sendVerificationEmail({
          email: normalizedEmail,
          token: emailVerificationToken,
        });

        return res.status(200).json({
          message:
            "Account already exists. We sent a fresh verification email.",
        });
      }

      return res.status(400).json({
        message:
          existingUser.email === normalizedEmail
            ? "Account already exists. Please sign in."
            : "Username is already taken.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const emailVerificationToken = crypto.randomBytes(32).toString("hex");

    await User.create({
      firstname,
      lastname,
      username: trimmedUsername,
      email: normalizedEmail,
      phone,
      dob,
      password: hashedPassword,
      emailVerificationToken,
      emailVerifiedAt: null,
      status: false,
    });

    await sendVerificationEmail({
      email: normalizedEmail,
      token: emailVerificationToken,
    });

    res.status(201).json({
      message: "Account created. Check your email to verify your account.",
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

export default Signup;
