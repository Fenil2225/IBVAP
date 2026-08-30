import { apiRequest } from "../lib/api";

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