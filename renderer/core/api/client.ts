const DEFAULT_API_BASE = "http://localhost:5000";
let resolvedApiBase: string | null = null;
let pendingApiBaseResolution: Promise<string> | null = null;

export interface ApiOptions {
  requestId?: string;
  requestPrefix?: string;
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
   * Cancel active requests whose id starts with a prefix
   * @param prefix - Request id prefix
   */
  cancelByPrefix(prefix: string): void {
    if (!prefix) return;
    for (const [requestId, controller] of this._activeRequests) {
      if (!requestId.startsWith(prefix)) continue;
      try {
        controller.abort();
      } catch (_e) {
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

  async _getApiBase(): Promise<string> {
    if (resolvedApiBase) {
      return resolvedApiBase;
    }

    if (pendingApiBaseResolution) {
      return pendingApiBaseResolution;
    }

    pendingApiBaseResolution = (async () => {
      const configured = import.meta.env.VITE_API_URL;
      if (configured) {
        resolvedApiBase = configured;
        return configured;
      }

      try {
        if (typeof window !== "undefined" && window.api?.getRuntimeConfig) {
          const runtimeConfig = await window.api.getRuntimeConfig();
          if (runtimeConfig?.apiBaseUrl) {
            resolvedApiBase = runtimeConfig.apiBaseUrl;
            return runtimeConfig.apiBaseUrl;
          }
        }
      } catch (_e) {
        // Fall through to default when runtime config is unavailable.
      }

      resolvedApiBase = DEFAULT_API_BASE;
      return DEFAULT_API_BASE;
    })();

    const base = await pendingApiBaseResolution;
    pendingApiBaseResolution = null;
    return base;
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

  async _parseResponseBody(response: Response): Promise<unknown> {
    const raw = await response.text();
    if (!raw.trim()) {
      return null;
    }

    const contentType = response.headers.get("content-type")?.toLowerCase() || "";
    const isJson =
      contentType.includes("application/json") ||
      contentType.includes("+json");

    if (isJson) {
      try {
        return JSON.parse(raw);
      } catch (_e) {
        // Fall through to raw text so callers preserve HTTP-level details.
        return raw;
      }
    }

    return raw;
  },

  _extractErrorMessage(status: number, statusText: string, result: unknown): string {
    if (result && typeof result === "object") {
      const candidate = result as { message?: unknown; Message?: unknown; title?: unknown; Title?: unknown };
      const message =
        (typeof candidate.message === "string" && candidate.message) ||
        (typeof candidate.Message === "string" && candidate.Message) ||
        (typeof candidate.title === "string" && candidate.title) ||
        (typeof candidate.Title === "string" && candidate.Title);
      if (message) return message;
    }

    if (typeof result === "string" && result.trim()) {
      return result.trim().slice(0, 300);
    }

    return statusText || `HTTP ${status}`;
  },

  /**
   * Perform a POST request
   * @param endpoint - API Endpoint (e.g. /api/aras/connect)
   * @param data - Payload data
   * @param options - Optional settings { requestId, signal }
   */
  async post<T>(endpoint: string, data: unknown, options: ApiOptions = {}): Promise<T> {
    const controller = new AbortController();
    const requestId = options.requestId || `${options.requestPrefix || ""}post-${endpoint}-${Date.now()}`;
    let onAbort: (() => void) | undefined;

    // Allow external signal to abort
    if (options.signal) {
      onAbort = () => controller.abort();
      options.signal.addEventListener("abort", onAbort, { once: true });
    }

    this._activeRequests.set(requestId, controller);

    try {
      const apiBase = await this._getApiBase();
      const response = await this._fetchWithRetry(
        `${apiBase}${endpoint}`,
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

      const result = await this._parseResponseBody(response);

      // Check for HTTP errors
      if (!response.ok) {
        throw new ApiError(
          this._extractErrorMessage(response.status, response.statusText, result),
          response.status,
          result
        );
      }

      return normalizeResponse<T>(result as T);
    } finally {
      if (options.signal && onAbort) {
        options.signal.removeEventListener("abort", onAbort);
      }
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
    const requestId = options.requestId || `${options.requestPrefix || ""}get-${endpoint}-${Date.now()}`;
    let onAbort: (() => void) | undefined;

    if (options.signal) {
      onAbort = () => controller.abort();
      options.signal.addEventListener("abort", onAbort, { once: true });
    }

    this._activeRequests.set(requestId, controller);

    try {
      const apiBase = await this._getApiBase();
      const response = await this._fetchWithRetry(
        `${apiBase}${endpoint}`,
        {
          headers: {
            ...(options.sessionName ? { "X-Session-Name": options.sessionName } : {}),
          },
          credentials: "include",
          signal: controller.signal,
        }
      );

      const result = await this._parseResponseBody(response);

      if (!response.ok) {
        throw new ApiError(
          this._extractErrorMessage(response.status, response.statusText, result),
          response.status,
          result
        );
      }

      return normalizeResponse<T>(result as T);
    } finally {
      if (options.signal && onAbort) {
        options.signal.removeEventListener("abort", onAbort);
      }
      this._activeRequests.delete(requestId);
    }
  },
};

