import { useState } from "react";
import axios from "axios";

function Login() {
  const [username,setUsername]=useState("");
  const [password,setPassword]=useState("");
  const [error,setError]=useState("");

  const login = async () => {
    try{
      const res = await axios.post(
  "https://crm-software-production-d8f3.up.railway.app/login",
  { username, password }
);

      localStorage.setItem("user",JSON.stringify(res.data));
      window.location.href="/";
    }catch{
      setError("Invalid Username or Password");
    }
  };

  return (
    <div style={{width:300,margin:"100px auto"}}>
      <h2>HR Login</h2>

      <input placeholder="Username" value={username} onChange={e=>setUsername(e.target.value)} />
      <input type="password" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} />

      <button onClick={login}>Login</button>

      {error && <p style={{color:"red"}}>{error}</p>}
    </div>
  );
}

export default Login;
