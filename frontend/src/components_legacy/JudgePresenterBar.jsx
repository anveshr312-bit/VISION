/**
 * VISION: Floating Judge & Presentation Bar
 * Vital Intelligence for System Integrity, Observation & Nostics
 *
 * Fast 1-click & keyboard shortcut switching for the 4 presentation scenarios:
 * Press '1' -> Nominal Baseline (Unit #10)
 * Press '2' -> Imminent HPC Failure (Unit #34)
 * Press '3' -> Multi-Regime Challenge (FD002 Unit #18)
 * Press '4' -> Economic Policy Sandbox ($1.4M Saved)
 */

import React, { useEffect } from 'react';
import { Sparkles, HelpCircle, RotateCcw, Zap } from 'lucide-react';
import { DEMO_PRESETS } from '../utils/demoPresets.js';

export default function JudgePresenterBar({
  activeScenario = null,
  onSelectScenario = null,
  onResetDemo = null,
  onOpenIntegrityCard = null,
  className = '',
}) {
  // Global Hotkey Listener: keys 1, 2, 3, 4
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ignore if user is typing in an input or select
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes(e.target?.tagName)) {
        return;
      }

      const match = DEMO_PRESETS.find((p) => p.key === e.key);
      if (match && onSelectScenario) {
        e.preventDefault();
        onSelectScenario(match);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onSelectScenario]);

  return (
    <div className={`fixed bottom-4 left-1/2 transform -translate-x-1/2 z-40 bg-slate-950/90 backdrop-blur-xl border border-slate-700/80 rounded-2xl px-3 py-2 shadow-2xl flex items-center space-x-2 font-mono text-xs select-none ${className}`}>
      {/* Label */}
      <div className="flex items-center space-x-1.5 px-2 text-cyan-400 font-bold hidden sm:flex">
        <Sparkles className="w-3.5 h-3.5" />
        <span className="text-[11px] uppercase tracking-wider">Demo Presets:</span>
      </div>

      {/* 4 Scenario Buttons */}
      <div className="flex items-center space-x-1">
        {DEMO_PRESETS.map((preset) => {
          const isActive = activeScenario?.id === preset.id;

          return (
            <button
              key={preset.id}
              onClick={() => onSelectScenario && onSelectScenario(preset)}
              className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl transition-all ${
                isActive
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400 font-bold shadow-md'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
              }`}
              title={`${preset.title} (Press key ${preset.key})`}
            >
              <span className="w-4 h-4 rounded bg-slate-800 flex items-center justify-center text-[10px] text-cyan-400 border border-slate-700">
                {preset.key}
              </span>
              <span className="text-[11px] truncate max-w-[120px] sm:max-w-none">
                {preset.shortLabel}
              </span>
            </button>
          );
        })}
      </div>

      {/* Reset Demo Button */}
      {onResetDemo && (
        <button
          onClick={onResetDemo}
          className="p-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-colors"
          title="Reset to default fleet view"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      )}

      {/* Integrity Card Quick Open */}
      {onOpenIntegrityCard && (
        <button
          onClick={onOpenIntegrityCard}
          className="flex items-center space-x-1 px-2 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-emerald-400 border border-slate-800 text-[11px] transition-colors"
          title="View Scientific Integrity Disclosure"
        >
          <HelpCircle className="w-3.5 h-3.5" />
          <span className="hidden md:inline">Integrity</span>
        </button>
      )}
    </div>
  );
}

