export function saveAuth(data) {
  localStorage.setItem("access_token", data.access_token);

  if (data.user) {
    localStorage.setItem("user", JSON.stringify(data.user));
  }
}

export function getToken() {
  if (typeof window === "undefined") {
    return null;
  }

  return localStorage.getItem("access_token");
}

export function getUser() {
  if (typeof window === "undefined") {
    return null;
  }

  const user = localStorage.getItem("user");

  return user ? JSON.parse(user) : null;
}

export function logout() {
  localStorage.removeItem("access_token");
  localStorage.removeItem("user");

  window.location.href = "/login";
}

export function isAuthenticated() {
  return !!getToken();
}