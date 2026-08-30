export const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5000";

export function getApiBaseUrl() {
  return API_URL;
}

export function getFileUrl(filePath) {
  if (!filePath) return "";
  if (filePath.startsWith("http://") || filePath.startsWith("https://")) {
    return filePath;
  }
  // Normalize windows backslashes
  const cleanPath = filePath.replace(/\\/g, "/");
  const normalized = cleanPath.startsWith("/") ? cleanPath : `/${cleanPath}`;
  return `${API_URL}${normalized}`;
}

export async function apiRequest(endpoint, options = {}) {
  const token =
    typeof window !== "undefined"
      ? localStorage.getItem("access_token")
      : null;

  const isFormData = options.body instanceof FormData;

  const headers = {
    ...(!isFormData && { "Content-Type": "application/json" }),
    ...options.headers,
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const normalizedEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;

  try {
    const response = await fetch(`${API_URL}${normalizedEndpoint}`, {
      ...options,
      headers,
    });

    // If 204 No Content
    if (response.status === 204) {
      return null;
    }

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const errorMsg =
        (Array.isArray(data.detail) ? data.detail.map((e) => e.msg || e).join(", ") : data.detail) ||
        data.message ||
        `Request failed with status ${response.status}`;
      throw new Error(errorMsg);
    }

    return data;
  } catch (error) {
    if (error.name === "TypeError" && error.message.includes("fetch")) {
      throw new Error(`Unable to connect to IBVAP backend (${API_URL}). Please verify backend server is running.`);
    }
    throw error;
  }
}