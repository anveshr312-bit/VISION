"""
VISION: Telemetry Demarcation & Scientific Integrity Service
Vital Intelligence for System Integrity, Observation & Nostics

Strict Architectural Separation:
--------------------------------
1. EMPIRICAL_CMAPSS:
   - Certified NASA Prognostics Center of Excellence (PCoE) run-to-failure data.
   - Genuine thermodynamic gas-path state variables.
   - Evaluated using 5-fold cross-validation and Mondrian conformal intervals.
   - NEVER mixed with synthetic or simulated values.

2. SYNTHETIC_SIMULATION:
   - Synthetic component-level localization for demonstration / educational UI.
   - Simulates blade clearance degradation, thermal barrier erosion, and fuel nozzle coking.
   - Explicitly watermarked with data_mode="SYNTHETIC_SIMULATION".
"""

from typing import Dict, Any, Optional
from enum import Enum


class DataMode(str, Enum):
    EMPIRICAL_CMAPSS = "EMPIRICAL_CMAPSS"
    SYNTHETIC_SIMULATION = "SYNTHETIC_SIMULATION"


# Strict Watermark Metadata
CERTIFIED_EMPIRICAL_BANNER = "CERTIFIED EMPIRICAL DATA (NASA PCoE)"
SYNTHETIC_DEMO_BANNER = "SIMULATED DEMONSTRATION MODE - SYNTHETIC COMPONENT-LEVEL LOCALIZATION"


def annotate_payload(
    payload: Dict[str, Any],
    mode: DataMode = DataMode.EMPIRICAL_CMAPSS,
    disclaimer: Optional[str] = None
) -> Dict[str, Any]:
    """
    Annotate response dictionary with scientific integrity provenance metadata.
    Enforces that callers and frontends can never confuse genuine NASA telemetry
    with synthetic demonstration physics.
    """
    if mode == DataMode.EMPIRICAL_CMAPSS:
        meta = {
            "data_mode": DataMode.EMPIRICAL_CMAPSS.value,
            "provenance": "NASA Ames Prognostics Center of Excellence (C-MAPSS)",
            "banner": CERTIFIED_EMPIRICAL_BANNER,
            "synthetic": False,
            "disclaimer": disclaimer or "Real empirical run-to-failure turbofan gas-path state variables.",
        }
    else:
        meta = {
            "data_mode": DataMode.SYNTHETIC_SIMULATION.value,
            "provenance": "VISION Synthetic Multi-Fault Subsystem Simulator",
            "banner": SYNTHETIC_DEMO_BANNER,
            "synthetic": True,
            "disclaimer": disclaimer or (
                "Educational / Demo Mode: Localized component degradation (tip wear, TBC erosion) "
                "is synthetically generated to illustrate spatial maintenance dispatch."
            ),
        }

    return {
        **payload,
        "meta": meta,
    }


def generate_synthetic_component_faults(
    base_sensors: Dict[str, float],
    target_component: str = "hpc",
    severity: float = 0.5
) -> Dict[str, Any]:
    """
    Generate synthetic localized degradation deltas for demo mode.
    Does NOT alter empirical model training or validation files.
    """
    modified = dict(base_sensors)
    fault_details = {}

    if target_component == "hpc":
        # Simulates HPC tip clearance wear & aerodynamic stall margin loss
        # T30 rises, P30 decreases, Nc speed increases to compensate
        t30_base = modified.get("s3", modified.get("T30", 1585.0))
        p30_base = modified.get("s7", modified.get("P30", 553.0))
        nc_base = modified.get("s9", modified.get("Nc", 9050.0))

        modified["s3"] = t30_base + (28.0 * severity)
        modified["s7"] = p30_base - (8.5 * severity)
        modified["s9"] = nc_base + (45.0 * severity)

        fault_details = {
            "fault_type": "HPC Blade Tip Clearance & Seal Degradation",
            "component": "hpc",
            "severity_index": severity,
            "physical_effects": [
                "Elevated HPC exit temperature (T30) due to decreased isentropic efficiency",
                "Reduced static pressure rise (P30) across compressor stages 5-9",
                "Spool speed compensator increasing core RPM (Nc) to sustain commanded thrust",
            ],
            "recommended_action": "Borescope inspection of HPC 7th stage rotor blades & clearance measurement",
        }

    elif target_component == "combustor":
        # Simulates fuel nozzle coking & uneven spray pattern
        phi_base = modified.get("s12", modified.get("phi", 521.0))
        bleed_base = modified.get("s17", modified.get("htBleed", 392.0))

        modified["s12"] = phi_base + (18.0 * severity)
        modified["s17"] = bleed_base + (5.0 * severity)

        fault_details = {
            "fault_type": "Combustor Fuel Nozzle Coking & Pattern Factor Degradation",
            "component": "combustor",
            "severity_index": severity,
            "physical_effects": [
                "Distorted fuel-air ratio distribution causing local hot spots",
                "Elevated bypass bleed load",
            ],
            "recommended_action": "Nozzle flow testing and ultrasonic cleaning of fuel injector assemblies",
        }

    elif target_component == "hpt":
        # Simulates HPT Thermal Barrier Coating (TBC) spallation & vane erosion
        bleed_base = modified.get("s20", modified.get("W31", 38.8))
        modified["s20"] = bleed_base - (1.8 * severity)

        fault_details = {
            "fault_type": "High-Pressure Turbine Thermal Barrier Coating (TBC) Spallation",
            "component": "hpt",
            "severity_index": severity,
            "physical_effects": [
                "Increased heat transfer to substrate metal on stage-1 nozzle guide vanes",
                "Diminished cooling effectiveness (W31 coolant flow reduction)",
            ],
            "recommended_action": "Hot-section disassembly; replacement of thermal barrier coated guide vanes",
        }

    elif target_component == "lpt":
        # Simulates LPT shroud wear and exhaust gas temperature rise
        t50_base = modified.get("s4", modified.get("T50", 1400.0))
        modified["s4"] = t50_base + (22.0 * severity)

        fault_details = {
            "fault_type": "Low-Pressure Turbine Blade Tip Shroud Erosion",
            "component": "lpt",
            "severity_index": severity,
            "physical_effects": [
                "Exhaust Gas Temperature (EGT / T50) margin degradation",
                "Increased inter-stage gas leakage",
            ],
            "recommended_action": "Check EGT margin margins and schedule hot gas path inspection",
        }

    return {
        "sensors": modified,
        "synthetic_fault": fault_details,
        "meta": {
            "data_mode": DataMode.SYNTHETIC_SIMULATION.value,
            "provenance": "VISION Synthetic Multi-Fault Subsystem Simulator",
            "banner": SYNTHETIC_DEMO_BANNER,
            "synthetic": True,
        },
    }

