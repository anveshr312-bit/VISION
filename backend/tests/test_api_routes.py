"""
VISION: Integration & Unit Tests for FastAPI Route Controllers
Vital Intelligence for System Integrity, Observation & Nostics
"""

from __future__ import annotations

import json
import time
import pytest
from fastapi.testclient import TestClient

from backend.app.main import app

client = TestClient(app)


def test_health_check():
    """Verify health and readiness endpoint."""
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["ready"] is True
    assert "FD001" in data["loaded_subsets"]


def test_root_endpoint():
    """Verify root documentation and info endpoint."""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "VISION" in data["project"]
    assert data["docs"] == "/docs"


def test_fleet_overview_success():
    """Verify fleet overview returns risk-ranked engines."""
    response = client.get("/api/fleet/overview?subset=FD001")
    assert response.status_code == 200
    data = response.json()
    assert data["subset"] == "FD001"
    assert data["total_engines"] == 100
    assert len(data["engines"]) == 100
    assert "critical_count" in data
    assert "allocated_bays" in data

    # Check structure of the top-risk engine
    top_engine = data["engines"][0]
    assert "unit_id" in top_engine
    assert "current_cycle" in top_engine
    assert "predicted_rul" in top_engine
    assert "lower_bound_90" in top_engine
    assert "urgency_level" in top_engine
    assert top_engine["predicted_rul"] <= 125.0


def test_engine_detail_success():
    """Verify telemetry and sensor history retrieval for engine 1."""
    response = client.get("/api/engine/1?subset=FD001")
    assert response.status_code == 200
    data = response.json()
    assert data["unit_id"] == 1
    assert data["current_cycle"] > 0
    assert len(data["sensor_history"]) > 0
    assert "s2" in data["latest_sensors"]
    assert "s3" in data["latest_sensors"]


def test_engine_detail_not_found():
    """Verify 404 status when querying a non-existent engine ID."""
    response = client.get("/api/engine/9999?subset=FD001")
    assert response.status_code == 404
    data = response.json()
    assert "detail" in data
    assert "not found" in data["detail"].lower()


def test_engine_replay_trajectory():
    """Verify 3D digital twin replay trajectory frames."""
    response = client.get("/api/engine/1/replay?subset=FD001")
    assert response.status_code == 200
    data = response.json()
    assert data["unit_id"] == 1
    assert len(data["frames"]) > 0
    first_frame = data["frames"][0]
    assert "cycle" in first_frame
    assert "fan_speed" in first_frame
    assert "core_speed" in first_frame


def test_predict_rul_success():
    """Verify RUL inference and conformal bounds."""
    payload = {"unit_id": 1, "subset": "FD001"}
    response = client.post("/api/predict/rul", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["unit_id"] == 1
    assert data["rul_point_estimate"] <= 125.0
    assert len(data["conformal_interval_80"]) == 2
    assert len(data["conformal_interval_90"]) == 2
    assert len(data["conformal_interval_95"]) == 2
    assert data["lower_bound_90"] <= data["rul_point_estimate"]
    assert 0.0 <= data["health_index"] <= 100.0
    assert data["urgency_level"] in ("HEALTHY", "MONITOR", "CRITICAL")


def test_predict_rul_not_found():
    """Verify 404 when predicting RUL for non-existent unit."""
    payload = {"unit_id": 8888, "subset": "FD001"}
    response = client.post("/api/predict/rul", json=payload)
    assert response.status_code == 404
    assert "detail" in response.json()


def test_decision_optimize():
    """Verify economic decision optimization endpoint."""
    payload = {
        "subset": "FD001",
        "cost_failure": 100000.0,
        "cost_waste_per_cycle": 100.0,
        "lead_time": 15,
        "risk_budget_eps": 0.05,
    }
    response = client.post("/api/decision/optimize", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["subset"] == "FD001"
    assert "optimal_policy" in data
    assert len(data["recommendations"]) == 100
    first_rec = data["recommendations"][0]
    assert "urgency_level" in first_rec
    assert "recommended_cycle_action" in first_rec
    assert "cost_analysis" in first_rec


def test_decision_policy_get():
    """Verify decision policy curves retrieval."""
    response = client.get("/api/decision/policy?subset=FD001")
    assert response.status_code == 200
    data = response.json()
    assert "curves" in data
    assert "lower90" in data["curves"]
    assert len(data["curves"]["lower90"]) > 0


def test_endpoint_latency_benchmark():
    """Verify p95 response time is well below the 50ms requirement."""
    latencies = []
    for _ in range(10):
        t0 = time.perf_counter()
        resp = client.get("/api/fleet/overview?subset=FD001")
        latencies.append((time.perf_counter() - t0) * 1000.0)
        assert resp.status_code == 200

    p95_latency = sorted(latencies)[int(len(latencies) * 0.95)]
    print(f"\nFleet overview p95 latency: {p95_latency:.2f}ms")
    assert p95_latency < 50.0, f"Expected p95 latency < 50ms, got {p95_latency:.2f}ms"


def test_telemetry_demarcation_meta():
    """Verify scientific integrity and provenance demarcation metadata in responses."""
    # 1. Fleet overview
    resp_fleet = client.get("/api/fleet/overview?subset=FD001")
    assert resp_fleet.status_code == 200
    meta = resp_fleet.json().get("meta", {})
    assert meta.get("data_mode") == "EMPIRICAL_CMAPSS"
    assert meta.get("synthetic") is False
    assert "NASA" in meta.get("banner", "")

    # 2. Engine detail
    resp_engine = client.get("/api/engine/1?subset=FD001")
    assert resp_engine.status_code == 200
    assert resp_engine.json().get("meta", {}).get("data_mode") == "EMPIRICAL_CMAPSS"

    # 3. RUL prediction
    resp_pred = client.post("/api/predict/rul", json={"unit_id": 1, "subset": "FD001"})
    assert resp_pred.status_code == 200
    assert resp_pred.json().get("meta", {}).get("data_mode") == "EMPIRICAL_CMAPSS"


def test_stream_telemetry_endpoint():
    """Verify real-time Server-Sent Events (SSE) telemetry streaming replay."""
    with client.stream("GET", "/api/stream/telemetry?units=1&speed=10.0&loop=false") as response:
        assert response.status_code == 200
        assert "text/event-stream" in response.headers["content-type"]
        data_lines = []
        for line in response.iter_lines():
            if line and line.startswith("data:"):
                data_lines.append(line)
                if len(data_lines) >= 2:
                    break
        assert len(data_lines) >= 1
        payload = json.loads(data_lines[0][5:].strip())
        assert payload["event"] == "cycle_update"
        assert payload["unit_id"] == 1
        assert "cycle" in payload
        assert "sensors" in payload
        assert "rul_prediction" in payload
        assert "conformal_lower_90" in payload


def test_fleet_etops_pairings():
    """Verify Aircraft Twin-Engine ETOPS pairing board and asymmetry metrics."""
    response = client.get("/api/fleet/etops?subset=FD001")
    assert response.status_code == 200
    data = response.json()
    assert data["total_aircraft"] == 50
    assert "critical_aircraft_count" in data
    assert "asymmetric_risk_count" in data
    assert len(data["aircraft"]) == 50

    ac = data["aircraft"][0]
    assert "aircraft_id" in ac
    assert "tail_number" in ac
    assert "left_engine" in ac
    assert "right_engine" in ac
    assert "wing_rul_delta" in ac
    assert ac["etops_status"] in ["COMPLIANT", "ASYMMETRY_WARNING", "CRITICAL_GROUND", "CASCADE_PULL"]
    assert "cascade_enforcement" in ac
    assert "dual_engine_dispatch_cleared" in ac
    assert "economics" in ac


def test_engine_physical_dossier():
    """Verify non-sensor physical inspection dossier (LLP clock, oil metals, borescope)."""
    response = client.get("/api/engine/1/physical-dossier?subset=FD001")
    assert response.status_code == 200
    data = response.json()
    assert data["unit_id"] == 1
    assert "llp_regulatory_clock" in data
    assert data["llp_regulatory_clock"]["hard_limit_cycles"] == 15000
    assert "oil_spectrometry" in data
    assert data["oil_spectrometry"]["iron_fe_ppm"] > 0
    assert "borescope_inspection" in data
    assert len(data["borescope_inspection"]["findings"]) >= 2


def test_engine_water_wash():
    """Verify compressor water wash descaling action and RUL rebound."""
    response = client.post("/api/engine/34/water-wash?subset=FD001")
    assert response.status_code == 200
    data = response.json()
    assert data["unit_id"] == 34
    assert data["action"] == "COMPRESSOR_WATER_WASH"
    assert data["cycles_gained"] == 32.0
    assert data["restored_rul"] > data["original_rul"]
    assert "maintenance_signoff" in data





def test_kalman_state_and_incident_brief():
    """Verify live EKF state tracking, degradation velocity, and incident brief synthesis."""
    response = client.get("/api/engine/1/kalman-state?subset=FD001")
    assert response.status_code == 200
    data = response.json()
    assert data["unit_id"] == 1
    assert data["subset"] == "FD001"
    assert "latest_state" in data
    state = data["latest_state"]
    assert "delta_eta_hpc" in state
    assert "delta_eta_hpt" in state
    assert "estimated_hpc_health_pct" in state
    assert "mahalanobis_distance_sq" in state
    assert "degradation_velocity" in data
    vel = data["degradation_velocity"]
    assert "velocity_pct_per_cycle" in vel
    assert "status" in vel
    assert "incident_brief" in data
    brief = data["incident_brief"]
    assert "narrative" in brief
    assert "severity" in brief
    assert "recommended_action" in brief
    assert "signals" in brief
    assert brief["signals"]["hpc_health_pct"] > 0.0


def test_multi_subset_integration():
    """Verify newly trained subsets FD002, FD003, FD004 are healthy and served."""
    for sub in ["FD002", "FD003", "FD004"]:
        resp = client.get(f"/api/fleet/overview?subset={sub}")
        assert resp.status_code == 200, f"Failed for {sub}: {resp.text}"
        data = resp.json()
        assert data["subset"] == sub
        assert data["total_engines"] > 0
        assert len(data["engines"]) > 0


def test_water_wash_persistence_across_endpoints():
    """Verify water wash maintenance state persists in the backend."""
    # Perform wash on engine 1
    wash_resp = client.post("/api/engine/1/water-wash?subset=FD001")
    assert wash_resp.status_code == 200

    # Query physical dossier to ensure wash is recognized
    dossier_resp = client.get("/api/engine/1/physical-dossier?subset=FD001")
    assert dossier_resp.status_code == 200
    dossier = dossier_resp.json()
    assert dossier.get("water_wash_applied") is True
    assert dossier.get("water_wash_details") is not None
    assert dossier["water_wash_details"]["cycles_gained"] == 32.0


def test_health_check_reports_deep_model():
    """Verify health endpoint reports deep AeroTCN model availability."""
    resp = client.get("/api/health")
    assert resp.status_code == 200
    data = resp.json()
    assert "deep_models_loaded" in data
    assert "FD001" in data["deep_models_loaded"]
