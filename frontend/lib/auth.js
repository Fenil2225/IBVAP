export function saveAuth(data) {
  if (typeof window === "undefined") return;
  if (data?.access_token) {
    localStorage.setItem("access_token", data.access_token);
  }
  if (data?.user) {
    localStorage.setItem("user", JSON.stringify(data.user));
  }
}

export function getToken() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("access_token");
}

export function getUser() {
  if (typeof window === "undefined") return null;
  try {
    const user = localStorage.getItem("user");
    return user ? JSON.parse(user) : null;
  } catch {
    return null;
  }
}

export function clearAuth() {
  if (typeof window === "undefined") return;
  localStorage.removeItem("access_token");
  localStorage.removeItem("user");
}

export function logout() {
  clearAuth();
  if (typeof window !== "undefined") {
    window.location.href = "/login";
  }
}

export function isAuthenticated() {
  return !!getToken();
}