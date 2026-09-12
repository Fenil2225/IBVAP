import { apiRequest } from "../lib/api";

export async function getZones() {
  return await apiRequest("/api/zones");
}

export async function createZone(zone) {
  return await apiRequest("/api/zones", {
    method: "POST",
    body: JSON.stringify(zone),
  });
}

export async function updateZone(id, zone) {
  return await apiRequest(`/api/zones/${id}`, {
    method: "PUT",
    body: JSON.stringify(zone),
  });
}

export async function deleteZone(id) {
  return await apiRequest(`/api/zones/${id}`, { method: "DELETE" });
}
