// API Configuration
// Uses environment variable if available, otherwise defaults to localhost
const API = process.env.REACT_APP_API_URL || "http://localhost:5000";

export default API;
