"""
VISION: Clopper-Pearson Exact Risk Control & Binomial Upper Bounds
Vital Intelligence for System Integrity, Observation & Nostics

Mathematical Principles:
-----------------------
In aviation maintenance, empirical sample averages (e.g. 0 failures in 50 engines)
drastically underestimate true tail risk due to finite sample variance.
Naive threshold optimization frequently suffers from a ~42% risk-target violation rate.

The Clopper-Pearson method provides an exact, non-asymptotic one-sided confidence
upper bound for binomial failure probability via the Beta distribution:
    UB(k, n; 1 - alpha) = Beta^{-1}(1 - alpha; k + 1, n - k)   for k < n
    UB(n, n; 1 - alpha) = 1.0

Risk-Controlled Threshold Selection:
-----------------------------------
Given an operational failure probability ceiling epsilon (e.g. 0.05) at confidence
level 1 - alpha (e.g. 0.90), we select the threshold theta* that minimizes wasted
engine cycles subject to the hard safety guarantee:
    UB(k(theta*), n; 1 - alpha) <= epsilon
"""

from __future__ import annotations

from typing import Any, Dict, List, Optional, Sequence, Tuple, Union

import numpy as np
from scipy.stats import beta


def clopper_pearson_upper_bound(
    k_failures: int,
    n_trials: int,
    confidence: float = 0.90,
) -> float:
    """
    Calculate the exact one-sided Clopper-Pearson upper bound for a binomial proportion.

    Parameters
    ----------
    k_failures : int
        Observed number of failures or safety violations.
    n_trials : int
        Total number of trials (engines tested).
    confidence : float
        Statistical confidence level (default: 0.90 for 90% confidence).

    Returns
    -------
    float
        Exact upper bound UB in [0.0, 1.0] satisfying:
        P(True Failure Rate <= UB) >= confidence.
    """
    k = int(k_failures)
    n = int(n_trials)
    conf = float(confidence)

    if n <= 0:
        return 1.0
    if k < 0:
        k = 0
    if k >= n:
        return 1.0

    # Exact quantile via Beta inverse CDF (percent-point function)
    # Parameterization: Beta(k + 1, n - k)
    ub = float(beta.ppf(conf, k + 1, n - k))
    return min(max(ub, 0.0), 1.0)


def select_risk_controlled_threshold(
    failures_matrix: Sequence[int],
    waste_matrix: Sequence[float],
    grid: Sequence[float],
    n_trials: int,
    eps: float = 0.05,
    conf: float = 0.90,
) -> Dict[str, Any]:
    """
    Select the optimal trigger threshold theta* that minimizes wasted engine life
    while strictly certifying that the Clopper-Pearson failure upper bound UB <= eps.

    Parameters
    ----------
    failures_matrix : Sequence[int]
        Observed failure counts for each candidate threshold in grid.
    waste_matrix : Sequence[float]
        Mean wasted engine cycles for each candidate threshold in grid.
    grid : Sequence[float]
        Evaluated threshold values (e.g. RUL trigger thresholds).
    n_trials : int
        Number of evaluated engines.
    eps : float
        Target maximum tolerable failure probability ceiling (default: 0.05).
    conf : float
        Confidence level for the statistical certificate (default: 0.90).

    Returns
    -------
    dict
        Optimal threshold selection metadata and certification diagnostics.
    """
    k_arr = np.asarray(failures_matrix, dtype=int)
    w_arr = np.asarray(waste_matrix, dtype=float)
    g_arr = np.asarray(grid, dtype=float)

    if len(k_arr) != len(g_arr) or len(w_arr) != len(g_arr):
        raise ValueError("failures_matrix, waste_matrix, and grid must have identical length.")

    # Calculate exact Clopper-Pearson upper bound for every threshold
    ub_list: List[float] = [
        clopper_pearson_upper_bound(k, n_trials, confidence=conf) for k in k_arr
    ]
    ub_arr = np.array(ub_list, dtype=float)

    # Filter to thresholds that strictly satisfy UB <= eps
    valid_mask = ub_arr <= eps

    if np.any(valid_mask):
        valid_indices = np.where(valid_mask)[0]
        # Among certified thresholds, find the one minimizing mean wasted life
        best_valid_idx = valid_indices[np.argmin(w_arr[valid_indices])]
        optimal_threshold = float(g_arr[best_valid_idx])
        optimal_waste = float(w_arr[best_valid_idx])
        optimal_failures = int(k_arr[best_valid_idx])
        optimal_ub = float(ub_arr[best_valid_idx])
        is_strictly_certified = True
    else:
        # Fallback: select the safest threshold (lowest UB)
        best_idx = int(np.argmin(ub_arr))
        optimal_threshold = float(g_arr[best_idx])
        optimal_waste = float(w_arr[best_idx])
        optimal_failures = int(k_arr[best_idx])
        optimal_ub = float(ub_arr[best_idx])
        is_strictly_certified = False

    return {
        "optimal_threshold": optimal_threshold,
        "mean_wasted_cycles": round(optimal_waste, 2),
        "empirical_failures": optimal_failures,
        "empirical_failure_rate": round(optimal_failures / max(1, n_trials), 4),
        "clopper_pearson_ub": round(optimal_ub, 4),
        "target_eps": eps,
        "confidence": conf,
        "is_certified": is_strictly_certified,
        "n_trials": n_trials,
    }

