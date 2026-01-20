const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

/**
 * Normalize response from PascalCase (backend) to camelCase (frontend)
 */
function normalizeResponse(data) {
  if (!data || typeof data !== "object") return data;

  const normalized = {};
  for (const [key, value] of Object.entries(data)) {
    // Convert first letter to lowercase
    const camelKey = key.charAt(0).toLowerCase() + key.slice(1);
    normalized[camelKey] = value;
  }
  return normalized;
}

/**
 * Core API Client for communicating with the backend
 */
export const apiClient = {
  // Store active abort controllers for cancellation
  _activeRequests: new Map(),

  /**
   * Cancel all active requests
   */
  cancelAll() {
    for (const [, controller] of this._activeRequests) {
      controller.abort();
    }
    this._activeRequests.clear();
  },

  /**
   * Cancel a specific request by ID
   * @param {string} requestId - Request identifier
   */
  cancel(requestId) {
    const controller = this._activeRequests.get(requestId);
    if (controller) {
      controller.abort();
      this._activeRequests.delete(requestId);
    }
  },

  /**
   * Perform a POST request
   * @param {string} endpoint - API Endpoint (e.g. /api/aras/connect)
   * @param {Object} data - Payload data
   * @param {Object} options - Optional settings { requestId, signal }
   * @returns {Promise<any>}
   */
  async post(endpoint, data, options = {}) {
    const controller = new AbortController();
    const requestId = options.requestId || `post-${endpoint}-${Date.now()}`;

    // Allow external signal to abort
    if (options.signal) {
      options.signal.addEventListener("abort", () => controller.abort());
    }

    this._activeRequests.set(requestId, controller);

    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
        signal: controller.signal,
      });

      const result = await response.json();

      // Check for HTTP errors
      if (!response.ok) {
        const error = new Error(
          result.message || result.Message || `HTTP ${response.status}`,
        );
        error.status = response.status;
        error.response = result;
        throw error;
      }

      return normalizeResponse(result);
    } finally {
      this._activeRequests.delete(requestId);
    }
  },

  /**
   * Perform a GET request
   * @param {string} endpoint - API Endpoint
   * @param {Object} options - Optional settings { requestId, signal }
   * @returns {Promise<any>}
   */
  async get(endpoint, options = {}) {
    const controller = new AbortController();
    const requestId = options.requestId || `get-${endpoint}-${Date.now()}`;

    if (options.signal) {
      options.signal.addEventListener("abort", () => controller.abort());
    }

    this._activeRequests.set(requestId, controller);

    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        credentials: "include",
        signal: controller.signal,
      });

      const result = await response.json();

      if (!response.ok) {
        const error = new Error(
          result.message || result.Message || `HTTP ${response.status}`,
        );
        error.status = response.status;
        error.response = result;
        throw error;
      }

      return normalizeResponse(result);
    } finally {
      this._activeRequests.delete(requestId);
    }
  },
};
