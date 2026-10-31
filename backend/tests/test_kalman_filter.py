"""
Tests for Turbofan Extended Kalman Filter (EKF)
Validates convergence, state estimation, innovation covariance, and sensor anomaly abstention.
"""

import numpy as np
import pytest
from backend.app.services.kalman_filter import TurbofanEKF, filter_engine_history


def test_ekf_initialization():
    ekf = TurbofanEKF()
    assert ekf.x.shape == (3, 1)
    assert ekf.P.shape == (3, 3)
    assert ekf.H.shape == (4, 3)
    assert np.allclose(ekf.x, 0.0)


def test_ekf_nominal_step():
    ekf = TurbofanEKF()
    # Nominal cruise values for FD001
    res = ekf.step(t30=1585.0, p30=553.0, t50=1400.0, fuel_flow=3.92)
    assert not res["sensor_fault_detected"]
    assert res["filter_health"] == "NOMINAL"
    assert res["estimated_hpc_health_pct"] > 95.0
    assert res["mahalanobis_distance_sq"] < ekf.chi2_threshold


def test_ekf_degradation_tracking():
    ekf = TurbofanEKF()
    # As an engine degrades, T30 rises and P30 drops
    for cycle in range(50):
        t30 = 1585.0 + 0.3 * cycle
        p30 = 553.0 - 0.15 * cycle
        t50 = 1400.0 + 0.25 * cycle
        fuel = 3.92 + 0.002 * cycle
        res = ekf.step(t30=t30, p30=p30, t50=t50, fuel_flow=fuel)

    # EKF should have tracked negative efficiency delta
    assert res["delta_eta_hpc"] < 0.0
    assert res["estimated_hpc_health_pct"] < 100.0
    assert not res["sensor_fault_detected"]


def test_ekf_sensor_anomaly_rejection():
    ekf = TurbofanEKF()
    # Feed an impossible, non-physical spike (e.g. sensor wire short)
    res = ekf.step(t30=2500.0, p30=100.0, t50=900.0, fuel_flow=10.0)
    assert res["sensor_fault_detected"]
    assert res["filter_health"] == "SENSOR_ANOMALY_ABSTAIN"
    assert res["mahalanobis_distance_sq"] > ekf.chi2_threshold

