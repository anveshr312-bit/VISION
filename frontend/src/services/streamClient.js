/**
 * VISION: Real-Time SSE Telemetry Stream Client
 * Vital Intelligence for System Integrity, Observation & Nostics
 *
 * Connects to the FastAPI backend SSE endpoint `/api/stream/telemetry`.
 * Dispatches streamed cycle ticks, sensor readings, and updated RUL predictions.
 */

const API_BASE_URL = import.meta.env?.VITE_API_URL || 'http://127.0.0.1:8000/api';

export class TelemetryStreamClient {
  constructor({
    units = [1, 10, 24, 34, 45],
    subset = 'FD001',
    speed = 1.0,
    onCycleUpdate = null,
    onStatusChange = null,
    onError = null,
  } = {}) {
    this.units = units;
    this.subset = subset;
    this.speed = speed;
    this.onCycleUpdate = onCycleUpdate;
    this.onStatusChange = onStatusChange;
    this.onError = onError;

    this.eventSource = null;
    this.isConnected = false;
  }

  /**
   * Start or resume SSE connection
   */
  connect() {
    if (this.eventSource) {
      this.disconnect();
    }

    const unitsParam = this.units.join(',');
    const url = `${API_BASE_URL}/stream/telemetry?units=${unitsParam}&subset=${this.subset}&speed=${this.speed}&loop=true`;

    try {
      this.eventSource = new EventSource(url);

      this.eventSource.onopen = () => {
        this.isConnected = true;
        if (this.onStatusChange) this.onStatusChange({ connected: true, streaming: true });
      };

      this.eventSource.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.event === 'cycle_update' && this.onCycleUpdate) {
            this.onCycleUpdate(payload);
          } else if (payload.event === 'stream_loop_reset') {
            if (this.onStatusChange) this.onStatusChange({ reset: true });
          }
        } catch (err) {
          console.warn('[VISION SSE] Failed to parse message chunk:', err);
        }
      };

      this.eventSource.onerror = (err) => {
        console.warn('[VISION SSE] Connection error or server closed stream:', err);
        this.isConnected = false;
        if (this.onError) this.onError(err);
        if (this.onStatusChange) this.onStatusChange({ connected: false, streaming: false });
      };
    } catch (e) {
      console.error('[VISION SSE] EventSource constructor failed:', e);
      if (this.onError) this.onError(e);
    }
  }

  /**
   * Disconnect and close event source stream
   */
  disconnect() {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
      this.isConnected = false;
      if (this.onStatusChange) this.onStatusChange({ connected: false, streaming: false });
    }
  }

  /**
   * Change streaming playback speed multiplier
   */
  setSpeed(newSpeed) {
    this.speed = newSpeed;
    if (this.isConnected) {
      this.connect(); // Reconnect with new speed param
    }
  }

  /**
   * Update active cohort units
   */
  setUnits(newUnits) {
    this.units = newUnits;
    if (this.isConnected) {
      this.connect();
    }
  }
}

export default TelemetryStreamClient;

