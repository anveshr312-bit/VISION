import React from 'react';
import { X, Plane, ShieldCheck, Cpu, Gauge, Clock, Award, Building, Activity } from 'lucide-react';
import { EngineTelemetry } from '../services/prognosticsEngine';

interface AircraftProfileModalProps {
  engine: EngineTelemetry;
  onClose: () => void;
  onNavigateToAirworthiness: () => void;
}

export const AircraftProfileModal: React.FC<AircraftProfileModalProps> = ({
  engine,
  onClose,
  onNavigateToAirworthiness,
}) => {
  const tailNumber = engine.tailId;
  const unitNum = parseInt(engine.id.split('-').pop() || '34', 10);
  const leftEngineId = `ESN-787-${String(unitNum % 2 === 1 ? unitNum : unitNum - 1).padStart(3, '0')}`;
  const rightEngineId = `ESN-787-${String(unitNum % 2 === 1 ? unitNum + 1 : unitNum).padStart(3, '0')}`;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Aircraft and System Profile Dossier"
      className="fixed inset-0 z-50 bg-[#111A19]/80 backdrop-blur-md flex items-center justify-center p-4 sm:p-6"
    >
      <div className="relative w-full max-w-4xl bg-[#181F1D] border border-white/15 rounded-[24px] shadow-[0_24px_70px_rgba(0,0,0,0.85)] overflow-hidden text-[#EAECE9] flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-5 border-b border-white/10 flex items-center justify-between shrink-0 bg-[#232B28]/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#B8CE82]/15 border border-[#B8CE82]/30 flex items-center justify-center text-[#B8CE82]">
              <Plane className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-semibold tracking-wide uppercase">
                  Aircraft & System Dossier · {tailNumber}
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-[#82A995]/20 text-[#B8CE82] border border-[#B8CE82]/30">
                  ETOPS-330
                </span>
              </div>
              <p className="text-xs text-[#949C96]">
                Boeing 787-9 Dreamliner · Commercial Transoceanic Airframe Registry
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Profile"
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-[#949C96] hover:text-[#EAECE9] cursor-pointer transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1 font-sans">
          {/* Top Quick Status Ribbon */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-2xl bg-[#232A26] border border-white/10">
              <span className="text-[11px] text-[#949C96] block uppercase tracking-wider">Airframe Tail</span>
              <span className="text-lg font-mono font-bold text-[#EAECE9]">{tailNumber}</span>
              <span className="text-[10px] text-[#B8CE82] block mt-0.5">FAA Part 121 Line Active</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-[#232A26] border border-white/10">
              <span className="text-[11px] text-[#949C96] block uppercase tracking-wider">Mated Powerplants</span>
              <span className="text-base font-mono font-bold text-[#EAECE9]">2× Trent 1000</span>
              <span className="text-[10px] text-[#82A995] block mt-0.5">High-Bypass (10.8:1)</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-[#232A26] border border-white/10">
              <span className="text-[11px] text-[#949C96] block uppercase tracking-wider">Airframe Time</span>
              <span className="text-lg font-mono font-bold text-[#EAECE9]">14,892 hrs</span>
              <span className="text-[10px] text-[#949C96] block mt-0.5">{engine.flightCycles} Spool Cycles</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-[#232A26] border border-white/10">
              <span className="text-[11px] text-[#949C96] block uppercase tracking-wider">Dispatch Status</span>
              <span className="text-base font-mono font-bold text-[#D97865]">
                {engine.urgency}
              </span>
              <span className="text-[10px] text-[#949C96] block mt-0.5">
                RUL: {engine.conformalRul}c [{engine.conformalLower90}, {engine.conformalUpper90}]c
              </span>
            </div>
          </div>

          {/* Dual Powerplant Wing Twin Specifications */}
          <div className="p-4 rounded-2xl bg-[#1F2623] border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[#B8CE82] flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5" />
                Twin-Wing Turbofan Allocation
              </h3>
              <span className="text-[11px] text-[#949C96] font-mono">
                Currently Inspecting: {engine.id} ({engine.wingPosition})
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Left Wing */}
              <div
                className={`p-3.5 rounded-xl border transition-all ${
                  engine.wingPosition === 'ENG-L'
                    ? 'bg-[#B8CE82]/10 border-[#B8CE82]/40 shadow-[0_0_12px_rgba(184,206,130,0.15)]'
                    : 'bg-[#181F1D] border-white/5'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#2C3530] text-[#EAECE9]">
                    LEFT WING (ENG-L)
                  </span>
                  <span className="text-xs font-mono text-[#B8CE82] font-semibold">{leftEngineId}</span>
                </div>
                <div className="space-y-1 text-xs text-[#949C96]">
                  <div className="flex justify-between">
                    <span>Model:</span> <span className="text-[#EAECE9] font-mono">Rolls-Royce Trent 1000-TEN</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Takeoff Thrust:</span> <span className="text-[#EAECE9] font-mono">74,000 lbf (330 kN)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>HPC Efficiency η:</span> <span className="text-[#EAECE9] font-mono">{engine.hpcEfficiencyPct.toFixed(1)}%</span>
                  </div>
                </div>
              </div>

              {/* Right Wing */}
              <div
                className={`p-3.5 rounded-xl border transition-all ${
                  engine.wingPosition === 'ENG-R'
                    ? 'bg-[#B8CE82]/10 border-[#B8CE82]/40 shadow-[0_0_12px_rgba(184,206,130,0.15)]'
                    : 'bg-[#181F1D] border-white/5'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#2C3530] text-[#EAECE9]">
                    RIGHT WING (ENG-R)
                  </span>
                  <span className="text-xs font-mono text-[#B8CE82] font-semibold">{rightEngineId}</span>
                </div>
                <div className="space-y-1 text-xs text-[#949C96]">
                  <div className="flex justify-between">
                    <span>Model:</span> <span className="text-[#EAECE9] font-mono">Rolls-Royce Trent 1000-TEN</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Takeoff Thrust:</span> <span className="text-[#EAECE9] font-mono">74,000 lbf (330 kN)</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Spool Design:</span> <span className="text-[#EAECE9] font-mono">Triple-Spool (LP, IP, HP)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Aircraft Performance & Certification Spec */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-2xl bg-[#1F2623] border border-white/10 space-y-2.5">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[#EAECE9] flex items-center gap-1.5">
                <Gauge className="w-3.5 h-3.5 text-[#B8CE82]" />
                Airframe Specifications (B787-9)
              </h3>
              <div className="space-y-1.5 text-xs text-[#949C96]">
                <div className="flex justify-between border-b border-white/5 pb-1">
                  <span>Max Takeoff Weight (MTOW):</span>
                  <span className="text-[#EAECE9] font-mono">254,000 kg (560,000 lb)</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-1">
                  <span>Max Cruise Speed:</span>
                  <span className="text-[#EAECE9] font-mono">Mach 0.85 (490 kts / 907 km/h)</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-1">
                  <span>Service Ceiling:</span>
                  <span className="text-[#EAECE9] font-mono">FL410 (41,000 ft)</span>
                </div>
                <div className="flex justify-between">
                  <span>Maximum Design Range:</span>
                  <span className="text-[#EAECE9] font-mono">14,140 km (7,635 nmi)</span>
                </div>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#1F2623] border border-white/10 space-y-2.5">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-[#EAECE9] flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#B8CE82]" />
                PHM & Regulatory Compliance
              </h3>
              <div className="space-y-1.5 text-xs text-[#949C96]">
                <div className="flex justify-between border-b border-white/5 pb-1">
                  <span>Software Integrity:</span>
                  <span className="text-[#EAECE9] font-mono">RTCA DO-178C Level B</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-1">
                  <span>Prognostics Methodology:</span>
                  <span className="text-[#EAECE9] font-mono">Mondrian Conformal + EKF Physics</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-1">
                  <span>Rotating Disk Standard:</span>
                  <span className="text-[#EAECE9] font-mono">FAA 14 CFR § 33.70 (LLP 15,000c)</span>
                </div>
                <div className="flex justify-between">
                  <span>Airworthiness Release:</span>
                  <span className="text-[#B8CE82] font-mono">FAA Form 8130-3 Ready</span>
                </div>
              </div>
            </div>
          </div>

          {/* Chief Engineer / Operator Signoff */}
          <div className="p-4 rounded-2xl bg-[#232B27] border border-[#B8CE82]/20 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#B8CE82]/15 border border-[#B8CE82]/30 flex items-center justify-center text-[#B8CE82]">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <span className="text-xs font-bold text-[#EAECE9] block">
                  Lead PHM Chief Engineer · FAA / EASA Powerplant Certified
                </span>
                <span className="text-[11px] text-[#949C96]">
                  Station: Rolls-Royce TotalCare Fleet Operations Center (FOC) · DO-178C Authorized
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                onClose();
                onNavigateToAirworthiness();
              }}
              className="px-4 py-1.5 rounded-full text-xs font-semibold bg-[#B8CE82] text-[#181B19] hover:bg-[#c9dd96] cursor-pointer transition-colors"
            >
              Open Airworthiness Release 8130-3
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

