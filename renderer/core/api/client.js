const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000'

/**
 * Core API Client for communicating with the backend
 */
export const apiClient = {
  /**
   * Perform a POST request
   * @param {string} endpoint - API Endpoint (e.g. /api/aras/connect)
   * @param {Object} data - Payload data
   * @returns {Promise<any>}
   */
  async post(endpoint, data) {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      credentials: 'include' // Send cookies (ARAS_SESSION_ID)
    })

    // Attempt to parse JSON, fall back to text if needed or throw
    const result = await response.json()
    return result
  },

  /**
   * Perform a GET request
   * @param {string} endpoint - API Endpoint
   * @returns {Promise<any>}
   */
  async get(endpoint) {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      credentials: 'include' // Send cookies
    })
    const result = await response.json()
    return result
  }
}
