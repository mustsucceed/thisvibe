import { useState, useEffect, useRef, useCallback } from "react";
import {
  Clock3,
  Gamepad2,
  Mars,
  MapPin,
  Maximize2,
  MessageCircle,
  Minimize2,
  SkipForward,
  Star,
  User,
  Users,
  UsersRound,
  Venus,
  VideoOff,
  X,
} from "lucide-react";
import { useWebRTC } from "./useWebRTC";
import "./DashboardPage.css";

// ===== Call API Config =====
const API_ORIGIN = (import.meta.env.VITE_API_BASE_URL || "")
  .replace(/\/api\/auth\/?$/, "")
  .replace(/\/$/, "");
const ROOMS_API_BASE_URL = `${API_ORIGIN}/api/rooms`;
const INVITE_SHARE_MESSAGE = "Join us and vibe";

// ===== Invite Clipboard Helper =====
const copyTextToClipboard = async (text) => {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return;
    } catch {
      // Fall back for browsers that reject async clipboard writes.
    }
  }

  const textArea = document.createElement("textarea");
  textArea.value = text;
  textArea.setAttribute("readonly", "");
  textArea.style.position = "fixed";
  textArea.style.left = "-9999px";
  document.body.appendChild(textArea);
  textArea.select();

  try {
    if (!document.execCommand("copy")) {
      throw new Error("Copy command failed");
    }
  } finally {
    document.body.removeChild(textArea);
  }
};

const RANDOM_QUOTES = [
  "Tomorrow is hiding behind the next hill",
  "The moon owes me directions",
  "A new vibe is loading",
  "Someone interesting is almost here",
];

// ── useCallTimer ──────────────────────────────────────────
// Counts seconds while a call is active. Resets to 0 on end.
function useCallTimer(active) {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (!active) {
      queueMicrotask(() => setSeconds(0));
      return;
    }
    const timer = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(timer);
  }, [active]);

  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}

// ── LocalVideo ────────────────────────────────────────────
// Renders a <video> element and keeps its srcObject in sync
// with whatever MediaStream we pass in.
function LocalVideo({ className, stream, muted = true, mirror = false }) {
  const videoRef = useRef(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.srcObject = stream ?? null;
    if (stream) {
      video.play().catch((e) => console.warn("Camera playback blocked:", e));
    }
    return () => {
      video.srcObject = null;
    };
  }, [stream]);

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      muted={muted}
      className={[className, mirror ? "mirrored" : ""]
        .filter(Boolean)
        .join(" ")}
    />
  );
}

//MARK: ── RemoteVideo ───────────────────────────────────────────
// Same as LocalVideo but NOT muted (we want to hear them)
// and shows a "Connecting…" state while the stream arrives.
function RemoteVideo({ stream, label = "Stranger" }) {
  const hasStream = Boolean(stream);

  return (
    <div className="matched-right-panel">
      <LocalVideo
        stream={stream}
        className={`live-video ${hasStream ? "has-feed" : ""}`}
        muted={false}
        mirror={false}
      />
      {!hasStream && (
        <div className="stranger-avatar">
          <div className="nf-head" />
          <div className="nf-body" />
          {/* Show a subtle connecting indicator while WebRTC handshake runs */}
          <p
            style={{
              color: "#8b8a9a",
              fontSize: 12,
              fontWeight: 700,
              margin: 0,
            }}
          >
            Connecting…
          </p>
        </div>
      )}
      <div className="slot-tag stranger-tag">{label}</div>
    </div>
  );
}

// ── MARK: GamesModal ────────────────────────────────────────────
// Unchanged from previous version.
function GamesModal({ selectedGame, onClose }) {
  const games = [
    {
      id: "hotseat",
      icon: "🔥",
      name: "Hot Seat",
      desc: "Answer honestly or skip. Everyone votes if they believe you.",
      locked: false,
    },
    {
      id: "wyr",
      icon: "🗳️",
      name: "Would You Rather",
      desc: "Both vote simultaneously. Reveal at the same time.",
      locked: false,
    },
    {
      id: "song",
      icon: "🎶",
      name: "Guess the Song",
      desc: "First to type the correct title wins.",
      locked: true,
    },
  ];
  const active = games.find((g) => g.id === selectedGame) ?? games[0];

  return (
    <div className="games-modal-overlay" onClick={onClose}>
      <div
        className="games-modal animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="games-modal-header">
          <span className="games-modal-title">🎮 Game Mode</span>
          <button
            className="games-modal-close"
            onClick={onClose}
            aria-label="Close games"
          >
            <X size={16} />
          </button>
        </div>
        <p className="games-modal-active-label">ACTIVE GAME</p>
        <div className="games-modal-active-card">
          <span className="games-modal-active-icon">{active.icon}</span>
          <div>
            <div className="games-modal-active-name">{active.name}</div>
            <div className="games-modal-active-desc">{active.desc}</div>
          </div>
        </div>
        <p className="games-modal-active-label" style={{ marginTop: 14 }}>
          ALL GAMES
        </p>
        <div className="games-modal-list">
          {games.map(({ id, icon, name, desc, locked }) => (
            <div
              key={id}
              className={`games-modal-item ${id === active.id ? "chosen" : ""} ${locked ? "locked" : ""}`}
            >
              <span>{icon}</span>
              <div>
                <div className="games-modal-item-name">{name}</div>
                <div className="games-modal-item-desc">{desc}</div>
              </div>
              {locked && (
                <span
                  className="gl-plus-tag"
                  style={{ position: "static", marginLeft: "auto" }}
                >
                  PLUS
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── MessageDock ───────────────────────────────────────────
// Now receives real messages from the stranger and sends
// real messages via the sendMessage callback.
function MessageDock({
  chatOpen,
  setChatOpen,
  onSendMessage,
  incomingMessages,
}) {
  const [messages, setMessages] = useState([]);
  const [inputVal, setInputVal] = useState("");
  const messagesEndRef = useRef(null);

  // When a new message arrives from the stranger, add it to the list
  useEffect(() => {
    if (!incomingMessages?.length) return;
    const latest = incomingMessages[incomingMessages.length - 1];
    setMessages((prev) => {
      // Deduplicate by id in case the effect fires twice
      if (prev.find((m) => m.id === latest.id)) return prev;
      return [...prev, { ...latest, from: "them" }];
    });
  }, [incomingMessages]);

  const handleSend = () => {
    const text = inputVal.trim();
    if (!text) return;
    const msg = { id: Date.now(), text, from: "you" };
    setMessages((prev) => [...prev, msg]);
    onSendMessage?.(text); // send to stranger via Socket.io
    setInputVal("");
  };

  useEffect(() => {
    if (chatOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, chatOpen]);

  // Show unread count on the toggle button when chat is closed
  const unreadCount = !chatOpen
    ? messages.filter((m) => m.from === "them").length
    : 0;

  return (
    <div className="message-dock">
      {chatOpen && (
        <div className="message-dropdown animate-fade-in">
          <div className="message-dropdown-header">
            <span>Messages</span>
            <span className="message-status">Live</span>
          </div>
          <div
            className="message-list"
            style={
              messages.length > 0
                ? {
                    alignItems: "flex-start",
                    justifyContent: "flex-start",
                    flexDirection: "column",
                    gap: 6,
                  }
                : {}
            }
          >
            {messages.length === 0 ? (
              <p className="message-empty">No messages yet</p>
            ) : (
              messages.map((m) => (
                <div
                  key={m.id}
                  className={`message-bubble ${m.from === "you" ? "bubble-you" : "bubble-them"}`}
                >
                  {m.text}
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
          <div className="message-input-row">
            <input
              className="message-input"
              type="text"
              placeholder="Type a message..."
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
            />
            <button
              className="message-send-btn"
              type="button"
              onClick={handleSend}
            >
              Send
            </button>
          </div>
        </div>
      )}
      <button
        className="message-toggle-btn"
        onClick={() => setChatOpen((prev) => !prev)}
        type="button"
        aria-label="Toggle messages"
      >
        <span>💬</span>
        {unreadCount > 0 ? `${unreadCount} new` : "Message"}
      </button>
    </div>
  );
}

// ── GroupLobby ────────────────────────────────────────────
// Unchanged from previous version.
function GroupLobby({ onJoin, onNavigateToPlus, onCreateInvite }) {
  const [selectedSize, setSelectedSize] = useState(2);
  const [selectedGame, setSelectedGame] = useState("hotseat");
  const [copied, setCopied] = useState(false);
  const [copyMessage, setCopyMessage] = useState("");
  const [isCreatingInvite, setIsCreatingInvite] = useState(false);

  const handleCopy = async () => {
    if (isCreatingInvite) return;
    setCopyMessage("");
    setIsCreatingInvite(true);

    try {
      await onCreateInvite();
      setCopied(true);
      setCopyMessage("Link copied");
      setTimeout(() => {
        setCopied(false);
        setCopyMessage("");
      }, 2500);
    } catch (err) {
      setCopyMessage(err.message || "Could not create invite link.");
    } finally {
      setIsCreatingInvite(false);
    }
  };

  return (
    <div className="group-lobby">
      <div className="gl-section">
        <p className="gl-section-label">HOW MANY STRANGERS?</p>
        <div className="gl-size-grid">
          {[
            { n: 2, desc: "You + 2 others", locked: false },
            { n: 3, desc: "You + 3 others", locked: false },
            { n: 4, desc: "Full squad", locked: true },
          ].map(({ n, desc, locked }) => (
            <div
              key={n}
              className={`gl-size-card ${selectedSize === n && !locked ? "chosen" : ""} ${locked ? "locked" : ""}`}
              onClick={() => !locked && setSelectedSize(n)}
            >
              {locked && <span className="gl-plus-tag">PLUS</span>}
              <div className="gl-size-faces">
                {Array.from({ length: n + 1 }).map((_, i) => (
                  <div key={i} className="gl-face" />
                ))}
              </div>
              <div className="gl-size-num">{n}</div>
              <div className="gl-size-desc">{desc}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="gl-invite-box">
        <div className="gl-invite-top">
          <span className="gl-invite-icon">🔗</span>
          <div>
            <div className="gl-invite-title">
              Bring a friend, meet a stranger
            </div>
            <div className="gl-invite-sub">
              Invite someone — we add 1 random to make 3
            </div>
          </div>
        </div>
        <div className="gl-invite-flow">
          <div className="gl-av you">👤</div>
          <span className="gl-plus">+</span>
          <div className="gl-av friend">🧑</div>
          <span className="gl-plus">+</span>
          <div className="gl-av stranger">❓</div>
          <span className="gl-eq">=</span>
          <span className="gl-result">3 people 🎉</span>
        </div>
        <button
          className="gl-copy-btn"
          onClick={handleCopy}
          disabled={isCreatingInvite}
          type="button"
        >
          {copied ? "✓ Copied!" : "🔗 Copy Invite Link"}
        </button>
        {copyMessage && <div className="gl-invite-sub">{copyMessage}</div>}
      </div>

      <div className="gl-section">
        <p className="gl-section-label">PICK A GAME MODE</p>
        <div className="gl-games-grid">
          {[
            {
              id: "hotseat",
              icon: "🔥",
              name: "Hot Seat",
              desc: "Answer or skip",
              locked: false,
            },
            {
              id: "wyr",
              icon: "🗳️",
              name: "Would You Rather",
              desc: "Vote live",
              locked: false,
            },
            {
              id: "song",
              icon: "🎶",
              name: "Guess the Song",
              desc: "First to name it",
              locked: true,
            },
          ].map(({ id, icon, name, desc, locked }) => (
            <div
              key={id}
              className={`gl-game-card ${selectedGame === id && !locked ? "chosen" : ""} ${locked ? "locked" : ""}`}
              onClick={() => !locked && setSelectedGame(id)}
            >
              {locked && <span className="gl-plus-tag">PLUS</span>}
              <span className="gl-game-icon">{icon}</span>
              <div className="gl-game-info">
                <div className="gl-game-name">{name}</div>
                <div className="gl-game-desc">{desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="gl-premium-strip">
        <span className="gl-premium-star">⭐</span>
        <div className="gl-premium-text">
          <div className="gl-premium-title">Unlock groups of 4 + all games</div>
          <div className="gl-premium-sub">
            Guess the Song, DJ Mode, custom rooms
          </div>
        </div>
        <button className="gl-premium-btn" onClick={onNavigateToPlus}>
          Get Plus
        </button>
      </div>

      <button
        className="gl-join-btn"
        onClick={() => onJoin(selectedSize, selectedGame)}
      >
        🎲 Join Group Room
      </button>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════
// MARK: MAIN DASHBOARD
// ═══════════════════════════════════════════════════════════
function FriendsDropdown({ friends }) {
  const hasFriends = friends.length > 0;

  return (
    <div className="friends-dropdown">
      <div className="friends-dropdown-title">Friends</div>
      {!hasFriends ? (
        <div className="friends-empty-state">No friends yet</div>
      ) : (
        <div className="friends-list">
          {friends.map((friend, index) => {
            const friendName =
              typeof friend === "string"
                ? friend
                : friend?.profile?.displayName || friend?.username || "Friend";
            const friendImage =
              typeof friend === "string"
                ? ""
                : friend?.profile?.images?.[0] || "";

            return (
              <div
                className="friend-list-item"
                key={friend?._id || friendName || index}
              >
                <div className="friend-list-avatar">
                  {friendImage ? (
                    <img src={friendImage} alt="" />
                  ) : (
                    friendName.charAt(0).toUpperCase()
                  )}
                </div>
                <div className="friend-list-name">{friendName}</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ProfileSummaryCard({
  inputId,
  username,
  profilePhoto,
  profileGenderLabel,
  profileLocation,
  friendCount,
  profileSaveMessage,
  isSavingProfile,
  onPhotoChange,
  onUsernameChange,
  onSave,
  onLogout,
}) {
  return (
    <div className="profile-dropdown profile-summary-card">
      <div className="profile-upload-center">
        <label className="profile-photo-upload" htmlFor={inputId}>
          {profilePhoto ? (
            <img
              src={profilePhoto}
              alt="Profile preview"
              className="profile-photo-preview"
            />
          ) : (
            <>
              <span className="profile-photo-icon">+</span>
              <span className="profile-photo-copy">Upload photo</span>
            </>
          )}
        </label>
        <input
          id={inputId}
          className="profile-photo-input"
          type="file"
          accept="image/*"
          onChange={onPhotoChange}
        />
      </div>

      <label className="profile-field-label" htmlFor={`${inputId}-username`}>
        Username
      </label>
      <input
        id={`${inputId}-username`}
        className="profile-username-input"
        value={username}
        onChange={onUsernameChange}
        placeholder="Enter username"
      />

      <div className="profile-friends-count">
        {friendCount.toLocaleString()}{" "}
        {friendCount === 1 ? "friend" : "friends"}
      </div>

      <div className="profile-simple-meta">
        <span>{profileGenderLabel}</span>
        <span className="profile-location-meta">
          <MapPin size={13} strokeWidth={2.4} />
          {profileLocation}
        </span>
      </div>

      {profileSaveMessage && (
        <p className="profile-save-message">{profileSaveMessage}</p>
      )}

      <button
        className="profile-save-button"
        type="button"
        onClick={onSave}
        disabled={isSavingProfile}
      >
        {isSavingProfile ? "Saving..." : "Save profile"}
      </button>

      {onLogout && (
        <button
          className="profile-signout-button"
          type="button"
          onClick={onLogout}
        >
          Sign out
        </button>
      )}
    </div>
  );
}

export default function DashboardPage({
  currentUserProfile,
  initialMatchMode = "SOLO",
  onNavigateToPlus,
  onLogout,
  onProfileUpdate,
  authToken,
}) {
  // ===== Call Page UI State =====
  // ── UI state ──────────────────────────────────────────
  const [matchMode, setMatchMode] = useState(
    initialMatchMode === "GROUP" ? "GROUP" : "SOLO",
  );
  const [selectedGame, setSelectedGame] = useState("hotseat");
  const [prefOpen, setPrefOpen] = useState(false);
  const [gender, setGender] = useState("Anyone");
  const [location, setLocation] = useState("Anywhere");
  const [interests, setInterests] = useState(["Gaming", "Travel"]);
  const [chatOpen, setChatOpen] = useState(false);
  const [friendsOpen, setFriendsOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [gamesOpen, setGamesOpen] = useState(false);
  const [username, setUsername] = useState(
    currentUserProfile?.profile?.displayName ||
      currentUserProfile?.username ||
      "You",
  );
  const [profilePhoto, setProfilePhoto] = useState(
    currentUserProfile?.profile?.images?.[0] || "",
  );
  const profileGender = currentUserProfile?.profile?.gender || "boy";
  const profileGenderLabel = profileGender === "girl" ? "👧 Girl" : "👦 Boy";
  const profileLocation = currentUserProfile?.profile?.location || "Abuja";
  const friends =
    currentUserProfile?.friends || currentUserProfile?.profile?.friends || [];
  const friendCount = friends.length;
  const [profileSaveMessage, setProfileSaveMessage] = useState("");
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [copiedInvite, setCopiedInvite] = useState(false);
  const [inviteCopyMessage, setInviteCopyMessage] = useState("");
  const [isCopyingInvite, setIsCopyingInvite] = useState(false);
  const [quoteKey, setQuoteKey] = useState(0);
  const [quote, setQuote] = useState(RANDOM_QUOTES[0]);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // ── Camera state ─────────────────────────────────────
  const [cameraStream, setCameraStream] = useState(null);
  const [cameraStatus, setCameraStatus] = useState("starting");
  const [cameraMessage, setCameraMessage] = useState("Starting camera…");

  // ===== Call Messaging State =====
  // ── Incoming chat messages from stranger ─────────────
  const [incomingMessages, setIncomingMessages] = useState([]);

  // ── Refs ──────────────────────────────────────────────
  const dashboardRef = useRef(null);
  const cameraStreamRef = useRef(null);
  const isMountedRef = useRef(false);
  const lastInviteCodeRef = useRef(null);

  // ===== Live Call Connection Logic =====
  // ── Call timer (only ticks when call is live) ─────────
  // We pass connectionState === 'connected' as the active flag
  // so it resets properly between calls
  const callTimer = useCallTimer(false); // wired below after hook

  // ── WebRTC hook ───────────────────────────────────────
  // This replaces the entire setTimeout-based matching system.
  // remoteStream is the live video coming from the stranger.
  // connectionState drives what we show on screen.
  const {
    remoteStream,
    connectionState,
    joinSoloQueue,
    joinGroupQueue,
    leaveQueue,
    skipStranger,
    endCall,
    sendChatMessage,
  } = useWebRTC({
    localStream: cameraStream,
    username,
    onMatched: ({ roomId, role, mode }) => {
      // Called the moment we are paired with someone.
      // Reset quote animation and close any open panels.
      setQuote(RANDOM_QUOTES[0]);
      setQuoteKey(0);
      setChatOpen(false);
      setProfileOpen(false);
      setGamesOpen(false);
      setIncomingMessages([]);
    },
    onPeerLeft: () => {
      // Called when the stranger disconnects mid-call.
      setChatOpen(false);
      setGamesOpen(false);
    },
    onChatMessage: ({ text, from }) => {
      // Called when the stranger sends us a text message.
      setIncomingMessages((prev) => [...prev, { id: Date.now(), text, from }]);
    },
  });

  // Derive display booleans from connectionState
  // 'queued' and 'connecting' both show the searching screen
  const isMatching =
    connectionState === "queued" || connectionState === "connecting";
  const isMatched = connectionState === "connected";
  const isLive = isMatching || isMatched;

  // ── Call timer (re-wired to real connection state) ────
  const activeCallTimer = useCallTimer(isMatched);

  // ===== Camera Setup Logic =====

  // ── Camera setup ──────────────────────────────────────
  const stopCamera = useCallback(() => {
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach((t) => t.stop());
      cameraStreamRef.current = null;
    }
  }, []);

  const setupCamera = useCallback(async () => {
    try {
      if (!navigator.mediaDevices?.getUserMedia)
        throw new Error("Not supported");
      stopCamera();
      const stream = await navigator.mediaDevices.getUserMedia({
        // audio: true is required for the other person to hear you
        video: {
          facingMode: "user",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: true,
      });
      if (!isMountedRef.current) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }
      cameraStreamRef.current = stream;
      stream.getVideoTracks().forEach((t) => {
        t.onended = () => {
          if (!isMountedRef.current) return;
          setCameraStream(null);
          setCameraStatus("error");
          setCameraMessage("Camera disconnected");
          cameraStreamRef.current = null;
        };
      });
      setCameraStream(stream);
      setCameraStatus("ready");
      setCameraMessage("");
    } catch (err) {
      if (!isMountedRef.current) return;
      setCameraStream(null);
      setCameraStatus("error");
      if (err?.name === "NotAllowedError")
        setCameraMessage("Camera permission blocked");
      else if (err?.name === "NotFoundError")
        setCameraMessage("No camera found");
      else setCameraMessage("Camera unavailable");
    }
  }, [stopCamera]);

  useEffect(() => {
    isMountedRef.current = true;
    Promise.resolve().then(setupCamera);
    return () => {
      isMountedRef.current = false;
      stopCamera();
    };
  }, [setupCamera, stopCamera]);

  // ── Fullscreen listener ───────────────────────────────
  useEffect(() => {
    const handler = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  // ── Quote rotation while searching ───────────────────
  useEffect(() => {
    if (!isMatching) return;
    const t = setInterval(() => {
      setQuote((q) => {
        const next = RANDOM_QUOTES.filter((x) => x !== q);
        return next[Math.floor(Math.random() * next.length)];
      });
      setQuoteKey((k) => k + 1);
    }, 3500);
    return () => clearInterval(t);
  }, [isMatching]);

  const hasCameraFeed = cameraStatus === "ready" && cameraStream;

  // ===== Profile UI Handlers =====

  // ── Event handlers ────────────────────────────────────
  const toggleInterest = (tag) =>
    setInterests((p) =>
      p.includes(tag) ? p.filter((i) => i !== tag) : [...p, tag],
    );

  const handleProfilePhoto = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/") || file.size > 2 * 1024 * 1024) {
      setProfileSaveMessage("Choose an image smaller than 2 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setProfilePhoto(String(reader.result));
      setProfileSaveMessage("");
    };
    reader.readAsDataURL(file);
  };

  const saveProfile = async () => {
    const trimmedUsername = username.trim();
    if (trimmedUsername.length < 3 || trimmedUsername.length > 32) {
      setProfileSaveMessage("Username must be between 3 and 32 characters.");
      return;
    }

    if (!onProfileUpdate) {
      setProfileSaveMessage("Profile saving is unavailable.");
      return;
    }

    setIsSavingProfile(true);
    setProfileSaveMessage("");
    try {
      const updatedUser = await onProfileUpdate({
        username: trimmedUsername,
        image: profilePhoto,
        location: profileLocation,
      });
      setUsername(updatedUser.profile?.displayName || updatedUser.username);
      setProfilePhoto(updatedUser.profile?.images?.[0] || "");
      setProfileSaveMessage("Profile saved.");
    } catch (error) {
      setProfileSaveMessage(error.message || "Unable to save your profile.");
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Start solo — joins the real server queue
  // ===== Call Control Handlers =====
  const startMatching = () => {
    setChatOpen(false);
    setProfileOpen(false);
    setGamesOpen(false);
    setIncomingMessages([]);
    joinSoloQueue();
  };

  // End call — tells the server to clean up the room
  const handleEndCall = () => {
    setChatOpen(false);
    setGamesOpen(false);
    endCall();
  };

  // Skip — server cleans up current room and re-queues us
  const handleSkip = () => {
    setChatOpen(false);
    setGamesOpen(false);
    setIncomingMessages([]);
    skipStranger();
  };

  // Quit — leave the queue without starting a call
  const handleQuitQueue = () => {
    leaveQueue();
  };

  // Group join — joins the group queue with selected options
  const handleGroupJoin = (size, game) => {
    setSelectedGame(game);
    setChatOpen(false);
    setProfileOpen(false);
    setIncomingMessages([]);
    joinGroupQueue({ gateChoice: null, groupSize: size, selectedGame: game });
  };

  const handleToggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await dashboardRef.current?.requestFullscreen();
      } else {
        await document.exitFullscreen();
      }
    } catch (e) {
      console.warn("Fullscreen unavailable:", e);
    }
  };

  // ===== Invite Link Creation And Clipboard Logic =====
  const createInviteLink = async () => {
    const previousInviteCode = lastInviteCodeRef.current;
    const headers = { "Content-Type": "application/json" };
    if (authToken) {
      headers.Authorization = `Bearer ${authToken}`;
    }

    const res = await fetch(ROOMS_API_BASE_URL, {
      method: "POST",
      credentials: "include",
      headers,
      body: JSON.stringify({ previousInviteCode }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || "Could not create invite");
    }

    const inviteCode = data.inviteCode || data.Roomcode;
    const inviteUrl = `${window.location.origin}/invite/${inviteCode}`;
    const inviteShareText = `${INVITE_SHARE_MESSAGE}: ${inviteUrl}`;

    await copyTextToClipboard(inviteShareText);
    lastInviteCodeRef.current = inviteCode;

    return {
      url: inviteUrl,
      shareText: inviteShareText,
      maxCapacity: data.groupCall?.maxCapacity || 3,
      plan: data.groupCall?.plan || "free",
    };
  };

  const handleCopyInvite = async () => {
    if (isCopyingInvite) return;
    setInviteCopyMessage("");
    setIsCopyingInvite(true);

    try {
      await createInviteLink();
      setCopiedInvite(true);
      setInviteCopyMessage("Link copied");
      setTimeout(() => {
        setCopiedInvite(false);
        setInviteCopyMessage("");
      }, 2500);
    } catch (error) {
      setInviteCopyMessage(error.message || "Could not copy link");
    } finally {
      setIsCopyingInvite(false);
    }
  };

  const nigerianStates = [
    "Anywhere",
    "Lagos",
    "Abuja",
    "Port Harcourt",
    "Edo",
    "Kano",
    "Ibadan",
    "Enugu",
    "Kaduna",
    "Benin City",
  ];
  const interestTags = [
    "Gaming",
    "Music",
    "Sports",
    "Tech",
    "Art",
    "Travel",
    "Food",
    "Movies",
  ];

  // ── RENDER ────────────────────────────────────────────
  return (
    <div className="vibe-dashboard" ref={dashboardRef}>
      {/* ═══════════════════════════════════════════
        MARK:  LIVE VIEW — shown during search AND call
      ═══════════════════════════════════════════ */}
      {isLive && (
        <div
          className={`live-fullscreen ${isFullscreen ? "expanded-call" : "compact-call"}`}
        >
          <button
            className="fullscreen-toggle-btn"
            onClick={handleToggleFullscreen}
            aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
            type="button"
          >
            {isFullscreen ? (
              <Minimize2 size={18} strokeWidth={2.4} />
            ) : (
              <Maximize2 size={18} strokeWidth={2.4} />
            )}
          </button>

          {/* ── Searching screen ─────────────────── */}
          {isMatching && (
            <div className="searching-screen">
              {/* Your camera on the left */}
              <div className="search-user-panel">
                <LocalVideo
                  stream={cameraStream}
                  className={`live-video mirrored ${hasCameraFeed ? "has-feed" : ""}`}
                  muted
                  mirror
                />
                {!hasCameraFeed && (
                  <div className="no-feed-avatar">
                    {profilePhoto ? (
                      <img
                        src={profilePhoto}
                        alt="Profile"
                        className="slot-profile-photo"
                      />
                    ) : (
                      <>
                        <div className="nf-head" />
                        <div className="nf-body" />
                      </>
                    )}
                    <p>{cameraMessage}</p>
                  </div>
                )}
                <div className="slot-tag you-tag">
                  <span className="dot-green" />
                  You
                </div>
              </div>

              {/* Searching animation on the right */}
              <div className="searching-right-panel">
                <div className="loader" />
                <p key={quoteKey} className="wander-text animate-quote">
                  {quote}
                </p>
                {/* Show slightly different text when WebRTC handshake is running */}
                <p
                  style={{
                    fontSize: 11,
                    color: "#5d5870",
                    fontWeight: 600,
                    margin: 0,
                  }}
                >
                  {connectionState === "connecting"
                    ? "Found someone — establishing connection…"
                    : "Looking for someone…"}
                </p>
                <button
                  className="quit-btn"
                  onClick={handleQuitQueue}
                  aria-label="Quit matchmaking"
                >
                  Quit
                </button>
              </div>
            </div>
          )}

          {/* MARL: ── Matched / live call screen ────────── */}
          {isMatched && (
            <div className="matched-screen">
              {/* LEFT — your video */}
              <div className="matched-left-panel">
                <LocalVideo
                  stream={cameraStream}
                  className={`live-video mirrored ${hasCameraFeed ? "has-feed" : ""}`}
                  muted
                  mirror
                />
                {!hasCameraFeed && (
                  <div className="no-feed-avatar">
                    {profilePhoto ? (
                      <img
                        src={profilePhoto}
                        alt="Profile"
                        className="slot-profile-photo"
                      />
                    ) : (
                      <>
                        <div className="nf-head" />
                        <div className="nf-body" />
                      </>
                    )}
                    <p>{cameraMessage}</p>
                  </div>
                )}
                <div className="slot-tag you-tag">
                  <span className="dot-green" />
                  {username} • {activeCallTimer}
                </div>

                {/* Chat — now sends/receives real messages */}
                <MessageDock
                  chatOpen={chatOpen}
                  setChatOpen={setChatOpen}
                  onSendMessage={sendChatMessage}
                  incomingMessages={incomingMessages}
                />
              </div>

              {/* CENTER — skip / games controls */}
              <div className="matched-divider">
                <button
                  className="call-center-action skip-action"
                  onClick={handleSkip}
                  aria-label="Skip to next person"
                  type="button"
                >
                  <SkipForward size={18} strokeWidth={2.4} />
                </button>
                <button
                  className="call-center-action games-action"
                  onClick={() => setGamesOpen(true)}
                  aria-label="Open games"
                  type="button"
                >
                  <Gamepad2 size={18} strokeWidth={2.4} />
                </button>
              </div>

              {/* RIGHT — stranger's real video stream */}
              {/* remoteStream is null until WebRTC connects,
                  RemoteVideo shows "Connecting…" in that state */}
              <RemoteVideo stream={remoteStream} label="Stranger" />

              {/* End call button (top-right of right panel) */}
              <button
                className="end-circle-btn"
                onClick={handleEndCall}
                aria-label="End call"
                style={{ position: "absolute", top: 16, right: 16, zIndex: 10 }}
              >
                ✕
              </button>

              {gamesOpen && (
                <GamesModal
                  selectedGame={selectedGame}
                  onClose={() => setGamesOpen(false)}
                />
              )}
            </div>
          )}
        </div>
      )}

      {/* ═══════════════════════════════════════════
        MARK:  IDLE VIEW — shown before any call starts
      ═══════════════════════════════════════════ */}
      {!isLive && (
        <>
          <div className="call-top-actions">
            <div className="friends-menu-wrap">
              <button
                className={`call-top-pill ${friendsOpen ? "active" : ""}`}
                type="button"
                onClick={() => {
                  setFriendsOpen((open) => !open);
                  setProfileOpen(false);
                }}
              >
                <UsersRound size={17} strokeWidth={2.2} />
                Friend List
              </button>
              {friendsOpen && <FriendsDropdown friends={friends} />}
            </div>
            <button className="call-top-pill" type="button">
              <Clock3 size={17} strokeWidth={2.2} />
              Call History
            </button>
            <button
              className="call-top-icon"
              aria-label="Messages"
              type="button"
            >
              <MessageCircle size={17} strokeWidth={2.2} />
            </button>
            <div className="profile-menu-wrap">
              <button
                className={`call-top-icon ${profileOpen ? "active" : ""}`}
                aria-label="Profile"
                type="button"
                onClick={() => {
                  setProfileOpen((o) => !o);
                  setFriendsOpen(false);
                }}
              >
                <User size={18} strokeWidth={2.2} />
              </button>
              {profileOpen && (
                <ProfileSummaryCard
                  inputId="profile-photo-input-top"
                  username={username}
                  profilePhoto={profilePhoto}
                  profileGenderLabel={profileGenderLabel}
                  profileLocation={profileLocation}
                  friendCount={friendCount}
                  profileSaveMessage={profileSaveMessage}
                  isSavingProfile={isSavingProfile}
                  onPhotoChange={handleProfilePhoto}
                  onUsernameChange={(e) => {
                    setUsername(e.target.value);
                    setProfileSaveMessage("");
                  }}
                  onSave={saveProfile}
                  onLogout={onLogout}
                />
              )}
            </div>
          </div>

          <div className="dashboard-main-view">
            <div className="main-camera-stage">
              <LocalVideo
                stream={cameraStream}
                className={`main-camera-stream ${hasCameraFeed ? "has-feed" : ""}`}
                muted
                mirror
              />
              {!hasCameraFeed && (
                <div className="main-camera-fallback">
                  {cameraStatus === "starting" && (
                    <div className="camera-starting-pulse" />
                  )}
                  {profilePhoto && cameraStatus !== "starting" ? (
                    <img
                      src={profilePhoto}
                      alt="Profile"
                      className="slot-profile-photo slot-profile-photo--large"
                    />
                  ) : (
                    !profilePhoto &&
                    cameraStatus !== "starting" && (
                      <div className="camera-off-emblem">
                        <VideoOff size={58} strokeWidth={1.8} />
                      </div>
                    )
                  )}
                  <h2>Waiting to connect</h2>
                  <p>
                    {cameraMessage ||
                      (cameraStatus === "starting" ? "Starting camera…" : "")}
                  </p>
                </div>
              )}
              <div className="main-camera-tag">
                <span
                  className={
                    hasCameraFeed ? "live-status-dot" : "offline-status-dot"
                  }
                />
                You • {hasCameraFeed ? "Live" : "Camera off"}
              </div>
              <p className="idle-hint camera-idle-hint">
                Press Start to find someone
              </p>
              <button
                className="fullscreen-toggle-btn"
                style={{
                  position: "absolute",
                  top: 16,
                  right: 16,
                  left: "auto",
                }}
                onClick={handleToggleFullscreen}
                aria-label="Toggle fullscreen"
                type="button"
              >
                <Maximize2 size={18} strokeWidth={2.4} />
              </button>
            </div>
          </div>

          <aside className="dashboard-sidebar">
            {/* ── Header ── */}
            <div className="sidebar-header-row">
              <div className="vibe-logo">
                the<span>.vibe</span>
              </div>
              <div className="header-icon-actions">
                <div className="profile-menu-wrap">
                  <button
                    className={`icon-utility-btn ${profileOpen ? "active" : ""}`}
                    onClick={() => setProfileOpen((o) => !o)}
                    aria-label="Profile"
                    type="button"
                  >
                    👤
                  </button>
                  {profileOpen && (
                    <ProfileSummaryCard
                      inputId="profile-photo-input"
                      username={username}
                      profilePhoto={profilePhoto}
                      profileGenderLabel={profileGenderLabel}
                      profileLocation={profileLocation}
                      friendCount={friendCount}
                      profileSaveMessage={profileSaveMessage}
                      isSavingProfile={isSavingProfile}
                      onPhotoChange={handleProfilePhoto}
                      onUsernameChange={(e) => {
                        setUsername(e.target.value);
                        setProfileSaveMessage("");
                      }}
                      onSave={saveProfile}
                      onLogout={onLogout}
                    />
                  )}
                </div>
                <button className="icon-utility-btn" aria-label="Messages">
                  💬
                </button>
              </div>
            </div>

            {/* ── Mode pill ── */}
            <div className="mode-selection-pill-container">
              <button
                className={`mode-pill-btn ${matchMode === "SOLO" ? "active" : ""}`}
                onClick={() => setMatchMode("SOLO")}
              >
                SOLO
              </button>
              <button
                className={`mode-pill-btn ${matchMode === "GROUP" ? "active" : ""}`}
                onClick={() => setMatchMode("GROUP")}
              >
                GROUP
              </button>
            </div>

            {/* ── SOLO MODE ── */}
            {matchMode === "SOLO" && (
              <>
                <div className="online-status-banner">
                  <span className="pulse-green-dot" />
                  11,000 people online now
                </div>
                <div className="pref-wrap">
                  <button
                    className={`preference-navigation-anchor-btn ${prefOpen ? "open" : ""}`}
                    onClick={() => setPrefOpen(!prefOpen)}
                  >
                    <div className="pref-left-flex">
                      <span className="pref-icon">🎛️</span>
                      <span className="pref-label">Preferences</span>
                      <span className="premium-lock-badge">⭐ Premium</span>
                    </div>
                    <span
                      className={`pref-arrow-indicator ${prefOpen ? "rotated" : ""}`}
                    >
                      ›
                    </span>
                  </button>
                  {prefOpen && (
                    <div className="pref-dropdown locked-overlay-wrap">
                      <div className="pref-content-blurred">
                        <div className="pref-row">
                          <label
                            className="pref-row-label"
                            htmlFor="pref-gender"
                          >
                            MATCH GENDER
                          </label>
                          <div className="pref-gender-btns" id="pref-gender">
                            {["Anyone", "Male", "Female"].map((g) => (
                              <button
                                key={g}
                                className={`gender-btn ${gender === g ? "active" : ""}`}
                                onClick={() => setGender(g)}
                              >
                                {g}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="pref-row">
                          <label
                            className="pref-row-label"
                            htmlFor="pref-location"
                          >
                            STATE / LOCATION
                          </label>
                          <select
                            id="pref-location"
                            className="pref-select"
                            value={location}
                            onChange={(e) => setLocation(e.target.value)}
                          >
                            {nigerianStates.map((s) => (
                              <option key={s} value={s}>
                                {s}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="pref-row">
                          <label className="pref-row-label">INTERESTS</label>
                          <div className="pref-tags">
                            {interestTags.map((tag) => (
                              <span
                                key={tag}
                                className={`pref-tag ${interests.includes(tag) ? "active" : ""}`}
                                onClick={() => toggleInterest(tag)}
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="premium-gate-overlay">
                        <div className="premium-gate-card">
                          <span className="premium-star">⭐</span>
                          <h3 className="premium-gate-title">
                            Premium Feature
                          </h3>
                          <p className="premium-gate-desc">
                            Filter by gender, location, and interests. Upgrade
                            to unlock.
                          </p>
                          <button
                            className="upgrade-btn"
                            onClick={onNavigateToPlus}
                          >
                            Upgrade to Plus
                          </button>
                          <button
                            className="gate-dismiss-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              setPrefOpen(false);
                            }}
                          >
                            Maybe later
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <div className="meet-preference-panel">
                  <p>Who do you want to meet?</p>
                  <div className="meet-preference-grid">
                    {[
                      { id: "Anyone", label: "Both", icon: Users },
                      { id: "Female", label: "Female", icon: Venus },
                      { id: "Male", label: "Male", icon: Mars },
                    ].map(({ id, label, icon: Icon }) => (
                      <button
                        key={id}
                        className={`meet-preference-card ${gender === id ? "active" : ""}`}
                        type="button"
                        onClick={() => setGender(id)}
                      >
                        <Icon size={25} strokeWidth={2.2} />
                        <span>{label}</span>
                      </button>
                    ))}
                  </div>
                </div>
                <button
                  onClick={startMatching}
                  className="primary-match-action-btn"
                  disabled={cameraStatus !== "ready"}
                >
                  <span>📹</span>{" "}
                  {cameraStatus === "ready"
                    ? "Start Video Chat"
                    : "Waiting for camera…"}
                </button>
              </>
            )}

            {/* ── GROUP MODE ── */}
            {matchMode === "GROUP" && (
              <GroupLobby
                onJoin={handleGroupJoin}
                onNavigateToPlus={onNavigateToPlus}
                onCreateInvite={createInviteLink}
              />
            )}

            {/* ── Footer ── */}
            <footer className="sidebar-utility-footer">
              <button
                className="footer-action-item gold-highlight"
                onClick={onNavigateToPlus}
                aria-label="Plus"
              >
                <span className="footer-icon">⭐</span>
                <span className="footer-label">Plus</span>
              </button>
              <button
                className="footer-action-item"
                onClick={handleCopyInvite}
                aria-label="Copy invite link"
                disabled={isCopyingInvite}
                type="button"
              >
                <span className="footer-icon">{copiedInvite ? "✓" : "🔗"}</span>
                <span className="footer-label">
                  {isCopyingInvite
                    ? "Copying..."
                    : copiedInvite
                      ? "Copied!"
                      : "Invite"}
                </span>
              </button>
              {inviteCopyMessage && (
                <div className="footer-invite-message">{inviteCopyMessage}</div>
              )}
              <button
                className="footer-action-item"
                aria-label="More options"
                onClick={() => alert("Settings coming soon")}
              >
                <span className="footer-icon">•••</span>
                <span className="footer-label">More</span>
              </button>
            </footer>
          </aside>

          <div className="premium-call-banner">
            <div className="premium-call-art" aria-hidden="true">
              <span>👑</span>
            </div>
            <div className="premium-call-copy">
              <h2>
                Enjoy with the.vibe <span>Premium</span>
              </h2>
              <p>
                Unlock unlimited chats, ad-free experience, and more exclusive
                perks.
              </p>
            </div>
            <button
              className="premium-call-button"
              type="button"
              onClick={onNavigateToPlus}
            >
              <Star size={16} fill="currentColor" />
              Go Premium
            </button>
            <button
              className="premium-call-close"
              type="button"
              aria-label="Close premium banner"
            >
              <X size={17} />
            </button>
          </div>
        </>
      )}
    </div>
  );
}
