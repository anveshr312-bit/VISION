/**
 * VISION: Telemetry Mode Toggle Component
 * Vital Intelligence for System Integrity, Observation & Nostics
 *
 * Provides a prominent toggle between:
 * - Certified Empirical C-MAPSS Mode (Emerald)
 * - Demonstration & Subsystem Simulation Mode (Amber)
 */

import React from 'react';
import { ShieldCheck, Sparkles, HelpCircle } from 'lucide-react';
import { TELEMETRY_MODES } from '../utils/telemetryModes.js';

export default function ModeToggle({
  currentMode,
  onModeChange,
  onOpenIntegrityCard,
  className = '',
}) {
  const isEmpirical = currentMode.id === TELEMETRY_MODES.EMPIRICAL.id;

  const handleToggle = () => {
    const nextMode = isEmpirical
      ? TELEMETRY_MODES.DEMO_SIMULATION
      : TELEMETRY_MODES.EMPIRICAL;
    onModeChange(nextMode);
  };

  return (
    <div className={`flex items-center space-x-2 ${className}`}>
      {/* Mode Switcher Pill */}
      <div className="flex items-center bg-slate-950/80 p-1 rounded-xl border border-slate-800 shadow-inner">
        {/* Empirical Mode Option */}
        <button
          onClick={() => onModeChange(TELEMETRY_MODES.EMPIRICAL)}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all ${
            isEmpirical
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
          title="Switch to authentic NASA C-MAPSS empirical dataset"
        >
          <ShieldCheck className={`w-3.5 h-3.5 ${isEmpirical ? 'text-emerald-400' : 'text-slate-500'}`} />
          <span>EMPIRICAL</span>
        </button>

        {/* Demo Simulation Option */}
        <button
          onClick={() => onModeChange(TELEMETRY_MODES.DEMO_SIMULATION)}
          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-all ${
            !isEmpirical
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
          title="Switch to synthetic component-level demonstration mode"
        >
          <Sparkles className={`w-3.5 h-3.5 ${!isEmpirical ? 'text-amber-400' : 'text-slate-500'}`} />
          <span>DEMO SIM</span>
        </button>
      </div>

      {/* Info / Integrity Explainer Icon */}
      {onOpenIntegrityCard && (
        <button
          onClick={onOpenIntegrityCard}
          className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-slate-800/80 border border-slate-800 transition-colors"
          title="Read Scientific Integrity & Dataset Demarcation Note"
        >
          <HelpCircle className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

