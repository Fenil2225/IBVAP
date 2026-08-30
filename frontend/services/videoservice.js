import { apiRequest } from "../lib/api";

export async function getVideos() {
  return await apiRequest("/api/videos/");
}

export async function getVideo(id) {
  return await apiRequest(`/api/videos/${id}`);
}

export async function uploadVideo(cameraId, file) {
  const formData = new FormData();
  formData.append("file", file);

  return await apiRequest(`/api/videos/upload?camera_id=${cameraId}`, {
    method: "POST",
    body: formData,
  });
}

export async function processVideo(videoId) {
  return await apiRequest(`/api/videos/${videoId}/process`, {
    method: "POST",
  });
}
