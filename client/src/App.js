import { useEffect, useState } from "react";

function App() {
  const [msg, setMsg] = useState("");

  useEffect(() => {
    fetch("/api")
      .then(res => res.text())
      .then(data => setMsg(data))
      .catch(err => console.log(err));
  }, []);

  return (
    <div style={{ padding: 40 }}>
      <h1>CRM Software</h1>
      <h2>{msg}</h2>
    </div>
  );
}

export default App;
