/**
 * VISION: Telemetry Modes & Scientific Integrity Definitions
 * Vital Intelligence for System Integrity, Observation & Nostics
 *
 * Strict Architectural Demarcation:
 * ---------------------------------
 * 1. MODE_EMPIRICAL:
 *    - Real NASA Ames Prognostics Center of Excellence (C-MAPSS) run-to-failure dataset.
 *    - Certified empirical thermodynamic gas-path state variables.
 *    - Engine-level Remaining Useful Life with Mondrian conformal prediction coverage.
 *    - 3D turbofan reflects genuine operational telemetry (Nf/Nc rotation, T50 thermal exhaust).
 *
 * 2. MODE_DEMO_SIMULATION:
 *    - Explicitly labeled synthetic physics-informed demonstration mode.
 *    - Simulates component-level multi-fault scenarios (HPC tip clearance, LPT shroud wear, nozzle coking).
 *    - Renders localized fault heatmaps on the 3D twin for educational/judge evaluation.
 */

export const TELEMETRY_MODES = {
  EMPIRICAL: {
    id: 'empirical',
    title: 'Empirical C-MAPSS Mode',
    subTitle: 'Rigorous Aerospace Benchmark',
    banner: 'CERTIFIED EMPIRICAL DATA (NASA PCoE)',
    shortBadge: 'EMPIRICAL (NASA)',
    badgeColor: 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50',
    indicatorColor: 'bg-emerald-500',
    accentColor: 'text-emerald-400',
    borderColor: 'border-emerald-500',
    description:
      'Strictly authentic NASA C-MAPSS run-to-failure telemetry. Engine-level RUL predictions with finite-sample conformal uncertainty bounds. Zero fabricated micro-flaws.',
    provenance: 'NASA Ames Prognostics Center of Excellence (PCoE) Turbofan Simulation',
    isSynthetic: false,
  },
  DEMO_SIMULATION: {
    id: 'simulation',
    title: 'Demonstration & Subsystem Simulation',
    subTitle: 'Synthetic Component-Level Localization',
    banner: 'SIMULATED DEMONSTRATION MODE - SYNTHETIC COMPONENT-LEVEL LOCALIZATION',
    shortBadge: 'SIMULATED DEMO',
    badgeColor: 'bg-amber-950/80 text-amber-300 border-amber-500/50',
    indicatorColor: 'bg-amber-500',
    accentColor: 'text-amber-400',
    borderColor: 'border-amber-500',
    description:
      'Synthetic educational demonstration illustrating multi-fault localized degradation (HPC blade tip wear, TBC thermal spallation, nozzle coking) on the 3D digital twin.',
    provenance: 'VISION Synthetic Physics Fault Injector (For Hackathon Demonstration)',
    isSynthetic: true,
  },
};

export const STORAGE_KEY_TELEMETRY_MODE = 'vision_telemetry_mode';

/**
 * Get active telemetry mode from localStorage or default to EMPIRICAL
 */
export function getSavedTelemetryMode() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_TELEMETRY_MODE);
    if (saved === 'simulation') {
      return TELEMETRY_MODES.DEMO_SIMULATION;
    }
  } catch (e) {
    // Ignore storage errors in restricted contexts
  }
  return TELEMETRY_MODES.EMPIRICAL;
}

/**
 * Save telemetry mode selection to localStorage
 */
export function saveTelemetryMode(modeId) {
  try {
    localStorage.setItem(STORAGE_KEY_TELEMETRY_MODE, modeId);
  } catch (e) {
    // Ignore
  }
}

/**
 * Pre-configured synthetic demonstration faults
 */
export const SYNTHETIC_FAULT_SCENARIOS = [
  {
    id: 'hpc_clearance',
    component: 'hpc',
    name: 'HPC Rotor Blade Tip Clearance Wear',
    severity: 0.75,
    tag: 'Primary C-MAPSS Driver',
    description: 'Compressor blade tip abrasion and seal leakage causing T30 thermal surge and loss of pressure ratio.',
    sensorDeltas: { s3: +24.5, s7: -7.2, s9: +38.0 },
    recommendation: 'Perform borescope inspection of 7th-9th stage HPC rotor blades; measure tip-to-casing gap.',
  },
  {
    id: 'combustor_nozzle',
    component: 'combustor',
    name: 'Fuel Nozzle Coking & Pattern Distort',
    severity: 0.6,
    tag: 'Thermal Hotspot',
    description: 'Partially clogged fuel nozzle swirlers creating localized high-temperature flame impingement.',
    sensorDeltas: { s12: +16.0, s17: +4.8 },
    recommendation: 'Ultrasonic solvent cleaning of fuel manifold nozzle injectors; verify flow pattern symmetry.',
  },
  {
    id: 'hpt_tbc',
    component: 'hpt',
    name: 'HPT Thermal Barrier Coating (TBC) Spallation',
    severity: 0.85,
    tag: 'Thermal Fatigue',
    description: 'Ceramic topcoat flaking on high-pressure turbine nozzle guide vanes under extreme thermal cycling.',
    sensorDeltas: { s20: -1.6, s3: +12.0 },
    recommendation: 'Hot section inspection; replace stage 1 nozzle guide vanes showing ceramic coating loss.',
  },
  {
    id: 'lpt_shroud',
    component: 'lpt',
    name: 'LPT Shroud Segment Rub & Wear',
    severity: 0.5,
    tag: 'EGT Surge',
    description: 'Low-pressure turbine abradable seal wear causing inter-stage gas bypass and elevated EGT margin loss.',
    sensorDeltas: { s4: +18.4, s21: -0.6 },
    recommendation: 'Inspect LPT exhaust diffuser area; verify exhaust gas temperature (T50) sensor calibration.',
  },
];

