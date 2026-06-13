const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL || "http://localhost:5000/api";

function normalizeApiMessage(message) {
  return String(message || "").trim() || "Request failed.";
}

async function parseResponse(response) {
  const text = await response.text();
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return {};
  }
}

export async function apiRequest(path, options = {}) {
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers,
    });
    const data = await parseResponse(response);

    if (!response.ok) {
      const apiError = new Error(normalizeApiMessage(data.message));
      apiError.isApiError = true;
      throw apiError;
    }

    return data;
  } catch (error) {
    if (error?.isApiError) {
      throw error;
    }
    throw new Error("Unable to reach server. Please try again.");
  }
}

export function authHeaders(token) {
  return token
    ? {
        Authorization: `Bearer ${token}`,
      }
    : {};
}

export { API_BASE_URL };
