import { apiRequest } from "../lib/api";

export async function getRecentDetections() {
  return await apiRequest("/api/analytics/recent-detections");
}

export async function getDetectionStats() {
  return await apiRequest("/api/analytics/detections");
}
