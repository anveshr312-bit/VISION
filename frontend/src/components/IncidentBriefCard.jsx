/**
 * VISION: Operational Incident Brief Card
 * Vital Intelligence for System Integrity, Observation & Nostics
 *
 * Renders the AI Narrative Engine output as a styled aviation incident brief.
 * Reads from GET /api/engine/{unit_id}/kalman-state -> incident_brief
 *
 * This is what a Rolls-Royce line maintenance engineer would read before
 * deciding whether to pull an engine from service.
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  FileText,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  TrendingDown,
  DollarSign,
  Shield,
  Radio,
} from 'lucide-react';
import { api } from '../services/api.js';

// Colour maps for severity levels
const SEVERITY_STYLES = {
  CRITICAL: {
    border: 'border-rose-500/70',
    bg: 'bg-rose-950/60',
    badge: 'bg-rose-500/30 text-rose-200 border-rose-500/50',
    icon: 'text-rose-400',
    dot: 'bg-rose-500 animate-pulse',
    label: 'CRITICAL',
  },
  WARNING: {
    border: 'border-amber-500/60',
    bg: 'bg-amber-950/50',
    badge: 'bg-amber-500/20 text-amber-200 border-amber-500/40',
    icon: 'text-amber-400',
    dot: 'bg-amber-400 animate-pulse',
    label: 'WARNING',
  },
  ELEVATED: {
    border: 'border-yellow-500/50',
    bg: 'bg-yellow-950/40',
    badge: 'bg-yellow-500/20 text-yellow-200 border-yellow-500/30',
    icon: 'text-yellow-400',
    dot: 'bg-yellow-400',
    label: 'ELEVATED',
  },
  NOMINAL: {
    border: 'border-emerald-500/40',
    bg: 'bg-emerald-950/30',
    badge: 'bg-emerald-500/20 text-emerald-200 border-emerald-500/40',
    icon: 'text-emerald-400',
    dot: 'bg-emerald-400',
    label: 'NOMINAL',
  },
};

const VELOCITY_STATUS_STYLES = {
  ACCELERATION_ALERT: 'text-rose-400 bg-rose-500/10 border-rose-500/40',
  ELEVATED: 'text-amber-400 bg-amber-500/10 border-amber-500/40',
  MONITORING: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
  STABLE: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
};

function SignalRow({ label, value, highlight = false }) {
  return (
    <div className="flex items-center justify-between py-0.5">
      <span className="text-[10px] text-slate-500 uppercase tracking-wide">{label}</span>
      <span className={`text-[11px] font-mono font-bold ${highlight ? 'text-cyan-300' : 'text-slate-200'}`}>
        {value}
      </span>
    </div>
  );
}

export default function IncidentBriefCard({ engine, className = '' }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchBrief = useCallback(async () => {
    if (!engine?.unit_id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.getKalmanState(engine.unit_id, engine.subset || 'FD001');
      setData(res);
    } catch (err) {
      setError('Backend offline — EKF state unavailable. Start the VISION API server.');
    } finally {
      setLoading(false);
    }
  }, [engine?.unit_id, engine?.subset]);

  useEffect(() => {
    fetchBrief();
  }, [fetchBrief]);

  if (!engine) return null;

  const brief = data?.incident_brief;
  const vel = data?.degradation_velocity;
  const severity = brief?.severity || 'NOMINAL';
  const style = SEVERITY_STYLES[severity] || SEVERITY_STYLES.NOMINAL;

  return (
    <div className={`rounded-2xl border ${style.border} ${style.bg} backdrop-blur-xl font-mono text-xs shadow-lg overflow-hidden ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-slate-800/60">
        <div className="flex items-center space-x-2.5">
          <Radio className={`w-4 h-4 ${style.icon} shrink-0`} />
          <div>
            <div className="text-[10px] text-slate-400 uppercase tracking-wider">
              VISION Operational Incident Brief
            </div>
            <div className="text-[10px] text-slate-600">
              ENG-{String(engine.unit_id).padStart(3, '0')} | {engine.subset || 'FD001'} | Cycle {engine.current_cycle || '—'}
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <span className={`flex items-center space-x-1.5 px-2 py-0.5 rounded-full border text-[9px] font-bold ${style.badge}`}>
            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${style.dot}`} />
            <span>{style.label}</span>
          </span>
          <button
            onClick={fetchBrief}
            disabled={loading}
            title="Refresh EKF state"
            className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors disabled:opacity-40"
          >
            <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Loading / Error State */}
      {loading && (
        <div className="p-4 text-center text-slate-500 text-[11px]">
          Running EKF across cycle history…
        </div>
      )}
      {error && (
        <div className="p-3 flex items-start space-x-2 text-amber-400 text-[11px]">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Brief Content */}
      {brief && !loading && (
        <div className="p-3 space-y-3">

          {/* EKF State Signals */}
          <div className="grid grid-cols-2 gap-2">
            {/* HPC Health */}
            <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-800 space-y-0.5">
              <div className="text-[9px] text-slate-500 uppercase">EKF η_HPC Health</div>
              <div className={`text-base font-bold ${
                brief.signals.hpc_health_pct < 96 ? 'text-rose-400' :
                brief.signals.hpc_health_pct < 98 ? 'text-amber-400' : 'text-emerald-400'
              }`}>
                {brief.signals.hpc_health_pct.toFixed(1)}%
              </div>
              <div className="text-[9px] text-slate-600">nominal 100%</div>
            </div>

            {/* HPT Health */}
            <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-800 space-y-0.5">
              <div className="text-[9px] text-slate-500 uppercase">EKF η_HPT Health</div>
              <div className={`text-base font-bold ${
                brief.signals.hpt_health_pct < 96 ? 'text-rose-400' :
                brief.signals.hpt_health_pct < 98 ? 'text-amber-400' : 'text-emerald-400'
              }`}>
                {brief.signals.hpt_health_pct.toFixed(1)}%
              </div>
              <div className="text-[9px] text-slate-600">nominal 100%</div>
            </div>
          </div>

          {/* Degradation Velocity Block */}
          {vel && (
            <div className={`p-2.5 rounded-xl border text-[10px] ${VELOCITY_STATUS_STYLES[vel.status] || VELOCITY_STATUS_STYLES.STABLE}`}>
              <div className="flex items-center space-x-1.5 mb-1">
                <TrendingDown className="w-3.5 h-3.5 shrink-0" />
                <span className="font-bold uppercase tracking-wide">Degradation Velocity</span>
                <span className={`ml-auto px-1.5 py-0.5 rounded text-[9px] font-bold border ${
                  VELOCITY_STATUS_STYLES[vel.status] || VELOCITY_STATUS_STYLES.STABLE
                }`}>
                  {vel.status.replace('_', ' ')}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-x-4 text-[10px]">
                <div>
                  <span className="text-slate-500">Velocity V_k:</span>{' '}
                  <span className="font-bold">{vel.velocity_pct_per_cycle.toFixed(4)}%/cycle</span>
                </div>
                <div>
                  <span className="text-slate-500">Acceleration A_k:</span>{' '}
                  <span className="font-bold">{vel.acceleration_pct_per_cycle2.toFixed(5)}%/cycle²</span>
                </div>
              </div>
              {vel.status === 'ACCELERATION_ALERT' && (
                <div className="mt-1.5 text-[10px] text-rose-300 font-semibold">
                  ⚠ Non-linear wear mechanism detected. Blade erosion or fouling cascade likely.
                </div>
              )}
            </div>
          )}

          {/* Mahalanobis / Sensor Status */}
          <div className="flex items-center justify-between px-2.5 py-2 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="flex items-center space-x-1.5">
              <Shield className={`w-3.5 h-3.5 ${brief.signals.sensor_fault ? 'text-rose-400' : 'text-emerald-400'}`} />
              <span className="text-[10px] text-slate-400">EKF Sensor Gate (χ²₄ = 13.28)</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-[11px] text-slate-300 font-bold">
                D_M² = {brief.signals.mahalanobis_sq.toFixed(2)}
              </span>
              <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold border ${
                brief.signals.sensor_fault
                  ? 'bg-rose-500/20 text-rose-300 border-rose-500/40'
                  : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
              }`}>
                {brief.signals.sensor_fault ? 'ANOMALY' : 'PASS'}
              </span>
            </div>
          </div>

          {/* Narrative Text Block */}
          <div className="space-y-1.5 text-[10px] text-slate-300 leading-relaxed">
            <div className="text-[9px] text-slate-500 uppercase font-bold tracking-wider mb-1">
              Operational Narrative
            </div>
            <p>{brief.ekf_finding}</p>
            <p className={vel?.status === 'ACCELERATION_ALERT' ? 'text-rose-300 font-semibold' : ''}>
              {brief.velocity_finding}
            </p>
            <p>{brief.constraint_finding}</p>
          </div>

          {/* Recommended Action */}
          <div className={`p-2.5 rounded-xl border ${
            severity === 'CRITICAL' ? 'border-rose-500/50 bg-rose-950/40 text-rose-200' :
            severity === 'WARNING' ? 'border-amber-500/40 bg-amber-950/30 text-amber-200' :
            'border-emerald-500/30 bg-emerald-950/20 text-emerald-200'
          }`}>
            <div className="flex items-start space-x-1.5">
              {severity === 'NOMINAL'
                ? <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5 text-emerald-400" />
                : <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              }
              <div>
                <div className="text-[9px] uppercase font-bold tracking-wide mb-0.5 opacity-70">
                  Recommended Action
                </div>
                <div className="text-[10px] font-semibold leading-relaxed">
                  {brief.recommended_action}
                </div>
              </div>
            </div>
          </div>

          {/* Economic Exposure */}
          <div className="flex items-center justify-between px-2.5 py-2 rounded-xl bg-slate-900/60 border border-slate-800">
            <div className="flex items-center space-x-1.5">
              <DollarSign className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-[10px] text-slate-400">Economic Exposure (if deferred)</span>
            </div>
            <span className="text-[11px] font-bold text-amber-300">
              ${brief.signals.economic_exposure_usd.toLocaleString()}
            </span>
          </div>

          {/* Certification Footer */}
          <div className="flex items-center justify-between text-[9px] text-slate-600 pt-1 border-t border-slate-800/50">
            <span>{brief.certification}</span>
            <span>Cycle {brief.cycle}</span>
          </div>
        </div>
      )}
    </div>
  );
}

