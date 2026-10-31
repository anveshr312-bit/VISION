"""
VISION: Baseline Tabular Gradient-Boosted Decision Trees (GBM)
Vital Intelligence for System Integrity, Observation & Nostics

Architecture:
-------------
Scikit-Learn HistGradientBoostingRegressor configured for stable convergence
and non-linear interaction modeling across 57 causal rolling features.
"""

from __future__ import annotations

from pathlib import Path
from typing import Any, Dict, Optional, Union

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import HistGradientBoostingRegressor

from ml.config import RUL_CAP


def create_baseline_model(
    max_iter: int = 300,
    learning_rate: float = 0.06,
    max_leaf_nodes: int = 31,
    min_samples_leaf: int = 40,
    l2_regularization: float = 1.0,
    random_state: int = 42,
) -> HistGradientBoostingRegressor:
    """
    Construct a tuned HistGradientBoostingRegressor instance for RUL estimation.
    """
    return HistGradientBoostingRegressor(
        max_iter=max_iter,
        learning_rate=learning_rate,
        max_leaf_nodes=max_leaf_nodes,
        min_samples_leaf=min_samples_leaf,
        l2_regularization=l2_regularization,
        random_state=random_state,
        loss="squared_error",
    )


class BaselineGBM:
    """
    Wrapper around HistGradientBoostingRegressor with built-in RUL clipping
    and model serialization utilities.
    """

    def __init__(
        self,
        max_iter: int = 300,
        learning_rate: float = 0.06,
        max_leaf_nodes: int = 31,
        min_samples_leaf: int = 40,
        l2_regularization: float = 1.0,
        random_state: int = 42,
        rul_cap: int = RUL_CAP,
    ) -> None:
        self.rul_cap = rul_cap
        self.params: Dict[str, Any] = {
            "max_iter": max_iter,
            "learning_rate": learning_rate,
            "max_leaf_nodes": max_leaf_nodes,
            "min_samples_leaf": min_samples_leaf,
            "l2_regularization": l2_regularization,
            "random_state": random_state,
        }
        self.model = create_baseline_model(**self.params)
        self.is_fitted_: bool = False
        self.feature_names_: list[str] = []

    def fit(
        self,
        X: Union[pd.DataFrame, np.ndarray],
        y: Union[pd.Series, np.ndarray],
    ) -> BaselineGBM:
        """Fit model on feature matrix and target RUL."""
        if isinstance(X, pd.DataFrame):
            self.feature_names_ = list(X.columns)
            X_mat = X.to_numpy()
        else:
            X_mat = np.asarray(X)
            self.feature_names_ = [f"f{i}" for i in range(X_mat.shape[1])]

        y_vec = np.clip(np.asarray(y, dtype=float), 0.0, float(self.rul_cap))
        self.model.fit(X_mat, y_vec)
        self.is_fitted_ = True
        return self

    def predict(self, X: Union[pd.DataFrame, np.ndarray]) -> np.ndarray:
        """Predict RUL with non-negative lower bound and RUL_CAP upper bound."""
        if not self.is_fitted_:
            raise RuntimeError("BaselineGBM must be fitted before predict.")

        if isinstance(X, pd.DataFrame):
            X_mat = X.to_numpy()
        else:
            X_mat = np.asarray(X)

        raw_preds = self.model.predict(X_mat)
        return np.clip(raw_preds, 0.0, float(self.rul_cap))

    def save(self, path: Union[str, Path]) -> None:
        """Serialize model artifact to disk."""
        p = Path(path)
        p.parent.mkdir(parents=True, exist_ok=True)
        joblib.dump(self, p)

    @classmethod
    def load(cls, path: Union[str, Path]) -> BaselineGBM:
        """Load serialized model artifact from disk."""
        p = Path(path)
        if not p.exists():
            raise FileNotFoundError(f"Model artifact not found: {p.resolve()}")
        obj = joblib.load(p)
        return obj

