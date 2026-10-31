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
    <div className="max-w-[1440px] mx-auto px-6 py-6 space-y-5 text-[#E7ECE7]">
      {/* Top 4 Glassmorphic Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="backdrop-blur-2xl bg-[#1C2926]/90 border border-[#46564D] rounded-3xl p-5 shadow-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wider text-[#A6B4AA]">
              Boeing 787-9 Fleet
            </span>
            <ArrowUpRight className="w-4 h-4 text-[#B3C58B]" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-mono font-bold text-[#E7ECE7] tabular-nums">
              50 Tails · 100
            </span>
            <span className="text-xs font-mono font-semibold text-[#B3C58B] tabular-nums">
              Avg {summaryStats.avgRul.toFixed(1)}c
            </span>
          </div>
          <div className="text-[11px] text-[#A6B4AA] mt-1">
            Rolls-Royce Trent 1000 High-Bypass Fleet
          </div>
        </div>

        <div className="backdrop-blur-2xl bg-[#1C2926]/90 border border-[#46564D] rounded-3xl p-5 shadow-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wider text-[#A6B4AA]">
              ETOPS-330 Compliant
            </span>
            <ArrowUpRight className="w-4 h-4 text-[#82A995]" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-mono font-bold text-[#82A995] tabular-nums">
              {summaryStats.compliant}
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-[#82A995]/20 border border-[#82A995]/60 text-[#82A995] text-[10px] font-mono font-bold uppercase tracking-wider">
              COMPLIANT
            </span>
          </div>
          <div className="text-[11px] text-[#A6B4AA] mt-1">
            Balanced wing RUL &amp; above 20c oceanic floor
          </div>
        </div>

        <div className="backdrop-blur-2xl bg-[#1C2926]/90 border border-[#46564D] rounded-3xl p-5 shadow-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wider text-[#A6B4AA]">
              Wing Asymmetry (Δ &gt; 40c)
            </span>
            <ArrowUpRight className="w-4 h-4 text-[#D8B65E]" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-mono font-bold text-[#D8B65E] tabular-nums">
              {summaryStats.asymmetry}
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-[#D8B65E] text-[#111A19] text-[10px] font-mono font-bold uppercase tracking-wider">
              ASYMMETRY_WARNING
            </span>
          </div>
          <div className="text-[11px] text-[#A6B4AA] mt-1">
            Prevents simultaneous oceanic dual-removal
          </div>
        </div>

        <div className="backdrop-blur-2xl bg-[#1C2926]/90 border border-[#D97865]/60 rounded-3xl p-5 shadow-2xl text-[#E7ECE7] flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wider text-[#D97865]">
              Critical Ground Queue
            </span>
            <ArrowUpRight className="w-4 h-4 text-[#D97865]" />
          </div>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-mono font-bold text-[#D97865] tabular-nums">
              {summaryStats.critical}
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-[#D97865] text-[#111A19] text-[10px] font-mono font-bold uppercase tracking-wider">
              CRITICAL_GROUND
            </span>
          </div>
          <div className="text-[11px] text-[#A6B4AA] mt-1">
            Minimum wing RUL &lt; 20c or DO-178C fault
          </div>
        </div>
      </div>

      {/* Filter & View Mode Glassmorphic Toolbar */}
      <div className="backdrop-blur-2xl bg-[#1C2926]/90 border border-[#46564D] rounded-3xl p-4 shadow-2xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div
            className="flex items-center bg-[#182321] border border-[#46564D] p-1 rounded-2xl"
            role="group"
            aria-label="Fleet Display Mode"
          >
            <button
              type="button"
              onClick={() => setViewMode('TWIN_WING_ETOPS')}
              className={`px-3.5 py-1.5 rounded-xl text-[11px] font-mono uppercase tracking-wider font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'TWIN_WING_ETOPS'
                  ? 'bg-[#B3C58B] text-[#111A19] font-bold shadow-sm'
                  : 'text-[#A6B4AA] hover:text-[#E7ECE7]'
              }`}
            >
              <Plane className="w-3.5 h-3.5" />
              <span>Twin-Wing ETOPS (50 Tails)</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('SINGLE_ENGINES')}
              className={`px-3.5 py-1.5 rounded-xl text-[11px] font-mono uppercase tracking-wider font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'SINGLE_ENGINES'
                  ? 'bg-[#B3C58B] text-[#111A19] font-bold shadow-sm'
                  : 'text-[#A6B4AA] hover:text-[#E7ECE7]'
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
                  className={`px-3 py-1.5 rounded-xl text-[10px] font-mono uppercase tracking-wider transition-colors cursor-pointer ${
                    statusFilter === tab.id
                      ? 'bg-[#B3C58B] text-[#111A19] font-bold'
                      : 'bg-[#293834] text-[#A6B4AA] hover:text-[#E7ECE7] border border-[#46564D]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="relative min-w-[260px]">
          <Search className="w-4 h-4 text-[#A6B4AA] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter by Tail (N787-17) or ESN-787-034..."
            aria-label="Filter Fleet by Tail or Engine Serial Number"
            className="w-full pl-9 pr-3 py-2 rounded-2xl bg-[#182321] border border-[#46564D] text-xs font-mono text-[#E7ECE7] placeholder:text-[#A6B4AA]/60 focus:outline-none focus:border-[#B3C58B]"
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
                className="backdrop-blur-2xl bg-[#1C2926]/90 border border-[#46564D] rounded-3xl p-5 shadow-2xl flex flex-col justify-between gap-4"
              >
                {/* Header Row */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-2xl bg-[#293834] border border-[#46564D] flex items-center justify-center text-[#B3C58B]">
                      <Plane className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-base font-mono font-bold text-[#E7ECE7]">{pair.tailId}</h3>
                        <span className="text-xs font-mono text-[#A6B4AA]">· {pair.routeHub}</span>
                      </div>
                      <div className="text-[10px] uppercase tracking-wider text-[#A6B4AA]">
                        {pair.aircraftModel}
                      </div>
                    </div>
                  </div>

                  <span
                    className={`px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                      isCritical
                        ? 'bg-[#D97865] text-[#111A19]'
                        : isAsymmetry
                          ? 'bg-[#D8B65E] text-[#111A19]'
                          : 'bg-[#82A995]/20 border border-[#82A995]/60 text-[#82A995]'
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
                            ? 'bg-[#293834] text-[#E7ECE7] border-[#B3C58B] shadow-md'
                            : 'bg-[#182321] border-[#46564D] hover:border-[#B3C58B]/60 text-[#E7ECE7]'
                        }`}
                      >
                        <div className="flex items-center justify-between text-[10px] uppercase tracking-wider">
                          <span className="text-[#A6B4AA]">
                            {eng.wingPosition === 'ENG-L' ? 'Left Wing (ENG-L)' : 'Right Wing (ENG-R)'}
                          </span>
                          <span className="flex items-center gap-0.5 font-mono font-bold text-[#B3C58B]">
                            <span>3D Twin</span>
                            <ArrowUpRight className="w-3.5 h-3.5" />
                          </span>
                        </div>

                        <div className="mt-1.5 flex items-baseline justify-between font-mono">
                          <span className="text-sm font-bold text-[#E7ECE7] tabular-nums">{eng.id}</span>
                          <span
                            className={`text-sm font-bold tabular-nums ${
                              eng.conformalRul < 20
                                ? 'text-[#D97865]'
                                : 'text-[#82A995]'
                            }`}
                          >
                            {eng.conformalRul.toFixed(1)}c
                          </span>
                        </div>

                        <div className="mt-1.5 flex items-center justify-between text-[11px] font-mono text-[#A6B4AA] tabular-nums">
                          <span>T30: {eng.t30.toFixed(1)}°R</span>
                          <span>η: {eng.hpcEfficiencyPct.toFixed(1)}%</span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Wing RUL Delta Bar */}
                <div className="bg-[#182321] rounded-2xl p-3.5 border border-[#46564D] space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[10px] uppercase tracking-wider text-[#A6B4AA]">
                      Wing RUL Delta |RUL_L − RUL_R|
                    </span>
                    <span
                      className={`font-mono font-bold tabular-nums text-xs ${
                        pair.rulDelta > 40 ? 'text-[#D8B65E]' : 'text-[#82A995]'
                      }`}
                    >
                      Δ = {pair.rulDelta.toFixed(1)} cycles{' '}
                      {pair.rulDelta > 40 ? '(> 40c Asymmetry)' : '(Balanced)'}
                    </span>
                  </div>

                  <div className="relative h-2 bg-[#111A19] rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${deltaPct}%`,
                        background:
                          pair.rulDelta > 40
                            ? 'linear-gradient(90deg, #D8B65E 0%, #D97865 100%)'
                            : 'linear-gradient(90deg, #82A995 0%, #B3C58B 100%)',
                      }}
                    />
                  </div>

                  <div className="text-[11px] text-[#A6B4AA] leading-snug pt-0.5">
                    {pair.advisoryMessage}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* VIEW 2: Single Engine Table */
        <div className="backdrop-blur-2xl bg-[#1C2926]/90 border border-[#46564D] rounded-3xl p-5 shadow-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#46564D] text-[10px] font-mono uppercase tracking-wider text-[#A6B4AA]">
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
              <tbody className="divide-y divide-[#46564D]/50 text-xs font-mono tabular-nums">
                {filteredSingleEngines.map((eng) => (
                  <tr
                    key={eng.id}
                    className={`hover:bg-[#293834]/60 transition-colors ${
                      eng.id === selectedEngineId ? 'bg-[#293834] font-semibold' : ''
                    }`}
                  >
                    <td className="py-3 px-4 font-bold text-[#E7ECE7]">{eng.id}</td>
                    <td className="py-3 px-4 text-[#A6B4AA]">
                      {eng.tailId} · {eng.wingPosition}
                    </td>
                    <td className="py-3 px-4 text-[#A6B4AA]">{eng.flightCycles}c</td>
                    <td className="py-3 px-4 font-bold text-[#B3C58B]">
                      {eng.conformalRul.toFixed(1)}c
                    </td>
                    <td
                      className={`py-3 px-4 ${
                        eng.t30 >= 1590 ? 'text-[#D97865] font-bold' : 'text-[#A6B4AA]'
                      }`}
                    >
                      {eng.t30.toFixed(1)}°R
                    </td>
                    <td className="py-3 px-4 text-[#A6B4AA]">{eng.p30.toFixed(1)}</td>
                    <td className="py-3 px-4 text-[#A6B4AA]">{eng.hpcEfficiencyPct.toFixed(1)}%</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          eng.urgency === 'CRITICAL OVERHAUL'
                            ? 'bg-[#D97865] text-[#111A19]'
                            : eng.urgency === 'SCHEDULED SHOP VISIT'
                              ? 'bg-[#D8B65E] text-[#111A19]'
                              : 'bg-[#82A995]/20 border border-[#82A995]/60 text-[#82A995]'
                        }`}
                      >
                        {eng.urgency}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => onSelectEngineForTwin(eng.id)}
                        className="px-3 py-1 rounded-xl bg-[#B3C58B] hover:bg-[#B3C58B]/90 text-[#111A19] text-[10px] font-mono font-bold uppercase tracking-wider cursor-pointer"
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
