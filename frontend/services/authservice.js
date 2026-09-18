import { apiRequest } from "../lib/api";
import { saveAuth } from "../lib/auth";

export async function loginUser(email, password) {
  const data = await apiRequest("/api/auth/login", {
    method: "POST",

    body: JSON.stringify({
      email,
      password,
    }),
  });

  saveAuth(data);

  return data;
}

export async function getCurrentUser() {
  return await apiRequest("/users/me");
}

