// useWebRTC.js
// Drop this file into your src/ folder alongside DashboardPage.jsx
//
// THE BUG THAT WAS FIXED:
// ───────────────────────
// The previous version had a stale closure problem. The socket
// useEffect ran once on mount with [] dependencies, capturing
// createPeerConnection at that moment — before the camera stream
// was ready. So when "matched" fired, addTrack() had no stream
// to attach, meaning the other person couldn't see or hear you.
//
// THE FIX:
// ────────
// localStream is stored in a ref (localStreamRef) that always
// holds the latest value. The socket event handlers read from
// the ref rather than capturing the value at mount time.
// This means whenever "matched" fires — even seconds later —
// it always picks up the current live camera stream.

import { useEffect, useRef, useState, useCallback } from "react";
import { io } from "socket.io-client";

const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302"  },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};

const SERVER_URL = (import.meta.env.VITE_API_BASE_URL || "")
  .replace(/\/api\/auth\/?$/, "")
  .replace(/\/$/, "");


export function useWebRTC({
  localStream,
  username,
  onMatched,
  onPeerLeft,
  onChatMessage,
}) {
  const [remoteStream,    setRemoteStream]    = useState(null);
  const [connectionState, setConnectionState] = useState("idle");

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

  // ── Create peer connection ─────────────────────────────
  // Reads localStream from the ref so it always has the latest stream
  const createPeerConnection = useCallback(() => {
    closePeerConnection();

    const pc = new RTCPeerConnection(ICE_SERVERS);
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
  }, [closePeerConnection]); // localStream intentionally NOT here — we use the ref

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

      const pc = createPeerConnection();

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
