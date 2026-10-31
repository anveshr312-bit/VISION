import React, { useMemo, useState } from 'react';
import {
  Sliders,
  Globe,
  CalendarClock,
  Flame,
  ArrowUpRight,
} from 'lucide-react';
import {
  EngineTelemetry,
  ROUTE_ENVIRONMENTS,
  RouteEnvironmentId,
  calculateEconomicSandbox,
} from '../services/prognosticsEngine';

interface EconomicSandboxScreenProps {
  fleet: EngineTelemetry[];
  onSelectEngineForTwin: (engineId: string) => void;
}

export const EconomicSandboxScreen: React.FC<EconomicSandboxScreenProps> = ({
  fleet,
  onSelectEngineForTwin,
}) => {
  const [failureCostCf, setFailureCostCf] = useState<number>(220000);
  const [wastedLifeCostCw, setWastedLifeCostCw] = useState<number>(280);
  const [leadTimeL, setLeadTimeL] = useState<number>(14);
  const [flexDeratePct, setFlexDeratePct] = useState<number>(8);
  const [routeEnvId, setRouteEnvId] = useState<RouteEnvironmentId>('CONTINENTAL');

  const sandboxResult = useMemo(
    () =>
      calculateEconomicSandbox(
        {
          failureCostCf,
          wastedLifeCostCw,
          leadTimeL,
          flexDeratePct,
          routeEnvId,
        },
        fleet
      ),
    [failureCostCf, wastedLifeCostCw, leadTimeL, flexDeratePct, routeEnvId, fleet]
  );

  const activeRouteSpec =
    ROUTE_ENVIRONMENTS.find((r) => r.id === routeEnvId) ?? ROUTE_ENVIRONMENTS[0];

  const bays: Array<'BAY A' | 'BAY B' | 'BAY C'> = ['BAY A', 'BAY B', 'BAY C'];

  return (
    <div className="max-w-[1440px] mx-auto px-6 lg:px-8 py-5 space-y-5 text-[#EAECE9]">
      {/* Editorial Section Header matching Overview aesthetic */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#232725]/90 border border-white/15 text-xs text-[#EAECE9]">
            <span className="w-2 h-2 rounded-full bg-[#B8CE82]" />
            <span>Trent 1000 · MRO Optimization</span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-normal tracking-tight text-[#EAECE9]">
            Predictive Maintenance &amp; Hangar Sandbox
          </h1>
        </div>
        <p className="text-xs text-[#949C96] font-mono">
          Optimal Stopping Policy θ* = γ/(1+γ) · Pilot FLEX Thrust Derate · 3-Bay Hangar Gantt
        </p>
      </div>

      {/* Top 4 Glassmorphic KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="backdrop-blur-2xl bg-[#232725]/88 border border-white/[0.08] rounded-[24px] p-5 shadow-[0_16px_40px_rgba(0,0,0,0.45)] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-normal text-[#EAECE9]">
              Optimal Stopping Trigger θ*
            </span>
            <ArrowUpRight className="w-4 h-4 text-[#B8CE82]" />
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-mono font-bold text-[#EAECE9] tabular-nums">
              θ* = {(sandboxResult.thetaStar * 100).toFixed(3)}%
            </span>
            <span className="text-xs font-mono text-[#B8CE82] tabular-nums">
              γ = {sandboxResult.gammaRatio.toFixed(5)}
            </span>
          </div>
          <div className="text-[11px] font-mono text-[#949C96] mt-1.5">
            θ* = γ / (1 + γ) where γ = c_w / C_f
          </div>
        </div>

        <div className="backdrop-blur-2xl bg-[#232725]/88 border border-white/[0.08] rounded-[24px] p-5 shadow-[0_16px_40px_rgba(0,0,0,0.45)] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-normal text-[#EAECE9]">
              FLEX EGT Alleviation
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-[#B8CE82]/20 border border-[#B8CE82]/50 text-[#B8CE82] text-[10px] font-mono font-bold tabular-nums">
              +{sandboxResult.lcfCyclesPreserved.toFixed(1)}c LCF
            </span>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-mono font-bold text-[#B8CE82] tabular-nums">
              {sandboxResult.peakEgtAlleviationDegR.toFixed(1)}°R
            </span>
            <span className="text-xs font-mono text-[#949C96] tabular-nums">
              [ {flexDeratePct}% Derate ]
            </span>
          </div>
          <div className="text-[11px] text-[#949C96] mt-1.5">
            −1.8°R peak T50 &amp; +2.2c LCF per 1% derate
          </div>
        </div>

        <div className="backdrop-blur-2xl bg-[#232725]/88 border border-white/[0.08] rounded-[24px] p-5 shadow-[0_16px_40px_rgba(0,0,0,0.45)] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-normal text-[#EAECE9]">
              Annual FLEX Savings
            </span>
            <ArrowUpRight className="w-4 h-4 text-[#B8CE82]" />
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-mono font-bold text-[#B8CE82] tabular-nums">
              +${sandboxResult.annualSavingsUsd.toLocaleString()}/yr
            </span>
            <span className="text-xs font-mono text-[#949C96] tabular-nums">+$14,500/yr/%</span>
          </div>
          <div className="text-[11px] text-[#949C96] mt-1.5">
            Reduced HPT TBC spallation &amp; shop visit rate
          </div>
        </div>

        <div className="backdrop-blur-2xl bg-[#232725]/88 border border-white/[0.08] rounded-[24px] p-5 shadow-[0_16px_40px_rgba(0,0,0,0.45)] text-[#EAECE9] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-normal text-[#EAECE9]">
              Optimal Removal Threshold
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-[#B8CE82] text-[#181B19] text-[10px] font-mono font-bold uppercase tracking-wider tabular-nums">
              {activeRouteSpec.multiplier.toFixed(2)}x Env
            </span>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-mono font-bold text-[#D8B65E] tabular-nums">
              {sandboxResult.optimalStoppingRulThreshold.toFixed(1)} cycles
            </span>
          </div>
          <div className="text-[11px] font-mono text-[#949C96] mt-1.5 tabular-nums">
            Fleet Cost Avoidance: ${sandboxResult.expectedFleetCostSavingsUsd.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Middle Split: Left Cost & FLEX Sliders | Right Geographic Route Environment */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
        {/* Left Column */}
        <div className="lg:col-span-7 backdrop-blur-2xl bg-[#232725]/88 border border-white/[0.08] rounded-[24px] p-5 shadow-[0_16px_40px_rgba(0,0,0,0.45)] flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-[#B8CE82]" />
              <h2 className="text-[14px] font-normal text-[#EAECE9]">
                Optimal Stopping Cost Parameters &amp; Pilot FLEX Derate
              </h2>
            </div>
            <span className="px-3 py-0.5 rounded-full bg-[#B8CE82] text-[#181B19] text-[10px] font-bold uppercase tracking-wider">
              ACTIVE MODEL
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Slider 1: C_f */}
            <div className="bg-[#1B1F1D]/85 rounded-2xl p-3.5 border border-white/[0.07]">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <label
                  htmlFor="slider-cf"
                  className="text-[10px] uppercase tracking-wider text-[#949C96]"
                >
                  In-Service Failure Cost (C_f)
                </label>
                <span className="font-mono font-bold text-[#EAECE9] tabular-nums">
                  ${failureCostCf.toLocaleString()}
                </span>
              </div>
              <input
                id="slider-cf"
                type="range"
                min={10000}
                max={500000}
                step={5000}
                value={failureCostCf}
                onChange={(e) => setFailureCostCf(Number(e.target.value))}
                className="w-full accent-[#B8CE82] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] font-mono text-[#949C96] mt-1">
                <span>$10k</span>
                <span>AOG / IFSD Penalty</span>
                <span>$500k</span>
              </div>
            </div>

            {/* Slider 2: c_w */}
            <div className="bg-[#1B1F1D]/85 rounded-2xl p-3.5 border border-white/[0.07]">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <label
                  htmlFor="slider-cw"
                  className="text-[10px] uppercase tracking-wider text-[#949C96]"
                >
                  Wasted Life Cost (c_w)
                </label>
                <span className="font-mono font-bold text-[#EAECE9] tabular-nums">
                  ${wastedLifeCostCw.toLocaleString()} / cycle
                </span>
              </div>
              <input
                id="slider-cw"
                type="range"
                min={10}
                max={1000}
                step={10}
                value={wastedLifeCostCw}
                onChange={(e) => setWastedLifeCostCw(Number(e.target.value))}
                className="w-full accent-[#D8B65E] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] font-mono text-[#949C96] mt-1">
                <span>$10/c</span>
                <span>Green-Time Loss</span>
                <span>$1,000/c</span>
              </div>
            </div>

            {/* Slider 3: Lead Time L */}
            <div className="bg-[#1B1F1D]/85 rounded-2xl p-3.5 border border-white/[0.07]">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <label
                  htmlFor="slider-leadtime"
                  className="text-[10px] uppercase tracking-wider text-[#949C96]"
                >
                  Hangar Lead Time (L)
                </label>
                <span className="font-mono font-bold text-[#EAECE9] tabular-nums">
                  {leadTimeL} cycles
                </span>
              </div>
              <input
                id="slider-leadtime"
                type="range"
                min={5}
                max={30}
                step={1}
                value={leadTimeL}
                onChange={(e) => setLeadTimeL(Number(e.target.value))}
                className="w-full accent-[#82A995] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] font-mono text-[#949C96] mt-1">
                <span>5c (Hub)</span>
                <span>MRO Induct Buffer</span>
                <span>30c (Remote)</span>
              </div>
            </div>

            {/* Slider 4: Pilot Takeoff Thrust Derate (FLEX Temp) */}
            <div className="bg-[#2B302D]/80 rounded-2xl p-3.5 border border-[#D8B65E]/45">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <label
                  htmlFor="slider-flex"
                  className="text-[10px] uppercase tracking-wider text-[#D8B65E] font-bold flex items-center gap-1"
                >
                  <Flame className="w-3.5 h-3.5 text-[#D8B65E]" />
                  <span>Pilot FLEX Thrust Derate</span>
                </label>
                <span className="font-mono font-bold text-[#EAECE9] tabular-nums">
                  {flexDeratePct}% ({sandboxResult.peakEgtAlleviationDegR.toFixed(1)}°R)
                </span>
              </div>
              <input
                id="slider-flex"
                type="range"
                min={0}
                max={15}
                step={1}
                value={flexDeratePct}
                onChange={(e) => setFlexDeratePct(Number(e.target.value))}
                className="w-full accent-[#D8B65E] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] font-mono text-[#949C96] mt-1">
                <span>0% (TOGA)</span>
                <span className="text-[#B8CE82]">
                  +{sandboxResult.lcfCyclesPreserved.toFixed(1)}c LCF
                </span>
                <span>15% Max</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Geographic Route Environment Selector */}
        <div className="lg:col-span-5 backdrop-blur-2xl bg-[#232725]/88 border border-white/[0.08] rounded-[24px] p-5 shadow-[0_16px_40px_rgba(0,0,0,0.45)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-[#B8CE82]" />
                <h2 className="text-[14px] font-normal text-[#EAECE9]">
                  Geographic Route Environment
                </h2>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-[#D8B65E] text-[#181B19] text-[10px] font-mono font-bold uppercase tracking-wider tabular-nums">
                {activeRouteSpec.multiplier.toFixed(2)}x Wear
              </span>
            </div>

            <div
              className="grid grid-cols-1 sm:grid-cols-2 gap-2.5"
              role="radiogroup"
              aria-label="Geographic Route Environment"
            >
              {ROUTE_ENVIRONMENTS.map((env) => {
                const isSelected = env.id === routeEnvId;
                return (
                  <button
                    key={env.id}
                    type="button"
                    onClick={() => setRouteEnvId(env.id)}
                    className={`text-left p-3 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'bg-[#2B302D] text-[#EAECE9] border-[#B8CE82] shadow-md'
                        : 'bg-[#1B1F1D]/85 text-[#EAECE9] border-white/[0.07] hover:border-[#B8CE82]/50'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-mono font-bold truncate">{env.name}</span>
                      <span
                        className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full shrink-0 tabular-nums ${
                          isSelected
                            ? 'bg-[#B8CE82] text-[#181B19]'
                            : 'bg-[#2B302D] text-[#B8CE82]'
                        }`}
                      >
                        {env.multiplier.toFixed(2)}x
                      </span>
                    </div>
                    <div className="mt-1.5 text-[10px] leading-snug text-[#949C96]">
                      {env.primaryDegradationMechanism}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section: 60-Cycle 3-Bay Hangar Gantt Scheduler */}
      <div className="backdrop-blur-2xl bg-[#232725]/88 border border-white/[0.08] rounded-[24px] p-5 shadow-[0_16px_40px_rgba(0,0,0,0.45)] text-[#EAECE9] space-y-3.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <CalendarClock className="w-4 h-4 text-[#B8CE82]" />
            <h2 className="text-[14px] font-normal text-[#EAECE9]">
              60-Cycle 3-Bay Hangar Gantt Scheduler (Zero-Contention MRO Allocation)
            </h2>
          </div>
          <div className="flex items-center gap-4 text-[10px] font-mono uppercase tracking-wider text-[#949C96]">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#D97865] inline-block" />
              Critical Overhaul
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#D8B65E] inline-block" />
              Scheduled Shop Visit
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#B8CE82] inline-block" />
              Preventive Monitor
            </span>
          </div>
        </div>

        <div className="space-y-2.5">
          <div className="grid grid-cols-12 text-[10px] font-mono uppercase tracking-wider text-[#949C96] pl-28 pr-2 tabular-nums">
            <span>Cycle +0</span>
            <span className="col-span-2 text-center">+10c</span>
            <span className="col-span-2 text-center">+20c</span>
            <span className="col-span-2 text-center">+30c</span>
            <span className="col-span-2 text-center">+40c</span>
            <span className="col-span-2 text-center">+50c</span>
            <span className="text-right">+60c</span>
          </div>

          {bays.map((bayName) => {
            const bayOrders = sandboxResult.hangarSchedule.filter((w) => w.bay === bayName);
            return (
              <div
                key={bayName}
                className="flex items-center gap-3 bg-[#1B1F1D]/85 border border-white/[0.07] rounded-2xl p-2.5"
              >
                <div className="w-24 shrink-0 pl-1">
                  <div className="text-xs font-mono font-bold text-[#EAECE9]">{bayName}</div>
                  <div className="text-[10px] font-mono uppercase tracking-wider text-[#949C96]">
                    {bayOrders.length} Work Orders
                  </div>
                </div>

                <div className="relative flex-1 h-12 bg-[#141715] rounded-xl overflow-hidden hatched-track border border-white/[0.06]">
                  {[10, 20, 30, 40, 50].map((mark) => (
                    <div
                      key={mark}
                      className="absolute top-0 bottom-0 border-l border-white/[0.06]"
                      style={{ left: `${(mark / 60) * 100}%` }}
                    />
                  ))}

                  {bayOrders.map((wo) => {
                    const leftPct = (wo.startCycle / 60) * 100;
                    const widthPct = Math.max(8, (wo.durationCycles / 60) * 100);
                    const blockTone =
                      wo.urgency === 'CRITICAL OVERHAUL'
                        ? 'bg-[#D97865] text-[#181B19]'
                        : wo.urgency === 'SCHEDULED SHOP VISIT'
                          ? 'bg-[#D8B65E] text-[#181B19]'
                          : 'bg-[#B8CE82] text-[#181B19]';

                    return (
                      <button
                        key={wo.engineId}
                        type="button"
                        onClick={() => onSelectEngineForTwin(wo.engineId)}
                        style={{ left: `${leftPct}%`, width: `${widthPct}%` }}
                        title={`${wo.engineId} (${wo.tailId}): Cycles +${wo.startCycle} to +${wo.endCycle} · ${wo.workscope}`}
                        className={`absolute top-1.5 bottom-1.5 rounded-xl px-2.5 py-1 text-left shadow-sm transition-transform hover:scale-[1.02] cursor-pointer overflow-hidden flex flex-col justify-between font-mono ${blockTone}`}
                      >
                        <div className="flex items-center justify-between gap-1 text-[10px] font-bold truncate tabular-nums">
                          <span>{wo.engineId}</span>
                          <ArrowUpRight className="w-3 h-3 shrink-0" />
                        </div>
                        <div className="text-[9px] font-semibold opacity-90 truncate tabular-nums">
                          {wo.tailId} · c+{wo.startCycle}–{wo.endCycle}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
