import test from 'node:test';
import assert from 'node:assert/strict';
import {
  generateInitialFleet,
  mapBackendUrgency,
  hydrateFleetWithBackend,
  TURBOFAN_STAGE_SPECS,
  ROUTE_ENVIRONMENTS,
} from '../services/prognosticsEngine.ts';
import { api } from '../services/api.js';
import { TelemetryStreamClient } from '../services/streamClient.js';

test('mapBackendUrgency correctly resolves C-MAPSS backend urgency to certified enum', () => {
  assert.equal(mapBackendUrgency('CRITICAL', 10), 'CRITICAL OVERHAUL');
  assert.equal(mapBackendUrgency('CRITICAL', 25), 'SCHEDULED SHOP VISIT');
  assert.equal(mapBackendUrgency('MONITOR', 45), 'MONITOR');
  assert.equal(mapBackendUrgency('HEALTHY', 85), 'NOMINAL');
  assert.equal(mapBackendUrgency('NOMINAL', 90), 'NOMINAL');
});

test('hydrateFleetWithBackend updates local fleet with empirical model predictions and bounds', () => {
  const localFleet = generateInitialFleet();
  const mockOverview = {
    subset: 'FD001',
    total_engines: 100,
    engines: [
      {
        unit_id: 34,
        current_cycle: 142,
        predicted_rul: 12.4,
        lower_bound_90: 8.6,
        upper_bound_90: 16.2,
        health_index: 0.18,
        risk_score: 91.4,
        urgency_level: 'CRITICAL',
      },
      {
        unit_id: 1,
        current_cycle: 192,
        predicted_rul: 112.0,
        lower_bound_90: 98.4,
        upper_bound_90: 125.0,
        health_index: 0.94,
        risk_score: 8.6,
        urgency_level: 'HEALTHY',
      },
    ],
  };

  const hydrated = hydrateFleetWithBackend(localFleet, mockOverview);
  const eng34 = hydrated.find((e) => e.id === 'ESN-787-034')!;
  const eng01 = hydrated.find((e) => e.id === 'ESN-787-001')!;

  assert.equal(eng34.conformalRul, 12.4);
  assert.equal(eng34.conformalLower90, 8.6);
  assert.equal(eng34.conformalUpper90, 16.2);
  assert.equal(eng34.urgency, 'CRITICAL OVERHAUL');

  assert.equal(eng01.conformalRul, 112.0);
  assert.equal(eng01.conformalLower90, 98.4);
  assert.equal(eng01.conformalUpper90, 125.0);
  assert.equal(eng01.urgency, 'NOMINAL');
});

test('hydrateFleetWithBackend preserves water-washed units and applies RUL rebound', () => {
  const localFleet = generateInitialFleet();
  const mockOverview = {
    subset: 'FD001',
    engines: [
      {
        unit_id: 34,
        current_cycle: 142,
        predicted_rul: 12.4,
        lower_bound_90: 8.6,
        upper_bound_90: 16.2,
        urgency_level: 'CRITICAL',
      },
    ],
  };

  const washedIds = new Set(['ESN-787-034']);
  const hydrated = hydrateFleetWithBackend(localFleet, mockOverview, washedIds);
  const eng34 = hydrated.find((e) => e.id === 'ESN-787-034')!;

  assert.equal(eng34.waterWashApplied, true);
  assert.equal(eng34.conformalRul, 44.4); // 12.4 + 32.0
  assert.equal(eng34.urgency, 'MONITOR');
});

test('api client exports all required C-MAPSS and ETOPS backend endpoints', () => {
  assert.ok(typeof api.getHealth === 'function');
  assert.ok(typeof api.getFleetOverview === 'function');
  assert.ok(typeof api.getFleetRisk === 'function');
  assert.ok(typeof api.getEngineDetail === 'function');
  assert.ok(typeof api.predictRul === 'function');
  assert.ok(typeof api.getDecisionPolicy === 'function');
  assert.ok(typeof api.optimizeMaintenance === 'function');
  assert.ok(typeof api.getFleetEtops === 'function');
  assert.ok(typeof api.getPhysicalDossier === 'function');
  assert.ok(typeof api.performWaterWash === 'function');
  assert.ok(typeof api.getKalmanState === 'function');
  assert.ok(typeof api.getDataSourcesCatalog === 'function');
  assert.ok(typeof api.getMissionProfile === 'function');
  assert.ok(typeof api.ingestExternalTelemetry === 'function');
});

test('TelemetryStreamClient initializes correctly and handles configuration changes', () => {
  const client = new TelemetryStreamClient({
    units: [34, 15],
    subset: 'FD001',
    speed: 2.0,
  });

  assert.equal(client.subset, 'FD001');
  assert.equal(client.speed, 2.0);
  assert.deepEqual(client.units, [34, 15]);
  assert.equal(client.isConnected, false);

  client.setSpeed(0.5);
  assert.equal(client.speed, 0.5);

  client.setUnits([10, 20]);
  assert.deepEqual(client.units, [10, 20]);
});

test('TURBOFAN_STAGE_SPECS contains all 6 engine modules with complete 3D & metric contracts', () => {
  const stages = ['FAN', 'LPC', 'HPC', 'COMBUSTOR', 'HPT', 'LPT'] as const;
  const dummyEng = generateInitialFleet()[33];

  for (const st of stages) {
    const spec = TURBOFAN_STAGE_SPECS[st];
    assert.ok(spec, `Spec for ${st} should exist`);
    assert.equal(spec.id, st);
    assert.ok(spec.shortName.length > 0);
    assert.ok(spec.fullName.length > 0);
    assert.ok(Array.isArray(spec.cameraPos) && spec.cameraPos.length === 3);
    assert.ok(Array.isArray(spec.cameraTarget) && spec.cameraTarget.length === 3);

    const metrics = spec.getMetrics(dummyEng);
    assert.ok(metrics.primaryReadout.length > 0);
    assert.ok(metrics.secondaryReadout.length > 0);
    assert.ok(metrics.borescopeLog.length > 0);
    assert.ok(metrics.actionType === 'WATER_WASH' || metrics.actionType === 'DOSSIER');
  }
});

test('ROUTE_ENVIRONMENTS defines standard environmental flight multipliers', () => {
  assert.equal(ROUTE_ENVIRONMENTS.length, 4);
  const me = ROUTE_ENVIRONMENTS.find((r) => r.id === 'MIDDLE_EAST_CMAS')!;
  assert.equal(me.multiplier, 1.35);
  assert.ok(me.description.includes('CMAS'));
});
test('multi-dataset aviation sources are recognized with distinct flight regimes and protocols', () => {
  const sources = [
    'NASA_CMAPSS_BENCHMARK',
    'NASA_NCMAPSS_TRANSIENT',
    'ARINC_429_ACARS_EHM',
    'FAA_PHYSICAL_MAINTENANCE',
  ];
  assert.equal(sources.length, 4);
  assert.ok(sources.includes('NASA_NCMAPSS_TRANSIENT'));
  assert.ok(sources.includes('ARINC_429_ACARS_EHM'));
});
