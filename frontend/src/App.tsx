import React, { useEffect, useMemo, useState } from 'react';
import {
  Search,
  Bell,
  X,
  Radio,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Activity,
  Database,
} from 'lucide-react';
import { api } from './services/api.js';
import { TelemetryStreamClient } from './services/streamClient.js';
import {
  EngineTelemetry,
  generateInitialFleet,
  applyCompressorWaterWash,
  toggleSensorFaultAbstain,
  hydrateFleetWithBackend,
  buildEngineTrajectory,
} from './services/prognosticsEngine';

const WATER_WASH_STORAGE_KEY = 'vision_water_washed_units';

function getStoredWaterWashedUnits(): Set<string> {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const raw = localStorage.getItem(WATER_WASH_STORAGE_KEY);
      if (raw) return new Set(JSON.parse(raw));
    }
  } catch {
    // fallback
  }
  return new Set();
}

function persistWaterWashUnit(engineId: string) {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const current = getStoredWaterWashedUnits();
      current.add(engineId);
      localStorage.setItem(WATER_WASH_STORAGE_KEY, JSON.stringify(Array.from(current)));
    }
  } catch {
    // fallback
  }
}
import { DigitalTwinViewport } from './components_3d/DigitalTwinViewport';
import { FleetEtopsScreen } from './components/FleetEtopsScreen';
import { EconomicSandboxScreen } from './components/EconomicSandboxScreen';
import { AirworthinessDossierScreen } from './components/AirworthinessDossierScreen';
import StageDegradationMap from './components/StageDegradationMap.jsx';
import ShootingStarsAndStarsBackgroundDemo from '@/src/components/shooting-stars-and-stars-background-demo';
import { ShootingStars } from '@/src/components/ui/shooting-stars';
import { StarsBackground } from '@/src/components/ui/stars-background';

export type AviationDataSource =
  | 'NASA_CMAPSS_BENCHMARK'
  | 'NASA_NCMAPSS_TRANSIENT'
  | 'ARINC_429_ACARS_EHM'
  | 'FAA_PHYSICAL_MAINTENANCE';

type ScreenTab =
  | 'DIGITAL_TWIN'
  | 'STAGE_DEGRADATION'
  | 'FLEET_ETOPS'
  | 'ECONOMIC_SANDBOX'
  | 'AIRWORTHINESS';

export default function App() {
  const [fleet, setFleet] = useState<EngineTelemetry[]>(() => {
    const base = generateInitialFleet();
    const washed = getStoredWaterWashedUnits();
    if (washed.size > 0) {
      return base.map((e) => (washed.has(e.id) ? applyCompressorWaterWash(e) : e));
    }
    return base;
  });
  const [selectedEngineId, setSelectedEngineId] = useState<string>('ESN-787-034');
  const [activeTab, setActiveTab] = useState<ScreenTab>('DIGITAL_TWIN');
  const [actionBanner, setActionBanner] = useState<string | null>(null);
  const [showStarDemoModal, setShowStarDemoModal] = useState<boolean>(false);
  const [backendOnline, setBackendOnline] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncStatus, setSyncStatus] = useState<'IDLE' | 'SYNCING' | 'SYNCED' | 'STANDALONE_EDGE'>('SYNCING');
  const [isLiveStreaming, setIsLiveStreaming] = useState<boolean>(false);
  const [streamTicks, setStreamTicks] = useState<number>(0);
  const [activeDataSource, setActiveDataSource] = useState<AviationDataSource>('NASA_CMAPSS_BENCHMARK');
  const [missionPhaseInfo, setMissionPhaseInfo] = useState<string | null>(null);

  const handleDataSourceChange = async (source: AviationDataSource) => {
    setActiveDataSource(source);
    if (source === 'NASA_CMAPSS_BENCHMARK') {
      setMissionPhaseInfo(null);
      setActionBanner('Active Stream: NASA C-MAPSS FD001–FD004 Run-to-Failure Fleet Benchmark (708 Turbofans across 6 Regimes)');
    } else if (source === 'NASA_NCMAPSS_TRANSIENT') {
      setActionBanner('Active Stream: NASA N-CMAPSS 1 Hz Transient Mission (LHR→JFK) · Real-Time Spool Dynamics & Dynamic Altitude');
      try {
        const mission = await api.getMissionProfile(120);
        if (mission && mission.length > 0) {
          const pt = mission[mission.length - 1];
          setMissionPhaseInfo(`${pt.flight_phase} · FL${Math.round(pt.altitude_ft / 100)} · M${pt.mach} · ${pt.tra_deg}° TRA`);
        }
      } catch {
        setMissionPhaseInfo('CRUISE FL370 · M0.84 · 74° TRA');
      }
    } else if (source === 'ARINC_429_ACARS_EHM') {
      setMissionPhaseInfo('ACARS LINK ACTIVE · 131.550 MHz · SATCOM EHM');
      setActionBanner('Active Stream: Commercial Airline ARINC 429 ACARS Bus · Live Dual-Wing ETOPS Telemetry Broadcast');
    } else if (source === 'FAA_PHYSICAL_MAINTENANCE') {
      setMissionPhaseInfo('FAA Part 33.70 · Form 8130-3 Verified');
      setActiveTab('AIRWORTHINESS');
      setActionBanner('Active Stream: FAA 14 CFR § 33.70 Physical Airworthiness Dossier · Borescope & SOAP Metallurgical Records');
    }
  };

  useEffect(() => {
    setIsSyncing(true);
    setSyncStatus('SYNCING');
    api.getHealth()
      .then(async () => {
        setBackendOnline(true);
        console.log('[VISION] Connected to FastAPI backend');
        try {
          const overview = await api.getFleetOverview('FD001');
          if (overview && Array.isArray(overview.engines)) {
            const washed = getStoredWaterWashedUnits();
            setFleet((prev) => hydrateFleetWithBackend(prev, overview, washed));
            setSyncStatus('SYNCED');
            setActionBanner('Synchronized 100 Trent 1000 engines with C-MAPSS FD001 empirical inference backend');
          } else {
            setSyncStatus('STANDALONE_EDGE');
          }
        } catch (e: any) {
          console.warn('[VISION] Fleet hydration note:', e.message);
          setSyncStatus('STANDALONE_EDGE');
        } finally {
          setIsSyncing(false);
        }
      })
      .catch((err) => {
        setBackendOnline(false);
        setSyncStatus('STANDALONE_EDGE');
        setIsSyncing(false);
        console.warn('[VISION] Operating in standalone edge mode:', err.message);
      });
  }, []);

  // Real-Time SSE Telemetry Stream Listener (RTCA DO-178C Level B Streaming)
  useEffect(() => {
    if (!backendOnline || !isLiveStreaming) return;

    const targetUnit = parseInt(selectedEngineId.split('-').pop() || '34', 10);
    const stream = new TelemetryStreamClient({
      units: [targetUnit],
      subset: 'FD001',
      speed: 1.0,
      onCycleUpdate: (payload: any) => {
        if (!payload || !payload.unit_id) return;
        setStreamTicks((c) => c + 1);
        setFleet((prev) =>
          prev.map((eng) => {
            const num = parseInt(eng.id.replace(/\D/g, ''), 10);
            if (num === payload.unit_id) {
              const rul = payload.predicted_rul ?? eng.conformalRul;
              const lower = payload.conformal_lower_90 ?? eng.conformalLower90;
              const upper = payload.conformal_upper_90 ?? eng.conformalUpper90;
              const cyc = payload.cycle ?? eng.flightCycles;
              return {
                ...eng,
                flightCycles: cyc,
                conformalRul: rul,
                conformalLower90: lower,
                conformalUpper90: upper,
                trajectory: buildEngineTrajectory(cyc, rul, eng.t30, eng.sensorFaultActive),
              };
            }
            return eng;
          })
        );
      },
    });

    stream.connect();
    return () => stream.disconnect();
  }, [backendOnline, isLiveStreaming, selectedEngineId]);

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

  const handleWaterWash = () => {
    setFleet((prev) =>
      prev.map((eng) => (eng.id === activeEngine.id ? applyCompressorWaterWash(eng) : eng))
    );
    persistWaterWashUnit(activeEngine.id);
    setActionBanner(
      `${activeEngine.id}: AMM 72-00-00 Compressor Water Wash complete (+32.0c RUL rebound, −14.2°R T30 drop, +1.25% P30 recovery)`
    );
    // Wireframe with backend API (sync if online)
    const unitNum = parseInt(activeEngine.id.split('-').pop() || '1', 10);
    api.performWaterWash(unitNum, 'FD001').catch(() => {});
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
    <div className="min-h-screen bg-[#111A19] text-[#EAECE9] flex flex-col relative overflow-x-hidden">
      {/* Fixed Global Background Layer (#111A19 base + Studio Radial Vignette + Low-Opacity ShootingStars & StarsBackground) */}
      <div
        aria-hidden="true"
        data-testid="global-starfield-background"
        className="fixed inset-0 pointer-events-none z-0 overflow-hidden bg-[#111A19]"
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_52%_42%,_rgba(42,54,49,0.52)_0%,_rgba(17,26,25,0.84)_58%,_rgba(17,26,25,0.98)_100%)]" />
        <StarsBackground
          starDensity={0.00014}
          allStarsTwinkle={true}
          twinkleProbability={0.65}
          minTwinkleSpeed={0.6}
          maxTwinkleSpeed={1.3}
          className="opacity-35 mix-blend-screen"
        />
        <ShootingStars
          starColor="#B8CE82"
          trailColor="#82A995"
          minSpeed={12}
          maxSpeed={28}
          minDelay={1800}
          maxDelay={4200}
          starWidth={12}
          starHeight={1.5}
          className="opacity-45 mix-blend-screen"
        />
      </div>

      {/* TOP NAVIGATION BAR (Matches Reference Image: /// V I S I O N | Pill Nav | Search, Bell, Profile) */}
      <header className="h-[74px] px-6 lg:px-8 flex items-center justify-between gap-4 shrink-0 z-30 relative">
        {/* Left: Three Diagonal Slashes Logo + Spaced V I S I O N + Compact Tail Switcher */}
        <div className="flex items-center gap-5 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('DIGITAL_TWIN')}
            className="flex items-center gap-3 cursor-pointer group"
            title="VISION Command Center"
            aria-label="VISION Command Center"
          >
            <img
              src="/logo.svg"
              alt="VISION Logo"
              className="w-8 h-8 object-contain filter invert opacity-95 group-hover:opacity-100 group-hover:drop-shadow-[0_0_10px_rgba(184,206,130,0.6)] transition-all"
            />
            <span className="text-[15px] font-medium tracking-[0.38em] text-[#EAECE9] uppercase group-hover:text-[#B8CE82] transition-colors">
              VISION
            </span>
          </button>

          {/* Subtle Aircraft Tail & Wing Pill Switcher */}
          <div className="hidden md:flex items-center gap-1.5 bg-[#232725]/90 border border-white/[0.08] rounded-full px-3 py-1 text-xs">
            <label htmlFor="tail-switcher" className="text-[11px] text-[#949C96]">
              Tail:
            </label>
            <select
              id="tail-switcher"
              aria-label="Aircraft Tail Switcher"
              value={activeEngine.tailId}
              onChange={(e) => handleTailChange(e.target.value)}
              className="bg-transparent text-xs font-medium text-[#EAECE9] focus:outline-none cursor-pointer"
            >
              {tailList.map((tail) => (
                <option key={tail} value={tail} className="bg-[#1B1F1D] text-[#EAECE9]">
                  {tail}
                </option>
              ))}
            </select>
            <span className="text-white/15">|</span>
            <div className="flex items-center gap-0.5" role="group" aria-label="Wing Engine Selector">
              {(['ENG-L', 'ENG-R'] as const).map((wing) => (
                <button
                  key={wing}
                  type="button"
                  onClick={() => handleWingToggle(wing)}
                  className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold cursor-pointer transition-all ${
                    activeEngine.wingPosition === wing
                      ? 'bg-[#B8CE82] text-[#181B19]'
                      : 'text-[#949C96] hover:text-[#EAECE9]'
                  }`}
                >
                  {wing}
                </button>
              ))}
            </div>
          </div>

          {/* Multi-Dataset Aviation Ingestion Stream Switcher */}
          <div className="hidden xl:flex items-center gap-2 bg-[#232725]/90 border border-white/[0.08] rounded-full px-3 py-1 text-xs">
            <label htmlFor="data-source-switcher" className="text-[11px] text-[#949C96] flex items-center gap-1 cursor-pointer">
              <Database className="w-3 h-3 text-[#B8CE82]" />
              <span>Feed:</span>
            </label>
            <select
              id="data-source-switcher"
              aria-label="Multi-Dataset Aviation Stream Switcher"
              value={activeDataSource}
              onChange={(e) => handleDataSourceChange(e.target.value as any)}
              className="bg-transparent text-xs font-medium text-[#EAECE9] focus:outline-none cursor-pointer"
            >
              <option value="NASA_CMAPSS_BENCHMARK" className="bg-[#1B1F1D] text-[#EAECE9]">
                NASA C-MAPSS (FD001–FD004 Benchmark)
              </option>
              <option value="NASA_NCMAPSS_TRANSIENT" className="bg-[#1B1F1D] text-[#EAECE9]">
                NASA N-CMAPSS (1 Hz Flight Mission)
              </option>
              <option value="ARINC_429_ACARS_EHM" className="bg-[#1B1F1D] text-[#EAECE9]">
                ARINC 429 ACARS (Airline EHM Feed)
              </option>
              <option value="FAA_PHYSICAL_MAINTENANCE" className="bg-[#1B1F1D] text-[#EAECE9]">
                FAA Part 33.70 (Physical MRO Dossier)
              </option>
            </select>
            {missionPhaseInfo && (
              <span className="hidden 2xl:flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-mono bg-[#82A995]/20 text-[#B8CE82] border border-[#B8CE82]/30">
                <Activity className="w-2.5 h-2.5 animate-pulse text-[#B8CE82]" />
                {missionPhaseInfo}
              </span>
            )}
          </div>
        </div>

        {/* Center Capsule Navigation (Matches Reference: Overview | Diagnostics | Fleet | Maintenance | Airworthiness) */}
        <nav
          aria-label="Primary Command Screens"
          className="flex items-center gap-1 bg-[#252927]/90 backdrop-blur-xl p-1 rounded-full border border-white/[0.07] shadow-lg"
        >
          <button
            type="button"
            onClick={() => setActiveTab('DIGITAL_TWIN')}
            aria-label="Overview 3D Digital Twin"
            className={`px-5 py-1.5 rounded-full text-[13px] transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'DIGITAL_TWIN'
                ? 'bg-[#DCE0D9] text-[#181B19] font-semibold shadow-sm'
                : 'text-[#949C96] hover:text-[#EAECE9]'
            }`}
          >
            Overview
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('STAGE_DEGRADATION')}
            aria-label="Diagnostics Stage Degradation Map"
            className={`px-5 py-1.5 rounded-full text-[13px] transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'STAGE_DEGRADATION'
                ? 'bg-[#DCE0D9] text-[#181B19] font-semibold shadow-sm'
                : 'text-[#949C96] hover:text-[#EAECE9]'
            }`}
          >
            Diagnostics
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('FLEET_ETOPS')}
            aria-label="Fleet and ETOPS"
            className={`px-5 py-1.5 rounded-full text-[13px] transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'FLEET_ETOPS'
                ? 'bg-[#DCE0D9] text-[#181B19] font-semibold shadow-sm'
                : 'text-[#949C96] hover:text-[#EAECE9]'
            }`}
          >
            Fleet
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('ECONOMIC_SANDBOX')}
            aria-label="Maintenance Economic Sandbox"
            className={`px-5 py-1.5 rounded-full text-[13px] transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'ECONOMIC_SANDBOX'
                ? 'bg-[#DCE0D9] text-[#181B19] font-semibold shadow-sm'
                : 'text-[#949C96] hover:text-[#EAECE9]'
            }`}
          >
            Maintenance
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('AIRWORTHINESS')}
            aria-label="Airworthiness Release Form 8130-3"
            className={`px-5 py-1.5 rounded-full text-[13px] transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'AIRWORTHINESS'
                ? 'bg-[#DCE0D9] text-[#181B19] font-semibold shadow-sm'
                : 'text-[#949C96] hover:text-[#EAECE9]'
            }`}
          >
            Airworthiness
          </button>
        </nav>

        {/* Right: Telemetry Sync Status, SSE Stream Toggle, Search, Bell, Profile */}
        <div className="flex items-center gap-3 shrink-0">
          {/* C-MAPSS Backend Sync Status Badge (Gap 12 Loading/Status indicator) */}
          {isSyncing ? (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono bg-[#B8CE82]/10 text-[#B8CE82] border border-[#B8CE82]/30 shadow-sm animate-pulse">
              <RefreshCw className="w-3 h-3 animate-spin text-[#B8CE82]" />
              <span className="hidden sm:inline">Syncing C-MAPSS...</span>
            </div>
          ) : syncStatus === 'SYNCED' ? (
            <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono bg-[#82A995]/15 text-[#B8CE82] border border-[#B8CE82]/25">
              <span className="w-1.5 h-1.5 rounded-full bg-[#B8CE82] shadow-[0_0_6px_#B8CE82]" />
              <span>FD001 Model Live</span>
            </div>
          ) : (
            <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono bg-[#D97865]/15 text-[#E5A894] border border-[#D97865]/25">
              <span className="w-1.5 h-1.5 rounded-full bg-[#D97865]" />
              <span>Standalone Edge</span>
            </div>
          )}

          {/* SSE Live Telemetry Stream Toggle (Gap 5) */}
          <button
            type="button"
            onClick={() => setIsLiveStreaming(!isLiveStreaming)}
            disabled={!backendOnline}
            title={backendOnline ? (isLiveStreaming ? "Pause Live SSE Telemetry Stream" : "Connect Real-Time SSE Telemetry Stream") : "SSE Streaming requires active backend"}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-medium transition-all cursor-pointer border ${
              isLiveStreaming
                ? 'bg-[#B8CE82]/20 text-[#B8CE82] border-[#B8CE82]/50 shadow-[0_0_10px_rgba(184,206,130,0.25)]'
                : 'bg-[#232725]/80 text-[#949C96] border-white/10 hover:text-[#EAECE9] hover:border-white/20'
            } ${!backendOnline ? 'opacity-40 cursor-not-allowed' : ''}`}
          >
            <Radio className={`w-3 h-3 ${isLiveStreaming ? 'animate-pulse text-[#B8CE82]' : 'text-[#949C96]'}`} />
            <span className="hidden sm:inline">{isLiveStreaming ? `SSE Active (${streamTicks})` : 'SSE Stream'}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('FLEET_ETOPS')}
            title="Search Fleet & Serial Numbers"
            aria-label="Search Fleet"
            className="text-[#949C96] hover:text-[#EAECE9] transition-colors cursor-pointer p-1"
          >
            <Search className="w-[18px] h-[18px]" />
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('AIRWORTHINESS')}
            title="High-Risk Alarms & Airworthiness Dossier"
            aria-label="View High-Risk Alarms"
            className="relative text-[#949C96] hover:text-[#EAECE9] transition-colors cursor-pointer p-1"
          >
            <Bell className="w-[18px] h-[18px]" />
            <span className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full bg-[#D97865] ring-2 ring-[#111A19]" />
          </button>

          <button
            type="button"
            onClick={() => setShowStarDemoModal(true)}
            title="Lead PHM Chief Engineer · Click to view Starfield Showcase"
            aria-label="Engineer Profile and Starfield Showcase"
            className="relative w-8 h-8 rounded-full bg-[#2E3330] border border-white/15 flex items-center justify-center overflow-hidden cursor-pointer hover:border-[#B8CE82] transition-colors"
          >
            <svg viewBox="0 0 36 36" className="w-full h-full">
              <rect width="36" height="36" fill="#2B312E" />
              <circle cx="18" cy="13" r="6" fill="#949C96" />
              <path d="M7 33 C7 25 29 25 29 33" fill="#68726B" />
            </svg>
            <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-[#B8CE82] ring-1 ring-[#111A19]" />
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
            onNavigateToDiagnostics={() => setActiveTab('STAGE_DEGRADATION')}
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
          <div className="relative w-full max-w-5xl rounded-[24px] overflow-hidden border border-white/10 shadow-[0_24px_60px_rgba(0,0,0,0.75)]">
            <button
              type="button"
              onClick={() => setShowStarDemoModal(false)}
              aria-label="Close Starfield Demo"
              className="absolute top-4 right-4 z-30 p-2 rounded-xl bg-[#232725]/90 hover:bg-[#2E3330] border border-white/10 text-[#EAECE9] cursor-pointer"
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
