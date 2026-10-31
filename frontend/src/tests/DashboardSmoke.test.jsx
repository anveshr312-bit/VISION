/**
 * VISION: Dashboard Component Smoke Test
 * Vital Intelligence for System Integrity, Observation & Nostics
 */

import React from 'react';
import { DEMO_PRESETS } from '../utils/demoPresets.js';
import { OFFLINE_FLEET_CACHE, getOfflineEngineDetail } from '../services/apiFallback.js';
import { TELEMETRY_MODES } from '../utils/telemetryModes.js';
import { COMPONENT_MAP, computeComponentHealth } from '../utils/componentSensorMap.js';

export function runDashboardSmokeChecks() {
  const results = [];

  // Check 1: Offline Fleet Cache Integrity
  if (!OFFLINE_FLEET_CACHE || OFFLINE_FLEET_CACHE.length !== 100) {
    throw new Error(`Offline fleet cache expected 100 units, got ${OFFLINE_FLEET_CACHE?.length}`);
  }
  results.push('Offline fleet cache verified (100 engines)');

  // Check 2: Offline Engine Detail
  const unit1 = getOfflineEngineDetail(1);
  if (!unit1 || unit1.unit_id !== 1 || !unit1.sensor_history) {
    throw new Error('Offline engine detail unit 1 invalid');
  }
  results.push('Offline engine detail verified');

  // Check 3: Demo Presets
  if (!DEMO_PRESETS || DEMO_PRESETS.length !== 4) {
    throw new Error(`Expected 4 demo presets, got ${DEMO_PRESETS?.length}`);
  }
  results.push('Demo presets verified (4 curated scenarios)');

  // Check 4: Telemetry Modes
  if (!TELEMETRY_MODES.EMPIRICAL || !TELEMETRY_MODES.DEMO_SIMULATION) {
    throw new Error('Telemetry modes missing');
  }
  results.push('Dual telemetry modes verified');

  // Check 5: Component Sensor Mapping
  const components = ['fan', 'lpc', 'hpc', 'combustor', 'hpt', 'lpt'];
  for (const c of components) {
    if (!COMPONENT_MAP[c]) throw new Error(`Missing component map for ${c}`);
  }
  results.push('All 6 turbofan component mappings verified');

  return results;
}

export default function DashboardSmoke() {
  return null;
}

