/**
 * VISION: Dynamic Thermal Heatmap & Degradation Glow Component
 * Vital Intelligence for System Integrity, Observation & Nostics
 *
 * Thermal Color Ramp:
 * -------------------
 * - NORMAL (Health >= 80%): Cool metallic / emerald operational envelope
 * - ELEVATED (50% <= Health < 80%): Amber/orange thermal creep (#f59e0b)
 * - CRITICAL (Health < 50%): Pulsing infrared/red thermal runaway (#ef4444)
 */

import React from 'react';
import { Flame, AlertTriangle, ShieldCheck, Thermometer } from 'lucide-react';
import { COMPONENT_MAP, computeComponentHealth, getComponentStatusBadge } from '../utils/componentSensorMap.js';

export function getThermalGlowState(componentId, latestSensors = {}) {
  const health = computeComponentHealth(componentId, latestSensors);
  const badge = getComponentStatusBadge(health);

  // Compute thermal temperature indicator if available
  let tempReading = null;
  if (componentId === 'hpc' && latestSensors.s3) {
    tempReading = { name: 'T30', val: latestSensors.s3, unit: '°R', alert: latestSensors.s3 > 1600.0 };
  } else if (componentId === 'lpc' && latestSensors.s2) {
    tempReading = { name: 'T24', val: latestSensors.s2, unit: '°R', alert: latestSensors.s2 > 644.0 };
  } else if (componentId === 'lpt' && latestSensors.s4) {
    tempReading = { name: 'T50 (EGT)', val: latestSensors.s4, unit: '°R', alert: latestSensors.s4 > 1415.0 };
  }

  return {
    health,
    badge,
    tempReading,
  };
}

export default function ComponentGlowLegend({ activeMode, onToggleMode }) {
  return (
    <div className="flex items-center space-x-2 bg-slate-900/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-700/60 shadow-md text-xs font-mono">
      <div className="flex items-center space-x-1.5 mr-2">
        <Thermometer className="w-3.5 h-3.5 text-cyan-400" />
        <span className="text-[11px] text-slate-300 font-semibold uppercase">Thermal Map</span>
      </div>

      <div className="flex items-center space-x-1">
        <span className="inline-block w-2 h-2 rounded-full bg-emerald-500"></span>
        <span className="text-[10px] text-slate-400">&gt;80%</span>
      </div>

      <div className="flex items-center space-x-1">
        <span className="inline-block w-2 h-2 rounded-full bg-amber-500"></span>
        <span className="text-[10px] text-slate-400">50-80%</span>
      </div>

      <div className="flex items-center space-x-1">
        <span className="inline-block w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
        <span className="text-[10px] text-slate-400">&lt;50%</span>
      </div>
    </div>
  );
}

