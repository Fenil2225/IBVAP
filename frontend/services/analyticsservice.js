import { apiRequest } from "../lib/api";

export async function getDashboardSummary() {
  return await apiRequest("/api/dashboard/summary");
}

export async function getAnalyticsSummary() {
  return await apiRequest("/api/analytics/summary");
}

export async function getDetectionStatistics() {
  return await apiRequest("/api/analytics/detections");
}

export async function getAlertStatistics() {
  return await apiRequest("/api/analytics/alerts");
}

export async function getRecentDetections() {
  return await apiRequest("/api/analytics/recent-detections");
}

export async function getRecentAlerts() {
  return await apiRequest("/api/analytics/recent-alerts");
}
