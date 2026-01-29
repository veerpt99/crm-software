import { useState } from "react";
import axios from "axios";
import API from "./api";

function Profile() {
  const storedUser = JSON.parse(localStorage.getItem("user"));

  const [username, setUsername] = useState(storedUser?.username || "");
  const [avatar, setAvatar] = useState(storedUser?.avatar || null);
  const [lastLogin] = useState(storedUser?.last_login || null);

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  /* ================= UPDATE PROFILE ================= */
  const updateProfile = async () => {
    if (!username) return alert("Username required");
    if (password && password !== confirm)
      return alert("Passwords do not match");

    try {
      setLoading(true);

      await axios.put(`${API}/update-profile`, {
        id: storedUser.id,
        username,
        ...(password ? { password } : {}),
      });

      // update username locally
      const updatedUser = {
        ...storedUser,
        username,
      };

      localStorage.setItem("user", JSON.stringify(updatedUser));
      window.dispatchEvent(new Event("user-updated"));

      alert("Profile updated ✅");
      setPassword("");
      setConfirm("");
    } catch (err) {
      alert(err.response?.data?.message || "Update failed");
    } finally {
      setLoading(false);
    }
  };

  /* ================= AVATAR UPLOAD ================= */
  const uploadAvatar = async (file) => {
    if (!file) return;

    try {
      const fd = new FormData();
      fd.append("avatar", file);
      fd.append("id", storedUser.id);

      const res = await axios.post(`${API}/upload-avatar`, fd);

      const updatedUser = {
        ...storedUser,
        avatar: res.data.avatar, // already "/uploads/..."
      };

      localStorage.setItem("user", JSON.stringify(updatedUser));
      setAvatar(res.data.avatar);

      // 🔥 force Layout refresh
      window.dispatchEvent(new Event("user-updated"));
    } catch (err) {
      alert(err.response?.data?.message || "Avatar upload failed");
    }
  };

  return (
    <div className="page profile-page">
      <h2>Profile</h2>

      {/* AVATAR CARD */}
      <div className="card" style={{ display: "flex", gap: 20 }}>
        <div>
          {avatar ? (
            <img
              src={`${API}${avatar}?t=${Date.now()}`}
              alt="avatar"
              style={{
                width: 80,
                height: 80,
                borderRadius: "50%",
                objectFit: "cover",
              }}
            />
          ) : (
            <div
              style={{
                width: 80,
                height: 80,
                borderRadius: "50%",
                background: "#6366f1",
                color: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 28,
                fontWeight: 600,
              }}
            >
              {username.charAt(0).toUpperCase()}
            </div>
          )}

          <input
            type="file"
            accept="image/*"
            style={{ marginTop: 10 }}
            onChange={(e) => uploadAvatar(e.target.files[0])}
          />
        </div>

        <div>
          <p>
            <b>Last Login:</b>{" "}
            {lastLogin ? new Date(lastLogin).toLocaleString() : "First login"}
          </p>
        </div>
      </div>

      {/* ACCOUNT INFO */}
      <div className="card">
        <h3>Account Info</h3>
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Username"
        />
      </div>

      {/* PASSWORD */}
      <div className="card">
        <h3>Change Password</h3>

        <input
          type="password"
          placeholder="New Password (optional)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <input
          type="password"
          placeholder="Confirm Password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />

        <button onClick={updateProfile} disabled={loading}>
          {loading ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  );
}

export default Profile;
