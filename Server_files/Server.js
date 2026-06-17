import fs from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import cookieParser from "cookie-parser";
import express from "express";
import { Server } from "socket.io";
import authroutes from "./Routes/Authroutes.js";
import roomroutes from "./Routes/Roomroutes.js";
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
const port = process.env.PORT || 3001;
const frontendOrigins = (process.env.FRONTEND_ORIGIN || "http://localhost:5173")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);
const httpServer = http.createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: frontendOrigins,
    credentials: true,
    methods: ["GET", "POST"],
  },
});

const soloQueue = [];
const activeRooms = new Map();

const removeFromQueue = (socket) => {
  const queueIndex = soloQueue.indexOf(socket.id);

  if (queueIndex !== -1) {
    soloQueue.splice(queueIndex, 1);
  }
};

const leaveCurrentRoom = (socket, { requeue = false } = {}) => {
  const roomId = socket.data.roomId;

  if (!roomId) {
    removeFromQueue(socket);
    return;
  }

  const room = activeRooms.get(roomId);
  socket.leave(roomId);
  socket.data.roomId = null;
  socket.data.role = null;

  if (room) {
    activeRooms.delete(roomId);

    room.peers
      .filter((peerId) => peerId !== socket.id)
      .forEach((peerId) => {
        const peerSocket = io.sockets.sockets.get(peerId);

        if (peerSocket) {
          peerSocket.data.roomId = null;
          peerSocket.data.role = null;
          peerSocket.leave(roomId);
          peerSocket.emit("peer-left");
        }
      });
  }

  if (requeue) {
    queueSolo(socket);
  }
};

function matchSoloPeers(firstSocket, secondSocket) {
  const roomId = `solo:${firstSocket.id}:${secondSocket.id}`;

  activeRooms.set(roomId, {
    mode: "solo",
    peers: [firstSocket.id, secondSocket.id],
  });

  firstSocket.join(roomId);
  secondSocket.join(roomId);

  firstSocket.data.roomId = roomId;
  firstSocket.data.role = "caller";
  secondSocket.data.roomId = roomId;
  secondSocket.data.role = "answerer";

  firstSocket.emit("matched", { roomId, role: "caller", mode: "solo" });
  secondSocket.emit("matched", { roomId, role: "answerer", mode: "solo" });
}

function queueSolo(socket) {
  removeFromQueue(socket);

  const waitingSocketId = soloQueue.shift();
  const waitingSocket = waitingSocketId
    ? io.sockets.sockets.get(waitingSocketId)
    : null;

  if (waitingSocket && waitingSocket.connected && !waitingSocket.data.roomId) {
    matchSoloPeers(waitingSocket, socket);
    return;
  }

  soloQueue.push(socket.id);
  socket.emit("queued", { position: soloQueue.length });
}

io.on("connection", (socket) => {
  socket.on("join-solo-queue", ({ username } = {}) => {
    socket.data.username = username || "Stranger";
    leaveCurrentRoom(socket);
    queueSolo(socket);
  });

  socket.on("join-group-queue", ({ username } = {}) => {
    socket.data.username = username || "Stranger";
    leaveCurrentRoom(socket);
    queueSolo(socket);
  });

  socket.on("leave-queue", () => {
    removeFromQueue(socket);
    socket.emit("call-ended");
  });

  socket.on("skip", () => {
    leaveCurrentRoom(socket, { requeue: true });
  });

  socket.on("end-call", () => {
    leaveCurrentRoom(socket);
    socket.emit("call-ended");
  });

  socket.on("webrtc-offer", ({ roomId, offer }) => {
    socket.to(roomId).emit("webrtc-offer", { offer });
  });

  socket.on("webrtc-answer", ({ roomId, answer }) => {
    socket.to(roomId).emit("webrtc-answer", { answer });
  });

  socket.on("webrtc-ice-candidate", ({ roomId, candidate }) => {
    socket.to(roomId).emit("webrtc-ice-candidate", { candidate });
  });

  socket.on("chat-message", ({ roomId, text }) => {
    socket.to(roomId).emit("chat-message", {
      text,
      from: socket.data.username || "Stranger",
    });
  });

  socket.on("disconnect", () => {
    leaveCurrentRoom(socket);
    removeFromQueue(socket);
  });
});

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
app.use("/api/rooms", roomroutes);

const startServer = () => {
  httpServer.listen(port, () => {
    console.log(`Auth API and signaling server listening on port ${port}`);
  });
};

connectdb()
  .catch((error) => {
    console.warn(`MongoDB unavailable: ${error.message}`);
    console.warn("Starting server anyway so local WebRTC signaling can be tested.");
  })
  .finally(startServer);
