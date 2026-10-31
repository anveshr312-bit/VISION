/**
 * VISION: Engine Digital Twin & Analytical Workspace
 * Vital Intelligence for System Integrity, Observation & Nostics
 *
 * Left Pane: Interactive 3D Turbofan Digital Twin with raycasting, thermal maps, and HUD.
 * Right Pane: Sensor telemetry history, Mondrian conformal RUL fan chart, and explainability bars.
 */

import React, { useState } from 'react';
import TurbofanCanvas from '../components_3d/TurbofanCanvas.jsx';
import SensorChart from './SensorChart.jsx';
import RulFanChart from './RulFanChart.jsx';
import SensorImportanceBar from './SensorImportanceBar.jsx';
import PhysicalDossierCard from './PhysicalDossierCard.jsx';
import {
  Plane,
  AlertTriangle,
  Clock,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Activity,
  Zap,
  Droplet,
  Sparkles,
  FileText,
  RotateCcw,
  CheckCircle2,
} from 'lucide-react';
import { api } from '../services/api.js';
import { getOfflineWaterWash } from '../services/apiFallback.js';

export default function EngineDetail({
  engine,
  fleet = [],
  onSelectUnit = null,
  onBackToFleet = null,
  className = '',
}) {
  const [selectedComponent, setSelectedComponent] = useState(null);
  const [activeRightTab, setActiveRightTab] = useState('ANALYTICS'); // 'ANALYTICS' | 'PHYSICAL_DOSSIER'
  const [waterWashActive, setWaterWashActive] = useState(false);
  const [waterWashLoading, setWaterWashLoading] = useState(false);
  const [washResult, setWashResult] = useState(null);

  if (!engine) {
    return (
      <div className="flex items-center justify-center min-h-[400px] text-slate-400 font-mono text-xs">
        No engine selected. Select a turbofan unit from the fleet table.
      </div>
    );
  }

  // Find previous and next engines in fleet
  const currentIndex = fleet.findIndex((e) => e.unit_id === engine.unit_id);
  const prevEngine = currentIndex > 0 ? fleet[currentIndex - 1] : null;
  const nextEngine = currentIndex < fleet.length - 1 ? fleet[currentIndex + 1] : null;

  const baseRul = engine.predicted_rul || 25.0;
  const baseLb90 = engine.conformal_lower_90 || Math.max(0, baseRul - 12);
  const baseUb90 = engine.conformal_upper_90 || baseRul + 15;
  const cycle = engine.current_cycle || 140;

  // Water wash dynamic rebound values
  const rul = waterWashActive ? Math.min(125, baseRul + 32.0) : baseRul;
  const lb90 = waterWashActive ? Math.min(125, baseLb90 + 26.0) : baseLb90;
  const ub90 = waterWashActive ? Math.min(125, baseUb90 + 35.0) : baseUb90;

  // Water Wash action handler
  const handleToggleWaterWash = async () => {
    if (waterWashActive) {
      setWaterWashActive(false);
      setWashResult(null);
      return;
    }

    setWaterWashLoading(true);
    try {
      const res = await api.performWaterWash(engine.unit_id, engine.subset || 'FD001');
      setWashResult(res);
      setWaterWashActive(true);
    } catch (err) {
      const fallback = getOfflineWaterWash(engine.unit_id);
      setWashResult(fallback);
      setWaterWashActive(true);
    } finally {
      setWaterWashLoading(false);
    }
  };

  // Calculate spool rotation speed driven by telemetry (s8 Nf, s9 Nc)
  const nf = engine.sensors?.s8 || 2388.0;
  const nc = engine.sensors?.s9 || 9050.0;
  const n1Speed = Math.max(0.4, Math.min(2.0, nf / 2388.0));
  const n2Speed = Math.max(0.4, Math.min(2.5, (nc / 9050.0) * 1.4));

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Top Engine Selector Bar */}
      <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-2xl p-3.5 flex flex-wrap items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center space-x-3">
          {onBackToFleet && (
            <button
              onClick={onBackToFleet}
              className="px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono transition-colors flex items-center space-x-1"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Fleet Board</span>
            </button>
          )}

          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-300 font-mono font-bold text-xs">
              #{engine.unit_id}
            </div>
            <div>
              <h2 className="text-sm font-bold text-white font-mono flex items-center space-x-2">
                <span>Turbofan Engine Unit #{engine.unit_id}</span>
                <span className="text-[10px] text-slate-400 font-normal">
                  ({engine.subset || 'FD001'})
                </span>
              </h2>
            </div>
          </div>
        </div>

        {/* Quick Nav Prev/Next Buttons */}
        <div className="flex items-center space-x-3 text-xs font-mono">
          {/* Water Wash Action Button */}
          <div className="flex items-center space-x-1.5">
            <button
              onClick={handleToggleWaterWash}
              disabled={waterWashLoading}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all flex items-center space-x-1.5 shadow-md ${
                waterWashActive
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 hover:bg-emerald-500/30'
                  : 'bg-gradient-to-r from-cyan-600/30 to-blue-600/30 hover:from-cyan-600/50 hover:to-blue-600/50 text-cyan-200 border border-cyan-500/40'
              }`}
              title="Simulate core detergent descaling to wash compressor soot and salt deposits"
            >
              <Droplet className={`w-3.5 h-3.5 ${waterWashActive ? 'text-emerald-400' : 'text-cyan-400'}`} />
              <span>{waterWashActive ? 'Water Wash: +32c Rebound' : 'Perform Water Wash'}</span>
            </button>

            {waterWashActive && (
              <button
                onClick={() => {
                  setWaterWashActive(false);
                  setWashResult(null);
                }}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors"
                title="Reset to Pre-Wash Baseline"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center space-x-1">
            <button
              disabled={!prevEngine}
              onClick={() => prevEngine && onSelectUnit(prevEngine.unit_id)}
              className="p-1.5 rounded-lg bg-slate-800 disabled:opacity-30 hover:bg-slate-700 text-slate-300 transition-colors"
              title="Previous Engine"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-slate-400 text-[11px] px-1">
              Unit {currentIndex + 1} of {fleet.length}
            </span>
            <button
              disabled={!nextEngine}
              onClick={() => nextEngine && onSelectUnit(nextEngine.unit_id)}
              className="p-1.5 rounded-lg bg-slate-800 disabled:opacity-30 hover:bg-slate-700 text-slate-300 transition-colors"
              title="Next Engine"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Point RUL Pill */}
          <div className="flex items-center space-x-2 px-3 py-1 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-[10px] text-slate-400 uppercase">
              {waterWashActive ? 'Restored RUL:' : 'Predicted RUL:'}
            </span>
            <span
              className={`font-bold ${
                rul < 20 ? 'text-rose-400' : rul < 50 ? 'text-amber-400' : 'text-emerald-400'
              }`}
            >
              {rul.toFixed(1)} cycles
            </span>
            {waterWashActive && (
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/40">
                +32c Wash
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Water Wash Maintenance Certificate Banner */}
      {waterWashActive && (
        <div className="bg-emerald-950/70 border border-emerald-500/40 rounded-2xl p-3 flex flex-wrap items-center justify-between gap-2 text-xs font-mono text-emerald-300 shadow-lg animate-fadeIn">
          <div className="flex items-center space-x-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              <strong>AMM 72-00-00 Wash Certificate:</strong> Descaled HPC blades &bull; Recovered <strong>+32.0 flight cycles</strong> &bull; T30 drop <strong>-14.2&deg;R</strong> &bull; P30 ratio <strong>+1.25%</strong>
            </span>
          </div>
          <span className="text-[10px] text-emerald-400/80 font-sans uppercase tracking-wider font-semibold">
            Airworthiness Certified
          </span>
        </div>
      )}

      {/* Main Grid: Left 3D Twin (5 cols) & Right Telemetry Analytics (7 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Pane: Interactive 3D Turbofan Canvas */}
        <div className="lg:col-span-6 xl:col-span-5 flex flex-col space-y-3">
          <div className="h-[480px] w-full rounded-2xl overflow-hidden border border-slate-800 shadow-2xl relative">
            <TurbofanCanvas
              healthData={{
                fan: 95,
                lpc: 90,
                hpc: Math.max(10, Math.min(100, (rul / 125) * 100)),
                combustor: 88,
                hpt: Math.max(15, Math.min(100, (rul / 125) * 105)),
                lpt: 85,
                sensors: engine.sensors || {},
              }}
              latestSensors={engine.sensors || {}}
              selectedComponent={selectedComponent}
              onSelectComponent={setSelectedComponent}
              n1Speed={n1Speed}
              n2Speed={n2Speed}
            />
          </div>

          {/* Subsystem Health Matrix Quick Overview */}
          <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-2xl p-3.5 shadow-lg">
            <div className="text-[10px] font-mono font-bold uppercase text-slate-400 mb-2 flex items-center justify-between">
              <span>Subsystem Status Matrix</span>
              <span className="text-cyan-400 lowercase">click component in 3D to focus</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-xs font-mono">
              {[
                { id: 'fan', name: 'FAN', health: 96, spool: 'N1' },
                { id: 'lpc', name: 'LPC', health: 91, spool: 'N1' },
                { id: 'hpc', name: 'HPC', health: Math.round((rul / 125) * 100), spool: 'N2' },
                { id: 'combustor', name: 'BURNER', health: 89, spool: 'Static' },
                { id: 'hpt', name: 'HPT', health: Math.round((rul / 125) * 102), spool: 'N2' },
                { id: 'lpt', name: 'LPT', health: 86, spool: 'N1' },
              ].map((sub) => (
                <button
                  key={sub.id}
                  onClick={() => setSelectedComponent(selectedComponent === sub.id ? null : sub.id)}
                  className={`p-2 rounded-xl border text-left transition-all ${
                    selectedComponent === sub.id
                      ? 'bg-cyan-500/20 border-cyan-400 text-white shadow-md'
                      : 'bg-slate-950/60 border-slate-800/80 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span>{sub.name}</span>
                    <span className="text-[9px] font-normal">{sub.spool}</span>
                  </div>
                  <div
                    className={`text-sm font-bold mt-0.5 ${
                      sub.health < 50
                        ? 'text-rose-400'
                        : sub.health < 80
                        ? 'text-amber-400'
                        : 'text-emerald-400'
                    }`}
                  >
                    {sub.health}%
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Pane: Analytical Charts or Physical Dossier */}
        <div className="lg:col-span-6 xl:col-span-7 flex flex-col space-y-4">
          {/* Tab Switcher */}
          <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-2xl p-2 flex items-center justify-between gap-2 shadow-lg">
            <div className="flex items-center space-x-1.5">
              <button
                onClick={() => setActiveRightTab('ANALYTICS')}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-medium transition-colors flex items-center space-x-1.5 ${
                  activeRightTab === 'ANALYTICS'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Activity className="w-3.5 h-3.5" />
                <span>Telemetry &amp; Conformal RUL</span>
              </button>

              <button
                onClick={() => setActiveRightTab('PHYSICAL_DOSSIER')}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-medium transition-colors flex items-center space-x-1.5 ${
                  activeRightTab === 'PHYSICAL_DOSSIER'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Physical Inspection Dossier (LLP &amp; Oil)</span>
              </button>
            </div>

            <span className="hidden sm:inline-block text-[10px] text-slate-500 font-mono pr-2">
              {activeRightTab === 'ANALYTICS' ? 'Real-time telemetry stream' : 'Structural &amp; lab diagnostics'}
            </span>
          </div>

          {activeRightTab === 'ANALYTICS' ? (
            <>
              {/* Conformal RUL Fan Chart */}
              <RulFanChart
                currentCycle={cycle}
                predictedRul={rul}
                conformalLower90={lb90}
                conformalUpper90={ub90}
                leadTime={15}
                unitId={engine.unit_id}
              />

              {/* Multi-Sensor Time-Series Trajectory */}
              <SensorChart
                sensorHistory={engine.sensor_history || []}
                unitId={engine.unit_id}
              />

              {/* Explainability Attribution Bars */}
              <SensorImportanceBar />
            </>
          ) : (
            <PhysicalDossierCard
              unitId={engine.unit_id}
              subset={engine.subset || 'FD001'}
              predictedRul={rul}
              currentCycle={cycle}
            />
          )}
        </div>
      </div>
    </div>
  );
}

