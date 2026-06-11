import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User from "../Models/UserModel.js";

const Signin = async (req, res) => {
  try {
    const { email, username, password } = req.body;
    const login = String(email || username || "")
      .trim()
      .toLowerCase();

    if (!login || !password) {
      return res.status(400).json({
        message: "Email or username and password are required",
      });
    }

    const user = await User.findOne({
      $or: [{ email: login }, { username: login }],
    });

    if (!user) {
      return res.status(401).json({
        message: "Username or password is incorrect",
      });
    }

    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return res.status(401).json({
        message: "Username or password is incorrect",
      });
    }

    if (!(user.isEmailVerified || user.status)) {
      return res.status(403).json({
        message: "Please verify your email before signing in.",
      });
    }

    if (!process.env.JWT_SECRET) {
      return res.status(500).json({
        message: "JWT_SECRET is missing from the environment",
      });
    }

    const token = jwt.sign(
      {
        id: user._id,
        email: user.email,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      },
    );

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      message: "Login successful",
      user: {
        email: user.email,
        username: user.username,
        profile: user.profile,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

export default Signin;
