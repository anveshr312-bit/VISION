"""
VISION: Conformal Prediction Evaluation & Calibration Table Generation
Vital Intelligence for System Integrity, Observation & Nostics

Workflow:
---------
1. Ingest raw NASA C-MAPSS telemetry for designated subset.
2. Obtain Out-Of-Fold (OOF) predictions across training engines via 5-fold GroupKFold.
3. Fit MondrianConformalCalibrator across discrete condition bins (EDGES = [15, 30, 50, 75, 100, 115]).
4. Evaluate Empirical Prediction Interval Coverage Probability (PICP),
   Mean Prediction Interval Width (MPIW), and Lower-Bound Safety Rate on official test engines.
5. Export conformal calibration lookup tables to data/artifacts/conformal_tables_{subset}.json.

Exchangeability Statement:
--------------------------
Conformal prediction coverage guarantees are finite-sample and distribution-free,
holding marginally across exchangeable engines drawn from the operational fleet population.
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
from ml.feature_engineering import extract_causal_features
from ml.models.baseline_gbm import BaselineGBM, create_baseline_model
from ml.preprocessor import CmapssPreprocessor
from ml.uncertainty.conformal_mondrian import DEFAULT_EDGES, MondrianConformalCalibrator


def evaluate_conformal_calibration(
    subset: str = "FD001",
    data_dir: Path = DATA_RAW_DIR,
    artifacts_dir: Path = DATA_ARTIFACTS_DIR,
    nominal_levels: tuple[float, ...] = (0.80, 0.90, 0.95),
    n_splits: int = 5,
    random_state: int = 42,
) -> Dict[str, Any]:
    """
    Execute full Mondrian conformal prediction calibration and test set validation.
    """
    subset_upper = subset.upper()
    print("=" * 70)
    print(f"VISION: Mondrian Conformal Prediction Calibration [{subset_upper}]")
    print("=" * 70)
    start_time = time.time()

    artifacts_dir = Path(artifacts_dir)
    artifacts_dir.mkdir(parents=True, exist_ok=True)

    # 1. Ingest Telemetry
    print(f"[1/5] Ingesting dataset files from {data_dir}...")
    train_df, test_df, ground_truth_rul = load_subset(subset_upper, data_dir=data_dir)
    train_df["rul"] = np.minimum(train_df["rul"], float(RUL_CAP))
    ground_truth_rul = np.minimum(ground_truth_rul, float(RUL_CAP))

    n_train_engines = int(train_df["unit"].nunique())
    n_test_engines = int(test_df["unit"].nunique())
    print(f"      Loaded {len(train_df):,} train records ({n_train_engines} engines), "
          f"{len(test_df):,} test records ({n_test_engines} engines).")

    # 2. Preprocess & Feature Extraction
    print("[2/5] Normalizing telemetry & extracting 57 causal rolling features...")
    n_regimes = N_REGIMES.get(subset_upper, 1)
    preprocessor = CmapssPreprocessor(n_regimes=n_regimes, random_state=random_state)
    train_norm = preprocessor.fit_transform(train_df)
    test_norm = preprocessor.transform(test_df)

    X_train = extract_causal_features(train_norm)
    X_test_all = extract_causal_features(test_norm)

    last_idx = test_df.groupby("unit").tail(1).index
    X_test_last = X_test_all.loc[last_idx].reset_index(drop=True)
    y_train = train_df["rul"].to_numpy(dtype=float)

    # 3. Obtain Out-Of-Fold (OOF) Cross-Validation Residuals
    oof_cache_path = artifacts_dir / f"oof_predictions_{subset_upper}.joblib"
    if oof_cache_path.exists():
        print(f"[3/5] Loading cached OOF predictions from {oof_cache_path.name}...")
        oof_data = joblib.load(oof_cache_path)
        oof_preds = oof_data["oof_pred"]
    else:
        print(f"[3/5] Computing {n_splits}-fold GroupKFold OOF predictions on engines...")
        gkf = GroupKFold(n_splits=n_splits)
        groups = train_df["unit"].to_numpy()
        oof_preds = np.zeros(len(train_df), dtype=float)

        for fold, (tr_idx, va_idx) in enumerate(gkf.split(X_train, y_train, groups=groups), 1):
            fold_model = create_baseline_model(random_state=random_state + fold)
            fold_model.fit(X_train.iloc[tr_idx], y_train[tr_idx])
            val_pred = np.clip(fold_model.predict(X_train.iloc[va_idx]), 0.0, float(RUL_CAP))
            oof_preds[va_idx] = val_pred

        # Cache OOF predictions for downstream modules
        joblib.dump({
            "unit": train_df["unit"].to_numpy(),
            "cycle": train_df["cycle"].to_numpy(),
            "rul_true": y_train,
            "oof_pred": oof_preds,
        }, oof_cache_path)
        print(f"      Cached OOF predictions to {oof_cache_path.name}")

    # 4. Calibrate Mondrian Conformal Calibrator
    print("[4/5] Fitting MondrianConformalCalibrator across condition bins...")
    calibrator = MondrianConformalCalibrator(
        edges=DEFAULT_EDGES,
        min_bin_samples=30,
        rul_cap=float(RUL_CAP),
    )
    calibrator.calibrate(oof_preds, y_train, nominal_levels=nominal_levels)

    # 5. Evaluate on Official NASA Test Engines
    print("[5/5] Evaluating calibrated bounds on official NASA test engines...")
    baseline_model_path = artifacts_dir / f"baseline_{subset_upper}.joblib"
    if baseline_model_path.exists():
        baseline_model = BaselineGBM.load(baseline_model_path)
    else:
        baseline_model = BaselineGBM(random_state=random_state, rul_cap=float(RUL_CAP))
        baseline_model.fit(X_train, y_train)

    y_test_pred = baseline_model.predict(X_test_last)

    eval_results: Dict[str, Any] = {}
    for conf in nominal_levels:
        conf_val = round(float(conf), 4)
        intervals = calibrator.predict_intervals(y_test_pred, confidence=conf_val)

        # Two-sided empirical coverage (PICP)
        covered_2s = (ground_truth_rul >= intervals["lower"]) & (ground_truth_rul <= intervals["upper"])
        picp = float(np.mean(covered_2s))

        # Mean Prediction Interval Width (MPIW)
        mpiw = float(np.mean(intervals["interval_width"]))

        # One-sided Lower Bound Safety Rate: true RUL >= lower_bound_cert
        covered_lb = ground_truth_rul >= intervals["lower_bound_cert"]
        safety_rate = float(np.mean(covered_lb))

        eval_results[str(int(conf_val * 100))] = {
            "nominal_confidence": conf_val,
            "nominal_miscoverage_alpha": round(1.0 - conf_val, 4),
            "picp": round(picp, 4),
            "mpiw": round(mpiw, 2),
            "safety_rate": round(safety_rate, 4),
            "test_engines_covered_2s": int(np.sum(covered_2s)),
            "test_engines_covered_lb": int(np.sum(covered_lb)),
            "total_test_engines": n_test_engines,
        }

    # Construct comprehensive conformal tables dictionary
    conformal_tables_payload: Dict[str, Any] = {
        "subset": subset_upper,
        "edges": calibrator.edges,
        "80": {
            "nominal_confidence": 0.80,
            "global_quantiles": calibrator.global_tables[0.80],
            "bins": calibrator.tables[0.80],
        },
        "90": {
            "nominal_confidence": 0.90,
            "global_quantiles": calibrator.global_tables[0.90],
            "bins": calibrator.tables[0.90],
        },
        "95": {
            "nominal_confidence": 0.95,
            "global_quantiles": calibrator.global_tables[0.95],
            "bins": calibrator.tables[0.95],
        },
        "evaluation": eval_results,
        "metadata": {
            "theory": "Mondrian Split-Conformal Prediction",
            "exchangeability": (
                "Conformal coverage guarantees hold marginally across exchangeable "
                "engines drawn from the operational fleet population."
            ),
            "calibration_source": "5-fold engine-grouped out-of-fold (OOF) cross-validation residuals",
            "rul_cap": float(RUL_CAP),
            "n_calibration_samples": calibrator.num_calibration_samples_,
            "bin_counts": calibrator.bin_counts_,
            "elapsed_seconds": round(time.time() - start_time, 2),
        },
    }

    # Save to data/artifacts/conformal_tables_{subset}.json
    out_file = artifacts_dir / f"conformal_tables_{subset_upper}.json"
    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(conformal_tables_payload, f, indent=2)

    # Print summary report
    print("\n" + "=" * 70)
    print(f"MONDRIAN CONFORMAL CALIBRATION SUMMARY [{subset_upper}]")
    print("-" * 70)
    print(f"{'Nominal Level':<15} | {'Empirical PICP':<16} | {'MPIW (Cycles)':<14} | {'Lower-Bound Safety':<18}")
    print("-" * 70)
    for k in ["80", "90", "95"]:
        row = eval_results[k]
        print(f"{row['nominal_confidence']*100:.0f}%{'':<12} | "
              f"{row['picp']*100:.1f}%{'':<11} | "
              f"{row['mpiw']:.2f}{' cycles':<7} | "
              f"{row['safety_rate']*100:.1f}% ({row['test_engines_covered_lb']}/{n_test_engines})")
    print("-" * 70)
    print("Exchangeability & Coverage Notice:")
    print("  Conformal guarantees hold marginally across exchangeable engines.")
    print("  Condition-binned Mondrian scaling accounts for heteroscedasticity.")
    print(f"Artifact Saved: {out_file.resolve()}")
    print(f"Elapsed Time:   {time.time() - start_time:.2f}s")
    print("=" * 70 + "\n")

    return conformal_tables_payload


def main() -> None:
    parser = argparse.ArgumentParser(description="Evaluate Mondrian conformal prediction calibration.")
    parser.add_argument("--subset", type=str, default="FD001", help="C-MAPSS subset identifier (FD001..FD004)")
    parser.add_argument("--data-dir", type=str, default=str(DATA_RAW_DIR), help="Path to raw telemetry data")
    parser.add_argument("--artifacts-dir", type=str, default=str(DATA_ARTIFACTS_DIR), help="Path to save artifacts")

    args = parser.parse_args()
    evaluate_conformal_calibration(
        subset=args.subset,
        data_dir=Path(args.data_dir),
        artifacts_dir=Path(args.artifacts_dir),
    )


if __name__ == "__main__":
    main()

