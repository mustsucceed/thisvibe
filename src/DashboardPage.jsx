import { useState, useEffect, useRef, useCallback } from "react";
import { Gamepad2, Maximize2, Minimize2, SkipForward } from "lucide-react";
import "./DashboardPage.css";

const RANDOM_QUOTES = [
  "Tomorrow is hiding behind the next hill",
  "The moon owes me directions",
  "A new vibe is loading",
  "Someone interesting is almost here",
];

function LocalVideo({ className, stream }) {
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
  return <video ref={videoRef} autoPlay playsInline muted className={className} />;
}

/* ── GROUP LOBBY PANEL ── */
function GroupLobby({ onJoin, onNavigateToPlus }) {
  const [selectedSize, setSelectedSize] = useState(2);
  const [selectedGame, setSelectedGame] = useState("hotseat");
  const [gateChoice, setGateChoice] = useState(null);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="group-lobby">

      {/* Question Gate */}
      <div className="gl-section">
        <p className="gl-section-label">FIND YOUR TRIBE</p>
        <div className="gl-gate">
          <p className="gl-gate-label">QUICK QUESTION</p>
          <p className="gl-gate-question">Who is the GOAT? 🐐</p>
          <div className="gl-gate-opts">
            {["Messi", "Ronaldo"].map((opt) => (
              <button
                key={opt}
                className={`gl-gate-opt ${gateChoice === opt ? "selected" : ""}`}
                onClick={() => setGateChoice(opt)}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Stranger Picker */}
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

      {/* Monkey Invite */}
      <div className="gl-invite-box">
        <div className="gl-invite-top">
          <span className="gl-invite-icon">🔗</span>
          <div>
            <div className="gl-invite-title">Bring a friend, meet a stranger</div>
            <div className="gl-invite-sub">Invite someone — we add 1 random to make 3</div>
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
        <button className="gl-copy-btn" onClick={handleCopy}>
          {copied ? "✓ Copied!" : "🔗 Copy Invite Link"}
        </button>
      </div>

      {/* Game Picker */}
      <div className="gl-section">
        <p className="gl-section-label">PICK A GAME MODE</p>
        <div className="gl-games-grid">
          {[
            { id: "hotseat", icon: "🔥", name: "Hot Seat", desc: "Answer or skip", locked: false },
            { id: "wyr", icon: "🗳️", name: "Would You Rather", desc: "Vote live", locked: false },
            { id: "song", icon: "🎶", name: "Guess the Song", desc: "First to name it", locked: true },
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

      {/* Premium Strip */}
      <div className="gl-premium-strip">
        <span className="gl-premium-star">⭐</span>
        <div className="gl-premium-text">
          <div className="gl-premium-title">Unlock groups of 4 + all games</div>
          <div className="gl-premium-sub">Guess the Song, DJ Mode, custom rooms</div>
        </div>
        <button className="gl-premium-btn" onClick={onNavigateToPlus}>Get Plus</button>
      </div>

      {/* Join Button */}
      <button className="gl-join-btn" onClick={() => onJoin(selectedSize, selectedGame)}>
        🎲 Join Group Room
      </button>
    </div>
  );
}

export default function DashboardPage({ onNavigateToPlus }) {
  const [matchMode, setMatchMode] = useState("SOLO");
  const [isMatching, setIsMatching] = useState(false);
  const [isMatched, setIsMatched] = useState(false);
  const [prefOpen, setPrefOpen] = useState(false);
  const [gender, setGender] = useState("Anyone");
  const [location, setLocation] = useState("Anywhere");
  const [interests, setInterests] = useState(["Gaming", "Travel"]);
  const [cameraStream, setCameraStream] = useState(null);
  const [cameraStatus, setCameraStatus] = useState("starting");
  const [cameraMessage, setCameraMessage] = useState("Starting camera...");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [quote, setQuote] = useState(RANDOM_QUOTES[0]);
  const [chatOpen, setChatOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [username, setUsername] = useState("Francis");
  const [profilePhoto, setProfilePhoto] = useState("");
  const dashboardRef = useRef(null);
  const matchTimerRef = useRef(null);
  const cameraStreamRef = useRef(null);
  const isMountedRef = useRef(false);

  const isLive = isMatching || isMatched;

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
        audio: false,
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
      else setCameraMessage("Camera blocked or unavailable");
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

  useEffect(() => {
    if (!isMatching) return;
    const t = setInterval(() => {
      setQuote((q) => {
        const next = RANDOM_QUOTES.filter((x) => x !== q);
        return next[Math.floor(Math.random() * next.length)];
      });
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

  const handleStartChat = () => {
    setChatOpen(false);
    setProfileOpen(false);
    if (isMatched) { setIsMatched(false); setIsMatching(false); return; }
    if (isMatching) { setIsMatching(false); clearTimeout(matchTimerRef.current); return; }
    setQuote(RANDOM_QUOTES[0]); setIsMatching(true);
    matchTimerRef.current = setTimeout(() => { setIsMatching(false); setIsMatched(true); }, 2800);
  };

  const handleSkip = () => {
    setChatOpen(false);
    setIsMatched(false); setQuote(RANDOM_QUOTES[0]); setIsMatching(true);
    matchTimerRef.current = setTimeout(() => { setIsMatching(false); setIsMatched(true); }, 2000);
  };

  const handleGroupJoin = () => {
    setQuote(RANDOM_QUOTES[0]); setIsMatching(true);
    matchTimerRef.current = setTimeout(() => { setIsMatching(false); setIsMatched(true); }, 2800);
  };

  const handleToggleFullscreen = async () => {
    try {
      if (document.fullscreenElement) { await document.exitFullscreen(); return; }
      await dashboardRef.current?.requestFullscreen();
    } catch (e) { console.warn("Fullscreen unavailable:", e); }
  };

  const nigerianStates = ["Anywhere","Lagos","Abuja","Port Harcourt","Edo","Kano","Ibadan","Enugu","Kaduna","Benin City"];
  const interestTags = ["Gaming","Music","Sports","Tech","Art","Travel","Food","Movies"];

  return (
    <div className="vibe-dashboard" ref={dashboardRef}>

      {/* ── FULLSCREEN LIVE VIEW ── */}
      {isLive && (
        <div className={`live-fullscreen ${isFullscreen ? "expanded-call" : "compact-call"}`}>
          <button className="fullscreen-toggle-btn" onClick={handleToggleFullscreen}
            title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"} type="button">
            {isFullscreen ? <Minimize2 size={18} strokeWidth={2.4} /> : <Maximize2 size={18} strokeWidth={2.4} />}
          </button>

          {isMatching && (
            <div className="searching-screen">
              <div className="search-user-panel">
                <LocalVideo stream={cameraStream} className={`live-video mirrored ${hasCameraFeed ? "has-feed" : ""}`} />
                {!hasCameraFeed && <div className="no-feed-avatar"><div className="nf-head" /><div className="nf-body" /><p>{cameraMessage}</p></div>}
                <div className="slot-tag you-tag"><span className="dot-green" />You</div>
              </div>
              <div className="searching-right-panel">
                <div className="loader" />
                <p className="wander-text">{quote}</p>
                <button className="quit-btn" onClick={handleStartChat}>Quit</button>
              </div>
            </div>
          )}

          {isMatched && (
            <div className="matched-screen">
              <div className="matched-left-panel">
                <LocalVideo stream={cameraStream} className={`live-video mirrored ${hasCameraFeed ? "has-feed" : ""}`} />
                {!hasCameraFeed && <div className="no-feed-avatar"><div className="nf-head" /><div className="nf-body" /><p>{cameraMessage}</p></div>}
                <div className="slot-tag you-tag"><span className="dot-green" />You</div>
                <div className="message-dock">
                  {chatOpen && (
                    <div className="message-dropdown">
                      <div className="message-dropdown-header">
                        <span>Messages</span>
                        <span className="message-status">Live</span>
                      </div>
                      <div className="message-list">
                        <p className="message-empty">No messages yet</p>
                      </div>
                      <div className="message-input-row">
                        <input className="message-input" type="text" placeholder="Type a message" />
                        <button className="message-send-btn" type="button">Send</button>
                      </div>
                    </div>
                  )}
                  <button
                    className="message-toggle-btn"
                    onClick={() => setChatOpen((open) => !open)}
                    type="button"
                  >
                    <span>💬</span>
                    Message
                  </button>
                </div>
              </div>
              <div className="matched-divider">
                <button className="call-center-action skip-action" onClick={handleSkip} title="Skip" type="button">
                  <SkipForward size={18} strokeWidth={2.4} />
                </button>
                <button className="call-center-action games-action" title="Games" type="button">
                  <Gamepad2 size={18} strokeWidth={2.4} />
                </button>
              </div>
              <div className="matched-right-panel">
                <div className="stranger-avatar"><div className="nf-head" /><div className="nf-body" /></div>
                <div className="slot-tag stranger-tag">Stranger</div>
                <button className="end-circle-btn" onClick={handleStartChat} title="End">✕</button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── IDLE VIEW WITH SIDEBAR ── */}
      {!isLive && (
        <>
          <div className="dashboard-main-view">
            <div className="main-camera-stage">
              <LocalVideo stream={cameraStream} className={`main-camera-stream ${hasCameraFeed ? "has-feed" : ""}`} />
              {!hasCameraFeed && (
                <div className="main-camera-fallback">
                  <div className="avatar-head" /><div className="avatar-body" />
                  <p>{cameraMessage}</p>
                </div>
              )}
              <div className="main-camera-tag">
                <span className={hasCameraFeed ? "live-status-dot" : "offline-status-dot"} />
                You • {hasCameraFeed ? "Live" : "Camera off"}
              </div>
              <p className="idle-hint camera-idle-hint">Press Start to find someone</p>
            </div>
          </div>

          <aside className="dashboard-sidebar">
            {/* Header */}
            <div className="sidebar-header-row">
              <div className="vibe-logo">the<span>.vibe</span></div>
              <div className="header-icon-actions">
                <div className="profile-menu-wrap">
                  <button
                    className={`icon-utility-btn ${profileOpen ? "active" : ""}`}
                    onClick={() => setProfileOpen((open) => !open)}
                    title="Profile"
                    type="button"
                  >
                    👤
                  </button>
                  {profileOpen && (
                    <div className="profile-dropdown">
                      <div className="profile-upload-center">
                        <label className="profile-photo-upload" htmlFor="profile-photo-input">
                          {profilePhoto ? (
                            <img src={profilePhoto} alt="" className="profile-photo-preview" />
                          ) : (
                            <>
                              <span className="profile-photo-icon">+</span>
                              <span className="profile-photo-copy">Upload photo</span>
                            </>
                          )}
                        </label>
                        <input
                          id="profile-photo-input"
                          className="profile-photo-input"
                          type="file"
                          accept="image/*"
                          onChange={handleProfilePhoto}
                        />
                      </div>
                      <label className="profile-field-label" htmlFor="profile-username-input">Username</label>
                      <input
                        id="profile-username-input"
                        className="profile-username-input"
                        value={username}
                        onChange={(event) => setUsername(event.target.value)}
                        placeholder="Enter username"
                      />
                    </div>
                  )}
                </div>
                <button className="icon-utility-btn" title="Messages">💬</button>
              </div>
            </div>

            {/* Mode Pill */}
            <div className="mode-selection-pill-container">
              <button className={`mode-pill-btn ${matchMode === "SOLO" ? "active" : ""}`} onClick={() => setMatchMode("SOLO")}>SOLO</button>
              <button className={`mode-pill-btn ${matchMode === "GROUP" ? "active" : ""}`} onClick={() => setMatchMode("GROUP")}>GROUP</button>
            </div>

            {/* ── SOLO MODE ── */}
            {matchMode === "SOLO" && (
              <>
                {/* <div className="local-camera-module">
                  <p className="module-title-label">YOUR CAMERA</p>
                  <div className="local-video-canvas-frame">
                    <LocalVideo stream={cameraStream} className={`camera-mirror-stream ${hasCameraFeed ? "has-feed" : ""}`} />
                    <div className="camera-no-feed">
                      <div className="cam-avatar-head" /><div className="cam-avatar-body" />
                      <p className="camera-status-copy">{!hasCameraFeed ? cameraMessage : ""}</p>
                    </div>
                    <div className="local-identity-tag">
                      <span className={hasCameraFeed ? "live-status-dot" : "offline-status-dot"} />
                      You • {hasCameraFeed ? "Live" : "Off"}
                    </div>
                  </div>
                </div> */}

                <div className="online-status-banner">
                  <span className="pulse-green-dot" />
                  11,000 people online now
                </div>

                {/* Preferences */}
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
                          <label className="pref-row-label">MATCH GENDER</label>
                          <div className="pref-gender-btns">
                            {["Anyone","Male","Female"].map((g) => (
                              <button key={g} className={`gender-btn ${gender === g ? "active" : ""}`} onClick={() => setGender(g)}>{g}</button>
                            ))}
                          </div>
                        </div>
                        <div className="pref-row">
                          <label className="pref-row-label">STATE / LOCATION</label>
                          <select className="pref-select" value={location} onChange={(e) => setLocation(e.target.value)}>
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
                          <p className="premium-gate-desc">Filter by gender, location, and interests. Upgrade to unlock preferences.</p>
                          <button className="upgrade-btn" onClick={onNavigateToPlus}>Upgrade to Plus</button>
                          <button className="gate-dismiss-btn" onClick={(e) => { e.stopPropagation(); setPrefOpen(false); }}>Maybe later</button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <button onClick={handleStartChat} className="primary-match-action-btn">
                  <span>📹</span> Start Video Chat
                </button>
              </>
            )}

            {/* ── GROUP MODE ── */}
            {matchMode === "GROUP" && (
              <GroupLobby onJoin={handleGroupJoin} onNavigateToPlus={onNavigateToPlus} />
            )}

            {/* Footer — always visible */}
            <footer className="sidebar-utility-footer">
              <button className="footer-action-item gold-highlight" onClick={onNavigateToPlus}>
                <span className="footer-icon">⭐</span>
                <span className="footer-label">Plus</span>
              </button>
              <button className="footer-action-item">
                <span className="footer-icon">🔗</span>
                <span className="footer-label">Invite</span>
              </button>
              <button className="footer-action-item">
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
