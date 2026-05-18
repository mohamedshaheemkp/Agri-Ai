// Global Backend Configuration
// Use Vite env override when available:
//   VITE_API_BASE_URL=http://localhost:8000/api
// Fallbacks:
// - Dev: use Vite proxy (/api)
// - Non-dev: call backend directly on localhost

const ENV_BASE = (import.meta.env.VITE_API_BASE_URL || "").trim();
const FALLBACK_BASE = import.meta.env.DEV ? "/api" : "http://localhost:8000/api";

export const API_BASE_URL = (ENV_BASE || FALLBACK_BASE).replace(/\/+$/, "");

export const buildApiUrl = (path = "") => {
    const normalizedPath = path.startsWith("/") ? path : `/${path}`;
    return `${API_BASE_URL}${normalizedPath}`;
};
