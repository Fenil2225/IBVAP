import { apiRequest, getApiBaseUrl } from "../lib/api";

export async function getCameras() {
  return await apiRequest("/api/cameras");
}

export async function getCamera(id) {
  return await apiRequest(`/api/cameras/${id}`);
}

export async function createCamera(cameraData) {
  return await apiRequest("/api/cameras", {
    method: "POST",
    body: JSON.stringify(cameraData),
  });
}

export async function updateCameraStatus(id, status) {
  return await apiRequest(`/api/cameras/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export async function getCameraStatus(id) {
  return await apiRequest(`/api/cameras/${id}/status`);
}

export function getLiveStreamUrl(cameraId) {
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("access_token")
      : null;
  const baseUrl = getApiBaseUrl();
  return `${baseUrl}/api/live/cameras/${cameraId}/stream${token ? `?token=${token}` : ""}`;
}