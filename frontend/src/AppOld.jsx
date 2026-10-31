/**
 * VISION: Aerospace Command Center & 3D Digital Twin Application
 * Vital Intelligence for System Integrity, Observation & Nostics (PS 12)
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Header from './components/Header.jsx';
import FleetStatCards from './components/FleetStatCards.jsx';
import FleetTable from './components/FleetTable.jsx';
import EngineDetail from './components/EngineDetail.jsx';
import EconomicSandbox from './components/EconomicSandbox.jsx';
import LiveReplayControls from './components/LiveReplayControls.jsx';
import TurbofanCanvas from './components_3d/TurbofanCanvas.jsx';
import ScientificIntegrityCard from './components/ScientificIntegrityCard.jsx';
import DemoTourModal from './components/DemoTourModal.jsx';
import JudgePresenterBar from './components/JudgePresenterBar.jsx';
import EtopsCompliancePanel from './components/EtopsCompliancePanel.jsx';

import { api } from './services/api.js';
import { TelemetryStreamClient } from './services/streamClient.js';
import { OFFLINE_FLEET_CACHE, getOfflineEngineDetail } from './services/apiFallback.js';
import {
  TELEMETRY_MODES,
  getSavedTelemetryMode,
  saveTelemetryMode,
} from './utils/telemetryModes.js';
import { DEMO_PRESETS } from './utils/demoPresets.js';
import {
  AlertTriangle,
  Radio,
  Layers,
  BarChart3,
  DollarSign,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

export default function App() {
  // Navigation & Mode States
  const [currentSubset, setCurrentSubset] = useState('FD001');
  const [currentMode, setCurrentMode] = useState(getSavedTelemetryMode());
  const [activeTab, setActiveTab] = useState('fleet');
  const [activeFilter, setActiveFilter] = useState('ALL');

  // Fleet & Engine Data States
  const [fleet, setFleet] = useState(OFFLINE_FLEET_CACHE);
  const [selectedUnitId, setSelectedUnitId] = useState(1);
  const [selectedEngine, setSelectedEngine] = useState(null);
  const [apiConnected, setApiConnected] = useState(true);
  const [isUsingFallback, setIsUsingFallback] = useState(false);

  // Modals & Presets
  const [isIntegrityCardOpen, setIsIntegrityCardOpen] = useState(false);
  const [isDemoTourOpen, setIsDemoTourOpen] = useState(false);
  const [activeScenario, setActiveScenario] = useState(null);

  // Live SSE Telemetry Replay Stream States
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamSpeed, setStreamSpeed] = useState(1.0);
  const [lastStreamEvent, setLastStreamEvent] = useState(null);
  const streamClientRef = useRef(null);

  // 1. Check Backend Health on Mount
  useEffect(() => {
    let isMounted = true;
    api
      .getHealth()
      .then(() => {
        if (isMounted) setApiConnected(true);
      })
      .catch(() => {
        if (isMounted) {
          setApiConnected(false);
          setIsUsingFallback(true);
        }
      });
    return () => {
      isMounted = false;
    };
  }, []);

  // 2. Fetch Fleet Overview when subset changes
  useEffect(() => {
    let isMounted = true;

    api
      .getFleetOverview(currentSubset)
      .then((data) => {
        if (!isMounted) return;
        if (data && data.engines && data.engines.length > 0) {
          setFleet(data.engines);
          setIsUsingFallback(false);
        }
      })
      .catch(() => {
        if (!isMounted) return;
        console.warn(`[VISION] Using offline cache for subset ${currentSubset}`);
        setFleet(OFFLINE_FLEET_CACHE);
        setIsUsingFallback(true);
      });

    return () => {
      isMounted = false;
    };
  }, [currentSubset]);

  // 3. Fetch Selected Engine Detail
  useEffect(() => {
    let isMounted = true;

    api
      .getEngineDetail(selectedUnitId, currentSubset)
      .then((data) => {
        if (!isMounted) return;
        setSelectedEngine(data);
      })
      .catch(() => {
        if (!isMounted) return;
        const offlineData = getOfflineEngineDetail(selectedUnitId);
        setSelectedEngine(offlineData);
      });

    return () => {
      isMounted = false;
    };
  }, [selectedUnitId, currentSubset]);

  // 4. Handle Telemetry Mode Change
  const handleModeChange = (newMode) => {
    setCurrentMode(newMode);
    saveTelemetryMode(newMode.id);
  };

  // 5. Handle Live Streaming Telemetry
  const handleToggleStream = useCallback(() => {
    if (isStreaming) {
      if (streamClientRef.current) {
        streamClientRef.current.disconnect();
      }
      setIsStreaming(false);
    } else {
      const cohort = fleet.slice(0, 10).map((e) => e.unit_id);
      const client = new TelemetryStreamClient({
        units: cohort.length > 0 ? cohort : [1, 10, 24, 34, 45],
        subset: currentSubset,
        speed: streamSpeed,
        onCycleUpdate: (payload) => {
          setLastStreamEvent(payload);

          // Update fleet entry live
          setFleet((prevFleet) => {
            return prevFleet.map((e) => {
              if (e.unit_id === payload.unit_id) {
                return {
                  ...e,
                  current_cycle: payload.cycle,
                  predicted_rul: payload.rul_prediction,
                  conformal_lower_90: payload.conformal_lower_90,
                  conformal_upper_90: payload.conformal_upper_90,
                  urgency: payload.urgency,
                  sensors: payload.sensors,
                };
              }
              return e;
            });
          });

          // If current selected engine receives an update, reflect it
          setSelectedEngine((prevEngine) => {
            if (prevEngine && prevEngine.unit_id === payload.unit_id) {
              return {
                ...prevEngine,
                current_cycle: payload.cycle,
                predicted_rul: payload.rul_prediction,
                conformal_lower_90: payload.conformal_lower_90,
                conformal_upper_90: payload.conformal_upper_90,
                sensors: payload.sensors,
                urgency: payload.urgency,
              };
            }
            return prevEngine;
          });
        },
        onError: () => {
          setIsStreaming(false);
        },
      });

      streamClientRef.current = client;
      client.connect();
      setIsStreaming(true);
    }
  }, [isStreaming, fleet, currentSubset, streamSpeed]);

  const handleStreamSpeedChange = (speed) => {
    setStreamSpeed(speed);
    if (streamClientRef.current) {
      streamClientRef.current.setSpeed(speed);
    }
  };

  const handleStepNextCycle = useCallback(() => {
    setFleet((prevFleet) => {
      return prevFleet.map((e) => {
        if (e.unit_id === selectedUnitId) {
          const nextCycle = (e.current_cycle || 100) + 1;
          const nextRul = Math.max(0, (e.predicted_rul || 50) - 1);
          const nextLb = Math.max(0, (e.conformal_lower_90 || 40) - 1);
          const urgency = nextLb <= 15 ? 'CRITICAL' : nextRul < 50 ? 'ADVISORY' : 'HEALTHY';
          return {
            ...e,
            current_cycle: nextCycle,
            predicted_rul: nextRul,
            conformal_lower_90: nextLb,
            urgency,
          };
        }
        return e;
      });
    });

    setSelectedEngine((prev) => {
      if (!prev) return prev;
      const nextCycle = (prev.current_cycle || 100) + 1;
      const nextRul = Math.max(0, (prev.predicted_rul || 50) - 1);
      const nextLb = Math.max(0, (prev.conformal_lower_90 || 40) - 1);
      const urgency = nextLb <= 15 ? 'CRITICAL' : nextRul < 50 ? 'ADVISORY' : 'HEALTHY';
      return {
        ...prev,
        current_cycle: nextCycle,
        predicted_rul: nextRul,
        conformal_lower_90: nextLb,
        urgency,
      };
    });
  }, [selectedUnitId]);

  const handleResetStream = useCallback(() => {
    if (streamClientRef.current) {
      streamClientRef.current.disconnect();
    }
    setIsStreaming(false);
    setLastStreamEvent(null);
  }, []);

  // 6. Handle Preset Launch
  const handleSelectScenario = (preset) => {
    setActiveScenario(preset);
    if (preset.subset && preset.subset !== currentSubset) {
      setCurrentSubset(preset.subset);
    }
    if (preset.unitId) {
      setSelectedUnitId(preset.unitId);
    }
    if (preset.tab) {
      setActiveTab(preset.tab);
    }
  };

  const handleResetDemo = () => {
    setActiveScenario(null);
    setCurrentSubset('FD001');
    setSelectedUnitId(1);
    setActiveTab('fleet');
    setActiveFilter('ALL');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans pb-20">
      {/* Top Application Header */}
      <Header
        currentSubset={currentSubset}
        onSubsetChange={setCurrentSubset}
        currentMode={currentMode}
        onModeChange={handleModeChange}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        apiConnected={apiConnected}
        onOpenIntegrityCard={() => setIsIntegrityCardOpen(true)}
        onOpenDemoTour={() => setIsDemoTourOpen(true)}
      />

      {/* Mode Demarcation Banner */}
      {currentMode.id === TELEMETRY_MODES.DEMO_SIMULATION.id ? (
        <div className="bg-amber-950/80 border-b border-amber-500/50 px-4 py-2 text-center text-xs font-mono font-bold text-amber-300 flex items-center justify-center space-x-2 shadow-inner">
          <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
          <span>{TELEMETRY_MODES.DEMO_SIMULATION.banner}</span>
        </div>
      ) : (
        <div className="bg-emerald-950/60 border-b border-emerald-900/60 px-4 py-1.5 text-center text-[11px] font-mono font-semibold text-emerald-400 flex items-center justify-center space-x-2">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span>{TELEMETRY_MODES.EMPIRICAL.banner} &bull; Authentic NASA Ames PCoE Dataset</span>
        </div>
      )}

      {/* Offline Cache Toast (if API is unreachable) */}
      {isUsingFallback && (
        <div className="bg-amber-950/90 border-b border-amber-600/60 px-4 py-1.5 text-center text-xs font-mono text-amber-200 flex items-center justify-center space-x-2">
          <AlertTriangle className="w-4 h-4 text-amber-400" />
          <span>Using Local In-Memory Offline Telemetry Cache (Backend Reconnecting)</span>
        </div>
      )}

      {/* Main Workspace Body */}
      <main className="flex-1 max-w-[1720px] w-full mx-auto p-4 lg:p-6 space-y-5">
        {/* Tab 1: Fleet Status Board */}
        {activeTab === 'fleet' && (
          <div className="space-y-4 animate-fade-in">
            {/* KPI Summary Cards */}
            <FleetStatCards
              fleet={fleet}
              activeFilter={activeFilter}
              onFilterStatus={setActiveFilter}
            />

            {/* Split View: 3D Twin (Left) & Fleet Table (Right) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              {/* Left: Quick 3D Engine Preview of Selected Unit */}
              <div className="lg:col-span-5 xl:col-span-4 flex flex-col space-y-3">
                <div className="h-[460px] w-full rounded-2xl overflow-hidden border border-slate-800 shadow-2xl relative">
                  <TurbofanCanvas
                    healthData={{
                      fan: 95,
                      lpc: 90,
                      hpc: selectedEngine ? Math.max(10, Math.min(100, (selectedEngine.predicted_rul / 125) * 100)) : 80,
                      combustor: 88,
                      hpt: selectedEngine ? Math.max(15, Math.min(100, (selectedEngine.predicted_rul / 125) * 105)) : 85,
                      lpt: 86,
                      sensors: selectedEngine?.latest_sensors || {},
                    }}
                    latestSensors={selectedEngine?.latest_sensors || {}}
                    selectedComponent="hpc"
                  />
                </div>

                {/* Inspect Full Detail Button */}
                <button
                  onClick={() => setActiveTab('detail')}
                  className="w-full py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-xl text-xs font-mono font-bold transition-all shadow-lg shadow-cyan-600/20 flex items-center justify-center space-x-2"
                >
                  <BarChart3 className="w-4 h-4" />
                  <span>Inspect Engine #{selectedUnitId} Deep Telemetry & Fan Chart</span>
                </button>
              </div>

              {/* Right: Fleet Risk Table */}
              <div className="lg:col-span-7 xl:col-span-8">
                <FleetTable
                  fleet={fleet}
                  selectedUnitId={selectedUnitId}
                  onSelectUnit={(id) => setSelectedUnitId(id)}
                  activeFilter={activeFilter}
                  onFilterChange={setActiveFilter}
                />
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Engine Digital Twin Detail View */}
        {activeTab === 'detail' && selectedEngine && (
          <div className="animate-fade-in">
            <EngineDetail
              engine={selectedEngine}
              fleet={fleet}
              onSelectUnit={(id) => setSelectedUnitId(id)}
              onBackToFleet={() => setActiveTab('fleet')}
            />
          </div>
        )}

        {/* Tab 3: Economic Maintenance Sandbox */}
        {activeTab === 'economics' && (
          <div className="animate-fade-in">
            <EconomicSandbox
              fleet={fleet}
              onSelectUnit={(id) => {
                setSelectedUnitId(id);
                setActiveTab('detail');
              }}
            />
          </div>
        )}

        {/* Tab 4: ETOPS-180 Airworthiness Compliance Engine */}
        {activeTab === 'etops' && (
          <div className="animate-fade-in">
            <EtopsCompliancePanel
              subset={currentSubset}
              onSelectUnit={(id) => {
                setSelectedUnitId(id);
                setActiveTab('detail');
              }}
            />
          </div>
        )}

        {/* Tab 5: Live Telemetry Replay Streaming View */}
        {activeTab === 'stream' && (
          <div className="space-y-4 animate-fade-in">
            {/* Live Replay Transport Controls Ribbon */}
            <LiveReplayControls
              isStreaming={isStreaming}
              onToggleStream={handleToggleStream}
              onStepNextCycle={handleStepNextCycle}
              speed={streamSpeed}
              onSpeedChange={handleStreamSpeedChange}
              onResetStream={handleResetStream}
              lastEvent={lastStreamEvent}
            />

            {/* Split View with 3D Twin and Live Re-ranking Fleet Table */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              <div className="lg:col-span-5 h-[500px] rounded-2xl overflow-hidden border border-slate-800 shadow-2xl">
                <TurbofanCanvas
                  healthData={{
                    fan: 95,
                    lpc: 90,
                    hpc: selectedEngine ? Math.max(10, Math.min(100, (selectedEngine.predicted_rul / 125) * 100)) : 80,
                    combustor: 88,
                    hpt: 85,
                    lpt: 86,
                    sensors: lastStreamEvent?.sensors || selectedEngine?.latest_sensors || {},
                  }}
                  latestSensors={lastStreamEvent?.sensors || selectedEngine?.latest_sensors || {}}
                  n1Speed={Math.max(0.4, Math.min(2.5, (((lastStreamEvent?.sensors?.s8 || selectedEngine?.latest_sensors?.s8 || selectedEngine?.sensors?.s8 || 2388.0) / 2388.0))))}
                  n2Speed={Math.max(0.4, Math.min(2.8, ((((lastStreamEvent?.sensors?.s9 || selectedEngine?.latest_sensors?.s9 || selectedEngine?.sensors?.s9 || 9050.0) / 9050.0) * 1.4))))}
                />
              </div>

              <div className="lg:col-span-7">
                <FleetTable
                  fleet={fleet}
                  selectedUnitId={selectedUnitId}
                  onSelectUnit={(id) => setSelectedUnitId(id)}
                  activeFilter={activeFilter}
                  onFilterChange={setActiveFilter}
                />
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Floating Bottom Judge & Presentation Ribbon */}
      <JudgePresenterBar
        activeScenario={activeScenario}
        onSelectScenario={handleSelectScenario}
        onResetDemo={handleResetDemo}
        onOpenIntegrityCard={() => setIsIntegrityCardOpen(true)}
      />

      {/* Modals */}
      <ScientificIntegrityCard
        isOpen={isIntegrityCardOpen}
        onClose={() => setIsIntegrityCardOpen(false)}
      />

      <DemoTourModal
        isOpen={isDemoTourOpen}
        onClose={() => setIsDemoTourOpen(false)}
        onLaunchScenario={(scenarioId) => {
          const match = DEMO_PRESETS.find((p) => p.id === scenarioId);
          if (match) handleSelectScenario(match);
        }}
      />
    </div>
  );
}

