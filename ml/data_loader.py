"""
VISION: NASA C-MAPSS Data Loader & Verification
Vital Intelligence for System Integrity, Observation & Nostics

Scientific Integrity & Physics Notice:
--------------------------------------
The NASA C-MAPSS (Commercial Modular Aero-Propulsion System Simulation) benchmark
models a high-bypass turbofan engine (90,000 lbf thrust class) simulating thermodynamic
and aeromechanical state variables. It does NOT contain vibration accelerometer
channels (e.g. broadband RMS, peak acceleration) or lubrication/oil pressure sensors.
Degradation modes are modeled as flow and efficiency capacity decrements in the High
Pressure Compressor (HPC) and High Pressure Turbine (HPT).

Zero-Data-Leakage Protocol:
---------------------------
Test set remaining useful life (RUL) ground-truth labels are loaded strictly as an
independent array and are NEVER merged into `test_df` during loading or preprocessing.
"""

from __future__ import annotations

import os
from pathlib import Path
from typing import Tuple, Dict, Any, Union

import numpy as np
import pandas as pd

# Standard 26-column schema for C-MAPSS space-delimited text records
COLS: list[str] = ["unit", "cycle", "op1", "op2", "op3"] + [f"s{i}" for i in range(1, 22)]

# 14 informative sensor channels exhibiting discernible degradation trajectories
SENSORS_KEEP: list[str] = [
    "s2", "s3", "s4", "s7", "s8", "s9", "s11",
    "s12", "s13", "s14", "s15", "s17", "s20", "s21"
]

# Aerospace engineering physical descriptions for informative channels
SENSOR_NAMES: dict[str, str] = {
    "s2": "T24 - LPC Outlet Temp (°R)",
    "s3": "T30 - HPC Outlet Temp (°R)",
    "s4": "T50 - LPT Outlet Temp (°R)",
    "s7": "P30 - HPC Outlet Pressure (psia)",
    "s8": "Nf - Physical Fan Speed (rpm)",
    "s9": "Nc - Physical Core Speed (rpm)",
    "s11": "Ps30 - Static HPC Outlet Pressure (psia)",
    "s12": "phi - Fuel Flow Ratio to Ps30 (pps/psi)",
    "s13": "NRf - Corrected Fan Speed (rpm)",
    "s14": "NRc - Corrected Core Speed (rpm)",
    "s15": "BPR - Bypass Ratio",
    "s17": "htBleed - Bleed Enthalpy",
    "s20": "W31 - HPT Coolant Bleed (lbm/s)",
    "s21": "W32 - LPT Coolant Bleed (lbm/s)",
}


def _resolve_data_dir(data_dir: Union[str, Path]) -> Path:
    """Resolve data directory path against current working directory or package root."""
    path = Path(data_dir)
    if not path.is_absolute():
        # First check relative to current working directory
        if path.exists():
            return path
        # Otherwise check relative to repo root (parent of ml/)
        repo_root = Path(__file__).resolve().parent.parent
        candidate = repo_root / data_dir
        if candidate.exists():
            return candidate
    return path


def _normalize_subset_name(subset_name: Union[str, int]) -> str:
    """Normalize subset identifier into standard 'FD001'-'FD004' format."""
    s = str(subset_name).strip().upper()
    if s.isdigit():
        return f"FD00{s}"
    if not s.startswith("FD"):
        if s.startswith("00"):
            return f"FD{s}"
        return f"FD{s.zfill(3)}"
    return s


def load_subset(
    subset_name: Union[str, int] = "FD001",
    data_dir: Union[str, Path] = "data/raw",
) -> Tuple[pd.DataFrame, pd.DataFrame, np.ndarray]:
    """
    Load training, test, and ground-truth RUL data for a specific C-MAPSS subset.

    Parameters
    ----------
    subset_name : str or int
        Target subset identifier ('FD001', 'FD002', 'FD003', 'FD004', or 1..4).
    data_dir : str or Path
        Directory where raw C-MAPSS .txt files reside.

    Returns
    -------
    train_df : pd.DataFrame
        Training telemetry with calculated piecewise/linear RUL (`rul` column).
    test_df : pd.DataFrame
        Test telemetry up to current observation cutoff (strictly unmerged).
    ground_truth_rul : np.ndarray
        True remaining useful life values for each test unit at its cutoff.
    """
    sub = _normalize_subset_name(subset_name)
    resolved_dir = _resolve_data_dir(data_dir)

    train_path = resolved_dir / f"train_{sub}.txt"
    test_path = resolved_dir / f"test_{sub}.txt"
    rul_path = resolved_dir / f"RUL_{sub}.txt"

    if not train_path.exists():
        raise FileNotFoundError(f"Training file not found: {train_path.resolve()}")
    if not test_path.exists():
        raise FileNotFoundError(f"Test file not found: {test_path.resolve()}")
    if not rul_path.exists():
        raise FileNotFoundError(f"Ground-truth RUL file not found: {rul_path.resolve()}")

    # 1. Load Training Data (Space-delimited, handles trailing/multiple spaces)
    train_df = pd.read_csv(train_path, sep=r"\s+", header=None, names=COLS, engine="python")
    
    # 2. Compute True RUL for Training Engines (Run-to-Failure: RUL = max_cycle - current_cycle)
    max_cycle_per_unit = train_df.groupby("unit")["cycle"].transform("max")
    train_df["rul"] = max_cycle_per_unit - train_df["cycle"]

    # 3. Load Test Data (Uncensored sequence up to inspection cycle)
    test_df = pd.read_csv(test_path, sep=r"\s+", header=None, names=COLS, engine="python")

    # 4. Load Ground-Truth RUL for Test Engines (1D array)
    rul_df = pd.read_csv(rul_path, sep=r"\s+", header=None, engine="python")
    ground_truth_rul = rul_df.iloc[:, 0].to_numpy(dtype=float)

    return train_df, test_df, ground_truth_rul


def verify_dataset_integrity(data_dir: Union[str, Path] = "data/raw") -> Dict[str, str]:
    """
    Validate unit counts and schema integrity across all 4 C-MAPSS subsets.

    Expected engine counts:
    - FD001: 100 train, 100 test
    - FD002: 260 train, 259 test
    - FD003: 100 train, 100 test
    - FD004: 249 train, 248 test (or 248 train, 249 test)
    """
    resolved_dir = _resolve_data_dir(data_dir)
    results: Dict[str, str] = {"status": "PASSED"}

    # Expected unit counts per subset
    expected_units = {
        "FD001": {"train": 100, "test": 100, "rul": 100},
        "FD002": {"train": 260, "test": 259, "rul": 259},
        "FD003": {"train": 100, "test": 100, "rul": 100},
        "FD004": {"train": {248, 249}, "test": {248, 249}, "rul": 248},
    }

    all_passed = True

    for sub, exp in expected_units.items():
        try:
            train_df, test_df, ground_truth_rul = load_subset(sub, resolved_dir)
            n_train = train_df["unit"].nunique()
            n_test = test_df["unit"].nunique()
            n_rul = len(ground_truth_rul)

            # Check training units
            train_ok = (n_train == exp["train"]) if isinstance(exp["train"], int) else (n_train in exp["train"])
            # Check test units
            test_ok = (n_test == exp["test"]) if isinstance(exp["test"], int) else (n_test in exp["test"])
            # Check RUL labels count
            rul_ok = (n_rul == exp["rul"]) if isinstance(exp["rul"], int) else (n_rul in exp["rul"])

            if train_ok and test_ok and rul_ok:
                results[sub] = "OK"
            else:
                results[sub] = f"MISMATCH (train={n_train}, test={n_test}, rul={n_rul})"
                all_passed = False
        except Exception as e:
            results[sub] = f"ERROR: {e}"
            all_passed = False

    if not all_passed:
        results["status"] = "FAILED"

    return results


if __name__ == "__main__":
    import pprint
    print("[INFO] Verifying NASA C-MAPSS dataset integrity...")
    res = verify_dataset_integrity()
    pprint.pprint(res)

