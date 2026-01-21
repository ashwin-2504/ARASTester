const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

export interface ApiOptions {
  requestId?: string;
  signal?: AbortSignal;
}

interface ApiResponse {
  [key: string]: any;
}

/**
 * Normalize response from PascalCase (backend) to camelCase (frontend)
 */
function normalizeResponse(data: any): any {
  if (!data || typeof data !== "object") return data;

  const normalized: ApiResponse = {};
  for (const [key, value] of Object.entries(data)) {
    // Convert first letter to lowercase
    const camelKey = key.charAt(0).toLowerCase() + key.slice(1);
    normalized[camelKey] = value;
  }
  return normalized;
}

export class ApiError extends Error {
  status?: number;
  response?: any;

  constructor(message: string, status?: number, response?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.response = response;
  }
}

/**
 * Core API Client for communicating with the backend
 */
export const apiClient = {
  // Store active abort controllers for cancellation
  _activeRequests: new Map<string, AbortController>(),

  /**
   * Cancel all active requests
   */
  cancelAll(): void {
    for (const [, controller] of this._activeRequests) {
      controller.abort();
    }
    this._activeRequests.clear();
  },

  /**
   * Cancel a specific request by ID
   * @param requestId - Request identifier
   */
  cancel(requestId: string): void {
    const controller = this._activeRequests.get(requestId);
    if (controller) {
      controller.abort();
      this._activeRequests.delete(requestId);
    }
  },

  /**
   * Perform a POST request
   * @param endpoint - API Endpoint (e.g. /api/aras/connect)
   * @param data - Payload data
   * @param options - Optional settings { requestId, signal }
   */
  async post<T = any>(endpoint: string, data: any, options: ApiOptions = {}): Promise<T> {
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
        throw new ApiError(
          result.message || result.Message || `HTTP ${response.status}`,
          response.status,
          result
        );
      }

      return normalizeResponse(result) as T;
    } finally {
      this._activeRequests.delete(requestId);
    }
  },

  /**
   * Perform a GET request
   * @param endpoint - API Endpoint
   * @param options - Optional settings { requestId, signal }
   */
  async get<T = any>(endpoint: string, options: ApiOptions = {}): Promise<T> {
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
        throw new ApiError(
          result.message || result.Message || `HTTP ${response.status}`,
          response.status,
          result
        );
      }

      return normalizeResponse(result) as T;
    } finally {
      this._activeRequests.delete(requestId);
    }
  },
};
