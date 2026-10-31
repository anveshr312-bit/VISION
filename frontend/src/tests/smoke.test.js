/**
 * VISION: Frontend Component & Module Smoke Test
 * Vital Intelligence for System Integrity, Observation & Nostics
 */

import { COMPONENT_MAP, computeComponentHealth } from '../utils/componentSensorMap.js';
import { TELEMETRY_MODES } from '../utils/telemetryModes.js';
import { ComponentSelector } from '../components_3d/ComponentSelector.js';
import { buildProceduralTurbofan } from '../components_3d/engineGeometries.js';
import { DEMO_PRESETS } from '../utils/demoPresets.js';
import { OFFLINE_FLEET_CACHE, getOfflineEngineDetail } from '../services/apiFallback.js';

console.log('--- RUNNING VISION FRONTEND SMOKE TESTS ---');

// 1. Verify component sensor map
const hpcConfig = COMPONENT_MAP.hpc;
if (!hpcConfig || hpcConfig.id !== 'hpc') {
  throw new Error('HPC config mismatch in componentSensorMap');
}
const healthNominal = computeComponentHealth('hpc', { s3: 1585.0, s7: 553.0 });
if (healthNominal <= 0 || healthNominal > 100) {
  throw new Error(`Invalid health score: ${healthNominal}`);
}
console.log('✔ componentSensorMap passed');

// 2. Verify telemetry modes
if (TELEMETRY_MODES.EMPIRICAL.id !== 'empirical' || TELEMETRY_MODES.DEMO_SIMULATION.id !== 'simulation') {
  throw new Error('Telemetry modes mismatch');
}
console.log('✔ telemetryModes passed');

// 3. Verify 3D component focus targets
const selector = new ComponentSelector();
selector.setFocus('hpc');
if (selector.activeComponent !== 'hpc') {
  throw new Error('ComponentSelector setFocus failed');
}
console.log('✔ ComponentSelector passed');

// 4. Verify procedural 3D turbofan geometry builder
const engine = buildProceduralTurbofan();
if (!engine.engineRoot || !engine.components.fan || !engine.components.hpc) {
  throw new Error('Procedural turbofan geometry missing expected components');
}
console.log('✔ Procedural engine geometry passed');

// 5. Verify offline telemetry fallback cache
if (!OFFLINE_FLEET_CACHE || OFFLINE_FLEET_CACHE.length !== 100) {
  throw new Error(`Offline cache length mismatch: expected 100, got ${OFFLINE_FLEET_CACHE?.length}`);
}
const offlineUnit1 = getOfflineEngineDetail(1);
if (!offlineUnit1 || offlineUnit1.unit_id !== 1 || !offlineUnit1.sensor_history) {
  throw new Error('Offline engine detail unit 1 verification failed');
}
console.log('✔ offline API fallback cache passed');

// 6. Verify presentation demo presets
if (!DEMO_PRESETS || DEMO_PRESETS.length !== 4) {
  throw new Error(`Demo presets mismatch: expected 4, got ${DEMO_PRESETS?.length}`);
}
console.log('✔ presentation demo presets passed');

console.log('--- ALL FRONTEND SMOKE TESTS PASSED (100%) ---');
