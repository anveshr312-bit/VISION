import React, { useMemo, useState } from 'react';
import {
  FileCheck2,
  Printer,
  AlertTriangle,
  X,
  CheckCircle2,
  ArrowUpRight,
} from 'lucide-react';
import {
  EngineTelemetry,
  evaluateDualConstraintAirworthiness,
} from '../services/prognosticsEngine';
import {
  DoubleRingGaugeLight,
  SmoothBezierTrendChart,
} from './TelemetryWidgets';

interface AirworthinessDossierScreenProps {
  engine: EngineTelemetry;
  onWaterWash: () => void;
}

export const AirworthinessDossierScreen: React.FC<AirworthinessDossierScreenProps> = ({
  engine,
  onWaterWash,
}) => {
  const [certificateModalOpen, setCertificateModalOpen] = useState<boolean>(false);
  const [printConfirmNotice, setPrintConfirmNotice] = useState<boolean>(false);

  const evaluation = useMemo(
    () => evaluateDualConstraintAirworthiness(engine),
    [engine]
  );

  const llpUsedFraction = engine.llpAccumulatedCycles / engine.llpLimitCycles;

  const soapSpecs = [
    {
      element: 'Iron (Fe) — Gearbox & Bearing Race',
      symbol: 'Fe',
      ppm: engine.soapOilPpm.fe,
      limit: 18.0,
    },
    {
      element: 'Titanium (Ti) — HPC Blade Tip Rub',
      symbol: 'Ti',
      ppm: engine.soapOilPpm.ti,
      limit: 8.5,
    },
    {
      element: 'Silver (Ag) — Shaft Bearing Cage',
      symbol: 'Ag',
      ppm: engine.soapOilPpm.ag,
      limit: 1.2,
    },
    {
      element: 'Silicon (Si) — Airborne Dust Seals',
      symbol: 'Si',
      ppm: engine.soapOilPpm.si,
      limit: 12.0,
    },
  ];

  const handleTriggerPrint = () => {
    setPrintConfirmNotice(true);
    try {
      window.print();
    } catch {
      // Fallback handled by printConfirmNotice banner
    }
  };

  return (
    <div className="max-w-[1440px] mx-auto px-6 py-5 space-y-5 text-[#E7ECE7]">
      {/* Top Row: 3 Glassmorphic Cards (LLP Overview | SOAP Ruler Bars | Performance Trends Spline) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
        {/* Card 1: FAA 14 CFR § 33.70 LLP Clock & Overview */}
        <div className="lg:col-span-4 backdrop-blur-2xl bg-[#1C2926]/90 border border-[#46564D] rounded-3xl p-5 shadow-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-[#E7ECE7]">
                LLP &amp; Dual-Constraint Overview
              </h2>
              <p className="text-[10px] font-mono uppercase tracking-wider text-[#A6B4AA] mt-0.5">
                FAA 14 CFR § 33.70 · HPT Stage 1 Rotor Disk
              </p>
            </div>
            <ArrowUpRight className="w-4 h-4 text-[#B3C58B]" />
          </div>

          <div className="my-3">
            <DoubleRingGaugeLight
              value={`${evaluation.effectiveDispatchLimitCycles.toFixed(1)}`}
              unit="safe cycles"
              fraction={llpUsedFraction}
              leftTopLabel="Conformal RUL (90% Lower)"
              leftTopVal={`${evaluation.conformalRul90Lower.toFixed(1)} c`}
              leftBottomLabel="15,000c LLP Scrap Remaining"
              leftBottomVal={`${evaluation.llpCyclesRemaining} c`}
            />
          </div>

          <div className="pt-3 border-t border-[#46564D] flex items-center justify-between text-xs">
            <span className="text-[10px] uppercase tracking-wider text-[#A6B4AA]">
              Accumulated:{' '}
              <strong className="font-mono text-[#E7ECE7] tabular-nums">
                {engine.llpAccumulatedCycles.toLocaleString()} / 15,000c
              </strong>
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-[#82A995]/20 border border-[#82A995]/60 text-[#82A995] text-[10px] font-mono font-bold uppercase tracking-wider">
              Risk ≤ {evaluation.clopperPearsonRiskPct}%
            </span>
          </div>
        </div>

        {/* Card 2: SOAP Spectrometric Oil Analysis with Ruler Ticks */}
        <div className="lg:col-span-4 backdrop-blur-2xl bg-[#1C2926]/90 border border-[#46564D] rounded-3xl p-5 shadow-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-[#E7ECE7]">
                SOAP Oil Spectrometry (ppm)
              </h2>
              <p className="text-[10px] font-mono uppercase tracking-wider text-[#A6B4AA] mt-0.5">
                Wear metal concentration vs alert limits
              </p>
            </div>
            <ArrowUpRight className="w-4 h-4 text-[#B3C58B]" />
          </div>

          <div className="space-y-3">
            {soapSpecs.map((item) => {
              const pct = Math.min(100, (item.ppm / item.limit) * 100);
              const isHigh = pct >= 75;
              return (
                <div key={item.symbol} className="space-y-1">
                  <div className="relative h-2.5 bg-[#111A19] rounded-sm overflow-visible">
                    <div
                      className="h-full rounded-sm transition-all"
                      style={{
                        width: `${pct}%`,
                        background: isHigh
                          ? 'linear-gradient(90deg, #D8B65E 0%, #D97865 100%)'
                          : 'linear-gradient(90deg, #82A995 0%, #B3C58B 100%)',
                      }}
                    />
                    <span
                      className="absolute -top-0.5 bottom-0 w-0.5 bg-[#E7ECE7]"
                      style={{ left: `${pct}%` }}
                    />
                    {isHigh && (
                      <span
                        style={{ left: `${Math.min(90, pct)}%` }}
                        className="absolute -top-4 -translate-x-1/2 bg-[#D97865] text-[#111A19] rounded px-1 py-0.2 text-[9px] font-mono font-bold shadow-xs"
                      >
                        ⚠
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-[10px] pt-0.5">
                    <span className="uppercase tracking-wider text-[#A6B4AA]">{item.element}</span>
                    <span className="font-mono font-bold text-[#E7ECE7] tabular-nums">
                      {item.ppm.toFixed(item.symbol === 'Ag' ? 2 : 1)} / {item.limit.toFixed(1)} ppm
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Card 3: Performance Trends Smooth Dual-Spline */}
        <div className="lg:col-span-4 backdrop-blur-2xl bg-[#1C2926]/90 border border-[#46564D] rounded-3xl p-5 shadow-2xl flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-[#E7ECE7]">
                Performance trends
              </h2>
              <p className="text-[10px] font-mono uppercase tracking-wider text-[#A6B4AA] mt-0.5">
                Conformal RUL trajectory vs T30 creep
              </p>
            </div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#82A995]">
              ● Normal access
            </span>
          </div>

          <div className="my-2">
            <SmoothBezierTrendChart
              trajectory={engine.trajectory}
              sensorFaultActive={engine.sensorFaultActive}
            />
          </div>

          <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#46564D]">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#A6B4AA] truncate">
              ID: <strong className="text-[#B3C58B]">{evaluation.trackingId}</strong>
            </span>
            <button
              type="button"
              onClick={() => {
                setPrintConfirmNotice(false);
                setCertificateModalOpen(true);
              }}
              className="px-3 py-1.5 rounded-xl bg-[#293834] hover:bg-[#293834]/80 border border-[#46564D] text-[#E7ECE7] text-[10px] font-mono uppercase tracking-wider font-semibold flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
            >
              <FileCheck2 className="w-3.5 h-3.5 shrink-0 text-[#B3C58B]" />
              <span>Form 8130-3</span>
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Section: Risk Warning & Optical Borescope Inspection Table */}
      <div className="backdrop-blur-2xl bg-[#1C2926]/90 border border-[#46564D] rounded-3xl p-6 shadow-2xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-[#E7ECE7]">
              Risk warning &amp; Optical Borescope Inspection Log
            </h2>
            <p className="text-[10px] font-mono uppercase tracking-wider text-[#A6B4AA] mt-0.5">
              {engine.id} · Aircraft Tail {engine.tailId} ({engine.wingPosition}) · {evaluation.regulatoryCitation}
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            {!engine.waterWashApplied && (
              <button
                type="button"
                onClick={onWaterWash}
                className="px-3.5 py-2 rounded-xl bg-[#B3C58B] hover:bg-[#B3C58B]/90 text-[#111A19] text-[11px] font-mono font-bold uppercase tracking-wider cursor-pointer shadow-md"
              >
                Execute AMM 72-00-00 Water Wash Descale
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                setPrintConfirmNotice(false);
                setCertificateModalOpen(true);
              }}
              className="px-4 py-2 rounded-xl bg-[#82A995] hover:bg-[#82A995]/90 text-[#111A19] text-[11px] font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <FileCheck2 className="w-4 h-4" />
              <span>Generate FAA Form 8130-3 Release Certificate</span>
            </button>
          </div>
        </div>

        {/* Critical Warning Banner */}
        <div className="bg-[#D97865]/15 border border-[#D97865]/55 rounded-2xl p-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#D97865] text-[#111A19] flex items-center justify-center shrink-0">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-mono font-bold uppercase tracking-wider text-[#D97865]">
                {evaluation.verdictLabel}
              </div>
              <div className="text-xs font-mono text-[#E7ECE7] mt-0.5">
                Dual-Constraint Rule: min(Conformal RUL_90% = {evaluation.conformalRul90Lower.toFixed(1)}c, LLP Remaining = {evaluation.llpCyclesRemaining}c) → Effective Safe Window: {evaluation.effectiveDispatchLimitCycles.toFixed(1)} cycles.
              </div>
            </div>
          </div>
          <ArrowUpRight className="w-4 h-4 text-[#D97865] shrink-0" />
        </div>

        {/* Clean Structured Table */}
        <div className="bg-[#182321] rounded-2xl border border-[#46564D] overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#46564D] text-[10px] font-mono uppercase tracking-wider text-[#A6B4AA]">
                <th className="py-3 px-4">Stage</th>
                <th className="py-3 px-4">AMM Reference</th>
                <th className="py-3 px-4">Optical Borescope Report Text</th>
                <th className="py-3 px-4">Dimensional Metric</th>
                <th className="py-3 px-4">Recommended Maintenance Action</th>
                <th className="py-3 px-4 text-right">Severity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#46564D]/50 text-xs">
              {engine.borescopeFindings.map((finding, idx) => (
                <tr key={finding.id} className="hover:bg-[#293834]/60">
                  <td className="py-3.5 px-4 font-mono font-bold text-[#E7ECE7]">
                    0{idx + 1} · {finding.stageLabel}
                  </td>
                  <td className="py-3.5 px-4 font-mono text-[#B3C58B] tabular-nums">
                    {finding.ammReference}
                  </td>
                  <td className="py-3.5 px-4 text-[#A6B4AA]">{finding.finding}</td>
                  <td className="py-3.5 px-4 font-mono font-semibold text-[#E7ECE7] tabular-nums">
                    {finding.dimensionalMetric}
                  </td>
                  <td className="py-3.5 px-4 text-[#A6B4AA]">{finding.recommendedAction}</td>
                  <td className="py-3.5 px-4 text-right">
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider ${
                        finding.severity === 'CRITICAL'
                          ? 'bg-[#D97865] text-[#111A19]'
                          : finding.severity === 'WARNING'
                            ? 'bg-[#D8B65E] text-[#111A19]'
                            : 'bg-[#82A995]/20 border border-[#82A995]/60 text-[#82A995]'
                      }`}
                    >
                      {finding.severity}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: Official FAA Form 8130-3 / EASA Form 1 Authorized Release Certificate */}
      {certificateModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="faa-8130-modal-title"
          className="fixed inset-0 z-50 bg-[#111A19]/80 flex items-center justify-center p-4 overflow-y-auto"
        >
          <div className="backdrop-blur-2xl bg-[#1C2926]/95 border border-[#46564D] rounded-3xl max-w-3xl w-full p-6 shadow-2xl space-y-5 text-[#E7ECE7]">
            <div className="flex items-start justify-between gap-4 border-b border-[#46564D] pb-4">
              <div>
                <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#82A995]">
                  AUTHORIZED RELEASE CERTIFICATE · FAA FORM 8130-3 / EASA FORM 1
                </div>
                <h3
                  id="faa-8130-modal-title"
                  className="text-base font-mono font-bold uppercase tracking-wider text-[#E7ECE7] mt-1"
                >
                  Airworthiness Approval Tag — Rolls-Royce Trent 1000 Turbofan
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setCertificateModalOpen(false)}
                aria-label="Close Certificate Modal"
                className="p-1.5 rounded-xl bg-[#293834] hover:bg-[#293834]/80 text-[#E7ECE7] border border-[#46564D] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {printConfirmNotice && (
              <div className="bg-[#82A995]/20 border border-[#82A995]/60 text-[#E7ECE7] px-4 py-2.5 rounded-2xl text-xs font-mono flex items-center justify-between">
                <span>
                  Official FAA Form 8130-3 formatted for print output (Tracking ID: {evaluation.trackingId}).
                </span>
                <CheckCircle2 className="w-4 h-4 text-[#82A995] shrink-0" />
              </div>
            )}

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-[#182321] p-4 rounded-2xl border border-[#46564D]">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-[#A6B4AA] block">
                  1. Approving Authority
                </span>
                <span className="font-mono font-bold text-[#E7ECE7]">FAA / EASA PART-145</span>
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-wider text-[#A6B4AA] block">
                  3. Form Tracking Number
                </span>
                <span className="font-mono font-bold text-[#B3C58B] tabular-nums">
                  {evaluation.trackingId}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-wider text-[#A6B4AA] block">
                  4. Aircraft Tail / Wing
                </span>
                <span className="font-mono font-bold text-[#E7ECE7] tabular-nums">
                  {engine.tailId} ({engine.wingPosition})
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-wider text-[#A6B4AA] block">
                  5. Engine Serial No.
                </span>
                <span className="font-mono font-bold text-[#E7ECE7] tabular-nums">{engine.id}</span>
              </div>
            </div>

            <div className="bg-[#182321] p-4 rounded-2xl border border-[#46564D] space-y-3 text-xs">
              <div className="text-[10px] font-mono uppercase tracking-wider text-[#A6B4AA]">
                12. Remarks &amp; DO-178C Conformal Prognostics Airworthiness Verification
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-[#293834] border border-[#46564D]">
                  <span className="text-[10px] uppercase tracking-wider text-[#A6B4AA] block">
                    Conformal RUL (90% CI)
                  </span>
                  <span className="text-sm font-mono font-bold text-[#B3C58B] tabular-nums">
                    {evaluation.conformalRul90Lower.toFixed(1)} cycles
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-[#293834] border border-[#46564D]">
                  <span className="text-[10px] uppercase tracking-wider text-[#A6B4AA] block">
                    14 CFR § 33.70 LLP Clock
                  </span>
                  <span className="text-sm font-mono font-bold text-[#E7ECE7] tabular-nums">
                    {evaluation.llpCyclesRemaining}c rem (of 15,000c)
                  </span>
                </div>
                <div className="p-3 rounded-xl bg-[#293834] border border-[#46564D]">
                  <span className="text-[10px] uppercase tracking-wider text-[#A6B4AA] block">
                    Clopper-Pearson Risk
                  </span>
                  <span className="text-sm font-mono font-bold text-[#82A995] tabular-nums">
                    ≤ {evaluation.clopperPearsonRiskPct}% (Exact Bound)
                  </span>
                </div>
              </div>
              <p className="text-[#A6B4AA] leading-relaxed">
                Certifies that the turbofan assembly identified above was inspected in accordance with{' '}
                {evaluation.regulatoryCitation} and DO-178C Level-A air-gapped conformal prognostics.
                Effective Dual-Constraint Dispatch Window:{' '}
                <strong className="font-mono text-[#B3C58B] tabular-nums">
                  {evaluation.effectiveDispatchLimitCycles.toFixed(1)} flight cycles
                </strong>
                .
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-[#46564D] text-xs">
              <div>
                <span className="text-[10px] uppercase tracking-wider text-[#A6B4AA] block">
                  14a. Authorized Digital Signature &amp; Stamp
                </span>
                <span className="font-mono text-[#82A995] font-bold">
                  SIGNED: CHIEF AIRWORTHINESS INSPECTOR #FAA-DER-88412 · SHA256-9F8A2C
                </span>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={handleTriggerPrint}
                  className="px-4 py-2 rounded-xl bg-[#B3C58B] hover:bg-[#B3C58B]/90 text-[#111A19] font-mono font-bold uppercase tracking-wider text-[11px] flex items-center gap-2 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Official 8130-3 Certificate</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCertificateModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-[#293834] hover:bg-[#293834]/80 text-[#E7ECE7] border border-[#46564D] font-mono uppercase tracking-wider text-[11px] cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
