// api.js
const API =
  process.env.NODE_ENV === "production"
    ? "https://crm-software-production-d8f3.up.railway.app"
    : "http://localhost:5000";

export default API;
