"""
VISION: Multi-Quantile Regression Heads & Prognostic Interval Estimation
Vital Intelligence for System Integrity, Observation & Nostics

Theoretical Principles:
-----------------------
Traditional Gaussian error assumptions (e.g. y ~ N(mu, sigma^2)) are invalid
in turbofan aero-engine prognostics due to severe heteroscedasticity and
asymmetric physical wear trajectories. Near end-of-life (RUL < 30 cycles),
vibration, pressure drop, and thermal runaway produce sharp, non-Gaussian
distributions.

Multi-quantile estimation directly optimizes the asymmetric check function
(pinball loss) for target quantiles tau in [0.05, 0.10, 0.50, 0.90, 0.95]:
    L_tau(y, y_hat) = max(tau * (y - y_hat), (1 - tau) * (y_hat - y))
"""

from __future__ import annotations

import os
from pathlib import Path
from typing import Any, Dict, List, Optional, Sequence, Union

import joblib
import numpy as np

try:
    import torch
    import torch.nn as nn
    import torch.nn.functional as F
    HAS_TORCH = True
except ImportError:
    HAS_TORCH = False
    nn = object

from sklearn.ensemble import HistGradientBoostingRegressor

from ml.config import RUL_CAP

DEFAULT_QUANTILES: tuple[float, ...] = (0.05, 0.10, 0.50, 0.90, 0.95)


if HAS_TORCH:
    class PinballLoss(nn.Module):
        """
        Multi-quantile pinball (tilted absolute value) loss function.

        For each target quantile tau in [0, 1]:
            L_tau(y, y_hat) = max(tau * (y - y_hat), (1 - tau) * (y_hat - y))
        """

        def __init__(self, quantiles: Sequence[float] = DEFAULT_QUANTILES) -> None:
            super().__init__()
            self.quantiles = tuple(float(q) for q in quantiles)

        def forward(self, y_pred: torch.Tensor, y_true: torch.Tensor) -> torch.Tensor:
            """
            Compute mean pinball loss across all evaluated quantiles.

            Parameters
            ----------
            y_pred : torch.Tensor
                Predicted quantiles of shape (batch_size, len(quantiles)).
            y_true : torch.Tensor
                True target labels of shape (batch_size,) or (batch_size, 1).
            """
            if y_true.ndim == 1:
                y_true = y_true.unsqueeze(1)

            diff = y_true - y_pred  # (batch_size, num_quantiles)
            losses: List[torch.Tensor] = []
            for i, q in enumerate(self.quantiles):
                d = diff[:, i]
                loss_q = torch.max(q * d, (q - 1.0) * d)
                losses.append(loss_q.mean())

            return torch.stack(losses).mean()

    class AsymmetricHuberLoss(nn.Module):
        """
        Huber regression loss with asymmetric quadratic penalty for late predictions.
        
        Overestimating RUL (y_hat > y) risks catastrophic in-flight failure,
        penalized via lambda * max(y_hat - y, 0)^2.
        """

        def __init__(self, delta: float = 1.0, late_weight: float = 0.05) -> None:
            super().__init__()
            self.delta = float(delta)
            self.late_weight = float(late_weight)

        def forward(self, y_pred: torch.Tensor, y_true: torch.Tensor) -> torch.Tensor:
            if y_pred.ndim > 1:
                y_pred = y_pred.squeeze(-1)
            if y_true.ndim > 1:
                y_true = y_true.squeeze(-1)

            base_huber = F.smooth_l1_loss(y_pred, y_true, beta=self.delta)
            late_error = torch.clamp(y_pred - y_true, min=0.0)
            penalty = self.late_weight * torch.mean(late_error ** 2)
            return base_huber + penalty

else:
    class PinballLoss:  # type: ignore
        def __init__(self, *args, **kwargs):
            raise ImportError("PyTorch is required for PinballLoss")

    class AsymmetricHuberLoss:  # type: ignore
        def __init__(self, *args, **kwargs):
            raise ImportError("PyTorch is required for AsymmetricHuberLoss")


class QuantileEnsemble:
    """
    Zero-dependency scikit-learn quantile regressor ensemble.
    Trains independent gradient boosting models for each quantile tau in [0.05, 0.10, 0.50, 0.90, 0.95].
    Serves as an instant drop-in fallback if deep neural networks are unneeded or offline.
    """

    def __init__(
        self,
        quantiles: Sequence[float] = DEFAULT_QUANTILES,
        max_iter: int = 150,
        learning_rate: float = 0.08,
        random_state: int = 42,
    ) -> None:
        self.quantiles = tuple(float(q) for q in quantiles)
        self.max_iter = max_iter
        self.learning_rate = learning_rate
        self.random_state = random_state
        self.models: Dict[float, HistGradientBoostingRegressor] = {}
        self.is_fitted: bool = False

    def fit(self, X: np.ndarray, y: np.ndarray) -> QuantileEnsemble:
        """Fit an independent quantile regressor for each target quantile."""
        y_capped = np.minimum(y, RUL_CAP)
        self.models = {}
        for q in self.quantiles:
            model = HistGradientBoostingRegressor(
                loss="quantile",
                quantile=q,
                max_iter=self.max_iter,
                learning_rate=self.learning_rate,
                random_state=self.random_state,
            )
            model.fit(X, y_capped)
            self.models[q] = model
        self.is_fitted = True
        return self

    def predict(self, X: np.ndarray) -> np.ndarray:
        """
        Predict sorted quantiles for input feature matrix.
        Returns array of shape (n_samples, len(quantiles)).
        """
        if not self.is_fitted:
            raise RuntimeError("QuantileEnsemble must be fitted before predict.")
        preds = []
        for q in self.quantiles:
            p = self.models[q].predict(X)
            preds.append(np.clip(p, 0.0, float(RUL_CAP)))
        stacked = np.stack(preds, axis=1)
        # Enforce non-crossing monotonicity
        stacked = np.sort(stacked, axis=1)
        return stacked

    def save(self, path: Union[str, Path]) -> Path:
        p = Path(path)
        p.parent.mkdir(parents=True, exist_ok=True)
        joblib.dump({"models": self.models, "quantiles": self.quantiles}, p)
        return p

    @classmethod
    def load(cls, path: Union[str, Path]) -> QuantileEnsemble:
        p = Path(path)
        payload = joblib.load(p)
        inst = cls(quantiles=payload["quantiles"])
        inst.models = payload["models"]
        inst.is_fitted = True
        return inst


def predict_quantiles(
    model: Any = None,
    X: Any = None,
    quantiles: Sequence[float] = DEFAULT_QUANTILES,
    rul_cap: float = float(RUL_CAP),
) -> Dict[str, Any]:
    """
    Unified quantile and point RUL prediction inference function.
    
    Supports:
    1. PyTorch AeroTCN / AeroBiGRU neural network or checkpoint path.
    2. QuantileEnsemble tabular models or joblib path.
    3. Baseline point regressor with standard fallback interval.
    4. Readiness / self-check call when invoked with no arguments.

    Returns
    -------
    dict
        {
            'rul_pred': np.ndarray (point RUL capped at rul_cap),
            'q10': np.ndarray (10th percentile lower bound),
            'q90': np.ndarray (90th percentile upper bound),
            'q05': np.ndarray (5th percentile lower bound),
            'q50': np.ndarray (50th percentile median),
            'q95': np.ndarray (95th percentile upper bound),
            'quantiles': dict[float, np.ndarray],
            'status': 'READY'
        }
    """
    if model is None and X is None:
        return {
            "status": "READY",
            "supported_quantiles": list(quantiles),
            "rul_cap": rul_cap,
        }

    # 1. Resolve model if path is passed
    if isinstance(model, (str, Path)):
        p = Path(model)
        if p.suffix == ".pt":
            if not HAS_TORCH:
                raise ImportError("PyTorch required to load .pt checkpoint")
            checkpoint = torch.load(p, map_location="cpu", weights_only=False)
            arch = checkpoint.get("arch", "tcn")
            from ml.models.deep_sequence import AeroBiGRU, AeroTCN
            if arch == "bigru":
                loaded_model = AeroBiGRU(in_channels=checkpoint.get("in_channels", 14))
            else:
                loaded_model = AeroTCN(in_channels=checkpoint.get("in_channels", 14))
            loaded_model.load_state_dict(checkpoint["state_dict"])
            loaded_model.eval()
            model = loaded_model
        elif p.suffix in (".joblib", ".pkl"):
            model = QuantileEnsemble.load(p)

    # 2. Case: QuantileEnsemble
    if isinstance(model, QuantileEnsemble):
        q_preds = model.predict(X)
        q_preds = np.clip(q_preds, 0.0, rul_cap)
        q_dict = {q: q_preds[:, i] for i, q in enumerate(model.quantiles)}
        point_pred = q_dict.get(0.50, q_preds[:, len(model.quantiles) // 2])
        return {
            "rul_pred": point_pred,
            "q10": q_dict.get(0.10, q_preds[:, 1]),
            "q90": q_dict.get(0.90, q_preds[:, -2]),
            "q05": q_dict.get(0.05, q_preds[:, 0]),
            "q50": point_pred,
            "q95": q_dict.get(0.95, q_preds[:, -1]),
            "quantiles": q_dict,
            "status": "READY",
        }

    # 3. Case: PyTorch Model (AeroTCN or AeroBiGRU)
    if HAS_TORCH and isinstance(model, torch.nn.Module):
        model.eval()
        with torch.no_grad():
            if isinstance(X, np.ndarray):
                X_tensor = torch.tensor(X, dtype=torch.float32)
            else:
                X_tensor = X

            raw_out = model(X_tensor).cpu().numpy()

            # Architecture produces (B, 6): col 0 = point prediction, cols 1..5 = quantiles
            if raw_out.ndim == 2 and raw_out.shape[1] >= 6:
                raw_point = raw_out[:, 0]
                raw_quantiles = raw_out[:, 1:6]
            elif raw_out.ndim == 2 and raw_out.shape[1] == len(quantiles):
                raw_quantiles = raw_out
                raw_point = raw_quantiles[:, len(quantiles) // 2]
            else:
                raw_point = raw_out.squeeze()
                raw_quantiles = np.column_stack([raw_point * 0.8, raw_point * 0.9, raw_point, raw_point * 1.1, raw_point * 1.2])

            # Apply RUL Cap
            point_pred = np.clip(raw_point, 0.0, rul_cap)
            raw_quantiles = np.clip(raw_quantiles, 0.0, rul_cap)
            # Enforce non-crossing monotonicity across quantile columns
            q_sorted = np.sort(raw_quantiles, axis=-1)

            q_dict = {
                0.05: q_sorted[:, 0],
                0.10: q_sorted[:, 1],
                0.50: q_sorted[:, 2],
                0.90: q_sorted[:, 3],
                0.95: q_sorted[:, 4],
            }

            return {
                "rul_pred": point_pred,
                "q10": q_dict[0.10],
                "q90": q_dict[0.90],
                "q05": q_dict[0.05],
                "q50": q_dict[0.50],
                "q95": q_dict[0.95],
                "quantiles": q_dict,
                "status": "READY",
            }

    # 4. Fallback for generic scikit-learn regressor (e.g. HistGradientBoosting)
    if hasattr(model, "predict"):
        raw_pred = model.predict(X)
        point_pred = np.clip(raw_pred, 0.0, rul_cap)
        # Heuristic 15-cycle spread fallback when no quantile heads are attached
        q10 = np.clip(point_pred - 12.0, 0.0, rul_cap)
        q90 = np.clip(point_pred + 12.0, 0.0, rul_cap)
        q05 = np.clip(point_pred - 18.0, 0.0, rul_cap)
        q95 = np.clip(point_pred + 18.0, 0.0, rul_cap)
        return {
            "rul_pred": point_pred,
            "q10": q10,
            "q90": q90,
            "q05": q05,
            "q50": point_pred,
            "q95": q95,
            "quantiles": {0.05: q05, 0.10: q10, 0.50: point_pred, 0.90: q90, 0.95: q95},
            "status": "READY",
        }

    raise TypeError(f"Unsupported model type: {type(model)}")

