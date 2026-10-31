import React, { useMemo, useState } from 'react';
import {
  Plane,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  Search,
  ArrowUpRight,
  Cpu,
} from 'lucide-react';
import {
  EngineTelemetry,
  EtopsTailStatus,
  pairFleetIntoEtopsWings,
} from '../services/prognosticsEngine';

interface FleetEtopsScreenProps {
  fleet: EngineTelemetry[];
  selectedEngineId: string;
  onSelectEngineForTwin: (engineId: string) => void;
}

export const FleetEtopsScreen: React.FC<FleetEtopsScreenProps> = ({
  fleet,
  selectedEngineId,
  onSelectEngineForTwin,
}) => {
  const [viewMode, setViewMode] = useState<'TWIN_WING_ETOPS' | 'SINGLE_ENGINES'>('TWIN_WING_ETOPS');
  const [statusFilter, setStatusFilter] = useState<'ALL' | EtopsTailStatus>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const tailPairs = useMemo(() => pairFleetIntoEtopsWings(fleet), [fleet]);

  const summaryStats = useMemo(() => {
    const compliant = tailPairs.filter((t) => t.status === 'COMPLIANT').length;
    const asymmetry = tailPairs.filter((t) => t.status === 'ASYMMETRY_WARNING').length;
    const critical = tailPairs.filter((t) => t.status === 'CRITICAL_GROUND').length;
    const avgRul =
      fleet.reduce((acc, item) => acc + item.conformalRul, 0) / Math.max(1, fleet.length);
    return { compliant, asymmetry, critical, avgRul };
  }, [tailPairs, fleet]);

  const filteredTailPairs = useMemo(() => {
    return tailPairs.filter((pair) => {
      if (statusFilter !== 'ALL' && pair.status !== statusFilter) return false;
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        const matchTail = pair.tailId.toLowerCase().includes(q);
        const matchLeft = pair.leftEngine.id.toLowerCase().includes(q);
        const matchRight = pair.rightEngine.id.toLowerCase().includes(q);
        const matchHub = pair.routeHub.toLowerCase().includes(q);
        return matchTail || matchLeft || matchRight || matchHub;
      }
      return true;
    });
  }, [tailPairs, statusFilter, searchQuery]);

  const filteredSingleEngines = useMemo(() => {
    return fleet.filter((eng) => {
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        return (
          eng.id.toLowerCase().includes(q) ||
          eng.tailId.toLowerCase().includes(q) ||
          eng.urgency.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [fleet, searchQuery]);

  return (
    <div className="max-w-[1440px] mx-auto px-6 lg:px-8 py-5 space-y-5 text-[#EAECE9]">
      {/* Editorial Section Header matching Overview aesthetic */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1.5">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-[#232725]/90 border border-white/15 text-xs text-[#EAECE9]">
            <span className="w-2 h-2 rounded-full bg-[#B8CE82]" />
            <span>Trent 1000 · 50 Boeing 787-9 Tails</span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-normal tracking-tight text-[#EAECE9]">
            Fleet &amp; ETOPS-330 Twin-Wing Dispatch
          </h1>
        </div>
        <p className="text-xs text-[#949C96] font-mono">
          100 Active Turbofans · Oceanic Wing Asymmetry &amp; Conformal RUL Monitoring
        </p>
      </div>

      {/* Top 4 Glassmorphic Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="backdrop-blur-2xl bg-[#232725]/88 border border-white/[0.08] rounded-[24px] p-5 shadow-[0_16px_40px_rgba(0,0,0,0.45)] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-normal text-[#EAECE9]">
              Boeing 787-9 Fleet
            </span>
            <ArrowUpRight className="w-4 h-4 text-[#B8CE82]" />
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-2xl font-mono font-bold text-[#EAECE9] tabular-nums">
              50 Tails · 100
            </span>
            <span className="text-xs font-mono font-semibold text-[#B8CE82] tabular-nums">
              Avg {summaryStats.avgRul.toFixed(1)}c
            </span>
          </div>
          <div className="text-[11px] text-[#949C96] mt-1.5">
            Rolls-Royce Trent 1000 High-Bypass Fleet
          </div>
        </div>

        <div className="backdrop-blur-2xl bg-[#232725]/88 border border-white/[0.08] rounded-[24px] p-5 shadow-[0_16px_40px_rgba(0,0,0,0.45)] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-normal text-[#EAECE9]">
              ETOPS-330 Compliant
            </span>
            <span className="px-3 py-0.5 rounded-full bg-[#B8CE82] text-[#181B19] text-[10px] font-mono font-bold uppercase tracking-wider">
              COMPLIANT
            </span>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-light text-[#EAECE9] tabular-nums">
              {summaryStats.compliant}
            </span>
            <span className="text-xs font-mono text-[#B8CE82] tabular-nums">
              [ ≥ 20.0c floor ]
            </span>
          </div>
          <div className="text-[11px] text-[#949C96] mt-1.5">
            Balanced wing RUL &amp; unrestricted oceanic dispatch
          </div>
        </div>

        <div className="backdrop-blur-2xl bg-[#232725]/88 border border-white/[0.08] rounded-[24px] p-5 shadow-[0_16px_40px_rgba(0,0,0,0.45)] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-normal text-[#EAECE9]">
              Wing Asymmetry (Δ &gt; 40c)
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-[#D8B65E] text-[#181B19] text-[10px] font-mono font-bold uppercase tracking-wider">
              ASYMMETRY
            </span>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-light text-[#D8B65E] tabular-nums">
              {summaryStats.asymmetry}
            </span>
            <span className="text-xs font-mono text-[#949C96] tabular-nums">
              [ |ΔRUL| &gt; 40c ]
            </span>
          </div>
          <div className="text-[11px] text-[#949C96] mt-1.5">
            Prevents simultaneous oceanic dual-removal
          </div>
        </div>

        <div className="backdrop-blur-2xl bg-[#232725]/88 border border-[#D97865]/40 rounded-[24px] p-5 shadow-[0_16px_40px_rgba(0,0,0,0.45)] text-[#EAECE9] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-normal text-[#EAECE9]">
              Critical Ground Queue
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-[#D97865] text-[#181B19] text-[10px] font-mono font-bold uppercase tracking-wider">
              CRITICAL
            </span>
          </div>
          <div className="mt-3 flex items-baseline justify-between">
            <span className="text-3xl font-light text-[#D97865] tabular-nums">
              {summaryStats.critical}
            </span>
            <span className="text-xs font-mono text-[#D97865] tabular-nums">
              [ &lt; 20c / FAULT ]
            </span>
          </div>
          <div className="text-[11px] text-[#949C96] mt-1.5">
            Minimum wing RUL &lt; 20c or DO-178C fault
          </div>
        </div>
      </div>

      {/* Filter & View Mode Glassmorphic Toolbar */}
      <div className="backdrop-blur-2xl bg-[#232725]/88 border border-white/[0.08] rounded-[24px] p-4 shadow-[0_16px_40px_rgba(0,0,0,0.45)] flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div
            className="flex items-center bg-[#1B1F1D] border border-white/[0.07] p-1 rounded-full"
            role="group"
            aria-label="Fleet Display Mode"
          >
            <button
              type="button"
              onClick={() => setViewMode('TWIN_WING_ETOPS')}
              className={`px-4 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'TWIN_WING_ETOPS'
                  ? 'bg-[#DCE0D9] text-[#181B19] font-semibold shadow-sm'
                  : 'text-[#949C96] hover:text-[#EAECE9]'
              }`}
            >
              <Plane className="w-3.5 h-3.5" />
              <span>Twin-Wing ETOPS (50 Tails)</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('SINGLE_ENGINES')}
              className={`px-4 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'SINGLE_ENGINES'
                  ? 'bg-[#DCE0D9] text-[#181B19] font-semibold shadow-sm'
                  : 'text-[#949C96] hover:text-[#EAECE9]'
              }`}
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>Single Engine (100 Turbofans)</span>
            </button>
          </div>

          {viewMode === 'TWIN_WING_ETOPS' && (
            <div className="flex items-center gap-1.5" role="group" aria-label="Filter ETOPS Status">
              {(
                [
                  { id: 'ALL', label: 'All Tails (50)' },
                  { id: 'CRITICAL_GROUND', label: `Critical (${summaryStats.critical})` },
                  { id: 'ASYMMETRY_WARNING', label: `Asymmetry (${summaryStats.asymmetry})` },
                  { id: 'COMPLIANT', label: `Compliant (${summaryStats.compliant})` },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setStatusFilter(tab.id)}
                  className={`px-3.5 py-1.5 rounded-full text-xs transition-colors cursor-pointer ${
                    statusFilter === tab.id
                      ? 'bg-[#B8CE82] text-[#181B19] font-semibold'
                      : 'bg-[#1B1F1D] text-[#949C96] hover:text-[#EAECE9] border border-white/[0.07]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="relative min-w-[260px]">
          <Search className="w-4 h-4 text-[#949C96] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter by Tail (N787-17) or ESN-787-034..."
            aria-label="Filter Fleet by Tail or Engine Serial Number"
            className="w-full pl-9 pr-3.5 py-2 rounded-full bg-[#1B1F1D] border border-white/[0.08] text-xs font-mono text-[#EAECE9] placeholder:text-[#949C96]/60 focus:outline-none focus:border-[#B8CE82]"
          />
        </div>
      </div>

      {/* VIEW 1: Twin-Wing ETOPS 50 Boeing 787 Tails */}
      {viewMode === 'TWIN_WING_ETOPS' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredTailPairs.map((pair) => {
            const deltaPct = Math.min(100, (pair.rulDelta / 80) * 100);
            const isCritical = pair.status === 'CRITICAL_GROUND';
            const isAsymmetry = pair.status === 'ASYMMETRY_WARNING';

            return (
              <div
                key={pair.tailId}
                data-testid={`etops-tail-card-${pair.tailId}`}
                className="backdrop-blur-2xl bg-[#232725]/88 border border-white/[0.08] rounded-[24px] p-5 shadow-[0_16px_40px_rgba(0,0,0,0.45)] flex flex-col justify-between gap-4"
              >
                {/* Header Row */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-2xl bg-[#2B302D] border border-white/[0.08] flex items-center justify-center text-[#B8CE82]">
                      <Plane className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-mono font-bold text-[#EAECE9]">{pair.tailId}</h3>
                        <span className="text-xs font-mono text-[#949C96]">· {pair.routeHub}</span>
                      </div>
                      <div className="text-[11px] text-[#949C96]">
                        {pair.aircraftModel}
                      </div>
                    </div>
                  </div>

                  <span
                    className={`px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                      isCritical
                        ? 'bg-[#D97865] text-[#181B19]'
                        : isAsymmetry
                          ? 'bg-[#D8B65E] text-[#181B19]'
                          : 'bg-[#B8CE82]/20 border border-[#B8CE82]/50 text-[#B8CE82]'
                    }`}
                  >
                    {isCritical ? (
                      <ShieldAlert className="w-3.5 h-3.5" />
                    ) : isAsymmetry ? (
                      <AlertTriangle className="w-3.5 h-3.5" />
                    ) : (
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    )}
                    <span>{pair.status}</span>
                  </span>
                </div>

                {/* Paired Left & Right Wing Turbofan Cards */}
                <div className="grid grid-cols-2 gap-3">
                  {[pair.leftEngine, pair.rightEngine].map((eng) => {
                    const isSelected = eng.id === selectedEngineId;
                    return (
                      <button
                        key={eng.id}
                        type="button"
                        onClick={() => onSelectEngineForTwin(eng.id)}
                        className={`text-left p-3.5 rounded-2xl border transition-all cursor-pointer group ${
                          isSelected
                            ? 'bg-[#2B302D] text-[#EAECE9] border-[#B8CE82] shadow-md'
                            : 'bg-[#1B1F1D]/85 border-white/[0.07] hover:border-[#B8CE82]/50 text-[#EAECE9]'
                        }`}
                      >
                        <div className="flex items-center justify-between text-[10px] uppercase tracking-wider">
                          <span className="text-[#949C96]">
                            {eng.wingPosition === 'ENG-L' ? 'Left Wing (ENG-L)' : 'Right Wing (ENG-R)'}
                          </span>
                          <span className="flex items-center gap-0.5 font-mono font-bold text-[#B8CE82]">
                            <span>3D Twin</span>
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          </span>
                        </div>

                        <div className="mt-1.5 flex items-baseline justify-between font-mono">
                          <span className="text-sm font-bold text-[#EAECE9] tabular-nums">{eng.id}</span>
                          <span
                            className={`text-sm font-bold tabular-nums ${
                              eng.conformalRul < 20
                                ? 'text-[#D97865]'
                                : 'text-[#B8CE82]'
                            }`}
                          >
                            {eng.conformalRul.toFixed(1)}c
                          </span>
                        </div>

                        <div className="mt-1.5 flex items-center justify-between text-[11px] font-mono text-[#949C96] tabular-nums">
                          <span>T30: {eng.t30.toFixed(1)}°R</span>
                          <span>η: {eng.hpcEfficiencyPct.toFixed(1)}%</span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Wing RUL Delta Bar */}
                <div className="bg-[#1B1F1D]/85 rounded-2xl p-3.5 border border-white/[0.07] space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[10px] uppercase tracking-wider text-[#949C96]">
                      Wing RUL Delta |RUL_L − RUL_R|
                    </span>
                    <span
                      className={`font-mono font-bold tabular-nums text-xs ${
                        pair.rulDelta > 40 ? 'text-[#D8B65E]' : 'text-[#B8CE82]'
                      }`}
                    >
                      Δ = {pair.rulDelta.toFixed(1)} cycles{' '}
                      {pair.rulDelta > 40 ? '(> 40c Asymmetry)' : '(Balanced)'}
                    </span>
                  </div>

                  <div className="relative h-2 bg-[#141715] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${deltaPct}%`,
                        background:
                          pair.rulDelta > 40
                            ? 'linear-gradient(90deg, #D8B65E 0%, #D97865 100%)'
                            : 'linear-gradient(90deg, #82A995 0%, #B8CE82 100%)',
                      }}
                    />
                  </div>

                  <div className="text-[11px] text-[#949C96] leading-snug pt-0.5">
                    {pair.advisoryMessage}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* VIEW 2: Single Engine Table */
        <div className="backdrop-blur-2xl bg-[#232725]/88 border border-white/[0.08] rounded-[24px] p-5 shadow-[0_16px_40px_rgba(0,0,0,0.45)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/[0.08] text-[10px] font-mono uppercase tracking-wider text-[#949C96]">
                  <th className="py-3 px-4">Engine ESN</th>
                  <th className="py-3 px-4">Tail / Wing</th>
                  <th className="py-3 px-4">Cycles</th>
                  <th className="py-3 px-4">Conformal RUL</th>
                  <th className="py-3 px-4">T30 Core (°R)</th>
                  <th className="py-3 px-4">P30 (psia)</th>
                  <th className="py-3 px-4">η_HPC</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.06] text-xs font-mono tabular-nums">
                {filteredSingleEngines.map((eng) => (
                  <tr
                    key={eng.id}
                    className={`hover:bg-[#2B302D]/60 transition-colors ${
                      eng.id === selectedEngineId ? 'bg-[#2B302D] font-semibold' : ''
                    }`}
                  >
                    <td className="py-3 px-4 font-bold text-[#EAECE9]">{eng.id}</td>
                    <td className="py-3 px-4 text-[#949C96]">
                      {eng.tailId} · {eng.wingPosition}
                    </td>
                    <td className="py-3 px-4 text-[#949C96]">{eng.flightCycles}c</td>
                    <td className="py-3 px-4 font-bold text-[#B8CE82]">
                      {eng.conformalRul.toFixed(1)}c
                    </td>
                    <td
                      className={`py-3 px-4 ${
                        eng.t30 >= 1590 ? 'text-[#D97865] font-bold' : 'text-[#949C96]'
                      }`}
                    >
                      {eng.t30.toFixed(1)}°R
                    </td>
                    <td className="py-3 px-4 text-[#949C96]">{eng.p30.toFixed(1)}</td>
                    <td className="py-3 px-4 text-[#949C96]">{eng.hpcEfficiencyPct.toFixed(1)}%</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          eng.urgency === 'CRITICAL OVERHAUL'
                            ? 'bg-[#D97865] text-[#181B19]'
                            : eng.urgency === 'SCHEDULED SHOP VISIT'
                              ? 'bg-[#D8B65E] text-[#181B19]'
                              : 'bg-[#B8CE82]/20 border border-[#B8CE82]/50 text-[#B8CE82]'
                        }`}
                      >
                        {eng.urgency}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => onSelectEngineForTwin(eng.id)}
                        className="px-3.5 py-1 rounded-full bg-[#B8CE82] hover:bg-[#B8CE82]/90 text-[#181B19] text-[10px] font-mono font-bold uppercase tracking-wider cursor-pointer"
                      >
                        Inspect 3D Twin
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
