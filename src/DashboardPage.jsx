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
      const playPromise = video.play();
      if (playPromise) {
        playPromise.catch((err) => {
          console.warn("Camera playback blocked:", err);
        });
      }
    }

    return () => {
      video.srcObject = null;
    };
  }, [stream]);

  return (
    <video ref={videoRef} autoPlay playsInline muted className={className} />
  );
}

export default function DashboardPage() {
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
  const dashboardRef = useRef(null);
  const matchTimerRef = useRef(null);
  const cameraStreamRef = useRef(null);
  const isMountedRef = useRef(false);

  const isLive = isMatching || isMatched;

  const stopCamera = useCallback(() => {
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach((track) => track.stop());
      cameraStreamRef.current = null;
    }
  }, []);

  const setupCamera = useCallback(async () => {
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("Camera is not supported in this browser.");
      }

      stopCamera();

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      if (!isMountedRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }

      cameraStreamRef.current = stream;
      stream.getVideoTracks().forEach((track) => {
        track.onended = () => {
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
      console.warn("Camera unavailable:", err);
      if (!isMountedRef.current) return;

      setCameraStream(null);
      setCameraStatus("error");

      if (err?.name === "NotAllowedError") {
        setCameraMessage("Camera permission blocked");
      } else if (err?.name === "NotFoundError") {
        setCameraMessage("No camera found");
      } else {
        setCameraMessage("Camera blocked or unavailable");
      }
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
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  useEffect(() => {
    if (!isMatching) return;

    const quoteTimer = setInterval(() => {
      setQuote((currentQuote) => {
        const nextQuotes = RANDOM_QUOTES.filter(
          (item) => item !== currentQuote,
        );
        return nextQuotes[Math.floor(Math.random() * nextQuotes.length)];
      });
    }, 3500);

    return () => clearInterval(quoteTimer);
  }, [isMatching]);

  const hasCameraFeed = cameraStatus === "ready" && cameraStream;

  const toggleInterest = (tag) => {
    setInterests((prev) =>
      prev.includes(tag) ? prev.filter((i) => i !== tag) : [...prev, tag],
    );
  };

  const handleStartChat = () => {
    if (isMatched) {
      setIsMatched(false);
      setIsMatching(false);
      return;
    }
    if (isMatching) {
      setIsMatching(false);
      clearTimeout(matchTimerRef.current);
      return;
    }
    setQuote(RANDOM_QUOTES[0]);
    setIsMatching(true);
    matchTimerRef.current = setTimeout(() => {
      setIsMatching(false);
      setIsMatched(true);
    }, 2800);
  };

  const handleSkip = () => {
    setIsMatched(false);
    setQuote(RANDOM_QUOTES[0]);
    setIsMatching(true);
    matchTimerRef.current = setTimeout(() => {
      setIsMatching(false);
      setIsMatched(true);
    }, 2000);
  };
  const handleToggleFullscreen = async () => {
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
        return;
      }

      await dashboardRef.current?.requestFullscreen();
    } catch (err) {
      console.warn("Fullscreen unavailable:", err);
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

  return (
    <div className="vibe-dashboard" ref={dashboardRef}>
      {/* ── FULLSCREEN LIVE VIEW ── */}
      {isLive && (
        <div
          className={`live-fullscreen ${isFullscreen ? "expanded-call" : "compact-call"}`}
        >
          <button
            className="fullscreen-toggle-btn"
            onClick={handleToggleFullscreen}
            title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
            type="button"
          >
            {isFullscreen ? (
              <Minimize2 size={18} strokeWidth={2.4} />
            ) : (
              <Maximize2 size={18} strokeWidth={2.4} />
            )}
          </button>

          {isMatching && (
            <div className="searching-screen">
              <div className="search-user-panel">
                <LocalVideo
                  stream={cameraStream}
                  className={`live-video mirrored ${hasCameraFeed ? "has-feed" : ""}`}
                />
                {!hasCameraFeed && (
                  <div className="no-feed-avatar">
                    <div className="nf-head"></div>
                    <div className="nf-body"></div>
                    <p>{cameraMessage}</p>
                  </div>
                )}
                <div className="slot-tag you-tag">
                  <span className="dot-green"></span>You
                </div>
              </div>
              <div className="searching-right-panel">
                <div className="loader"></div>
                <p className="wander-text">{quote}</p>
                <button className="quit-btn" onClick={handleStartChat}>
                  Quit
                </button>
              </div>
            </div>
          )}

          {isMatched && (
            <div className="matched-screen">
              <div className="matched-left-panel">
                <LocalVideo
                  stream={cameraStream}
                  className={`live-video mirrored ${hasCameraFeed ? "has-feed" : ""}`}
                />
                {!hasCameraFeed && (
                  <div className="no-feed-avatar">
                    <div className="nf-head"></div>
                    <div className="nf-body"></div>
                    <p>{cameraMessage}</p>
                  </div>
                )}
                <div className="slot-tag you-tag">
                  <span className="dot-green"></span>You
                </div>
              </div>

              <div className="matched-divider">
                <button
                  className="call-center-action skip-action"
                  onClick={handleSkip}
                  title="Skip"
                  type="button"
                >
                  <SkipForward size={18} strokeWidth={2.4} />
                </button>
                <button
                  className="call-center-action games-action"
                  title="Games"
                  type="button"
                >
                  <Gamepad2 size={18} strokeWidth={2.4} />
                </button>
              </div>

              <div className="matched-right-panel">
                <div className="stranger-avatar">
                  <div className="nf-head"></div>
                  <div className="nf-body"></div>
                </div>
                <div className="slot-tag stranger-tag">Stranger</div>
                <button
                  className="end-circle-btn"
                  onClick={handleStartChat}
                  title="End"
                >
                  ✕
                </button>
              </div>

              <button className="chat-float-btn">💬</button>
            </div>
          )}
        </div>
      )}

      {/* ── IDLE VIEW WITH SIDEBAR ── */}
      {!isLive && (
        <>
          <div className="dashboard-main-view">
            <div className="main-camera-stage">
              <LocalVideo
                stream={cameraStream}
                className={`main-camera-stream ${hasCameraFeed ? "has-feed" : ""}`}
              />
              {!hasCameraFeed && (
                <div className="main-camera-fallback">
                  <div className="avatar-head"></div>
                  <div className="avatar-body"></div>
                  <p>{cameraMessage}</p>
                </div>
              )}
              <div className="main-camera-tag">
                <span
                  className={
                    hasCameraFeed ? "live-status-dot" : "offline-status-dot"
                  }
                ></span>
                You • {hasCameraFeed ? "Live" : "Camera off"}
              </div>
              <p className="idle-hint camera-idle-hint">
                Press Start to find someone
              </p>
            </div>
          </div>

          <aside className="dashboard-sidebar">
            <div className="sidebar-header-row">
              <div className="vibe-logo">
                the<span>.vibe</span>
              </div>
              <div className="header-icon-actions">
                <button className="icon-utility-btn" title="Profile">
                  👤
                </button>
                <button className="icon-utility-btn" title="Messages">
                  💬
                </button>
              </div>
            </div>

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

            <div className="online-status-banner">
              <span className="pulse-green-dot"></span>
              11,000 people online now
            </div>

            {/* Preferences — premium gated */}
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
                  {/* Blurred content behind */}
                  <div className="pref-content-blurred">
                    <div className="pref-row">
                      <label className="pref-row-label">MATCH GENDER</label>
                      <div className="pref-gender-btns">
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
                      <label className="pref-row-label">STATE / LOCATION</label>
                      <select
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

                  {/* Premium gate overlay */}
                  <div className="premium-gate-overlay">
                    <div className="premium-gate-card">
                      <span className="premium-star">⭐</span>
                      <h3 className="premium-gate-title">Premium Feature</h3>
                      <p className="premium-gate-desc">
                        Filter by gender, location, and interests. Upgrade to
                        unlock preferences.
                      </p>
                      <button className="upgrade-btn">Upgrade to Plus</button>
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

            <button
              onClick={handleStartChat}
              className="primary-match-action-btn"
            >
              <span>📹</span> Start Video Chat
            </button>

            <footer className="sidebar-utility-footer">
              <button className="footer-action-item gold-highlight">
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
