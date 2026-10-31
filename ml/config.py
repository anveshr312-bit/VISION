"""
VISION: Machine Learning Pipeline Configuration
Vital Intelligence for System Integrity, Observation & Nostics
"""

from __future__ import annotations

from pathlib import Path
from typing import Dict, List

# Target RUL Piecewise Capping
# Standard aerospace PHM practice: early life degradation is unobservable,
# so RUL is capped during the initial healthy state at 125 cycles.
RUL_CAP: int = 125

# Operational Regimes per C-MAPSS Subset
# FD001 & FD003 operate at sea level with single nominal regime (1 cluster).
# FD002 & FD004 operate across 6 flight conditions (altitude 0-40k ft, Mach 0-0.84, TRA 20-100).
N_REGIMES: Dict[str, int] = {
    "FD001": 1,
    "FD002": 6,
    "FD003": 1,
    "FD004": 6,
}

# Backward-looking causal rolling feature windows
ROLLING_WINDOWS: List[int] = [5, 10, 30]

# Informative sensor channels
SENSORS_KEEP: List[str] = [
    "s2", "s3", "s4", "s7", "s8", "s9", "s11",
    "s12", "s13", "s14", "s15", "s17", "s20", "s21"
]

# Standard directories
REPO_ROOT: Path = Path(__file__).resolve().parent.parent
DATA_RAW_DIR: Path = REPO_ROOT / "data" / "raw"
DATA_PROCESSED_DIR: Path = REPO_ROOT / "data" / "processed"
DATA_ARTIFACTS_DIR: Path = REPO_ROOT / "data" / "artifacts"

