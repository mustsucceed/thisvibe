import React, { useState, useEffect, useRef } from 'react';
import './DashboardPage.css';

export default function DashboardPage() {
  const [matchMode, setMatchMode] = useState('SOLO');
  const [isMatching, setIsMatching] = useState(false);
  const [isMatched, setIsMatched] = useState(false);
  const [prefOpen, setPrefOpen] = useState(false);
  const [showPremiumGate, setShowPremiumGate] = useState(false);
  const [gender, setGender] = useState('Anyone');
  const [location, setLocation] = useState('Anywhere');
  const [interests, setInterests] = useState(['Gaming', 'Travel']);
  const localVideoRef = useRef(null);
  const matchTimerRef = useRef(null);

  const isLive = isMatching || isMatched;

  useEffect(() => {
    async function setupCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;
      } catch (err) {
        console.warn('Camera unavailable:', err);
      }
    }
    setupCamera();
    return () => { if (matchTimerRef.current) clearTimeout(matchTimerRef.current); };
  }, []);

  const toggleInterest = (tag) => {
    setInterests(prev => prev.includes(tag) ? prev.filter(i => i !== tag) : [...prev, tag]);
  };

  const handleStartChat = () => {
    if (isMatched) { setIsMatched(false); setIsMatching(false); return; }
    if (isMatching) { setIsMatching(false); clearTimeout(matchTimerRef.current); return; }
    setIsMatching(true);
    matchTimerRef.current = setTimeout(() => { setIsMatching(false); setIsMatched(true); }, 2800);
  };

  const handleSkip = () => {
    setIsMatched(false);
    setIsMatching(true);
    matchTimerRef.current = setTimeout(() => { setIsMatching(false); setIsMatched(true); }, 2000);
  };

  const nigerianStates = ['Anywhere','Lagos','Abuja','Port Harcourt','Edo','Kano','Ibadan','Enugu','Kaduna','Benin City'];
  const interestTags = ['Gaming','Music','Sports','Tech','Art','Travel','Food','Movies'];

  return (
    <div className="vibe-dashboard">

      {/* ── FULLSCREEN LIVE VIEW ── */}
      {isLive && (
        <div className="live-fullscreen">

          {isMatching && (
            <div className="searching-screen">
              <div className="search-user-panel">
                <video ref={localVideoRef} autoPlay playsInline muted className="live-video mirrored" />
                <div className="no-feed-avatar"><div className="nf-head"></div><div className="nf-body"></div></div>
                <div className="slot-tag you-tag"><span className="dot-green"></span>You</div>
              </div>
              <div className="searching-right-panel">
                <p className="wander-text">Wander shall never end</p>
                <div className="spinner"></div>
                <button className="quit-btn" onClick={handleStartChat}>Quit</button>
              </div>
            </div>
          )}

          {isMatched && (
            <div className="matched-screen">
              <div className="matched-left-panel">
                <video ref={localVideoRef} autoPlay playsInline muted className="live-video mirrored" />
                <div className="no-feed-avatar"><div className="nf-head"></div><div className="nf-body"></div></div>
                <div className="slot-tag you-tag"><span className="dot-green"></span>You</div>
              </div>

              <div className="matched-divider">
                <button className="skip-fab" onClick={handleSkip} title="Skip">⏭</button>
              </div>

              <div className="matched-right-panel">
                <div className="stranger-avatar"><div className="nf-head"></div><div className="nf-body"></div></div>
                <div className="slot-tag stranger-tag">Stranger</div>
                <button className="end-circle-btn" onClick={handleStartChat} title="End">✕</button>
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
            <div className="idle-state">
              <div className="user-avatar-placeholder">
                <div className="avatar-head"></div>
                <div className="avatar-body"></div>
              </div>
              <p className="idle-hint">Press Start to find someone</p>
            </div>
          </div>

          <aside className="dashboard-sidebar">

            <div className="sidebar-header-row">
              <div className="vibe-logo">the<span>.vibe</span></div>
              <div className="header-icon-actions">
                <button className="icon-utility-btn" title="Profile">👤</button>
                <button className="icon-utility-btn" title="Messages">💬</button>
              </div>
            </div>

            <div className="mode-selection-pill-container">
              <button className={`mode-pill-btn ${matchMode === 'SOLO' ? 'active' : ''}`} onClick={() => setMatchMode('SOLO')}>SOLO</button>
              <button className={`mode-pill-btn ${matchMode === 'GROUP' ? 'active' : ''}`} onClick={() => setMatchMode('GROUP')}>GROUP</button>
            </div>

            <div className="local-camera-module">
              <p className="module-title-label">YOUR CAMERA</p>
              <div className="local-video-canvas-frame">
                <video ref={localVideoRef} autoPlay playsInline muted className="camera-mirror-stream" />
                <div className="camera-no-feed"><div className="cam-avatar-head"></div><div className="cam-avatar-body"></div></div>
                <div className="local-identity-tag"><span className="live-status-dot"></span>You • Live</div>
              </div>
            </div>

            <div className="online-status-banner">
              <span className="pulse-green-dot"></span>
              11,000 people online now
            </div>

            {/* Preferences — premium gated */}
            <div className="pref-wrap">
              <button
                className={`preference-navigation-anchor-btn ${prefOpen ? 'open' : ''}`}
                onClick={() => { setPrefOpen(!prefOpen); setShowPremiumGate(false); }}
              >
                <div className="pref-left-flex">
                  <span className="pref-icon">🎛️</span>
                  <span className="pref-label">Preferences</span>
                  <span className="premium-lock-badge">⭐ Premium</span>
                </div>
                <span className={`pref-arrow-indicator ${prefOpen ? 'rotated' : ''}`}>›</span>
              </button>

              {prefOpen && (
                <div className="pref-dropdown locked-overlay-wrap">
                  {/* Blurred content behind */}
                  <div className="pref-content-blurred">
                    <div className="pref-row">
                      <label className="pref-row-label">MATCH GENDER</label>
                      <div className="pref-gender-btns">
                        {['Anyone','Male','Female'].map(g => (
                          <button key={g} className={`gender-btn ${gender === g ? 'active' : ''}`}>{g}</button>
                        ))}
                      </div>
                    </div>
                    <div className="pref-row">
                      <label className="pref-row-label">STATE / LOCATION</label>
                      <select className="pref-select">
                        {nigerianStates.map(s => <option key={s}>{s}</option>)}
                      </select>
                    </div>
                    <div className="pref-row">
                      <label className="pref-row-label">INTERESTS</label>
                      <div className="pref-tags">
                        {interestTags.map(tag => (
                          <span key={tag} className={`pref-tag ${interests.includes(tag) ? 'active' : ''}`}>{tag}</span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Premium gate overlay */}
                  <div className="premium-gate-overlay">
                    <div className="premium-gate-card">
                      <span className="premium-star">⭐</span>
                      <h3 className="premium-gate-title">Premium Feature</h3>
                      <p className="premium-gate-desc">Filter by gender, location, and interests. Upgrade to unlock preferences.</p>
                      <button className="upgrade-btn">Upgrade to Plus</button>
                      <button className="gate-dismiss-btn" onClick={(e) => { e.stopPropagation(); setPrefOpen(false); }}>Maybe later</button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <button onClick={handleStartChat} className="primary-match-action-btn">
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
