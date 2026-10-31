/**
 * VISION: Guided 4-Step Judge Presentation Tour Modal
 * Vital Intelligence for System Integrity, Observation & Nostics
 */

import React, { useState } from 'react';
import {
  X,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  ShieldCheck,
  Cpu,
  Layers,
  DollarSign,
  CheckCircle2,
} from 'lucide-react';

export default function DemoTourModal({ isOpen, onClose, onLaunchScenario = null }) {
  const [currentStep, setCurrentStep] = useState(0);

  if (!isOpen) return null;

  const steps = [
    {
      step: 1,
      title: '1. Decision-First Maintenance Architecture',
      subtitle: 'Why predicting bare RUL numbers fails commercial aviation',
      icon: ShieldCheck,
      color: 'text-rose-400 bg-rose-500/10 border-rose-500/30',
      content: (
        <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
          <p>
            Standard PHM projects predict a single deterministic number (e.g. &ldquo;RUL = 18.2 cycles&rdquo;).
            If that prediction has a standard error of &plusmn;12 cycles, an aircraft might experience catastrophic
            in-service failure within 6 cycles.
          </p>
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] space-y-1">
            <div className="font-bold text-rose-300 font-mono">VISION Breakthrough:</div>
            <div>
              We formulate prognostics as an <strong>optimal stopping hazard problem</strong>. Maintenance is
              triggered when the 90% conformal lower bound crosses the logistics lead time (<code className="text-cyan-300">LB90% &le; 15c</code>),
              reducing failure probability from 42% to &le;3.83% with finite-sample guarantees.
            </div>
          </div>
        </div>
      ),
      actionText: 'Inspect 3D Twin',
      scenarioTarget: 1,
    },
    {
      step: 2,
      title: '2. Interactive 3D Digital Twin with Spool Sync',
      subtitle: 'Physical aerospace telemetry mapped in real time',
      icon: Cpu,
      color: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30',
      content: (
        <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
          <p>
            Zero external download dependencies. VISION renders an interactive procedural Three.js turbofan
            jet engine featuring all 6 physical modules: <strong>Fan, LPC, HPC, Combustor, HPT, and LPT</strong>.
          </p>
          <ul className="list-disc list-inside space-y-1 text-slate-400">
            <li>N1 Spool (Fan, LPC, LPT) speed dynamically driven by sensor <code className="text-cyan-300">s8 (Nf)</code>.</li>
            <li>N2 Core Spool (HPC, HPT) speed driven by sensor <code className="text-cyan-300">s9 (Nc)</code>.</li>
            <li>Real-time thermal degradation heatmap driven by <code className="text-cyan-300">T30</code> and <code className="text-cyan-300">T50</code>.</li>
            <li>Axial exploded view and transparent cowling inspection.</li>
          </ul>
        </div>
      ),
      actionText: 'Trigger Imminent Failure Demo',
      scenarioTarget: 2,
    },
    {
      step: 3,
      title: '3. Mondrian Split-Conformal Prediction & Proof',
      subtitle: 'Distribution-free uncertainty calibration across operating regimes',
      icon: Layers,
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
      content: (
        <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
          <p>
            To handle severe heteroscedasticity (larger error when healthy, tighter error near failure),
            VISION implements <strong>Mondrian Conformal Calibration</strong> with 6 discrete condition bins.
          </p>
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] space-y-1">
            <div className="font-bold text-emerald-400 font-mono">Mathematical Safety Certificate:</div>
            <div>
              Provides non-asymptotic coverage: <span className="font-mono text-cyan-300">P(RUL &isin; [LB, UB]) &ge; 90%</span>.
              Clopper-Pearson exact binomial bounds certify risk control even with small finite-sample test sets.
            </div>
          </div>
        </div>
      ),
      actionText: 'View Multi-Regime Demo',
      scenarioTarget: 3,
    },
    {
      step: 4,
      title: '4. Economic Optimization & Hangar Scheduling',
      subtitle: '7.76x reduction in wasted life & $1.4M saved per 100 engines',
      icon: DollarSign,
      color: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
      content: (
        <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
          <p>
            Fixed-interval calendar maintenance prematurely discards an average of <strong>71.8 cycles</strong> of
            healthy engine life. VISION reduces discarded life to <strong>9.25 cycles</strong> (a 7.76x efficiency gain)
            while eliminating unscheduled AOG flight delays.
          </p>
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] space-y-1">
            <div className="font-bold text-amber-400 font-mono">Fleet Impact:</div>
            <div>
              Automated 60-cycle predictive Gantt scheduling allocates engines into 3 hangar bays without
              resource contention or downtime bottlenecks.
            </div>
          </div>
        </div>
      ),
      actionText: 'Explore Economic Sandbox',
      scenarioTarget: 4,
    },
  ];

  const current = steps[currentStep];
  const StepIcon = current.icon;

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleAction = () => {
    if (onLaunchScenario && current.scenarioTarget) {
      onLaunchScenario(current.scenarioTarget);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 animate-fade-in font-sans">
      <div className="relative w-full max-w-xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">
              VISION Presentation Tour &bull; Step {currentStep + 1} of {steps.length}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step Content */}
        <div className="p-6 space-y-4">
          <div className="flex items-start space-x-3.5">
            <div className={`p-2.5 rounded-xl border ${current.color} shrink-0 mt-0.5`}>
              <StepIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white leading-snug">
                {current.title}
              </h3>
              <div className="text-xs text-cyan-400 font-mono mt-0.5">
                {current.subtitle}
              </div>
            </div>
          </div>

          <div className="pt-2">{current.content}</div>

          {/* Step Progress Indicators */}
          <div className="flex items-center justify-center space-x-2 pt-2">
            {steps.map((s, idx) => (
              <button
                key={s.step}
                onClick={() => setCurrentStep(idx)}
                className={`h-1.5 rounded-full transition-all ${
                  currentStep === idx
                    ? 'w-6 bg-cyan-400'
                    : 'w-2 bg-slate-700 hover:bg-slate-500'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Footer Navigation Buttons */}
        <div className="px-5 py-3.5 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <button
            disabled={currentStep === 0}
            onClick={handlePrev}
            className="px-3 py-1.5 rounded-xl bg-slate-800 disabled:opacity-30 hover:bg-slate-700 text-slate-300 text-xs font-mono transition-colors flex items-center space-x-1"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
            <span>Previous</span>
          </button>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleAction}
              className="px-3.5 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-mono font-bold transition-all shadow-md shadow-cyan-600/20"
            >
              {current.actionText}
            </button>

            <button
              onClick={handleNext}
              className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-mono font-medium transition-colors flex items-center space-x-1"
            >
              <span>{currentStep === steps.length - 1 ? 'Finish Tour' : 'Next'}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

