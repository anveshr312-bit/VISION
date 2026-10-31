"""
VISION: Mondrian Split-Conformal Prediction & Uncertainty Calibration
Vital Intelligence for System Integrity, Observation & Nostics

Mathematical Guarantees:
------------------------
Standard conformal prediction provides finite-sample, distribution-free
validity: for an exchangeable sequence of nonconformity scores, the marginal
coverage satisfies:
    P(Y in Interval_{1-alpha}(X)) >= 1 - alpha

In turbofan prognostics, errors are severely heteroscedastic:
- Near end-of-life (RUL < 30 cycles), degradation signals are intense and errors are tight.
- Early in life (RUL > 100 cycles), sensor degradation is subtle, causing wider spread.

Mondrian Split-Conformal Prediction partitions the prediction space into
discrete condition bins (defined by RUL thresholds) and computes separate
conformal quantiles per bin. This produces adaptive, state-dependent confidence
bands while retaining exact finite-sample coverage guarantees.

Exchangeability Notice:
-----------------------
Guarantees hold marginally across engines drawn exchangeably from the fleet
operating regime. Out-of-fold (OOF) cross-validation residuals prevent optimistic bias.
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Dict, List, Optional, Sequence, Tuple, Union

import numpy as np

from ml.config import DATA_ARTIFACTS_DIR, RUL_CAP

# Condition bin edges in cycles: [15, 30, 50, 75, 100, 115]
DEFAULT_EDGES: list[float] = [15.0, 30.0, 50.0, 75.0, 100.0, 115.0]

BIN_LABELS: list[str] = [
    "[0, 15) - Critical Pre-Failure",
    "[15, 30) - Late Degradation",
    "[30, 50) - Accelerated Wear",
    "[50, 75) - Mid-Life Degradation",
    "[75, 100) - Early Wear Inflection",
    "[100, 115) - Healthy Phase",
    "[115, 125+] - Plateau / Run-In",
]


def _conformal_quantile(residuals: np.ndarray, alpha: float) -> float:
    """
    Compute finite-sample conformal quantile:
        k = ceil((n + 1) * (1 - alpha))
        quantile = sorted_residuals[k - 1]
    """
    n = len(residuals)
    if n == 0:
        return 0.0
    k = int(np.ceil((n + 1) * (1.0 - alpha)))
    k = min(max(k, 1), n)
    sorted_r = np.sort(residuals)
    return float(sorted_r[k - 1])


class MondrianConformalCalibrator:
    """
    Mondrian (Condition-Binned) Split-Conformal Prediction Engine.

    Parameters
    ----------
    edges : Sequence[float], optional
        Bin boundaries in predicted RUL cycles. Defaults to [15, 30, 50, 75, 100, 115].
    min_bin_samples : int
        Minimum calibration samples in a bin to use its local quantile.
        If samples < min_bin_samples, falls back to the global fleet quantile.
    rul_cap : float
        Piecewise linear threshold (default 125.0 cycles).
    """

    def __init__(
        self,
        edges: Optional[Sequence[float]] = None,
        min_bin_samples: int = 30,
        rul_cap: float = float(RUL_CAP),
    ) -> None:
        self.edges = [float(e) for e in (edges if edges is not None else DEFAULT_EDGES)]
        self.min_bin_samples = int(min_bin_samples)
        self.rul_cap = float(rul_cap)
        self.is_calibrated: bool = False

        # Nested tables: tables[conf_level] -> dict of bin indices to metrics
        self.tables: Dict[float, Dict[str, Any]] = {}
        self.global_tables: Dict[float, Dict[str, float]] = {}
        self.bin_counts_: Dict[int, int] = {}
        self.num_calibration_samples_: int = 0

    def get_bin_index(self, y_pred: Union[float, np.ndarray]) -> Union[int, np.ndarray]:
        """Assign predicted RUL to its condition bin index using np.digitize."""
        clipped = np.clip(y_pred, 0.0, self.rul_cap)
        return np.digitize(clipped, self.edges)

    def calibrate(
        self,
        y_pred_oof: np.ndarray,
        y_true_oof: np.ndarray,
        nominal_levels: Sequence[float] = (0.80, 0.90, 0.95),
    ) -> MondrianConformalCalibrator:
        """
        Calibrate condition-binned conformal quantiles on Out-Of-Fold (OOF) residuals.

        Parameters
        ----------
        y_pred_oof : np.ndarray
            Out-of-fold predicted RUL (1D array).
        y_true_oof : np.ndarray
            Ground-truth training RUL (1D array).
        nominal_levels : Sequence[float]
            Target coverage probabilities 1 - alpha (e.g., 0.80, 0.90, 0.95).
        """
        y_pred_capped = np.clip(np.asarray(y_pred_oof, dtype=float), 0.0, self.rul_cap)
        y_true_capped = np.minimum(np.asarray(y_true_oof, dtype=float), self.rul_cap)

        n_samples = len(y_pred_capped)
        if n_samples == 0:
            raise ValueError("OOF calibration arrays cannot be empty.")

        self.num_calibration_samples_ = n_samples

        # Two-sided error: r = |y_hat - y|
        r_two_sided = np.abs(y_pred_capped - y_true_capped)

        # One-sided lower bound error: r_lb = y_hat - y
        # If y_hat - y <= q_lb, then y >= y_hat - q_lb (true RUL is above lower bound)
        r_one_sided = y_pred_capped - y_true_capped

        # Assign bins
        bin_indices = self.get_bin_index(y_pred_capped)
        num_bins = len(self.edges) + 1

        self.bin_counts_ = {
            b: int(np.sum(bin_indices == b)) for b in range(num_bins)
        }

        self.tables = {}
        self.global_tables = {}

        for conf in nominal_levels:
            conf_val = round(float(conf), 4)
            alpha = 1.0 - conf_val

            # Compute global fallback quantiles across all calibration engines
            q_global_2s = _conformal_quantile(r_two_sided, alpha)
            q_global_1s = _conformal_quantile(r_one_sided, alpha)
            self.global_tables[conf_val] = {
                "q_two_sided": round(q_global_2s, 4),
                "q_lower_bound": round(q_global_1s, 4),
            }

            bin_dict: Dict[str, Any] = {}
            for b in range(num_bins):
                mask = (bin_indices == b)
                count = int(np.sum(mask))

                if count >= self.min_bin_samples:
                    q_2s = _conformal_quantile(r_two_sided[mask], alpha)
                    q_1s = _conformal_quantile(r_one_sided[mask], alpha)
                    used_fallback = False
                else:
                    q_2s = q_global_2s
                    q_1s = q_global_1s
                    used_fallback = True

                bin_dict[str(b)] = {
                    "bin_index": b,
                    "bin_label": BIN_LABELS[b] if b < len(BIN_LABELS) else f"Bin {b}",
                    "count": count,
                    "used_fallback": used_fallback,
                    "q_two_sided": round(float(q_2s), 4),
                    "q_lower_bound": round(float(q_1s), 4),
                }

            self.tables[conf_val] = bin_dict

        self.is_calibrated = True
        return self

    fit = calibrate

    def predict_intervals(
        self,
        y_pred: np.ndarray,
        confidence: float = 0.90,
    ) -> Dict[str, np.ndarray]:
        """
        Construct calibrated conformal prediction intervals and lower-bound safety certificates.

        Parameters
        ----------
        y_pred : np.ndarray
            Predicted RUL array (1D).
        confidence : float
            Desired nominal coverage level (0.80, 0.90, or 0.95).

        Returns
        -------
        dict
            {
                'y_pred': np.ndarray,
                'lower': np.ndarray,
                'upper': np.ndarray,
                'interval_width': np.ndarray,
                'lower_bound_cert': np.ndarray,
                'bins': np.ndarray,
                'q_two_sided': np.ndarray,
                'q_lower_bound': np.ndarray,
                'confidence': float,
            }
        """
        if not self.is_calibrated:
            raise RuntimeError("Calibrator must be fitted via calibrate() before prediction.")

        conf_key = round(float(confidence), 4)
        if conf_key not in self.tables:
            # Fall back to nearest available confidence level
            available = sorted(self.tables.keys())
            nearest = min(available, key=lambda c: abs(c - conf_key))
            conf_key = nearest

        y_pred_arr = np.asarray(y_pred, dtype=float)
        y_pred_capped = np.clip(y_pred_arr, 0.0, self.rul_cap)
        bins = self.get_bin_index(y_pred_capped)

        table = self.tables[conf_key]

        q2s_list = []
        q1s_list = []
        for b in bins:
            b_str = str(b)
            if b_str in table:
                q2s_list.append(table[b_str]["q_two_sided"])
                q1s_list.append(table[b_str]["q_lower_bound"])
            else:
                glob = self.global_tables[conf_key]
                q2s_list.append(glob["q_two_sided"])
                q1s_list.append(glob["q_lower_bound"])

        q2s_arr = np.array(q2s_list, dtype=float)
        q1s_arr = np.array(q1s_list, dtype=float)

        lower_2s = np.clip(y_pred_capped - q2s_arr, 0.0, self.rul_cap)
        upper_2s = np.clip(y_pred_capped + q2s_arr, 0.0, self.rul_cap)
        lower_bound_cert = np.clip(y_pred_capped - q1s_arr, 0.0, self.rul_cap)

        return {
            "y_pred": y_pred_capped,
            "lower": lower_2s,
            "upper": upper_2s,
            "interval_width": upper_2s - lower_2s,
            "lower_bound_cert": lower_bound_cert,
            "bins": bins,
            "q_two_sided": q2s_arr,
            "q_lower_bound": q1s_arr,
            "confidence": conf_key,
        }

    def to_dict(self) -> Dict[str, Any]:
        """Export serializable calibration tables."""
        return {
            "edges": self.edges,
            "rul_cap": self.rul_cap,
            "min_bin_samples": self.min_bin_samples,
            "num_calibration_samples": self.num_calibration_samples_,
            "bin_counts": self.bin_counts_,
            "bin_labels": BIN_LABELS,
            "nominal_levels": [k for k in sorted(self.tables.keys())],
            "tables": {str(k): v for k, v in self.tables.items()},
            "global_tables": {str(k): v for k, v in self.global_tables.items()},
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> MondrianConformalCalibrator:
        """Instantiate calibrator from serialized dictionary."""
        calibrator = cls(
            edges=data.get("edges", DEFAULT_EDGES),
            min_bin_samples=data.get("min_bin_samples", 30),
            rul_cap=data.get("rul_cap", float(RUL_CAP)),
        )
        calibrator.num_calibration_samples_ = data.get("num_calibration_samples", 0)
        calibrator.bin_counts_ = {int(k): v for k, v in data.get("bin_counts", {}).items()}

        calibrator.tables = {}
        calibrator.global_tables = {}

        if "tables" in data:
            for k_str, table_dict in data["tables"].items():
                conf_val = round(float(k_str), 4)
                calibrator.tables[conf_val] = table_dict
            for k_str, glob_dict in data.get("global_tables", {}).items():
                conf_val = round(float(k_str), 4)
                calibrator.global_tables[conf_val] = glob_dict
        else:
            # Handle top-level keys "80", "90", "95", etc.
            for k, val in data.items():
                if isinstance(val, dict) and "bins" in val:
                    nom = val.get("nominal_confidence")
                    conf_val = round(float(nom if nom is not None else float(k) / 100.0), 4)
                    calibrator.tables[conf_val] = val["bins"]
                    if "global_quantiles" in val:
                        calibrator.global_tables[conf_val] = val["global_quantiles"]
                    elif "global" in val:
                        calibrator.global_tables[conf_val] = val["global"]

        if calibrator.tables:
            calibrator.is_calibrated = True
        return calibrator

    def save(self, path: Union[str, Path]) -> Path:
        p = Path(path)
        p.parent.mkdir(parents=True, exist_ok=True)
        with open(p, "w", encoding="utf-8") as f:
            json.dump(self.to_dict(), f, indent=2)
        return p

    @classmethod
    def load(cls, path: Union[str, Path]) -> MondrianConformalCalibrator:
        p = Path(path)
        with open(p, "r", encoding="utf-8") as f:
            data = json.load(f)
        return cls.from_dict(data)

