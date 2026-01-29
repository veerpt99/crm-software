import { useState } from "react";
import axios from "axios";
import API from "./api";

function Profile() {
  const storedUser = JSON.parse(localStorage.getItem("user"));

  const [username, setUsername] = useState(storedUser?.username || "");
  const [avatar, setAvatar] = useState(storedUser?.avatar || null);
  const [lastLogin] = useState(storedUser?.last_login);

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

      const res = await axios.put(`${API}/update-profile`, {
        id: storedUser.id,
        username,
        ...(password ? { password } : {}),
      });

      // ✅ MERGE USER (IMPORTANT FIX)
      const updatedUser = {
        ...storedUser,
        username,
        avatar: res.data?.avatar ?? storedUser.avatar,
      };

      localStorage.setItem("user", JSON.stringify(updatedUser));
      setAvatar(updatedUser.avatar);

      // refresh layout
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

      // ✅ MERGE USER (CRITICAL)
      const updatedUser = {
        ...storedUser,
        avatar: res.data.avatar,
      };

      localStorage.setItem("user", JSON.stringify(updatedUser));
      setAvatar(res.data.avatar);

      window.dispatchEvent(new Event("user-updated"));
    } catch (err) {
      alert(err.response?.data?.message || "Avatar upload failed");
    }
  };

  return (
    <div className="page profile-page">
      <h2>Profile</h2>

      <div className="card" style={{ display: "flex", gap: 20 }}>
        <div>
          {avatar ? (
            <img
              src={`${API}${avatar}`}
              alt="avatar"
              style={{
                width: 80,
                height: 80,
                borderRadius: "50%",
                objectFit: "cover",
              }}
            />
          ) : (
            <div className="avatar-fallback">
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

        <div style={{ flex: 1 }}>
          <p>
            <b>Last Login:</b>{" "}
            {lastLogin
              ? new Date(lastLogin).toLocaleString()
              : "First login"}
          </p>
        </div>
      </div>

      <div className="card">
        <h3>Account Info</h3>
        <input
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="Username"
        />
      </div>

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
