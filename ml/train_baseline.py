"""
VISION: Train Baseline Gradient-Boosted Model (HistGradientBoosting)
Vital Intelligence for System Integrity, Observation & Nostics

Workflow:
---------
1. Ingest raw NASA C-MAPSS telemetry for designated subset.
2. Fit CmapssPreprocessor (single or 6-regime KMeans) on training engines.
3. Extract 57 strictly backward-looking causal rolling features.
4. Execute 5-fold GroupKFold engine-level cross-validation and record OOF predictions.
5. Train final model on full training set.
6. Evaluate on official NASA last-cycle test windows.
7. Save model artifact and performance metrics JSON.
"""

from __future__ import annotations

import argparse
import json
import time
from pathlib import Path
from typing import Any, Dict

import joblib
import numpy as np
import pandas as pd
from sklearn.model_selection import GroupKFold

from ml.config import DATA_ARTIFACTS_DIR, DATA_RAW_DIR, N_REGIMES, RUL_CAP
from ml.data_loader import load_subset
from ml.evaluation import compute_bootstrap_ci, compute_mae, compute_nasa_score, compute_rmse
from ml.feature_engineering import cap_rul, extract_causal_features
from ml.models.baseline_gbm import BaselineGBM, create_baseline_model
from ml.preprocessor import CmapssPreprocessor


def train_baseline_pipeline(
    subset: str = "FD001",
    data_dir: Path = DATA_RAW_DIR,
    artifacts_dir: Path = DATA_ARTIFACTS_DIR,
    n_splits: int = 5,
    random_state: int = 42,
) -> Dict[str, Any]:
    """
    Execute full baseline training, OOF cross-validation, and test evaluation.
    """
    subset_upper = subset.upper()
    print("=" * 65)
    print(f"VISION: Baseline Model Training Pipeline [{subset_upper}]")
    print("=" * 65)
    start_time = time.time()

    artifacts_dir.mkdir(parents=True, exist_ok=True)

    # 1. Load Data
    print(f"[1/6] Ingesting dataset files from {data_dir}...")
    train_df, test_df, ground_truth_rul = load_subset(subset_upper, data_dir=data_dir)
    n_train_units = int(train_df["unit"].nunique())
    n_test_units = int(test_df["unit"].nunique())
    print(f"      Loaded {len(train_df):,} train records ({n_train_units} engines), "
          f"{len(test_df):,} test records ({n_test_units} engines).")

    # 2. Fit Preprocessor (Train Only)
    n_regimes = N_REGIMES.get(subset_upper, 1)
    print(f"[2/6] Fitting CmapssPreprocessor with {n_regimes} regime(s)...")
    preprocessor = CmapssPreprocessor(n_regimes=n_regimes, random_state=random_state)
    preprocessor.fit(train_df)
    
    train_norm = preprocessor.transform(train_df)
    test_norm = preprocessor.transform(test_df)

    # Save preprocessor artifact
    prep_path = artifacts_dir / f"preprocessor_{subset_upper}.joblib"
    preprocessor.save(prep_path)
    print(f"      Preprocessor saved to {prep_path.name}")

    # 3. Extract 57 Causal Features
    print("[3/6] Extracting 57 backward-looking causal rolling features...")
    X_train = extract_causal_features(train_norm)
    y_train = cap_rul(train_df["rul"], cap=RUL_CAP)
    
    X_test_all = extract_causal_features(test_norm)
    
    # Official NASA evaluation protocol: extract last available cycle for each test engine
    last_cycle_indices = test_df.groupby("unit").tail(1).index
    X_test_last = X_test_all.loc[last_cycle_indices]
    y_test = cap_rul(ground_truth_rul, cap=RUL_CAP)

    print(f"      Feature matrix: X_train={X_train.shape}, X_test_last={X_test_last.shape}")

    # 4. Engine-Grouped 5-Fold Cross-Validation
    print(f"[4/6] Running {n_splits}-fold GroupKFold cross-validation on engines...")
    gkf = GroupKFold(n_splits=n_splits)
    groups = train_df["unit"].to_numpy()

    oof_preds = np.zeros(len(train_df), dtype=float)
    fold_rmses = []

    for fold, (train_idx, val_idx) in enumerate(gkf.split(X_train, y_train, groups=groups), 1):
        fold_model = create_baseline_model(random_state=random_state + fold)
        fold_model.fit(X_train.iloc[train_idx], y_train[train_idx])
        
        val_pred = np.clip(fold_model.predict(X_train.iloc[val_idx]), 0.0, float(RUL_CAP))
        oof_preds[val_idx] = val_pred
        
        fold_rmse = compute_rmse(y_train[val_idx], val_pred)
        fold_rmses.append(fold_rmse)
        print(f"      Fold {fold}/{n_splits} - Validation RMSE: {fold_rmse:.2f} cycles")

    oof_rmse = compute_rmse(y_train, oof_preds)
    oof_mae = compute_mae(y_train, oof_preds)
    oof_nasa = compute_nasa_score(y_train, oof_preds)
    print(f"      OOF Overall RMSE: {oof_rmse:.2f} | MAE: {oof_mae:.2f} | NASA Score: {oof_nasa:.1f}")

    # 5. Fit Final Model on Full Training Set
    print("[5/6] Training final model on 100% of training cycles...")
    final_model = BaselineGBM(
        max_iter=300,
        learning_rate=0.06,
        max_leaf_nodes=31,
        min_samples_leaf=40,
        l2_regularization=1.0,
        random_state=random_state,
        rul_cap=RUL_CAP,
    )
    final_model.fit(X_train, y_train)

    # 6. Evaluate on Official Test Set (Last-Cycle Windows)
    print("[6/6] Evaluating on official NASA test engines...")
    y_test_pred = final_model.predict(X_test_last)

    test_rmse = compute_rmse(y_test, y_test_pred)
    test_mae = compute_mae(y_test, y_test_pred)
    test_nasa = compute_nasa_score(y_test, y_test_pred)
    ci_low, ci_high = compute_bootstrap_ci(y_test, y_test_pred, n_bootstraps=2000, ci=95.0, seed=0)

    elapsed = time.time() - start_time

    # Save artifacts
    model_path = artifacts_dir / f"baseline_{subset_upper}.joblib"
    # Also save the raw scikit-learn estimator directly so joblib.load is standard
    final_model.save(model_path)
    
    metrics: Dict[str, Any] = {
        "subset": subset_upper,
        "test_rmse": round(test_rmse, 4),
        "test_mae": round(test_mae, 4),
        "test_nasa_score": round(test_nasa, 2),
        "test_ci_95": [round(ci_low, 4), round(ci_high, 4)],
        "oof_rmse": round(oof_rmse, 4),
        "oof_mae": round(oof_mae, 4),
        "oof_nasa_score": round(oof_nasa, 2),
        "fold_rmses": [round(r, 4) for r in fold_rmses],
        "n_train_engines": n_train_units,
        "n_test_engines": n_test_units,
        "features_count": int(X_train.shape[1]),
        "elapsed_seconds": round(elapsed, 2),
    }

    metrics_path = artifacts_dir / f"metrics_{subset_upper}.json"
    with open(metrics_path, "w", encoding="utf-8") as f:
        json.dump(metrics, f, indent=2)

    print("\n" + "=" * 65)
    print("TRAINING SUMMARY & BENCHMARK RESULTS")
    print("-" * 65)
    print(f"Subset:             {subset_upper}")
    print(f"Test RMSE:          {test_rmse:.2f} cycles (95% CI: [{ci_low:.2f}, {ci_high:.2f}])")
    print(f"Test MAE:           {test_mae:.2f} cycles")
    print(f"NASA Penalty Score: {test_nasa:.1f}")
    print(f"OOF CV RMSE:        {oof_rmse:.2f} cycles")
    print(f"Model Artifact:     {model_path.resolve()}")
    print(f"Metrics File:       {metrics_path.resolve()}")
    print(f"Elapsed Time:       {elapsed:.1f}s")
    print("=" * 65 + "\n")

    return metrics


def main() -> None:
    parser = argparse.ArgumentParser(description="Train VISION Baseline RUL Regressor")
    parser.add_argument(
        "--subset",
        type=str,
        default="FD001",
        help="C-MAPSS subset identifier ('FD001', 'FD002', 'FD003', 'FD004', or 'all')",
    )
    parser.add_argument(
        "--data-dir",
        type=str,
        default=str(DATA_RAW_DIR),
        help="Path to raw C-MAPSS dataset directory",
    )
    parser.add_argument(
        "--artifacts-dir",
        type=str,
        default=str(DATA_ARTIFACTS_DIR),
        help="Path to destination artifacts directory",
    )
    parser.add_argument(
        "--n-splits",
        type=int,
        default=5,
        help="Number of folds for GroupKFold cross-validation",
    )
    args = parser.parse_args()

    data_dir = Path(args.data_dir)
    artifacts_dir = Path(args.artifacts_dir)

    if args.subset.lower() == "all":
        subsets = ["FD001", "FD002", "FD003", "FD004"]
    else:
        subsets = [args.subset]

    for sub in subsets:
        train_baseline_pipeline(
            subset=sub,
            data_dir=data_dir,
            artifacts_dir=artifacts_dir,
            n_splits=args.n_splits,
        )


if __name__ == "__main__":
    main()

