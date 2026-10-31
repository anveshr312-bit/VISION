import React, { useEffect, useMemo, useState } from 'react';
import {
  Cpu,
  Plane,
  Layers,
  Sliders,
  FileCheck2,
  Fan,
  Sparkles,
  X,
  Wifi,
  WifiOff,
  Radio,
  Loader2,
} from 'lucide-react';
import {
  EngineTelemetry,
  generateInitialFleet,
  applyCompressorWaterWash,
  toggleSensorFaultAbstain,
  mergeBackendFleet,
  mergeBackendEngineDetail,
} from './services/prognosticsEngine';
import api from './services/api';
import TelemetryStreamClient from './services/streamClient';
import { DigitalTwinViewport } from './components_3d/DigitalTwinViewport';
import { FleetEtopsScreen } from './components/FleetEtopsScreen';
import { EconomicSandboxScreen } from './components/EconomicSandboxScreen';
import { AirworthinessDossierScreen } from './components/AirworthinessDossierScreen';
import StageDegradationMap from './components/StageDegradationMap.jsx';
import { ShootingStars } from '@/src/components/ui/shooting-stars';
import { StarsBackground } from '@/src/components/ui/stars-background';
import ShootingStarsAndStarsBackgroundDemo from '@/src/components/shooting-stars-and-stars-background-demo';

type ScreenTab =
  | 'DIGITAL_TWIN'
  | 'FLEET_ETOPS'
  | 'STAGE_DEGRADATION'
  | 'ECONOMIC_SANDBOX'
  | 'AIRWORTHINESS';

export default function App() {
  const [fleet, setFleet] = useState<EngineTelemetry[]>(() => generateInitialFleet());
  const [selectedEngineId, setSelectedEngineId] = useState<string>('ESN-787-034');
  const [activeTab, setActiveTab] = useState<ScreenTab>('DIGITAL_TWIN');
  const [activeSubset, setActiveSubset] = useState<string>('FD001');
  const [actionBanner, setActionBanner] = useState<string | null>(null);
  const [showStarDemoModal, setShowStarDemoModal] = useState<boolean>(false);

  // Live Backend & Telemetry Stream State
  const [isBackendOnline, setIsBackendOnline] = useState<boolean>(false);
  const [isLiveStreaming, setIsLiveStreaming] = useState<boolean>(false);
  const [isLoadingBackend, setIsLoadingBackend] = useState<boolean>(false);
  const [syncStatusText, setSyncStatusText] = useState<string>('Initializing certified PHM engine...');

  const activeEngine = useMemo(
    () => fleet.find((e) => e.id === selectedEngineId) ?? fleet[33] ?? fleet[0],
    [fleet, selectedEngineId]
  );

  const tailList = useMemo(() => {
    const tails: string[] = [];
    for (let i = 1; i <= 50; i++) {
      tails.push(`N787-${String(i).padStart(2, '0')}`);
    }
    return tails;
  }, []);

  // 1. Initial Load & Subset Switching: Fetch Fleet from FastAPI Backend
  useEffect(() => {
    let cancelled = false;

    async function loadBackendFleet() {
      setIsLoadingBackend(true);
      setSyncStatusText(`Connecting to FastAPI backend (${activeSubset})...`);
      try {
        const overview = await api.getFleetOverview(activeSubset);
        if (!cancelled && overview && Array.isArray(overview.engines)) {
          setFleet((prev) => mergeBackendFleet(overview.engines, prev));
          setIsBackendOnline(true);
          setSyncStatusText(`Connected to live NASA ${activeSubset} model (${overview.total_engines} engines synced)`);
          setActionBanner(
            `Loaded certified NASA ${activeSubset} fleet predictions from FastAPI backend (${overview.critical_count} critical, ${overview.monitor_count} monitor)`
          );
        }
      } catch (err) {
        if (!cancelled) {
          console.warn('[VISION] Backend offline or unreachable. Using certified offline fallback cache.', err);
          setIsBackendOnline(false);
          setSyncStatusText('Air-gapped offline mode (deterministic certified cache)');
        }
      } finally {
        if (!cancelled) {
          setIsLoadingBackend(false);
        }
      }
    }

    loadBackendFleet();

    return () => {
      cancelled = true;
    };
  }, [activeSubset]);

  // 2. Fetch Deep Physical Telemetry & EKF State on Engine Select
  useEffect(() => {
    let cancelled = false;
    const unitNumber = parseInt(activeEngine.id.replace('ESN-787-', ''), 10);
    if (isNaN(unitNumber)) return;

    async function syncActiveTelemetry() {
      try {
        const [detail, kalman] = await Promise.all([
          api.getEngineDetail(unitNumber, activeSubset).catch(() => null),
          api.getKalmanState(unitNumber, activeSubset).catch(() => null),
        ]);

        if (!cancelled && (detail || kalman)) {
          setIsBackendOnline(true);
          setFleet((prev) =>
            prev.map((eng) =>
              eng.id === activeEngine.id ? mergeBackendEngineDetail(eng, detail, kalman) : eng
            )
          );
        }
      } catch (err) {
        // Graceful offline fallback
      }
    }

    syncActiveTelemetry();

    return () => {
      cancelled = true;
    };
  }, [selectedEngineId, activeSubset]);

  // 3. Real-Time SSE Telemetry Streaming Client
  useEffect(() => {
    const unitNumber = parseInt(activeEngine.id.replace('ESN-787-', ''), 10);
    if (isNaN(unitNumber)) return;

    const streamClient = new TelemetryStreamClient({
      units: [unitNumber, 1, 10, 24, 34, 45],
      subset: activeSubset,
      speed: 1.0,
      onCycleUpdate: (payload: any) => {
        if (payload && payload.unit_id === unitNumber) {
          setIsBackendOnline(true);
          setFleet((prev) =>
            prev.map((eng) => {
              if (eng.id === activeEngine.id) {
                const s = payload.sensors || {};
                const newT30 = s.s3 ? Number(s.s3.toFixed(1)) : eng.t30;
                const newT50 = s.s4 ? Number(s.s4.toFixed(1)) : eng.t50;
                const newP30 = s.s7 ? Number(s.s7.toFixed(1)) : eng.p30;
                const newRul = typeof payload.rul_prediction === 'number' ? Number(payload.rul_prediction.toFixed(1)) : eng.conformalRul;
                const newLb = typeof payload.conformal_lower_90 === 'number' ? Number(payload.conformal_lower_90.toFixed(1)) : eng.conformalLower90;

                return {
                  ...eng,
                  flightCycles: payload.cycle ?? eng.flightCycles,
                  t30: newT30,
                  t50: newT50,
                  p30: newP30,
                  conformalRul: newRul,
                  conformalLower90: newLb,
                };
              }
              return eng;
            })
          );
        }
      },
      onStatusChange: (status: any) => {
        setIsLiveStreaming(Boolean(status?.streaming));
      },
      onError: () => {
        setIsLiveStreaming(false);
      },
    });

    streamClient.connect();

    return () => {
      streamClient.disconnect();
    };
  }, [selectedEngineId, activeSubset]);

  const handleTailChange = (newTailId: string) => {
    const matchingEngine =
      fleet.find((e) => e.tailId === newTailId && e.wingPosition === activeEngine.wingPosition) ??
      fleet.find((e) => e.tailId === newTailId);
    if (matchingEngine) {
      setSelectedEngineId(matchingEngine.id);
      setActionBanner(null);
    }
  };

  const handleWingToggle = (wing: 'ENG-L' | 'ENG-R') => {
    const matchingEngine = fleet.find(
      (e) => e.tailId === activeEngine.tailId && e.wingPosition === wing
    );
    if (matchingEngine) {
      setSelectedEngineId(matchingEngine.id);
      setActionBanner(null);
    }
  };

  const handleWaterWash = async () => {
    const unitNumber = parseInt(activeEngine.id.replace('ESN-787-', ''), 10);

    // 1. Immediate optimistic UI feedback
    setFleet((prev) =>
      prev.map((eng) => (eng.id === activeEngine.id ? applyCompressorWaterWash(eng) : eng))
    );
    setActionBanner(
      `${activeEngine.id}: AMM 72-00-00 Compressor Water Wash complete (+32.0c RUL rebound, −14.2°R T30 drop, +1.25% P30 recovery)`
    );

    // 2. Persist to FastAPI backend registry
    try {
      await api.performWaterWash(unitNumber, activeSubset);
      setIsBackendOnline(true);
    } catch (e) {
      console.warn('[VISION] Server water-wash registration note:', e);
    }
  };

  const handleToggleSensorFault = () => {
    const nextFault = !activeEngine.sensorFaultActive;
    setFleet((prev) =>
      prev.map((eng) =>
        eng.id === activeEngine.id ? toggleSensorFaultAbstain(eng, nextFault) : eng
      )
    );
    setActionBanner(
      nextFault
        ? `${activeEngine.id}: DO-178C SENSOR_FAULT_ABSTAIN triggered — Conformal interval widened to 100% [0, 125]c`
        : `${activeEngine.id}: Sensor fault cleared — Nominal Conformal RUL telemetry restored`
    );
  };

  const handleSelectEngineFromFleet = (engineId: string) => {
    setSelectedEngineId(engineId);
    setActiveTab('DIGITAL_TWIN');
    setActionBanner(`Loaded ${engineId} into 3D Digital Twin Command Center`);
  };

  return (
    <div className="min-h-screen bg-[#111A19] text-[#E7ECE7] flex flex-col relative overflow-x-hidden">
      {/* AMBIENT SHOOTING STARS & STARS BACKGROUND LAYER IN NEW PALETTE */}
      <div
        aria-hidden="true"
        className="fixed inset-0 pointer-events-none z-0 bg-[radial-gradient(ellipse_at_top,_rgba(179,197,139,0.12),_rgba(130,169,149,0.06)_45%,_rgba(17,26,25,0.98)_85%)]"
      >
        <StarsBackground starDensity={0.00022} />
        <ShootingStars starColor="#B3C58B" trailColor="#82A995" minDelay={1000} maxDelay={3200} />
      </div>

      {/* TOP NAVIGATION BAR */}
      <header className="h-[72px] backdrop-blur-2xl bg-[#182321]/90 border-b border-[#46564D] shadow-[0_4px_30px_rgba(0,0,0,0.5)] px-3.5 flex items-center justify-between gap-2 shrink-0 z-30 relative">
        {/* Left Brand Lockup & Tail / Subset Switcher */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-2">
            {/* Primary Accent Turbine Icon Badge */}
            <div className="w-8 h-8 rounded-xl bg-[#B3C58B] shadow-[0_0_16px_rgba(179,197,139,0.3)] flex items-center justify-center text-[#111A19] shrink-0">
              <Fan className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-xs font-mono font-bold uppercase tracking-wider text-[#E7ECE7] whitespace-nowrap">
                VISION <span className="font-normal text-[#B3C58B]">· TRENT 1000</span>
              </h1>
              <div className="text-[9px] font-mono uppercase tracking-wider text-[#A6B4AA] hidden 2xl:block whitespace-nowrap">
                DO-178C Air-Gapped PHM · UTC 14:32Z
              </div>
            </div>
          </div>

          {/* Dataset Subset Selector (FD001 - FD004) */}
          <div className="flex items-center gap-1.5 backdrop-blur-2xl bg-[#1C2926]/90 border border-[#46564D] rounded-2xl px-2 py-1 shadow-lg shrink-0">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#A6B4AA]">
              Set:
            </span>
            <select
              aria-label="C-MAPSS Dataset Subset"
              value={activeSubset}
              onChange={(e) => setActiveSubset(e.target.value)}
              className="bg-transparent text-xs font-mono font-bold text-[#B3C58B] focus:outline-none cursor-pointer pr-0.5"
            >
              <option value="FD001" className="bg-[#182321] text-[#E7ECE7]">FD001 (Sea Level / HPC)</option>
              <option value="FD002" className="bg-[#182321] text-[#E7ECE7]">FD002 (6 Regimes / HPC)</option>
              <option value="FD003" className="bg-[#182321] text-[#E7ECE7]">FD003 (Sea Level / HPC+HPT)</option>
              <option value="FD004" className="bg-[#182321] text-[#E7ECE7]">FD004 (6 Regimes / Dual Fault)</option>
            </select>
          </div>

          {/* Aircraft Tail Switcher (N787-01 to N787-50) + Wing Toggle */}
          <div className="flex items-center gap-1.5 backdrop-blur-2xl bg-[#1C2926]/90 border border-[#46564D] rounded-2xl px-2 py-1 shadow-lg shrink-0">
            <label
              htmlFor="tail-switcher"
              className="text-[10px] font-mono uppercase tracking-wider text-[#A6B4AA]"
            >
              Tail:
            </label>
            <select
              id="tail-switcher"
              aria-label="Aircraft Tail Switcher"
              value={activeEngine.tailId}
              onChange={(e) => handleTailChange(e.target.value)}
              className="bg-transparent text-xs font-mono font-bold text-[#E7ECE7] focus:outline-none cursor-pointer pr-0.5"
            >
              {tailList.map((tail) => (
                <option key={tail} value={tail} className="bg-[#182321] text-[#E7ECE7]">
                  {tail}
                </option>
              ))}
            </select>

            <span className="text-[#46564D]">|</span>

            <div className="flex items-center gap-1" role="group" aria-label="Wing Engine Selector">
              {(['ENG-L', 'ENG-R'] as const).map((wing) => (
                <button
                  key={wing}
                  type="button"
                  onClick={() => handleWingToggle(wing)}
                  className={`px-1.5 py-0.5 rounded-lg text-[10px] font-mono uppercase tracking-wider font-bold cursor-pointer transition-all ${
                    activeEngine.wingPosition === wing
                      ? 'bg-[#B3C58B] text-[#111A19] shadow-[0_0_10px_rgba(179,197,139,0.3)]'
                      : 'text-[#A6B4AA] hover:text-[#E7ECE7]'
                  }`}
                >
                  {wing}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Center Floating Glassmorphism Capsule Navigation */}
        <nav
          aria-label="Primary Command Screens"
          className="flex items-center gap-1 backdrop-blur-2xl bg-[#1C2926]/90 p-1 rounded-2xl border border-[#46564D] shadow-2xl shrink-0"
        >
          <button
            type="button"
            onClick={() => setActiveTab('DIGITAL_TWIN')}
            className={`px-2 py-1.5 rounded-xl text-[10px] font-mono uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'DIGITAL_TWIN'
                ? 'bg-[#B3C58B] text-[#111A19] font-bold shadow-[0_0_14px_rgba(179,197,139,0.3)]'
                : 'text-[#A6B4AA] hover:text-[#E7ECE7] hover:bg-[#293834]/70'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>3D Digital Twin</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('FLEET_ETOPS')}
            className={`px-2 py-1.5 rounded-xl text-[10px] font-mono uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'FLEET_ETOPS'
                ? 'bg-[#B3C58B] text-[#111A19] font-bold shadow-[0_0_14px_rgba(179,197,139,0.3)]'
                : 'text-[#A6B4AA] hover:text-[#E7ECE7] hover:bg-[#293834]/70'
            }`}
          >
            <Plane className="w-3.5 h-3.5" />
            <span>Fleet &amp; ETOPS</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('STAGE_DEGRADATION')}
            className={`px-2 py-1.5 rounded-xl text-[10px] font-mono uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'STAGE_DEGRADATION'
                ? 'bg-[#B3C58B] text-[#111A19] font-bold shadow-[0_0_14px_rgba(179,197,139,0.3)]'
                : 'text-[#A6B4AA] hover:text-[#E7ECE7] hover:bg-[#293834]/70'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Stage Degradation Map</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('ECONOMIC_SANDBOX')}
            className={`px-2 py-1.5 rounded-xl text-[10px] font-mono uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'ECONOMIC_SANDBOX'
                ? 'bg-[#B3C58B] text-[#111A19] font-bold shadow-[0_0_14px_rgba(179,197,139,0.3)]'
                : 'text-[#A6B4AA] hover:text-[#E7ECE7] hover:bg-[#293834]/70'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Economic Sandbox</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('AIRWORTHINESS')}
            className={`px-2 py-1.5 rounded-xl text-[10px] font-mono uppercase tracking-wider flex items-center gap-1 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'AIRWORTHINESS'
                ? 'bg-[#B3C58B] text-[#111A19] font-bold shadow-[0_0_14px_rgba(179,197,139,0.3)]'
                : 'text-[#A6B4AA] hover:text-[#E7ECE7] hover:bg-[#293834]/70'
            }`}
          >
            <FileCheck2 className="w-3.5 h-3.5" />
            <span>Airworthiness Release</span>
          </button>
        </nav>

        {/* Right Active Engine Pill, Live Backend Status & Starfield Demo */}
        <div className="hidden xl:flex items-center gap-2 shrink-0">
          {/* Live Telemetry / API Connection Status Pill */}
          <div
            className={`px-2.5 py-1 rounded-xl text-[10px] font-mono flex items-center gap-1.5 border transition-all ${
              isBackendOnline
                ? 'bg-[#1C2926]/90 border-[#82A995] text-[#B3C58B]'
                : 'bg-[#1C2926]/90 border-[#46564D] text-[#A6B4AA]'
            }`}
            title={syncStatusText}
          >
            {isLoadingBackend ? (
              <Loader2 className="w-3 h-3 animate-spin text-[#B3C58B]" />
            ) : isBackendOnline ? (
              <>
                <span className="w-2 h-2 rounded-full bg-[#B3C58B] shadow-[0_0_8px_#B3C58B] animate-pulse" />
                <span className="font-semibold tracking-wider">LIVE ML {isLiveStreaming ? '+ SSE' : ''}</span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <span>OFFLINE CACHE</span>
              </>
            )}
          </div>

          <div className="text-right">
            <span className="text-[8px] font-mono uppercase tracking-wider text-[#A6B4AA] block">
              Active Serial
            </span>
            <span className="text-[11px] font-mono font-bold text-[#B3C58B] tabular-nums">
              {activeEngine.id}
            </span>
          </div>

          <button
            type="button"
            onClick={() => setShowStarDemoModal(true)}
            title="Preview Aceternity Shooting Stars & Stars Background Demo"
            className="px-2 py-1.5 rounded-xl bg-[#293834] hover:bg-[#293834]/80 border border-[#46564D] text-[#E7ECE7] text-[10px] font-mono uppercase tracking-wider font-semibold flex items-center gap-1 shadow-xs cursor-pointer whitespace-nowrap"
          >
            <Sparkles className="w-3 h-3 text-[#B3C58B]" />
            <span>Starfield</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('AIRWORTHINESS')}
            className="px-2.5 py-1.5 rounded-xl bg-[#293834] hover:bg-[#293834]/80 border border-[#46564D] text-[#B3C58B] text-[10px] font-mono uppercase tracking-wider font-semibold flex items-center gap-1 shadow-xs cursor-pointer whitespace-nowrap"
          >
            <span>Form 8130-3</span>
          </button>
        </div>
      </header>

      {/* MAIN VIEWPORT CONTENT */}
      <main className="flex-1 relative z-10">
        {activeTab === 'DIGITAL_TWIN' && (
          <DigitalTwinViewport
            engine={activeEngine}
            onWaterWash={handleWaterWash}
            onToggleSensorFault={handleToggleSensorFault}
            onNavigateToDossier={() => setActiveTab('AIRWORTHINESS')}
            actionBanner={actionBanner}
          />
        )}

        {activeTab === 'FLEET_ETOPS' && (
          <FleetEtopsScreen
            fleet={fleet}
            selectedEngineId={activeEngine.id}
            onSelectEngineForTwin={handleSelectEngineFromFleet}
          />
        )}

        {activeTab === 'STAGE_DEGRADATION' && (
          <StageDegradationMap
            engine={activeEngine}
            onWaterWash={handleWaterWash}
            onNavigateToDossier={() => setActiveTab('AIRWORTHINESS')}
          />
        )}

        {activeTab === 'ECONOMIC_SANDBOX' && (
          <EconomicSandboxScreen
            fleet={fleet}
            onSelectEngineForTwin={handleSelectEngineFromFleet}
          />
        )}

        {activeTab === 'AIRWORTHINESS' && (
          <AirworthinessDossierScreen
            engine={activeEngine}
            onWaterWash={handleWaterWash}
          />
        )}
      </main>

      {/* STANDALONE SHOOTING STARS & STARS BACKGROUND DEMO PREVIEW MODAL */}
      {showStarDemoModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Shooting Stars and Stars Background Demo"
          className="fixed inset-0 z-50 bg-[#111A19]/85 backdrop-blur-md flex items-center justify-center p-6"
        >
          <div className="relative w-full max-w-5xl rounded-2xl overflow-hidden border border-[#46564D] shadow-2xl">
            <button
              type="button"
              onClick={() => setShowStarDemoModal(false)}
              aria-label="Close Starfield Demo"
              className="absolute top-4 right-4 z-30 p-2 rounded-xl bg-[#1C2926]/90 hover:bg-[#293834] border border-[#46564D] text-[#E7ECE7] cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
            <ShootingStarsAndStarsBackgroundDemo />
          </div>
        </div>
      )}
    </div>
  );
}
