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

