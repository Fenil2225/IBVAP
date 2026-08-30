import { apiRequest } from "../lib/api";

export async function getCurrentUser() {
  return await apiRequest("/users/me");
}
