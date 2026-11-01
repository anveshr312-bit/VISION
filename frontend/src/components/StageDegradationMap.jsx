import React, { useEffect, useMemo, useState } from 'react';
import * as d3 from 'd3';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  Crosshair,
  Droplets,
  Eye,
  Gauge,
  History,
  Layers,
  ShieldAlert,
  Sparkles,
  TrendingDown,
  Wrench,
} from 'lucide-react';

/**
 * Full standalone & integrated dataset for all 9 Axial Gas-Path Flow Stations
 * and 8 Historical Cycle-by-Cycle Degradation Heatmap Rows (Cycles 0 -> 142, including Cycle 85 Inflection).
 * Includes spatial cutaway geometry coordinates, station temperatures (°R), pressures (psia), and spool assignments.
 */
export const AXIAL_GAS_PATH_STAGES = [
  {
    id: 'FAN_ROTOR',
    shortName: 'Fan Rotor',
    matrixLabel: 'Fan',
    station: 'Stn 2.0',
    spool: 'N1 LP Spool',
    healthPct: 96,
    fleetAvgPct: 94,
    percentileSeverity: 18,
    statusBadge: 'NOMINAL',
    stationTempR: 518.7,
    stationPressPsia: 14.7,
    tipClearanceCurrentMm: 0.62,
    tipClearanceNominalMm: 0.58,
    tipClearanceLimitMm: 1.25,
    deltaFlowPct: -0.18,
    deltaEfficiencyPct: -0.24,
    chordLossMm: 0.02,
    chordLossMaxMm: 0.35,
    initialRulCycles: 195,
    predictedSlopePerCycle: -0.62,
    cutawayGeometry: {
      xStart: 68,
      xEnd: 142,
      yTopOuter: 38,
      yTopInner: 124,
      yBotInner: 176,
      yBotOuter: 262,
      bladeCount: 5,
    },
    borescopeDefect:
      '20 wide-chord swept titanium fan blades inspected. Leading-edge polyurethane erosion sheath intact with zero FOD nicks.',
    severityText: 'LOW - Continue standard 250-cycle line borescope interval.',
    ammReference: 'AMM 72-21-00',
    primaryDirectiveType: 'NOMINAL_MONITOR',
    cycleHistory: [
      { cycle: 0, health: 100, note: 'Entry into service baseline (0.58mm tip clearance)' },
      { cycle: 25, health: 99, note: 'Nominal leading-edge boundary layer flow' },
      { cycle: 50, health: 98, note: 'Zero FOD impact; acoustic liner nominal' },
      { cycle: 75, health: 98, note: 'Minor surface film on spinner cone' },
      { cycle: 85, health: 97, note: 'Inflection check: Fan aerodynamic profile stable' },
      { cycle: 100, health: 97, note: 'Tip clearance 0.60mm (+0.02mm wear)' },
      { cycle: 125, health: 96, note: 'Tip clearance 0.61mm; balance weights nominal' },
      { cycle: 142, health: 96, note: 'Current Cycle: 96% health — Airworthy nominal' },
    ],
  },
  {
    id: 'LPC_BOOSTER',
    shortName: 'LPC Booster (Stg 1-3)',
    matrixLabel: 'LPC Booster',
    station: 'Stn 2.4',
    spool: 'N2 IP Spool',
    healthPct: 86,
    fleetAvgPct: 89,
    percentileSeverity: 54,
    statusBadge: 'NOMINAL',
    stationTempR: 655.0,
    stationPressPsia: 44.2,
    tipClearanceCurrentMm: 0.84,
    tipClearanceNominalMm: 0.72,
    tipClearanceLimitMm: 1.35,
    deltaFlowPct: -0.52,
    deltaEfficiencyPct: -0.68,
    chordLossMm: 0.06,
    chordLossMaxMm: 0.30,
    initialRulCycles: 180,
    predictedSlopePerCycle: -0.78,
    cutawayGeometry: {
      xStart: 146,
      xEnd: 228,
      yTopOuter: 74,
      yTopInner: 126,
      yBotInner: 174,
      yBotOuter: 226,
      bladeCount: 6,
    },
    borescopeDefect:
      'Stage 2 booster stator root shows light coastal salt aerosol film; variable inlet guide vane (VIGV) bushings within 0.04mm tolerance.',
    severityText: 'MODERATE-LOW - Include in next scheduled on-wing detergent wash.',
    ammReference: 'AMM 72-31-00',
    primaryDirectiveType: 'WATER_WASH',
    cycleHistory: [
      { cycle: 0, health: 100, note: 'Baseline IPC booster pressure ratio verified' },
      { cycle: 25, health: 97, note: 'Initial salt film trace on Stg 1 IGV' },
      { cycle: 50, health: 95, note: 'T24 temperature margin +18.4°R' },
      { cycle: 75, health: 92, note: 'Mild flow capacity drift (-0.31%)' },
      { cycle: 85, health: 90, note: 'Inflection check: Gradual fouling accumulation' },
      { cycle: 100, health: 89, note: 'VIGV actuator torque nominal' },
      { cycle: 125, health: 87, note: 'T24 outlet at 655.0°R; mild salt film' },
      { cycle: 142, health: 86, note: 'Current Cycle: 86% health — Descale recommended' },
    ],
  },
  {
    id: 'HPC_FRONT_1_2',
    shortName: 'HPC Front (Stg 1-2)',
    matrixLabel: 'HPC Stg 1-2',
    station: 'Stn 2.7',
    spool: 'N3 HP Spool',
    healthPct: 78,
    fleetAvgPct: 85,
    percentileSeverity: 74,
    statusBadge: 'FOULING',
    stationTempR: 1184.0,
    stationPressPsia: 215.6,
    tipClearanceCurrentMm: 0.98,
    tipClearanceNominalMm: 0.76,
    tipClearanceLimitMm: 1.40,
    deltaFlowPct: -0.94,
    deltaEfficiencyPct: -1.35,
    chordLossMm: 0.11,
    chordLossMaxMm: 0.25,
    initialRulCycles: 168,
    predictedSlopePerCycle: -0.86,
    cutawayGeometry: {
      xStart: 232,
      xEnd: 306,
      yTopOuter: 88,
      yTopInner: 130,
      yBotInner: 170,
      yBotOuter: 212,
      bladeCount: 5,
    },
    borescopeDefect:
      'Baked hydrocarbon and silicate fouling deposits across Stage 1-2 compressor airfoils reducing effective throat area.',
    severityText: 'MODERATE - Prescribe AMM 72-00-00 detergent water wash within 10 cycles.',
    ammReference: 'AMM 72-32-11',
    primaryDirectiveType: 'WATER_WASH',
    cycleHistory: [
      { cycle: 0, health: 100, note: 'Nominal Stage 1-2 axial flow profile' },
      { cycle: 25, health: 96, note: 'Initial airfoil surface roughening' },
      { cycle: 50, health: 92, note: 'Boundary layer thickening (-0.45% ΔFlow)' },
      { cycle: 75, health: 88, note: 'Particulate deposit buildup on Stg 2 shroud' },
      { cycle: 85, health: 85, note: 'Inflection Pt: Fouling rate increased +1.4x' },
      { cycle: 100, health: 83, note: 'Chord erosion 0.08mm on leading edge' },
      { cycle: 125, health: 80, note: 'Flow decrement -0.82%; η loss -1.18%' },
      { cycle: 142, health: 78, note: 'Current Cycle: 78% health — Active Fouling' },
    ],
  },
  {
    id: 'HPC_MID_3_4',
    shortName: 'HPC Mid (Stg 3-4)',
    matrixLabel: 'HPC Stg 3-4',
    station: 'Stn 3.0',
    spool: 'N3 HP Spool',
    healthPct: 64,
    fleetAvgPct: 82,
    percentileSeverity: 92,
    statusBadge: 'BLADE_RUB',
    stationTempR: 1448.5,
    stationPressPsia: 388.4,
    tipClearanceCurrentMm: 1.18,
    tipClearanceNominalMm: 0.80,
    tipClearanceLimitMm: 1.40,
    deltaFlowPct: -1.42,
    deltaEfficiencyPct: -2.10,
    chordLossMm: 0.18,
    chordLossMaxMm: 0.25,
    initialRulCycles: 156,
    predictedSlopePerCycle: -0.88,
    cutawayGeometry: {
      xStart: 310,
      xEnd: 384,
      yTopOuter: 96,
      yTopInner: 132,
      yBotInner: 168,
      yBotOuter: 204,
      bladeCount: 5,
    },
    borescopeDefect:
      'Leading-edge micro-erosion and blade tip shroud rubbing detected on stage 3 stators.',
    severityText: 'HIGH - Turnaround inspection mandated within 15 flight cycles.',
    ammReference: 'AMM 72-32-00-200-801',
    primaryDirectiveType: 'BLADE_RUB',
    cycleHistory: [
      { cycle: 0, health: 100, note: 'Baseline clearance 0.80mm; η_HPC 86.5%' },
      { cycle: 25, health: 96, note: 'Nominal compression ratio across Stg 3-4' },
      { cycle: 50, health: 91, note: 'Light silicate dust polishing on Stg 3 vane' },
      { cycle: 75, health: 86, note: 'Tip clearance 0.91mm (+0.11mm growth)' },
      { cycle: 85, health: 79, note: 'INFLECTION POINT: Abradable shroud rub initiated (+0.19mm)' },
      { cycle: 100, health: 74, note: 'Accelerated T30 thermal creep (+18.6°R)' },
      { cycle: 125, health: 68, note: 'Rapid Tip Clearance Gap Growth (+0.32mm)' },
      { cycle: 142, health: 64, note: 'Current Cycle: 64% health — Critical Tip Clearance 1.18mm' },
    ],
  },
  {
    id: 'HPC_REAR_5_6',
    shortName: 'HPC Rear (Stg 5-6)',
    matrixLabel: 'HPC Stg 5-6',
    station: 'Stn 3.2',
    spool: 'N3 HP Spool',
    healthPct: 74,
    fleetAvgPct: 84,
    percentileSeverity: 81,
    statusBadge: 'CREEP',
    stationTempR: 1598.2,
    stationPressPsia: 548.1,
    tipClearanceCurrentMm: 1.06,
    tipClearanceNominalMm: 0.78,
    tipClearanceLimitMm: 1.40,
    deltaFlowPct: -1.12,
    deltaEfficiencyPct: -1.64,
    chordLossMm: 0.14,
    chordLossMaxMm: 0.25,
    initialRulCycles: 164,
    predictedSlopePerCycle: -0.87,
    cutawayGeometry: {
      xStart: 388,
      xEnd: 458,
      yTopOuter: 102,
      yTopInner: 134,
      yBotInner: 166,
      yBotOuter: 198,
      bladeCount: 5,
    },
    borescopeDefect:
      'High-pressure exit guide vane (EGV) trailing-edge oxidation and T30 thermal creep (+28.4°R above baseline) with P30 loss (-1.80%).',
    severityText: 'ELEVATED - Perform water wash descale to recover T30 margin.',
    ammReference: 'AMM 72-32-40',
    primaryDirectiveType: 'WATER_WASH',
    cycleHistory: [
      { cycle: 0, health: 100, note: 'P30 delivery pressure 558.2 psia nominal' },
      { cycle: 25, health: 95, note: 'T30 exit temperature 1571.0°R' },
      { cycle: 50, health: 90, note: 'Minor seal tooth wear on CDP labyrinth' },
      { cycle: 75, health: 86, note: 'P30 pressure loss -0.75%' },
      { cycle: 85, health: 82, note: 'Inflection Pt: Upstream Stg 3 wake heating Stg 5-6' },
      { cycle: 100, health: 79, note: 'T30 reaches 1588.4°R (+18.6°R creep)' },
      { cycle: 125, health: 76, note: 'P30 at 550.4 psia (-1.40% loss)' },
      { cycle: 142, health: 74, note: 'Current Cycle: 74% health — T30 at 1598.2°R' },
    ],
  },
  {
    id: 'COMBUSTOR_LINER',
    shortName: 'Combustor Liner',
    matrixLabel: 'Combustor',
    station: 'Stn 4.0',
    spool: 'Hot Core Liner',
    healthPct: 79,
    fleetAvgPct: 83,
    percentileSeverity: 68,
    statusBadge: 'FOULING',
    stationTempR: 3420.0,
    stationPressPsia: 526.4,
    tipClearanceCurrentMm: 0.92,
    tipClearanceNominalMm: 0.75,
    tipClearanceLimitMm: 1.35,
    deltaFlowPct: -0.76,
    deltaEfficiencyPct: -0.95,
    chordLossMm: 0.09,
    chordLossMaxMm: 0.25,
    initialRulCycles: 170,
    predictedSlopePerCycle: -0.84,
    cutawayGeometry: {
      xStart: 462,
      xEnd: 548,
      yTopOuter: 92,
      yTopInner: 132,
      yBotInner: 168,
      yBotOuter: 208,
      bladeCount: 0,
    },
    borescopeDefect:
      'Fuel injector swirlers #9 & #14 show mild carbon coking; effusion cooling micro-holes 96.4% unobstructed with no thermal bridging.',
    severityText: 'MODERATE - Inspect fuel nozzle pattern factor at next A-check.',
    ammReference: 'AMM 72-40-00-210-802',
    primaryDirectiveType: 'BLADE_RUB',
    cycleHistory: [
      { cycle: 0, health: 100, note: '24/24 fuel nozzles uniform pattern factor 0.16' },
      { cycle: 25, health: 96, note: 'Effusion cooling film 100% nominal' },
      { cycle: 50, health: 93, note: 'Light thermal discoloration on inner liner tile #4' },
      { cycle: 75, health: 89, note: 'Swirler #9 minor carbon deposit' },
      { cycle: 85, health: 86, note: 'Inflection check: Elevated T30 inlet temp increases liner load' },
      { cycle: 100, health: 84, note: 'Pattern factor 0.19; TBC coat 93% intact' },
      { cycle: 125, health: 81, note: 'Swirler #14 carbon coking noted on borescope' },
      { cycle: 142, health: 79, note: 'Current Cycle: 79% health — Oxidation coat 91.4%' },
    ],
  },
  {
    id: 'HPT_NOZZLE_ROTOR',
    shortName: 'HPT Nozzle & Rotor',
    matrixLabel: 'HPT Stage 1',
    station: 'Stn 4.5',
    spool: 'N3 HP Turbine',
    healthPct: 67,
    fleetAvgPct: 80,
    percentileSeverity: 89,
    statusBadge: 'CRITICAL',
    stationTempR: 2362.0,
    stationPressPsia: 218.5,
    tipClearanceCurrentMm: 1.24,
    tipClearanceNominalMm: 0.82,
    tipClearanceLimitMm: 1.40,
    deltaFlowPct: -1.36,
    deltaEfficiencyPct: -1.92,
    chordLossMm: 0.16,
    chordLossMaxMm: 0.25,
    initialRulCycles: 158,
    predictedSlopePerCycle: -0.89,
    cutawayGeometry: {
      xStart: 552,
      xEnd: 626,
      yTopOuter: 86,
      yTopInner: 130,
      yBotInner: 170,
      yBotOuter: 214,
      bladeCount: 4,
    },
    borescopeDefect:
      'CMSX-4 single-crystal HPT rotor blade #11 exhibits 4.2mm² thermal barrier coating (TBC) spallation near crown fillet; sulfidation trace.',
    severityText: 'CRITICAL - Verify 15,000c LLP disk clock (108c remaining) & schedule module teardown.',
    ammReference: 'AMM 72-41-00-220-804',
    primaryDirectiveType: 'HPT_CREEP',
    cycleHistory: [
      { cycle: 0, health: 100, note: 'CMSX-4 single-crystal blades baseline EGT margin +42°R' },
      { cycle: 25, health: 95, note: 'NGV cooling holes clear; zero CMAS glass' },
      { cycle: 50, health: 90, note: 'Minor TBC craze cracking on blade #11 tip' },
      { cycle: 75, health: 84, note: 'Crown fillet sulfidation trace initiated' },
      { cycle: 85, health: 79, note: 'Inflection Pt: TBC micro-spallation (1.8mm²) observed' },
      { cycle: 100, health: 75, note: 'T50 EGT climbs to 1412.0°R; tip clearance 1.12mm' },
      { cycle: 125, health: 71, note: 'TBC spallation expanded to 3.4mm² on blade #11' },
      { cycle: 142, health: 67, note: 'Current Cycle: 67% health — 4.2mm² TBC spallation' },
    ],
  },
  {
    id: 'LPT_STAGES',
    shortName: 'LPT Stages 1-3',
    matrixLabel: 'LPT Stages',
    station: 'Stn 5.0',
    spool: 'N1/N2 Turbine',
    healthPct: 89,
    fleetAvgPct: 90,
    percentileSeverity: 42,
    statusBadge: 'NOMINAL',
    stationTempR: 1426.0,
    stationPressPsia: 58.4,
    tipClearanceCurrentMm: 0.78,
    tipClearanceNominalMm: 0.70,
    tipClearanceLimitMm: 1.35,
    deltaFlowPct: -0.34,
    deltaEfficiencyPct: -0.45,
    chordLossMm: 0.04,
    chordLossMaxMm: 0.30,
    initialRulCycles: 185,
    predictedSlopePerCycle: -0.74,
    cutawayGeometry: {
      xStart: 630,
      xEnd: 726,
      yTopOuter: 64,
      yTopInner: 126,
      yBotInner: 174,
      yBotOuter: 236,
      bladeCount: 6,
    },
    borescopeDefect:
      '6-stage low-pressure turbine airfoils and honeycombed tip seals intact; N1/N3 coaxial bearing vibration nominal at 0.42 ips.',
    severityText: 'LOW - Standard ETOPS-330 line maintenance monitoring.',
    ammReference: 'AMM 72-52-00',
    primaryDirectiveType: 'NOMINAL_MONITOR',
    cycleHistory: [
      { cycle: 0, health: 100, note: 'LPT Stage 1-3 efficiency 92.8% nominal' },
      { cycle: 25, health: 98, note: 'Inter-stage labyrinth honeycomb seal intact' },
      { cycle: 50, health: 96, note: 'Uniform exhaust gas temperature profile' },
      { cycle: 75, health: 95, note: 'Blade shroud interlock wear within 0.05mm' },
      { cycle: 85, health: 93, note: 'Inflection check: Mild T50 thermal load increase' },
      { cycle: 100, health: 92, note: 'Stage 2 stator coating 96% intact' },
      { cycle: 125, health: 90, note: 'Vibration stable at 0.42 ips' },
      { cycle: 142, health: 89, note: 'Current Cycle: 89% health — Nominal LPT operation' },
    ],
  },
  {
    id: 'CORE_EXHAUST',
    shortName: 'Core Exhaust Nozzle',
    matrixLabel: 'Exhaust Nozzle',
    station: 'Stn 8.0',
    spool: 'Exhaust Mixer',
    healthPct: 94,
    fleetAvgPct: 93,
    percentileSeverity: 24,
    statusBadge: 'NOMINAL',
    stationTempR: 985.0,
    stationPressPsia: 18.2,
    tipClearanceCurrentMm: 0.55,
    tipClearanceNominalMm: 0.50,
    tipClearanceLimitMm: 1.30,
    deltaFlowPct: -0.12,
    deltaEfficiencyPct: -0.18,
    chordLossMm: 0.01,
    chordLossMaxMm: 0.30,
    initialRulCycles: 192,
    predictedSlopePerCycle: -0.66,
    cutawayGeometry: {
      xStart: 730,
      xEnd: 816,
      yTopOuter: 76,
      yTopInner: 132,
      yBotInner: 168,
      yBotOuter: 224,
      bladeCount: 0,
    },
    borescopeDefect:
      'Inconel exhaust mixer chevrons and acoustic centerbody cone free of thermal buckling or acoustic tile delamination.',
    severityText: 'LOW - Certified for unrestricted ETOPS-330 dispatch.',
    ammReference: 'AMM 78-11-00',
    primaryDirectiveType: 'NOMINAL_MONITOR',
    cycleHistory: [
      { cycle: 0, health: 100, note: 'Nozzle throat area & chevron alignment verified' },
      { cycle: 25, health: 99, note: 'Acoustic attenuation tiles 100% secure' },
      { cycle: 50, health: 98, note: 'Zero thermal stress cracking on centerbody' },
      { cycle: 75, health: 97, note: 'Propulsive nozzle efficiency 99.1%' },
      { cycle: 85, health: 96, note: 'Inflection check: Exhaust plume symmetry nominal' },
      { cycle: 100, health: 96, note: 'Minor soot staining on lower chevron lip' },
      { cycle: 125, health: 95, note: 'Flange bolt torque check passed' },
      { cycle: 142, health: 94, note: 'Current Cycle: 94% health — Nominal Exhaust' },
    ],
  },
];

const CYCLE_COLUMNS = [0, 25, 50, 75, 85, 100, 125, 142];

/**
 * Computes cycle-by-cycle Actual RUL vs. Predicted Conformal RUL trajectory and slopes
 * for a given axial turbofan stage so D3 can render both the direct heatmap overlay
 * and the dedicated slope comparison chart.
 */
function buildStageRulTrajectory(stage, isWaterWashed) {
  const r0 = stage.initialRulCycles || 160;
  const predSlope = stage.predictedSlopePerCycle || -0.85;
  // Minimum failure threshold health is 58% (0 cycles RUL remaining)
  const failureThresholdHealth = 58;
  const washBonusCycles =
    isWaterWashed &&
    (stage.id === 'LPC_BOOSTER' ||
      stage.id === 'HPC_FRONT_1_2' ||
      stage.id === 'HPC_MID_3_4' ||
      stage.id === 'HPC_REAR_5_6')
      ? 24
      : 0;

  const points = stage.cycleHistory.map((pt, idx) => {
    const liveHealth = idx === stage.cycleHistory.length - 1 ? stage.healthPct : pt.health;
    // Predicted RUL follows the physics baseline model from Cycle 0
    const predictedRul = Math.max(
      6,
      +(r0 + predSlope * pt.cycle + (idx >= 5 ? washBonusCycles * 0.4 : 0)).toFixed(1)
    );
    // Actual RUL maps the observed physical stage health above the 58% shop-visit floor
    const healthFractionRemaining = Math.max(
      0.04,
      (liveHealth - failureThresholdHealth) / (100 - failureThresholdHealth)
    );
    const actualRul = Math.max(
      4,
      +(r0 * healthFractionRemaining + (idx === stage.cycleHistory.length - 1 ? washBonusCycles * 0.5 : 0)).toFixed(1)
    );
    const piHalfWidth = +(4.2 + idx * 1.15).toFixed(1);

    return {
      index: idx,
      cycle: pt.cycle,
      health: liveHealth,
      note: pt.note,
      actualRul,
      predictedRul,
      predLower90: Math.max(0, +(predictedRul - piHalfWidth).toFixed(1)),
      predUpper90: +(predictedRul + piHalfWidth).toFixed(1),
      residualDelta: +(actualRul - predictedRul).toFixed(1),
    };
  });

  // Compute Pre-Inflection (Cycle 0 -> 85) vs Post-Inflection (Cycle 85 -> 142) actual degradation slopes (cycles of RUL lost per flight cycle)
  const p0 = points[0];
  const pInflect = points[4]; // Cycle 85
  const pEnd = points[points.length - 1]; // Cycle 142

  const preInflectionSlope = +((pInflect.actualRul - p0.actualRul) / (pInflect.cycle - p0.cycle)).toFixed(2);
  const postInflectionActualSlope = +(
    (pEnd.actualRul - pInflect.actualRul) /
    Math.max(1, pEnd.cycle - pInflect.cycle)
  ).toFixed(2);
  const overallActualSlope = +((pEnd.actualRul - p0.actualRul) / pEnd.cycle).toFixed(2);
  const slopeDivergencePct = Math.round(
    ((Math.abs(postInflectionActualSlope) - Math.abs(predSlope)) / Math.abs(predSlope)) * 100
  );

  return {
    points,
    preInflectionSlope,
    postInflectionActualSlope,
    overallActualSlope,
    predictedSlope: predSlope,
    slopeDivergencePct,
  };
}

/**
 * D3-Based RUL Trajectory & Actual vs. Predicted Degradation Slope Overlay Component
 */
function D3RulTrajectorySlopeOverlay({
  activeStage,
  rulTrajectory,
  selectedCycleIdx,
  onSelectCycleIdx,
  onHoverCyclePoint,
  activeToneHex,
}) {
  const width = 920;
  const height = 205;
  const margin = { top: 22, right: 32, bottom: 32, left: 48 };

  const {
    xScale,
    yScale,
    actualLinePath,
    predictedLinePath,
    conformalAreaPath,
    actualSlopeLine,
    predictedSlopeLine,
    yTicks,
  } = useMemo(() => {
    const pts = rulTrajectory.points;
    // Use an ordinal-aligned linear scale across the 8 cycle columns so points align vertically with the heatmap columns
    const xSc = d3
      .scaleLinear()
      .domain([0, pts.length - 1])
      .range([margin.left, width - margin.right]);

    const maxRul = Math.max(210, d3.max(pts, (d) => Math.max(d.actualRul, d.predUpper90)) || 200);
    const ySc = d3
      .scaleLinear()
      .domain([0, maxRul])
      .range([height - margin.bottom, margin.top]);

    const actualGen = d3
      .line()
      .x((d) => xSc(d.index))
      .y((d) => ySc(d.actualRul))
      .curve(d3.curveMonotoneX);

    const predGen = d3
      .line()
      .x((d) => xSc(d.index))
      .y((d) => ySc(d.predictedRul))
      .curve(d3.curveMonotoneX);

    const areaGen = d3
      .area()
      .x((d) => xSc(d.index))
      .y0((d) => ySc(d.predLower90))
      .y1((d) => ySc(d.predUpper90))
      .curve(d3.curveMonotoneX);

    // Post-inflection linear secant/slope comparison vector (Cycle 85 [idx 4] -> Cycle 142 [idx 7])
    const pInf = pts[4];
    const pLast = pts[pts.length - 1];

    return {
      xScale: xSc,
      yScale: ySc,
      actualLinePath: actualGen(pts) || '',
      predictedLinePath: predGen(pts) || '',
      conformalAreaPath: areaGen(pts) || '',
      actualSlopeLine: {
        x1: xSc(pInf.index),
        y1: ySc(pInf.actualRul),
        x2: xSc(pLast.index),
        y2: ySc(pLast.actualRul),
      },
      predictedSlopeLine: {
        x1: xSc(0),
        y1: ySc(pts[0].predictedRul),
        x2: xSc(pLast.index),
        y2: ySc(pLast.predictedRul),
      },
      yTicks: ySc.ticks(4),
    };
  }, [rulTrajectory]);

  const activePoint = rulTrajectory.points[selectedCycleIdx] || rulTrajectory.points[7];
  const inflectX = xScale(4); // Cycle 85 column

  return (
    <div
      data-testid="d3-rul-trajectory-overlay"
      className="bg-[#181C1A]/95 border border-white/[0.08] rounded-2xl p-4 space-y-3"
    >
      {/* Top Telemetry Bar: Stage Title + Actual vs. Predicted Slope Comparison */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-xl bg-[#2B302D] border border-white/[0.08] flex items-center justify-center text-[#B8CE82]">
            <TrendingDown className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-[#EAECE9]">
                D3 RUL Trajectory &amp; Degradation Slope Overlay · {activeStage.shortName} ({activeStage.station})
              </span>
              <span className="px-2 py-0.5 rounded-full bg-[#232725] border border-white/10 text-[10px] font-mono text-[#B8CE82]">
                d3.scaleLinear + d3.curveMonotoneX
              </span>
            </div>
            <p className="text-[10px] font-mono text-[#949C96]">
              Visualizing Actual Observed RUL Decay vs. Physics-Informed Weibull Conformal Prediction (90% PI Band)
            </p>
          </div>
        </div>

        {/* Slope & Divergence Metrics */}
        <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono">
          <div className="px-2.5 py-1 rounded-xl bg-[#232725] border border-white/[0.07]">
            <span className="text-[#949C96]">Actual Slope (85→142c): </span>
            <strong style={{ color: activeToneHex }}>
              {rulTrajectory.postInflectionActualSlope.toFixed(2)} c/cyc
            </strong>
          </div>
          <div className="px-2.5 py-1 rounded-xl bg-[#232725] border border-white/[0.07]">
            <span className="text-[#949C96]">Predicted Slope: </span>
            <strong className="text-[#82A995]">
              {rulTrajectory.predictedSlope.toFixed(2)} c/cyc
            </strong>
          </div>
          <div className="px-2.5 py-1 rounded-xl bg-[#232725] border border-white/[0.07]">
            <span className="text-[#949C96]">Slope Δ: </span>
            <strong
              className={
                rulTrajectory.slopeDivergencePct > 15
                  ? 'text-[#D97865]'
                  : rulTrajectory.slopeDivergencePct > 0
                    ? 'text-[#D8B65E]'
                    : 'text-[#B8CE82]'
              }
            >
              {rulTrajectory.slopeDivergencePct > 0 ? `+${rulTrajectory.slopeDivergencePct}% steeper` : `${rulTrajectory.slopeDivergencePct}% nominal`}
            </strong>
          </div>
        </div>
      </div>

      {/* D3 SVG Multi-Layer Trajectory Chart */}
      <div className="relative">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-[185px] overflow-visible select-none"
          role="img"
          aria-label={`D3 RUL Trajectory Chart for ${activeStage.shortName}`}
        >
          <defs>
            <linearGradient id="d3ConformalBandGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#82A995" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#82A995" stopOpacity="0.04" />
            </linearGradient>
            <linearGradient id="d3ActualAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={activeToneHex} stopOpacity="0.20" />
              <stop offset="100%" stopColor={activeToneHex} stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Horizontal Y-Axis Grid Lines & RUL Cycle Labels */}
          {yTicks.map((tickVal) => {
            const y = yScale(tickVal);
            return (
              <g key={tickVal}>
                <line
                  x1={margin.left}
                  y1={y}
                  x2={width - margin.right}
                  y2={y}
                  stroke="rgba(255,255,255,0.06)"
                  strokeWidth="1"
                />
                <text
                  x={margin.left - 8}
                  y={y + 3}
                  textAnchor="end"
                  fontSize="9.5"
                  fill="#949C96"
                  className="font-mono"
                >
                  {tickVal}c
                </text>
              </g>
            );
          })}

          {/* Vertical Cycle Column Alignment Guides */}
          {rulTrajectory.points.map((pt) => {
            const x = xScale(pt.index);
            const isInflect = pt.cycle === 85;
            const isSelected = pt.index === selectedCycleIdx;
            return (
              <g key={pt.cycle}>
                <line
                  x1={x}
                  y1={margin.top}
                  x2={x}
                  y2={height - margin.bottom}
                  stroke={
                    isSelected
                      ? '#B8CE82'
                      : isInflect
                        ? 'rgba(216,182,94,0.45)'
                        : 'rgba(255,255,255,0.05)'
                  }
                  strokeWidth={isSelected ? '1.4' : '1'}
                  strokeDasharray={isSelected ? 'none' : '3 3'}
                />
                <text
                  x={x}
                  y={height - 10}
                  textAnchor="middle"
                  fontSize="9.5"
                  fill={isSelected ? '#B8CE82' : isInflect ? '#D8B65E' : '#949C96'}
                  className="font-mono font-semibold"
                >
                  {pt.cycle === 85 ? '85c ★' : `${pt.cycle}c`}
                </text>
              </g>
            );
          })}

          {/* Cycle 85 Inflection Zone Highlight */}
          <rect
            x={inflectX - 28}
            y={margin.top}
            width="56"
            height={height - margin.top - margin.bottom}
            fill="rgba(216, 182, 94, 0.06)"
            rx="4"
          />
          <text
            x={inflectX}
            y={margin.top - 6}
            textAnchor="middle"
            fontSize="8.5"
            fill="#D8B65E"
            className="font-mono font-bold"
          >
            ★ INFLECTION KNEE (85c)
          </text>

          {/* 1. D3 90% Conformal Prediction Interval Area Band */}
          <path d={conformalAreaPath} fill="url(#d3ConformalBandGrad)" />

          {/* 2. D3 Predicted RUL Trajectory Curve (Dashed Sage-Teal) */}
          <path
            data-testid="d3-predicted-rul-path"
            d={predictedLinePath}
            fill="none"
            stroke="#82A995"
            strokeWidth="2"
            strokeDasharray="6 4"
          />

          {/* 3. Post-Inflection Actual Slope Tangent Reference Line (Cycle 85 -> 142) */}
          <line
            x1={actualSlopeLine.x1}
            y1={actualSlopeLine.y1}
            x2={actualSlopeLine.x2}
            y2={actualSlopeLine.y2}
            stroke="#D97865"
            strokeWidth="1.2"
            strokeDasharray="2 3"
            opacity="0.75"
          />

          {/* 4. D3 Actual Observed RUL Trajectory Curve (Solid Stage Tone) */}
          <path
            data-testid="d3-actual-rul-path"
            d={actualLinePath}
            fill="none"
            stroke={activeToneHex}
            strokeWidth="2.8"
            strokeLinecap="round"
          />

          {/* 5. Residual Divergence Connector Bar at Active Cycle */}
          <line
            x1={xScale(activePoint.index)}
            y1={yScale(activePoint.predictedRul)}
            x2={xScale(activePoint.index)}
            y2={yScale(activePoint.actualRul)}
            stroke="#D8B65E"
            strokeWidth="2"
          />

          {/* 6. Interactive D3 Data Points for Predicted & Actual RUL */}
          {rulTrajectory.points.map((pt) => {
            const cx = xScale(pt.index);
            const cyAct = yScale(pt.actualRul);
            const cyPred = yScale(pt.predictedRul);
            const isSel = pt.index === selectedCycleIdx;

            return (
              <g
                key={pt.cycle}
                className="cursor-pointer"
                onClick={() => {
                  onSelectCycleIdx(pt.index);
                  onHoverCyclePoint(pt);
                }}
                onMouseEnter={() => onHoverCyclePoint(pt)}
              >
                {/* Predicted RUL Node */}
                <circle
                  cx={cx}
                  cy={cyPred}
                  r={isSel ? 4 : 2.8}
                  fill="#181C1A"
                  stroke="#82A995"
                  strokeWidth="1.6"
                />

                {/* Actual RUL Node */}
                <circle
                  data-testid={`d3-rul-node-${pt.cycle}`}
                  cx={cx}
                  cy={cyAct}
                  r={isSel ? 5.5 : 3.8}
                  fill={activeToneHex}
                  stroke="#181C1A"
                  strokeWidth="1.6"
                />

                {/* Value Callout Pill on Active Cycle Node */}
                {isSel && (
                  <g>
                    <rect
                      x={Math.min(width - 138, Math.max(margin.left, cx - 64))}
                      y={Math.max(4, cyAct - 28)}
                      width="128"
                      height="20"
                      rx="5"
                      fill="#232725"
                      stroke={activeToneHex}
                      strokeWidth="1"
                    />
                    <text
                      x={Math.min(width - 74, Math.max(margin.left + 64, cx))}
                      y={Math.max(17, cyAct - 15)}
                      textAnchor="middle"
                      fontSize="9"
                      fill="#EAECE9"
                      className="font-mono font-bold"
                    >
                      Act {pt.actualRul}c vs Pred {pt.predictedRul}c
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </svg>
      </div>

      {/* Bottom Legend & Active Cycle Residual Callout */}
      <div className="pt-2 border-t border-white/[0.07] flex flex-wrap items-center justify-between gap-3 text-[11px] font-mono">
        <div className="flex flex-wrap items-center gap-4 text-[#949C96]">
          <span className="flex items-center gap-1.5">
            <span
              className="w-4 h-0.5 inline-block rounded"
              style={{ backgroundColor: activeToneHex }}
            />
            Actual Stage RUL Trajectory
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-4 h-0.5 inline-block border-b-2 border-dashed border-[#82A995]" />
            Predicted Weibull RUL Trajectory
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-2 inline-block rounded-xs bg-[#82A995]/25 border border-[#82A995]/50" />
            90% Conformal PI Band
          </span>
        </div>

        <div className="text-[#EAECE9]">
          @ Cycle {activePoint.cycle}: Actual{' '}
          <strong style={{ color: activeToneHex }}>{activePoint.actualRul}c</strong> · Predicted{' '}
          <strong className="text-[#82A995]">{activePoint.predictedRul}c</strong> · Residual ΔRUL:{' '}
          <strong
            className={
              activePoint.residualDelta < -10
                ? 'text-[#D97865]'
                : activePoint.residualDelta < 0
                  ? 'text-[#D8B65E]'
                  : 'text-[#B8CE82]'
            }
          >
            {activePoint.residualDelta > 0 ? `+${activePoint.residualDelta}c` : `${activePoint.residualDelta}c`}
          </strong>
        </div>
      </div>
    </div>
  );
}

/**
 * Radial Dotted Arc Meter for Physical Wear Decrements (ΔFlow & Δη)
 */
function RadialDecrementArcMeter({ label, valueText, severityFraction, colorHex, subLabel }) {
  const width = 152;
  const height = 84;
  const cx = width / 2;
  const cy = 68;
  const rOuter = 50;
  const rInner = 40;
  const totalTicks = 21;
  const clamped = Math.max(0.08, Math.min(1, severityFraction));

  const ticks = Array.from({ length: totalTicks }, (_, i) => {
    const t = i / (totalTicks - 1);
    const angleRad = Math.PI - t * Math.PI;
    const x1 = cx + rInner * Math.cos(angleRad);
    const y1 = cy - rInner * Math.sin(angleRad);
    const x2 = cx + rOuter * Math.cos(angleRad);
    const y2 = cy - rOuter * Math.sin(angleRad);
    return { x1, y1, x2, y2, active: t <= clamped };
  });

  return (
    <div className="bg-[#1B1F1D]/90 border border-white/[0.07] rounded-2xl p-3 flex flex-col items-center justify-between">
      <div className="w-full flex items-center justify-between">
        <span className="text-[10px] font-mono uppercase tracking-wider text-[#949C96]">
          {label}
        </span>
        <span className="text-[9px] font-mono uppercase tracking-wider text-[#949C96]/80">
          {subLabel}
        </span>
      </div>

      <div className="relative flex flex-col items-center my-0.5">
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
          <path
            d={`M ${cx - rOuter - 5} ${cy} A ${rOuter + 5} ${rOuter + 5} 0 0 1 ${cx + rOuter + 5} ${cy}`}
            fill="none"
            stroke="rgba(255,255,255,0.12)"
            strokeWidth="1"
            strokeDasharray="2 3"
          />
          {ticks.map((t, idx) => (
            <line
              key={idx}
              x1={t.x1.toFixed(1)}
              y1={t.y1.toFixed(1)}
              x2={t.x2.toFixed(1)}
              y2={t.y2.toFixed(1)}
              stroke={t.active ? colorHex : 'rgba(255,255,255,0.12)'}
              strokeWidth="2.3"
              strokeLinecap="round"
            />
          ))}
        </svg>

        <div className="absolute bottom-1 text-center">
          <div className="text-sm font-mono font-bold text-[#EAECE9] tabular-nums">{valueText}</div>
        </div>
      </div>

      <div className="w-full flex justify-between text-[9px] font-mono text-[#949C96]">
        <span>0.0%</span>
        <span>-3.0% MAX</span>
      </div>
    </div>
  );
}

export function StageDegradationMap({
  engine,
  onWaterWash,
  onNavigateToDossier,
  onCycleScrub,
  onReturnToOverview,
  isOverlay = false,
}) {
  const [selectedStageId, setSelectedStageId] = useState('HPC_MID_3_4');
  const [cutawayMode, setCutawayMode] = useState('HEALTH_MAP'); // 'HEALTH_MAP' | 'THERMAL_MAP' | 'CLEARANCE_MAP'
  const [selectedCycleIdx, setSelectedCycleIdx] = useState(7); // Default index 7 = Cycle 142 (Current)
  const [showRulOverlay, setShowRulOverlay] = useState(true);
  const [showDirectGridOverlay, setShowDirectGridOverlay] = useState(true);
  const [hoveredCell, setHoveredCell] = useState({
    stageName: 'HPC Stg 3-4',
    station: 'Stn 3.0',
    cycle: 125,
    health: 68,
    note: 'Rapid Tip Clearance Gap Growth (+0.32mm)',
  });
  const [directiveFeedback, setDirectiveFeedback] = useState(null);
  const [localWaterWashDone, setLocalWaterWashDone] = useState(false);
  const [view3DMode, setView3DMode] = useState(true);

  const isWaterWashed = Boolean(engine?.waterWashApplied || localWaterWashDone);
  const activeEngineId = engine?.id || 'ESN-787-034';
  const activeTailId = engine?.tailId || 'N787-17';
  const activeCycleNumber = CYCLE_COLUMNS[selectedCycleIdx] ?? 142;

  useEffect(() => {
    if (onCycleScrub) {
      onCycleScrub(activeCycleNumber);
    }
  }, [activeCycleNumber, onCycleScrub]);

  // Compute live stage health & metrics (boosted if AMM 72-00-00 water wash was executed)
  const stagesWithLiveState = AXIAL_GAS_PATH_STAGES.map((stg) => {
    const washBonus =
      isWaterWashed &&
      (stg.id === 'LPC_BOOSTER' ||
        stg.id === 'HPC_FRONT_1_2' ||
        stg.id === 'HPC_MID_3_4' ||
        stg.id === 'HPC_REAR_5_6')
        ? 8
        : 0;
    const adjustedHealth = Math.min(99, stg.healthPct + washBonus);
    const adjustedFlow = washBonus > 0 ? +(stg.deltaFlowPct * 0.65).toFixed(2) : stg.deltaFlowPct;
    const adjustedEff =
      washBonus > 0 ? +(stg.deltaEfficiencyPct * 0.68).toFixed(2) : stg.deltaEfficiencyPct;

    // Health at the scrubbed cycle index
    const cycleEntry = stg.cycleHistory[selectedCycleIdx] || stg.cycleHistory[stg.cycleHistory.length - 1];
    const cycleHealth =
      selectedCycleIdx === 7 ? adjustedHealth : Math.min(100, cycleEntry.health + (washBonus > 0 ? 3 : 0));

    return {
      ...stg,
      healthPct: adjustedHealth,
      scrubbedHealthPct: cycleHealth,
      scrubbedNote: cycleEntry.note,
      deltaFlowPct: adjustedFlow,
      deltaEfficiencyPct: adjustedEff,
    };
  });

  const activeStage =
    stagesWithLiveState.find((s) => s.id === selectedStageId) || stagesWithLiveState[3];

  // Build D3 RUL Trajectory & Predicted vs. Actual Degradation Slopes for the active stage
  const activeRulTrajectory = useMemo(
    () => buildStageRulTrajectory(activeStage, isWaterWashed),
    [activeStage, isWaterWashed]
  );

  // Direct D3 SVG Path overlaid directly across the 8 cycle columns of the Heatmap Matrix Table
  const directGridOverlayPaths = useMemo(() => {
    const pts = activeRulTrajectory.points;
    // Map the 8 cycle columns (0..7) into the right 8 columns of the 1000x320 table overlay SVG
    const xSc = d3.scaleLinear().domain([0, pts.length - 1]).range([265, 955]);
    const ySc = d3.scaleLinear().domain([0, 200]).range([295, 42]);

    const actLine = d3
      .line()
      .x((d) => xSc(d.index))
      .y((d) => ySc(d.actualRul))
      .curve(d3.curveMonotoneX);

    const predLine = d3
      .line()
      .x((d) => xSc(d.index))
      .y((d) => ySc(d.predictedRul))
      .curve(d3.curveMonotoneX);

    return {
      actualPath: actLine(pts) || '',
      predictedPath: predLine(pts) || '',
      nodes: pts.map((p) => ({
        ...p,
        cx: xSc(p.index),
        cyActual: ySc(p.actualRul),
        cyPred: ySc(p.predictedRul),
      })),
    };
  }, [activeRulTrajectory]);

  // Composite Gas-Path Health Summary
  const compositeHealthPct = (
    stagesWithLiveState.reduce((acc, s) => acc + s.scrubbedHealthPct, 0) /
    stagesWithLiveState.length
  ).toFixed(1);
  const criticalStageCount = stagesWithLiveState.filter((s) => s.scrubbedHealthPct < 70).length;
  const warningStageCount = stagesWithLiveState.filter(
    (s) => s.scrubbedHealthPct >= 70 && s.scrubbedHealthPct <= 85
  ).length;
  const nominalStageCount = stagesWithLiveState.filter((s) => s.scrubbedHealthPct > 85).length;

  // Top 8 stages displayed in the 2D Historical Heatmap Matrix
  const matrixRows = stagesWithLiveState.slice(0, 8);

  const getHealthColorClasses = (health) => {
    if (health > 85) {
      return {
        badgeBg: 'bg-[#B8CE82]/20 border-[#B8CE82]/50 text-[#B8CE82]',
        barBg: 'bg-[#B8CE82]',
        text: 'text-[#B8CE82]',
        borderActive: 'border-[#B8CE82]',
        hex: '#B8CE82',
        fillRgba: 'rgba(184, 206, 130, 0.28)',
      };
    }
    if (health >= 70) {
      return {
        badgeBg: 'bg-[#D8B65E]/20 border-[#D8B65E]/55 text-[#D8B65E]',
        barBg: 'bg-[#D8B65E]',
        text: 'text-[#D8B65E]',
        borderActive: 'border-[#D8B65E]',
        hex: '#D8B65E',
        fillRgba: 'rgba(216, 182, 94, 0.30)',
      };
    }
    return {
      badgeBg: 'bg-[#D97865]/25 border-[#D97865]/65 text-[#D97865]',
      barBg: 'bg-[#D97865]',
      text: 'text-[#D97865]',
      borderActive: 'border-[#D97865]',
      hex: '#D97865',
      fillRgba: 'rgba(217, 120, 101, 0.36)',
    };
  };

  const getCutawayZoneVisuals = (stg) => {
    if (cutawayMode === 'THERMAL_MAP') {
      if (stg.stationTempR >= 2200) {
        return { stroke: '#D97865', fill: 'rgba(217, 120, 101, 0.42)', label: `${Math.round(stg.stationTempR)}°R` };
      }
      if (stg.stationTempR >= 1400) {
        return { stroke: '#D8B65E', fill: 'rgba(216, 182, 94, 0.34)', label: `${Math.round(stg.stationTempR)}°R` };
      }
      if (stg.stationTempR >= 900) {
        return { stroke: '#B8CE82', fill: 'rgba(184, 206, 130, 0.26)', label: `${Math.round(stg.stationTempR)}°R` };
      }
      return { stroke: '#82A995', fill: 'rgba(130, 169, 149, 0.24)', label: `${Math.round(stg.stationTempR)}°R` };
    }

    if (cutawayMode === 'CLEARANCE_MAP') {
      const gapDelta = stg.tipClearanceCurrentMm - stg.tipClearanceNominalMm;
      if (gapDelta >= 0.3) {
        return {
          stroke: '#D97865',
          fill: 'rgba(217, 120, 101, 0.38)',
          label: `${stg.tipClearanceCurrentMm.toFixed(2)}mm`,
        };
      }
      if (gapDelta >= 0.16) {
        return {
          stroke: '#D8B65E',
          fill: 'rgba(216, 182, 94, 0.30)',
          label: `${stg.tipClearanceCurrentMm.toFixed(2)}mm`,
        };
      }
      return {
        stroke: '#B8CE82',
        fill: 'rgba(184, 206, 130, 0.24)',
        label: `${stg.tipClearanceCurrentMm.toFixed(2)}mm`,
      };
    }

    // Default: HEALTH_MAP (uses scrubbed cycle health)
    const tone = getHealthColorClasses(stg.scrubbedHealthPct);
    return {
      stroke: tone.hex,
      fill: tone.fillRgba,
      label: `${stg.scrubbedHealthPct}%`,
    };
  };

  const getCellStyle = (health) => {
    if (health >= 90) {
      return 'bg-[#B8CE82]/20 border-[#B8CE82]/45 text-[#EAECE9] hover:bg-[#B8CE82]/35';
    }
    if (health >= 86) {
      return 'bg-[#82A995]/20 border-[#82A995]/45 text-[#EAECE9] hover:bg-[#82A995]/35';
    }
    if (health >= 76) {
      return 'bg-[#D8B65E]/20 border-[#D8B65E]/45 text-[#D8B65E] hover:bg-[#D8B65E]/35';
    }
    if (health >= 70) {
      return 'bg-[#D8B65E]/30 border-[#D8B65E]/60 text-[#EAECE9] hover:bg-[#D8B65E]/45';
    }
    return 'bg-[#D97865]/30 border-[#D97865]/70 text-[#EAECE9] font-bold shadow-[0_0_12px_rgba(217,120,101,0.28)] hover:bg-[#D97865]/45';
  };

  const handlePrescribeWaterWash = () => {
    setLocalWaterWashDone(true);
    if (onWaterWash) {
      onWaterWash(activeEngineId);
    }
    setDirectiveFeedback(
      `AMM 72-00-00 Detergent Water Wash executed on ${activeEngineId}: +32c RUL recovery, HPC Stg 3-4 foul layer cleared.`
    );
  };

  const handleScheduleBorescopeBlend = () => {
    setDirectiveFeedback(
      `Work Order WO-72-31-${activeEngineId.slice(-3)} queued: AMM 72-31 Borescope Stator Tip Blending & Shroud Abradable Inspection scheduled in Bay A.`
    );
  };

  const handleCheckLlpClock = () => {
    setDirectiveFeedback(
      `FAA 14 CFR § 33.70 Hard Clock Verified: ${
        engine ? engine.llpLimitCycles - engine.llpAccumulatedCycles : 108
      } cycles remaining before mandatory 15,000c HPT disk scrap.`
    );
    if (onNavigateToDossier) {
      onNavigateToDossier();
    }
  };

  const activeTone = getHealthColorClasses(activeStage.healthPct);
  const isHighUrgencyAlert = activeStage.healthPct < 70 || activeStage.scrubbedHealthPct < 70;
  const effectiveAlertHealth = Math.min(activeStage.healthPct, activeStage.scrubbedHealthPct);

  const handleNavigateToAirworthiness = () => {
    if (onNavigateToDossier) {
      onNavigateToDossier();
    }
  };

  const tipPct = Math.min(
    100,
    (activeStage.tipClearanceCurrentMm / activeStage.tipClearanceLimitMm) * 100
  );
  const nominalPct =
    (activeStage.tipClearanceNominalMm / activeStage.tipClearanceLimitMm) * 100;
  const chordPct = Math.min(
    100,
    (activeStage.chordLossMm / activeStage.chordLossMaxMm) * 100
  );

  // Selected stage cutaway coordinates for leader-line callout inside SVG
  const selGeo = activeStage.cutawayGeometry;
  const selMidX = Math.round((selGeo.xStart + selGeo.xEnd) / 2);

  return (
    <div
      data-testid="stage-degradation-map-screen"
      className="w-full relative text-[#EAECE9]"
    >
      {/* =====================================================================
          HERO 3D VIEWPORT HUD: ELEMENTS POSITIONED AROUND THE CENTER 3D ENGINE
          (Center aperture is 100% transparent and open for unobstructed view)
         ===================================================================== */}
      <div className="relative w-full h-[calc(100vh-76px)] min-h-[680px] pointer-events-none select-none overflow-hidden">
        {/* LEFT HUD: Return Button + Diagnostic Summary + Active Stage Focus */}
        <aside
          aria-label="Diagnostic Overview HUD"
          className="pointer-events-auto absolute top-4 left-6 lg:left-8 z-30 w-[315px] sm:w-[340px] space-y-3"
        >
          {onReturnToOverview && (
            <button
              type="button"
              onClick={onReturnToOverview}
              className="px-4 py-1.5 rounded-full bg-[#232725]/90 hover:bg-[#B8CE82] text-[#EAECE9] hover:text-[#181B19] border border-white/15 text-xs font-mono flex items-center gap-2 transition-all cursor-pointer shadow-lg backdrop-blur-md"
            >
              <span>← Return to 3D Twin Overview</span>
            </button>
          )}

          {/* Header Card */}
          <div className="backdrop-blur-2xl bg-[#232725]/88 border border-white/[0.08] rounded-[24px] p-4 shadow-[0_16px_40px_rgba(0,0,0,0.5)] space-y-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#B8CE82] animate-pulse" />
              <span className="text-[11px] font-mono text-[#949C96]">
                Trent 1000 · {activeEngineId} ({activeTailId})
              </span>
            </div>

            <h1 className="text-xl font-normal tracking-tight text-[#EAECE9]">
              Engine Diagnostics
            </h1>

            <div className="pt-1 flex items-center justify-between border-t border-white/[0.08] text-xs font-mono">
              <span className="text-[#949C96]">Composite Health:</span>
              <strong className="text-[#B8CE82] text-sm">{compositeHealthPct}%</strong>
            </div>

            <div className="flex items-center gap-1.5 pt-1 text-[10px] font-mono">
              <span className="px-2 py-0.5 rounded-full bg-[#B8CE82]/20 text-[#B8CE82] border border-[#B8CE82]/40">
                {nominalStageCount} Nom
              </span>
              <span className="px-2 py-0.5 rounded-full bg-[#D8B65E]/20 text-[#D8B65E] border border-[#D8B65E]/40">
                {warningStageCount} Caut
              </span>
              <span className="px-2 py-0.5 rounded-full bg-[#D97865]/20 text-[#D97865] border border-[#D97865]/40">
                {criticalStageCount} Crit
              </span>
            </div>
          </div>

          {/* Active Stage Callout Card */}
          <div className="backdrop-blur-2xl bg-[#232725]/88 border border-white/[0.08] rounded-[24px] p-4 shadow-[0_16px_40px_rgba(0,0,0,0.5)] space-y-2.5">
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-mono font-bold uppercase tracking-wider border ${activeTone.badgeBg}`}>
                  {activeStage.station} · {activeStage.statusBadge}
                </span>
                <div className="font-semibold text-sm text-[#EAECE9] mt-1">
                  {activeStage.shortName}
                </div>
                <div className="text-[10px] font-mono text-[#949C96]">
                  {activeStage.spool}
                </div>
              </div>

              <div className="text-right font-mono">
                <span className="text-[10px] text-[#949C96] block">Health @ c{activeCycleNumber}</span>
                <span className={`text-lg font-bold ${activeTone.text}`}>
                  {activeStage.scrubbedHealthPct}%
                </span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-1 pt-1.5 border-t border-white/[0.08] text-[10px] font-mono">
              <div className="bg-[#181C1A]/80 p-1.5 rounded-lg border border-white/5">
                <div className="text-[#949C96]">Tip Gap</div>
                <div className="text-[#EAECE9] font-bold mt-0.5">{activeStage.tipClearanceCurrentMm.toFixed(2)}mm</div>
              </div>
              <div className="bg-[#181C1A]/80 p-1.5 rounded-lg border border-white/5">
                <div className="text-[#949C96]">Gas Temp</div>
                <div className="text-[#D8B65E] font-bold mt-0.5">{activeStage.stationTempR.toFixed(0)}°R</div>
              </div>
              <div className="bg-[#181C1A]/80 p-1.5 rounded-lg border border-white/5">
                <div className="text-[#949C96]">Pressure</div>
                <div className="text-[#B8CE82] font-bold mt-0.5">{activeStage.stationPressPsia.toFixed(1)}p</div>
              </div>
            </div>

            <p className="text-[10px] text-[#949C96] leading-relaxed line-clamp-2">
              {activeStage.borescopeDefect}
            </p>

            <div className="pt-1 flex items-center gap-2">
              {activeStage.primaryDirectiveType === 'WATER_WASH' ? (
                <button
                  type="button"
                  onClick={handlePrescribeWaterWash}
                  className="flex-1 py-1.5 px-3 rounded-xl text-[10px] font-mono font-bold uppercase tracking-wider bg-[#B8CE82] hover:bg-[#c9df95] text-[#181B19] transition-all cursor-pointer shadow-sm"
                >
                  AMM 72-00 Water Wash
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleScheduleBorescopeBlend}
                  className="flex-1 py-1.5 px-3 rounded-xl text-[10px] font-mono font-bold uppercase tracking-wider bg-[#2E3330] hover:bg-[#39403b] text-[#EAECE9] border border-white/10 transition-all cursor-pointer"
                >
                  AMM 72-31 Blend
                </button>
              )}
              <a
                href="#deep-degradation-cutaway"
                className="py-1.5 px-2.5 rounded-xl text-[10px] font-mono text-[#949C96] hover:text-[#EAECE9] bg-[#1B1F1D] border border-white/10 transition-colors"
                title="Jump to 2D Cross-Sectional Cutaway"
              >
                2D CAD ↓
              </a>
            </div>
          </div>
        </aside>

        {/* RIGHT HUD: Stage-Wise Health View List (Surrounds Right Side of 3D Engine) */}
        <aside
          aria-label="Stage-Wise Health View HUD"
          className="pointer-events-auto absolute top-4 right-6 lg:right-8 z-30 w-[315px] sm:w-[350px]"
        >
          <section
            data-testid="stage-wise-health-profile-card"
            aria-label="Stage-Wise Engine Health View"
            className="backdrop-blur-2xl bg-[#232725]/88 border border-white/[0.08] rounded-[24px] p-4 shadow-[0_16px_40px_rgba(0,0,0,0.5)] space-y-2.5"
          >
            <div className="flex items-center justify-between pb-1 border-b border-white/[0.08]">
              <div>
                <h2 className="text-[14px] font-normal text-[#EAECE9]">
                  Stage-Wise Health View
                </h2>
                <p className="text-[10px] font-mono text-[#949C96]">
                  9 Axial Stations vs. Baseline (▏)
                </p>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-[#B8CE82] text-[#181B19] text-[9px] font-mono font-bold uppercase tracking-wider">
                9 STAGES
              </span>
            </div>

            {/* 9-Stage Compact Horizontal Health Bars */}
            <div className="space-y-1.5 max-h-[calc(100vh-250px)] overflow-y-auto pr-1">
              {stagesWithLiveState.map((stg) => {
                const isSelected = stg.id === activeStage.id;
                const tone = getHealthColorClasses(stg.scrubbedHealthPct);
                return (
                  <button
                    key={stg.id}
                    type="button"
                    data-testid={`stage-health-row-${stg.id}`}
                    onClick={() => setSelectedStageId(stg.id)}
                    className={`w-full text-left px-2.5 py-1.5 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#2B302D] border-[#B8CE82] shadow-sm'
                        : 'bg-[#1B1F1D]/85 border-white/[0.06] hover:border-white/20'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs mb-1">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <span className="text-[9px] font-mono text-[#B8CE82] shrink-0">
                          {stg.station}
                        </span>
                        <span className="font-medium text-[#EAECE9] truncate text-[11px]">
                          {stg.shortName}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0 font-mono">
                        <span className={`text-[8px] px-1 py-0.2 rounded border uppercase ${tone.badgeBg}`}>
                          {stg.statusBadge}
                        </span>
                        <span className={`text-[11px] font-bold tabular-nums ${tone.text}`}>
                          {stg.scrubbedHealthPct}%
                        </span>
                      </div>
                    </div>

                    <div className="relative h-1 bg-[#141715] rounded-full overflow-visible">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${tone.barBg}`}
                        style={{ width: `${stg.scrubbedHealthPct}%` }}
                      />
                      <span
                        title={`Fleet Baseline: ${stg.fleetAvgPct}%`}
                        style={{ left: `${stg.fleetAvgPct}%` }}
                        className="absolute -top-0.5 bottom-0 w-0.5 bg-[#EAECE9]/80"
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        </aside>

        {/* BOTTOM CENTER DOCK: FLOATING CYCLE PROGRESSION TIME-SCRUBBER
            (Centered directly below the 3D Engine Model for instant gradient feedback) */}
        <div className="pointer-events-auto absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-2 max-w-[92vw]">
          {/* Active Gradient Readout Capsule */}
          <div className="px-4 py-1 rounded-full bg-[#181B19]/85 backdrop-blur-xl border border-white/10 text-xs font-mono flex items-center gap-2 shadow-lg">
            <span className="w-2 h-2 rounded-full bg-[#B8CE82] animate-pulse" />
            <span className="text-[#949C96]">Active 3D Thermal Gradient:</span>
            <span className="text-[#EAECE9] font-bold">
              Cycle {activeCycleNumber} / 142 ·{' '}
              {activeCycleNumber === 0
                ? 'Baseline Cool Emerald'
                : activeCycleNumber <= 50
                  ? 'Initial Gas-Path Equilibrium'
                  : activeCycleNumber <= 85
                    ? 'Mid-Life Inflection Amber'
                    : 'Late-Stage Severe Crimson Creep'}
            </span>
          </div>

          {/* Interactive Scrubber Pill Bar */}
          <div
            role="group"
            aria-label="Cycle Scrubber Steps"
            className="flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 rounded-full bg-[#1E2220]/90 backdrop-blur-2xl border border-white/15 shadow-2xl"
          >
            <div className="flex items-center gap-1.5 text-xs font-mono font-semibold text-[#949C96] pl-1 pr-2 border-r border-white/10">
              <History className="w-3.5 h-3.5 text-[#B8CE82]" />
              <span className="hidden sm:inline">Scrubber:</span>
            </div>

            {CYCLE_COLUMNS.map((cyc, idx) => {
              const isSelectedCyc = idx === selectedCycleIdx;
              const isInflection = cyc === 85;
              return (
                <button
                  key={cyc}
                  type="button"
                  data-testid={`scrubber-cycle-${cyc}`}
                  onClick={() => setSelectedCycleIdx(idx)}
                  className={`px-3 py-1 rounded-full text-xs font-mono font-bold transition-all cursor-pointer ${
                    isSelectedCyc
                      ? 'bg-[#B8CE82] text-[#181B19] shadow-[0_0_14px_rgba(184,206,130,0.5)] scale-105'
                      : isInflection
                        ? 'bg-[#D8B65E]/20 text-[#D8B65E] border border-[#D8B65E]/50 hover:bg-[#D8B65E]/30'
                        : 'bg-[#232725] text-[#949C96] hover:text-[#EAECE9] border border-white/[0.06]'
                  }`}
                >
                  {cyc}c{isInflection ? ' ★' : ''}
                </button>
              );
            })}
          </div>

          <a
            href="#deep-degradation-cutaway"
            className="text-[10px] font-mono text-[#949C96] hover:text-[#B8CE82] transition-colors flex items-center gap-1"
          >
            <span>Scroll down for 2D CAD Cutaway, D3 Slopes &amp; 8-Cycle Matrix</span>
            <span>↓</span>
          </a>
        </div>
      </div>

      {/* =====================================================================
          BELOW-THE-FOLD DETAILED DIAGNOSTIC SUITE:
          2D CROSS-SECTIONAL CUTAWAY, AXIAL FLOW SCHEMATIC, D3 RUL SLOPES, HEATMAP
         ===================================================================== */}
      <div
        id="deep-degradation-cutaway"
        className="max-w-[1440px] mx-auto px-6 lg:px-8 py-8 space-y-6 bg-[#141715]/95 rounded-t-[36px] border-t border-white/10 backdrop-blur-2xl shadow-2xl pointer-events-auto"
      >
        {/* Full 2D Cross-Sectional Turbofan Cutaway Section */}
        <section
          data-testid="engine-cutaway-degradation-map"
          aria-label="Interactive Engine Cross-Sectional Degradation Map"
          className="backdrop-blur-2xl bg-[#232725]/88 border border-white/[0.08] rounded-[24px] p-5 shadow-[0_16px_40px_rgba(0,0,0,0.45)] space-y-3.5"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#B8CE82]" />
                <h2 className="text-[15px] font-normal text-[#EAECE9]">
                  Rolls-Royce Trent 1000 2D Cross-Sectional Cutaway CAD
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-[#1B1F1D] border border-white/10 text-[10px] font-mono text-[#B8CE82]">
                  Cycle {activeCycleNumber} {selectedCycleIdx === 7 ? '(Current)' : selectedCycleIdx === 4 ? '(★ Inflection)' : ''}
                </span>
              </div>
              <p className="text-[11px] text-[#949C96] mt-0.5">
                3-Spool Axial CAD Cutaway · Click any internal stage zone to inspect tip rub, fouling &amp; thermal creep
              </p>
            </div>

            {/* 3-Mode Overlay Capsule Switcher */}
            <div
              className="flex items-center bg-[#1B1F1D] border border-white/[0.08] p-1 rounded-full"
              role="group"
              aria-label="Degradation Map Layer Mode"
            >
              {[
                { id: 'HEALTH_MAP', label: 'Stage Health' },
                { id: 'THERMAL_MAP', label: 'Thermal & Gas' },
                { id: 'CLEARANCE_MAP', label: 'Tip Clearance' },
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  data-testid={`cutaway-mode-${m.id}`}
                  onClick={() => setCutawayMode(m.id)}
                  className={`px-3 py-1 rounded-full text-[11px] transition-all cursor-pointer ${
                    cutawayMode === m.id
                      ? 'bg-[#DCE0D9] text-[#181B19] font-semibold shadow-xs'
                      : 'text-[#949C96] hover:text-[#EAECE9]'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Interactive SVG Cross-Sectional Turbofan Cutaway Diagram */}
          <div className="relative bg-[#181C1A]/95 border border-white/[0.07] rounded-2xl p-3 overflow-hidden">
            <svg
              viewBox="0 0 880 305"
              className="w-full h-[250px] sm:h-[275px] select-none overflow-visible"
              role="img"
              aria-label="Rolls-Royce Trent 1000 Axial Stage-Wise Degradation Map"
            >
              <defs>
                <linearGradient id="nacelleGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#38403C" stopOpacity="0.65" />
                  <stop offset="50%" stopColor="#232825" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#38403C" stopOpacity="0.65" />
                </linearGradient>
                <linearGradient id="shaftN1Grad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#82A995" stopOpacity="0.7" />
                  <stop offset="100%" stopColor="#B8CE82" stopOpacity="0.7" />
                </linearGradient>
              </defs>

              {/* Background Engineering Coordinate Grid */}
              {[100, 200, 300, 400, 500, 600, 700, 800].map((gx) => (
                <line
                  key={gx}
                  x1={gx}
                  y1={18}
                  x2={gx}
                  y2={282}
                  stroke="rgba(255,255,255,0.04)"
                  strokeWidth="1"
                  strokeDasharray="2 4"
                />
              ))}
              {/* Engine Centerline Axis */}
              <line
                x1="16"
                y1="150"
                x2="864"
                y2="150"
                stroke="rgba(184,206,130,0.35)"
                strokeWidth="1"
                strokeDasharray="8 4 2 4"
              />
              <text x="20" y="144" fontSize="8" fill="#949C96" className="font-mono">
                CL // 3-SPOOL COAXIAL AXIS (N1 / N2 / N3)
              </text>

              {/* Outer Bypass Nacelle Cowling Contour (Top & Bottom) */}
              <path
                d="M 55 34 Q 190 22 390 48 L 540 66 L 735 58 L 820 74 L 820 84 L 730 70 L 540 76 L 390 60 Q 190 36 62 44 Z"
                fill="url(#nacelleGrad)"
                stroke="rgba(255,255,255,0.18)"
                strokeWidth="1"
              />
              <path
                d="M 55 266 Q 190 278 390 252 L 540 234 L 735 242 L 820 226 L 820 216 L 730 230 L 540 224 L 390 240 Q 190 264 62 256 Z"
                fill="url(#nacelleGrad)"
                stroke="rgba(255,255,255,0.18)"
                strokeWidth="1"
              />

              {/* Bypass Air Flow Stream Arrows */}
              <path
                d="M 155 58 Q 310 58 475 76"
                fill="none"
                stroke="#82A995"
                strokeWidth="1"
                strokeDasharray="4 4"
                strokeOpacity="0.55"
              />
              <text x="255" y="53" fontSize="8" fill="#82A995" className="font-mono">
                BYPASS DUCT STREAM (BPR 10.0 : 1) ──►
              </text>

              {/* Nose Cone Spinner */}
              <path
                d="M 22 150 Q 42 124 68 124 L 68 176 Q 42 176 22 150 Z"
                fill="#2B302D"
                stroke="#B8CE82"
                strokeWidth="1.2"
              />

              {/* Coaxial Core Spool Shafts */}
              <rect x="68" y="145" width="690" height="10" fill="url(#shaftN1Grad)" opacity="0.35" rx="2" />
              <rect x="146" y="138" width="520" height="5" fill="#949C96" opacity="0.3" rx="1" />
              <rect x="146" y="157" width="520" height="5" fill="#949C96" opacity="0.3" rx="1" />
              <rect x="232" y="132" width="394" height="4" fill="#D8B65E" opacity="0.35" rx="1" />
              <rect x="232" y="164" width="394" height="4" fill="#D8B65E" opacity="0.35" rx="1" />

              {/* Exhaust Centerbody Tailcone */}
              <path
                d="M 816 132 L 862 150 L 816 168 Z"
                fill="#2B302D"
                stroke="rgba(255,255,255,0.22)"
                strokeWidth="1"
              />

              {/* 9 Interactive Axial Stage Zones */}
              {stagesWithLiveState.map((stg) => {
                const isSelected = stg.id === activeStage.id;
                const g = stg.cutawayGeometry;
                const vis = getCutawayZoneVisuals(stg);
                const w = g.xEnd - g.xStart;
                const topH = g.yTopInner - g.yTopOuter;
                const botH = g.yBotOuter - g.yBotInner;
                const midX = Math.round((g.xStart + g.xEnd) / 2);
                const isRubOrCritical = stg.scrubbedHealthPct < 70;

                const bladeLines = [];
                if (g.bladeCount > 0) {
                  for (let b = 1; b <= g.bladeCount; b++) {
                    const bx = g.xStart + (b / (g.bladeCount + 1)) * w;
                    bladeLines.push(bx);
                  }
                }

                return (
                  <g
                    key={stg.id}
                    data-testid={`cutaway-zone-${stg.id}`}
                    onClick={() => setSelectedStageId(stg.id)}
                    className="cursor-pointer group"
                  >
                    {/* Top symmetric blade zone */}
                    <rect
                      x={g.xStart}
                      y={g.yTopOuter}
                      width={w}
                      height={topH}
                      fill={vis.fill}
                      stroke={isSelected ? '#B8CE82' : vis.stroke}
                      strokeWidth={isSelected ? 2 : 1}
                      strokeDasharray={isSelected ? 'none' : isRubOrCritical ? '3 2' : 'none'}
                      rx={2}
                      className="transition-all duration-200 group-hover:brightness-125"
                    />

                    {/* Bottom symmetric blade zone */}
                    <rect
                      x={g.xStart}
                      y={g.yBotInner}
                      width={w}
                      height={botH}
                      fill={vis.fill}
                      stroke={isSelected ? '#B8CE82' : vis.stroke}
                      strokeWidth={isSelected ? 2 : 1}
                      strokeDasharray={isSelected ? 'none' : isRubOrCritical ? '3 2' : 'none'}
                      rx={2}
                      className="transition-all duration-200 group-hover:brightness-125"
                    />

                    {/* Top blade lines */}
                    {bladeLines.map((bx, idx) => (
                      <line
                        key={`top-b-${idx}`}
                        x1={bx}
                        y1={g.yTopOuter + 2}
                        x2={bx}
                        y2={g.yTopInner - 2}
                        stroke={vis.stroke}
                        strokeWidth="0.8"
                        strokeOpacity="0.45"
                      />
                    ))}

                    {/* Bottom blade lines */}
                    {bladeLines.map((bx, idx) => (
                      <line
                        key={`bot-b-${idx}`}
                        x1={bx}
                        y1={g.yBotInner + 2}
                        x2={bx}
                        y2={g.yBotOuter - 2}
                        stroke={vis.stroke}
                        strokeWidth="0.8"
                        strokeOpacity="0.45"
                      />
                    ))}

                    {/* Station tag label above */}
                    <text
                      x={midX}
                      y={g.yTopOuter - 4}
                      textAnchor="middle"
                      fontSize="7.5"
                      fill={isSelected ? '#B8CE82' : '#949C96'}
                      className="font-mono font-semibold"
                    >
                      {stg.station.replace('Stn ', '')}
                    </text>

                    {/* Metric readout centered inside top box */}
                    <text
                      x={midX}
                      y={g.yTopOuter + topH / 2 + 3}
                      textAnchor="middle"
                      fontSize="8.5"
                      fill="#EAECE9"
                      className="font-mono font-bold select-none pointer-events-none"
                    >
                      {vis.label}
                    </text>
                  </g>
                );
              })}

              {/* Selected Stage Callout Indicator Pin */}
              <g pointerEvents="none">
                <circle
                  cx={selMidX}
                  cy={selGeo.yTopOuter}
                  r="4"
                  fill="#B8CE82"
                  stroke="#181B19"
                  strokeWidth="1.5"
                />
                <polyline
                  points={`${selMidX},${selGeo.yTopOuter} ${selMidX},10`}
                  fill="none"
                  stroke="#B8CE82"
                  strokeWidth="1.4"
                />
              </g>
            </svg>

            {/* Bottom Live Selected Stage Callout Strip */}
            <div className="mt-2 pt-2.5 border-t border-white/[0.07] flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5">
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider border ${activeTone.badgeBg}`}
                >
                  {activeStage.station} · {activeStage.statusBadge}
                </span>
                <span className="font-mono font-bold text-[#EAECE9]">
                  {activeStage.shortName}
                </span>
                <span className="text-[#949C96] font-mono text-[11px]">
                  ({activeStage.spool})
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-4 text-[11px] font-mono">
                <span className="text-[#949C96]">
                  Health @ Cycle {activeCycleNumber}:{' '}
                  <strong className={activeTone.text}>{activeStage.scrubbedHealthPct}%</strong>
                </span>
                <span className="text-[#949C96]">
                  Tip Gap: <strong className="text-[#EAECE9]">{activeStage.tipClearanceCurrentMm.toFixed(2)}mm</strong>
                </span>
                <span className="text-[#949C96]">
                  Gas Temp: <strong className="text-[#D8B65E]">{activeStage.stationTempR.toFixed(0)}°R</strong>
                </span>
                <span className="text-[#949C96]">
                  Press: <strong className="text-[#B8CE82]">{activeStage.stationPressPsia.toFixed(1)} psia</strong>
                </span>
              </div>
            </div>
          </div>
        </section>

{/* =====================================================================
          1. AXIAL GAS-PATH FLOW SCHEMATIC (TOP COMPONENT STRIP)
         ===================================================================== */}
      <section
        aria-label="Axial Gas-Path Flow Schematic"
        className="backdrop-blur-2xl bg-[#232725]/88 border border-white/[0.08] rounded-[24px] p-5 shadow-[0_16px_40px_rgba(0,0,0,0.45)] space-y-3.5"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#2B302D] border border-white/[0.08] flex items-center justify-center text-[#B8CE82]">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-[14px] font-normal text-[#EAECE9]">
                Axial Gas-Path Flow Schematic · Rolls-Royce Trent 1000 ({activeEngineId} / {activeTailId})
              </h2>
              <p className="text-[11px] text-[#949C96]">
                Click any stage block to inspect physical wear, tip clearance &amp; borescope telemetry
              </p>
            </div>
          </div>

          {/* Color-Coding Legend */}
          <div className="flex items-center gap-4 text-[10px] font-mono uppercase tracking-wider text-[#949C96]">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#B8CE82] inline-block" />
              Normal (&gt;85% Nominal)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#D8B65E] inline-block" />
              Warning (70–85% Caution)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#D97865] inline-block" />
              Critical (&lt;70% Critical)
            </span>
          </div>
        </div>

        {/* Linear 9-Stage Axial Cross-Section Flow Strip */}
        <div
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-9 gap-2 items-stretch pt-1"
          role="group"
          aria-label="Gas-Path Axial Stage Selector"
        >
          {stagesWithLiveState.map((stg, idx) => {
            const isSelected = stg.id === activeStage.id;
            const tone = getHealthColorClasses(stg.healthPct);
            return (
              <div key={stg.id} className="relative flex items-stretch">
                <button
                  type="button"
                  data-testid={`axial-stage-node-${stg.id}`}
                  onClick={() => setSelectedStageId(stg.id)}
                  className={`w-full text-left rounded-2xl p-2.5 border transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? `bg-[#2B302D] ${tone.borderActive} ring-1 ring-[#B8CE82] shadow-md`
                      : 'bg-[#1B1F1D]/85 border-white/[0.07] hover:border-[#B8CE82]/50'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[9px] font-mono uppercase tracking-wider text-[#B8CE82] font-semibold">
                      {stg.station}
                    </span>
                    <span
                      className={`px-1.5 py-0.2 rounded text-[8px] font-mono font-bold uppercase tracking-wider border ${tone.badgeBg}`}
                    >
                      {stg.statusBadge}
                    </span>
                  </div>

                  <div className="my-1.5">
                    <div className="text-[11px] font-mono font-bold text-[#EAECE9] leading-tight line-clamp-1">
                      {stg.shortName}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-baseline justify-between font-mono">
                      <span className="text-[9px] uppercase tracking-wider text-[#949C96]">
                        Health
                      </span>
                      <span className={`text-sm font-bold tabular-nums ${tone.text}`}>
                        {stg.healthPct}%
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-[#141715] rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${tone.barBg}`}
                        style={{ width: `${stg.healthPct}%` }}
                      />
                    </div>
                  </div>
                </button>

                {/* Flow Arrow Connector between stages on desktop */}
                {idx < stagesWithLiveState.length - 1 && (
                  <div
                    aria-hidden="true"
                    className="hidden lg:flex items-center justify-center -right-2 top-1/2 -translate-y-1/2 absolute z-10 pointer-events-none text-[#949C96]"
                  >
                    <ArrowRight className="w-3 h-3" />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* =====================================================================
          2. HISTORICAL CYCLE-BY-CYCLE DEGRADATION HEATMAP MATRIX + D3 RUL TRAJECTORY OVERLAY
         ===================================================================== */}
      <section
        aria-label="Historical Cycle-by-Cycle Degradation Heatmap Matrix"
        className="backdrop-blur-2xl bg-[#232725]/88 border border-white/[0.08] rounded-[24px] p-5 shadow-[0_16px_40px_rgba(0,0,0,0.45)] space-y-4"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#B8CE82]" />
              <h2 className="text-[14px] font-normal text-[#EAECE9]">
                Historical Cycle-by-Cycle Degradation Heatmap Matrix (Cycles 0 → 142)
              </h2>
            </div>
            <p className="text-[11px] text-[#949C96] mt-0.5">
              Hover or click any matrix cell to inspect cycle-specific physical wear &amp; D3 RUL trajectory slope · Inflection point at Cycle 85
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Toggle Controls for D3 RUL Trajectory Overlay */}
            <div
              className="flex items-center bg-[#1B1F1D] border border-white/[0.08] p-1 rounded-full text-[11px]"
              role="group"
              aria-label="D3 RUL Trajectory Overlay Controls"
            >
              <button
                type="button"
                data-testid="toggle-d3-rul-panel"
                onClick={() => setShowRulOverlay((prev) => !prev)}
                className={`px-3 py-1 rounded-full transition-all cursor-pointer ${
                  showRulOverlay
                    ? 'bg-[#DCE0D9] text-[#181B19] font-semibold'
                    : 'text-[#949C96] hover:text-[#EAECE9]'
                }`}
              >
                D3 RUL Slope Chart
              </button>
              <button
                type="button"
                data-testid="toggle-direct-grid-overlay"
                onClick={() => setShowDirectGridOverlay((prev) => !prev)}
                className={`px-3 py-1 rounded-full transition-all cursor-pointer ${
                  showDirectGridOverlay
                    ? 'bg-[#B8CE82] text-[#181B19] font-semibold'
                    : 'text-[#949C96] hover:text-[#EAECE9]'
                }`}
              >
                Matrix Curve Overlay
              </button>
            </div>

            {/* Instant HUD Tooltip Callout Readout Pill */}
            <div
              data-testid="heatmap-hud-tooltip"
              className="bg-[#1B1F1D]/90 border border-white/[0.08] rounded-2xl px-3.5 py-2 text-[11px] font-mono text-[#B8CE82] shadow-lg flex items-center gap-2"
            >
              <Crosshair className="w-3.5 h-3.5 text-[#82A995] shrink-0" />
              <span>
                [{hoveredCell.stageName} @ Cycle {hoveredCell.cycle}: Health {hoveredCell.health}% —{' '}
                <strong className="text-[#EAECE9]">{hoveredCell.note}</strong>]
              </span>
            </div>
          </div>
        </div>

        {/* 2D Telemetry Matrix Table with Secondary D3 SVG Line Trajectory Overlay */}
        <div className="relative overflow-x-auto">
          <table className="w-full border-collapse text-left relative z-10">
            <thead>
              <tr className="border-b border-white/[0.08] text-[10px] font-mono uppercase tracking-wider text-[#949C96]">
                <th className="py-2.5 px-3 min-w-[160px]">Axial Stage (Y-Axis)</th>
                <th className="py-2.5 px-2 text-center">Stn</th>
                {CYCLE_COLUMNS.map((cyc) => {
                  const isInflection = cyc === 85;
                  const isCurrent = cyc === 142;
                  return (
                    <th
                      key={cyc}
                      className={`py-2.5 px-2 text-center ${
                        isInflection
                          ? 'bg-[#D8B65E]/15 text-[#D8B65E] border-x border-[#D8B65E]/40 rounded-t-xl'
                          : isCurrent
                            ? 'text-[#B8CE82] font-bold'
                            : ''
                      }`}
                    >
                      <div>Cycle {cyc}</div>
                      {isInflection && (
                        <div className="text-[8px] font-mono text-[#D8B65E] tracking-widest">
                          ★ INFLECTION
                        </div>
                      )}
                      {isCurrent && (
                        <div className="text-[8px] font-mono text-[#B8CE82] tracking-widest">
                          CURRENT
                        </div>
                      )}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06] text-xs font-mono">
              {matrixRows.map((row) => {
                const isRowSelected = row.id === activeStage.id;
                return (
                  <tr
                    key={row.id}
                    onClick={() => setSelectedStageId(row.id)}
                    className={`transition-colors cursor-pointer ${
                      isRowSelected ? 'bg-[#2B302D]' : 'hover:bg-[#2B302D]/50'
                    }`}
                  >
                    <td className="py-2 px-3 font-bold text-[#EAECE9] flex items-center gap-2">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          row.healthPct > 85
                            ? 'bg-[#B8CE82]'
                            : row.healthPct >= 70
                              ? 'bg-[#D8B65E]'
                              : 'bg-[#D97865]'
                        }`}
                      />
                      <span>{row.matrixLabel}</span>
                    </td>
                    <td className="py-2 px-2 text-center text-[10px] text-[#949C96]">
                      {row.station}
                    </td>

                    {row.cycleHistory.map((cell, cIdx) => {
                      const isInflectionCol = cell.cycle === 85;
                      const isInflectionTarget =
                        row.id === 'HPC_MID_3_4' && cell.cycle === 85;
                      const displayHealth =
                        cell.cycle === 142 ? row.healthPct : cell.health;

                      return (
                        <td
                          key={cell.cycle}
                          className={`py-1.5 px-1.5 text-center ${
                            isInflectionCol
                              ? 'bg-[#D8B65E]/10 border-x border-[#D8B65E]/30'
                              : ''
                          }`}
                        >
                          <button
                            type="button"
                            data-testid={`heatmap-cell-${row.id}-${cell.cycle}`}
                            onMouseEnter={() =>
                              setHoveredCell({
                                stageName: row.matrixLabel,
                                station: row.station,
                                cycle: cell.cycle,
                                health: displayHealth,
                                note: cell.note,
                              })
                            }
                            onFocus={() =>
                              setHoveredCell({
                                stageName: row.matrixLabel,
                                station: row.station,
                                cycle: cell.cycle,
                                health: displayHealth,
                                note: cell.note,
                              })
                            }
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedStageId(row.id);
                              setSelectedCycleIdx(cIdx);
                              setHoveredCell({
                                stageName: row.matrixLabel,
                                station: row.station,
                                cycle: cell.cycle,
                                health: displayHealth,
                                note: cell.note,
                              });
                            }}
                            className={`w-full py-1.5 px-2 rounded-xl border text-[11px] font-mono tabular-nums transition-all cursor-pointer relative ${getCellStyle(
                              displayHealth
                            )} ${
                              isInflectionTarget
                                ? 'ring-2 ring-[#D8B65E] shadow-[0_0_15px_rgba(216,182,94,0.45)]'
                                : ''
                            }`}
                          >
                            {displayHealth}%
                            {isInflectionTarget && (
                              <span
                                title="Cycle 85 Degradation Inflection Point"
                                className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 rounded-full bg-[#D8B65E] text-[#181B19] text-[9px] font-bold flex items-center justify-center shadow"
                              >
                                !
                              </span>
                            )}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Direct Secondary D3 SVG Line Trajectory Overlay across the Heatmap Columns */}
          {showDirectGridOverlay && (
            <svg
              data-testid="heatmap-direct-d3-overlay"
              viewBox="0 0 1000 330"
              preserveAspectRatio="none"
              className="absolute inset-0 w-full h-full pointer-events-none z-20"
              aria-hidden="true"
            >
              {/* Predicted RUL Trajectory Curve (Dashed) */}
              <path
                d={directGridOverlayPaths.predictedPath}
                fill="none"
                stroke="#82A995"
                strokeWidth="2.2"
                strokeDasharray="6 4"
                opacity="0.85"
              />
              {/* Actual RUL Trajectory Curve (Solid) */}
              <path
                d={directGridOverlayPaths.actualPath}
                fill="none"
                stroke={activeTone.hex}
                strokeWidth="3"
                strokeLinecap="round"
                opacity="0.92"
              />
              {directGridOverlayPaths.nodes.map((n) => (
                <g key={n.cycle}>
                  <circle
                    cx={n.cx}
                    cy={n.cyPred}
                    r="3.2"
                    fill="#181C1A"
                    stroke="#82A995"
                    strokeWidth="1.5"
                  />
                  <circle
                    cx={n.cx}
                    cy={n.cyActual}
                    r="4.2"
                    fill={activeTone.hex}
                    stroke="#181C1A"
                    strokeWidth="1.5"
                  />
                </g>
              ))}
            </svg>
          )}
        </div>

        {/* Dedicated D3-Based RUL Trajectory & Actual vs. Predicted Slope Comparison Chart */}
        {showRulOverlay && (
          <D3RulTrajectorySlopeOverlay
            activeStage={activeStage}
            rulTrajectory={activeRulTrajectory}
            selectedCycleIdx={selectedCycleIdx}
            onSelectCycleIdx={setSelectedCycleIdx}
            onHoverCyclePoint={(pt) =>
              setHoveredCell({
                stageName: activeStage.matrixLabel,
                station: activeStage.station,
                cycle: pt.cycle,
                health: pt.health,
                note: `${pt.note} · Actual RUL ${pt.actualRul}c vs Pred ${pt.predictedRul}c`,
              })
            }
            activeToneHex={activeTone.hex}
          />
        )}
      </section>

      {/* =====================================================================
          3. DEEP-DIVE STAGE DIAGNOSTIC & PHYSICAL WEAR PANEL (3-CARD + FLEET MINI-CARD)
         ===================================================================== */}
      <section
        data-testid="stage-diagnostic-wear-panel"
        className="space-y-4"
      >
        {/* Panel Header with Dynamic High-Urgency Alert Notification Badge (< 70% Stage Health) */}
        <div className="backdrop-blur-2xl bg-[#232725]/88 border border-white/[0.08] rounded-[24px] px-5 py-3.5 shadow-[0_12px_32px_rgba(0,0,0,0.4)] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div
              className={`w-9 h-9 rounded-2xl border flex items-center justify-center ${
                isHighUrgencyAlert
                  ? 'bg-[#D97865]/20 border-[#D97865]/60 text-[#D97865]'
                  : 'bg-[#1B1F1D] border-white/10 text-[#B8CE82]'
              }`}
            >
              {isHighUrgencyAlert ? (
                <ShieldAlert className="w-4 h-4 animate-pulse" />
              ) : (
                <Gauge className="w-4 h-4" />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-[15px] font-normal text-[#EAECE9]">
                  Stage Diagnostic &amp; Physical Wear Panel
                </h2>
                <span className="text-[10px] font-mono uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#1B1F1D] border border-white/10 text-[#949C96]">
                  {activeStage.shortName} · {activeStage.station}
                </span>
              </div>
              <p className="text-[11px] text-[#949C96] mt-0.5">
                Real-Time Clearance, Polytropic Efficiency &amp; Borescope Structural Wear Diagnostics
              </p>
            </div>
          </div>

          {/* Dynamic Alert Notification Badge (Triggers 'High-Urgency' Blinking State if Stage Health < 70%) */}
          {isHighUrgencyAlert ? (
            <div
              role="alert"
              aria-live="assertive"
              data-testid="high-urgency-stage-alert-badge"
              className="flex flex-wrap items-center gap-3 px-3.5 py-2 rounded-2xl bg-[#D97865]/20 border-2 border-[#D97865] shadow-[0_0_24px_rgba(217,120,101,0.38)] animate-pulse"
            >
              <div className="flex items-center gap-2">
                <span className="relative flex h-3 w-3 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#D97865] opacity-90" />
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-[#D97865]" />
                </span>
                <span className="px-2 py-0.5 rounded-md bg-[#D97865] text-[#181B19] text-[10px] font-mono font-bold uppercase tracking-wider">
                  HIGH-URGENCY
                </span>
                <span className="text-xs font-mono font-bold text-[#EAECE9] uppercase tracking-wider">
                  Stage Health {effectiveAlertHealth}% (&lt;70% Limit)
                </span>
              </div>

              <button
                type="button"
                data-testid="link-airworthiness-mandatory-inspection"
                onClick={handleNavigateToAirworthiness}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#EAECE9] hover:bg-[#B8CE82] text-[#181B19] text-[10px] font-mono font-bold uppercase tracking-wider transition-colors cursor-pointer shadow-sm"
              >
                <span>Airworthiness · Mandatory Inspection</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div
              data-testid="nominal-stage-alert-badge"
              className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-2xl bg-[#1B1F1D]/90 border border-white/10"
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: activeTone.hex }}
              />
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#949C96]">
                Alert Status: <strong className={activeTone.text}>Within 70% Safety Threshold ({activeStage.healthPct}%)</strong>
              </span>
              <button
                type="button"
                onClick={handleNavigateToAirworthiness}
                className="inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider text-[#B8CE82] hover:underline cursor-pointer ml-1"
              >
                <span>Airworthiness Tab</span>
                <ArrowUpRight className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>

        {directiveFeedback && (
          <div
            role="status"
            data-testid="directive-action-feedback"
            className="backdrop-blur-2xl bg-[#232725]/95 border border-[#B8CE82]/60 rounded-2xl px-4 py-2.5 text-xs font-mono text-[#EAECE9] flex items-center justify-between shadow-xl"
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#B8CE82] shrink-0" />
              <span>{directiveFeedback}</span>
            </div>
            <button
              type="button"
              onClick={() => setDirectiveFeedback(null)}
              className="text-[10px] uppercase tracking-wider text-[#B8CE82] hover:text-[#EAECE9] cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
          {/* CARD A: Physical Wear Gauges (Left 5 Cols) */}
          <div
            data-testid="stage-physical-wear-card"
            className={`lg:col-span-5 backdrop-blur-2xl bg-[#232725]/88 border rounded-[24px] p-5 shadow-[0_16px_40px_rgba(0,0,0,0.45)] flex flex-col justify-between space-y-4 ${
              isHighUrgencyAlert ? 'border-[#D97865]/60' : 'border-white/[0.08]'
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Gauge className="w-4 h-4 text-[#B8CE82]" />
                  <h3 className="text-[14px] font-normal text-[#EAECE9]">
                    Physical Wear Gauges · {activeStage.shortName}
                  </h3>
                </div>
                <p className="text-[11px] text-[#949C96] mt-0.5">
                  {activeStage.station} Gas-Path Aerodynamic &amp; Clearance Telemetry
                </p>
              </div>
              <span
                className={`px-3 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider border ${
                  isHighUrgencyAlert ? `${activeTone.badgeBg} animate-pulse` : activeTone.badgeBg
                }`}
              >
                {activeStage.healthPct}% HEALTH
              </span>
            </div>

            {/* Inline High-Urgency Mandatory Inspection Callout inside Physical Wear Card when < 70% */}
            {isHighUrgencyAlert && (
              <div
                data-testid="wear-card-high-urgency-callout"
                className="rounded-2xl bg-[#D97865]/15 border border-[#D97865]/65 p-3 flex items-center justify-between gap-3"
              >
                <div className="flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-[#D97865] shrink-0 mt-0.5 animate-bounce" />
                  <div className="space-y-0.5">
                    <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#D97865]">
                      HIGH-URGENCY WEAR THRESHOLD BREACH (&lt;70%)
                    </div>
                    <p className="text-[11px] text-[#EAECE9] leading-snug">
                      {activeStage.shortName} health at <strong>{effectiveAlertHealth}%</strong> ({activeStage.ammReference}). Mandatory airworthiness sign-off required.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  data-testid="wear-card-airworthiness-link"
                  onClick={handleNavigateToAirworthiness}
                  className="shrink-0 px-2.5 py-1.5 rounded-xl bg-[#D97865] hover:bg-[#e28876] text-[#181B19] text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <span>Airworthiness</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* 1. Blade Tip Clearance Gap Horizontal Tolerance Bar */}
            <div className="bg-[#1B1F1D]/90 border border-white/[0.07] rounded-2xl p-3.5 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#949C96]">
                  Blade Tip Clearance Gap
                </span>
              <span className="text-xs font-mono font-bold text-[#EAECE9] tabular-nums">
                Current: <strong className={activeTone.text}>{activeStage.tipClearanceCurrentMm.toFixed(2)} mm</strong>
              </span>
            </div>

            <div className="relative h-3 bg-[#141715] rounded-full overflow-visible">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${tipPct}%`,
                  background:
                    activeStage.tipClearanceCurrentMm >= 1.1
                      ? 'linear-gradient(90deg, #82A995 0%, #D8B65E 50%, #D97865 100%)'
                      : 'linear-gradient(90deg, #82A995 0%, #B8CE82 100%)',
                }}
              />
              {/* Nominal Marker Diamond */}
              <div
                title={`Nominal: ${activeStage.tipClearanceNominalMm.toFixed(2)} mm`}
                style={{ left: `${nominalPct}%` }}
                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-2.5 h-2.5 rotate-45 bg-[#B8CE82] border border-[#141715]"
              />
              {/* AMM Limit Marker Diamond */}
              <div
                title={`AMM Limit: ${activeStage.tipClearanceLimitMm.toFixed(2)} mm`}
                style={{ left: '96%' }}
                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-2.5 h-2.5 rotate-45 bg-[#D97865] border border-[#EAECE9]"
              />
            </div>

            <div className="flex items-center justify-between text-[10px] font-mono text-[#949C96] pt-0.5">
              <span>Nominal: {activeStage.tipClearanceNominalMm.toFixed(2)} mm</span>
              <span className="text-[#D8B65E]">
                ΔGap: +{(activeStage.tipClearanceCurrentMm - activeStage.tipClearanceNominalMm).toFixed(2)} mm
              </span>
              <span className="text-[#D97865]">
                AMM Limit: {activeStage.tipClearanceLimitMm.toFixed(2)} mm
              </span>
            </div>
          </div>

          {/* 2 & 3. Radial Dotted Arc Meters: Flow Capacity Decrement (ΔFlow) & Isentropic Efficiency Decrement (Δη) */}
          <div className="grid grid-cols-2 gap-3">
            <RadialDecrementArcMeter
              label="Flow Cap (ΔFlow)"
              subLabel="Throat"
              valueText={`${activeStage.deltaFlowPct.toFixed(2)}%`}
              severityFraction={Math.abs(activeStage.deltaFlowPct) / 2.2}
              colorHex={Math.abs(activeStage.deltaFlowPct) > 1.0 ? '#D8B65E' : '#B8CE82'}
            />
            <RadialDecrementArcMeter
              label="Isentropic (Δη)"
              subLabel="Polytropic"
              valueText={`${activeStage.deltaEfficiencyPct.toFixed(1)}%`}
              severityFraction={Math.abs(activeStage.deltaEfficiencyPct) / 2.6}
              colorHex={Math.abs(activeStage.deltaEfficiencyPct) > 1.5 ? '#D97865' : '#D8B65E'}
            />
          </div>

          {/* 4. Aerodynamic Chord Loss Progress Indicator */}
          <div className="bg-[#1B1F1D]/90 border border-white/[0.07] rounded-2xl p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#949C96]">
                Aerodynamic Chord Loss (Dust Erosion)
              </span>
              <span className="text-xs font-mono font-bold text-[#B8CE82] tabular-nums">
                {activeStage.chordLossMm.toFixed(2)} mm chord loss
              </span>
            </div>

            {/* Segmented Tolerance Bar */}
            <div className="grid grid-cols-10 gap-1">
              {Array.from({ length: 10 }, (_, idx) => {
                const segActive = (idx + 1) * 10 <= chordPct + 5;
                return (
                  <div
                    key={idx}
                    className={`h-2 rounded-sm ${
                      segActive
                        ? idx >= 7
                          ? 'bg-[#D97865]'
                          : idx >= 4
                            ? 'bg-[#D8B65E]'
                            : 'bg-[#B8CE82]'
                        : 'bg-[#141715]'
                    }`}
                  />
                );
              })}
            </div>

            <div className="flex items-center justify-between text-[10px] font-mono text-[#949C96]">
              <span>0.00 mm (New Airfoil)</span>
              <span>Max Allowable: {activeStage.chordLossMaxMm.toFixed(2)} mm</span>
            </div>
          </div>
        </div>

        {/* CARD B: Borescope & Structural Inspection Record + Cross-Fleet Comparison Mini-Card (Center 4 Cols) */}
        <div className="lg:col-span-4 flex flex-col gap-4 justify-between">
          {/* Card B: Borescope & Structural Inspection Record */}
          <div
            data-testid="stage-borescope-record-card"
            className="backdrop-blur-2xl bg-[#232725]/88 border border-white/[0.08] rounded-[24px] p-5 shadow-[0_16px_40px_rgba(0,0,0,0.45)] space-y-3.5 flex-1 flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-[#B8CE82]" />
                  <h3 className="text-[14px] font-normal text-[#EAECE9]">
                    Borescope &amp; Structural Record
                  </h3>
                </div>
                <p className="text-[11px] text-[#949C96] mt-0.5">
                  Ref: {activeStage.ammReference} · Optical Probe Inspection
                </p>
              </div>
              <ArrowUpRight className="w-4 h-4 text-[#B8CE82]" />
            </div>

            {/* Schematic Borescope Visual Callout with Angled SVG Leader Line */}
            <div className="relative bg-[#1B1F1D]/90 border border-white/[0.07] rounded-2xl p-3.5 overflow-hidden">
              <div className="flex items-center justify-between gap-3">
                {/* Left Cross-Sectional Stator/Blade Target Diagram */}
                <div className="relative w-20 h-20 shrink-0 flex items-center justify-center">
                  <svg viewBox="0 0 80 80" className="w-full h-full">
                    <circle
                      cx="40"
                      cy="40"
                      r="34"
                      fill="none"
                      stroke="rgba(255,255,255,0.2)"
                      strokeWidth="1.5"
                      strokeDasharray="3 3"
                    />
                    <circle
                      cx="40"
                      cy="40"
                      r="22"
                      fill="rgba(43,48,45,0.7)"
                      stroke="#82A995"
                      strokeWidth="1.5"
                    />
                    {/* Simulated Airfoil Profile */}
                    <path
                      d="M 28 52 Q 38 24 54 28 Q 46 46 28 52 Z"
                      fill="rgba(217,120,101,0.35)"
                      stroke="#D97865"
                      strokeWidth="1.5"
                    />
                    {/* Pinpoint Hotspot & Angled Leader Line */}
                    <circle cx="46" cy="32" r="3.5" fill="#B8CE82" />
                    <polyline
                      points="46,32 60,18 78,18"
                      fill="none"
                      stroke="#B8CE82"
                      strokeWidth="1.5"
                    />
                  </svg>
                </div>

                {/* Right Callout Tag */}
                <div className="flex-1 border-l-2 border-[#B8CE82] pl-3 space-y-1">
                  <div className="text-[9px] font-mono font-bold uppercase tracking-wider text-[#B8CE82]">
                    OPTICAL FINDING // {activeStage.station}
                  </div>
                  <p className="text-xs text-[#EAECE9] leading-relaxed">
                    {activeStage.borescopeDefect}
                  </p>
                </div>
              </div>

              <div className="mt-3 pt-2.5 border-t border-white/[0.07] flex items-center gap-2 text-[11px] font-mono text-[#D8B65E]">
                <AlertTriangle className="w-3.5 h-3.5 text-[#D97865] shrink-0" />
                <span>{activeStage.severityText}</span>
              </div>
            </div>
          </div>

          {/* 4. CROSS-FLEET STAGE COMPARISON MINI-CARD */}
          <div
            data-testid="cross-fleet-stage-comparison-card"
            className="backdrop-blur-2xl bg-[#232725]/88 border border-white/[0.08] rounded-[24px] p-4 shadow-[0_16px_40px_rgba(0,0,0,0.45)] space-y-2.5"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[#EAECE9]">
                Cross-Fleet Stage Comparison (100 Engines)
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-[#2B302D] border border-white/10 text-[9px] font-mono font-bold text-[#B8CE82] uppercase tracking-wider">
                {activeStage.percentileSeverity}th Pct Severity
              </span>
            </div>

            <div className="space-y-2 text-xs font-mono">
              {/* Bar 1: This Engine */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10px]">
                  <span className="uppercase tracking-wider text-[#949C96]">
                    This Engine ({activeEngineId})
                  </span>
                  <span className={`font-bold ${activeTone.text}`}>
                    {activeStage.healthPct}% Health
                  </span>
                </div>
                <div className="w-full h-2 bg-[#141715] rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${activeTone.barBg}`}
                    style={{ width: `${activeStage.healthPct}%` }}
                  />
                </div>
              </div>

              {/* Bar 2: Fleet Average */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10px]">
                  <span className="uppercase tracking-wider text-[#949C96]">
                    Boeing 787 Fleet Average
                  </span>
                  <span className="font-bold text-[#B8CE82]">{activeStage.fleetAvgPct}% Health</span>
                </div>
                <div className="w-full h-2 bg-[#141715] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#B8CE82]"
                    style={{ width: `${activeStage.fleetAvgPct}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CARD C: Prescriptive Maintenance Action Directive (Right 3 Cols) */}
        <div
          data-testid="prescriptive-maintenance-card"
          className="lg:col-span-3 backdrop-blur-2xl bg-[#232725]/88 border border-white/[0.08] rounded-[24px] p-5 shadow-[0_16px_40px_rgba(0,0,0,0.45)] flex flex-col justify-between space-y-4"
        >
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wrench className="w-4 h-4 text-[#B8CE82]" />
                <h3 className="text-[14px] font-normal text-[#EAECE9]">
                  Prescriptive Action Directive
                </h3>
              </div>
              <Sparkles className="w-4 h-4 text-[#B8CE82]" />
            </div>
            <p className="text-[11px] text-[#949C96]">
              DO-178C Advisory · Stage-Specific Workscope
            </p>

            <div className="bg-[#1B1F1D]/90 border border-white/[0.07] rounded-2xl p-3.5 space-y-2 mt-2">
              <div className="text-[10px] font-mono uppercase tracking-wider text-[#B8CE82]">
                Primary Failure Mode
              </div>
              <div className="text-xs font-mono font-bold text-[#EAECE9]">
                {activeStage.statusBadge === 'BLADE_RUB'
                  ? 'Abradable Tip Rub & Stator Erosion'
                  : activeStage.statusBadge === 'FOULING'
                    ? 'Gas-Path Particulate Fouling'
                    : activeStage.statusBadge === 'CRITICAL' || activeStage.statusBadge === 'CREEP'
                      ? 'High-Temp TBC Spallation & Creep'
                      : 'Nominal Boundary Layer Wear'}
              </div>
              <p className="text-[11px] text-[#949C96] leading-relaxed">
                Select an authorized maintenance directive below to mitigate{' '}
                <strong className="text-[#EAECE9]">{activeStage.shortName}</strong> degradation and
                update fleet RUL prognostics:
              </p>
            </div>
          </div>

          {/* 3 Direct Prescriptive Maintenance Action Buttons */}
          <div className="space-y-2.5">
            {/* Action 1: Fouling -> AMM 72-00 Detergent Water Wash */}
            <button
              type="button"
              data-testid="btn-prescribe-water-wash"
              onClick={handlePrescribeWaterWash}
              className={`w-full text-left p-3 rounded-2xl border transition-all cursor-pointer flex items-start gap-2.5 ${
                activeStage.primaryDirectiveType === 'WATER_WASH'
                  ? 'bg-[#B8CE82] text-[#181B19] border-[#B8CE82] font-bold shadow-md'
                  : 'bg-[#2B302D] hover:bg-[#343A36] text-[#EAECE9] border-white/[0.08]'
              }`}
            >
              <Droplets className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="text-[10px] font-mono uppercase tracking-wider leading-snug">
                <div>Prescribe AMM 72-00 Detergent Water Wash (+32c recovery)</div>
                <div
                  className={`text-[9px] mt-0.5 ${
                    activeStage.primaryDirectiveType === 'WATER_WASH'
                      ? 'text-[#181B19]/80'
                      : 'text-[#B8CE82]'
                  }`}
                >
                  {isWaterWashed ? '✓ Executed on Active Engine' : 'Recommended for Compressor Fouling'}
                </div>
              </div>
            </button>

            {/* Action 2: Blade Rubbing -> AMM 72-31 Borescope Blending Shop Visit */}
            <button
              type="button"
              data-testid="btn-schedule-borescope-blend"
              onClick={handleScheduleBorescopeBlend}
              className={`w-full text-left p-3 rounded-2xl border transition-all cursor-pointer flex items-start gap-2.5 ${
                activeStage.primaryDirectiveType === 'BLADE_RUB'
                  ? 'bg-[#B8CE82] text-[#181B19] border-[#B8CE82] font-bold shadow-md'
                  : 'bg-[#2B302D] hover:bg-[#343A36] text-[#EAECE9] border-white/[0.08]'
              }`}
            >
              <Wrench className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="text-[10px] font-mono uppercase tracking-wider leading-snug">
                <div>Schedule AMM 72-31 Borescope Blending Shop Visit</div>
                <div
                  className={`text-[9px] mt-0.5 ${
                    activeStage.primaryDirectiveType === 'BLADE_RUB'
                      ? 'text-[#181B19]/80'
                      : 'text-[#D8B65E]'
                  }`}
                >
                  Recommended for Stg 3-4 Blade Tip Rub
                </div>
              </div>
            </button>

            {/* Action 3: HPT Thermal Creep -> Check LLP Rotor Disk Scrap Limit */}
            <button
              type="button"
              data-testid="btn-check-llp-scrap-limit"
              onClick={handleCheckLlpClock}
              className={`w-full text-left p-3 rounded-2xl border transition-all cursor-pointer flex items-start gap-2.5 ${
                activeStage.primaryDirectiveType === 'HPT_CREEP'
                  ? 'bg-[#D97865] text-[#181B19] border-[#D97865] font-bold shadow-md'
                  : 'bg-[#2B302D] hover:bg-[#343A36] text-[#EAECE9] border-white/[0.08]'
              }`}
            >
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="text-[10px] font-mono uppercase tracking-wider leading-snug">
                <div>Check LLP Rotor Disk Scrap Limit (15,000c Hard Clock)</div>
                <div
                  className={`text-[9px] mt-0.5 ${
                    activeStage.primaryDirectiveType === 'HPT_CREEP'
                      ? 'text-[#181B19]/80'
                      : 'text-[#82A995]'
                  }`}
                >
                  FAA 14 CFR § 33.70 Airworthiness Dossier
                </div>
              </div>
            </button>
          </div>
        </div>
        </div>
      </section>
      </div>
    </div>
  );
}

export default StageDegradationMap;
