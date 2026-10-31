/**
 * VISION: Aerospace Turbofan Component to C-MAPSS Sensor Mapping & Physics Dictionary
 * Vital Intelligence for System Integrity, Observation & Nostics
 *
 * Thermodynamic Engineering Principles:
 * -------------------------------------
 * In high-bypass commercial aero-engines, sensor signatures correspond to distinct
 * thermodynamic stations along the gas path.
 *
 * Primary C-MAPSS Degradation Modes:
 * 1. HPC Flow Capacity and Efficiency Decrement (detected via elevated T30, depressed P30).
 * 2. HPT/LPT Thermal Creep & Expansion (detected via elevated T50 EGT analogue and coolant bleed W31/W32).
 */

export const COMPONENT_MAP = {
  fan: {
    id: 'fan',
    name: 'Fan Rotor & Spinner',
    shortName: 'Fan',
    spool: 'N1 Low-Pressure Spool',
    station: 'Station 1.0 - 2.0 (Inlet to Fan Outlet)',
    role: 'Generates ~80% of total aircraft thrust via high-bypass duct air; supercharges core intake flow.',
    sensors: [
      {
        key: 's8',
        code: 'Nf',
        label: 'Physical Fan Speed',
        unit: 'rpm',
        nominal: 2388.0,
        normalRange: [2380, 2400],
        description: 'Direct rotational shaft velocity of the N1 low-pressure spool.',
      },
      {
        key: 's13',
        code: 'NRf',
        label: 'Corrected Fan Speed',
        unit: 'rpm',
        nominal: 2388.0,
        normalRange: [2375, 2410],
        description: 'Aerodynamically corrected fan speed normalized to standard sea-level temperature.',
      },
      {
        key: 's15',
        code: 'BPR',
        label: 'Bypass Ratio',
        unit: 'ratio',
        nominal: 8.44,
        normalRange: [8.35, 8.55],
        description: 'Ratio of mass air flow bypassing the core to mass flow entering the core.',
      },
    ],
    failureModes: ['Blade leading-edge erosion', 'Foreign Object Damage (FOD)', 'Rotor unbalance vibration'],
  },

  lpc: {
    id: 'lpc',
    name: 'Low-Pressure Compressor (LPC)',
    shortName: 'LPC (Booster)',
    spool: 'N1 Low-Pressure Spool',
    station: 'Station 2.0 - 2.5 (Core Inlet to Booster Discharge)',
    role: 'Initial multi-stage compression booster driven by the low-pressure turbine.',
    sensors: [
      {
        key: 's2',
        code: 'T24',
        label: 'LPC Outlet Temperature',
        unit: '°R',
        nominal: 642.5,
        normalRange: [641.5, 644.0],
        description: 'Total stagnation temperature at the booster discharge into the HPC inlet.',
      },
    ],
    failureModes: ['Blade surface fouling', 'Stator vane shroud wear', 'Tip clearance gap growth'],
  },

  hpc: {
    id: 'hpc',
    name: 'High-Pressure Compressor (HPC)',
    shortName: 'HPC (Core)',
    spool: 'N2 High-Pressure Spool',
    station: 'Station 2.5 - 3.0 (HPC Inlet to Diffuser Outlet)',
    role: 'Primary core compression engine (5 titanium stages, overall pressure ratio ~25:1). Core degradation driver in C-MAPSS.',
    sensors: [
      {
        key: 's3',
        code: 'T30',
        label: 'HPC Outlet Temperature',
        unit: '°R',
        nominal: 1588.0,
        normalRange: [1580, 1600],
        description: 'Compressor discharge temperature entering the combustion diffuser. Sharp rise indicates blade stall/wear.',
      },
      {
        key: 's7',
        code: 'P30',
        label: 'HPC Outlet Pressure',
        unit: 'psia',
        nominal: 553.5,
        normalRange: [550, 556],
        description: 'Total discharge pressure delivered to the fuel nozzles.',
      },
      {
        key: 's11',
        code: 'Ps30',
        label: 'Static HPC Outlet Pressure',
        unit: 'psia',
        nominal: 47.4,
        normalRange: [47.0, 48.0],
        description: 'Static wall pressure at the diffuser throat.',
      },
      {
        key: 's9',
        code: 'Nc',
        label: 'Physical Core Speed',
        unit: 'rpm',
        nominal: 9060.0,
        normalRange: [9040, 9080],
        description: 'Physical rotational speed of the high-pressure spool.',
      },
      {
        key: 's14',
        code: 'NRc',
        label: 'Corrected Core Speed',
        unit: 'rpm',
        nominal: 8130.0,
        normalRange: [8110, 8150],
        description: 'Corrected N2 core speed normalized by compressor inlet temperature.',
      },
    ],
    failureModes: ['Blade tip clearance expansion', 'Aerodynamic flow capacity degradation', 'Adiabatic efficiency decrement'],
  },

  combustor: {
    id: 'combustor',
    name: 'Annular Combustion Chamber',
    shortName: 'Combustor',
    spool: 'Static Thermodynamic Core',
    station: 'Station 3.0 - 4.0 (Burner Chamber)',
    role: 'Atomizes jet fuel through 16 nozzles, mixing with high-pressure air to sustain continuous combustion.',
    sensors: [
      {
        key: 's12',
        code: 'phi',
        label: 'Fuel Flow Ratio to Ps30',
        unit: 'pps/psi',
        nominal: 521.8,
        normalRange: [518, 524],
        description: 'Fuel mass flow rate normalized by compressor static pressure.',
      },
      {
        key: 's17',
        code: 'htBleed',
        label: 'Bleed Enthalpy',
        unit: 'BTU/lbm',
        nominal: 392.0,
        normalRange: [390, 395],
        description: 'Specific enthalpy of bleed air extracted for cabin environmental and anti-icing systems.',
      },
    ],
    failureModes: ['Fuel nozzle coking', 'Flame liner thermal cracking', 'Circumferential pattern factor distortion'],
  },

  hpt: {
    id: 'hpt',
    name: 'High-Pressure Turbine (HPT)',
    shortName: 'HPT',
    spool: 'N2 High-Pressure Spool',
    station: 'Station 4.0 - 4.5 (Turbine Nozzle Guide Vanes to HPT Rotor)',
    role: 'Extracts expansion energy immediately downstream of burner to drive the high-pressure compressor.',
    sensors: [
      {
        key: 's20',
        code: 'W31',
        label: 'HPT Coolant Bleed',
        unit: 'lbm/s',
        nominal: 38.85,
        normalRange: [38.5, 39.2],
        description: 'Compressor discharge air bled internally to cool single-crystal HPT blades.',
      },
    ],
    failureModes: ['Thermal Barrier Coating (TBC) spallation', 'Creep blade stretch', 'Cooling hole oxidation/plugging'],
  },

  lpt: {
    id: 'lpt',
    name: 'Low-Pressure Turbine (LPT)',
    shortName: 'LPT',
    spool: 'N1 Low-Pressure Spool',
    station: 'Station 4.5 - 5.0 (Transition Duct to Exhaust Mixer)',
    role: '4-stage expansion turbine driving the forward fan and LPC via the central concentric drive shaft.',
    sensors: [
      {
        key: 's4',
        code: 'T50',
        label: 'LPT Outlet Temperature (EGT)',
        unit: '°R',
        nominal: 1404.0,
        normalRange: [1395, 1415],
        description: 'Exhaust Gas Temperature (EGT analogue). Most sensitive overall thermodynamic efficiency indicator.',
      },
      {
        key: 's21',
        code: 'W32',
        label: 'LPT Coolant Bleed',
        unit: 'lbm/s',
        nominal: 23.3,
        normalRange: [23.1, 23.5],
        description: 'Secondary cooling air bled to purge LPT cavity discs.',
      },
    ],
    failureModes: ['Trailing-edge erosion', 'Rotor disc creep elongation', 'Interstage seal gas leakage'],
  },
};

/**
 * Retrieve configuration dictionary for a given component identifier.
 */
export function getComponentConfig(componentId) {
  return COMPONENT_MAP[componentId] || null;
}

/**
 * Calculate heuristic subsystem health percentage (0% to 100%) from raw sensor readings.
 */
export function computeComponentHealth(componentId, latestSensors = {}) {
  const config = COMPONENT_MAP[componentId];
  if (!config || !latestSensors || Object.keys(latestSensors).length === 0) {
    return 100.0;
  }

  // Weight primary sensor anomalies
  let totalDeviation = 0.0;
  let count = 0;

  for (const s of config.sensors) {
    const val = latestSensors[s.key] !== undefined ? latestSensors[s.key] : latestSensors[s.code];
    if (val !== undefined && s.normalRange) {
      const [minN, maxN] = s.normalRange;
      const span = maxN - minN || 1.0;
      if (val > maxN) {
        totalDeviation += (val - maxN) / span;
      } else if (val < minN) {
        totalDeviation += (minN - val) / span;
      }
      count++;
    }
  }

  if (count === 0) return 100.0;

  // Each standard deviation unit drops health by ~25%
  const avgDev = totalDeviation / count;
  const health = Math.max(0.0, Math.min(100.0, 100.0 - avgDev * 28.0));
  return Math.round(health * 10) / 10;
}

/**
 * Return health status badge text and CSS color tokens.
 */
export function getComponentStatusBadge(healthScore) {
  if (healthScore >= 80.0) {
    return {
      status: 'NOMINAL',
      label: 'Nominal Condition',
      textColor: 'text-emerald-400',
      bgColor: 'bg-emerald-950/60',
      borderColor: 'border-emerald-500/50',
      recommendation: 'Operating within certified limits. Normal flight envelope.',
    };
  } else if (healthScore >= 50.0) {
    return {
      status: 'MONITOR',
      label: 'Thermal Creep Detected',
      textColor: 'text-amber-400',
      bgColor: 'bg-amber-950/60',
      borderColor: 'border-amber-500/50',
      recommendation: 'Elevated thermal degradation observed. Monitor at next turnaround.',
    };
  } else {
    return {
      status: 'CRITICAL',
      label: 'Borescope Inspection Required',
      textColor: 'text-rose-400',
      bgColor: 'bg-rose-950/60',
      borderColor: 'border-rose-500/50',
      recommendation: 'Critical wear limit reached. Schedule immediate hangar inspection.',
    };
  }
}



/**
 * Compute High-Pressure Compressor (HPC) Isentropic Efficiency:
 * eta_hpc = ((P30 / P20)^((gamma - 1)/gamma) - 1) / ((T30 / T20) - 1)
 * gamma = 1.4 for dry air
 */
export function computeIsentropicEfficiency(sensors = {}) {
  const t24 = Number(sensors.s2 || sensors.T24 || 642.5);
  const t30 = Number(sensors.s3 || sensors.T30 || 1588.0);
  const p30 = Number(sensors.s7 || sensors.P30 || 553.5);
  const p24 = 21.6; // LPC booster discharge baseline psia
  
  const gamma = 1.4;
  const exp = (gamma - 1.0) / gamma; // 0.2857
  const pr = p30 / p24;
  const tr = t30 / t24;
  
  if (tr <= 1.0 || pr <= 1.0) return { eta_hpc: 88.5, overall_pr: 37.6, core_pr: 25.6 };
  
  const idealTr = Math.pow(pr, exp);
  const rawEta = ((idealTr - 1.0) / (tr - 1.0)) * 100.0;
  const eta_hpc = Math.max(74.0, Math.min(94.0, rawEta * 0.94));
  
  return {
    eta_hpc: Number(eta_hpc.toFixed(1)),
    overall_pr: Number((p30 / 14.696).toFixed(1)),
    core_pr: Number(pr.toFixed(2)),
  };
}
