"""
VISION: Test Suite for Empirical Benchmarks & Physics Verification Routes
Vital Intelligence for System Integrity, Observation & Nostics
"""

import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)


def test_benchmarks_summary_endpoint():
    """Verify the /api/benchmarks/summary endpoint returns frozen scorecard and ablation."""
    resp = client.get("/api/benchmarks/summary")
    assert resp.status_code == 200
    data = resp.json()
    assert "test_metrics" in data
    assert data["test_metrics"]["rmse"] == 6.974
    assert data["test_metrics"]["end_of_life_rmse"] == 4.161
    assert len(data["ablation_matrix"]) == 8
    assert len(data["shap_importance_hierarchy"]) == 4


def test_physics_check_endpoint():
    """Verify the /api/benchmarks/physics-check endpoint returns 19 passed thermodynamic checks."""
    resp = client.get("/api/benchmarks/physics-check")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "PASS"
    assert data["total_checks"] == 19
    assert data["passed_checks"] == 19
    assert data["compliance_pct"] == 100.0
    assert len(data["checks"]) == 19


def test_parity_endpoint():
    """Verify the /api/benchmarks/parity endpoint confirms zero numerical drift."""
    resp = client.get("/api/benchmarks/parity")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "PASS"
    assert data["passed_checks"] == data["total_checks"]
    assert data["worst_discrepancy"] < 1e-10
