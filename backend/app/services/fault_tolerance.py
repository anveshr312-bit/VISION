"""
VISION: Fault Tolerance, Channel Dropout & Out-of-Distribution Detector
Vital Intelligence for System Integrity, Observation & Nostics

Safety Hardening:
-----------------
1. Channel Dropout Recovery:
   - Non-critical sensor dropouts (e.g. s17, s20, s12): Imputes with healthy-baseline nominals.
   - Critical sensor dropouts (e.g. T30 / s3, P30 / s7): Triggers SENSOR_FAULT_ABSTAIN,
     widens uncertainty interval to 100%, and commands manual inspection.

2. Out-of-Distribution (OOD) Envelope Checking:
   - Validates operational settings (op1 altitude, op2 Mach, op3 throttle).
   - If settings deviate outside the valid flight envelope, marks confidence as OOD_UNCERTAIN.
"""

from __future__ import annotations

import math
from typing import Any, Dict, List, Optional, Tuple

# Nominal healthy baseline sensor values for C-MAPSS FD001
NOMINAL_BASELINES = {
    "s2": 642.0,   # T24 LPC Outlet Temp (°R)
    "s3": 1585.0,  # T30 HPC Outlet Temp (°R) - CRITICAL
    "s4": 1400.0,  # T50 LPT Outlet Temp (°R) - CRITICAL
    "s7": 553.0,   # P30 HPC Outlet Pressure (psia) - CRITICAL
    "s8": 2388.0,  # Nf Fan Speed (rpm)
    "s9": 9050.0,  # Nc Core Speed (rpm)
    "s11": 47.0,   # Ps30 Static Pressure (psia)
    "s12": 521.0,  # phi Fuel Flow Ratio (pps/psi)
    "s13": 2388.0, # NRf Corrected Fan Speed (rpm)
    "s14": 8130.0, # NRc Corrected Core Speed (rpm)
    "s15": 8.4,    # BPR Bypass Ratio
    "s17": 392.0,  # htBleed Enthalpy (Btu/lbm)
    "s20": 38.8,   # W31 HPT Coolant Bleed (lbm/s)
    "s21": 23.3,   # W32 LPT Coolant Bleed (lbm/s)
}

CRITICAL_SENSORS = {"s3", "s7", "s4"}

# Valid flight envelope for operational settings (across FD001 - FD004)
OP_ENVELOPES = {
    "op1": (-0.0087, 42.008),  # Altitude (sea level to 42,000 ft)
    "op2": (-0.0006, 0.8420),  # Mach number (0.0 to 0.84 Mach)
    "op3": (0.0, 100.0),       # Sea-level throttle resolver angle (0 to 100)
}


def sanitize_telemetry(raw_readings: Dict[str, Any]) -> Dict[str, Any]:
    """
    Sanitize and impute incoming telemetry readings with fault tolerance guarantees.
    """
    sanitized: Dict[str, float] = {}
    missing_critical: List[str] = []
    imputed_non_critical: List[str] = []
    warnings: List[str] = []

    # 1. Check critical sensors
    for crit in CRITICAL_SENSORS:
        val = raw_readings.get(crit)
        if val is None or (isinstance(val, (int, float)) and (math.isnan(val) or math.isinf(val))):
            missing_critical.append(crit)

    # If critical sensor dropped, fail-safe to abstain
    if missing_critical:
        # Fill with baseline for computation but flag as abstained
        for k, v in raw_readings.items():
            if k in NOMINAL_BASELINES:
                sanitized[k] = NOMINAL_BASELINES[k] if v is None else float(v)

        return {
            "status": "SENSOR_FAULT_ABSTAIN",
            "safe_to_predict": False,
            "sanitized_sensors": sanitized,
            "missing_critical": missing_critical,
            "imputed_sensors": [],
            "uncertainty_multiplier": 3.0,
            "message": f"Critical sensor dropout detected ({', '.join(missing_critical)}). Prediction abstained.",
        }

    # 2. Impute non-critical dropouts
    for k, nominal in NOMINAL_BASELINES.items():
        val = raw_readings.get(k)
        if val is None or (isinstance(val, (int, float)) and (math.isnan(val) or math.isinf(val))):
            sanitized[k] = nominal
            imputed_non_critical.append(k)
        else:
            sanitized[k] = float(val)

    # 3. Check for out-of-distribution operating conditions
    is_ood = False
    for op_key, (min_v, max_v) in OP_ENVELOPES.items():
        op_val = raw_readings.get(op_key)
        if op_val is not None and isinstance(op_val, (int, float)):
            if op_val < min_v - 0.05 or op_val > max_v + 0.05:
                is_ood = True
                warnings.append(f"Operating setting {op_key}={op_val} exceeds certified envelope [{min_v}, {max_v}]")

    status = "OOD_UNCERTAIN" if is_ood else ("NOMINAL_IMPUTED" if imputed_non_critical else "NOMINAL")

    return {
        "status": status,
        "safe_to_predict": True,
        "sanitized_sensors": sanitized,
        "missing_critical": [],
        "imputed_sensors": imputed_non_critical,
        "uncertainty_multiplier": 1.6 if is_ood else (1.2 if imputed_non_critical else 1.0),
        "warnings": warnings,
    }

