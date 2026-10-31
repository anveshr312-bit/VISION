"""
VISION: Unit Tests for Mondrian Split-Conformal Prediction Engine
Vital Intelligence for System Integrity, Observation & Nostics
"""

from __future__ import annotations

import numpy as np
import pytest

from ml.uncertainty.conformal_mondrian import MondrianConformalCalibrator


def test_mondrian_conformal_calibration_guarantee():
    """
    Verify empirical coverage is close to nominal level (1 - alpha)
    and that intervals are valid.
    """
    np.random.seed(42)
    n_samples = 500

    # Synthetic RUL predictions and ground truth
    y_true = np.random.uniform(5, 125, size=n_samples)
    noise = np.random.normal(0, scale=8.0, size=n_samples)
    y_pred = np.clip(y_true + noise, 0, 125)

    calibrator = MondrianConformalCalibrator()
    calibrator.fit(y_pred, y_true)

    # Test calibration coverage on holdout set
    n_test = 200
    y_test_true = np.random.uniform(5, 125, size=n_test)
    y_test_pred = np.clip(y_test_true + np.random.normal(0, scale=8.0, size=n_test), 0, 125)

    res_90 = calibrator.predict_intervals(y_test_pred, confidence=0.90)

    lowers = res_90["lower"]
    uppers = res_90["upper"]
    lb_cert = res_90["lower_bound_cert"]

    # Verify interval validity: lower <= upper
    assert np.all(lowers <= uppers), "Conformal lower bound exceeded upper bound!"

    # Verify one-sided lower bound safety certificate: LB <= y_pred
    assert np.all(lb_cert <= y_test_pred + 1e-5), "One-sided lower bound must be <= predicted RUL!"

    # Empirical coverage test
    covered = (y_test_true >= lowers) & (y_test_true <= uppers)
    coverage = np.mean(covered)

    # With 200 samples, 90% nominal should achieve >= 82% coverage
    assert coverage >= 0.82, f"Empirical coverage {coverage:.3f} failed finite-sample check"


def test_mondrian_conformal_sparse_fallback():
    """Verify robust fallback logic for under-populated or sparse bins."""
    calibrator = MondrianConformalCalibrator(min_bin_samples=20)

    # Calibrate with only 10 samples (all bins have < 20 samples -> must use global fallback)
    y_calib_true = np.array([10.0, 15.0, 20.0, 30.0, 45.0, 60.0, 80.0, 95.0, 110.0, 120.0])
    y_calib_pred = y_calib_true + np.array([-2.0, 1.0, 3.0, -1.0, 2.0, -3.0, 4.0, -2.0, 1.0, -1.0])

    calibrator.calibrate(y_calib_pred, y_calib_true)

    # Query intervals across different bins
    query_pred = np.array([8.0, 35.0, 75.0, 115.0])
    res = calibrator.predict_intervals(query_pred, confidence=0.90)

    assert len(res["lower"]) == 4
    assert len(res["upper"]) == 4
    assert np.all(res["lower"] <= res["upper"])
    assert np.all(res["lower_bound_cert"] <= query_pred)


def test_uncalibrated_raises_runtime_error():
    """Verify that calling predict_intervals before calibration raises a clear RuntimeError."""
    calibrator = MondrianConformalCalibrator()
    with pytest.raises(RuntimeError, match="Calibrator must be fitted"):
        calibrator.predict_intervals(np.array([50.0]))
