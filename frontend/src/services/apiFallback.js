/**
 * VISION: Offline Telemetry Fallback Cache
 * Vital Intelligence for System Integrity, Observation & Nostics
 *
 * Provides deterministic in-memory cached fleet metrics and engine telemetry
 * if the backend is momentarily restarting, disconnected, or run in air-gapped demo mode.
 */

// Pre-cached summary cohort for 100 test engines of FD001
export const OFFLINE_FLEET_CACHE = Array.from({ length: 100 }, (_, idx) => {
  const unit_id = idx + 1;
  // Deterministic realistic RUL curve
  let rul = Math.max(5, Math.round(115 - (unit_id * 1.05) % 110));
  if (unit_id === 34) rul = 12.4; // Critical demo scenario engine
  if (unit_id === 1) rul = 28.5;  // Featured engine

  const cycle = 100 + (unit_id % 90);
  const lb90 = Math.max(0, rul - (rul < 20 ? 4.5 : 12.0));
  const ub90 = rul + (rul < 20 ? 6.5 : 16.0);

  let urgency = 'HEALTHY';
  if (lb90 <= 15.0 || rul < 20.0) urgency = 'CRITICAL';
  else if (rul < 50.0) urgency = 'ADVISORY';

  return {
    unit_id,
    current_cycle: cycle,
    predicted_rul: rul,
    conformal_lower_90: lb90,
    conformal_upper_90: ub90,
    risk_score: urgency === 'CRITICAL' ? 88 : urgency === 'ADVISORY' ? 45 : 12,
    health_index: Math.min(100, Math.max(8, (rul / 125) * 100)),
    urgency,
    subset: 'FD001',
    sensors: {
      s2: 642.3,
      s3: 1585.0 + (125 - rul) * 0.28,
      s4: 1400.0 + (125 - rul) * 0.18,
      s7: 553.5 - (125 - rul) * 0.08,
      s8: 2388.0,
      s9: 9050.0 + (125 - rul) * 0.35,
      s11: 47.2,
      s12: 521.1,
    },
  };
});

/**
 * Generate synthetic sensor history for an offline unit
 */
export function getOfflineEngineDetail(unitId) {
  const summary = OFFLINE_FLEET_CACHE.find((e) => e.unit_id === Number(unitId)) || OFFLINE_FLEET_CACHE[0];
  const history = [];
  const startCyc = Math.max(1, summary.current_cycle - 60);

  for (let c = startCyc; c <= summary.current_cycle; c++) {
    const prog = (c - startCyc) / (summary.current_cycle - startCyc || 1);
    history.push({
      cycle: c,
      s2: 641.8 + prog * 1.2,
      s3: 1582.0 + prog * 28.0 + (Math.sin(c) * 1.5),
      s4: 1398.0 + prog * 18.0,
      s7: 554.2 - prog * 8.0,
      s8: 2387.8 + prog * 1.5,
      s9: 9048.0 + prog * 35.0,
      s11: 47.0 + prog * 0.8,
      s12: 521.0 - prog * 3.5,
    });
  }

  return {
    unit_id: summary.unit_id,
    subset: 'FD001',
    current_cycle: summary.current_cycle,
    total_cycles: history.length,
    predicted_rul: summary.predicted_rul,
    conformal_lower_90: summary.conformal_lower_90,
    conformal_upper_90: summary.conformal_upper_90,
    health_index: summary.health_index,
    urgency: summary.urgency,
    latest_sensors: summary.sensors,
    sensor_history: history,
    is_offline_cache: true,
  };
}

/**
 * Generate offline Aircraft Twin-Engine ETOPS pairing data
 */
export function getOfflineFleetEtops() {
  const aircraft = [];
  let asymmetricCount = 0;
  let criticalCount = 0;
  let cascadeCount = 0;
  const ETOPS_FLOOR = 25.0;

  for (let i = 1; i <= 100; i += 2) {
    const acIdx = Math.floor((i + 1) / 2);
    const acId = `AC-${100 + acIdx}`;
    const tailNumber = `N787-${String(acIdx).padStart(2, '0')}`;

    const left = OFFLINE_FLEET_CACHE.find((e) => e.unit_id === i) || OFFLINE_FLEET_CACHE[0];
    const right = OFFLINE_FLEET_CACHE.find((e) => e.unit_id === i + 1) || OFFLINE_FLEET_CACHE[1];

    const lbLeft = left.conformal_lower_90 ?? Math.max(0, left.predicted_rul - 12);
    const lbRight = right.conformal_lower_90 ?? Math.max(0, right.predicted_rul - 12);
    const governingRul = Math.min(lbLeft, lbRight);
    const delta = Math.abs(left.predicted_rul - right.predicted_rul);

    const isCritical = left.urgency === 'CRITICAL' || right.urgency === 'CRITICAL' || governingRul <= 10;
    let isCascade = false;
    let cascadePullCycles = 0.0;
    let cascadeEngineId = null;

    if (!isCritical) {
      if (lbLeft < ETOPS_FLOOR && lbRight >= ETOPS_FLOOR) {
        cascadePullCycles = Number((lbRight - lbLeft).toFixed(1));
        cascadeEngineId = right.unit_id;
        isCascade = true;
        cascadeCount++;
      } else if (lbRight < ETOPS_FLOOR && lbLeft >= ETOPS_FLOOR) {
        cascadePullCycles = Number((lbLeft - lbRight).toFixed(1));
        cascadeEngineId = left.unit_id;
        isCascade = true;
        cascadeCount++;
      }
    }

    const isAsymmetric = !isCritical && !isCascade && delta >= 35.0;

    let status = 'COMPLIANT';
    let dispatchCleared = true;
    let directive = `ETOPS-180 AUTHORISED — Both engines within compliance envelope. Governing lower bound: ${governingRul.toFixed(1)} cycles.`;

    if (isCritical) {
      status = 'CRITICAL_GROUND';
      dispatchCleared = false;
      criticalCount++;
      directive = `DISPATCH BLOCKED — Engine(s) below minimum serviceable limit. Governing lower bound: ${governingRul.toFixed(1)} cycles.`;
    } else if (isCascade) {
      status = 'CASCADE_PULL';
      dispatchCleared = false;
      directive = `ETOPS-180 NON-COMPLIANT — Cascade Maintenance Pull Enforced. Engine #${cascadeEngineId} accelerated by ${cascadePullCycles} cycles to match paired engine floor.`;
    } else if (isAsymmetric) {
      status = 'ASYMMETRY_WARNING';
      asymmetricCount++;
      directive = `ADVISORY — Wing RUL asymmetry Δ=${delta.toFixed(1)} cycles exceeds 35c threshold. Stagger shop visits.`;
    }

    const aogRiskSavings = isCascade ? 920000 : 0;
    const cascadeCost = isCascade ? cascadePullCycles * 4800 : (isCritical ? 2400000 : 0);
    const netCascadeBenefit = isCascade ? aogRiskSavings - cascadeCost : (isCritical ? -cascadeCost : 0);

    aircraft.push({
      aircraft_id: acId,
      tail_number: tailNumber,
      route_capability: dispatchCleared ? 'ETOPS-180' : 'DOMESTIC_ONLY',
      dual_engine_dispatch_cleared: dispatchCleared,
      left_engine: {
        unit_id: left.unit_id,
        predicted_rul: left.predicted_rul,
        conformal_lower_bound_90: lbLeft,
        urgency: left.urgency,
        etops_compliant: lbLeft >= ETOPS_FLOOR,
      },
      right_engine: {
        unit_id: right.unit_id,
        predicted_rul: right.predicted_rul,
        conformal_lower_bound_90: lbRight,
        urgency: right.urgency,
        etops_compliant: lbRight >= ETOPS_FLOOR,
      },
      wing_rul_delta: Number(delta.toFixed(1)),
      wing_lb_delta: Number(Math.abs(lbLeft - lbRight).toFixed(1)),
      governing_lower_bound: Number(governingRul.toFixed(1)),
      etops_status: status,
      dispatch_directive: directive,
      cascade_enforcement: isCascade,
      cascade_pull_cycles: cascadePullCycles,
      cascade_engine_id: cascadeEngineId,
      economics: {
        cascade_cost_usd: cascadeCost,
        aog_risk_savings_usd: aogRiskSavings,
        net_cascade_benefit_usd: netCascadeBenefit,
      },
    });
  }

  const compliantCount = aircraft.length - criticalCount - asymmetricCount - cascadeCount;
  const totalCascadeSavings = aircraft
    .filter(a => a.cascade_enforcement)
    .reduce((acc, a) => acc + a.economics.net_cascade_benefit_usd, 0);

  return {
    subset: 'FD001',
    regulation: 'EASA CS-ETOPS / FAA 14 CFR § 121.374 / ETOPS-180',
    total_aircraft: aircraft.length,
    critical_aircraft_count: criticalCount,
    cascade_pull_count: cascadeCount,
    asymmetric_risk_count: asymmetricCount,
    compliant_count: compliantCount,
    etops_180_cleared_count: aircraft.filter(a => a.dual_engine_dispatch_cleared).length,
    total_cascade_net_savings_usd: totalCascadeSavings,
    aircraft,
  };
}

/**
 * Generate offline physical inspection dossier (LLP clock, oil spectrometry, borescope)
 */
export function getOfflinePhysicalDossier(unitId) {
  const id = Number(unitId) || 1;
  const engine = OFFLINE_FLEET_CACHE.find((e) => e.unit_id === id) || OFFLINE_FLEET_CACHE[0];
  const rul = engine.predicted_rul;

  const hptDiskLimit = 15000;
  const baseCycles = 14200 + ((id * 17) % 650);
  const currentCycles = baseCycles + (engine.current_cycle || 140);
  const llpRemaining = Math.max(10, hptDiskLimit - currentCycles);
  const dualConstraint = Math.min(rul, llpRemaining);

  const severity = Math.max(0, (125 - rul) / 125);
  const fePpm = Number((2.1 + severity * 3.8).toFixed(1));
  const tiPpm = Number((0.2 + severity * 0.9).toFixed(2));
  const agPpm = Number((0.6 + severity * 1.8).toFixed(1));
  const siPpm = Number((4.5 + (id % 9) * 0.7).toFixed(1));

  const oilStatus = fePpm > 5.0 || agPpm > 2.0 ? 'CRITICAL' : (fePpm > 4.0 || agPpm > 1.4 ? 'ADVISORY' : 'NOMINAL');

  return {
    unit_id: id,
    subset: 'FD001',
    current_flight_cycle: engine.current_cycle,
    conformal_predicted_rul: rul,
    llp_regulatory_clock: {
      component: 'High-Pressure Turbine Rotor Disk',
      hard_limit_cycles: hptDiskLimit,
      accumulated_cycles: currentCycles,
      remaining_cycles_to_mandatory_scrap: llpRemaining,
      governing_pull_constraint: rul < llpRemaining ? 'PROGNOSTIC_WEAR (Conformal RUL)' : 'REGULATORY_LLP_LIMIT (HPT Disk)',
      dual_constraint_pull_cycle: Number(dualConstraint.toFixed(1)),
    },
    oil_spectrometry: {
      sample_status: oilStatus,
      iron_fe_ppm: fePpm,
      iron_fe_threshold: 5.0,
      titanium_ti_ppm: tiPpm,
      titanium_ti_threshold: 1.0,
      silver_ag_ppm: agPpm,
      silver_ag_threshold: 2.0,
      silicon_si_ppm: siPpm,
      silicon_si_threshold: 10.0,
    },
    borescope_inspection: {
      overall_structural_status: rul >= 25 ? 'AIRWORTHY' : 'MANDATORY_OVERHAUL',
      last_inspection_cycle: Math.max(1, engine.current_cycle - (engine.current_cycle % 50)),
      findings: [
        {
          subsystem: 'High-Pressure Compressor (HPC) Stage 3 Stator',
          inspection_type: 'Optical Borescope 4mm HD Probe',
          findings: rul < 25
            ? 'Severe leading-edge micro-erosion and tip shroud rubbing detected.'
            : 'Minor leading-edge pitting. Chord loss < 0.15mm. Within AMM 72-00 limits.',
          severity: rul < 25 ? 'CRITICAL' : (rul < 50 ? 'ADVISORY' : 'NOMINAL'),
        },
        {
          subsystem: 'High-Pressure Turbine (HPT) Nozzle Guide Vanes',
          inspection_type: 'Thermal Camera & High-Temp Borescope',
          findings: rul < 35
            ? 'Thermal barrier coating (TBC) spallation: 6.2% surface area. Localized hot gas erosion.'
            : 'TBC coating intact. Film-cooling holes 98% unobstructed.',
          severity: rul < 20 ? 'CRITICAL' : (rul < 45 ? 'ADVISORY' : 'NOMINAL'),
        },
        {
          subsystem: 'Annular Combustor Swirler Nozzles',
          inspection_type: 'Optical Visual Inspection',
          findings: 'Carbon coking deposits minimal. Fuel spray pattern factor nominal (0.24).',
          severity: 'NOMINAL',
        },
      ],
    },
  };
}

/**
 * Generate offline water wash action response
 */
export function getOfflineWaterWash(unitId) {
  const id = Number(unitId) || 34;
  const engine = OFFLINE_FLEET_CACHE.find((e) => e.unit_id === id) || OFFLINE_FLEET_CACHE[0];
  const originalRul = engine.predicted_rul;
  const cyclesGained = 32.0;

  return {
    unit_id: id,
    subset: 'FD001',
    action: 'COMPRESSOR_WATER_WASH',
    action_id: `WW-2026-${String(id).padStart(3, '0')}`,
    original_rul: originalRul,
    restored_rul: Math.min(125.0, originalRul + cyclesGained),
    cycles_gained: cyclesGained,
    t30_temperature_reduction_deg_r: 14.2,
    p30_pressure_ratio_recovery_pct: 1.25,
    compressor_fouling_cleared_pct: 94.0,
    maintenance_signoff: {
      authorized_by: 'FAA / EASA Certified Airframe & Powerplant Inspector',
      procedure: 'AMM 72-00-00 Turbofan Core Detergent Descale',
      airworthiness_certificate: 'APPROVED: Core aerodynamic efficiency restored. Next wash due in 350 cycles.',
    },
  };
}


