import { apiRequest } from "../lib/api";

export async function getANPRDetections(videoId = null) {
  const suffix = videoId ? `?video_id=${encodeURIComponent(videoId)}` : "";
  return await apiRequest(`/api/anpr/${suffix}`);
}

export async function getANPRDetectionById(id) {
  return await apiRequest(`/api/anpr/${id}`);
}

export async function searchANPRPlate(plateNumber) {
  if (!plateNumber || !plateNumber.trim()) {
    return await getANPRDetections();
  }
  const cleanPlate = encodeURIComponent(plateNumber.trim().toUpperCase());
  return await apiRequest(`/api/anpr/search/${cleanPlate}`);
}
