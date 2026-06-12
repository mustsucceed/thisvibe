import jwt from "jsonwebtoken";
import User from "./UserModel.js";

const clearAuthCookie = (res) => {
  res.clearCookie("token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  });
};

export const protect = async (req, res, next) => {
  const token = req.cookies?.token;

  if (!token) {
    return res.status(401).json({
      message: "Unauthorized",
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select(
      "email username profile activeSessionId",
    );

    if (!user) {
      clearAuthCookie(res);

      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    if (!decoded.sessionId || decoded.sessionId !== user.activeSessionId) {
      clearAuthCookie(res);

      return res.status(401).json({
        code: "SESSION_REPLACED",
        message: "Signed out because this account was used on another device.",
      });
    }

    req.user = decoded;
    req.authUser = user;

    next();
  } catch {
    clearAuthCookie(res);

    res.status(401).json({
      message: "Invalid token",
    });
  }
};
