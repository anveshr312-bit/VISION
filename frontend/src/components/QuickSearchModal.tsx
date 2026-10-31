import React, { useMemo, useState } from 'react';
import { Search, X, Plane, Cpu, ArrowRight, ShieldAlert, CheckCircle2, Clock } from 'lucide-react';
import { EngineTelemetry } from '../services/prognosticsEngine';

interface QuickSearchModalProps {
  fleet: EngineTelemetry[];
  onSelectEngine: (engineId: string) => void;
  onNavigateTab: (tab: 'DIGITAL_TWIN' | 'STAGE_DEGRADATION' | 'FLEET_ETOPS' | 'ECONOMIC_SANDBOX' | 'AIRWORTHINESS') => void;
  onClose: () => void;
}

export const QuickSearchModal: React.FC<QuickSearchModalProps> = ({
  fleet,
  onSelectEngine,
  onNavigateTab,
  onClose,
}) => {
  const [query, setQuery] = useState('');

  const filteredEngines = useMemo(() => {
    if (!query.trim()) return fleet.slice(0, 8); // show first 8 default
    const q = query.toLowerCase().trim();
    return fleet.filter(
      (e) =>
        e.id.toLowerCase().includes(q) ||
        e.tailId.toLowerCase().includes(q) ||
        e.urgency.toLowerCase().includes(q) ||
        e.wingPosition.toLowerCase().includes(q)
    ).slice(0, 12);
  }, [fleet, query]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Quick Search Fleet Navigator"
      className="fixed inset-0 z-50 bg-[#111A19]/80 backdrop-blur-md flex items-start justify-center pt-20 p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl bg-[#1A2220] border border-white/15 rounded-[24px] shadow-[0_24px_70px_rgba(0,0,0,0.9)] overflow-hidden text-[#EAECE9]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="p-4 border-b border-white/10 flex items-center gap-3 bg-[#232C29]">
          <Search className="w-5 h-5 text-[#B8CE82] shrink-0" />
          <input
            type="text"
            autoFocus
            placeholder="Search by Tail (e.g. N787-17), ESN-787-034, Wing, or Urgency..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-sm text-[#EAECE9] placeholder-[#949C96] focus:outline-none"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="text-[#949C96] hover:text-[#EAECE9] p-1 text-xs"
            >
              Clear
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-[#949C96] hover:text-[#EAECE9]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Nav Shortcut Pills */}
        <div className="px-4 py-2.5 bg-[#1F2724] border-b border-white/5 flex flex-wrap items-center gap-2 text-xs">
          <span className="text-[11px] text-[#949C96]">Jump to:</span>
          <button
            type="button"
            onClick={() => {
              onNavigateTab('DIGITAL_TWIN');
              onClose();
            }}
            className="px-2.5 py-1 rounded-full bg-white/5 hover:bg-[#B8CE82]/20 hover:text-[#B8CE82] transition-colors cursor-pointer"
          >
            3D Digital Twin
          </button>
          <button
            type="button"
            onClick={() => {
              onNavigateTab('STAGE_DEGRADATION');
              onClose();
            }}
            className="px-2.5 py-1 rounded-full bg-white/5 hover:bg-[#B8CE82]/20 hover:text-[#B8CE82] transition-colors cursor-pointer"
          >
            HPC Diagnostics
          </button>
          <button
            type="button"
            onClick={() => {
              onNavigateTab('FLEET_ETOPS');
              onClose();
            }}
            className="px-2.5 py-1 rounded-full bg-white/5 hover:bg-[#B8CE82]/20 hover:text-[#B8CE82] transition-colors cursor-pointer"
          >
            ETOPS Board
          </button>
          <button
            type="button"
            onClick={() => {
              onNavigateTab('AIRWORTHINESS');
              onClose();
            }}
            className="px-2.5 py-1 rounded-full bg-white/5 hover:bg-[#B8CE82]/20 hover:text-[#B8CE82] transition-colors cursor-pointer"
          >
            Form 8130-3 Release
          </button>
        </div>

        {/* Search Results List */}
        <div className="max-h-[380px] overflow-y-auto p-2 space-y-1">
          {filteredEngines.length === 0 ? (
            <div className="p-8 text-center text-xs text-[#949C96]">
              No engines or aircraft tails matched &quot;{query}&quot;.
            </div>
          ) : (
            filteredEngines.map((eng) => (
              <button
                key={eng.id}
                type="button"
                onClick={() => {
                  onSelectEngine(eng.id);
                  onClose();
                }}
                className="w-full p-3 rounded-xl bg-[#232A27]/60 hover:bg-[#2A3430] border border-white/5 hover:border-[#B8CE82]/30 flex items-center justify-between transition-all cursor-pointer text-left group"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      eng.urgency === 'CRITICAL OVERHAUL'
                        ? 'bg-[#D97865]/20 text-[#D97865]'
                        : eng.urgency === 'MONITOR'
                          ? 'bg-[#E5A894]/20 text-[#E5A894]'
                          : 'bg-[#82A995]/20 text-[#B8CE82]'
                    }`}
                  >
                    <Plane className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-[#EAECE9] group-hover:text-[#B8CE82] transition-colors">
                        {eng.id}
                      </span>
                      <span className="text-[11px] text-[#949C96] font-mono">
                        Tail {eng.tailId} ({eng.wingPosition})
                      </span>
                    </div>
                    <div className="text-[11px] text-[#949C96] flex items-center gap-2 mt-0.5">
                      <span>RUL: <strong className="text-[#EAECE9] font-mono">{eng.conformalRul}c</strong></span>
                      <span>·</span>
                      <span>Cycles: <strong className="text-[#EAECE9] font-mono">{eng.flightCycles}</strong></span>
                      <span>·</span>
                      <span>T30: <strong className="text-[#EAECE9] font-mono">{eng.t30}°R</strong></span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                      eng.urgency === 'CRITICAL OVERHAUL'
                        ? 'bg-[#D97865]/20 text-[#D97865] border border-[#D97865]/30'
                        : eng.urgency === 'MONITOR'
                          ? 'bg-[#E5A894]/20 text-[#E5A894] border border-[#E5A894]/30'
                          : 'bg-[#82A995]/20 text-[#B8CE82] border border-[#B8CE82]/30'
                    }`}
                  >
                    {eng.urgency}
                  </span>
                  <ArrowRight className="w-4 h-4 text-[#949C96] group-hover:text-[#B8CE82] group-hover:translate-x-0.5 transition-all" />
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
