/**
 * Minimal fetch wrapper with JSON parsing and error normalization.
 */

const DEFAULT_TIMEOUT_MS = 20000;

function buildUrl(baseUrl, path) {
  if (!baseUrl) return path;
  if (baseUrl.endsWith("/") && path.startsWith("/")) return baseUrl.slice(0, -1) + path;
  if (!baseUrl.endsWith("/") && !path.startsWith("/")) return baseUrl + "/" + path;
  return baseUrl + path;
}

async function withTimeout(promise, timeoutMs) {
  let timeoutId;
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => reject(new Error("Request timed out")), timeoutMs);
  });
  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    clearTimeout(timeoutId);
  }
}

async function parseJsonSafely(response) {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

// PUBLIC_INTERFACE
export function getApiBaseUrl() {
  /** Returns API base URL. Configure with REACT_APP_API_BASE_URL; falls back to same-origin. */
  return process.env.REACT_APP_API_BASE_URL || "";
}

// PUBLIC_INTERFACE
export function getAuthToken() {
  /** Returns the current auth token from localStorage. */
  return window.localStorage.getItem("qdms_token");
}

// PUBLIC_INTERFACE
export function setAuthToken(token) {
  /** Sets or clears the auth token in localStorage. */
  if (!token) window.localStorage.removeItem("qdms_token");
  else window.localStorage.setItem("qdms_token", token);
}

function buildHeaders(extraHeaders) {
  const token = getAuthToken();
  const headers = {
    "Content-Type": "application/json",
    ...(extraHeaders || {}),
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
}

// PUBLIC_INTERFACE
export async function httpRequest(path, { method = "GET", body, headers, timeoutMs } = {}) {
  /**
   * Performs an HTTP request to the backend.
   * Throws an Error with message and optional `status` and `data`.
   */
  const baseUrl = getApiBaseUrl();
  const url = buildUrl(baseUrl, path);

  const requestInit = {
    method,
    headers: buildHeaders(headers),
  };
  if (body !== undefined) requestInit.body = JSON.stringify(body);

  const res = await withTimeout(fetch(url, requestInit), timeoutMs || DEFAULT_TIMEOUT_MS);
  const data = await parseJsonSafely(res);

  if (!res.ok) {
    const err = new Error(
      typeof data === "string"
        ? data
        : (data && (data.message || data.error)) || `Request failed with status ${res.status}`
    );
    err.status = res.status;
    err.data = data;
    throw err;
  }

  return data;
}
