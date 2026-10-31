import test from 'node:test';
import assert from 'node:assert/strict';
import {
  generateInitialFleet,
  applyCompressorWaterWash,
  toggleSensorFaultAbstain,
  pairFleetIntoEtopsWings,
  calculateEconomicSandbox,
  evaluateDualConstraintAirworthiness,
} from './prognosticsEngine';

test('generateInitialFleet creates 100 deterministic engines with exact ESN-787-034 telemetry', () => {
  const fleet = generateInitialFleet();
  assert.equal(fleet.length, 100);

  const eng34 = fleet.find((e) => e.id === 'ESN-787-034');
  assert.ok(eng34, 'ESN-787-034 should exist');
  assert.equal(eng34.flightCycles, 142);
  assert.equal(eng34.conformalRul, 12.4);
  assert.equal(eng34.urgency, 'CRITICAL OVERHAUL');
  assert.equal(eng34.t30, 1598.2);
  assert.equal(eng34.p30, 548.1);
  assert.equal(eng34.hpcEfficiencyPct, 82.4);
  assert.equal(eng34.overallPressureRatio, 37.6);
});

test('applyCompressorWaterWash applies AMM 72-00-00 descaling (+32c RUL, -14.2°R T30, +1.25% P30)', () => {
  const fleet = generateInitialFleet();
  const eng34 = fleet.find((e) => e.id === 'ESN-787-034')!;
  const washed = applyCompressorWaterWash(eng34);

  assert.equal(washed.waterWashApplied, true);
  assert.equal(washed.conformalRul, 44.4); // 12.4 + 32.0
  assert.equal(washed.t30, 1584.0); // 1598.2 - 14.2
  assert.equal(washed.p30LossPct, -0.55); // -1.80 + 1.25
  assert.equal(washed.urgency, 'MONITOR');
});

test('toggleSensorFaultAbstain widens conformal interval to [0, 125]c under DO-178C rules', () => {
  const fleet = generateInitialFleet();
  const eng34 = fleet.find((e) => e.id === 'ESN-787-034')!;
  const faulted = toggleSensorFaultAbstain(eng34, true);

  assert.equal(faulted.sensorFaultActive, true);
  assert.equal(faulted.conformalLower90, 0);
  assert.equal(faulted.conformalUpper90, 125);
});

test('pairFleetIntoEtopsWings pairs 100 engines into 50 Boeing 787 tails and flags asymmetry > 40c', () => {
  const fleet = generateInitialFleet();
  const pairs = pairFleetIntoEtopsWings(fleet);
  assert.equal(pairs.length, 50);

  const tail01 = pairs.find((p) => p.tailId === 'N787-01')!;
  assert.equal(tail01.leftEngine.wingPosition, 'ENG-L');
  assert.equal(tail01.rightEngine.wingPosition, 'ENG-R');
  assert.ok(tail01.rulDelta > 40);
});

test('calculateEconomicSandbox computes optimal stopping thetaStar and FLEX derate savings', () => {
  const fleet = generateInitialFleet();
  const res = calculateEconomicSandbox(
    {
      failureCostCf: 200000,
      wastedLifeCostCw: 250,
      leadTimeL: 15,
      flexDeratePct: 10,
      routeEnvId: 'MIDDLE_EAST_CMAS',
    },
    fleet
  );

  const expectedGamma = 250 / 200000;
  const expectedTheta = expectedGamma / (1 + expectedGamma);
  assert.ok(Math.abs(res.gammaRatio - expectedGamma) < 1e-9);
  assert.ok(Math.abs(res.thetaStar - expectedTheta) < 1e-9);
  assert.equal(res.peakEgtAlleviationDegR, -18.0);
  assert.equal(res.lcfCyclesPreserved, 22.0);
  assert.equal(res.annualSavingsUsd, 145000);
  assert.equal(res.routeMultiplier, 1.35);
  assert.ok(res.hangarSchedule.length > 0);
});

test('evaluateDualConstraintAirworthiness enforces min(Conformal RUL 90%, LLP Cycles Remaining)', () => {
  const fleet = generateInitialFleet();
  const eng34 = fleet.find((e) => e.id === 'ESN-787-034')!;
  const eval34 = evaluateDualConstraintAirworthiness(eng34);

  // ESN-787-034 has LLP remaining = 15000 - 14892 = 108c, conformalLower90 = 8.6c
  assert.equal(eval34.llpCyclesRemaining, 108);
  assert.equal(eval34.effectiveDispatchLimitCycles, eng34.conformalLower90);
  assert.equal(eval34.bindingConstraint, 'CONFORMAL_PHM_RUL');
  assert.equal(eval34.clopperPearsonRiskPct, 3.83);
});

test('hangarSchedule produces strictly non-overlapping work orders in each bay', () => {
  const fleet = generateInitialFleet();
  const res = calculateEconomicSandbox(
    {
      failureCostCf: 220000,
      wastedLifeCostCw: 280,
      leadTimeL: 14,
      flexDeratePct: 8,
      routeEnvId: 'CONTINENTAL',
    },
    fleet
  );

  for (const bay of ['BAY A', 'BAY B', 'BAY C'] as const) {
    const orders = res.hangarSchedule
      .filter((w) => w.bay === bay)
      .sort((a, b) => a.startCycle - b.startCycle);
    for (let i = 1; i < orders.length; i++) {
      assert.ok(
        orders[i].startCycle >= orders[i - 1].endCycle + 2,
        `Overlapping orders in ${bay}: ${orders[i - 1].endCycle} vs ${orders[i].startCycle}`
      );
    }
  }
});
