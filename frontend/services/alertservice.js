import { apiRequest } from "../lib/api";

export async function getAlerts() {
  return await apiRequest("/api/alerts/");
}

export async function getAlert(id) {
  return await apiRequest(`/api/alerts/${id}`);
}

export async function createAlert(alertData) {
  return await apiRequest("/api/alerts/", {
    method: "POST",
    body: JSON.stringify(alertData),
  });
}

export async function acknowledgeAlert(id) {
  return await apiRequest(`/api/alerts/${id}/acknowledge`, {
    method: "PATCH",
  });
}

export async function resolveAlert(id) {
  return await apiRequest(`/api/alerts/${id}/resolve`, {
    method: "PATCH",
  });
}
