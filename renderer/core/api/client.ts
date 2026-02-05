const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

export interface ApiOptions {
  requestId?: string;
  signal?: AbortSignal;
  sessionName?: string;
}

// Recursive type for JSON-compatible data
type JsonValue = string | number | boolean | null | JsonArray | JsonObject;
type JsonArray = Array<JsonValue>
interface JsonObject {
  [key: string]: JsonValue;
}

/**
 * Normalize response from PascalCase (backend) to camelCase (frontend)
 */
function normalizeResponse<T>(data: unknown): T {
  if (!data || typeof data !== "object") return data as T;

  if (Array.isArray(data)) {
    return data.map(item => normalizeResponse(item)) as unknown as T;
  }

  const normalized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
    // Convert first letter to lowercase
    const camelKey = key.charAt(0).toLowerCase() + key.slice(1);
    
    // Recursive normalization for nested objects
    if (typeof value === 'object' && value !== null) {
      normalized[camelKey] = normalizeResponse(value);
    } else {
      normalized[camelKey] = value;
    }
  }
  return normalized as T;
}

export class ApiError extends Error {
  status?: number;
  response?: unknown;

  constructor(message: string, status?: number, response?: unknown) {
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
      try {
        controller.abort();
      } catch (e) {
        // Ignore abort errors
      }
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
      try {
        controller.abort();
      } catch (e) {
        // Ignore abort errors
      }
      this._activeRequests.delete(requestId);
    }
  },

  /**
   * Helper: Wait for a specified duration (ms)
   */
  async _wait(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  },

  /**
   * Helper: Fetch with retry logic for network errors
   */
  async _fetchWithRetry(url: string, options: RequestInit, retries = 5, backoff = 200): Promise<Response> {
    try {
      const response = await fetch(url, options);

      // Retry on 503 Service Unavailable (often means backend is starting)
      if (response.status === 503 && retries > 0) {
        await this._wait(backoff);
        return this._fetchWithRetry(url, options, retries - 1, backoff * 2);
      }

      return response;
    } catch (error: unknown) {
      const err = error as Error;
      // Retry on network errors (fetch failed completely)
      if (retries > 0 && (err.message?.includes("Failed to fetch") || err.name === "TypeError")) {
        await this._wait(backoff);
        return this._fetchWithRetry(url, options, retries - 1, backoff * 2);
      }
      throw error;
    }
  },

  /**
   * Perform a POST request
   * @param endpoint - API Endpoint (e.g. /api/aras/connect)
   * @param data - Payload data
   * @param options - Optional settings { requestId, signal }
   */
  async post<T>(endpoint: string, data: unknown, options: ApiOptions = {}): Promise<T> {
    const controller = new AbortController();
    const requestId = options.requestId || `post-${endpoint}-${Date.now()}`;

    // Allow external signal to abort
    if (options.signal) {
      options.signal.addEventListener("abort", () => controller.abort());
    }

    this._activeRequests.set(requestId, controller);

    try {
      const response = await this._fetchWithRetry(
        `${API_BASE}${endpoint}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(options.sessionName ? { "X-Session-Name": options.sessionName } : {}),
          },
          body: JSON.stringify(data),
          credentials: "include",
          signal: controller.signal,
        }
      );

      const result = await response.json();

      // Check for HTTP errors
      if (!response.ok) {
        throw new ApiError(
          (result).message || (result).Message || `HTTP ${response.status}`,
          response.status,
          result
        );
      }

      return normalizeResponse<T>(result);
    } finally {
      this._activeRequests.delete(requestId);
    }
  },

  /**
   * Perform a GET request
   * @param endpoint - API Endpoint
   * @param options - Optional settings { requestId, signal }
   */
  async get<T>(endpoint: string, options: ApiOptions = {}): Promise<T> {
    const controller = new AbortController();
    const requestId = options.requestId || `get-${endpoint}-${Date.now()}`;

    if (options.signal) {
      options.signal.addEventListener("abort", () => controller.abort());
    }

    this._activeRequests.set(requestId, controller);

    try {
      const response = await this._fetchWithRetry(
        `${API_BASE}${endpoint}`,
        {
          headers: {
            ...(options.sessionName ? { "X-Session-Name": options.sessionName } : {}),
          },
          credentials: "include",
          signal: controller.signal,
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new ApiError(
          (result).message || (result).Message || `HTTP ${response.status}`,
          response.status,
          result
        );
      }

      return normalizeResponse<T>(result);
    } finally {
      this._activeRequests.delete(requestId);
    }
  },
};

