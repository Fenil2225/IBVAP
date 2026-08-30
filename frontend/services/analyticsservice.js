import { apiRequest } from "../lib/api";

export function getDashboardSummary() {
	return apiRequest("/api/dashboard/summary");
}

export function getAnalyticsSummary() {
	return apiRequest("/api/analytics/summary");
}

export function getRecentDetections() {
	return apiRequest("/api/analytics/recent-detections");
}

export function getRecentAlerts() {
	return apiRequest("/api/analytics/recent-alerts");
}
