/**
 * VISION: Header & Navigation Bar
 * Vital Intelligence for System Integrity, Observation & Nostics
 */

import React from 'react';
import {
  Activity,
  Layers,
  BarChart3,
  DollarSign,
  Radio,
  HelpCircle,
  Database,
  Wifi,
  WifiOff,
  Plane,
} from 'lucide-react';
import ModeToggle from './ModeToggle.jsx';

export default function Header({
  currentSubset = 'FD001',
  onSubsetChange,
  currentMode,
  onModeChange,
  activeTab = 'fleet',
  onTabChange,
  apiConnected = true,
  onOpenIntegrityCard,
  onOpenDemoTour,
}) {
  const subsets = [
    { id: 'FD001', label: 'FD001 (1 Regime, HPC Wear)' },
    { id: 'FD002', label: 'FD002 (6 Regimes, HPC Wear)' },
    { id: 'FD003', label: 'FD003 (1 Regime, HPC + Fan Wear)' },
    { id: 'FD004', label: 'FD004 (6 Regimes, Multi-Fault)' },
  ];

  const navItems = [
    { id: 'fleet', label: 'Fleet Status Board', icon: Layers },
    { id: 'detail', label: 'Engine Digital Twin', icon: BarChart3 },
    { id: 'etops', label: 'ETOPS Compliance', icon: Plane },
    { id: 'economics', label: 'Economic Sandbox', icon: DollarSign },
    { id: 'stream', label: 'Live Replay Stream', icon: Radio },
  ];

  return (
    <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-xl border-b border-slate-800/80 px-4 lg:px-6 py-3">
      <div className="flex items-center justify-between gap-4">
        {/* Brand & Subtitle */}
        <div className="flex items-center space-x-3 shrink-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 border border-cyan-400/40">
            <Activity className="w-5 h-5 text-white animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-base font-extrabold tracking-wider text-white font-mono">
                VISION
              </h1>
              <span className="text-[10px] bg-cyan-950/80 text-cyan-300 font-mono px-1.5 py-0.5 rounded border border-cyan-700/50">
                AERO-PHM
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block font-sans">
              Vital Intelligence for System Integrity, Observation & Nostics
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="hidden md:flex items-center space-x-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800 shadow-inner">
          {navItems.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-cyan-400' : 'text-slate-500'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Right Controls: Subset Selector, Mode Toggle, System Health */}
        <div className="flex items-center space-x-3 shrink-0">
          {/* C-MAPSS Subset Selector */}
          <div className="flex items-center space-x-1.5 bg-slate-900/80 px-2.5 py-1.5 rounded-xl border border-slate-800 text-xs">
            <Database className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={currentSubset}
              onChange={(e) => onSubsetChange(e.target.value)}
              className="bg-transparent text-slate-200 text-xs font-mono font-semibold focus:outline-none cursor-pointer"
              title="Select C-MAPSS Dataset Subset"
            >
              {subsets.map((s) => (
                <option key={s.id} value={s.id} className="bg-slate-900 text-slate-200">
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          {/* Telemetry Mode Toggle */}
          <ModeToggle
            currentMode={currentMode}
            onModeChange={onModeChange}
            onOpenIntegrityCard={onOpenIntegrityCard}
          />

          {/* Backend Connection Pulse */}
          <div
            className={`hidden sm:flex items-center space-x-1.5 px-2.5 py-1.5 rounded-xl border text-[11px] font-mono ${
              apiConnected
                ? 'bg-emerald-950/40 border-emerald-800/40 text-emerald-400'
                : 'bg-rose-950/40 border-rose-800/40 text-rose-400'
            }`}
            title={apiConnected ? 'FastAPI Backend Online' : 'Connecting to Backend / Offline Fallback'}
          >
            {apiConnected ? (
              <>
                <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                <span>API: LIVE</span>
              </>
            ) : (
              <>
                <WifiOff className="w-3.5 h-3.5 text-rose-400" />
                <span>API: OFFLINE</span>
              </>
            )}
          </div>

          {/* Demo Tour Button */}
          {onOpenDemoTour && (
            <button
              onClick={onOpenDemoTour}
              className="px-2.5 py-1.5 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 border border-indigo-500/40 text-xs font-medium transition-all"
              title="5-Minute Judge Presentation Walkthrough"
            >
              Tour
            </button>
          )}
        </div>
      </div>

      {/* Mobile Navigation Tabs */}
      <div className="flex md:hidden items-center justify-around mt-2 pt-2 border-t border-slate-800/80">
        {navItems.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-medium ${
                isActive ? 'text-cyan-300 font-bold' : 'text-slate-400'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label.split(' ')[0]}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
}

