"""
VISION: Train Deep Time-Series Sequence & Multi-Quantile Prognostics Model
Vital Intelligence for System Integrity, Observation & Nostics

Workflow:
---------
1. Ingest raw NASA C-MAPSS telemetry for designated subset.
2. Fit CmapssPreprocessor (operational regime normalization) on training engines.
3. Extract strictly causal sliding temporal sequences (W = 30) with left edge padding.
4. Execute engine-grouped train/validation partitioning.
5. Train deep sequence architecture (AeroTCN or AeroBiGRU) with composite AeroLoss:
   - Asymmetric Huber Loss (lambda * max(y_hat - y, 0)^2 penalty for dangerous late warnings)
   - Multi-quantile pinball loss for empirical distribution estimation [0.05, 0.10, 0.50, 0.90, 0.95].
6. Evaluate on official NASA last-cycle test windows.
7. Save model checkpoint (deep_tcn_{subset}.pt) and metrics JSON.
"""

from __future__ import annotations

import argparse
import json
import os
import time
from pathlib import Path
from typing import Any, Dict

import numpy as np
import pandas as pd

from ml.config import DATA_ARTIFACTS_DIR, DATA_RAW_DIR, N_REGIMES, RUL_CAP, SENSORS_KEEP
from ml.data_loader import load_subset
from ml.evaluation import compute_mae, compute_nasa_score, compute_rmse
from ml.models.quantile_heads import DEFAULT_QUANTILES, QuantileEnsemble, predict_quantiles
from ml.preprocessor import CmapssPreprocessor

try:
    import torch
    import torch.nn as nn
    from torch.utils.data import DataLoader, TensorDataset
    HAS_TORCH = True
except ImportError:
    HAS_TORCH = False


def train_deep_pipeline(
    subset: str = "FD001",
    model_type: str = "tcn",
    epochs: int = 15,
    batch_size: int = 256,
    lr: float = 0.002,
    window_size: int = 30,
    data_dir: Path = DATA_RAW_DIR,
    artifacts_dir: Path = DATA_ARTIFACTS_DIR,
    val_engine_ratio: float = 0.20,
    random_state: int = 42,
    num_threads: int = 4,
) -> Dict[str, Any]:
    """
    Execute end-to-end deep sequence training, validation, and official test evaluation.
    """
    subset_upper = subset.upper()
    print("=" * 65)
    print(f"VISION: Deep Sequence Prognostics Pipeline [{subset_upper}] - Model: {model_type.upper()}")
    print("=" * 65)
    start_time = time.time()

    artifacts_dir = Path(artifacts_dir)
    artifacts_dir.mkdir(parents=True, exist_ok=True)

    # 1. Ingest Data
    print(f"[1/6] Ingesting dataset files from {data_dir}...")
    train_df, test_df, ground_truth_rul = load_subset(subset_upper, data_dir=data_dir)
    train_df["rul"] = np.minimum(train_df["rul"], float(RUL_CAP))
    ground_truth_rul = np.minimum(ground_truth_rul, float(RUL_CAP))

    n_train_units = int(train_df["unit"].nunique())
    n_test_units = int(test_df["unit"].nunique())
    print(f"      Loaded {len(train_df):,} train records ({n_train_units} engines), "
          f"{len(test_df):,} test records ({n_test_units} engines).")

    # 2. Operational Regime Normalization
    n_regimes = N_REGIMES.get(subset_upper, 1)
    print(f"[2/6] Fitting CmapssPreprocessor with {n_regimes} regime(s)...")
    preprocessor = CmapssPreprocessor(
        n_regimes=n_regimes,
        random_state=random_state,
        sensors=SENSORS_KEEP,
    )
    train_norm = preprocessor.fit_transform(train_df)
    test_norm = preprocessor.transform(test_df)

    # 3. Causal Sequence Generation
    from ml.models.deep_sequence import (
        AeroBiGRU,
        AeroLoss,
        AeroTCN,
        create_engine_sequences,
        create_test_last_sequences,
        save_torch_model,
    )

    print(f"[3/6] Generating causal sequences (window W={window_size}, channels={len(SENSORS_KEEP)})...")
    X_train_all, y_train_all, train_units, train_cycles = create_engine_sequences(
        train_norm,
        window_size=window_size,
        feature_cols=SENSORS_KEEP,
        rul_col="rul",
        rul_cap=float(RUL_CAP),
    )
    X_test, test_units = create_test_last_sequences(
        test_norm,
        window_size=window_size,
        feature_cols=SENSORS_KEEP,
    )
    print(f"      Train sequences: {X_train_all.shape}, Test windows: {X_test.shape}")

    # Fallback to Tabular Quantile Ensemble if PyTorch unavailable or requested
    if not HAS_TORCH or model_type.lower() == "ensemble":
        print("[4/6] Training scikit-learn QuantileEnsemble fallback...")
        # Flatten temporal window for tabular gradient boosting: (N, W * C)
        X_train_flat = X_train_all.reshape(len(X_train_all), -1)
        X_test_flat = X_test.reshape(len(X_test), -1)

        ensemble = QuantileEnsemble(quantiles=DEFAULT_QUANTILES, max_iter=150, random_state=random_state)
        ensemble.fit(X_train_flat, y_train_all)

        pred_res = predict_quantiles(model=ensemble, X=X_test_flat)
        point_pred = pred_res["rul_pred"]
        q10 = pred_res["q10"]
        q90 = pred_res["q90"]
        q05 = pred_res["q05"]
        q95 = pred_res["q95"]

        artifact_file = artifacts_dir / f"deep_ensemble_{subset_upper}.joblib"
        ensemble.save(artifact_file)
    else:
        # 4. Engine-Grouped Validation Split (e.g. 80 engines train, 20 engines val)
        torch.set_num_threads(num_threads)
        torch.manual_seed(random_state)
        np.random.seed(random_state)

        unique_units = np.unique(train_units)
        np.random.shuffle(unique_units)
        n_val_units = max(1, int(len(unique_units) * val_engine_ratio))
        val_units = set(unique_units[:n_val_units])
        train_units_set = set(unique_units[n_val_units:])

        val_mask = np.isin(train_units, list(val_units))
        train_mask = ~val_mask

        X_tr = torch.tensor(X_train_all[train_mask], dtype=torch.float32)
        y_tr = torch.tensor(y_train_all[train_mask], dtype=torch.float32)
        X_va = torch.tensor(X_train_all[val_mask], dtype=torch.float32)
        y_va = torch.tensor(y_train_all[val_mask], dtype=torch.float32)

        print(f"[4/6] Split engines: {len(train_units_set)} train engines ({len(X_tr):,} steps), "
              f"{len(val_units)} validation engines ({len(X_va):,} steps)")

        train_dataset = TensorDataset(X_tr, y_tr)
        train_loader = DataLoader(train_dataset, batch_size=batch_size, shuffle=True)

        # 5. Instantiate Architecture
        if model_type.lower() == "bigru":
            model = AeroBiGRU(
                in_channels=len(SENSORS_KEEP),
                num_outputs=6,
                hidden_dim=64,
                num_layers=2,
                dropout=0.2,
            )
        else:
            model = AeroTCN(
                in_channels=len(SENSORS_KEEP),
                num_outputs=6,
                channels=(32, 32, 48, 48),
                kernel_size=3,
                dropout=0.2,
            )

        criterion = AeroLoss(
            delta=1.0,
            late_weight=0.05,
            pinball_weight=1.0,
            quantiles=DEFAULT_QUANTILES,
        )
        optimizer = torch.optim.AdamW(model.parameters(), lr=lr, weight_decay=1e-4)
        scheduler = torch.optim.lr_scheduler.CosineAnnealingLR(optimizer, T_max=epochs, eta_min=1e-4)

        print(f"[5/6] Training {model_type.upper()} for {epochs} epochs (batch={batch_size}, lr={lr})...")
        best_val_rmse = float("inf")
        best_weights = None

        for epoch in range(1, epochs + 1):
            model.train()
            running_loss = 0.0

            for bx, by in train_loader:
                optimizer.zero_grad()
                out = model(bx)
                loss = criterion(out, by)
                loss.backward()
                torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0)
                optimizer.step()
                running_loss += loss.item() * len(bx)

            scheduler.step()
            train_loss = running_loss / len(X_tr)

            # Validation check
            model.eval()
            with torch.no_grad():
                val_out = model(X_va)
                val_pt_pred = torch.clamp(val_out[:, 0], 0.0, float(RUL_CAP)).cpu().numpy()
                val_rmse = compute_rmse(y_va.numpy(), val_pt_pred)

            if val_rmse < best_val_rmse:
                best_val_rmse = val_rmse
                best_weights = {k: v.cpu().clone() for k, v in model.state_dict().items()}

            if epoch % 5 == 0 or epoch == 1 or epoch == epochs:
                print(f"      Epoch {epoch:2d}/{epochs:2d} - Train Loss: {train_loss:.4f} | Val RMSE: {val_rmse:.2f} cycles")

        # Load best weights
        if best_weights is not None:
            model.load_state_dict(best_weights)

        # 6. Evaluate on Official Test Engines
        print("[6/6] Evaluating on official NASA test engines...")
        pred_res = predict_quantiles(model=model, X=X_test, quantiles=DEFAULT_QUANTILES)
        point_pred = pred_res["rul_pred"]
        q10 = pred_res["q10"]
        q90 = pred_res["q90"]
        q05 = pred_res["q05"]
        q95 = pred_res["q95"]

        artifact_file = artifacts_dir / f"deep_{model_type.lower()}_{subset_upper}.pt"
        save_torch_model(
            model,
            artifact_file,
            metadata={
                "subset": subset_upper,
                "window_size": window_size,
                "val_rmse": float(best_val_rmse),
                "features": SENSORS_KEEP,
            },
        )

    # Compute official evaluation metrics
    test_rmse = compute_rmse(ground_truth_rul, point_pred)
    test_mae = compute_mae(ground_truth_rul, point_pred)
    test_nasa = compute_nasa_score(ground_truth_rul, point_pred)

    coverage_80 = float(np.mean((ground_truth_rul >= q10) & (ground_truth_rul <= q90)))
    coverage_90 = float(np.mean((ground_truth_rul >= q05) & (ground_truth_rul <= q95)))
    interval_width_80 = float(np.mean(q90 - q10))

    elapsed_time = round(time.time() - start_time, 2)

    # Save metrics JSON
    metrics_file = artifacts_dir / f"metrics_deep_{subset_upper}.json"
    metrics_payload = {
        "subset": subset_upper,
        "model_type": model_type.lower(),
        "test_rmse": round(test_rmse, 4),
        "test_mae": round(test_mae, 4),
        "test_nasa_score": round(test_nasa, 2),
        "coverage_80_percent": round(coverage_80 * 100, 2),
        "coverage_90_percent": round(coverage_90 * 100, 2),
        "avg_interval_width_80": round(interval_width_80, 2),
        "n_train_engines": n_train_units,
        "n_test_engines": n_test_units,
        "window_size": window_size,
        "epochs": epochs,
        "elapsed_seconds": elapsed_time,
        "artifact_file": str(artifact_file.resolve()),
    }
    with open(metrics_file, "w", encoding="utf-8") as f:
        json.dump(metrics_payload, f, indent=2)

    print("\n" + "=" * 65)
    print("DEEP PROGNOSTICS TRAINING SUMMARY & BENCHMARK")
    print("-" * 65)
    print(f"Subset:                {subset_upper}")
    print(f"Architecture:          {model_type.upper()}")
    print(f"Test RMSE:             {test_rmse:.2f} cycles")
    print(f"Test MAE:              {test_mae:.2f} cycles")
    print(f"NASA Penalty Score:    {test_nasa:.1f}")
    print(f"80% Empirical Coverage: {coverage_80 * 100:.1f}%  (Nominal: 80.0%)")
    print(f"90% Empirical Coverage: {coverage_90 * 100:.1f}%  (Nominal: 90.0%)")
    print(f"Avg 80% Bound Width:   {interval_width_80:.2f} cycles")
    print(f"Model Artifact:        {artifact_file.resolve()}")
    print(f"Metrics File:          {metrics_file.resolve()}")
    print(f"Elapsed Time:          {elapsed_time:.1f}s")
    print("=" * 65 + "\n")

    return metrics_payload


def main() -> None:
    parser = argparse.ArgumentParser(description="Train deep sequence models on C-MAPSS dataset.")
    parser.add_argument("--subset", type=str, default="FD001", help="C-MAPSS subset (FD001..FD004)")
    parser.add_argument("--model", type=str, default="tcn", choices=["tcn", "bigru", "ensemble"], help="Model architecture")
    parser.add_argument("--epochs", type=int, default=15, help="Number of training epochs")
    parser.add_argument("--batch-size", type=int, default=256, help="Minibatch size")
    parser.add_argument("--lr", type=float, default=0.002, help="Learning rate")
    parser.add_argument("--window-size", type=int, default=30, help="Temporal window length W")
    parser.add_argument("--data-dir", type=str, default=str(DATA_RAW_DIR), help="Path to raw data directory")
    parser.add_argument("--artifacts-dir", type=str, default=str(DATA_ARTIFACTS_DIR), help="Path to save artifacts")

    args = parser.parse_args()
    train_deep_pipeline(
        subset=args.subset,
        model_type=args.model,
        epochs=args.epochs,
        batch_size=args.batch_size,
        lr=args.lr,
        window_size=args.window_size,
        data_dir=Path(args.data_dir),
        artifacts_dir=Path(args.artifacts_dir),
    )


if __name__ == "__main__":
    main()

