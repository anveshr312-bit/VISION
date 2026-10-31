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
    <div className="max-w-[1440px] mx-auto px-6 py-4 space-y-4 text-[#E7ECE7]">
      {/* Top 4 Glassmorphic KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="backdrop-blur-2xl bg-[#1C2926]/90 border border-[#46564D] rounded-3xl p-4 shadow-2xl">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wider text-[#A6B4AA]">
              Optimal Stopping Trigger θ*
            </span>
            <ArrowUpRight className="w-4 h-4 text-[#B3C58B]" />
          </div>
          <div className="mt-1.5 flex items-baseline justify-between">
            <span className="text-xl font-mono font-bold text-[#E7ECE7] tabular-nums">
              θ* = {(sandboxResult.thetaStar * 100).toFixed(3)}%
            </span>
            <span className="text-xs font-mono text-[#B3C58B] tabular-nums">
              γ = {sandboxResult.gammaRatio.toFixed(5)}
            </span>
          </div>
          <div className="text-[10px] font-mono text-[#A6B4AA] mt-1">
            θ* = γ / (1 + γ) where γ = c_w / C_f
          </div>
        </div>

        <div className="backdrop-blur-2xl bg-[#1C2926]/90 border border-[#46564D] rounded-3xl p-4 shadow-2xl">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wider text-[#A6B4AA]">
              FLEX EGT Alleviation
            </span>
            <ArrowUpRight className="w-4 h-4 text-[#B3C58B]" />
          </div>
          <div className="mt-1.5 flex items-baseline justify-between">
            <span className="text-xl font-mono font-bold text-[#B3C58B] tabular-nums">
              {sandboxResult.peakEgtAlleviationDegR.toFixed(1)}°R
            </span>
            <span className="px-2 py-0.5 rounded-full bg-[#82A995]/20 border border-[#82A995]/60 text-[#82A995] text-[10px] font-mono font-bold tabular-nums">
              +{sandboxResult.lcfCyclesPreserved.toFixed(1)}c LCF
            </span>
          </div>
          <div className="text-[11px] text-[#A6B4AA] mt-1">
            −1.8°R peak T50 &amp; +2.2c LCF per 1% derate
          </div>
        </div>

        <div className="backdrop-blur-2xl bg-[#1C2926]/90 border border-[#46564D] rounded-3xl p-4 shadow-2xl">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wider text-[#A6B4AA]">
              Annual FLEX Savings
            </span>
            <ArrowUpRight className="w-4 h-4 text-[#82A995]" />
          </div>
          <div className="mt-1.5 flex items-baseline justify-between">
            <span className="text-xl font-mono font-bold text-[#82A995] tabular-nums">
              +${sandboxResult.annualSavingsUsd.toLocaleString()}/yr
            </span>
            <span className="text-xs font-mono text-[#A6B4AA] tabular-nums">+$14,500/yr/%</span>
          </div>
          <div className="text-[11px] text-[#A6B4AA] mt-1">
            Reduced HPT TBC spallation &amp; shop visit rate
          </div>
        </div>

        <div className="backdrop-blur-2xl bg-[#1C2926]/90 border border-[#46564D] rounded-3xl p-4 shadow-2xl text-[#E7ECE7]">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wider text-[#A6B4AA]">
              Optimal Removal Threshold
            </span>
            <ArrowUpRight className="w-4 h-4 text-[#D8B65E]" />
          </div>
          <div className="mt-1.5 flex items-baseline justify-between">
            <span className="text-xl font-mono font-bold text-[#D8B65E] tabular-nums">
              {sandboxResult.optimalStoppingRulThreshold.toFixed(1)} cycles
            </span>
            <span className="px-2 py-0.5 rounded-md bg-[#B3C58B] text-[#111A19] text-[10px] font-mono font-bold uppercase tracking-wider tabular-nums">
              {activeRouteSpec.multiplier.toFixed(2)}x Env
            </span>
          </div>
          <div className="text-[11px] font-mono text-[#A6B4AA] mt-1 tabular-nums">
            Fleet Cost Avoidance: ${sandboxResult.expectedFleetCostSavingsUsd.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Middle Split: Left Cost & FLEX Sliders | Right Geographic Route Environment */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
        {/* Left Column */}
        <div className="lg:col-span-7 backdrop-blur-2xl bg-[#1C2926]/90 border border-[#46564D] rounded-3xl p-5 shadow-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-[#B3C58B]" />
              <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-[#E7ECE7]">
                Optimal Stopping Cost Parameters &amp; Pilot FLEX Derate
              </h2>
            </div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#82A995]">
              ● Conformal Model Active
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Slider 1: C_f */}
            <div className="bg-[#182321] rounded-2xl p-3.5 border border-[#46564D]">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <label
                  htmlFor="slider-cf"
                  className="text-[10px] uppercase tracking-wider text-[#A6B4AA]"
                >
                  In-Service Failure Cost (C_f)
                </label>
                <span className="font-mono font-bold text-[#E7ECE7] tabular-nums">
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
                className="w-full accent-[#B3C58B] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] font-mono text-[#A6B4AA] mt-1">
                <span>$10k</span>
                <span>AOG / IFSD Penalty</span>
                <span>$500k</span>
              </div>
            </div>

            {/* Slider 2: c_w */}
            <div className="bg-[#182321] rounded-2xl p-3.5 border border-[#46564D]">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <label
                  htmlFor="slider-cw"
                  className="text-[10px] uppercase tracking-wider text-[#A6B4AA]"
                >
                  Wasted Life Cost (c_w)
                </label>
                <span className="font-mono font-bold text-[#E7ECE7] tabular-nums">
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
              <div className="flex justify-between text-[10px] font-mono text-[#A6B4AA] mt-1">
                <span>$10/c</span>
                <span>Green-Time Loss</span>
                <span>$1,000/c</span>
              </div>
            </div>

            {/* Slider 3: Lead Time L */}
            <div className="bg-[#182321] rounded-2xl p-3.5 border border-[#46564D]">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <label
                  htmlFor="slider-leadtime"
                  className="text-[10px] uppercase tracking-wider text-[#A6B4AA]"
                >
                  Hangar Lead Time (L)
                </label>
                <span className="font-mono font-bold text-[#E7ECE7] tabular-nums">
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
              <div className="flex justify-between text-[10px] font-mono text-[#A6B4AA] mt-1">
                <span>5c (Hub)</span>
                <span>MRO Induct Buffer</span>
                <span>30c (Remote)</span>
              </div>
            </div>

            {/* Slider 4: Pilot Takeoff Thrust Derate (FLEX Temp) */}
            <div className="bg-[#293834]/70 rounded-2xl p-3.5 border border-[#D8B65E]/50">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <label
                  htmlFor="slider-flex"
                  className="text-[10px] uppercase tracking-wider text-[#D8B65E] font-bold flex items-center gap-1"
                >
                  <Flame className="w-3.5 h-3.5 text-[#D8B65E]" />
                  <span>Pilot FLEX Thrust Derate</span>
                </label>
                <span className="font-mono font-bold text-[#E7ECE7] tabular-nums">
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
              <div className="flex justify-between text-[10px] font-mono text-[#A6B4AA] mt-1">
                <span>0% (TOGA)</span>
                <span className="text-[#82A995]">
                  +{sandboxResult.lcfCyclesPreserved.toFixed(1)}c LCF
                </span>
                <span>15% Max</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Geographic Route Environment Selector */}
        <div className="lg:col-span-5 backdrop-blur-2xl bg-[#1C2926]/90 border border-[#46564D] rounded-3xl p-5 shadow-2xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Globe className="w-4 h-4 text-[#B3C58B]" />
                <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-[#E7ECE7]">
                  Geographic Route Environment
                </h2>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-[#D8B65E] text-[#111A19] text-[10px] font-mono font-bold uppercase tracking-wider tabular-nums">
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
                        ? 'bg-[#293834] text-[#E7ECE7] border-[#B3C58B] shadow-md'
                        : 'bg-[#182321] text-[#E7ECE7] border-[#46564D] hover:border-[#B3C58B]/60'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-mono font-bold truncate">{env.name}</span>
                      <span
                        className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full shrink-0 tabular-nums ${
                          isSelected
                            ? 'bg-[#B3C58B] text-[#111A19]'
                            : 'bg-[#293834] text-[#82A995]'
                        }`}
                      >
                        {env.multiplier.toFixed(2)}x
                      </span>
                    </div>
                    <div className="mt-1.5 text-[10px] leading-snug text-[#A6B4AA]">
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
      <div className="backdrop-blur-2xl bg-[#1C2926]/90 border border-[#46564D] rounded-3xl p-5 shadow-2xl text-[#E7ECE7] space-y-3.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <CalendarClock className="w-4 h-4 text-[#B3C58B]" />
            <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-[#E7ECE7]">
              60-Cycle 3-Bay Hangar Gantt Scheduler (Zero-Contention MRO Allocation)
            </h2>
          </div>
          <div className="flex items-center gap-4 text-[10px] font-mono uppercase tracking-wider text-[#A6B4AA]">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#D97865] inline-block" />
              Critical Overhaul
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#D8B65E] inline-block" />
              Scheduled Shop Visit
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#82A995] inline-block" />
              Preventive Monitor
            </span>
          </div>
        </div>

        <div className="space-y-2.5">
          <div className="grid grid-cols-12 text-[10px] font-mono uppercase tracking-wider text-[#A6B4AA] pl-28 pr-2 tabular-nums">
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
                className="flex items-center gap-3 bg-[#182321] border border-[#46564D] rounded-2xl p-2.5"
              >
                <div className="w-24 shrink-0 pl-1">
                  <div className="text-xs font-mono font-bold text-[#E7ECE7]">{bayName}</div>
                  <div className="text-[10px] font-mono uppercase tracking-wider text-[#A6B4AA]">
                    {bayOrders.length} Work Orders
                  </div>
                </div>

                <div className="relative flex-1 h-12 bg-[#111A19] rounded-xl overflow-hidden hatched-track border border-[#46564D]">
                  {[10, 20, 30, 40, 50].map((mark) => (
                    <div
                      key={mark}
                      className="absolute top-0 bottom-0 border-l border-[#46564D]/50"
                      style={{ left: `${(mark / 60) * 100}%` }}
                    />
                  ))}

                  {bayOrders.map((wo) => {
                    const leftPct = (wo.startCycle / 60) * 100;
                    const widthPct = Math.max(8, (wo.durationCycles / 60) * 100);
                    const blockTone =
                      wo.urgency === 'CRITICAL OVERHAUL'
                        ? 'bg-[#D97865] text-[#111A19]'
                        : wo.urgency === 'SCHEDULED SHOP VISIT'
                          ? 'bg-[#D8B65E] text-[#111A19]'
                          : 'bg-[#82A995] text-[#111A19]';

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
