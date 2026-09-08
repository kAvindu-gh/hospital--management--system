//backend API URL
const API_BASE_URL = "http://localhost:8000";

function saveToken(token) { localStorage.setItem("hms_token", token); }
function getToken() { return localStorage.getItem("hms_token"); }
function clearToken() { localStorage.removeItem("hms_token"); }

async function apiFetch(path, options = {}) {
  const token = getToken();
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return fetch(`${API_BASE_URL}${path}`, { ...options, headers });
}