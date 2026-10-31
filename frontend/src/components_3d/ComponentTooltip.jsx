/**
 * VISION: Interactive 3D Component Inspection HUD Overlay
 * Vital Intelligence for System Integrity, Observation & Nostics
 */

import React from 'react';
import {
  X,
  Activity,
  AlertCircle,
  Gauge,
  Thermometer,
  Layers,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';
import {
  COMPONENT_MAP,
  computeComponentHealth,
  getComponentStatusBadge,
} from '../utils/componentSensorMap.js';

export default function ComponentTooltip({
  selectedComponent,
  onClose,
  latestSensors = {},
  onSelectComponent,
}) {
  if (!selectedComponent) return null;

  const config = COMPONENT_MAP[selectedComponent];
  if (!config) return null;

  const health = computeComponentHealth(selectedComponent, latestSensors);
  const badge = getComponentStatusBadge(health);

  const componentList = ['fan', 'lpc', 'hpc', 'combustor', 'hpt', 'lpt'];

  return (
    <div className="absolute top-4 left-4 z-20 w-84 md:w-96 bg-slate-900/90 backdrop-blur-xl border border-slate-700/70 rounded-2xl shadow-2xl p-4 text-slate-100 animate-fade-in font-sans">
      {/* Header with Title and Close Button */}
      <div className="flex items-start justify-between pb-2 border-b border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-400">
              {config.spool}
            </span>
            <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded font-mono">
              {config.station}
            </span>
          </div>
          <h3 className="text-base font-bold text-white mt-0.5 leading-snug">
            {config.name}
          </h3>
        </div>
        <button
          onClick={onClose}
          className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800/80 transition-colors"
          title="Deselect Component"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Subsystem Health Bar & Physical Status */}
      <div className="mt-3 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="text-slate-300 font-medium flex items-center space-x-1.5">
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
            <span>Subsystem Health</span>
          </span>
          <span className={`font-mono font-bold ${badge.textColor}`}>
            {health.toFixed(1)}%
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-500 rounded-full ${
              health >= 80
                ? 'bg-emerald-500'
                : health >= 50
                ? 'bg-amber-500'
                : 'bg-rose-500 animate-pulse'
            }`}
            style={{ width: `${Math.min(100, Math.max(5, health))}%` }}
          />
        </div>

        {/* Operational Status Badge */}
        <div className={`mt-2 flex items-center space-x-1.5 px-2 py-1 rounded-lg text-[11px] font-medium border ${badge.bgColor} ${badge.borderColor} ${badge.textColor}`}>
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span className="truncate">{badge.label}</span>
        </div>
      </div>

      {/* Real-Time Associated Sensor Telemetry */}
      <div className="mt-3">
        <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider font-mono mb-1.5 flex items-center justify-between">
          <span>Active Sensor Telemetry</span>
          <span className="text-[10px] text-slate-500 lowercase">live readings</span>
        </div>

        <div className="grid grid-cols-2 gap-1.5">
          {config.sensors.map((s) => {
            const rawVal = latestSensors[s.key] !== undefined ? latestSensors[s.key] : latestSensors[s.code];
            const hasVal = rawVal !== undefined;
            const displayVal = hasVal ? Number(rawVal).toFixed(1) : s.nominal.toFixed(1);
            const isAbnormal = hasVal && s.normalRange && (rawVal < s.normalRange[0] || rawVal > s.normalRange[1]);

            return (
              <div
                key={s.key}
                className={`p-2 rounded-lg border transition-colors ${
                  isAbnormal
                    ? 'bg-rose-950/40 border-rose-600/40 text-rose-200'
                    : 'bg-slate-800/60 border-slate-700/50 text-slate-200'
                }`}
              >
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span className="font-mono font-bold text-cyan-300">{s.code}</span>
                  <span className="text-[10px] text-slate-500">{s.unit}</span>
                </div>
                <div className="text-sm font-bold font-mono text-white mt-0.5">
                  {displayVal}
                </div>
                <div className="text-[9px] text-slate-400 truncate mt-0.5" title={s.label}>
                  {s.label}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Degradation Mode / Maintenance Physics Note */}
      <div className="mt-3 p-2 bg-slate-950/50 rounded-xl border border-slate-800/60 text-[11px] text-slate-300">
        <div className="text-[10px] font-bold text-slate-400 font-mono uppercase mb-0.5">
          Degradation Physics:
        </div>
        <p className="text-[11px] leading-relaxed text-slate-400">
          {config.failureModes.join(' • ')}
        </p>
      </div>

      {/* Quick Jump Component Switcher */}
      <div className="mt-3 pt-2 border-t border-slate-800 flex items-center justify-between">
        <span className="text-[10px] text-slate-500 font-mono uppercase">Quick Select:</span>
        <div className="flex space-x-1">
          {componentList.map((id) => (
            <button
              key={id}
              onClick={() => onSelectComponent && onSelectComponent(id)}
              className={`px-1.5 py-0.5 rounded text-[10px] font-mono uppercase transition-colors ${
                selectedComponent === id
                  ? 'bg-cyan-500 text-slate-950 font-bold'
                  : 'bg-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-700'
              }`}
            >
              {id}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

