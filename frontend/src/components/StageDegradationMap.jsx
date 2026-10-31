import React, { useState } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  Crosshair,
  Droplets,
  Eye,
  FileCheck2,
  Gauge,
  Layers,
  ShieldAlert,
  Sparkles,
  Wrench,
} from 'lucide-react';

/**
 * Full standalone & integrated dataset for all 9 Axial Gas-Path Flow Stations
 * and 8 Historical Cycle-by-Cycle Degradation Heatmap Rows (Cycles 0 -> 142, including Cycle 85 Inflection).
 */
export const AXIAL_GAS_PATH_STAGES = [
  {
    id: 'FAN_ROTOR',
    shortName: 'Fan Rotor',
    matrixLabel: 'Fan',
    station: 'Stn 2.0',
    healthPct: 96,
    fleetAvgPct: 94,
    percentileSeverity: 18,
    statusBadge: 'NOMINAL',
    tipClearanceCurrentMm: 0.62,
    tipClearanceNominalMm: 0.58,
    tipClearanceLimitMm: 1.25,
    deltaFlowPct: -0.18,
    deltaEfficiencyPct: -0.24,
    chordLossMm: 0.02,
    chordLossMaxMm: 0.35,
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
    healthPct: 86,
    fleetAvgPct: 89,
    percentileSeverity: 54,
    statusBadge: 'NOMINAL',
    tipClearanceCurrentMm: 0.84,
    tipClearanceNominalMm: 0.72,
    tipClearanceLimitMm: 1.35,
    deltaFlowPct: -0.52,
    deltaEfficiencyPct: -0.68,
    chordLossMm: 0.06,
    chordLossMaxMm: 0.30,
    borescopeDefect:
      'Stage 2 booster stator root shows light coastal salt aerosol film; variable inlet guide vane (VIGV) bushings within 0.04mm tolerance.',
    severityText: 'MODERATE-LOW - Include in next scheduled on-wing detergent wash.',
    ammReference: 'AMM 72-31-00',
    primaryDirectiveType: 'WATER_WASH',
    cycleHistory: [
      { cycle: 0, health: 100, note: 'Baseline IPC booster pressure ratioverified' },
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
    healthPct: 78,
    fleetAvgPct: 85,
    percentileSeverity: 74,
    statusBadge: 'FOULING',
    tipClearanceCurrentMm: 0.98,
    tipClearanceNominalMm: 0.76,
    tipClearanceLimitMm: 1.40,
    deltaFlowPct: -0.94,
    deltaEfficiencyPct: -1.35,
    chordLossMm: 0.11,
    chordLossMaxMm: 0.25,
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
    healthPct: 64,
    fleetAvgPct: 82,
    percentileSeverity: 92,
    statusBadge: 'BLADE_RUB',
    tipClearanceCurrentMm: 1.18,
    tipClearanceNominalMm: 0.80,
    tipClearanceLimitMm: 1.40,
    deltaFlowPct: -1.42,
    deltaEfficiencyPct: -2.10,
    chordLossMm: 0.18,
    chordLossMaxMm: 0.25,
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
    healthPct: 74,
    fleetAvgPct: 84,
    percentileSeverity: 81,
    statusBadge: 'CREEP',
    tipClearanceCurrentMm: 1.06,
    tipClearanceNominalMm: 0.78,
    tipClearanceLimitMm: 1.40,
    deltaFlowPct: -1.12,
    deltaEfficiencyPct: -1.64,
    chordLossMm: 0.14,
    chordLossMaxMm: 0.25,
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
    healthPct: 79,
    fleetAvgPct: 83,
    percentileSeverity: 68,
    statusBadge: 'FOULING',
    tipClearanceCurrentMm: 0.92,
    tipClearanceNominalMm: 0.75,
    tipClearanceLimitMm: 1.35,
    deltaFlowPct: -0.76,
    deltaEfficiencyPct: -0.95,
    chordLossMm: 0.09,
    chordLossMaxMm: 0.25,
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
    healthPct: 67,
    fleetAvgPct: 80,
    percentileSeverity: 89,
    statusBadge: 'CRITICAL',
    tipClearanceCurrentMm: 1.24,
    tipClearanceNominalMm: 0.82,
    tipClearanceLimitMm: 1.40,
    deltaFlowPct: -1.36,
    deltaEfficiencyPct: -1.92,
    chordLossMm: 0.16,
    chordLossMaxMm: 0.25,
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
    healthPct: 89,
    fleetAvgPct: 90,
    percentileSeverity: 42,
    statusBadge: 'NOMINAL',
    tipClearanceCurrentMm: 0.78,
    tipClearanceNominalMm: 0.70,
    tipClearanceLimitMm: 1.35,
    deltaFlowPct: -0.34,
    deltaEfficiencyPct: -0.45,
    chordLossMm: 0.04,
    chordLossMaxMm: 0.30,
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
    healthPct: 94,
    fleetAvgPct: 93,
    percentileSeverity: 24,
    statusBadge: 'NOMINAL',
    tipClearanceCurrentMm: 0.55,
    tipClearanceNominalMm: 0.50,
    tipClearanceLimitMm: 1.30,
    deltaFlowPct: -0.12,
    deltaEfficiencyPct: -0.18,
    chordLossMm: 0.01,
    chordLossMaxMm: 0.30,
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
    <div className="bg-[#182321] border border-[#46564D] rounded-2xl p-3 flex flex-col items-center justify-between">
      <div className="w-full flex items-center justify-between">
        <span className="text-[10px] font-mono uppercase tracking-wider text-[#A6B4AA]">
          {label}
        </span>
        <span className="text-[9px] font-mono uppercase tracking-wider text-[#A6B4AA]/80">
          {subLabel}
        </span>
      </div>

      <div className="relative flex flex-col items-center my-0.5">
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
          <path
            d={`M ${cx - rOuter - 5} ${cy} A ${rOuter + 5} ${rOuter + 5} 0 0 1 ${cx + rOuter + 5} ${cy}`}
            fill="none"
            stroke="rgba(166,180,170,0.22)"
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
              stroke={t.active ? colorHex : 'rgba(70,86,77,0.45)'}
              strokeWidth="2.3"
              strokeLinecap="round"
            />
          ))}
        </svg>

        <div className="absolute bottom-1 text-center">
          <div className="text-sm font-mono font-bold text-[#E7ECE7] tabular-nums">{valueText}</div>
        </div>
      </div>

      <div className="w-full flex justify-between text-[9px] font-mono text-[#A6B4AA]">
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
}) {
  const [selectedStageId, setSelectedStageId] = useState('HPC_MID_3_4');
  const [hoveredCell, setHoveredCell] = useState({
    stageName: 'HPC Stg 3-4',
    station: 'Stn 3.0',
    cycle: 125,
    health: 68,
    note: 'Rapid Tip Clearance Gap Growth (+0.32mm)',
  });
  const [directiveFeedback, setDirectiveFeedback] = useState(null);
  const [localWaterWashDone, setLocalWaterWashDone] = useState(false);

  const isWaterWashed = Boolean(engine?.waterWashApplied || localWaterWashDone);
  const activeEngineId = engine?.id || 'ESN-787-034';
  const activeTailId = engine?.tailId || 'N787-17';

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

    return {
      ...stg,
      healthPct: adjustedHealth,
      deltaFlowPct: adjustedFlow,
      deltaEfficiencyPct: adjustedEff,
    };
  });

  const activeStage =
    stagesWithLiveState.find((s) => s.id === selectedStageId) || stagesWithLiveState[3];

  // Top 8 stages displayed in the 2D Historical Heatmap Matrix
  const matrixRows = stagesWithLiveState.slice(0, 8);

  const getHealthColorClasses = (health) => {
    if (health > 85) {
      return {
        badgeBg: 'bg-[#82A995]/20 border-[#82A995]/60 text-[#82A995]',
        barBg: 'bg-[#82A995]',
        text: 'text-[#82A995]',
        borderActive: 'border-[#82A995]',
        hex: '#82A995',
      };
    }
    if (health >= 70) {
      return {
        badgeBg: 'bg-[#D8B65E]/20 border-[#D8B65E]/60 text-[#D8B65E]',
        barBg: 'bg-[#D8B65E]',
        text: 'text-[#D8B65E]',
        borderActive: 'border-[#D8B65E]',
        hex: '#D8B65E',
      };
    }
    return {
      badgeBg: 'bg-[#D97865]/25 border-[#D97865]/70 text-[#D97865]',
      barBg: 'bg-[#D97865]',
      text: 'text-[#D97865]',
      borderActive: 'border-[#D97865]',
      hex: '#D97865',
    };
  };

  const getCellStyle = (health) => {
    if (health >= 90) {
      return 'bg-[#82A995]/25 border-[#82A995]/55 text-[#E7ECE7] hover:bg-[#82A995]/40';
    }
    if (health >= 86) {
      return 'bg-[#B3C58B]/25 border-[#B3C58B]/55 text-[#E7ECE7] hover:bg-[#B3C58B]/40';
    }
    if (health >= 76) {
      return 'bg-[#D8B65E]/25 border-[#D8B65E]/55 text-[#D8B65E] hover:bg-[#D8B65E]/40';
    }
    if (health >= 70) {
      return 'bg-[#D8B65E]/35 border-[#D8B65E]/70 text-[#E7ECE7] hover:bg-[#D8B65E]/50';
    }
    return 'bg-[#D97865]/35 border-[#D97865]/75 text-[#E7ECE7] font-bold shadow-[0_0_12px_rgba(217,120,101,0.3)] hover:bg-[#D97865]/50';
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

  return (
    <div
      data-testid="stage-degradation-map-screen"
      className="max-w-[1440px] mx-auto px-6 py-5 space-y-5 text-[#E7ECE7]"
    >
      {/* =====================================================================
          1. AXIAL GAS-PATH FLOW SCHEMATIC (TOP COMPONENT STRIP)
         ===================================================================== */}
      <section
        aria-label="Axial Gas-Path Flow Schematic"
        className="backdrop-blur-2xl bg-[#1C2926]/90 border border-[#46564D] rounded-3xl p-5 shadow-[0_12px_36px_rgba(0,0,0,0.65)] space-y-3.5"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#293834] border border-[#46564D] flex items-center justify-center text-[#B3C58B]">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-[#E7ECE7]">
                Axial Gas-Path Flow Schematic · Rolls-Royce Trent 1000 ({activeEngineId} / {activeTailId})
              </h2>
              <p className="text-[10px] font-mono uppercase tracking-wider text-[#A6B4AA]">
                Station 2.0 Intake to Station 8.0 Core Exhaust · Click any stage block to inspect physical wear &amp; borescope telemetry
              </p>
            </div>
          </div>

          {/* Color-Coding Legend */}
          <div className="flex items-center gap-4 text-[10px] font-mono uppercase tracking-wider text-[#A6B4AA]">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#82A995] inline-block" />
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
                      ? `bg-[#293834] ${tone.borderActive} ring-1 ring-[#B3C58B] shadow-md`
                      : 'bg-[#182321] border-[#46564D] hover:border-[#B3C58B]/60'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-[9px] font-mono uppercase tracking-wider text-[#B3C58B] font-semibold">
                      {stg.station}
                    </span>
                    <span
                      className={`px-1.5 py-0.2 rounded text-[8px] font-mono font-bold uppercase tracking-wider border ${tone.badgeBg}`}
                    >
                      {stg.statusBadge}
                    </span>
                  </div>

                  <div className="my-1.5">
                    <div className="text-[11px] font-mono font-bold text-[#E7ECE7] leading-tight line-clamp-1">
                      {stg.shortName}
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-baseline justify-between font-mono">
                      <span className="text-[9px] uppercase tracking-wider text-[#A6B4AA]">
                        Health
                      </span>
                      <span className={`text-sm font-bold tabular-nums ${tone.text}`}>
                        {stg.healthPct}%
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-[#111A19] rounded-full overflow-hidden">
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
                    className="hidden lg:flex items-center justify-center -right-2 top-1/2 -translate-y-1/2 absolute z-10 pointer-events-none text-[#A6B4AA]"
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
          2. HISTORICAL CYCLE-BY-CYCLE DEGRADATION HEATMAP MATRIX (CENTERPIECE)
         ===================================================================== */}
      <section
        aria-label="Historical Cycle-by-Cycle Degradation Heatmap Matrix"
        className="backdrop-blur-2xl bg-[#1C2926]/90 border border-[#46564D] rounded-3xl p-5 shadow-[0_12px_36px_rgba(0,0,0,0.65)] space-y-3.5"
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#B3C58B]" />
              <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-[#E7ECE7]">
                Historical Cycle-by-Cycle Degradation Heatmap Matrix (Cycles 0 → 142)
              </h2>
            </div>
            <p className="text-[10px] font-mono uppercase tracking-wider text-[#A6B4AA] mt-0.5">
              Hover or click any matrix cell to inspect cycle-specific physical wear trajectory · Inflection point highlighted at Cycle 85
            </p>
          </div>

          {/* Instant HUD Tooltip Callout Readout Pill */}
          <div
            data-testid="heatmap-hud-tooltip"
            className="bg-[#182321] border border-[#46564D] rounded-2xl px-3.5 py-2 text-[11px] font-mono text-[#B3C58B] shadow-lg flex items-center gap-2"
          >
            <Crosshair className="w-3.5 h-3.5 text-[#82A995] shrink-0" />
            <span>
              [{hoveredCell.stageName} @ Cycle {hoveredCell.cycle}: Health {hoveredCell.health}% —{' '}
              <strong className="text-[#E7ECE7]">{hoveredCell.note}</strong>]
            </span>
          </div>
        </div>

        {/* 2D Telemetry Matrix Table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-[#46564D] text-[10px] font-mono uppercase tracking-wider text-[#A6B4AA]">
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
                            ? 'text-[#B3C58B] font-bold'
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
                        <div className="text-[8px] font-mono text-[#B3C58B] tracking-widest">
                          CURRENT
                        </div>
                      )}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#46564D]/50 text-xs font-mono">
              {matrixRows.map((row) => {
                const isRowSelected = row.id === activeStage.id;
                return (
                  <tr
                    key={row.id}
                    onClick={() => setSelectedStageId(row.id)}
                    className={`transition-colors cursor-pointer ${
                      isRowSelected ? 'bg-[#293834]' : 'hover:bg-[#293834]/50'
                    }`}
                  >
                    <td className="py-2 px-3 font-bold text-[#E7ECE7] flex items-center gap-2">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          row.healthPct > 85
                            ? 'bg-[#82A995]'
                            : row.healthPct >= 70
                              ? 'bg-[#D8B65E]'
                              : 'bg-[#D97865]'
                        }`}
                      />
                      <span>{row.matrixLabel}</span>
                    </td>
                    <td className="py-2 px-2 text-center text-[10px] text-[#A6B4AA]">
                      {row.station}
                    </td>

                    {row.cycleHistory.map((cell) => {
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
                                className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 rounded-full bg-[#D8B65E] text-[#111A19] text-[9px] font-bold flex items-center justify-center shadow"
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
        </div>
      </section>

      {/* =====================================================================
          3. DEEP-DIVE STAGE DIAGNOSTIC & PHYSICAL WEAR PANEL (3-CARD + FLEET MINI-CARD)
         ===================================================================== */}
      {directiveFeedback && (
        <div
          role="status"
          data-testid="directive-action-feedback"
          className="backdrop-blur-2xl bg-[#1C2926]/95 border border-[#82A995] rounded-2xl px-4 py-2.5 text-xs font-mono text-[#E7ECE7] flex items-center justify-between shadow-xl"
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#82A995] shrink-0" />
            <span>{directiveFeedback}</span>
          </div>
          <button
            type="button"
            onClick={() => setDirectiveFeedback(null)}
            className="text-[10px] uppercase tracking-wider text-[#B3C58B] hover:text-[#E7ECE7] cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
        {/* CARD A: Physical Wear Gauges (Left 5 Cols) */}
        <div
          data-testid="stage-physical-wear-card"
          className="lg:col-span-5 backdrop-blur-2xl bg-[#1C2926]/90 border border-[#46564D] rounded-3xl p-5 shadow-[0_12px_36px_rgba(0,0,0,0.65)] flex flex-col justify-between space-y-4"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Gauge className="w-4 h-4 text-[#B3C58B]" />
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[#E7ECE7]">
                  Physical Wear Gauges · {activeStage.shortName}
                </h3>
              </div>
              <p className="text-[10px] font-mono uppercase tracking-wider text-[#A6B4AA] mt-0.5">
                {activeStage.station} Gas-Path Aerodynamic &amp; Clearance Telemetry
              </p>
            </div>
            <span
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider border ${activeTone.badgeBg}`}
            >
              {activeStage.healthPct}% HEALTH
            </span>
          </div>

          {/* 1. Blade Tip Clearance Gap Horizontal Tolerance Bar */}
          <div className="bg-[#182321] border border-[#46564D] rounded-2xl p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#A6B4AA]">
                Blade Tip Clearance Gap
              </span>
              <span className="text-xs font-mono font-bold text-[#E7ECE7] tabular-nums">
                Current: <strong className={activeTone.text}>{activeStage.tipClearanceCurrentMm.toFixed(2)} mm</strong>
              </span>
            </div>

            <div className="relative h-3 bg-[#111A19] rounded-full overflow-visible">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${tipPct}%`,
                  background:
                    activeStage.tipClearanceCurrentMm >= 1.1
                      ? 'linear-gradient(90deg, #82A995 0%, #D8B65E 50%, #D97865 100%)'
                      : 'linear-gradient(90deg, #82A995 0%, #B3C58B 100%)',
                }}
              />
              {/* Nominal Marker Diamond */}
              <div
                title={`Nominal: ${activeStage.tipClearanceNominalMm.toFixed(2)} mm`}
                style={{ left: `${nominalPct}%` }}
                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-2.5 h-2.5 rotate-45 bg-[#82A995] border border-[#111A19]"
              />
              {/* AMM Limit Marker Diamond */}
              <div
                title={`AMM Limit: ${activeStage.tipClearanceLimitMm.toFixed(2)} mm`}
                style={{ left: '96%' }}
                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-2.5 h-2.5 rotate-45 bg-[#D97865] border border-[#E7ECE7]"
              />
            </div>

            <div className="flex items-center justify-between text-[10px] font-mono text-[#A6B4AA] pt-0.5">
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
              colorHex={Math.abs(activeStage.deltaFlowPct) > 1.0 ? '#D8B65E' : '#B3C58B'}
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
          <div className="bg-[#182321] border border-[#46564D] rounded-2xl p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#A6B4AA]">
                Aerodynamic Chord Loss (Dust Erosion)
              </span>
              <span className="text-xs font-mono font-bold text-[#B3C58B] tabular-nums">
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
                            : 'bg-[#82A995]'
                        : 'bg-[#111A19]'
                    }`}
                  />
                );
              })}
            </div>

            <div className="flex items-center justify-between text-[10px] font-mono text-[#A6B4AA]">
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
            className="backdrop-blur-2xl bg-[#1C2926]/90 border border-[#46564D] rounded-3xl p-5 shadow-[0_12px_36px_rgba(0,0,0,0.65)] space-y-3.5 flex-1 flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Eye className="w-4 h-4 text-[#B3C58B]" />
                  <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[#E7ECE7]">
                    Borescope &amp; Structural Record
                  </h3>
                </div>
                <p className="text-[10px] font-mono uppercase tracking-wider text-[#A6B4AA] mt-0.5">
                  Ref: {activeStage.ammReference} · Optical Probe Inspection
                </p>
              </div>
              <ArrowUpRight className="w-4 h-4 text-[#B3C58B]" />
            </div>

            {/* Schematic Borescope Visual Callout with Angled SVG Leader Line */}
            <div className="relative bg-[#182321] border border-[#46564D] rounded-2xl p-3.5 overflow-hidden">
              <div className="flex items-center justify-between gap-3">
                {/* Left Cross-Sectional Stator/Blade Target Diagram */}
                <div className="relative w-20 h-20 shrink-0 flex items-center justify-center">
                  <svg viewBox="0 0 80 80" className="w-full h-full">
                    <circle
                      cx="40"
                      cy="40"
                      r="34"
                      fill="none"
                      stroke="rgba(166,180,170,0.35)"
                      strokeWidth="1.5"
                      strokeDasharray="3 3"
                    />
                    <circle
                      cx="40"
                      cy="40"
                      r="22"
                      fill="rgba(41,56,52,0.6)"
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
                    <circle cx="46" cy="32" r="3.5" fill="#B3C58B" />
                    <polyline
                      points="46,32 60,18 78,18"
                      fill="none"
                      stroke="#B3C58B"
                      strokeWidth="1.5"
                    />
                  </svg>
                </div>

                {/* Right Callout Tag */}
                <div className="flex-1 border-l-2 border-[#B3C58B] pl-3 space-y-1">
                  <div className="text-[9px] font-mono font-bold uppercase tracking-wider text-[#B3C58B]">
                    OPTICAL FINDING // {activeStage.station}
                  </div>
                  <p className="text-xs text-[#E7ECE7] leading-relaxed">
                    {activeStage.borescopeDefect}
                  </p>
                </div>
              </div>

              <div className="mt-3 pt-2.5 border-t border-[#46564D] flex items-center gap-2 text-[11px] font-mono text-[#D8B65E]">
                <AlertTriangle className="w-3.5 h-3.5 text-[#D97865] shrink-0" />
                <span>{activeStage.severityText}</span>
              </div>
            </div>
          </div>

          {/* 4. CROSS-FLEET STAGE COMPARISON MINI-CARD */}
          <div
            data-testid="cross-fleet-stage-comparison-card"
            className="backdrop-blur-2xl bg-[#1C2926]/90 border border-[#46564D] rounded-3xl p-4 shadow-[0_12px_36px_rgba(0,0,0,0.65)] space-y-2.5"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#E7ECE7]">
                Cross-Fleet Stage Comparison (100 Engines)
              </span>
              <span className="px-2 py-0.5 rounded-full bg-[#293834] border border-[#46564D] text-[9px] font-mono font-bold text-[#B3C58B] uppercase tracking-wider">
                {activeStage.percentileSeverity}th Pct Severity
              </span>
            </div>

            <div className="space-y-2 text-xs font-mono">
              {/* Bar 1: This Engine */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10px]">
                  <span className="uppercase tracking-wider text-[#A6B4AA]">
                    This Engine ({activeEngineId})
                  </span>
                  <span className={`font-bold ${activeTone.text}`}>
                    {activeStage.healthPct}% Health
                  </span>
                </div>
                <div className="w-full h-2 bg-[#111A19] rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${activeTone.barBg}`}
                    style={{ width: `${activeStage.healthPct}%` }}
                  />
                </div>
              </div>

              {/* Bar 2: Fleet Average */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10px]">
                  <span className="uppercase tracking-wider text-[#A6B4AA]">
                    Boeing 787 Fleet Average
                  </span>
                  <span className="font-bold text-[#B3C58B]">{activeStage.fleetAvgPct}% Health</span>
                </div>
                <div className="w-full h-2 bg-[#111A19] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-[#B3C58B]"
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
          className="lg:col-span-3 backdrop-blur-2xl bg-[#1C2926]/90 border border-[#46564D] rounded-3xl p-5 shadow-[0_12px_36px_rgba(0,0,0,0.65)] flex flex-col justify-between space-y-4"
        >
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wrench className="w-4 h-4 text-[#B3C58B]" />
                <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[#E7ECE7]">
                  Prescriptive Action Directive
                </h3>
              </div>
              <Sparkles className="w-4 h-4 text-[#82A995]" />
            </div>
            <p className="text-[10px] font-mono uppercase tracking-wider text-[#A6B4AA]">
              DO-178C Advisory · Stage-Specific Workscope
            </p>

            <div className="bg-[#182321] border border-[#46564D] rounded-2xl p-3.5 space-y-2 mt-2">
              <div className="text-[10px] font-mono uppercase tracking-wider text-[#B3C58B]">
                Primary Failure Mode
              </div>
              <div className="text-xs font-mono font-bold text-[#E7ECE7]">
                {activeStage.statusBadge === 'BLADE_RUB'
                  ? 'Abradable Tip Rub & Stator Erosion'
                  : activeStage.statusBadge === 'FOULING'
                    ? 'Gas-Path Particulate Fouling'
                    : activeStage.statusBadge === 'CRITICAL' || activeStage.statusBadge === 'CREEP'
                      ? 'High-Temp TBC Spallation & Creep'
                      : 'Nominal Boundary Layer Wear'}
              </div>
              <p className="text-[11px] text-[#A6B4AA] leading-relaxed">
                Select an authorized maintenance directive below to mitigate{' '}
                <strong className="text-[#E7ECE7]">{activeStage.shortName}</strong> degradation and
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
                  ? 'bg-[#B3C58B] text-[#111A19] border-[#B3C58B] font-bold shadow-md'
                  : 'bg-[#293834] hover:bg-[#293834]/80 text-[#E7ECE7] border-[#46564D]'
              }`}
            >
              <Droplets className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="text-[10px] font-mono uppercase tracking-wider leading-snug">
                <div>Prescribe AMM 72-00 Detergent Water Wash (+32c recovery)</div>
                <div
                  className={`text-[9px] mt-0.5 ${
                    activeStage.primaryDirectiveType === 'WATER_WASH'
                      ? 'text-[#111A19]/80'
                      : 'text-[#82A995]'
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
                  ? 'bg-[#B3C58B] text-[#111A19] border-[#B3C58B] font-bold shadow-md'
                  : 'bg-[#293834] hover:bg-[#293834]/80 text-[#E7ECE7] border-[#46564D]'
              }`}
            >
              <Wrench className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="text-[10px] font-mono uppercase tracking-wider leading-snug">
                <div>Schedule AMM 72-31 Borescope Blending Shop Visit</div>
                <div
                  className={`text-[9px] mt-0.5 ${
                    activeStage.primaryDirectiveType === 'BLADE_RUB'
                      ? 'text-[#111A19]/80'
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
                  ? 'bg-[#D97865] text-[#111A19] border-[#D97865] font-bold shadow-md'
                  : 'bg-[#293834] hover:bg-[#293834]/80 text-[#E7ECE7] border-[#46564D]'
              }`}
            >
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="text-[10px] font-mono uppercase tracking-wider leading-snug">
                <div>Check LLP Rotor Disk Scrap Limit (15,000c Hard Clock)</div>
                <div
                  className={`text-[9px] mt-0.5 ${
                    activeStage.primaryDirectiveType === 'HPT_CREEP'
                      ? 'text-[#111A19]/80'
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
    </div>
  );
}

export default StageDegradationMap;

