import { useState } from "react";
import { Check, Plus, User } from "lucide-react";
import "./ProfileSetupPage.css";

const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL || "").replace(/\/$/, "") + "/api/auth";

export default function ProfileSetupPage({ user, setupToken, onComplete }) {
  const [username, setUsername] = useState(
    user?.profile?.completedAt ? user.username : "",
  );
  const [image, setImage] = useState(user?.profile?.images?.[0] || "");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Choose an image file.");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setError("Choose an image smaller than 2 MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setImage(String(reader.result));
      setError("");
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const trimmedUsername = username.trim();

    if (trimmedUsername.length < 3 || trimmedUsername.length > 32) {
      setError("Username must be between 3 and 32 characters.");
      return;
    }

    setIsSaving(true);
    setError("");

    try {
      const res = await fetch(`${API_BASE_URL}/complete-profile`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: user.email,
          username: trimmedUsername,
          image,
          setupToken,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Unable to save your profile.");
        return;
      }

      onComplete(data);
    } catch {
      setError("Unable to save your profile. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <main className="profile-setup-page">
      <form className="profile-setup-card" onSubmit={handleSubmit}>
        <div className="profile-setup-emoji-field" aria-hidden="true">
          <span style={{ "--x": "7%", "--y": "10%", "--r": "-14deg" }}>✦</span>
          <span style={{ "--x": "84%", "--y": "9%", "--r": "12deg" }}>🎮</span>
          <span style={{ "--x": "12%", "--y": "57%", "--r": "8deg" }}>💬</span>
          <span style={{ "--x": "87%", "--y": "70%", "--r": "-9deg" }}>✦</span>
        </div>
        <header className="profile-setup-header">
          <div className="profile-setup-logo">
            the<em>.vibe</em>
          </div>
          <h1>Create your profile</h1>
          <p>Choose a username and add a photo to get started.</p>
        </header>

        <label className="profile-setup-photo" htmlFor="setup-profile-photo">
          {image ? (
            <img src={image} alt="Profile preview" />
          ) : (
            <Plus size={31} strokeWidth={2.4} />
          )}
          <span>{image ? "Change photo" : "Add a photo"}</span>
        </label>
        <input
          id="setup-profile-photo"
          className="profile-setup-file"
          type="file"
          accept="image/*"
          onChange={handleImageChange}
        />

        <label className="profile-setup-label" htmlFor="setup-username">
          Username
        </label>
        <div className="profile-setup-input-wrap">
          <User size={18} aria-hidden="true" />
          <input
            id="setup-username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            autoComplete="username"
            placeholder="Your username"
            maxLength={32}
            required
          />
        </div>

        {error && <p className="profile-setup-error">{error}</p>}

        <button
          className="profile-setup-submit"
          type="submit"
          disabled={isSaving}
        >
          {isSaving ? (
            "Saving..."
          ) : (
            <>
              <span>Continue to the vibe</span>
              <Check size={18} />
            </>
          )}
        </button>
      </form>
    </main>
  );
}
