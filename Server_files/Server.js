import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import cookieParser from "cookie-parser";
import express from "express";
import authroutes from "./Routes/Authroutes.js";
import connectdb from "./mongoconnect.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

const loadEnvFile = (envPath) => {
  if (!fs.existsSync(envPath)) {
    return;
  }

  const envLines = fs.readFileSync(envPath, "utf8").split(/\r?\n/);

  envLines.forEach((line) => {
    const trimmedLine = line.trim();

    if (!trimmedLine || trimmedLine.startsWith("#")) {
      return;
    }

    const separatorIndex = trimmedLine.indexOf("=");

    if (separatorIndex === -1) {
      return;
    }

    const key = trimmedLine.slice(0, separatorIndex).trim();
    const value = trimmedLine
      .slice(separatorIndex + 1)
      .trim()
      .replace(/;$/, "");

    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  });
};

loadEnvFile(path.join(rootDir, ".env"));
loadEnvFile(path.join(__dirname, ".env"));

const app = express();
const port = process.env.PORT || 3000;
const frontendOrigins = (process.env.FRONTEND_ORIGIN || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

if (
  process.env.NODE_ENV === "production" &&
  frontendOrigins.some((origin) => !origin.startsWith("https://"))
) {
  throw new Error("FRONTEND_ORIGIN must use https:// in production");
}

app.use((req, res, next) => {
  const requestOrigin = req.headers.origin;
  const allowedOrigin = frontendOrigins.includes(requestOrigin)
    ? requestOrigin
    : frontendOrigins[0];

  res.header("Access-Control-Allow-Origin", allowedOrigin);
  res.header("Access-Control-Allow-Credentials", "true");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  res.header("Access-Control-Allow-Methods", "GET,POST,OPTIONS");

  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }

  next();
});

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());
app.use("/api/auth", authroutes);

connectdb()
  .then(() => {
    app.listen(port, () => {
      console.log(`Auth API listening on port ${port}`);
    });
  })
  .catch((error) => {
    console.error(error.message);
    process.exit(1);
  });
