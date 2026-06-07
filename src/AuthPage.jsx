import { useState } from "react";
import { Mail, Lock, User, Eye, EyeOff, ArrowRight } from "lucide-react";
import "./AuthPage.css";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

export default function AuthPage({ isSignUp: initialIsSignUp, onAuthSuccess }) {
  const [isSignUp, setIsSignUp] = useState(initialIsSignUp);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    username: "demo_user",
    email: "demo@thevibe.com",
    password: "password123", // Auto-fills the form for testing
    firstname: "User",
    lastname: "Vibe",
    dobDay: "01",
    dobMonth: "01",
    dobYear: "2000"
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    // -------------------------------------------------------------
    // DEMO BYPASS: Allows you to log in and test UI without a backend
    // -------------------------------------------------------------
    if (formData.email === "demo@thevibe.com" && formData.password === "password123") {
      setTimeout(() => {
        setIsLoading(false);
        onAuthSuccess({
          message: "Demo login successful",
          user: { id: "123", username: formData.username, email: formData.email },
          token: "mock-jwt-token-for-testing"
        });
      }, 1000); // 1-second simulated network delay
      return;
    }
    // -------------------------------------------------------------

    const endpoint = isSignUp ? "/signup" : "/login";
    
    const payload = {
      ...formData,
      dob: `${formData.dobYear}-${formData.dobMonth}-${formData.dobDay}`
    };

    try {
      const res = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok) {
        onAuthSuccess(data);
      } else {
        alert(data.message || "Authentication failed");
      }
    } catch (err) {
      console.error(err);
      alert("Network error. Please try again or use the demo credentials.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialAuth = (provider) => {
    // e.preventDefault() was causing an error here because 'e' wasn't passed, removed for stability
    console.log(`Authenticate with ${provider}`);
  };

  return (
    <div className="auth-page-wrapper">
      {/* Ambient Background Orbs */}
      <div className="auth-bg-orb orb-purple"></div>
      <div className="auth-bg-orb orb-blue"></div>

      <div className="auth-card-container">
        
        {/* Header Section */}
        <div className="auth-header">
          <div className="auth-logo">the<span>.vibe</span></div>
          <h2>{isSignUp ? "Join the vibe" : "Welcome back"}</h2>
          <p className="auth-subtitle">
            {isSignUp 
              ? "Create an account to start connecting instantly." 
              : "Enter your details to access your account."}
          </p>
        </div>

        {/* Social Auth (Industry Standard) */}
        <div className="auth-social-group">
          <button type="button" className="auth-social-btn" onClick={() => handleSocialAuth('Google')}>
            <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            Google
          </button>
          <button type="button" className="auth-social-btn" onClick={() => handleSocialAuth('Apple')}>
            <svg viewBox="0 0 24 24" width="20" height="20" fill="#ffffff" xmlns="http://www.w3.org/2000/svg">
              <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.62-1.468 3.608-2.983 1.15-1.674 1.623-3.295 1.64-3.376-.039-.013-3.159-1.213-3.193-4.838-.026-3.035 2.482-4.502 2.598-4.577-1.425-2.083-3.626-2.366-4.417-2.404-2.072-.117-4.103 1.314-5.116 1.314s-2.73-1.197-4.406-1.197zm2.744-2.883c.801-.973 1.341-2.325 1.193-3.663-1.153.047-2.553.77-3.38 1.733-.74.81-1.346 2.186-1.168 3.493 1.288.104 2.554-.593 3.355-1.563z"/>
            </svg>
            Apple
          </button>
        </div>

        <div className="auth-divider">
          <span>or continue with email</span>
        </div>

        {/* Main Form */}
        <form onSubmit={handleSubmit} className="auth-form-flow">
          
          {isSignUp && (
            <div className="auth-input-group">
              <label>Username</label>
              <div className="auth-input-wrapper">
                <User className="auth-input-icon" size={18} />
                <input 
                  type="text"
                  required
                  placeholder="e.g. vibe_master"
                  value={formData.username}
                  onChange={e => setFormData({...formData, username: e.target.value})}
                />
              </div>
            </div>
          )}

          <div className="auth-input-group">
            <label>Email Address</label>
            <div className="auth-input-wrapper">
              <Mail className="auth-input-icon" size={18} />
              <input 
                type="email" 
                required
                placeholder="you@example.com"
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
              />
            </div>
          </div>

          <div className="auth-input-group">
            <div className="auth-label-row">
              <label>Password</label>
              {!isSignUp && <span className="auth-forgot-link">Forgot password?</span>}
            </div>
            <div className="auth-input-wrapper">
              <Lock className="auth-input-icon" size={18} />
              <input 
                type={showPassword ? "text" : "password"} 
                required
                placeholder="••••••••"
                value={formData.password}
                onChange={e => setFormData({...formData, password: e.target.value})}
              />
              <button 
                type="button" 
                className="auth-password-toggle"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button type="submit" className="auth-submit-btn" disabled={isLoading}>
            {isLoading ? <div className="auth-spinner" /> : (
              <>
                {isSignUp ? "Create account" : "Sign in"}
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        {/* Footer Toggle */}
        <div className="auth-footer">
          {isSignUp ? "Already have an account?" : "Don't have an account?"}
          <button 
            type="button" 
            className="auth-toggle-btn"
            onClick={() => setIsSignUp(!isSignUp)}
          >
            {isSignUp ? "Sign in" : "Sign up"}
          </button>
        </div>
        
      </div>
    </div>
  );
}