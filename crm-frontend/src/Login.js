import { useState } from "react";
import axios from "axios";
import API from "./api";

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const login = async () => {
    if (!username || !password) {
      setError("Username and password are required");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const res = await axios.post(`${API}/login`, {
        username: username.trim(),
        password,
      });

      // ✅ BACKEND RETURNS: { success, user }
      if (res.data?.success && res.data?.user) {
        // 🔑 store ONLY user object
        localStorage.setItem(
          "user",
          JSON.stringify(res.data.user)
        );

        // hard redirect to reset app state
        window.location.href = "/";
      } else {
        setError("Invalid username or password");
      }
    } catch (err) {
      console.error("LOGIN ERROR:", err);
      setError("Invalid username or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ width: 320, margin: "100px auto" }}>
      <h2>HR Login</h2>

      <input
        placeholder="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        autoComplete="username"
      />

      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        autoComplete="current-password"
      />

      <button onClick={login} disabled={loading}>
        {loading ? "Logging in..." : "Login"}
      </button>

      {error && (
        <p style={{ color: "red", marginTop: 10 }}>
          {error}
        </p>
      )}
    </div>
  );
}

export default Login;
