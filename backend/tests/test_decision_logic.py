"""
VISION: Unit Tests for Maintenance Economic Optimization & Clopper-Pearson Bounds
Vital Intelligence for System Integrity, Observation & Nostics
"""

from __future__ import annotations

import math
import numpy as np
import pytest
from scipy.stats import beta

from ml.uncertainty.clopper_pearson import (
    clopper_pearson_upper_bound,
    select_risk_controlled_threshold,
)
from backend.app.services.decision_service import DecisionService


def test_clopper_pearson_upper_bound_formula():
    """Verify exact one-sided Clopper-Pearson calculation against scipy.stats.beta.ppf."""
    k = 2
    n = 100
    confidence = 0.90

    ub = clopper_pearson_upper_bound(k, n, confidence=confidence)
    # Exact beta PPF: beta.ppf(confidence, k + 1, n - k)
    expected_ub = float(beta.ppf(confidence, k + 1, n - k))

    assert math.isclose(ub, expected_ub, rel_tol=1e-6)
    assert 0.0 <= ub <= 1.0


def test_clopper_pearson_zero_failures_rule_of_three():
    """For k = 0 failures out of 100, UB at 95% is approximately 3/n = 0.03."""
    ub_95 = clopper_pearson_upper_bound(0, 100, confidence=0.95)
    # Exact: 1 - 0.05^(1/100) ≈ 0.0295
    assert math.isclose(ub_95, 1.0 - (0.05 ** (1 / 100)), rel_tol=1e-5)
    assert ub_95 < 0.035


def test_clopper_pearson_all_failures():
    """When all engines fail (k = n), UB is exactly 1.0."""
    ub_all = clopper_pearson_upper_bound(50, 50, confidence=0.90)
    assert ub_all == 1.0


def test_risk_controlled_threshold_selection():
    """
    Verify threshold selector chooses lowest-waste threshold that satisfies
    risk budget upper bound.
    """
    grid = [5.0, 10.0, 15.0, 20.0, 25.0]
    failures_matrix = [12, 6, 2, 1, 0]
    waste_matrix = [2.0, 6.0, 12.0, 18.0, 24.0]
    n_trials = 100

    # Target failure rate epsilon = 0.05 at 90% confidence
    # threshold 15 has 2 failures in 100 -> UB(2, 100; 0.90) ≈ 0.053 > 0.05
    # threshold 20 has 1 failure in 100 -> UB(1, 100; 0.90) ≈ 0.038 <= 0.05
    res = select_risk_controlled_threshold(
        failures_matrix=failures_matrix,
        waste_matrix=waste_matrix,
        grid=grid,
        n_trials=n_trials,
        eps=0.05,
        conf=0.90,
    )

    assert res["is_certified"] is True
    assert res["optimal_threshold"] in [20.0, 25.0]
    assert res["clopper_pearson_ub"] <= 0.05


def test_decision_service_optimal_stopping():
    """Verify DecisionService optimal stopping hazard threshold calculation."""
    svc = DecisionService(cost_failure=100_000.0, cost_waste_per_cycle=100.0, lead_time_cycles=15)
    # c_w = 100, C_f = 100000 -> gamma = 0.001
    assert math.isclose(svc.cost_ratio, 0.001, rel_tol=1e-6)

    # Engine with LB <= lead_time (15c) triggers immediate maintenance
    eval_critical = svc.evaluate_engine_decision(
        predicted_rul=14.0,
        lower_bound=9.5,
        upper_bound=22.0,
        current_cycle=140,
    )
    assert eval_critical["priority"] == "CRITICAL"
    assert eval_critical["trigger_active"] is True
    assert eval_critical["hazard_rate"] > 0

    # Engine with healthy margins (RUL 85c, LB 72c) remains in normal operation
    eval_healthy = svc.evaluate_engine_decision(
        predicted_rul=85.0,
        lower_bound=72.0,
        upper_bound=102.0,
        current_cycle=80,
    )
    assert eval_healthy["priority"] == "HEALTHY"
    assert eval_healthy["trigger_active"] is False
