# VISION API Documentation & Interface Specification

The VISION backend is built with FastAPI and runs by default at `http://localhost:8000`. Interactive OpenAPI documentation is accessible at `/docs` (Swagger UI) and `/redoc`.

---

## 1. System Endpoints

### `GET /`
- **Description**: Service identity and active configuration metadata.
- **Response**:
```json
{
  "project": "VISION: Vital Intelligence for System Integrity, Observation & Nostics",
  "description": "FastAPI ML Prognostics & 3D Digital Twin Engine",
  "version": "1.0.0",
  "docs": "/docs",
  "health": "/api/health",
  "default_subset": "FD001"
}
```

### `GET /api/health`
- **Description**: Model memory readiness, pre-warm status, and inference engine health.
- **Response**:
```json
{
  "status": "healthy",
  "warmed_subsets": ["FD001"],
  "model_ready": true,
  "inference_latency_p95_ms": 12.4
}
```

---

## 2. Fleet Overview & Dispatch Routes

### `GET /api/fleet/overview`
- **Description**: Comprehensive overview of all aircraft engines in the active dataset subset.
- **Query Parameters**:
  - `subset` (string, optional, default: `"FD001"`): Target C-MAPSS dataset (`FD001` to `FD004`).
- **Response**:
  - Array of fleet engine summaries containing `unit_id`, `current_cycle`, `predicted_rul`, `conformal_lower_bound_90`, `conformal_upper_bound_90`, `risk_tier` (`NORMAL`, `ADVISORY`, `CRITICAL`), and `maintenance_urgency`.

### `GET /api/fleet/etops`
- **Description**: Evaluates engines against Extended-range Twin-engine Operational Performance Standards (ETOPS-180 / ETOPS-240) based on conservative conformal lower bounds.
- **Query Parameters**:
  - `subset` (string, optional, default: `"FD001"`)
  - `required_margin_cycles` (integer, optional, default: `30`)

---

## 3. Engine Telemetry & Physics Dossier Routes

### `GET /api/engine/{unit_id}`
- **Description**: Detailed telemetry, operational history, and latest conformal RUL assessment for a specific engine.
- **Path Parameters**:
  - `unit_id` (integer, required): Engine identifier (e.g. `1` to `100`).
- **Query Parameters**:
  - `subset` (string, optional, default: `"FD001"`)

### `GET /api/engine/{unit_id}/replay`
- **Description**: Full historical cycle progression of sensor readings for temporal playback and degradation simulation.
- **Path Parameters**:
  - `unit_id` (integer, required)

### `GET /api/engine/{unit_id}/physical-dossier`
- **Description**: Detailed physical degradation tracking including turbine blade thermal margin, isentropic efficiency degradation, compressor fouling, and soot accumulation index.
- **Path Parameters**:
  - `unit_id` (integer, required)

### `POST /api/engine/{unit_id}/water-wash`
- **Description**: Simulates the aerothermal performance recovery of an engine compressor wash, restoring up to 85% of recoverable compressor efficiency loss.
- **Path Parameters**:
  - `unit_id` (integer, required)
- **Response**:
```json
{
  "unit_id": 34,
  "status": "wash_completed",
  "efficiency_recovered_pct": 3.2,
  "egt_margin_recovered_degC": 14.5,
  "cycles_extension_granted": 18
}
```

---

## 4. Prognostic Inference & Decision Optimization

### `POST /api/predict/rul`
- **Description**: Generates conformal prediction interval for arbitrary raw or normalized sensor telemetry input.
- **Request Body**:
```json
{
  "subset": "FD001",
  "unit_id": 34,
  "cycle": 140,
  "sensors": {
    "s2": 642.5,
    "s3": 1588.2,
    "s4": 1405.1,
    "s7": 553.8,
    "s8": 2388.1,
    "s9": 9055.2,
    "s11": 47.4,
    "s12": 521.6,
    "s13": 2388.08,
    "s14": 8132.4,
    "s15": 8.44,
    "s17": 392,
    "s20": 38.8,
    "s21": 23.3
  }
}
```
- **Response**:
```json
{
  "point_estimate_rul": 42.1,
  "conformal_lower_bound_90": 31.8,
  "conformal_upper_bound_90": 53.4,
  "coverage_level": 0.90,
  "operating_regime_bin": 2
}
```

### `POST /api/decision/optimize`
- **Description**: Calculates the optimal stopping policy and economic expected savings comparing Run-to-Failure, Periodic Maintenance, and VISION Conformal Maintenance.
- **Request Body**:
```json
{
  "replacement_cost_cr": 100000,
  "unplanned_failure_cost_cu": 500000,
  "lead_time_cycles": 15,
  "target_risk_threshold": 0.05
}
```

### `GET /api/decision/policy`
- **Description**: Retrieves current active dispatch policy parameters and benchmark economic ratios.

---

## 5. Real-Time Streaming Telemetry

### `GET /api/stream/telemetry`
- **Description**: Server-Sent Events (SSE) endpoint providing streaming flight cycles for real-time dashboard simulation.
- **Headers**:
  - `Accept: text/event-stream`
- **Event Payload**:
```json
data: {"unit_id": 34, "cycle": 142, "n1": 2388.1, "n2": 9055.4, "t50": 642.8, "rul_pred": 38.2, "lb90": 29.5}
```
