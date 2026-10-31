"""
VISION: Integration Tests for Multi-Dataset Aviation Ingestion Gateway
Tests catalog querying, N-CMAPSS 1 Hz transient mission profiling, and universal ingestion.
"""

from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)


def test_data_sources_catalog():
    """Verify catalog returns all 4 certified aviation data modalities."""
    response = client.get("/api/data-sources/catalog")
    assert response.status_code == 200
    data = response.json()
    assert data["total_sources"] == 4
    source_ids = [s["id"] for s in data["sources"]]
    assert "NASA_CMAPSS_BENCHMARK" in source_ids
    assert "NASA_NCMAPSS_TRANSIENT" in source_ids
    assert "ARINC_429_ACARS_EHM" in source_ids
    assert "FAA_PHYSICAL_MAINTENANCE" in source_ids

    # Verify standard certifications
    standards = [s["certification_standard"] for s in data["sources"]]
    assert any("AIAA" in st for st in standards)
    assert any("DO-160G" in st for st in standards)
    assert any("ARINC 429" in st for st in standards)
    assert any("14 CFR § 33.70" in st for st in standards)


def test_ncmapss_mission_profile():
    """Verify N-CMAPSS 1 Hz flight transient profile generates continuous flight phases."""
    response = client.get("/api/data-sources/mission-profile?duration_seconds=120")
    assert response.status_code == 200
    points = response.json()
    assert len(points) == 120

    first = points[0]
    assert first["second"] == 0
    assert first["flight_phase"] == "TAXI_OUT"
    assert first["altitude_ft"] <= 100

    mid = points[50]
    assert mid["flight_phase"] in ["TAKEOFF_ROLL", "CLIMB"]
    assert mid["tra_deg"] > 80.0
    assert mid["n1_pct"] > 70.0
    assert "delta_eta_hpc" in mid
    assert "conformal_rul" in mid


def test_universal_aviation_ingest():
    """Verify ingestion of external ARINC 429 / ACARS live flight frame."""
    payload = {
        "unit_id": 34,
        "cycle": 145,
        "flight_phase": "CRUISE_FL370",
        "n1_rpm_pct": 89.2,
        "n2_rpm_pct": 91.4,
        "t30_hpc_out_r": 1592.0,
        "t50_egt_r": 1398.0,
        "p30_hpc_out_psia": 546.0,
        "vibration_ips": 0.28,
        "altitude_ft": 37000.0,
        "mach_number": 0.85,
        "tra_throttle_deg": 76.0,
        "oil_fe_ppm": 14.2,
    }

    req = {
        "source_type": "ARINC_429_ACARS_EHM",
        "unit_id": 34,
        "payload": payload,
    }

    response = client.post("/api/data-sources/ingest", json=req)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "INGESTED_AND_NORMALIZED"
    assert data["source"] == "ARINC_429_ACARS_EHM"
    frame = data["normalized_frame"]
    assert frame["unit_id"] == 34
    assert frame["t30_hpc_out_r"] == 1592.0
    assert "ekf_delta_eta_hpc" in frame
    assert "ekf_mahalanobis_sq" in frame
