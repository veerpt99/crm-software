// src/api.js
import axios from "axios";

const API_BASE_URL =
  process.env.NODE_ENV === "production"
    ? "https://crm-software-production-d8f3.up.railway.app"
    : "http://localhost:5000";

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// OPTIONAL: auto attach user (future-safe)
api.interceptors.request.use((config) => {
  const user = JSON.parse(localStorage.getItem("user"));
  if (user?.id) {
    config.headers["x-user-id"] = user.id;
  }
  return config;
});

export default api;
