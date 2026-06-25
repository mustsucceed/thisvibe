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
import cors from "cors";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

// ── Env loader ────────────────────────────────────────────────────────────────
const loadEnvFile = (envPath) => {
  if (!fs.existsSync(envPath)) return;

  fs.readFileSync(envPath, "utf8")
    .split(/\r?\n/)
    .forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) return;

      const sepIdx = trimmed.indexOf("=");
      if (sepIdx === -1) return;

      const key = trimmed.slice(0, sepIdx).trim();
      const value = trimmed.slice(sepIdx + 1).trim().replace(/;$/, "");

      if (key && process.env[key] === undefined) {
        process.env[key] = value;
      }
    });
};

loadEnvFile(path.join(rootDir, ".env"));
loadEnvFile(path.join(__dirname, ".env"));

// ── App setup ─────────────────────────────────────────────────────────────────
const app = express();
const port = process.env.PORT || 3001;

const frontendOrigins = (
  process.env.FRONTEND_ORIGIN || "http://localhost:5173"
)
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

if (
  process.env.NODE_ENV === "production" &&
  frontendOrigins.some((o) => !o.startsWith("https://"))
) {
  throw new Error("FRONTEND_ORIGIN must use https:// in production");
}

const httpServer = http.createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: frontendOrigins,
    credentials: true,
    methods: ["GET", "POST"],
  },
});

// ── CORS middleware ───────────────────────────────────────────────────────────
const allowedOrigins = new Set(frontendOrigins);
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, health checks)
      if (!origin) return callback(null, true);
      if (allowedOrigins.has(origin)) return callback(null, true);
      callback(new Error(`CORS blocked: ${origin}`));
    },
    credentials: true,
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use(cookieParser());

// ── Routes ────────────────────────────────────────────────────────────────────
app.use("/api/auth", authroutes);
app.use("/api/rooms", roomroutes);

// ── Cloudflare TURN credentials ───────────────────────────────────────────────
app.get("/api/ice-servers", async (req, res) => {
  try {
    const keyId     = process.env.CLOUDFLARE_TURN_KEY_ID;
    const keySecret = process.env.CLOUDFLARE_TURN_KEY_SECRET;

    if (!keyId || !keySecret) {
      console.warn("[TURN] Missing Cloudflare credentials — falling back to STUN");
      return res.json([
        { urls: "stun:stun.l.google.com:19302" },
        { urls: "stun:stun1.l.google.com:19302" },
      ]);
    }

    const response = await fetch(
      `https://rtc.live.cloudflare.com/v1/turn/keys/${keyId}/credentials/generate`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${keySecret}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ttl: 86400 }),
      }
    );

    if (!response.ok) {
      const text = await response.text();
      console.error("[TURN] Cloudflare error:", response.status, text);
      return res.status(502).json({ error: "Failed to get TURN credentials" });
    }

    const data = await response.json();
    res.json(data.iceServers);
  } catch (err) {
    console.error("[TURN] Unexpected error:", err.message);
    res.status(500).json({ error: "Failed to get TURN credentials" });
  }
});

// ── Socket.io / WebRTC signaling ──────────────────────────────────────────────
const soloQueue = [];
const activeRooms = new Map();

const removeFromQueue = (socket) => {
  const idx = soloQueue.indexOf(socket.id);
  if (idx !== -1) soloQueue.splice(idx, 1);
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
        const peer = io.sockets.sockets.get(peerId);
        if (peer) {
          peer.data.roomId = null;
          peer.data.role = null;
          peer.leave(roomId);
          peer.emit("peer-left");
        }
      });
  }

  if (requeue) queueSolo(socket);
};

const matchSoloPeers = (first, second) => {
  const roomId = `solo:${first.id}:${second.id}`;

  activeRooms.set(roomId, { mode: "solo", peers: [first.id, second.id] });

  first.join(roomId);
  second.join(roomId);

  first.data.roomId = roomId;
  first.data.role = "caller";
  second.data.roomId = roomId;
  second.data.role = "answerer";

  first.emit("matched", { roomId, role: "caller", mode: "solo" });
  second.emit("matched", { roomId, role: "answerer", mode: "solo" });
};

const queueSolo = (socket) => {
  removeFromQueue(socket);

  const waitingId = soloQueue.shift();
  const waiting = waitingId ? io.sockets.sockets.get(waitingId) : null;

  if (waiting && waiting.connected && !waiting.data.roomId) {
    matchSoloPeers(waiting, socket);
    return;
  }

  soloQueue.push(socket.id);
  socket.emit("queued", { position: soloQueue.length });
};

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

  socket.on("skip", () => leaveCurrentRoom(socket, { requeue: true }));

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

// ── Start ─────────────────────────────────────────────────────────────────────
const startServer = () => {
  httpServer.listen(port, () => {
    console.log(`Server listening on port ${port}`);
  });
};

connectdb()
  .catch((err) => {
    console.warn(`MongoDB unavailable: ${err.message}`);
    console.warn("Starting anyway so WebRTC signaling can be tested.");
  })
  .finally(startServer);
