"""
VISION: Prognostics Evaluation Metrics & Asymmetric Scoring
Vital Intelligence for System Integrity, Observation & Nostics

NASA Asymmetric Scoring Function:
---------------------------------
In aerospace prognostics, late predictions (predicting the engine will last longer
than it actually does) are significantly more dangerous than early predictions.
Late predictions risk inflight shutdown (IFSD) or catastrophic blade shedding.
Early predictions result in premature maintenance cost.

The NASA PHM benchmark defines:
  d = y_pred - y_true
  Score = sum( exp(-d/13) - 1 ) for d < 0  (early warning, mild penalty)
        + sum( exp(d/10) - 1 )  for d >= 0 (late warning, heavy exponential penalty)
"""

from __future__ import annotations

from typing import Dict, Tuple, Union

import numpy as np


def compute_rmse(
    y_true: Union[np.ndarray, list[float]],
    y_pred: Union[np.ndarray, list[float]],
) -> float:
    """
    Compute Root Mean Squared Error (RMSE).

    Parameters
    ----------
    y_true : array-like
        Ground-truth target values.
    y_pred : array-like
        Predicted values.

    Returns
    -------
    float
        RMSE in cycles.
    """
    yt = np.asarray(y_true, dtype=float)
    yp = np.asarray(y_pred, dtype=float)
    if len(yt) != len(yp):
        raise ValueError(f"Length mismatch: y_true has {len(yt)}, y_pred has {len(yp)}")
    return float(np.sqrt(np.mean((yp - yt) ** 2)))


def compute_mae(
    y_true: Union[np.ndarray, list[float]],
    y_pred: Union[np.ndarray, list[float]],
) -> float:
    """Compute Mean Absolute Error (MAE) in cycles."""
    yt = np.asarray(y_true, dtype=float)
    yp = np.asarray(y_pred, dtype=float)
    return float(np.mean(np.abs(yp - yt)))


def compute_nasa_score(
    y_true: Union[np.ndarray, list[float]],
    y_pred: Union[np.ndarray, list[float]],
) -> float:
    """
    Compute the official NASA C-MAPSS Asymmetric Scoring Function.

    Parameters
    ----------
    y_true : array-like
        Ground-truth target values.
    y_pred : array-like
        Predicted values.

    Returns
    -------
    float
        Cumulative asymmetric score penalty.
    """
    yt = np.asarray(y_true, dtype=float)
    yp = np.asarray(y_pred, dtype=float)
    if len(yt) != len(yp):
        raise ValueError(f"Length mismatch: y_true has {len(yt)}, y_pred has {len(yp)}")
    
    d = yp - yt
    # d < 0: early prediction -> exp(-d/13) - 1
    # d >= 0: late prediction -> exp(d/10) - 1
    penalties = np.where(d < 0, np.exp(-d / 13.0) - 1.0, np.exp(d / 10.0) - 1.0)
    return float(np.sum(penalties))


def compute_bootstrap_ci(
    y_true: Union[np.ndarray, list[float]],
    y_pred: Union[np.ndarray, list[float]],
    n_bootstraps: int = 2000,
    ci: float = 95.0,
    seed: int = 0,
) -> Tuple[float, float]:
    """
    Compute non-parametric bootstrap confidence interval for RMSE.

    Parameters
    ----------
    y_true : array-like
        Ground-truth target values.
    y_pred : array-like
        Predicted values.
    n_bootstraps : int, default=2000
        Number of bootstrap replications.
    ci : float, default=95.0
        Confidence percentage (e.g. 95.0 for 95% CI).
    seed : int, default=0
        Random seed for reproducibility.

    Returns
    -------
    tuple of (float, float)
        (lower_bound, upper_bound) of RMSE.
    """
    yt = np.asarray(y_true, dtype=float)
    yp = np.asarray(y_pred, dtype=float)
    n = len(yt)
    if n == 0:
        return (0.0, 0.0)

    d = yp - yt
    rng = np.random.default_rng(seed)
    
    # Resample error indices with replacement
    bootstrap_rmse = np.empty(n_bootstraps, dtype=float)
    for i in range(n_bootstraps):
        idx = rng.integers(0, n, size=n)
        bootstrap_rmse[i] = np.sqrt(np.mean(d[idx] ** 2))

    alpha = (100.0 - ci) / 2.0
    lower = float(np.percentile(bootstrap_rmse, alpha))
    upper = float(np.percentile(bootstrap_rmse, 100.0 - alpha))
    return lower, upper


def evaluate_predictions(
    y_true: Union[np.ndarray, list[float]],
    y_pred: Union[np.ndarray, list[float]],
    n_bootstraps: int = 2000,
    ci: float = 95.0,
) -> Dict[str, Union[float, list[float]]]:
    """
    Compute a consolidated dictionary of all prognostics metrics.
    """
    rmse_val = compute_rmse(y_true, y_pred)
    mae_val = compute_mae(y_true, y_pred)
    nasa_val = compute_nasa_score(y_true, y_pred)
    ci_low, ci_high = compute_bootstrap_ci(y_true, y_pred, n_bootstraps=n_bootstraps, ci=ci)

    return {
        "rmse": round(rmse_val, 4),
        "mae": round(mae_val, 4),
        "nasa_score": round(nasa_val, 2),
        "ci_95": [round(ci_low, 4), round(ci_high, 4)],
    }

