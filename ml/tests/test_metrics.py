"""
VISION: Unit Tests for Prognostic Evaluation Metrics & Asymmetric Scoring
Vital Intelligence for System Integrity, Observation & Nostics
"""

from __future__ import annotations

import math
import numpy as np
import pytest

from ml.evaluation import compute_rmse, compute_mae, compute_nasa_score, compute_bootstrap_ci


def test_rmse_and_mae_calculation():
    """Verify RMSE and MAE against exact analytical solutions."""
    y_true = np.array([10.0, 20.0, 30.0, 40.0])
    y_pred = np.array([12.0, 18.0, 34.0, 37.0])
    # Errors: +2, -2, +4, -3
    # Absolute errors: 2, 2, 4, 3 -> mean = 11/4 = 2.75
    # Squared errors: 4, 4, 16, 9 -> mean = 33/4 = 8.25 -> sqrt = 2.87228

    rmse = compute_rmse(y_true, y_pred)
    mae = compute_mae(y_true, y_pred)

    assert math.isclose(mae, 2.75, rel_tol=1e-5)
    assert math.isclose(rmse, np.sqrt(8.25), rel_tol=1e-5)


def test_nasa_asymmetric_scoring():
    """
    Verify official NASA asymmetric penalty properties:
    - Zero error (d = 0) has zero penalty
    - Late prediction (d = +5) is penalized significantly higher than early (d = -5)
    """
    # 1. Zero error
    score_zero = compute_nasa_score([50.0], [50.0])
    assert math.isclose(score_zero, 0.0, abs_tol=1e-7)

    # 2. Early prediction: d = -5 (predicted 45, actual 50)
    # penalty = exp(5/13) - 1 = exp(0.3846) - 1 ≈ 0.469
    score_early = compute_nasa_score([50.0], [45.0])
    expected_early = math.exp(5.0 / 13.0) - 1.0
    assert math.isclose(score_early, expected_early, rel_tol=1e-5)

    # 3. Late prediction: d = +5 (predicted 55, actual 50)
    # penalty = exp(5/10) - 1 = exp(0.5) - 1 ≈ 0.6487
    score_late = compute_nasa_score([50.0], [55.0])
    expected_late = math.exp(5.0 / 10.0) - 1.0
    assert math.isclose(score_late, expected_late, rel_tol=1e-5)

    # Confirm asymmetry: late penalty > early penalty
    assert score_late > score_early

    # 4. Large error comparison (d = -20 vs d = +20)
    score_early_20 = compute_nasa_score([50.0], [30.0])  # exp(20/13) - 1 ≈ 3.65
    score_late_20 = compute_nasa_score([50.0], [70.0])   # exp(20/10) - 1 = exp(2) - 1 ≈ 6.389
    assert score_late_20 > score_early_20 * 1.5


def test_bootstrap_confidence_interval():
    """Verify non-parametric bootstrap returns valid interval covering the point estimate."""
    np.random.seed(42)
    y_true = np.linspace(10, 100, 50)
    y_pred = y_true + np.random.normal(0, 5, 50)

    point_rmse = compute_rmse(y_true, y_pred)
    lb, ub = compute_bootstrap_ci(y_true, y_pred, n_bootstraps=500, ci=95.0, seed=42)

    assert lb <= point_rmse <= ub, f"Point RMSE {point_rmse:.2f} not in [{lb:.2f}, {ub:.2f}]"

