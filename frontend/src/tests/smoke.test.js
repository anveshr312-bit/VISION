/**
 * VISION: Frontend Component & Module Smoke Test
 * Vital Intelligence for System Integrity, Observation & Nostics
 */

import { COMPONENT_MAP, computeComponentHealth, computeIsentropicEfficiency } from '../utils/componentSensorMap.js';
import { TELEMETRY_MODES } from '../utils/telemetryModes.js';
import { ComponentSelector } from '../components_3d/ComponentSelector.js';
import { buildProceduralTurbofan } from '../components_3d/engineGeometries.js';
import { DEMO_PRESETS } from '../utils/demoPresets.js';
import {
  OFFLINE_FLEET_CACHE,
  getOfflineEngineDetail,
  getOfflineFleetEtops,
  getOfflinePhysicalDossier,
  getOfflineWaterWash,
} from '../services/apiFallback.js';

console.log('--- RUNNING VISION FRONTEND SMOKE TESTS ---');

// 1. Verify component sensor map & isentropic gas-path efficiency
const hpcConfig = COMPONENT_MAP.hpc;
if (!hpcConfig || hpcConfig.id !== 'hpc') {
  throw new Error('HPC config mismatch in componentSensorMap');
}
const healthNominal = computeComponentHealth('hpc', { s3: 1585.0, s7: 553.0 });
if (healthNominal <= 0 || healthNominal > 100) {
  throw new Error(`Invalid health score: ${healthNominal}`);
}
const aeroEff = computeIsentropicEfficiency({ s2: 642.5, s3: 1588.0, s7: 553.5 });
if (aeroEff.eta_hpc <= 70 || aeroEff.eta_hpc > 95 || aeroEff.overall_pr <= 0) {
  throw new Error(`Invalid isentropic efficiency: ${JSON.stringify(aeroEff)}`);
}
console.log('✔ componentSensorMap & isentropic aerothermal physics passed');

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

// 6. Verify operational modules: ETOPS pairing, Physical Dossier, Water Wash
const etops = getOfflineFleetEtops();
if (!etops || etops.total_aircraft !== 50 || etops.aircraft.length !== 50) {
  throw new Error(`ETOPS offline pairing failed: expected 50 aircraft, got ${etops?.aircraft?.length}`);
}
const dossier = getOfflinePhysicalDossier(34);
if (!dossier || !dossier.llp_regulatory_clock || !dossier.oil_spectrometry || !dossier.borescope_inspection) {
  throw new Error('Physical dossier offline generation failed');
}
const wash = getOfflineWaterWash(34);
if (!wash || wash.cycles_gained !== 32.0 || !wash.maintenance_signoff) {
  throw new Error('Water wash offline simulation failed');
}
console.log('✔ offline API fallback cache & operational modules passed');

// 7. Verify presentation demo presets
if (!DEMO_PRESETS || DEMO_PRESETS.length !== 4) {
  throw new Error(`Demo presets mismatch: expected 4, got ${DEMO_PRESETS?.length}`);
}
console.log('✔ presentation demo presets passed');


// 8. Verify Modern Screens Engine (prognosticsEngine.ts)
const {
  generateInitialFleet,
  pairFleetIntoEtopsWings,
  calculateEconomicSandbox,
  evaluateDualConstraintAirworthiness,
  applyCompressorWaterWash,
  toggleSensorFaultAbstain,
  mergeBackendFleet,
  normalizeUrgency,
} = await import('../services/prognosticsEngine.ts');

const modernFleet = generateInitialFleet();
if (!modernFleet || modernFleet.length !== 100) {
  throw new Error(`Modern fleet length mismatch: expected 100, got ${modernFleet?.length}`);
}

// Check specific prompt reference engines
const eng34 = modernFleet.find((e) => e.id === 'ESN-787-034');
if (!eng34 || eng34.conformalRul !== 12.4 || eng34.flightCycles !== 142) {
  throw new Error(`Engine 34 profile verification failed: ${JSON.stringify(eng34)}`);
}

// Verify ETOPS pairing
const etopsPairs = pairFleetIntoEtopsWings(modernFleet);
if (!etopsPairs || etopsPairs.length !== 50) {
  throw new Error(`ETOPS tail pairs mismatch: expected 50, got ${etopsPairs?.length}`);
}
const hasAsymmetry = etopsPairs.some((p) => p.status === 'ASYMMETRY_WARNING' || p.status === 'CRITICAL_GROUND');
if (!hasAsymmetry) {
  throw new Error('Expected at least one ETOPS asymmetry or critical alert tail');
}

// Verify Economic Sandbox calculation
const sandbox = calculateEconomicSandbox(
  { failureCostCf: 220000, wastedLifeCostCw: 280, leadTimeL: 14, flexDeratePct: 8, routeEnvId: 'CONTINENTAL' },
  modernFleet
);
if (!sandbox || !sandbox.optimalStoppingRulThreshold || !sandbox.hangarSchedule) {
  throw new Error('Economic sandbox calculation failed');
}

// Verify Dual-Constraint Airworthiness
const dossierEval = evaluateDualConstraintAirworthiness(eng34);
if (!dossierEval || !dossierEval.trackingId || typeof dossierEval.isDispatchApproved !== 'boolean') {
  throw new Error('Dual-constraint airworthiness evaluation failed');
}

// Verify Water Wash descaling
const washed = applyCompressorWaterWash(eng34);
if (washed.conformalRul !== eng34.conformalRul + 32.0 || washed.t30 !== eng34.t30 - 14.2) {
  throw new Error('Water wash telemetry update failed');
}

// Verify DO-178C Sensor Fault Abstain
const faulted = toggleSensorFaultAbstain(eng34, true);
if (!faulted.sensorFaultActive || faulted.conformalLower90 !== 0.0 || faulted.conformalUpper90 !== 125.0) {
  throw new Error('Sensor fault abstention failed');
}

// Verify Urgency Normalization
if (normalizeUrgency('CRITICAL') !== 'CRITICAL OVERHAUL') throw new Error('normalizeUrgency CRITICAL failed');
if (normalizeUrgency('MONITOR') !== 'SCHEDULED SHOP VISIT') throw new Error('normalizeUrgency MONITOR failed');
if (normalizeUrgency('HEALTHY') !== 'NOMINAL') throw new Error('normalizeUrgency HEALTHY failed');

// Verify Backend Merge
const merged = mergeBackendFleet(
  [{ unit_id: 34, predicted_rul: 15.5, lower_bound_90: 11.2, upper_bound_90: 19.8, current_cycle: 143, urgency_level: 'CRITICAL' }],
  modernFleet
);
const merged34 = merged.find((e) => e.id === 'ESN-787-034');
if (merged34.conformalRul !== 15.5 || merged34.flightCycles !== 143) {
  throw new Error('Backend merge failed');
}

console.log('✔ modern screens prognosticsEngine, ETOPS pairing & dual-constraint passed');

console.log('--- ALL FRONTEND SMOKE TESTS PASSED (100%) ---');
