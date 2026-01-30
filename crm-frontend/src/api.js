import axios from "axios";

const api = axios.create({
  baseURL: "https://crm-software-production-d8f3.up.railway.app",
});

export default api;
