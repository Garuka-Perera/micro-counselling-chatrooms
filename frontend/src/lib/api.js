const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export function getToken() {
  return localStorage.getItem("token");
}

export function getStoredUser() {
  try {
    const raw = localStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function saveAuth(authData) {
  localStorage.setItem("token", authData.token);
  localStorage.setItem("user", JSON.stringify(authData.user));
}

export function clearAuth() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
}

export async function apiRequest(path, options = {}) {
  const token = getToken();

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || "Request failed");
  }

  return data;
}

export async function userSignup(payload) {
  return apiRequest("/auth/user/signup", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function userLogin(payload) {
  return apiRequest("/auth/user/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function listenerSignup(payload) {
  return apiRequest("/auth/listener/signup", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function listenerLogin(payload) {
  return apiRequest("/auth/listener/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function adminLogin(payload) {
  return apiRequest("/auth/admin/login", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function seedAdmin() {
  return apiRequest("/admin/seed-admin", {
    method: "POST",
  });
}

export async function getListeners() {
  return apiRequest("/admin/listeners");
}

export async function approveListener(listenerId) {
  return apiRequest(`/admin/listeners/${listenerId}/approve`, {
    method: "PATCH",
  });
}

export async function rejectListener(listenerId) {
  return apiRequest(`/admin/listeners/${listenerId}/reject`, {
    method: "PATCH",
  });
}

export async function getReports() {
  return apiRequest("/admin/reports");
}

export async function getFeedbackList() {
  return apiRequest("/admin/feedback");
}

export async function getMySessions() {
  return apiRequest("/chat/sessions/my");
}

export async function getSessionMessages(sessionId) {
  return apiRequest(`/chat/sessions/${sessionId}/messages`);
}

export async function endSessionHttp(sessionId) {
  return apiRequest(`/chat/sessions/${sessionId}/end`, {
    method: "POST",
  });
}

export async function submitFeedback(sessionId, payload) {
  return apiRequest(`/chat/sessions/${sessionId}/feedback`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function submitReport(sessionId, payload) {
  return apiRequest(`/chat/sessions/${sessionId}/report`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}