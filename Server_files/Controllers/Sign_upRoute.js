import bcrypt from "bcrypt";
import User from "../Models/UserModel.js";

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

    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (existingUser) {
      return res.status(400).json({
        message: "User already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    await User.create({
      firstname,
      lastname,
      username,
      email,
      phone,
      dob,
      password: hashedPassword,
    });

    res.status(201).json({
      message: "Account created",
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
};

export default Signup;
