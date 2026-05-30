import React, { useState, useEffect } from 'react';
import './AuthPage.css';

export default function AuthPage({ initialIsSignUp = true }) {
  const [isSignUp, setIsSignUp] = useState(initialIsSignUp);

  useEffect(() => {
    setIsSignUp(initialIsSignUp);
  }, [initialIsSignUp]);

  return (
    <div className="vibe-auth-container">
      <div className="auth-card-wrapper">
        
        {/* --- TOGGLE HEADER SWITCH --- */}
        <div className="auth-toggle-bar">
          <button 
            className={`toggle-btn ${isSignUp ? 'active' : ''}`} 
            onClick={() => setIsSignUp(true)}
          >
            Create account
          </button>
          <button 
            className={`toggle-btn ${!isSignUp ? 'active' : ''}`} 
            onClick={() => setIsSignUp(false)}
          >
            Sign in
          </button>
        </div>

        {/* --- SIGN UP FORM VIEW --- */}
        {isSignUp ? (
          <div className="auth-view-content animate-fade-in">
            <div className="step-tracker">
              <div className="step-item active">
                <span className="step-number">1</span>
                <span className="step-label">Account</span>
              </div>
              <div className="step-line"></div>
              <div className="step-item generic">
                <span className="step-number">2</span>
                <span className="step-label">Verify</span>
              </div>
              <div className="step-line"></div>
              <div className="step-item generic">
                <span className="step-number">3</span>
                <span className="step-label">Profile</span>
              </div>
            </div>

            <h1 className="auth-main-title">Create your account</h1>
            <p className="auth-subtext-marker">All fields marked <span className="req-asterisk">*</span> are required.</p>

            <div className="oauth-row grid-3">
              <button className="oauth-btn"><span className="g-brand">G</span> Google</button>
              <button className="oauth-btn"> Apple</button>
              <button className="oauth-btn"><span className="f-brand">f</span> Facebook</button>
            </div>

            <div className="auth-divider-line">
              <span>or with email</span>
            </div>

            <form onSubmit={(e) => e.preventDefault()} className="auth-form-flow">
              <div className="input-group-row">
                <div className="field-block">
                  <label>First name <span className="req-asterisk">*</span></label>
                  <input type="text" placeholder="Alex" required />
                </div>
                <div className="field-block">
                  <label>Last name <span className="req-asterisk">*</span></label>
                  <input type="text" placeholder="Jordan" required />
                </div>
              </div>

              <div className="field-block">
                <label>Email address <span className="req-asterisk">*</span></label>
                <input type="email" placeholder="alex@example.com" required />
              </div>

              <div className="field-block">
                <div className="label-justify-row">
                  <label>Phone number <span className="req-asterisk">*</span></label>
                  <span className="input-context-hint">For verification</span>
                </div>
                <div className="phone-input-split">
                  <select className="country-select" defaultValue="NG">
                    <option value="NG">NG +234</option>
                    <option value="US">US +1</option>
                    <option value="GB">GB +44</option>
                  </select>
                  <input type="tel" placeholder="801 234 5678" required />
                </div>
                <p className="input-explanatory-note">🛈 A 6-digit verification code will be sent to this number</p>
              </div>

              <div className="field-block">
                <label>Date of Birth <span className="req-asterisk">*</span></label>
                <div className="dob-triple-row">
                  <select required defaultValue="">
                    <option value="" disabled>Month</option>
                    <option value="1">January</option>
                    <option value="2">February</option>
                    <option value="3">March</option>
                    <option value="4">April</option>
                    <option value="5">May</option>
                    <option value="6">June</option>
                    <option value="7">July</option>
                    <option value="8">August</option>
                    <option value="9">September</option>
                    <option value="10">October</option>
                    <option value="11">November</option>
                    <option value="12">December</option>
                  </select>
                  <input type="number" placeholder="Day" min="1" max="31" required />
                  <input type="number" placeholder="Year" min="1920" max="2008" required />
                </div>
              </div>

              <div className="field-block">
                <label>Password <span className="req-asterisk">*</span></label>
                <input type="password" placeholder="At least 8 characters" minLength={8} required />
                <div className="strength-meter-bar">
                  <span></span><span></span><span></span><span></span>
                </div>
              </div>

              <div className="field-block">
                <label>Confirm password <span className="req-asterisk">*</span></label>
                <input type="password" placeholder="Repeat your password" required />
              </div>

              <div className="legal-checkbox-container">
                <p>
                  I agree to the <a href="#terms">Terms of Service</a> and <a href="#privacy">Privacy Policy</a>. 
                  I confirm I am 18 years or older.
                </p>
              </div>

              <button type="submit" className="vibe-btn-action-submit continuous-orange">
                Continue — Verify Phone &rarr;
              </button>
            </form>
          </div>
        ) : (
          /* --- SIGN IN FORM VIEW --- */
          <div className="auth-view-content animate-fade-in">
            <h1 className="auth-main-title">Welcome back</h1>
            <p className="auth-subtext-marker">Sign in to continue your journey.</p>

            <div className="oauth-row grid-2">
              <button className="oauth-btn"><span className="g-brand">G</span> Google</button>
              <button className="oauth-btn"> Apple</button>
            </div>

            <div className="auth-divider-line">
              <span>or with email or phone</span>
            </div>

            <form onSubmit={(e) => e.preventDefault()} className="auth-form-flow">
              <div className="field-block">
                <label>Email or phone number <span className="req-asterisk">*</span></label>
                <input type="text" placeholder="alex@email.com or +234 801 000 0000" required />
              </div>

              <div className="field-block">
                <div className="label-justify-row">
                  <label>Password <span className="req-asterisk">*</span></label>
                  <a href="#forgot" className="orange-inline-link">Forgot password?</a>
                </div>
                <input type="password" placeholder="Your password" required />
              </div>

              <div className="keep-signed-in-row">
                <input type="checkbox" id="keep-me-signed" />
                <label htmlFor="keep-me-signed">Keep me signed in</label>
              </div>

              <button type="submit" className="vibe-btn-action-submit continuous-orange">
                Sign In &rarr;
              </button>
            </form>

            <div className="auth-footer-alternate-notice">
              No account yet? <span onClick={() => setIsSignUp(true)} className="orange-inline-link high-action-trigger">Sign up free</span>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}