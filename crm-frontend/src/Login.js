import { useState } from "react";
import axios from "axios";
import API from "./api";

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const login = async () => {
    setError("");
    try {
      const res = await axios.post(`${API}/login`, {
        username,
        password,
      });

      // ✅ IMPORTANT FIX
      if (res.data.success) {
        localStorage.setItem(
          "user",
          JSON.stringify(res.data.user)
        );
        window.location.href = "/";
      } else {
        setError("Invalid Username or Password");
      }
    } catch (err) {
      setError("Invalid Username or Password");
    }
  };

  return (
    <div style={{ width: 320, margin: "100px auto" }}>
      <h2>HR Login</h2>

      <input
        placeholder="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />

      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <button onClick={login}>Login</button>

      {error && (
        <p style={{ color: "red", marginTop: 10 }}>{error}</p>
      )}
    </div>
  );
}

export default Login;
