// useWebRTC.js
// Drop this file into your src/ folder alongside DashboardPage.jsx
//
// CHANGES FROM PREVIOUS VERSION:
// ───────────────────────────────
// 1. Removed hardcoded ICE_SERVERS constant
// 2. Added fetchIceServers() — fetches Cloudflare TURN credentials
//    from your Express backend before every peer connection.
//    Falls back to STUN-only if the request fails.
// 3. createPeerConnection is now async to await the ICE servers
// 4. matched handler awaits createPeerConnection()

import { useEffect, useRef, useState, useCallback } from "react";
import { io } from "socket.io-client";

// ===== Socket Server Config =====
const parseServerUrl = (rawUrl) => {
  const url = (rawUrl || "http://localhost:3001").trim();
  return url.replace(/\/api\/auth\/?$/, "").replace(/\/$/, "");
};

const SERVER_URL = parseServerUrl(import.meta.env.VITE_API_BASE_URL);

// ===== WebRTC ICE Server Fetching =====
// ── Fetch fresh TURN credentials from your backend ───────────────
const fetchIceServers = async () => {
  try {
    const res = await fetch(`${SERVER_URL}/api/ice-servers`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const iceServers = await res.json();
    console.log("[TURN] ICE servers fetched:", iceServers.length, "entries");
    return iceServers;
  } catch (err) {
    console.warn("[TURN] Failed to fetch ICE servers, falling back to STUN:", err.message);
    return [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" },
    ];
  }
};

export function useWebRTC({
  localStream,
  username,
  onMatched,
  onPeerLeft,
  onChatMessage,
}) {
  // ===== Call Connection State =====
  const [remoteStream,    setRemoteStream]    = useState(null);
  const [connectionState, setConnectionState] = useState("idle");

  // ===== Socket And Peer Refs =====
  // ── Refs ───────────────────────────────────────────────
  const socketRef       = useRef(null);
  const pcRef           = useRef(null);
  const roomIdRef       = useRef(null);
  const roleRef         = useRef(null);

  // KEY FIX: keep localStream in a ref so socket event handlers
  // always read the current value without stale closures
  const localStreamRef  = useRef(localStream);
  useEffect(() => {
    localStreamRef.current = localStream;
  }, [localStream]);

  // Same pattern for callbacks — store in refs so the socket
  // event handlers don't need to be recreated when props change
  const onMatchedRef     = useRef(onMatched);
  const onPeerLeftRef    = useRef(onPeerLeft);
  const onChatMessageRef = useRef(onChatMessage);
  useEffect(() => { onMatchedRef.current     = onMatched;     }, [onMatched]);
  useEffect(() => { onPeerLeftRef.current    = onPeerLeft;    }, [onPeerLeft]);
  useEffect(() => { onChatMessageRef.current = onChatMessage; }, [onChatMessage]);

  // ===== Peer Connection Cleanup =====
  // ── Close peer connection ──────────────────────────────
  const closePeerConnection = useCallback(() => {
    if (!pcRef.current) return;
    pcRef.current.ontrack               = null;
    pcRef.current.onicecandidate        = null;
    pcRef.current.onconnectionstatechange = null;
    pcRef.current.close();
    pcRef.current = null;
    roomIdRef.current = null;
    roleRef.current   = null;
    setRemoteStream(null);
  }, []);

  // ===== Peer Connection Creation =====
  // ── Create peer connection ─────────────────────────────
  // Now async — fetches fresh Cloudflare TURN credentials each time
  const createPeerConnection = useCallback(async () => {
    closePeerConnection();

    const iceServers = await fetchIceServers();
    const pc = new RTCPeerConnection({ iceServers });
    pcRef.current = pc;

    // Attach camera tracks — read from ref, not closure
    const stream = localStreamRef.current;
    if (stream) {
      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
        console.log("[WebRTC] Added track:", track.kind);
      });
    } else {
      console.warn("[WebRTC] No local stream available when creating peer connection");
    }

    // Remote stream arrives — show it in the stranger's video slot
    pc.ontrack = (event) => {
      console.log("[WebRTC] Remote track received:", event.track.kind);
      setRemoteStream(event.streams[0]);
    };

    // Send each ICE candidate to the other peer via the server
    pc.onicecandidate = (event) => {
      if (event.candidate && socketRef.current && roomIdRef.current) {
        socketRef.current.emit("webrtc-ice-candidate", {
          roomId:    roomIdRef.current,
          candidate: event.candidate,
        });
      }
    };

    // Log ICE gathering for debugging
    pc.onicegatheringstatechange = () => {
      console.log("[WebRTC] ICE gathering:", pc.iceGatheringState);
    };

    // Monitor connection health
    pc.onconnectionstatechange = () => {
      console.log("[WebRTC] Connection state:", pc.connectionState);
      if (pc.connectionState === "connected") {
        setConnectionState("connected");
      }
      if (pc.connectionState === "failed" || pc.connectionState === "disconnected") {
        console.warn("[WebRTC] Connection failed or dropped");
        setConnectionState("ended");
        closePeerConnection();
        onPeerLeftRef.current?.();
      }
    };

    return pc;
  }, [closePeerConnection]);

  // ===== Socket Event Wiring =====
  // ── Socket setup — runs ONCE on mount ─────────────────
  useEffect(() => {
    console.log("[Socket] Connecting to", SERVER_URL);

    const socket = io(SERVER_URL, {
      transports: ["websocket"],
    });
    socketRef.current = socket;

    // ── Matched with a partner ────────────────────────────
    socket.on("matched", async ({ roomId, role, mode }) => {
      console.log(`[Socket] Matched — Room: ${roomId} | Role: ${role} | Mode: ${mode}`);
      roomIdRef.current = roomId;
      roleRef.current   = role;
      setConnectionState("connecting");
      onMatchedRef.current?.({ roomId, role, mode });

      // await so TURN credentials are ready before offer/answer
      const pc = await createPeerConnection();

      // The "caller" creates and sends the offer first
      if (role === "caller") {
        try {
          const offer = await pc.createOffer({
            offerToReceiveVideo: true,
            offerToReceiveAudio: true,
          });
          await pc.setLocalDescription(offer);
          socket.emit("webrtc-offer", { roomId, offer });
          console.log("[WebRTC] Offer sent");
        } catch (err) {
          console.error("[WebRTC] Error creating offer:", err);
        }
      }
    });

    // ── Received offer (we are answerer) ──────────────────
    socket.on("webrtc-offer", async ({ offer }) => {
      console.log("[WebRTC] Offer received");
      const pc = pcRef.current;
      if (!pc) {
        console.warn("[WebRTC] Got offer but no peer connection exists");
        return;
      }
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(offer));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        socket.emit("webrtc-answer", { roomId: roomIdRef.current, answer });
        console.log("[WebRTC] Answer sent");
      } catch (err) {
        console.error("[WebRTC] Error handling offer:", err);
      }
    });

    // ── Received answer (we are caller) ───────────────────
    socket.on("webrtc-answer", async ({ answer }) => {
      console.log("[WebRTC] Answer received");
      const pc = pcRef.current;
      if (!pc) return;
      try {
        await pc.setRemoteDescription(new RTCSessionDescription(answer));
      } catch (err) {
        console.error("[WebRTC] Error handling answer:", err);
      }
    });

    // ── ICE candidate from other peer ─────────────────────
    socket.on("webrtc-ice-candidate", async ({ candidate }) => {
      const pc = pcRef.current;
      if (!pc || !candidate) return;
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (err) {
        if (!err.message?.includes("closed")) {
          console.warn("[WebRTC] ICE candidate error:", err.message);
        }
      }
    });

    // ── Queued (waiting for a match) ──────────────────────
    socket.on("queued", ({ position }) => {
      console.log("[Socket] In queue, position:", position);
      setConnectionState("queued");
    });

    // ── Stranger left mid-call ────────────────────────────
    socket.on("peer-left", () => {
      console.log("[Socket] Peer left");
      closePeerConnection();
      setConnectionState("ended");
      onPeerLeftRef.current?.();
    });

    // ── We ended the call ────────────────────────────────
    socket.on("call-ended", () => {
      console.log("[Socket] Call ended");
      closePeerConnection();
      setConnectionState("idle");
    });

    // ── Incoming chat message ────────────────────────────
    socket.on("chat-message", ({ text, from }) => {
      onChatMessageRef.current?.({ text, from });
    });

    // ── Connection events ────────────────────────────────
    socket.on("connect", () => {
      console.log("[Socket] Connected ✓ ID:", socket.id);
    });
    socket.on("disconnect", (reason) => {
      console.warn("[Socket] Disconnected:", reason);
    });
    socket.on("connect_error", (err) => {
      console.error("[Socket] Connection error:", err.message);
      console.error("→ Is your server running on", SERVER_URL, "?");
    });

    return () => {
      socket.disconnect();
      closePeerConnection();
    };
  // Empty array is correct here — we use refs for everything
  // that changes. We only want one socket connection ever.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ===== Public Call Controls =====
  // ── Public API ─────────────────────────────────────────

  const joinSoloQueue = useCallback(() => {
    console.log("[Socket] Joining solo queue as:", username);
    setConnectionState("queued");
    socketRef.current?.emit("join-solo-queue", { username });
  }, [username]);

  const joinGroupQueue = useCallback(({ gateChoice, groupSize, selectedGame }) => {
    console.log("[Socket] Joining group queue:", { gateChoice, groupSize, selectedGame });
    setConnectionState("queued");
    socketRef.current?.emit("join-group-queue", {
      username,
      gateChoice,
      groupSize,
      selectedGame,
    });
  }, [username]);

  const leaveQueue = useCallback(() => {
    console.log("[Socket] Leaving queue");
    socketRef.current?.emit("leave-queue");
    setConnectionState("idle");
  }, []);

  const skipStranger = useCallback(() => {
    console.log("[Socket] Skipping stranger");
    closePeerConnection();
    setConnectionState("queued");
    socketRef.current?.emit("skip");
  }, [closePeerConnection]);

  const endCall = useCallback(() => {
    console.log("[Socket] Ending call");
    closePeerConnection();
    setConnectionState("idle");
    socketRef.current?.emit("end-call");
  }, [closePeerConnection]);

  const sendChatMessage = useCallback((text) => {
    if (roomIdRef.current && socketRef.current) {
      socketRef.current.emit("chat-message", {
        roomId: roomIdRef.current,
        text,
      });
    }
  }, []);

  return {
    remoteStream,
    connectionState,
    joinSoloQueue,
    joinGroupQueue,
    leaveQueue,
    skipStranger,
    endCall,
    sendChatMessage,
  };
}
