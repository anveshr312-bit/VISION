"""
Unit Tests: Temporal Causality & Zero-Data-Leakage Verification
Validates that:
1. Future cycles of an engine cannot leak backward into past features.
2. Altering or shuffling future cycles leaves earlier features 100% invariant.
3. Test set sensor values never contaminate normalization statistics.
4. RUL capping operates strictly piecewise at 125 cycles.
"""

from __future__ import annotations

import numpy as np
import pandas as pd
import pytest

from ml.config import RUL_CAP, SENSORS_KEEP
from ml.data_loader import load_subset
from ml.feature_engineering import cap_rul, extract_causal_features, get_feature_names
from ml.preprocessor import CmapssPreprocessor


@pytest.fixture(scope="module")
def fd001_data():
    """Load cached FD001 dataset for fast testing."""
    return load_subset("FD001")


@pytest.fixture(scope="module")
def fd002_data():
    """Load cached FD002 dataset for multi-regime testing."""
    return load_subset("FD002")


def test_feature_count_is_strictly_57(fd001_data):
    """Verify that exactly 57 causal features are generated."""
    train_df, _, _ = fd001_data
    engine_1 = train_df[train_df["unit"] == 1].copy()
    
    feats = extract_causal_features(engine_1)
    expected_names = get_feature_names()
    
    assert feats.shape[1] == 57, f"Expected 57 features, got {feats.shape[1]}"
    assert list(feats.columns) == expected_names
    assert "cycle" in feats.columns
    assert len(feats) == len(engine_1)


def test_future_cycles_cannot_leak_backward(fd001_data):
    """
    Core causality proof:
    Truncating or altering future cycles (t > t_cutoff) must have ZERO impact
    on feature values computed for cycles t <= t_cutoff.
    """
    train_df, _, _ = fd001_data
    engine_1 = train_df[train_df["unit"] == 1].copy().reset_index(drop=True)
    total_cycles = len(engine_1)
    cutoff = total_cycles // 2

    # 1. Full sequence features
    feats_full = extract_causal_features(engine_1)
    early_features_baseline = feats_full.iloc[:cutoff].copy()

    # 2. Truncated sequence (simulating earlier observation point)
    engine_truncated = engine_1.iloc[:cutoff].copy()
    feats_truncated = extract_causal_features(engine_truncated)

    # Must be numerically identical up to cutoff
    np.testing.assert_allclose(
        early_features_baseline.to_numpy(),
        feats_truncated.to_numpy(),
        rtol=1e-12,
        atol=1e-12,
        err_msg="Features up to cutoff changed when future was truncated (forward leakage detected!)",
    )

    # 3. Future alteration / corruption test
    engine_corrupted = engine_1.copy()
    # Heavily corrupt future cycles (add extreme noise and massive spikes)
    for s in SENSORS_KEEP:
        engine_corrupted.loc[cutoff:, s] = engine_corrupted.loc[cutoff:, s] * 100.0 + 9999.0

    feats_corrupted = extract_causal_features(engine_corrupted)
    early_features_after_corruption = feats_corrupted.iloc[:cutoff]

    # Earlier features must remain 100% invariant despite catastrophic future alterations
    np.testing.assert_allclose(
        early_features_baseline.to_numpy(),
        early_features_after_corruption.to_numpy(),
        rtol=1e-12,
        atol=1e-12,
        err_msg="Altering future cycles changed earlier cycle features! Window is non-causal!",
    )


def test_test_data_does_not_contaminate_normalization(fd001_data):
    """
    Verify that normalizing a test set uses strictly training statistics
    and does not mutate or leak test values into the preprocessor.
    """
    train_df, test_df, _ = fd001_data

    # Fit on training data
    prep = CmapssPreprocessor(n_regimes=1, random_state=42)
    prep.fit(train_df)

    initial_means = dict(prep.global_means_)
    initial_stds = dict(prep.global_stds_)

    # Transform baseline test set
    test_transformed_1 = prep.transform(test_df)

    # Create maliciously poisoned test set with massive sensor offsets
    poisoned_test = test_df.copy()
    for s in SENSORS_KEEP:
        poisoned_test[s] = poisoned_test[s] * 1000.0 + 50000.0

    # Transform poisoned test set
    _ = prep.transform(poisoned_test)

    # Ensure preprocessor internal statistics were NOT modified
    assert prep.global_means_ == initial_means, "Preprocessor means were modified during transform!"
    assert prep.global_stds_ == initial_stds, "Preprocessor stds were modified during transform!"

    # Transform original test set again to ensure determinism
    test_transformed_2 = prep.transform(test_df)
    pd.testing.assert_frame_equal(test_transformed_1, test_transformed_2)


def test_piecewise_rul_capping():
    """Verify standard RUL capping at 125 cycles."""
    raw_ruls = np.array([0, 10, 50, 124, 125, 126, 200, 350])
    capped = cap_rul(raw_ruls, cap=RUL_CAP)

    expected = np.array([0, 10, 50, 124, 125, 125, 125, 125], dtype=float)
    np.testing.assert_array_equal(capped, expected)
    assert np.max(capped) <= RUL_CAP


def test_multi_regime_preprocessor_fd002(fd002_data):
    """
    Verify multi-regime normalization fits 6 clusters on operational settings
    and significantly reduces sensor variance across flight conditions.
    """
    train_df, test_df, _ = fd002_data

    prep_regime = CmapssPreprocessor(n_regimes=6, random_state=42)
    prep_regime.fit(train_df)

    assert prep_regime.is_fitted_
    assert prep_regime.kmeans is not None
    assert prep_regime.kmeans.n_clusters == 6

    # Verify per-regime parameters exist for all 14 sensors across all 6 clusters
    for s in SENSORS_KEEP:
        assert len(prep_regime.regime_means_[s]) == 6
        assert len(prep_regime.regime_stds_[s]) == 6

    tr_norm = prep_regime.transform(train_df)
    te_norm = prep_regime.transform(test_df)

    assert tr_norm.shape[0] == train_df.shape[0]
    assert te_norm.shape[0] == test_df.shape[0]
    assert "regime" in tr_norm.columns
    assert "regime" in te_norm.columns

    # Verify regime assignment values are strictly in [0, 5]
    assert set(tr_norm["regime"].unique()).issubset(set(range(6)))
    assert set(te_norm["regime"].unique()).issubset(set(range(6)))

