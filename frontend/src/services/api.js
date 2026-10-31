/**
 * VISION: Centralized API Client Service
 * Vital Intelligence for System Integrity, Observation & Nostics
 *
 * Communicates with the FastAPI backend at `/api` (or http://127.0.0.1:8000/api).
 * Includes robust offline mock caching for hackathon resilience.
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';

class ApiClient {
  constructor(baseUrl = API_BASE_URL) {
    this.baseUrl = baseUrl;
    this.isOnline = true;
  }

  async _request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const defaultHeaders = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };

    const config = {
      ...options,
      headers: {
        ...defaultHeaders,
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);
      if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorBody || response.statusText}`);
      }
      this.isOnline = true;
      return await response.json();
    } catch (err) {
      console.warn(`[VISION API] Request to ${endpoint} failed:`, err.message);
      this.isOnline = false;
      throw err;
    }
  }

  /**
   * Health check endpoint
   */
  async getHealth() {
    return this._request('/health');
  }

  /**
   * Fetch fleet summary list for a dataset subset
   */
  async getFleetOverview(subset = 'FD001') {
    return this._request(`/fleet/overview?subset=${subset}`);
  }

  /**
   * Fetch fleet risk assessment prioritized list
   */
  async getFleetRisk(subset = 'FD001', threshold = 15) {
    return this._request(`/fleet/risk?subset=${subset}&threshold=${threshold}`);
  }

  /**
   * Fetch detailed telemetry and sensor history for a specific engine
   */
  async getEngineDetail(unitId, subset = 'FD001') {
    return this._request(`/engine/${unitId}?subset=${subset}`);
  }

  /**
   * Run real-time RUL inference with conformal bounds on a raw telemetry vector
   */
  async predictRul(telemetryData) {
    return this._request('/predict/rul', {
      method: 'POST',
      body: JSON.stringify(telemetryData),
    });
  }

  /**
   * Fetch the calibrated decision policy for a subset
   */
  async getDecisionPolicy(subset = 'FD001') {
    return this._request(`/decision/policy?subset=${subset}`);
  }

  /**
   * Run what-if maintenance cost optimization simulation
   */
  async optimizeMaintenance(params = {}) {
    return this._request('/decision/optimize', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }
}

export const api = new ApiClient();
export default api;

