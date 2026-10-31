/**
 * VISION: Non-Sensor Diagnostic Inspection Dossier
 * Vital Intelligence for System Integrity, Observation & Nostics
 *
 * Integrates:
 * - Structural Life-Limited Parts (LLP) Regulatory Hard Cycle Clock
 * - Laboratory Lube Oil Spectrometry (Fe, Ti, Ag, Si wear metals)
 * - Optical Borescope AI Structural Inspection Findings
 */

import React, { useState, useEffect } from 'react';
import {
  FileText,
  Clock,
  Droplet,
  Eye,
  ShieldCheck,
  AlertTriangle,
  Award,
  Layers,
  Sparkles,
} from 'lucide-react';
import { api } from '../services/api.js';
import { getOfflinePhysicalDossier } from '../services/apiFallback.js';

export default function PhysicalDossierCard({
  unitId = 1,
  subset = 'FD001',
  predictedRul = 25,
  currentCycle = 140,
  className = '',
}) {
  const [dossier, setDossier] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function fetchDossier() {
      setLoading(true);
      try {
        const data = await api.getPhysicalDossier(unitId, subset);
        if (isMounted) setDossier(data);
      } catch (err) {
        // Graceful offline fallback
        const fallback = getOfflinePhysicalDossier(unitId);
        if (isMounted) setDossier(fallback);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    fetchDossier();
    return () => {
      isMounted = false;
    };
  }, [unitId, subset]);

  if (loading || !dossier) {
    return (
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-6 text-center text-slate-400 font-mono text-xs">
        <Sparkles className="w-5 h-5 mx-auto mb-2 animate-spin text-cyan-400" />
        <span>Loading Structural Inspection Dossier for Engine #{unitId}...</span>
      </div>
    );
  }

  const llp = dossier.llp_regulatory_clock;
  const oil = dossier.oil_spectrometry;
  const borescope = dossier.borescope_inspection;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* 1. Life-Limited Parts (LLP) Hard Regulatory Clock */}
      <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-2xl p-4 shadow-xl">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4 text-amber-400" />
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-white">
              Life-Limited Parts (LLP) Hard Regulatory Clock
            </h3>
          </div>
          <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] font-mono text-slate-300 border border-slate-700">
            FAA 14 CFR Part 33.70
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 font-mono text-xs mb-3">
          <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800/80">
            <span className="text-[10px] text-slate-500 uppercase block">Component</span>
            <span className="font-bold text-slate-200">{llp.component}</span>
            <span className="text-[10px] text-slate-400 block mt-1">Single-Crystal Superalloy</span>
          </div>

          <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800/80">
            <span className="text-[10px] text-slate-500 uppercase block">Regulatory Hard Limit</span>
            <div className="flex items-baseline space-x-1.5 mt-0.5">
              <span className="text-base font-bold text-white">{llp.accumulated_cycles.toLocaleString()}</span>
              <span className="text-slate-500">/</span>
              <span className="text-slate-400 text-xs">{llp.hard_limit_cycles.toLocaleString()} cyc</span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-2">
              <div
                className="bg-amber-400 h-full rounded-full"
                style={{ width: `${Math.min(100, (llp.accumulated_cycles / llp.hard_limit_cycles) * 100)}%` }}
              />
            </div>
          </div>

          <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800/80">
            <span className="text-[10px] text-slate-500 uppercase block">Dual-Constraint Pull Cycle</span>
            <div className="flex items-baseline space-x-1 mt-0.5">
              <span className="text-lg font-bold text-cyan-300">{llp.dual_constraint_pull_cycle}</span>
              <span className="text-slate-400 text-xs">cycles remaining</span>
            </div>
            <span className="text-[10px] text-cyan-400/90 font-medium block mt-1">
              Governed by: {llp.governing_pull_constraint}
            </span>
          </div>
        </div>

        <div className="p-2.5 bg-slate-950/50 rounded-xl border border-slate-800 text-[11px] text-slate-400 font-sans flex items-start space-x-2">
          <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <span>
            <strong>Airworthiness Dual-Constraint Rule:</strong> Overhaul is triggered at{' '}
            <code className="text-cyan-300 font-mono">min(RUL Conformal Lower Bound, LLP Hard Limit)</code>. Even if sensors appear healthy, regulatory disc retirement is absolute.
          </span>
        </div>
      </div>

      {/* 2. Laboratory Lube Oil Spectrometry (Wear Metals) */}
      <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-2xl p-4 shadow-xl">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
          <div className="flex items-center space-x-2">
            <Droplet className="w-4 h-4 text-rose-400" />
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-white">
              Laboratory Lube Oil Spectrometry (Wear Metals ppm)
            </h3>
          </div>
          <span
            className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${
              oil.sample_status === 'CRITICAL'
                ? 'bg-rose-950 text-rose-300 border-rose-500/50'
                : oil.sample_status === 'ADVISORY'
                ? 'bg-amber-950 text-amber-300 border-amber-500/50'
                : 'bg-emerald-950 text-emerald-300 border-emerald-500/50'
            }`}
          >
            Sample: {oil.sample_status}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs mb-2">
          {/* Iron */}
          <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800/80">
            <div className="flex items-center justify-between text-[10px] text-slate-400">
              <span>Iron (Fe)</span>
              <span>&lt; {oil.iron_fe_threshold} ppm</span>
            </div>
            <div className="text-base font-bold text-white mt-1">
              {oil.iron_fe_ppm} <span className="text-[10px] text-slate-500 font-normal">ppm</span>
            </div>
            <span className="text-[9px] text-slate-500 block">Shaft & Gear Bearing Wear</span>
          </div>

          {/* Titanium */}
          <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800/80">
            <div className="flex items-center justify-between text-[10px] text-slate-400">
              <span>Titanium (Ti)</span>
              <span>&lt; {oil.titanium_ti_threshold} ppm</span>
            </div>
            <div className="text-base font-bold text-white mt-1">
              {oil.titanium_ti_ppm} <span className="text-[10px] text-slate-500 font-normal">ppm</span>
            </div>
            <span className="text-[9px] text-slate-500 block">Compressor Blade Rub</span>
          </div>

          {/* Silver */}
          <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800/80">
            <div className="flex items-center justify-between text-[10px] text-slate-400">
              <span>Silver (Ag)</span>
              <span>&lt; {oil.silver_ag_threshold} ppm</span>
            </div>
            <div className={`text-base font-bold mt-1 ${oil.silver_ag_ppm > 1.4 ? 'text-amber-400' : 'text-white'}`}>
              {oil.silver_ag_ppm} <span className="text-[10px] text-slate-500 font-normal">ppm</span>
            </div>
            <span className="text-[9px] text-slate-500 block">Bearing Cage Plating</span>
          </div>

          {/* Silicon */}
          <div className="p-3 bg-slate-950/70 rounded-xl border border-slate-800/80">
            <div className="flex items-center justify-between text-[10px] text-slate-400">
              <span>Silicon (Si)</span>
              <span>&lt; {oil.silicon_si_threshold} ppm</span>
            </div>
            <div className="text-base font-bold text-white mt-1">
              {oil.silicon_si_ppm} <span className="text-[10px] text-slate-500 font-normal">ppm</span>
            </div>
            <span className="text-[9px] text-slate-500 block">Atmospheric Sand/Dust</span>
          </div>
        </div>
      </div>

      {/* 3. Borescope Optical AI Inspection */}
      <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-2xl p-4 shadow-xl">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
          <div className="flex items-center space-x-2">
            <Eye className="w-4 h-4 text-cyan-400" />
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-white">
              Borescope Optical AI Inspection Findings
            </h3>
          </div>
          <span className="px-2 py-0.5 rounded bg-slate-800 text-[10px] font-mono text-slate-300 border border-slate-700">
            Last Inspected: Cycle {borescope.last_inspection_cycle}
          </span>
        </div>

        <div className="space-y-2.5">
          {borescope.findings.map((item, idx) => (
            <div
              key={idx}
              className="p-3 bg-slate-950/70 rounded-xl border border-slate-800/80 flex items-start justify-between gap-3 text-xs"
            >
              <div className="space-y-1">
                <div className="flex items-center space-x-2">
                  <span className="font-bold text-slate-200">{item.subsystem}</span>
                  <span className="text-[10px] text-slate-500 font-mono">({item.inspection_type})</span>
                </div>
                <p className="text-slate-400 text-[11px] leading-relaxed font-sans">{item.findings}</p>
              </div>

              <span
                className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold shrink-0 border ${
                  item.severity === 'CRITICAL'
                    ? 'bg-rose-950 text-rose-300 border-rose-500/50'
                    : item.severity === 'ADVISORY'
                    ? 'bg-amber-950 text-amber-300 border-amber-500/50'
                    : 'bg-emerald-950 text-emerald-300 border-emerald-500/50'
                }`}
              >
                {item.severity}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

