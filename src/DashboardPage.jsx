import React, { useState, useEffect, useRef, useCallback } from "react";
import { Gamepad2, Maximize2, Minimize2, SkipForward, X } from "lucide-react";
import "./DashboardPage.css";

const RANDOM_QUOTES = [
  "Tomorrow is hiding behind the next hill",
  "The moon owes me directions",
  "A new vibe is loading",
  "Someone interesting is almost here",
];

// ── Call Timer ────────────────────────────────────────────
function useCallTimer(active) {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    if (!active) { setSeconds(0); return; }
    const t = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [active]);
  const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
  const ss = String(seconds % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}

// ── Local video element ───────────────────────────────────
function LocalVideo({ className, stream, muted = true, mirror = false }) {
  const videoRef = useRef(null);
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.srcObject = stream ?? null;
    if (stream) {
      const p = video.play();
      if (p) p.catch((e) => console.warn("Camera playback blocked:", e));
    }
    return () => { video.srcObject = null; };
  }, [stream]);
  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      muted={muted}
      className={[className, mirror ? "mirrored" : ""].filter(Boolean).join(" ")}
    />
  );
}

// ── Games Modal ───────────────────────────────────────────
function GamesModal({ selectedGame, onClose }) {
  const games = [
    { id: "hotseat", icon: "🔥", name: "Hot Seat", desc: "Answer honestly or skip. Everyone votes if they believe you.", locked: false },
    { id: "wyr", icon: "🗳️", name: "Would You Rather", desc: "Both vote simultaneously. Reveal at the same time.", locked: false },
    { id: "song", icon: "🎶", name: "Guess the Song", desc: "First to type the correct title wins.", locked: true },
  ];
  const active = games.find((g) => g.id === selectedGame) ?? games[0];

  return (
    <div className="games-modal-overlay" onClick={onClose}>
      <div className="games-modal animate-fade-in" onClick={(e) => e.stopPropagation()}>
        <div className="games-modal-header">
          <span className="games-modal-title">🎮 Game Mode</span>
          <button className="games-modal-close" onClick={onClose} aria-label="Close games"><X size={16} /></button>
        </div>
        <p className="games-modal-active-label">ACTIVE GAME</p>
        <div className="games-modal-active-card">
          <span className="games-modal-active-icon">{active.icon}</span>
          <div>
            <div className="games-modal-active-name">{active.name}</div>
            <div className="games-modal-active-desc">{active.desc}</div>
          </div>
        </div>
        <p className="games-modal-active-label" style={{ marginTop: 14 }}>ALL GAMES</p>
        <div className="games-modal-list">
          {games.map(({ id, icon, name, desc, locked }) => (
            <div key={id} className={`games-modal-item ${id === active.id ? "chosen" : ""} ${locked ? "locked" : ""}`}>
              <span>{icon}</span>
              <div>
                <div className="games-modal-item-name">{name}</div>
                <div className="games-modal-item-desc">{desc}</div>
              </div>
              {locked && <span className="gl-plus-tag" style={{ position: "static", marginLeft: "auto" }}>PLUS</span>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Message Dock ──────────────────────────────────────────
function MessageDock({ chatOpen, setChatOpen }) {
  const [messages, setMessages] = useState([]);
  const [inputVal, setInputVal] = useState("");
  const listRef = useRef(null);

  const handleSend = () => {
    const text = inputVal.trim();
    if (!text) return;
    setMessages((prev) => [...prev, { id: Date.now(), text, from: "you" }]);
    setInputVal("");
  };

  useEffect(() => {
    if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [messages]);

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
            ref={listRef}
            style={messages.length > 0 ? { alignItems: "flex-start", justifyContent: "flex-start", flexDirection: "column", gap: 6 } : {}}
          >
            {messages.length === 0
              ? <p className="message-empty">No messages yet</p>
              : messages.map((m) => (
                  <div key={m.id} className={`message-bubble ${m.from === "you" ? "bubble-you" : "bubble-them"}`}>
                    {m.text}
                  </div>
                ))
            }
          </div>
          <div className="message-input-row">
            <input
              className="message-input"
              type="text"
              placeholder="Type a message"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
            />
            <button className="message-send-btn" type="button" onClick={handleSend}>Send</button>
          </div>
        </div>
      )}
      <button
        className="message-toggle-btn"
        onClick={() => setChatOpen((o) => !o)}
        type="button"
        aria-label="Toggle messages"
      >
        <span>💬</span> Message
      </button>
    </div>
  );
}

// ── Group Lobby ───────────────────────────────────────────
function GroupLobby({ onJoin, onNavigateToPlus }) {
  const [selectedSize, setSelectedSize] = useState(2);
  const [selectedGame, setSelectedGame] = useState("hotseat");
  const [gateChoice, setGateChoice] = useState(null);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard?.writeText(window.location.href).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="group-lobby">
      <div className="gl-section">
        <p className="gl-section-label">FIND YOUR TRIBE</p>
        <div className="gl-gate">
          <p className="gl-gate-label">QUICK QUESTION</p>
          <p className="gl-gate-question">Who is the GOAT? 🐐</p>
          <div className="gl-gate-opts">
            {["Messi", "Ronaldo"].map((opt) => (
              <button key={opt} className={`gl-gate-opt ${gateChoice === opt ? "selected" : ""}`} onClick={() => setGateChoice(opt)}>{opt}</button>
            ))}
          </div>
        </div>
      </div>

      <div className="gl-section">
        <p className="gl-section-label">HOW MANY STRANGERS?</p>
        <div className="gl-size-grid">
          {[{ n: 2, desc: "You + 2 others", locked: false }, { n: 3, desc: "You + 3 others", locked: false }, { n: 4, desc: "Full squad", locked: true }].map(({ n, desc, locked }) => (
            <div key={n} className={`gl-size-card ${selectedSize === n && !locked ? "chosen" : ""} ${locked ? "locked" : ""}`} onClick={() => !locked && setSelectedSize(n)}>
              {locked && <span className="gl-plus-tag">PLUS</span>}
              <div className="gl-size-faces">{Array.from({ length: n + 1 }).map((_, i) => <div key={i} className="gl-face" />)}</div>
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
            <div className="gl-invite-title">Bring a friend, meet a stranger</div>
            <div className="gl-invite-sub">Invite someone — we add 1 random to make 3</div>
          </div>
        </div>
        <div className="gl-invite-flow">
          <div className="gl-av you">👤</div><span className="gl-plus">+</span>
          <div className="gl-av friend">🧑</div><span className="gl-plus">+</span>
          <div className="gl-av stranger">❓</div>
          <span className="gl-eq">=</span><span className="gl-result">3 people 🎉</span>
        </div>
        <button className="gl-copy-btn" onClick={handleCopy}>{copied ? "✓ Copied!" : "🔗 Copy Invite Link"}</button>
      </div>

      <div className="gl-section">
        <p className="gl-section-label">PICK A GAME MODE</p>
        <div className="gl-games-grid">
          {[
            { id: "hotseat", icon: "🔥", name: "Hot Seat", desc: "Answer or skip", locked: false },
            { id: "wyr", icon: "🗳️", name: "Would You Rather", desc: "Vote live", locked: false },
            { id: "song", icon: "🎶", name: "Guess the Song", desc: "First to name it", locked: true },
          ].map(({ id, icon, name, desc, locked }) => (
            <div key={id} className={`gl-game-card ${selectedGame === id && !locked ? "chosen" : ""} ${locked ? "locked" : ""}`} onClick={() => !locked && setSelectedGame(id)}>
              {locked && <span className="gl-plus-tag">PLUS</span>}
              <span className="gl-game-icon">{icon}</span>
              <div className="gl-game-info"><div className="gl-game-name">{name}</div><div className="gl-game-desc">{desc}</div></div>
            </div>
          ))}
        </div>
      </div>

      <div className="gl-premium-strip">
        <span className="gl-premium-star">⭐</span>
        <div className="gl-premium-text">
          <div className="gl-premium-title">Unlock groups of 4 + all games</div>
          <div className="gl-premium-sub">Guess the Song, DJ Mode, custom rooms</div>
        </div>
        <button className="gl-premium-btn" onClick={onNavigateToPlus}>Get Plus</button>
      </div>

      <button className="gl-join-btn" onClick={() => onJoin(selectedSize, selectedGame)}>
        🎲 Join Group Room
      </button>
    </div>
  );
}

// ── MAIN DASHBOARD ────────────────────────────────────────
export default function DashboardPage({ onNavigateToPlus, onLogout }) {
  const [matchMode, setMatchMode] = useState("SOLO");
  const [isMatching, setIsMatching] = useState(false);
  const [isMatched, setIsMatched] = useState(false);
  const [groupSize, setGroupSize] = useState(2);
  const [selectedGame, setSelectedGame] = useState("hotseat");
  const [prefOpen, setPrefOpen] = useState(false);
  const [gender, setGender] = useState("Anyone");
  const [location, setLocation] = useState("Anywhere");
  const [interests, setInterests] = useState(["Gaming", "Travel"]);
  const [cameraStream, setCameraStream] = useState(null);
  const [cameraStatus, setCameraStatus] = useState("starting");
  const [cameraMessage, setCameraMessage] = useState("Starting camera...");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [quoteKey, setQuoteKey] = useState(0);
  const [quote, setQuote] = useState(RANDOM_QUOTES[0]);
  const [chatOpen, setChatOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [gamesOpen, setGamesOpen] = useState(false);
  const [username, setUsername] = useState("You");
  const [profilePhoto, setProfilePhoto] = useState("");
  const [copiedInvite, setCopiedInvite] = useState(false);

  const callTimer = useCallTimer(isMatched);
  const dashboardRef = useRef(null);
  const matchTimerRef = useRef(null);
  const cameraStreamRef = useRef(null);
  const isMountedRef = useRef(false);
  const isLive = isMatching || isMatched;

  // ── Camera ──
  const stopCamera = useCallback(() => {
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach((t) => t.stop());
      cameraStreamRef.current = null;
    }
  }, []);

  const setupCamera = useCallback(async () => {
    try {
      if (!navigator.mediaDevices?.getUserMedia) throw new Error("Not supported");
      stopCamera();
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: true,
      });
      if (!isMountedRef.current) { stream.getTracks().forEach((t) => t.stop()); return; }
      cameraStreamRef.current = stream;
      stream.getVideoTracks().forEach((t) => {
        t.onended = () => {
          if (!isMountedRef.current) return;
          setCameraStream(null); setCameraStatus("error"); setCameraMessage("Camera disconnected");
          cameraStreamRef.current = null;
        };
      });
      setCameraStream(stream); setCameraStatus("ready"); setCameraMessage("");
    } catch (err) {
      if (!isMountedRef.current) return;
      setCameraStream(null); setCameraStatus("error");
      if (err?.name === "NotAllowedError") setCameraMessage("Camera permission blocked");
      else if (err?.name === "NotFoundError") setCameraMessage("No camera found");
      else setCameraMessage("Camera unavailable");
    }
  }, [stopCamera]);

  useEffect(() => {
    isMountedRef.current = true;
    Promise.resolve().then(setupCamera);
    return () => {
      isMountedRef.current = false;
      if (matchTimerRef.current) clearTimeout(matchTimerRef.current);
      stopCamera();
    };
  }, [setupCamera, stopCamera]);

  useEffect(() => {
    const handler = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", handler);
    return () => document.removeEventListener("fullscreenchange", handler);
  }, []);

  // Animate quotes while searching
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

  const toggleInterest = (tag) =>
    setInterests((p) => p.includes(tag) ? p.filter((i) => i !== tag) : [...p, tag]);

  const handleProfilePhoto = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setProfilePhoto(String(reader.result));
    reader.readAsDataURL(file);
  };

  // ── Clear pending match timer ──
  const clearMatchTimer = () => {
    if (matchTimerRef.current) { clearTimeout(matchTimerRef.current); matchTimerRef.current = null; }
  };

  // ── Start matching ──
  const startMatching = () => {
    clearMatchTimer();
    setChatOpen(false); setProfileOpen(false); setGamesOpen(false);
    setQuote(RANDOM_QUOTES[0]); setQuoteKey(0);
    setIsMatched(false); setIsMatching(true);
    matchTimerRef.current = setTimeout(() => { setIsMatching(false); setIsMatched(true); }, 2800);
  };

  // ── End call ──
  const handleEndCall = () => {
    clearMatchTimer();
    setChatOpen(false); setGamesOpen(false);
    setIsMatching(false); setIsMatched(false);
  };

  // ── Skip to next ──
  const handleSkip = () => {
    clearMatchTimer();
    setChatOpen(false); setGamesOpen(false);
    setIsMatched(false); setQuote(RANDOM_QUOTES[0]); setQuoteKey(0); setIsMatching(true);
    matchTimerRef.current = setTimeout(() => { setIsMatching(false); setIsMatched(true); }, 2000);
  };

  // ── Quit queue ──
  const handleQuitQueue = () => {
    clearMatchTimer();
    setIsMatching(false); setIsMatched(false);
  };

  // ── Group join ──
  const handleGroupJoin = (size, game) => {
    setGroupSize(size); setSelectedGame(game);
    startMatching();
  };

  const handleToggleFullscreen = async () => {
    try {
      if (document.fullscreenElement) { await document.exitFullscreen(); return; }
      await dashboardRef.current?.requestFullscreen();
    } catch (e) { console.warn("Fullscreen unavailable:", e); }
  };

  const handleCopyInvite = () => {
    navigator.clipboard?.writeText(window.location.href).catch(() => {});
    setCopiedInvite(true);
    setTimeout(() => setCopiedInvite(false), 1800);
  };

  const nigerianStates = ["Anywhere","Lagos","Abuja","Port Harcourt","Edo","Kano","Ibadan","Enugu","Kaduna","Benin City"];
  const interestTags = ["Gaming","Music","Sports","Tech","Art","Travel","Food","Movies"];

  return (
    <div className="vibe-dashboard" ref={dashboardRef}>

      {/* ── LIVE VIEW ── */}
      {isLive && (
        <div className={`live-fullscreen ${isFullscreen ? "expanded-call" : "compact-call"}`}>
          <button className="fullscreen-toggle-btn" onClick={handleToggleFullscreen}
            aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"} type="button">
            {isFullscreen ? <Minimize2 size={18} strokeWidth={2.4} /> : <Maximize2 size={18} strokeWidth={2.4} />}
          </button>

          {/* Searching */}
          {isMatching && (
            <div className="searching-screen">
              <div className="search-user-panel">
                <LocalVideo stream={cameraStream} className={`live-video mirrored ${hasCameraFeed ? "has-feed" : ""}`} muted mirror />
                {!hasCameraFeed && (
                  <div className="no-feed-avatar">
                    {profilePhoto ? <img src={profilePhoto} alt="" className="slot-profile-photo" /> : <><div className="nf-head" /><div className="nf-body" /></>}
                    <p>{cameraMessage}</p>
                  </div>
                )}
                <div className="slot-tag you-tag"><span className="dot-green" />You</div>
              </div>
              <div className="searching-right-panel">
                <div className="loader" />
                <p key={quoteKey} className="wander-text animate-quote">{quote}</p>
                <button className="quit-btn" onClick={handleQuitQueue} aria-label="Quit matchmaking">Quit</button>
              </div>
            </div>
          )}

          {/* Matched */}
          {isMatched && (
            <div className="matched-screen">
              {/* Your video */}
              <div className="matched-left-panel">
                <LocalVideo stream={cameraStream} className={`live-video mirrored ${hasCameraFeed ? "has-feed" : ""}`} muted mirror />
                {!hasCameraFeed && (
                  <div className="no-feed-avatar">
                    {profilePhoto ? <img src={profilePhoto} alt="" className="slot-profile-photo" /> : <><div className="nf-head" /><div className="nf-body" /></>}
                    <p>{cameraMessage}</p>
                  </div>
                )}
                <div className="slot-tag you-tag">
                  <span className="dot-green" />{username} • {callTimer}
                </div>
                <MessageDock chatOpen={chatOpen} setChatOpen={setChatOpen} />
              </div>

              {/* Center controls */}
              <div className="matched-divider">
                <button className="call-center-action skip-action" onClick={handleSkip} aria-label="Skip" type="button">
                  <SkipForward size={18} strokeWidth={2.4} />
                </button>
                <button className="call-center-action games-action" onClick={() => setGamesOpen(true)} aria-label="Games" type="button">
                  <Gamepad2 size={18} strokeWidth={2.4} />
                </button>
              </div>

              {/* Stranger video */}
              <div className="matched-right-panel">
                <div className="stranger-avatar"><div className="nf-head" /><div className="nf-body" /></div>
                <div className="slot-tag stranger-tag">Stranger</div>
                <button className="end-circle-btn" onClick={handleEndCall} aria-label="End call">✕</button>
              </div>

              {gamesOpen && <GamesModal selectedGame={selectedGame} onClose={() => setGamesOpen(false)} />}
            </div>
          )}
        </div>
      )}

      {/* ── IDLE VIEW ── */}
      {!isLive && (
        <>
          <div className="dashboard-main-view">
            <div className="main-camera-stage">
              <LocalVideo stream={cameraStream} className={`main-camera-stream ${hasCameraFeed ? "has-feed" : ""}`} muted mirror />
              {!hasCameraFeed && (
                <div className="main-camera-fallback">
                  {cameraStatus === "starting" && <div className="camera-starting-pulse" />}
                  {profilePhoto && cameraStatus !== "starting"
                    ? <img src={profilePhoto} alt="" className="slot-profile-photo slot-profile-photo--large" />
                    : !profilePhoto && cameraStatus !== "starting" && <><div className="avatar-head" /><div className="avatar-body" /></>
                  }
                  <p>{cameraMessage || (cameraStatus === "starting" ? "Starting camera…" : "")}</p>
                </div>
              )}
              <div className="main-camera-tag">
                <span className={hasCameraFeed ? "live-status-dot" : "offline-status-dot"} />
                You • {hasCameraFeed ? "Live" : "Camera off"}
              </div>
              <p className="idle-hint camera-idle-hint">Press Start to find someone</p>
              <button
                className="fullscreen-toggle-btn"
                style={{ position: "absolute", top: 16, right: 16, left: "auto" }}
                onClick={handleToggleFullscreen}
                aria-label="Toggle fullscreen"
                type="button"
              >
                <Maximize2 size={18} strokeWidth={2.4} />
              </button>
            </div>
          </div>

          <aside className="dashboard-sidebar">
            {/* Header */}
            <div className="sidebar-header-row">
              <div className="vibe-logo">the<span>.vibe</span></div>
              <div className="header-icon-actions">
                <div className="profile-menu-wrap">
                  <button className={`icon-utility-btn ${profileOpen ? "active" : ""}`}
                    onClick={() => setProfileOpen((o) => !o)} aria-label="Profile" type="button">👤</button>
                  {profileOpen && (
                    <div className="profile-dropdown">
                      <div className="profile-upload-center">
                        <label className="profile-photo-upload" htmlFor="profile-photo-input">
                          {profilePhoto
                            ? <img src={profilePhoto} alt="" className="profile-photo-preview" />
                            : <><span className="profile-photo-icon">+</span><span className="profile-photo-copy">Upload photo</span></>
                          }
                        </label>
                        <input id="profile-photo-input" className="profile-photo-input" type="file" accept="image/*" onChange={handleProfilePhoto} />
                      </div>
                      <label className="profile-field-label" htmlFor="profile-username-input">Username</label>
                      <input id="profile-username-input" className="profile-username-input" value={username}
                        onChange={(e) => setUsername(e.target.value)} placeholder="Enter username" />
                      {/* Logout button */}
                      {onLogout && (
                        <button
                          onClick={onLogout}
                          style={{
                            marginTop: 12, width: "100%", background: "transparent",
                            border: "1px solid #2d245a", color: "#8b8a9a", fontSize: 12,
                            fontWeight: 700, padding: "9px", borderRadius: 8, cursor: "pointer",
                          }}
                          onMouseEnter={e => { e.target.style.borderColor = "#ef4444"; e.target.style.color = "#fca5a5"; }}
                          onMouseLeave={e => { e.target.style.borderColor = "#2d245a"; e.target.style.color = "#8b8a9a"; }}
                        >
                          Sign out
                        </button>
                      )}
                    </div>
                  )}
                </div>
                <button className="icon-utility-btn" aria-label="Messages">💬</button>
              </div>
            </div>

            {/* Mode Pill */}
            <div className="mode-selection-pill-container">
              <button className={`mode-pill-btn ${matchMode === "SOLO" ? "active" : ""}`} onClick={() => setMatchMode("SOLO")}>SOLO</button>
              <button className={`mode-pill-btn ${matchMode === "GROUP" ? "active" : ""}`} onClick={() => setMatchMode("GROUP")}>GROUP</button>
            </div>

            {/* SOLO MODE */}
            {matchMode === "SOLO" && (
              <>
                <div className="online-status-banner">
                  <span className="pulse-green-dot" />
                  11,000 people online now
                </div>
                <div className="pref-wrap">
                  <button className={`preference-navigation-anchor-btn ${prefOpen ? "open" : ""}`} onClick={() => setPrefOpen(!prefOpen)}>
                    <div className="pref-left-flex">
                      <span className="pref-icon">🎛️</span>
                      <span className="pref-label">Preferences</span>
                      <span className="premium-lock-badge">⭐ Premium</span>
                    </div>
                    <span className={`pref-arrow-indicator ${prefOpen ? "rotated" : ""}`}>›</span>
                  </button>
                  {prefOpen && (
                    <div className="pref-dropdown locked-overlay-wrap">
                      <div className="pref-content-blurred">
                        <div className="pref-row">
                          <label className="pref-row-label" htmlFor="pref-gender">MATCH GENDER</label>
                          <div className="pref-gender-btns" id="pref-gender">
                            {["Anyone","Male","Female"].map((g) => (
                              <button key={g} className={`gender-btn ${gender === g ? "active" : ""}`} onClick={() => setGender(g)}>{g}</button>
                            ))}
                          </div>
                        </div>
                        <div className="pref-row">
                          <label className="pref-row-label" htmlFor="pref-location">STATE / LOCATION</label>
                          <select id="pref-location" className="pref-select" value={location} onChange={(e) => setLocation(e.target.value)}>
                            {nigerianStates.map((s) => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </div>
                        <div className="pref-row">
                          <label className="pref-row-label">INTERESTS</label>
                          <div className="pref-tags">
                            {interestTags.map((tag) => (
                              <span key={tag} className={`pref-tag ${interests.includes(tag) ? "active" : ""}`} onClick={() => toggleInterest(tag)}>{tag}</span>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="premium-gate-overlay">
                        <div className="premium-gate-card">
                          <span className="premium-star">⭐</span>
                          <h3 className="premium-gate-title">Premium Feature</h3>
                          <p className="premium-gate-desc">Filter by gender, location, and interests. Upgrade to unlock.</p>
                          <button className="upgrade-btn" onClick={onNavigateToPlus}>Upgrade to Plus</button>
                          <button className="gate-dismiss-btn" onClick={(e) => { e.stopPropagation(); setPrefOpen(false); }}>Maybe later</button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <button onClick={startMatching} className="primary-match-action-btn" disabled={cameraStatus !== "ready"}>
                  <span>📹</span> {cameraStatus === "ready" ? "Start Video Chat" : "Waiting for camera…"}
                </button>
              </>
            )}

            {/* GROUP MODE */}
            {matchMode === "GROUP" && (
              <GroupLobby onJoin={handleGroupJoin} onNavigateToPlus={onNavigateToPlus} />
            )}

            {/* Footer */}
            <footer className="sidebar-utility-footer">
              <button className="footer-action-item gold-highlight" onClick={onNavigateToPlus} aria-label="Plus">
                <span className="footer-icon">⭐</span>
                <span className="footer-label">Plus</span>
              </button>
              <button className="footer-action-item" onClick={handleCopyInvite} aria-label="Copy invite link">
                <span className="footer-icon">{copiedInvite ? "✓" : "🔗"}</span>
                <span className="footer-label">{copiedInvite ? "Copied!" : "Invite"}</span>
              </button>
              <button className="footer-action-item" aria-label="More options" onClick={() => alert("Settings coming soon")}>
                <span className="footer-icon">•••</span>
                <span className="footer-label">More</span>
              </button>
            </footer>
          </aside>
        </>
      )}
    </div>
  );
}
