import axios from "axios";

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:5000/api",
  timeout: 10000,
});

api.interceptors.request.use((config) => {
  try {
    const raw = localStorage.getItem("lumina.auth");

    if (raw) {
      const {token} = JSON.parse(raw);

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
  } catch {
    // Ignore malformed storage
  }

  return config;
});

export const isBackendConfigured =
    Boolean(process.env.REACT_APP_API_URL);

export default api;