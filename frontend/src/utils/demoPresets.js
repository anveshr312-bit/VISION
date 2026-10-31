/**
 * VISION: Hackathon Demonstration Presets & Presentation Scenarios
 * Vital Intelligence for System Integrity, Observation & Nostics
 *
 * 4 Curated Scenarios for Instant Demonstration:
 * ----------------------------------------------
 * 1. SCENARIO 1: Nominal Fleet Baseline (Healthy engine, RUL 95 cycles, normal spools)
 * 2. SCENARIO 2: Imminent HPC Failure (Degraded HPC, T30 surge, RUL 12.4 cycles, red glow, trigger fired)
 * 3. SCENARIO 3: Multi-Regime Challenge (FD002 Unit #18, 6 altitude/Mach regimes)
 * 4. SCENARIO 4: Economic Optimization Win (Side-by-side comparison, $1.4M saved)
 */

export const DEMO_PRESETS = [
  {
    id: 1,
    title: 'Scenario 1: Nominal Fleet Baseline',
    shortLabel: '1: Nominal Baseline',
    key: '1',
    subset: 'FD001',
    unitId: 10,
    tab: 'detail',
    componentFocus: 'fan',
    description: 'Turbofan #10 operating within healthy thermodynamic margins. RUL 95 cycles, nominal spool speeds.',
    badge: 'Healthy Baseline',
    badgeColor: 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50',
  },
  {
    id: 2,
    title: 'Scenario 2: Imminent HPC Failure Alert',
    shortLabel: '2: Imminent Failure',
    key: '2',
    subset: 'FD001',
    unitId: 34,
    tab: 'detail',
    componentFocus: 'hpc',
    description: 'Turbofan #34 experiencing severe HPC blade tip clearance wear. T30 thermal surge, RUL 12.4 cycles, trigger active.',
    badge: 'Critical Trigger',
    badgeColor: 'bg-rose-950/80 text-rose-300 border-rose-500/50',
  },
  {
    id: 3,
    title: 'Scenario 3: Multi-Regime Operational Challenge',
    shortLabel: '3: 6-Regime Dynamic',
    key: '3',
    subset: 'FD002',
    unitId: 18,
    tab: 'fleet',
    componentFocus: null,
    description: 'C-MAPSS FD002 exhibiting 6 distinct altitude and Mach operating conditions normalized via K-Means clustering.',
    badge: 'Multi-Regime',
    badgeColor: 'bg-blue-950/80 text-blue-300 border-blue-500/50',
  },
  {
    id: 4,
    title: 'Scenario 4: Economic Policy Optimization',
    shortLabel: '4: Economic Sandbox',
    key: '4',
    subset: 'FD001',
    unitId: 1,
    tab: 'economics',
    componentFocus: null,
    description: 'What-if cost optimization showing 7.76x reduction in wasted engine life and $1.42M annual fleet savings.',
    badge: 'Economic Win',
    badgeColor: 'bg-amber-950/80 text-amber-300 border-amber-500/50',
  },
];

