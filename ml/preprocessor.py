"""
VISION: C-MAPSS Preprocessor & Operational Regime Normalizer
Vital Intelligence for System Integrity, Observation & Nostics

Strict No-Leakage Protocol:
---------------------------
Operational regime clustering and normalization parameters (mean, std)
are derived strictly from training engines. Test data is transformed using
the frozen statistics of the fitted preprocessor without updating parameters.
"""

from __future__ import annotations

import warnings
from pathlib import Path
from typing import Dict, List, Optional, Union

import joblib
import numpy as np
import pandas as pd
from sklearn.cluster import KMeans

from ml.config import SENSORS_KEEP

OPERATIONAL_SETTINGS: list[str] = ["op1", "op2", "op3"]


class CmapssPreprocessor:
    """
    Standardizes C-MAPSS sensor telemetry either globally or conditioned on
    operating regimes identified via K-Means clustering.
    """

    def __init__(
        self,
        n_regimes: int = 1,
        random_state: int = 42,
        sensors: Optional[List[str]] = None,
    ) -> None:
        self.n_regimes = int(n_regimes)
        self.random_state = int(random_state)
        self.sensors = list(sensors) if sensors is not None else list(SENSORS_KEEP)
        
        self.is_fitted_: bool = False
        self.kmeans: Optional[KMeans] = None
        self.global_means_: Dict[str, float] = {}
        self.global_stds_: Dict[str, float] = {}
        self.regime_means_: Dict[str, Dict[int, float]] = {}
        self.regime_stds_: Dict[str, Dict[int, float]] = {}

    def fit(self, train_df: pd.DataFrame) -> CmapssPreprocessor:
        """
        Fit normalization statistics and optional K-Means regime clusters
        strictly on training engines.
        """
        if not isinstance(train_df, pd.DataFrame):
            raise TypeError("train_df must be a pandas DataFrame")

        # Multi-Regime Normalization (FD002, FD004)
        if self.n_regimes > 1:
            for op in OPERATIONAL_SETTINGS:
                if op not in train_df.columns:
                    raise ValueError(f"Operational setting '{op}' required for regime clustering.")

            # Explicit n_init=10 to avoid Windows MKL/OpenMP memory leak warnings
            with warnings.catch_warnings():
                warnings.simplefilter("ignore")
                self.kmeans = KMeans(
                    n_clusters=self.n_regimes,
                    n_init=10,
                    random_state=self.random_state,
                ).fit(train_df[OPERATIONAL_SETTINGS])

            regime_labels = pd.Series(self.kmeans.labels_, index=train_df.index, name="regime")
            temp_df = train_df.copy()
            temp_df["regime"] = regime_labels

            self.regime_means_ = {}
            self.regime_stds_ = {}

            for s in self.sensors:
                if s not in train_df.columns:
                    continue
                # Calculate mean and std per regime
                means = temp_df.groupby("regime")[s].mean().to_dict()
                stds = temp_df.groupby("regime")[s].std().to_dict()

                # Ensure non-zero, valid standard deviations
                for r in range(self.n_regimes):
                    m = means.get(r, 0.0)
                    if np.isnan(m):
                        means[r] = float(train_df[s].mean())
                    sd = stds.get(r, 1.0)
                    if np.isnan(sd) or abs(sd) < 1e-7:
                        stds[r] = 1.0

                self.regime_means_[s] = means
                self.regime_stds_[s] = stds

        # Single Regime Normalization (FD001, FD003)
        else:
            self.kmeans = None
            self.global_means_ = {}
            self.global_stds_ = {}

            for s in self.sensors:
                if s not in train_df.columns:
                    continue
                mu = float(train_df[s].mean())
                sd = float(train_df[s].std())
                if np.isnan(sd) or abs(sd) < 1e-7:
                    sd = 1.0
                self.global_means_[s] = mu
                self.global_stds_[s] = sd

        self.is_fitted_ = True
        return self

    def transform(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Normalize sensor readings using training-derived statistics.
        Zero data leakage: does not alter internal fitted state.
        """
        if not self.is_fitted_:
            raise RuntimeError("CmapssPreprocessor must be fitted before calling transform.")

        out_df = df.copy()

        # Multi-regime normalization
        if self.n_regimes > 1 and self.kmeans is not None:
            regimes = pd.Series(
                self.kmeans.predict(out_df[OPERATIONAL_SETTINGS]),
                index=out_df.index,
                name="regime",
            )
            out_df["regime"] = regimes

            for s in self.sensors:
                if s not in out_df.columns:
                    continue
                mu_series = regimes.map(self.regime_means_[s]).astype(float)
                sd_series = regimes.map(self.regime_stds_[s]).astype(float)
                sd_series = sd_series.replace(0, 1.0).fillna(1.0)
                out_df[s] = (out_df[s] - mu_series) / sd_series

        # Global single-regime normalization
        else:
            for s in self.sensors:
                if s not in out_df.columns:
                    continue
                mu = self.global_means_[s]
                sd = self.global_stds_[s]
                out_df[s] = (out_df[s] - mu) / sd

        return out_df

    def fit_transform(self, train_df: pd.DataFrame) -> pd.DataFrame:
        """Fit on train_df and transform it."""
        return self.fit(train_df).transform(train_df)

    def save(self, path: Union[str, Path]) -> None:
        """Save fitted preprocessor to disk using joblib."""
        if not self.is_fitted_:
            raise RuntimeError("Cannot save unfitted preprocessor.")
        p = Path(path)
        p.parent.mkdir(parents=True, exist_ok=True)
        joblib.dump(self, p)

    @classmethod
    def load(cls, path: Union[str, Path]) -> CmapssPreprocessor:
        """Load fitted preprocessor from disk."""
        p = Path(path)
        if not p.exists():
            raise FileNotFoundError(f"Preprocessor artifact not found: {p.resolve()}")
        obj = joblib.load(p)
        if not isinstance(obj, CmapssPreprocessor):
            raise TypeError(f"Loaded object is not a CmapssPreprocessor instance, got: {type(obj)}")
        return obj

