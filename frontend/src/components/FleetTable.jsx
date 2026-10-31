/**
 * VISION: Fleet Risk & Status Board Table
 * Vital Intelligence for System Integrity, Observation & Nostics
 */

import React, { useState, useMemo } from 'react';
import {
  Search,
  ArrowUpDown,
  AlertTriangle,
  Clock,
  CheckCircle2,
  ChevronRight,
  Filter,
  Flame,
  ShieldAlert,
} from 'lucide-react';

export default function FleetTable({
  fleet = [],
  selectedUnitId = null,
  onSelectUnit = null,
  activeFilter = 'ALL',
  onFilterChange = null,
  className = '',
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('predicted_rul');
  const [sortAsc, setSortAsc] = useState(true);
  const [viewMode, setViewMode] = useState('ENGINES'); // 'ENGINES' | 'ETOPS'

  // Sorting Handler
  const handleSort = (field) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  // ETOPS Aircraft Pairings Generator (Pairs units 1-2, 3-4, ..., 99-100)
  const etopsAircraftList = useMemo(() => {
    const list = [];
    const enginesById = new Map(fleet.map((e) => [e.unit_id, e]));

    for (let i = 1; i <= 100; i += 2) {
      const acIdx = Math.floor((i + 1) / 2);
      const acId = `AC-${100 + acIdx}`;
      const tailNumber = `N787-${String(acIdx).padStart(2, '0')}`;

      const left = enginesById.get(i) || { unit_id: i, predicted_rul: 50, urgency: 'HEALTHY' };
      const right = enginesById.get(i + 1) || { unit_id: i + 1, predicted_rul: 50, urgency: 'HEALTHY' };

      const delta = Math.abs((left.predicted_rul || 0) - (right.predicted_rul || 0));
      const isCritical = left.urgency === 'CRITICAL' || right.urgency === 'CRITICAL' || Math.min(left.predicted_rul || 100, right.predicted_rul || 100) <= 15;
      const isAsymmetric = delta >= 40.0;

      let status = 'COMPLIANT';
      if (isCritical) {
        status = 'CRITICAL_GROUND';
      } else if (isAsymmetric) {
        status = 'ASYMMETRY_WARNING';
      }

      list.push({
        acId,
        tailNumber,
        left,
        right,
        delta: Number(delta.toFixed(1)),
        status,
      });
    }

    return list.filter((ac) => {
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      return (
        ac.acId.toLowerCase().includes(term) ||
        ac.tailNumber.toLowerCase().includes(term) ||
        String(ac.left.unit_id).includes(term) ||
        String(ac.right.unit_id).includes(term) ||
        ac.status.toLowerCase().includes(term)
      );
    });
  }, [fleet, searchTerm]);

  const etopsAsymmetricCount = useMemo(() => {
    return etopsAircraftList.filter((a) => a.status === 'ASYMMETRY_WARNING').length;
  }, [etopsAircraftList]);

  // Filter & Sort Logic
  const filteredFleet = useMemo(() => {
    return fleet.filter((engine) => {
      // Urgency Filter
      if (activeFilter === 'CRITICAL' && engine.urgency !== 'CRITICAL' && engine.predicted_rul >= 20) {
        return false;
      }
      if (activeFilter === 'ADVISORY' && engine.urgency !== 'ADVISORY' && (engine.predicted_rul < 20 || engine.predicted_rul >= 50)) {
        return false;
      }
      if (activeFilter === 'HEALTHY' && engine.urgency !== 'HEALTHY' && engine.predicted_rul < 50) {
        return false;
      }

      // Search Filter
      if (searchTerm) {
        const idMatch = String(engine.unit_id).includes(searchTerm.trim());
        const urgencyMatch = engine.urgency?.toLowerCase().includes(searchTerm.toLowerCase());
        return idMatch || urgencyMatch;
      }

      return true;
    }).sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];
      if (aVal === undefined) aVal = 0;
      if (bVal === undefined) bVal = 0;

      if (typeof aVal === 'string') {
        return sortAsc ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return sortAsc ? aVal - bVal : bVal - aVal;
    });
  }, [fleet, activeFilter, searchTerm, sortField, sortAsc]);

  const getUrgencyBadge = (urgency, rul) => {
    if (urgency === 'CRITICAL' || rul < 20) {
      return {
        label: 'CRITICAL',
        sub: 'Overhaul Required',
        bg: 'bg-rose-950/80 text-rose-300 border-rose-500/50',
        dot: 'bg-rose-500 animate-ping',
        icon: AlertTriangle,
      };
    }
    if (urgency === 'ADVISORY' || (rul >= 20 && rul < 50)) {
      return {
        label: 'ADVISORY',
        sub: 'Inspect in 15c',
        bg: 'bg-amber-950/80 text-amber-300 border-amber-500/50',
        dot: 'bg-amber-500',
        icon: Clock,
      };
    }
    return {
      label: 'HEALTHY',
      sub: 'Nominal Flight',
      bg: 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50',
      dot: 'bg-emerald-500',
      icon: CheckCircle2,
    };
  };

  return (
    <div className={`bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col ${className}`}>
      {/* Table Header Bar with Search & Urgency Filters */}
      <div className="p-4 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3 bg-slate-950/60">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              placeholder={viewMode === 'ENGINES' ? "Search Unit ID..." : "Search Tail or Unit..."}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-700/60 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 font-mono w-44"
            />
          </div>

          {/* View Mode Toggle: Engines vs ETOPS Wings */}
          <div className="flex items-center space-x-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setViewMode('ENGINES')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-medium transition-colors ${
                viewMode === 'ENGINES'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Engines ({fleet.length})
            </button>
            <button
              onClick={() => setViewMode('ETOPS')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-medium transition-colors flex items-center space-x-1.5 ${
                viewMode === 'ETOPS'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span>ETOPS Wings (50)</span>
              {etopsAsymmetricCount > 0 && (
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              )}
            </button>
          </div>

          {/* Quick Filters */}
          {viewMode === 'ENGINES' && (
            <div className="hidden sm:flex items-center space-x-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
              {['ALL', 'CRITICAL', 'ADVISORY', 'HEALTHY'].map((filterKey) => (
                <button
                  key={filterKey}
                  onClick={() => onFilterChange && onFilterChange(filterKey)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-medium transition-colors ${
                    activeFilter === filterKey
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {filterKey}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center space-x-2 text-xs text-slate-400 font-mono">
          {viewMode === 'ENGINES' ? (
            <span>Showing <strong>{filteredFleet.length}</strong> of <strong>{fleet.length}</strong> units</span>
          ) : (
            <span>Showing <strong>{etopsAircraftList.length}</strong> of <strong>50</strong> Aircraft Wings</span>
          )}
        </div>
      </div>

      {/* Scrollable Table View */}
      {viewMode === 'ENGINES' ? (
      <div className="overflow-x-auto overflow-y-auto max-h-[520px]">
        <table className="w-full text-left text-xs font-sans">
          <thead className="bg-slate-950/80 text-[11px] font-mono text-slate-400 uppercase tracking-wider sticky top-0 z-10 border-b border-slate-800">
            <tr>
              <th
                onClick={() => handleSort('unit_id')}
                className="py-3 px-4 cursor-pointer hover:text-white"
              >
                <div className="flex items-center space-x-1">
                  <span>Unit ID</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th
                onClick={() => handleSort('current_cycle')}
                className="py-3 px-3 cursor-pointer hover:text-white"
              >
                <div className="flex items-center space-x-1">
                  <span>Cycle</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th
                onClick={() => handleSort('predicted_rul')}
                className="py-3 px-4 cursor-pointer hover:text-white"
              >
                <div className="flex items-center space-x-1">
                  <span>Point RUL</span>
                  <ArrowUpDown className="w-3 h-3 text-cyan-400" />
                </div>
              </th>
              <th className="py-3 px-4">
                <span>90% Conformal [LB - UB]</span>
              </th>
              <th
                onClick={() => handleSort('risk_score')}
                className="py-3 px-3 cursor-pointer hover:text-white"
              >
                <div className="flex items-center space-x-1">
                  <span>Risk Score</span>
                  <ArrowUpDown className="w-3 h-3" />
                </div>
              </th>
              <th className="py-3 px-3">
                <span>Health Index</span>
              </th>
              <th className="py-3 px-4 text-center">
                <span>Maintenance Action</span>
              </th>
              <th className="py-3 px-2"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-mono text-slate-300">
            {filteredFleet.map((engine) => {
              const isSelected = selectedUnitId === engine.unit_id;
              const badge = getUrgencyBadge(engine.urgency, engine.predicted_rul);
              const BadgeIcon = badge.icon;
              const confLB = engine.conformal_lower_90 !== undefined
                ? engine.conformal_lower_90.toFixed(1)
                : Math.max(0, engine.predicted_rul - 12).toFixed(1);
              const confUB = engine.conformal_upper_90 !== undefined
                ? engine.conformal_upper_90.toFixed(1)
                : (engine.predicted_rul + 15).toFixed(1);

              const health = engine.health_index !== undefined
                ? engine.health_index
                : Math.min(100, Math.max(5, (engine.predicted_rul / 125) * 100));

              return (
                <tr
                  key={engine.unit_id}
                  onClick={() => onSelectUnit && onSelectUnit(engine.unit_id)}
                  className={`cursor-pointer transition-colors duration-150 ${
                    isSelected
                      ? 'bg-cyan-950/60 border-l-4 border-cyan-400 font-semibold text-white'
                      : 'hover:bg-slate-800/50'
                  }`}
                >
                  {/* Unit ID */}
                  <td className="py-2.5 px-4 font-bold text-slate-100 flex items-center space-x-2">
                    <span className="w-6 h-6 rounded-lg bg-slate-800 flex items-center justify-center text-[11px] text-cyan-300 border border-slate-700">
                      {engine.unit_id}
                    </span>
                    <span>Turbofan #{engine.unit_id}</span>
                  </td>

                  {/* Current Cycle */}
                  <td className="py-2.5 px-3 text-slate-400">
                    {engine.current_cycle}
                  </td>

                  {/* Predicted RUL */}
                  <td className="py-2.5 px-4">
                    <span
                      className={`text-sm font-bold ${
                        engine.predicted_rul < 20
                          ? 'text-rose-400'
                          : engine.predicted_rul < 50
                          ? 'text-amber-400'
                          : 'text-emerald-400'
                      }`}
                    >
                      {engine.predicted_rul.toFixed(1)}{' '}
                      <span className="text-[10px] text-slate-500 font-normal">cycles</span>
                    </span>
                  </td>

                  {/* Conformal Range */}
                  <td className="py-2.5 px-4">
                    <div className="flex items-center space-x-1.5 text-xs">
                      <span className="font-semibold text-cyan-300">[{confLB}</span>
                      <span className="text-slate-500">–</span>
                      <span className="text-slate-300">{confUB}]</span>
                      <span className="text-[10px] text-slate-500">cyc</span>
                    </div>
                  </td>

                  {/* Risk Score */}
                  <td className="py-2.5 px-3">
                    <div className="flex items-center space-x-1.5">
                      <div className="w-12 bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            (engine.risk_score || 0) > 60
                              ? 'bg-rose-500'
                              : (engine.risk_score || 0) > 30
                              ? 'bg-amber-500'
                              : 'bg-emerald-500'
                          }`}
                          style={{ width: `${Math.min(100, engine.risk_score || 10)}%` }}
                        />
                      </div>
                      <span className="text-[11px] text-slate-400">
                        {((engine.risk_score || 0)).toFixed(0)}%
                      </span>
                    </div>
                  </td>

                  {/* Health Index */}
                  <td className="py-2.5 px-3">
                    <div className="flex items-center space-x-1.5">
                      <span
                        className={`text-[11px] font-bold ${
                          health < 50
                            ? 'text-rose-400'
                            : health < 80
                            ? 'text-amber-400'
                            : 'text-emerald-400'
                        }`}
                      >
                        {health.toFixed(0)}%
                      </span>
                    </div>
                  </td>

                  {/* Maintenance Action Badge */}
                  <td className="py-2.5 px-4 text-center">
                    <span
                      className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono border ${badge.bg}`}
                    >
                      <BadgeIcon className="w-3 h-3" />
                      <span>{badge.label}</span>
                    </span>
                  </td>

                  {/* Select Icon */}
                  <td className="py-2.5 px-2 text-right text-slate-500">
                    <ChevronRight className={`w-4 h-4 ${isSelected ? 'text-cyan-400' : ''}`} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      ) : (
        /* Aircraft Twin-Engine ETOPS Pairing Board */
        <div className="overflow-x-auto overflow-y-auto max-h-[520px]">
          <table className="w-full text-left text-xs font-sans">
            <thead className="bg-slate-950/80 text-[11px] font-mono text-slate-400 uppercase tracking-wider sticky top-0 z-10 border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Aircraft Tail</th>
                <th className="py-3 px-4">Left Wing Engine</th>
                <th className="py-3 px-4">Right Wing Engine</th>
                <th className="py-3 px-4">Wing RUL Delta (&Delta;)</th>
                <th className="py-3 px-4 text-center">ETOPS Airworthiness Status</th>
                <th className="py-3 px-4 text-right">Inspect Turbofan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-slate-300">
              {etopsAircraftList.map((ac) => {
                const isSelected = selectedUnitId === ac.left.unit_id || selectedUnitId === ac.right.unit_id;
                const isAsymmetric = ac.status === 'ASYMMETRY_WARNING';
                const isCritical = ac.status === 'CRITICAL_GROUND';

                return (
                  <tr
                    key={ac.acId}
                    className={`transition-colors duration-150 ${
                      isSelected ? 'bg-cyan-950/50 border-l-4 border-cyan-400 text-white' : 'hover:bg-slate-800/40'
                    }`}
                  >
                    {/* Aircraft ID & Tail */}
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-cyan-300 text-[11px] font-bold">
                          {ac.acId}
                        </span>
                        <div>
                          <span className="font-bold text-slate-100">{ac.tailNumber}</span>
                          <span className="text-[10px] text-slate-500 block">Boeing 787 Twin-Spool</span>
                        </div>
                      </div>
                    </td>

                    {/* Left Wing Engine */}
                    <td className="py-3 px-4">
                      <button
                        onClick={() => onSelectUnit && onSelectUnit(ac.left.unit_id)}
                        className="text-left group hover:text-cyan-300 transition-colors"
                      >
                        <div className="flex items-center space-x-1.5">
                          <span className="text-slate-400">L:</span>
                          <span className="font-bold text-slate-200 group-hover:text-cyan-300">Unit #{ac.left.unit_id}</span>
                          <span
                            className={`text-xs font-bold ${
                              ac.left.predicted_rul < 20 ? 'text-rose-400' : ac.left.predicted_rul < 50 ? 'text-amber-400' : 'text-emerald-400'
                            }`}
                          >
                            ({(ac.left.predicted_rul || 0).toFixed(1)}c)
                          </span>
                        </div>
                      </button>
                    </td>

                    {/* Right Wing Engine */}
                    <td className="py-3 px-4">
                      <button
                        onClick={() => onSelectUnit && onSelectUnit(ac.right.unit_id)}
                        className="text-left group hover:text-cyan-300 transition-colors"
                      >
                        <div className="flex items-center space-x-1.5">
                          <span className="text-slate-400">R:</span>
                          <span className="font-bold text-slate-200 group-hover:text-cyan-300">Unit #{ac.right.unit_id}</span>
                          <span
                            className={`text-xs font-bold ${
                              ac.right.predicted_rul < 20 ? 'text-rose-400' : ac.right.predicted_rul < 50 ? 'text-amber-400' : 'text-emerald-400'
                            }`}
                          >
                            ({(ac.right.predicted_rul || 0).toFixed(1)}c)
                          </span>
                        </div>
                      </button>
                    </td>

                    {/* Wing RUL Delta */}
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-2">
                        <div className="w-16 bg-slate-800 h-1.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              ac.delta >= 40 ? 'bg-amber-400' : 'bg-cyan-500'
                            }`}
                            style={{ width: `${Math.min(100, (ac.delta / 70) * 100)}%` }}
                          />
                        </div>
                        <span className={`text-xs font-bold ${ac.delta >= 40 ? 'text-amber-400' : 'text-slate-300'}`}>
                          &Delta; {ac.delta} cyc
                        </span>
                      </div>
                    </td>

                    {/* ETOPS Airworthiness Status */}
                    <td className="py-3 px-4 text-center">
                      {isCritical ? (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-950/80 text-rose-300 border border-rose-500/50">
                          <AlertTriangle className="w-3 h-3 text-rose-400" />
                          <span>CRITICAL GROUND</span>
                        </span>
                      ) : isAsymmetric ? (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-950/80 text-amber-300 border border-amber-500/50">
                          <ShieldAlert className="w-3 h-3 text-amber-400" />
                          <span>ASYMMETRY WARNING (&Delta; &gt; 40c)</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-500/50">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          <span>ETOPS COMPLIANT</span>
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1">
                        <button
                          onClick={() => onSelectUnit && onSelectUnit(ac.left.unit_id)}
                          className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] transition-colors"
                        >
                          L #{ac.left.unit_id}
                        </button>
                        <button
                          onClick={() => onSelectUnit && onSelectUnit(ac.right.unit_id)}
                          className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] transition-colors"
                        >
                          R #{ac.right.unit_id}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

