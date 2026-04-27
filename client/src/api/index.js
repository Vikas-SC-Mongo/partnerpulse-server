// In dev: proxied to localhost:3001 via vite
// In production: set VITE_API_URL=https://your-backend.railway.app
const BASE = (import.meta.env.VITE_API_URL || "") + "/api";

function authHeaders(extra = {}) {
  const token = sessionStorage.getItem("pp_token") || "";
  return { ...extra, ...(token ? { "Authorization": `Bearer ${token}` } : {}) };
}

async function req(path, opts = {}) {
  const res = await fetch(BASE + path, {
    ...opts,
    headers: authHeaders(opts.headers || {}),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || "Request failed");
  }
  return res.json();
}

// Dashboard
export const getDashboard  = (week) => req(`/dashboard${week ? `?week=${week}` : ""}`);

// History
export const getPartnerHistory = (name) => req(`/history/${encodeURIComponent(name)}`);
export const getTeamHistory    = ()      => req("/history/team/summary");

// Opportunities
export const getOpportunities  = (filters = {}) => {
  const q = new URLSearchParams(filters).toString();
  return req(`/opportunities${q ? `?${q}` : ""}`);
};
export const updateOpportunity = (id, data) => req(`/opportunities/${id}`, {
  method: "PATCH",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(data),
});

// Upload
export const uploadFile = (file) => {
  const fd = new FormData();
  fd.append("file", file);
  return req("/upload", { method: "POST", body: fd });
};
export const uploadFolder = (files) => {
  const fd = new FormData();
  files.forEach(f => fd.append("files", f));
  return req("/upload/folder", { method: "POST", body: fd });
};

// Upload log
export const getUploadLog = () => req("/uploads");

// Health
export const getHealth = () => req("/health");
