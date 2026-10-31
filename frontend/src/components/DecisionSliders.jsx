/**
 * VISION: Interactive Economic Decision Sliders
 * Vital Intelligence for System Integrity, Observation & Nostics
 *
 * Controls:
 * ---------
 * - In-Service Failure Cost (C_f): $10,000 to $500,000
 * - Wasted Useful Life Cost (c_w): $10 to $1,000 per cycle
 * - Maximum Allowable Risk Budget (epsilon): 0.5% to 5.0%
 * - Logistics / Procurement Lead Time: 5 to 30 cycles
 *
 * Automatically derives:
 * - Cost ratio gamma = c_w / C_f
 * - Hazard trigger threshold theta* = gamma / (1 + gamma)
 */

import React, { useState } from 'react';
import { DollarSign, ShieldAlert, Clock, Sliders, Scale, Plane, Wind, Sun, AlertTriangle } from 'lucide-react';

export const ROUTE_ENVIRONMENTS = {
  CONTINENTAL: {
    id: 'CONTINENTAL',
    label: 'Standard Continental',
    multiplier: 1.0,
    tag: '1.00x Nominal',
    color: 'border-slate-700 text-slate-300',
    activeColor: 'border-cyan-500 bg-cyan-950/40 text-cyan-200',
    description: 'Clean tropospheric cruise, standard ISA atmosphere. Baseline degradation rate.',
  },
  MIDDLE_EAST_SAND: {
    id: 'MIDDLE_EAST_SAND',
    label: 'Middle East / Sand & CMAS',
    multiplier: 1.35,
    tag: '1.35x High Wear',
    color: 'border-amber-800/60 text-amber-300',
    activeColor: 'border-amber-500 bg-amber-950/40 text-amber-200',
    description: 'Calcium-Magnesium-Alumina-Silicate (CMAS) ingestion; molten glass deposits on HPT blades.',
  },
  MARITIME_OCEANIC: {
    id: 'MARITIME_OCEANIC',
    label: 'Maritime / Coastal Salt Air',
    multiplier: 1.20,
    tag: '1.20x Corrosion',
    color: 'border-blue-800/60 text-blue-300',
    activeColor: 'border-blue-500 bg-blue-950/40 text-blue-200',
    description: 'High sodium aerosol intake; accelerates Type-I & Type-II hot turbine corrosion/sulfidation.',
  },
  HOT_AND_HIGH: {
    id: 'HOT_AND_HIGH',
    label: 'Hot & High Altitude',
    multiplier: 1.15,
    tag: '1.15x Thermal',
    color: 'border-rose-800/60 text-rose-300',
    activeColor: 'border-rose-500 bg-rose-950/40 text-rose-200',
    description: 'Elevated runway temperatures & thin air force higher takeoff spools and sustained peak EGT.',
  },
};

export default function DecisionSliders({
  failureCost = 100000,
  onFailureCostChange,
  wastedCostPerCycle = 100,
  onWastedCostChange,
  riskBudget = 0.02,
  onRiskBudgetChange,
  leadTime = 15,
  onLeadTimeChange,
  flexDerate: controlledFlexDerate,
  onFlexDerateChange,
  routeEnv: controlledRouteEnv,
  onRouteChange,
  className = '',
}) {
  const [internalFlexDerate, setInternalFlexDerate] = useState(10);
  const [internalRouteEnv, setInternalRouteEnv] = useState('CONTINENTAL');

  const flexDerate = controlledFlexDerate !== undefined ? controlledFlexDerate : internalFlexDerate;
  const setFlexDerate = onFlexDerateChange || setInternalFlexDerate;

  const routeEnv = controlledRouteEnv !== undefined ? controlledRouteEnv : internalRouteEnv;
  const setRouteEnv = onRouteChange || setInternalRouteEnv;

  const activeEnv = ROUTE_ENVIRONMENTS[routeEnv] || ROUTE_ENVIRONMENTS.CONTINENTAL;

  const costRatio = wastedCostPerCycle / failureCost;
  const optimalHazardRatio = (costRatio / (1 + costRatio)) * 100;
  
  // Implied trigger RUL margin: higher failure cost requires earlier maintenance dispatch
  const conservativeBufferCycles = Math.round(
    leadTime + (failureCost >= 100000 ? (Math.log(failureCost / 100000) / Math.log(2.5)) * 3 : -Math.min(3, (100000 - failureCost) / 30000))
  );

  // Operational engineering impacts
  const egtAlleviationRankine = (flexDerate * 1.8).toFixed(1);
  const lcfCyclesPreserved = Math.round(flexDerate * 2.2);
  const annualSavingsPerEngine = flexDerate * 1450;
  const effectiveWearIndex = (activeEnv.multiplier * (1 - (flexDerate / 100) * 0.18)).toFixed(2);

  return (
    <div className={`bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between border-b border-slate-800 pb-2.5 gap-2">
        <div className="flex items-center space-x-2">
          <Sliders className="w-4 h-4 text-cyan-400" />
          <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-white">
            Economic Policy Optimization & Operational Parameters
          </h3>
        </div>
        <div className="flex items-center space-x-3 text-[11px] font-mono">
          <span className="text-slate-400">
            Cost Ratio &gamma;: <strong className="text-cyan-300">1 : {(failureCost / wastedCostPerCycle).toFixed(0)}</strong>
          </span>
          <span className="px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-500/40 text-cyan-300">
            &theta;* = {optimalHazardRatio.toFixed(3)}%
          </span>
        </div>
      </div>

      {/* Real-time Optimal Stopping & Trigger Readout Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 p-2.5 bg-slate-950/80 rounded-xl border border-slate-800/80 font-mono text-xs">
        <div className="flex flex-col">
          <span className="text-[10px] text-slate-500 uppercase">Optimal Hazard Rule</span>
          <span className="font-bold text-cyan-300">
            h(t) &ge; {optimalHazardRatio.toFixed(3)}%
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] text-slate-500 uppercase">Target Trigger Threshold</span>
          <span className="font-bold text-amber-400">
            LB<sub className="text-[9px]">90%</sub> &le; {conservativeBufferCycles} cycles
          </span>
        </div>
        <div className="flex flex-col">
          <span className="text-[10px] text-slate-500 uppercase">Lead-Time Buffer</span>
          <span className="font-bold text-emerald-400">
            +{Math.max(0, conservativeBufferCycles - leadTime)} cycles early margin
          </span>
        </div>
      </div>

      {/* Financial & Logistics Optimization Sliders */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Slider 1: In-Service Failure Cost C_f */}
        <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-300 font-medium flex items-center space-x-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
              <span>In-Service Failure Cost (C_f)</span>
            </span>
            <span className="font-mono font-bold text-rose-400">
              ${failureCost.toLocaleString('en-US')}
            </span>
          </div>
          <input
            type="range"
            min="10000"
            max="500000"
            step="5000"
            value={failureCost}
            onChange={(e) => onFailureCostChange && onFailureCostChange(Number(e.target.value))}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-rose-500"
          />
          <div className="flex justify-between text-[10px] text-slate-500 font-mono">
            <span>$10k (Minor delay)</span>
            <span>$500k (Catastrophic AOG)</span>
          </div>
        </div>

        {/* Slider 2: Wasted Life Cost c_w */}
        <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-300 font-medium flex items-center space-x-1.5">
              <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
              <span>Wasted Life Cost per Cycle (c_w)</span>
            </span>
            <span className="font-mono font-bold text-emerald-400">
              ${wastedCostPerCycle.toLocaleString('en-US')}/cycle
            </span>
          </div>
          <input
            type="range"
            min="10"
            max="1000"
            step="10"
            value={wastedCostPerCycle}
            onChange={(e) => onWastedCostChange && onWastedCostChange(Number(e.target.value))}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
          />
          <div className="flex justify-between text-[10px] text-slate-500 font-mono">
            <span>$10/cyc</span>
            <span>$1,000/cyc</span>
          </div>
        </div>

        {/* Slider 3: Risk Budget (epsilon) */}
        <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-300 font-medium flex items-center space-x-1.5">
              <Scale className="w-3.5 h-3.5 text-amber-400" />
              <span>Target Max In-Service Failure Rate (&epsilon;)</span>
            </span>
            <span className="font-mono font-bold text-amber-400">
              {(riskBudget * 100).toFixed(1)}%
            </span>
          </div>
          <input
            type="range"
            min="0.005"
            max="0.05"
            step="0.001"
            value={riskBudget}
            onChange={(e) => onRiskBudgetChange && onRiskBudgetChange(Number(e.target.value))}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
          />
          <div className="flex justify-between text-[10px] text-slate-500 font-mono">
            <span>0.5% (Ultra-safe)</span>
            <span>5.0% (Risk tolerant)</span>
          </div>
        </div>

        {/* Slider 4: Logistics Lead Time */}
        <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-300 font-medium flex items-center space-x-1.5">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              <span>Logistics & Spare Lead Time (L)</span>
            </span>
            <span className="font-mono font-bold text-cyan-400">
              {leadTime} cycles
            </span>
          </div>
          <input
            type="range"
            min="5"
            max="30"
            step="1"
            value={leadTime}
            onChange={(e) => onLeadTimeChange && onLeadTimeChange(Number(e.target.value))}
            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
          />
          <div className="flex justify-between text-[10px] text-slate-500 font-mono">
            <span>5 cycles (Express parts)</span>
            <span>30 cycles (Supply backlog)</span>
          </div>
        </div>
      </div>

      {/* OPERATIONAL FLIGHT CREW & ROUTE ENVIRONMENT CONTROLS */}
      <div className="border-t border-slate-800/80 pt-3">
        <div className="flex flex-wrap items-center justify-between mb-3 gap-2">
          <div className="flex items-center space-x-2">
            <Plane className="w-4 h-4 text-emerald-400" />
            <h4 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">
              Flight Operations & Environmental Route Modifiers
            </h4>
          </div>
          <div className="flex items-center space-x-2 text-[11px] font-mono">
            <span className="text-slate-400">Effective Fleet Stress Multiplier:</span>
            <span className={`px-2 py-0.5 rounded font-bold border ${
              Number(effectiveWearIndex) > 1.15
                ? 'bg-rose-950/60 border-rose-500/40 text-rose-300'
                : Number(effectiveWearIndex) < 0.95
                ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300'
                : 'bg-cyan-950/60 border-cyan-500/40 text-cyan-300'
            }`}>
              {effectiveWearIndex}&times;
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Pilot Takeoff Thrust Derate (FLEX / Assumed Temperature) */}
          <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80 space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-200 font-medium flex items-center space-x-1.5">
                <Wind className="w-3.5 h-3.5 text-emerald-400" />
                <span>Pilot Takeoff Thrust Derate (FLEX Temp)</span>
              </span>
              <span className="font-mono font-bold text-emerald-400">
                {flexDerate}% Derate
              </span>
            </div>
            
            <input
              type="range"
              min="0"
              max="15"
              step="1"
              value={flexDerate}
              onChange={(e) => setFlexDerate(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
            
            <div className="flex justify-between text-[10px] text-slate-500 font-mono">
              <span>0% (Full TOGA Thrust)</span>
              <span>10% (Airline SOP)</span>
              <span>15% (Max Regulatory Limit)</span>
            </div>

            {/* Real-time Engineering Impact Cards */}
            <div className="grid grid-cols-3 gap-2 pt-1 font-mono text-[11px]">
              <div className="p-2 rounded-lg bg-slate-900 border border-slate-800/80 flex flex-col">
                <span className="text-[9px] text-slate-400 uppercase">Peak EGT Alleviation</span>
                <span className="font-bold text-cyan-300 mt-0.5">-{egtAlleviationRankine}&deg;R</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-900 border border-slate-800/80 flex flex-col">
                <span className="text-[9px] text-slate-400 uppercase">Life Preserved</span>
                <span className="font-bold text-emerald-300 mt-0.5">+{lcfCyclesPreserved} cyc</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-900 border border-slate-800/80 flex flex-col">
                <span className="text-[9px] text-slate-400 uppercase">Annual Savings</span>
                <span className="font-bold text-amber-300 mt-0.5">+${annualSavingsPerEngine.toLocaleString()}/yr</span>
              </div>
            </div>
          </div>

          {/* Operational Route Geographic Environment */}
          <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80 flex flex-col justify-between space-y-2">
            <div>
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="text-slate-200 font-medium flex items-center space-x-1.5">
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                  <span>Route Environmental Harshness Context</span>
                </span>
                <span className="font-mono text-[11px] text-slate-400">
                  {activeEnv.tag}
                </span>
              </div>

              {/* Environment Selection Buttons */}
              <div className="grid grid-cols-2 gap-1.5">
                {Object.values(ROUTE_ENVIRONMENTS).map((env) => {
                  const isSelected = env.id === activeEnv.id;
                  return (
                    <button
                      key={env.id}
                      type="button"
                      onClick={() => setRouteEnv(env.id)}
                      className={`px-2 py-1.5 rounded-lg border text-left text-[11px] transition-all flex flex-col ${
                        isSelected ? env.activeColor : `${env.color} bg-slate-900 hover:bg-slate-800`
                      }`}
                    >
                      <span className="font-bold truncate">{env.label}</span>
                      <span className="text-[9px] opacity-75">{env.tag}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Active Environment Impact Note */}
            <div className="p-2 rounded-lg bg-slate-900/90 border border-slate-800 text-[10px] text-slate-400 font-mono leading-tight">
              <span className="text-slate-200 font-semibold">{activeEnv.label}: </span>
              {activeEnv.description}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


