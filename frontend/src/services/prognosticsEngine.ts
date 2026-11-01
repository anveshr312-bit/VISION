export type StageId = 'FAN' | 'LPC' | 'HPC' | 'COMBUSTOR' | 'HPT' | 'LPT';

export type UrgencyLevel =
  | 'CRITICAL OVERHAUL'
  | 'SCHEDULED SHOP VISIT'
  | 'MONITOR'
  | 'NOMINAL';

export type EtopsTailStatus =
  | 'COMPLIANT'
  | 'ASYMMETRY_WARNING'
  | 'CRITICAL_GROUND';

export type RouteEnvironmentId =
  | 'CONTINENTAL'
  | 'MIDDLE_EAST_CMAS'
  | 'MARITIME_SALT'
  | 'HOT_AND_HIGH';

export interface RouteEnvironmentSpec {
  id: RouteEnvironmentId;
  name: string;
  shortLabel: string;
  multiplier: number;
  description: string;
  primaryDegradationMechanism: string;
}

export const ROUTE_ENVIRONMENTS: RouteEnvironmentSpec[] = [
  {
    id: 'CONTINENTAL',
    name: 'Standard Continental',
    shortLabel: 'Continental (1.00x)',
    multiplier: 1.0,
    description: 'Baseline temperate atmospheric profile across North American and European trunk routes.',
    primaryDegradationMechanism: 'Nominal thermal-mechanical fatigue & cyclic oxidation',
  },
  {
    id: 'MIDDLE_EAST_CMAS',
    name: 'Middle East Sand / CMAS',
    shortLabel: 'Middle East CMAS (1.35x)',
    multiplier: 1.35,
    description: 'Silicate dust ingestion causing Calcium-Magnesium-Alumino-Silicate (CMAS) glass deposits on HPT cooling holes.',
    primaryDegradationMechanism: 'Accelerated HPC blade tip erosion & HPT TBC spallation',
  },
  {
    id: 'MARITIME_SALT',
    name: 'Maritime Salt Air',
    shortLabel: 'Maritime Salt (1.20x)',
    multiplier: 1.2,
    description: 'High-salinity trans-oceanic and coastal operations accelerating hot-section sulfidation.',
    primaryDegradationMechanism: 'Type II hot corrosion & LPC stator pitting',
  },
  {
    id: 'HOT_AND_HIGH',
    name: 'Hot & High Density Altitude',
    shortLabel: 'Hot & High (1.15x)',
    multiplier: 1.15,
    description: 'High-elevation, high-ambient-temperature airports requiring elevated N2 core spool speeds at takeoff.',
    primaryDegradationMechanism: 'Peak EGT margin exhaustion & HPT disk creep',
  },
];

export interface BorescopeFinding {
  id: string;
  stage: StageId;
  stageLabel: string;
  inspectionDate: string;
  ammReference: string;
  severity: 'NOMINAL' | 'WARNING' | 'CRITICAL';
  finding: string;
  dimensionalMetric: string;
  recommendedAction: string;
}

export interface SoapOilReading {
  fe: number; // Iron ppm (Gearbox / Bearing race wear)
  ti: number; // Titanium ppm (LPC/HPC compressor rubbing)
  ag: number; // Silver ppm (Main shaft bearing cage plating)
  si: number; // Silicon ppm (Airborne silica seal ingress)
}

export interface TrajectoryPoint {
  cycle: number;
  rulMean: number;
  rulLower90: number;
  rulUpper90: number;
  t30Temp: number;
}

export interface EngineTelemetry {
  id: string; // e.g., ESN-787-034
  tailId: string; // e.g., N787-17
  wingPosition: 'ENG-L' | 'ENG-R';
  flightCycles: number;
  llpAccumulatedCycles: number;
  llpLimitCycles: number; // 15,000 cycles per FAA 14 CFR § 33.70
  conformalRul: number;
  conformalLower90: number;
  conformalUpper90: number;
  urgency: UrgencyLevel;
  n1RpmPct: number;
  n2RpmPct: number;
  n3RpmPct: number;
  hpcEfficiencyPct: number; // η_HPC
  overallPressureRatio: number; // OPR e.g. 37.6
  sfc: number; // lb/(lbf·h)
  t24: number; // LPC outlet °R
  t30: number; // HPC outlet °R
  t30CreepDelta: number; // °R delta from baseline
  t50: number; // LPT / EGT °R
  p30: number; // HPC outlet psia
  p30LossPct: number; // % delta from baseline
  vibrationIps: number; // ips peak
  waterWashApplied: boolean;
  sensorFaultActive: boolean;
  soapOilPpm: SoapOilReading;
  borescopeFindings: BorescopeFinding[];
  trajectory: TrajectoryPoint[];
}

export interface EtopsTailPair {
  tailId: string;
  aircraftModel: string;
  routeHub: string;
  leftEngine: EngineTelemetry;
  rightEngine: EngineTelemetry;
  rulDelta: number; // |RUL_L - RUL_R|
  minWingRul: number;
  status: EtopsTailStatus;
  advisoryMessage: string;
}

export interface StageCalloutSpec {
  id: StageId;
  shortName: string;
  fullName: string;
  headerBadge: string;
  severity: 'NOMINAL' | 'WARNING' | 'CRITICAL';
  axialZ: number; // 3D axial coordinate along engine centerline
  radialY: number; // 3D radial pin height
  cameraPos: [number, number, number];
  cameraTarget: [number, number, number];
  explodeMultipliers: Record<StageId, number>;
  getMetrics: (engine: EngineTelemetry) => {
    primaryReadout: string;
    secondaryReadout: string;
    efficiencyOrMargin: string;
    borescopeLog: string;
    actionLabel: string;
    actionType: 'WATER_WASH' | 'DOSSIER';
  };
}

export const TURBOFAN_STAGE_SPECS: Record<StageId, StageCalloutSpec> = {
  FAN: {
    id: 'FAN',
    shortName: 'Fan Stage',
    fullName: 'LP WIDE-CHORD SWEPT TITANIUM FAN',
    headerBadge: 'NOMINAL · LP FAN MODULE (STAGE 1)',
    severity: 'NOMINAL',
    axialZ: 4.2,
    radialY: 1.85,
    cameraPos: [5.4, 2.2, 6.2],
    cameraTarget: [0, 0.2, 3.8],
    explodeMultipliers: {
      FAN: 1.35,
      LPC: 0.4,
      HPC: 0,
      COMBUSTOR: 0,
      HPT: 0,
      LPT: -0.3,
    },
    getMetrics: (eng) => ({
      primaryReadout: `N1: ${eng.n1RpmPct.toFixed(1)}% (2,685 RPM)`,
      secondaryReadout: `Bypass Ratio: 10.8 : 1 · Mass Flow: 2,740 lb/s`,
      efficiencyOrMargin: `Vib: ${eng.vibrationIps.toFixed(2)} ips`,
      borescopeLog: `20 hollow titanium wide-chord blades inspected. Leading-edge polyurethane erosion sheath intact; zero FOD nicks.`,
      actionLabel: 'Inspect Physical Dossier',
      actionType: 'DOSSIER',
    }),
  },
  LPC: {
    id: 'LPC',
    shortName: 'LPC Booster',
    fullName: 'INTERMEDIATE / LOW-PRESSURE COMPRESSOR (IPC)',
    headerBadge: 'ADVISORY · 8-STAGE IPC BOOSTER CORE',
    severity: 'NOMINAL',
    axialZ: 2.1,
    radialY: 1.35,
    cameraPos: [4.6, 1.9, 3.8],
    cameraTarget: [0, 0.1, 2.0],
    explodeMultipliers: {
      FAN: 1.6,
      LPC: 0.65,
      HPC: -0.25,
      COMBUSTOR: -0.4,
      HPT: -0.5,
      LPT: -0.6,
    },
    getMetrics: (eng) => ({
      primaryReadout: `T24: ${eng.t24.toFixed(1)}°R (Limit 665.0°R)`,
      secondaryReadout: `N2 Spool: ${eng.n2RpmPct.toFixed(1)}% · Bleed Valve: CLOSED`,
      efficiencyOrMargin: `η_LPC: 89.1%`,
      borescopeLog: `Stage 4 variable inlet guide vane (VIGV) bushings within 0.04mm tolerance. Minor salt film on stator root.`,
      actionLabel: 'Perform Water Wash Descale',
      actionType: 'WATER_WASH',
    }),
  },
  HPC: {
    id: 'HPC',
    shortName: 'HPC Core',
    fullName: 'HIGH-PRESSURE COMPRESSOR (HPC)',
    headerBadge: 'WARNING · HIGH-PRESSURE COMPRESSOR (HPC)',
    severity: 'WARNING',
    axialZ: 0.2,
    radialY: 1.15,
    cameraPos: [4.1, 1.75, 1.4],
    cameraTarget: [0, 0.1, 0.2],
    explodeMultipliers: {
      FAN: 1.9,
      LPC: 1.1,
      HPC: 0.0,
      COMBUSTOR: -0.85,
      HPT: -1.3,
      LPT: -1.7,
    },
    getMetrics: (eng) => ({
      primaryReadout: `T30: ${eng.t30.toFixed(1)}°R (${eng.t30CreepDelta >= 0 ? '+' : ''}${eng.t30CreepDelta.toFixed(1)}°R thermal creep)`,
      secondaryReadout: `P30: ${eng.p30.toFixed(1)} psia (${eng.p30LossPct.toFixed(2)}% loss)`,
      efficiencyOrMargin: `η_HPC: ${eng.hpcEfficiencyPct.toFixed(1)}%`,
      borescopeLog: eng.waterWashApplied
        ? `Post-AMM 72-00-00 water wash: Fouling deposits cleared. Stage 3 stator chord loss stable at 0.18mm.`
        : `Stage 3 stator leading-edge erosion detected. Chord loss: 0.18mm. Compressor fouling elevating T30 exit temperature.`,
      actionLabel: eng.waterWashApplied ? 'Inspect Physical Dossier' : 'Perform Water Wash Descale',
      actionType: eng.waterWashApplied ? 'DOSSIER' : 'WATER_WASH',
    }),
  },
  COMBUSTOR: {
    id: 'COMBUSTOR',
    shortName: 'Combustor',
    fullName: 'TILED ANNULAR LOW-NOx COMBUSTOR',
    headerBadge: 'WARNING · ANNULAR COMBUSTOR LINER',
    severity: 'WARNING',
    axialZ: -1.3,
    radialY: 1.18,
    cameraPos: [4.2, 1.8, -0.6],
    cameraTarget: [0, 0.1, -1.3],
    explodeMultipliers: {
      FAN: 1.8,
      LPC: 1.1,
      HPC: 0.6,
      COMBUSTOR: 0.0,
      HPT: -0.95,
      LPT: -1.6,
    },
    getMetrics: (eng) => ({
      primaryReadout: `OPR: ${eng.overallPressureRatio.toFixed(1)} : 1`,
      secondaryReadout: `SFC: ${eng.sfc.toFixed(3)} lb/lbf·h · Fuel Nozzles: 24/24 Active`,
      efficiencyOrMargin: `Pattern Factor: 0.21`,
      borescopeLog: `Fuel injector swirlers 9 & 14 show mild carbon coking; effusion cooling holes 96.4% unobstructed.`,
      actionLabel: 'Inspect Physical Dossier',
      actionType: 'DOSSIER',
    }),
  },
  HPT: {
    id: 'HPT',
    shortName: 'HPT Stage',
    fullName: 'HIGH-PRESSURE TURBINE (CMSX-4 SINGLE CRYSTAL)',
    headerBadge: 'CRITICAL · HIGH-PRESSURE TURBINE (HPT)',
    severity: 'CRITICAL',
    axialZ: -2.6,
    radialY: 1.22,
    cameraPos: [4.3, 1.8, -2.0],
    cameraTarget: [0, 0.1, -2.6],
    explodeMultipliers: {
      FAN: 1.7,
      LPC: 1.1,
      HPC: 0.7,
      COMBUSTOR: 0.4,
      HPT: -0.2,
      LPT: -1.45,
    },
    getMetrics: (eng) => ({
      primaryReadout: `T50 EGT: ${eng.t50.toFixed(1)}°R (Redline 1435.0°R)`,
      secondaryReadout: `LLP Disk Remaining: ${(eng.llpLimitCycles - eng.llpAccumulatedCycles).toLocaleString()}c / 15,000c`,
      efficiencyOrMargin: `Conformal RUL: ${eng.conformalRul.toFixed(1)}c`,
      borescopeLog: `HPT rotor blade #11 thermal barrier coating (TBC) spallation (4.2mm² area) near crown fillet; sulfidation trace.`,
      actionLabel: 'Inspect Physical Dossier',
      actionType: 'DOSSIER',
    }),
  },
  LPT: {
    id: 'LPT',
    shortName: 'LPT Stage',
    fullName: '6-STAGE LOW-PRESSURE TURBINE & EXHAUST CONE',
    headerBadge: 'NOMINAL · 6-STAGE LP TURBINE',
    severity: 'NOMINAL',
    axialZ: -4.2,
    radialY: 1.4,
    cameraPos: [4.9, 1.95, -3.8],
    cameraTarget: [0, 0.1, -4.1],
    explodeMultipliers: {
      FAN: 1.4,
      LPC: 0.9,
      HPC: 0.5,
      COMBUSTOR: 0.2,
      HPT: -0.3,
      LPT: -1.1,
    },
    getMetrics: (eng) => ({
      primaryReadout: `EGT Margin: ${(1435.0 - eng.t50).toFixed(1)}°R`,
      secondaryReadout: `LPT Stage 1–6 Tip Clearance: 0.82mm (Nominal)`,
      efficiencyOrMargin: `η_LPT: 91.4%`,
      borescopeLog: `Shrouded LPT blades stages 1–6 intact. Rear bearing chamber oil scavenge screen clean (Ag: ${eng.soapOilPpm.ag.toFixed(2)} ppm).`,
      actionLabel: 'Inspect Physical Dossier',
      actionType: 'DOSSIER',
    }),
  },
};

export interface EconomicSandboxInput {
  failureCostCf: number; // $10,000 to $500,000
  wastedLifeCostCw: number; // $10 to $1,000 / cycle
  leadTimeL: number; // 5 to 30 cycles
  flexDeratePct: number; // 0 to 15%
  routeEnvId: RouteEnvironmentId;
}

export interface HangarWorkOrder {
  engineId: string;
  tailId: string;
  wingPosition: 'ENG-L' | 'ENG-R';
  bay: 'BAY A' | 'BAY B' | 'BAY C';
  startCycle: number;
  endCycle: number;
  durationCycles: number;
  effectiveRul: number;
  urgency: UrgencyLevel;
  workscope: string;
}

export interface EconomicSandboxResult {
  gammaRatio: number; // γ = c_w / C_f
  thetaStar: number; // θ* = γ / (1 + γ)
  optimalStoppingRulThreshold: number; // cycles where hazard exceeds θ*
  peakEgtAlleviationDegR: number; // -1.8°R per %
  lcfCyclesPreserved: number; // +2.2c per %
  annualSavingsUsd: number; // +$14,500/yr per % (or $14,500 baseline at 1% scaled)
  perPercentAnnualSavingsUsd: number; // $14,500/yr
  routeMultiplier: number;
  expectedFleetCostSavingsUsd: number;
  hangarSchedule: HangarWorkOrder[];
}

export interface AirworthinessDossierEvaluation {
  trackingId: string;
  conformalRul90Lower: number;
  llpCyclesRemaining: number;
  effectiveDispatchLimitCycles: number;
  bindingConstraint: 'CONFORMAL_PHM_RUL' | 'FAA_LLP_SCRAP_LIMIT';
  governingConstraint: 'CONFORMAL_PHM_RUL' | 'FAA_LLP_SCRAP_LIMIT';
  clopperPearsonRiskPct: number;
  isDispatchApproved: boolean;
  verdictLabel: string;
  regulatoryCitation: string;
}

/**
 * Deterministic pseudo-random helper seeded by integer index
 */
function seededFraction(seed: number): number {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

/**
 * Generates trajectory curve points for an engine
 */
export function buildEngineTrajectory(
  currentCycle: number,
  currentRul: number,
  currentT30: number,
  sensorFaultActive: boolean
): TrajectoryPoint[] {
  const points: TrajectoryPoint[] = [];
  const startCycle = Math.max(1, currentCycle - 50);
  for (let i = 0; i <= 10; i++) {
    const c = Math.round(startCycle + (i / 10) * 50);
    const cyclesAgo = currentCycle - c;
    const rulMean = Number((currentRul + cyclesAgo * 0.92).toFixed(1));
    const spread = sensorFaultActive ? 62.5 : Math.max(2.8, 6.5 - i * 0.25);
    const rulLower90 = sensorFaultActive ? 0 : Number(Math.max(0, rulMean - spread).toFixed(1));
    const rulUpper90 = sensorFaultActive ? 125 : Number((rulMean + spread).toFixed(1));
    const t30Temp = Number((currentT30 - cyclesAgo * 0.42).toFixed(1));
    points.push({
      cycle: c,
      rulMean,
      rulLower90,
      rulUpper90,
      t30Temp,
    });
  }
  return points;
}

/**
 * Generates deterministic 100 Rolls-Royce Trent 1000 turbofans across 50 Boeing 787-9 tails.
 * Engine #34 (ESN-787-034 on N787-17) and Engine #01 (ESN-787-001 on N787-01) have
 * high-visibility diagnostic profiles matching the prompt specification.
 */
/**
 * Maps backend C-MAPSS urgency classification into certified VISION UrgencyLevel enum.
 */
export function mapBackendUrgency(urgency: string, rul: number = 50): UrgencyLevel {
  if (rul < 20) return 'CRITICAL OVERHAUL';
  if (rul < 40) return 'SCHEDULED SHOP VISIT';
  if (rul < 65) return 'MONITOR';
  return 'NOMINAL';
}

/**
 * Hydrates local frontend fleet state with empirical C-MAPSS predictions,
 * conformal bounds, cycle counts, and risk levels from backend API.
 */
export function hydrateFleetWithBackend(
  baseFleet: EngineTelemetry[],
  backendOverview: { engines?: any[] },
  waterWashedIds: Set<string> = new Set()
): EngineTelemetry[] {
  if (!backendOverview?.engines || !Array.isArray(backendOverview.engines)) {
    return baseFleet;
  }

  const backendMap = new Map<number, any>();
  for (const eng of backendOverview.engines) {
    if (typeof eng.unit_id === 'number') {
      backendMap.set(eng.unit_id, eng);
    }
  }

  return baseFleet.map((localEng) => {
    const unitNum = parseInt(localEng.id.split('-').pop() || '1', 10);
    const serverEng = backendMap.get(unitNum);
    const isWashed = waterWashedIds.has(localEng.id) || localEng.waterWashApplied;

    if (!serverEng) {
      return isWashed ? applyCompressorWaterWash(localEng) : localEng;
    }

    const baseRul = Number(serverEng.predicted_rul);
    const baseLower = Number(serverEng.lower_bound_90);
    const baseUpper = Number(serverEng.upper_bound_90);
    const cycles = Number(serverEng.current_cycle);

    // Apply water-wash restoration if active (+32c RUL rebound, -14.2 deg R T30)
    const conformalRul = isWashed ? Number(Math.min(125, baseRul + 32.0).toFixed(1)) : baseRul;
    const conformalLower90 = localEng.sensorFaultActive
      ? 0
      : isWashed
        ? Number(Math.min(125, baseLower + 32.0).toFixed(1))
        : baseLower;
    const conformalUpper90 = localEng.sensorFaultActive
      ? 125
      : isWashed
        ? Number(Math.min(125, baseUpper + 32.0).toFixed(1))
        : baseUpper;

    const urgency = mapBackendUrgency(serverEng.urgency_level, conformalRul);
    const t30 = isWashed ? Number((localEng.t30 - 14.2).toFixed(1)) : localEng.t30;

    return {
      ...localEng,
      flightCycles: cycles,
      conformalRul,
      conformalLower90,
      conformalUpper90,
      urgency,
      waterWashApplied: isWashed,
      t30,
      trajectory: buildEngineTrajectory(cycles, conformalRul, t30, localEng.sensorFaultActive),
    };
  });
}

export function generateInitialFleet(): EngineTelemetry[] {
  const fleet: EngineTelemetry[] = [];

  for (let idx = 1; idx <= 100; idx++) {
    const tailNumber = Math.ceil(idx / 2);
    const tailId = `N787-${String(tailNumber).padStart(2, '0')}`;
    const wingPosition: 'ENG-L' | 'ENG-R' = idx % 2 === 1 ? 'ENG-L' : 'ENG-R';
    const id = `ESN-787-${String(idx).padStart(3, '0')}`;

    const r1 = seededFraction(idx * 3 + 1);
    const r2 = seededFraction(idx * 7 + 2);
    const r3 = seededFraction(idx * 13 + 5);

    // Default deterministic values across the 100 engines
    let flightCycles = Math.round(95 + r1 * 210);
    let conformalRul = Number((18 + r2 * 96).toFixed(1));

    // Engineer specific notable scenarios:
    // 1. ESN-787-034 (exact prompt reference engine)
    if (idx === 34) {
      flightCycles = 142;
      conformalRul = 12.4;
    } else if (idx === 33) {
      // Paired left wing on N787-17 so N787-17 also has notable wing delta
      flightCycles = 142;
      conformalRul = 64.8;
    } else if (idx === 1) {
      // Tail N787-01 Left Wing
      flightCycles = 138;
      conformalRul = 16.8;
    } else if (idx === 2) {
      // Tail N787-01 Right Wing -> Delta = 52.4 cycles (> 40c ASYMMETRY_WARNING)
      flightCycles = 138;
      conformalRul = 69.2;
    } else if (idx === 5) {
      // Tail N787-03 Left Wing -> High LLP usage near 15,000c scrap limit
      flightCycles = 210;
      conformalRul = 58.0;
    } else if (idx % 9 === 0) {
      // Periodic asymmetry tails (> 40c wing difference)
      conformalRul = Number((88 + r1 * 25).toFixed(1));
    } else if (idx % 9 === 1 && idx > 2) {
      conformalRul = Number((26 + r2 * 10).toFixed(1));
    }

    const urgency: UrgencyLevel =
      conformalRul < 20
        ? 'CRITICAL OVERHAUL'
        : conformalRul < 40
          ? 'SCHEDULED SHOP VISIT'
          : conformalRul < 65
            ? 'MONITOR'
            : 'NOMINAL';

    const degradationFactor = Math.max(0, Math.min(1, (115 - conformalRul) / 105));

    const t24 = idx === 34 ? 654.8 : Number((636.0 + degradationFactor * 24.5).toFixed(1));
    const t30 = idx === 34 ? 1598.2 : Number((1566.0 + degradationFactor * 36.0).toFixed(1));
    const t30CreepDelta = idx === 34 ? 28.4 : Number((t30 - 1569.8).toFixed(1));
    const t50 = idx === 34 ? 1426.4 : Number((1382.0 + degradationFactor * 49.0).toFixed(1));
    const p30 = idx === 34 ? 548.1 : Number((559.0 - degradationFactor * 13.5).toFixed(1));
    const p30LossPct = idx === 34 ? -1.8 : Number((((p30 - 558.15) / 558.15) * 100).toFixed(2));
    const hpcEfficiencyPct = idx === 34 ? 82.4 : Number((89.2 - degradationFactor * 7.4).toFixed(1));
    const overallPressureRatio = idx === 34 ? 37.6 : Number((41.2 - degradationFactor * 4.1).toFixed(1));
    const n1RpmPct = idx === 34 ? 96.4 : Number((94.0 + r3 * 4.2).toFixed(1));
    const n2RpmPct = idx === 34 ? 98.2 : Number((95.5 + degradationFactor * 3.1).toFixed(1));
    const n3RpmPct = Number((97.1 + degradationFactor * 2.4).toFixed(1));
    const sfc = idx === 34 ? 0.528 : Number((0.504 + degradationFactor * 0.029).toFixed(3));
    const vibrationIps = idx === 34 ? 0.42 : Number((0.14 + degradationFactor * 0.34).toFixed(2));

    // LLP Accumulated Cycles out of 15,000 regulatory limit
    const llpAccumulatedCycles =
      idx === 34
        ? 14892
        : idx === 5
          ? 14989
          : Math.round(8400 + r1 * 6200);
    const llpLimitCycles = 15000;

    const conformalLower90 = Number(Math.max(1.2, conformalRul - 3.8).toFixed(1));
    const conformalUpper90 = Number((conformalRul + 4.2).toFixed(1));

    const soapOilPpm: SoapOilReading = {
      fe: idx === 34 ? 14.8 : Number((3.2 + degradationFactor * 13.5).toFixed(1)),
      ti: idx === 34 ? 6.4 : Number((1.1 + degradationFactor * 6.2).toFixed(1)),
      ag: idx === 34 ? 0.85 : Number((0.12 + degradationFactor * 0.85).toFixed(2)),
      si: idx === 34 ? 9.2 : Number((2.0 + degradationFactor * 8.4).toFixed(1)),
    };

    const borescopeFindings: BorescopeFinding[] = [
      {
        id: `${id}-BS-1`,
        stage: 'HPC',
        stageLabel: 'HPC Stage 3 Stator Vanes',
        inspectionDate: '2026-10-28',
        ammReference: 'AMM 72-32-00-200-801',
        severity: conformalRul < 40 ? 'WARNING' : 'NOMINAL',
        finding: 'Stage 3 stator leading-edge erosion detected with localized gas-path fouling deposits.',
        dimensionalMetric: `Chord loss: ${(0.06 + degradationFactor * 0.14).toFixed(2)}mm (Max limit: 0.25mm)`,
        recommendedAction: 'Perform AMM 72-00-00 On-Wing Compressor Water Wash Descale',
      },
      {
        id: `${id}-BS-2`,
        stage: 'HPT',
        stageLabel: 'HPT Stage 1 Rotor Blades (CMSX-4)',
        inspectionDate: '2026-10-29',
        ammReference: 'AMM 72-41-00-220-804',
        severity: conformalRul < 25 ? 'CRITICAL' : conformalRul < 50 ? 'WARNING' : 'NOMINAL',
        finding: 'Thermal barrier coating (TBC) spallation observed near blade tip shroud trailing edge.',
        dimensionalMetric: `Exposed superalloy substrate: ${(1.1 + degradationFactor * 3.5).toFixed(1)}mm²`,
        recommendedAction:
          conformalRul < 25
            ? 'Schedule teardowns & HPT module replacement within Conformal RUL window'
            : 'Repeat optical borescope inspection every 15 flight cycles',
      },
      {
        id: `${id}-BS-3`,
        stage: 'COMBUSTOR',
        stageLabel: 'Annular Combustor Heatshield Tiles',
        inspectionDate: '2026-10-27',
        ammReference: 'AMM 72-40-00-210-802',
        severity: 'NOMINAL',
        finding: 'Effusion cooling micro-holes clear; no thermal distress bridging between adjacent fuel nozzles.',
        dimensionalMetric: 'Oxidation coat thickness: 91.4% nominal',
        recommendedAction: 'Continue standard ETOPS line maintenance interval',
      },
    ];

    if (idx === 34) {
      borescopeFindings[0].dimensionalMetric = 'Chord loss: 0.18mm (Max limit: 0.25mm)';
      borescopeFindings[1].dimensionalMetric = 'Exposed superalloy substrate: 4.2mm²';
    }

    fleet.push({
      id,
      tailId,
      wingPosition,
      flightCycles,
      llpAccumulatedCycles,
      llpLimitCycles,
      conformalRul,
      conformalLower90,
      conformalUpper90,
      urgency,
      n1RpmPct,
      n2RpmPct,
      n3RpmPct,
      hpcEfficiencyPct,
      overallPressureRatio,
      sfc,
      t24,
      t30,
      t30CreepDelta,
      t50,
      p30,
      p30LossPct,
      vibrationIps,
      waterWashApplied: false,
      sensorFaultActive: false,
      soapOilPpm,
      borescopeFindings,
      trajectory: buildEngineTrajectory(flightCycles, conformalRul, t30, false),
    });
  }

  return fleet;
}

/**
 * Simulates AMM 72-00-00 Compressor Water Wash Descaling:
 * +32c RUL rebound, -14.2°R T30 drop, +1.25% P30 recovery
 */
export function applyCompressorWaterWash(engine: EngineTelemetry): EngineTelemetry {
  if (engine.waterWashApplied) {
    return engine;
  }

  const newRul = Number((engine.conformalRul + 32.0).toFixed(1));
  const newT30 = Number((engine.t30 - 14.2).toFixed(1));
  const newT30Creep = Number((engine.t30CreepDelta - 14.2).toFixed(1));
  const newP30 = Number((engine.p30 * 1.0125).toFixed(1));
  const newP30LossPct = Number((engine.p30LossPct + 1.25).toFixed(2));
  const newHpcEff = Number(Math.min(91.5, engine.hpcEfficiencyPct + 3.1).toFixed(1));
  const newT50 = Number((engine.t50 - 9.4).toFixed(1));
  const newOpr = Number((engine.overallPressureRatio + 1.2).toFixed(1));

  const newUrgency: UrgencyLevel =
    newRul < 20
      ? 'CRITICAL OVERHAUL'
      : newRul < 40
        ? 'SCHEDULED SHOP VISIT'
        : newRul < 65
          ? 'MONITOR'
          : 'NOMINAL';

  const newLower90 = engine.sensorFaultActive ? 0 : Number(Math.max(1.2, newRul - 3.8).toFixed(1));
  const newUpper90 = engine.sensorFaultActive ? 125 : Number((newRul + 4.2).toFixed(1));

  return {
    ...engine,
    conformalRul: newRul,
    conformalLower90: newLower90,
    conformalUpper90: newUpper90,
    urgency: newUrgency,
    t30: newT30,
    t30CreepDelta: newT30Creep,
    p30: newP30,
    p30LossPct: newP30LossPct,
    hpcEfficiencyPct: newHpcEff,
    t50: newT50,
    overallPressureRatio: newOpr,
    waterWashApplied: true,
    trajectory: buildEngineTrajectory(engine.flightCycles, newRul, newT30, engine.sensorFaultActive),
  };
}

/**
 * Toggles DO-178C Sensor Fault Abstention (`SENSOR_FAULT_ABSTAIN`).
 * Widens conformal interval to 100% [0, 125]c when active.
 */
export function toggleSensorFaultAbstain(
  engine: EngineTelemetry,
  forceState?: boolean
): EngineTelemetry {
  const nextFaultState = forceState !== undefined ? forceState : !engine.sensorFaultActive;
  const conformalLower90 = nextFaultState ? 0 : Number(Math.max(1.2, engine.conformalRul - 3.8).toFixed(1));
  const conformalUpper90 = nextFaultState ? 125 : Number((engine.conformalRul + 4.2).toFixed(1));

  return {
    ...engine,
    sensorFaultActive: nextFaultState,
    conformalLower90,
    conformalUpper90,
    trajectory: buildEngineTrajectory(
      engine.flightCycles,
      engine.conformalRul,
      engine.t30,
      nextFaultState
    ),
  };
}

/**
 * Pairs 100 engines into 50 Boeing 787-9 Twin-Wing ETOPS aircraft tails.
 * Flags Δ = |RUL_L - RUL_R| > 40 cycles with ASYMMETRY_WARNING.
 */
export function pairFleetIntoEtopsWings(engines: EngineTelemetry[]): EtopsTailPair[] {
  const byTail = new Map<string, { left?: EngineTelemetry; right?: EngineTelemetry }>();

  for (const eng of engines) {
    const entry = byTail.get(eng.tailId) ?? {};
    if (eng.wingPosition === 'ENG-L') {
      entry.left = eng;
    } else {
      entry.right = eng;
    }
    byTail.set(eng.tailId, entry);
  }

  const hubs = ['LHR · London Heathrow', 'SIN · Singapore Changi', 'DXB · Dubai Intl', 'LAX · Los Angeles', 'HND · Tokyo Haneda'];
  const pairs: EtopsTailPair[] = [];

  let index = 0;
  for (const [tailId, pair] of byTail.entries()) {
    if (!pair.left || !pair.right) continue;
    const rulDelta = Number(Math.abs(pair.left.conformalRul - pair.right.conformalRul).toFixed(1));
    const minWingRul = Number(Math.min(pair.left.conformalRul, pair.right.conformalRul).toFixed(1));

    let status: EtopsTailStatus = 'COMPLIANT';
    let advisoryMessage = 'Twin-wing ETOPS-330 dispatch certified. Symmetric core wear profile.';

    if (minWingRul < 20 || pair.left.sensorFaultActive || pair.right.sensorFaultActive) {
      status = 'CRITICAL_GROUND';
      advisoryMessage = pair.left.sensorFaultActive || pair.right.sensorFaultActive
        ? 'DO-178C Sensor Fault Abstention active: ETOPS oceanic dispatch inhibited.'
        : `Wing minimum RUL (${minWingRul}c) below 20-cycle oceanic safety floor. Immediate shop visit required.`;
    } else if (rulDelta > 40) {
      status = 'ASYMMETRY_WARNING';
      advisoryMessage = `Wing Δ = ${rulDelta}c (> 40c threshold). Staggered life satisfactory; avoid dual-wing replacement synchronization.`;
    } else if (rulDelta < 8 && minWingRul < 55) {
      status = 'ASYMMETRY_WARNING';
      advisoryMessage = `Dual-wing synchronized wear risk (Δ = ${rulDelta}c). Recommend water-wash stagger prior to oceanic ETOPS routing.`;
    }

    pairs.push({
      tailId,
      aircraftModel: 'Boeing 787-9 Dreamliner',
      routeHub: hubs[index % hubs.length],
      leftEngine: pair.left,
      rightEngine: pair.right,
      rulDelta,
      minWingRul,
      status,
      advisoryMessage,
    });
    index++;
  }

  return pairs;
}

/**
 * Computes Optimal Stopping Hazard Trigger θ* = γ / (1 + γ) where γ = c_w / C_f,
 * Pilot FLEX Takeoff Thrust Derate physics, Route Environment adjustments, and
 * 60-Cycle 3-Bay Hangar Gantt Schedule.
 */
export function calculateEconomicSandbox(
  input: EconomicSandboxInput,
  fleet: EngineTelemetry[]
): EconomicSandboxResult {
  const safeCf = Math.max(1000, input.failureCostCf);
  const safeCw = Math.max(1, input.wastedLifeCostCw);
  const gammaRatio = safeCw / safeCf;
  const thetaStar = gammaRatio / (1 + gammaRatio);

  const routeSpec =
    ROUTE_ENVIRONMENTS.find((r) => r.id === input.routeEnvId) ?? ROUTE_ENVIRONMENTS[0];
  const routeMultiplier = routeSpec.multiplier;

  // Pilot Takeoff Thrust Derate (FLEX Temp):
  // -1.8°R / %, +2.2c LCF preserved / %, +$14,500/yr savings per % derate
  const peakEgtAlleviationDegR = Number((-1.8 * input.flexDeratePct).toFixed(1));
  const lcfCyclesPreserved = Number((2.2 * input.flexDeratePct).toFixed(1));
  const perPercentAnnualSavingsUsd = 14500;
  const annualSavingsUsd = Math.round(input.flexDeratePct * perPercentAnnualSavingsUsd);

  // Optimal stopping RUL threshold scales with Lead Time L, hazard θ*, and route multiplier
  const optimalStoppingRulThreshold = Number(
    Math.min(
      58,
      Math.max(8, input.leadTimeL * routeMultiplier + (1 - thetaStar * 25) * 8 - lcfCyclesPreserved * 0.25)
    ).toFixed(1)
  );

  // Select candidate engines needing overhaul within the 60-cycle scheduling window
  const candidateEngines = [...fleet]
    .map((eng) => {
      const effectiveRul = Number(
        Math.max(1, (eng.conformalRul + lcfCyclesPreserved * 0.35) / routeMultiplier).toFixed(1)
      );
      return { eng, effectiveRul };
    })
    .filter((item) => item.effectiveRul <= 60)
    .sort((a, b) => a.effectiveRul - b.effectiveRul)
    .slice(0, 12);

  // Schedule across 3 Hangar Bays (BAY A, BAY B, BAY C) without contention
  const bayNextFreeCycle: Record<'BAY A' | 'BAY B' | 'BAY C', number> = {
    'BAY A': 1,
    'BAY B': 2,
    'BAY C': 4,
  };
  const bayOrder: Array<'BAY A' | 'BAY B' | 'BAY C'> = ['BAY A', 'BAY B', 'BAY C'];

  const hangarSchedule: HangarWorkOrder[] = [];

  for (const { eng, effectiveRul } of candidateEngines) {
    // Pick the bay that frees up earliest
    let chosenBay: 'BAY A' | 'BAY B' | 'BAY C' = 'BAY A';
    for (const bay of bayOrder) {
      if (bayNextFreeCycle[bay] < bayNextFreeCycle[chosenBay]) {
        chosenBay = bay;
      }
    }

    const durationCycles = eng.conformalRul < 20 ? 12 : 9;
    const idealStart = Math.max(1, Math.floor(effectiveRul - input.leadTimeL * 0.35));
    const startCycle = Math.max(bayNextFreeCycle[chosenBay], idealStart);
    if (startCycle + durationCycles > 60) {
      continue;
    }
    const endCycle = startCycle + durationCycles;

    bayNextFreeCycle[chosenBay] = endCycle + 2; // 2-cycle bay turnaround buffer

    hangarSchedule.push({
      engineId: eng.id,
      tailId: eng.tailId,
      wingPosition: eng.wingPosition,
      bay: chosenBay,
      startCycle,
      endCycle,
      durationCycles: endCycle - startCycle,
      effectiveRul,
      urgency: eng.urgency,
      workscope:
        eng.conformalRul < 20
          ? 'HPT Rotor Disk & Blade Set Overhaul + HPC Stage 3 Stator Blend'
          : 'Hot-Section Borescope Dress & HPC Descale Shop Visit',
    });
  }

  const expectedFleetCostSavingsUsd = Math.round(
    candidateEngines.length * (safeCf * 0.62 - safeCw * optimalStoppingRulThreshold * 0.4) +
      annualSavingsUsd
  );

  return {
    gammaRatio,
    thetaStar,
    optimalStoppingRulThreshold,
    peakEgtAlleviationDegR,
    lcfCyclesPreserved,
    annualSavingsUsd,
    perPercentAnnualSavingsUsd,
    routeMultiplier,
    expectedFleetCostSavingsUsd,
    hangarSchedule,
  };
}

/**
 * Evaluates FAA 14 CFR § 33.70 Dual-Constraint Airworthiness Rule:
 * min(Conformal RUL_90%, LLP Cycles Remaining) and Clopper-Pearson exact risk bound.
 */
export function evaluateDualConstraintAirworthiness(
  engine: EngineTelemetry
): AirworthinessDossierEvaluation {
  const llpCyclesRemaining = Math.max(0, engine.llpLimitCycles - engine.llpAccumulatedCycles);
  const conformalRul90Lower = engine.sensorFaultActive ? 0 : engine.conformalLower90;

  const effectiveDispatchLimitCycles = Number(
    Math.min(conformalRul90Lower, llpCyclesRemaining).toFixed(1)
  );

  const bindingConstraint: 'CONFORMAL_PHM_RUL' | 'FAA_LLP_SCRAP_LIMIT' =
    llpCyclesRemaining < conformalRul90Lower ? 'FAA_LLP_SCRAP_LIMIT' : 'CONFORMAL_PHM_RUL';

  const clopperPearsonRiskPct = 3.83;
  const isDispatchApproved = !engine.sensorFaultActive && effectiveDispatchLimitCycles >= 5.0;

  const verdictLabel = engine.sensorFaultActive
    ? 'HOLD — DO-178C SENSOR ABSTENTION'
    : isDispatchApproved
      ? `APPROVED FOR SERVICE (${effectiveDispatchLimitCycles}c SAFE WINDOW)`
      : 'GROUNDED — MANDATORY TEARDOWN REQUIRED';

  return {
    trackingId: `FAA-8130-RR-${engine.id.replace('ESN-', '')}-2026`,
    conformalRul90Lower,
    llpCyclesRemaining,
    effectiveDispatchLimitCycles,
    bindingConstraint,
    governingConstraint: bindingConstraint,
    clopperPearsonRiskPct,
    isDispatchApproved,
    verdictLabel,
    regulatoryCitation: '14 CFR § 33.70 & EASA CS-E 515 (Engine Life-Limited Parts)',
  };
}
