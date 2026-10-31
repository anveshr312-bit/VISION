"""
VISION: Causal Feature Engineering & RUL Capping
Vital Intelligence for System Integrity, Observation & Nostics

Strict Causality & Temporal Anti-Leakage Protocol:
-------------------------------------------------
All rolling statistical window features are strictly backward-looking (`center=False`).
For any cycle t, features are computed exclusively using historical data from cycles
tau <= t within the same engine unit. Future cycles are completely inaccessible.
Target remaining useful life (RUL) is capped at 125 cycles (piecewise linear degradation).
"""

from __future__ import annotations

from typing import List, Optional, Union

import numpy as np
import pandas as pd

from ml.config import RUL_CAP, SENSORS_KEEP


def cap_rul(
    rul: Union[pd.Series, np.ndarray, list[float]],
    cap: int = RUL_CAP,
) -> np.ndarray:
    """
    Apply piecewise-linear RUL capping to simulate early healthy plateau.

    Parameters
    ----------
    rul : Series, ndarray, or list
        Raw remaining useful life values.
    cap : int, default=125
        Threshold above which RUL is clipped.

    Returns
    -------
    np.ndarray
        Piecewise-capped RUL targets.
    """
    arr = np.asarray(rul, dtype=float)
    return np.clip(arr, a_min=0.0, a_max=float(cap))


def get_feature_names(
    sensors: Optional[List[str]] = None,
    short_names: bool = False,
) -> List[str]:
    """
    Return the deterministic list of 57 causal feature names.
    (14 sensors * 4 features per sensor + 1 cycle = 57 features).
    """
    active_sensors = list(sensors) if sensors is not None else list(SENSORS_KEEP)
    names: list[str] = []
    
    for s in active_sensors:
        names.append(s)
        if short_names:
            names.append(f"{s}_m5")
            names.append(f"{s}_d")
            names.append(f"{s}_sd")
        else:
            names.append(f"{s}_mean_5")
            names.append(f"{s}_delta_5_30")
            names.append(f"{s}_std_10")
            
    names.append("cycle")
    return names


def extract_causal_features(
    df: pd.DataFrame,
    sensors: Optional[List[str]] = None,
    short_names: bool = False,
) -> pd.DataFrame:
    """
    Extract 57 strictly backward-looking causal rolling features from C-MAPSS telemetry.

    Features per sensor channel:
    1. Raw instantaneous value at cycle t
    2. mean_5: 5-cycle rolling mean (rolling(5, min_periods=1, center=False).mean())
    3. delta_5_30: (mean_5 - mean_30) short vs long term gradient
    4. std_10: 10-cycle rolling standard deviation (rolling(10, min_periods=2, center=False).std())
    Plus the explicit `cycle` counter.

    Parameters
    ----------
    df : pd.DataFrame
        Input DataFrame containing 'unit', 'cycle', and the sensor channels.
    sensors : list of str, optional
        List of informative sensors to process (default: SENSORS_KEEP, 14 sensors).
    short_names : bool, default=False
        If True, use short suffixes ('_m5', '_d', '_sd') matching legacy shorthand.
        If False, use descriptive names ('_mean_5', '_delta_5_30', '_std_10').

    Returns
    -------
    pd.DataFrame
        DataFrame with 57 causal features aligned with original index.
    """
    if "unit" not in df.columns:
        raise ValueError("DataFrame must contain 'unit' column to group by engine.")
    if "cycle" not in df.columns:
        raise ValueError("DataFrame must contain 'cycle' column.")

    active_sensors = [s for s in (sensors or SENSORS_KEEP) if s in df.columns]
    if len(active_sensors) == 0:
        raise ValueError("None of the specified sensors were found in DataFrame columns.")

    # Preserve original index for output alignment
    original_index = df.index

    # Group strictly by engine unit, maintaining relative order
    g = df.groupby("unit", sort=False)[active_sensors]

    # Strictly backward-looking causal rolling aggregations (center=False mandatory)
    m5 = g.rolling(window=5, min_periods=1, center=False).mean().reset_index(level=0, drop=True)
    m30 = g.rolling(window=30, min_periods=1, center=False).mean().reset_index(level=0, drop=True)
    sd10 = g.rolling(window=10, min_periods=2, center=False).std().reset_index(level=0, drop=True).fillna(0.0)

    # Reindex to match original df in case of non-contiguous grouping
    m5 = m5.reindex(original_index)
    m30 = m30.reindex(original_index)
    sd10 = sd10.reindex(original_index)

    features: dict[str, np.ndarray] = {}

    for s in active_sensors:
        raw_vals = df[s].to_numpy()
        m5_vals = m5[s].to_numpy()
        m30_vals = m30[s].to_numpy()
        sd10_vals = sd10[s].to_numpy()

        if short_names:
            features[s] = raw_vals
            features[f"{s}_m5"] = m5_vals
            features[f"{s}_d"] = m5_vals - m30_vals
            features[f"{s}_sd"] = sd10_vals
        else:
            features[s] = raw_vals
            features[f"{s}_mean_5"] = m5_vals
            features[f"{s}_delta_5_30"] = m5_vals - m30_vals
            features[f"{s}_std_10"] = sd10_vals

    features["cycle"] = df["cycle"].to_numpy()

    return pd.DataFrame(features, index=original_index)

