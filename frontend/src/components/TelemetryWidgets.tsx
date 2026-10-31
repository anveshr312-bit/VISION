import React from 'react';
import { AlertTriangle, ArrowUpRight } from 'lucide-react';
import { TrajectoryPoint } from '../services/prognosticsEngine';

/**
 * Dotted semi-circular arc gauge + vertical equalizer bars
 * Styled with Overview warm dark slate-charcoal glassmorphism and JetBrains Mono readouts
 */
interface DottedArcEqualizerProps {
  powerLabel: string;
  powerValue: string;
  powerUnit: string;
  fraction: number; // 0 to 1
  metricLeftLabel: string;
  metricLeftValue: string;
  metricRightLabel: string;
  metricRightValue: string;
  trajectory: TrajectoryPoint[];
}

export const DottedArcEqualizerWidget: React.FC<DottedArcEqualizerProps> = ({
  powerLabel,
  powerValue,
  powerUnit,
  fraction,
  metricLeftLabel,
  metricLeftValue,
  metricRightLabel,
  metricRightValue,
  trajectory,
}) => {
  const clamped = Math.max(0.05, Math.min(1, fraction));
  const width = 220;
  const height = 104;
  const cx = width / 2;
  const cy = 88;
  const rOuter = 66;
  const rInner = 54;

  const totalTicks = 25;
  const ticks = Array.from({ length: totalTicks }, (_, i) => {
    const t = i / (totalTicks - 1);
    const angleRad = Math.PI - t * Math.PI;
    const x1 = cx + rInner * Math.cos(angleRad);
    const y1 = cy - rInner * Math.sin(angleRad);
    const x2 = cx + rOuter * Math.cos(angleRad);
    const y2 = cy - rOuter * Math.sin(angleRad);
    const active = t <= clamped;
    return { x1, y1, x2, y2, active };
  });

  const eqBars = Array.from({ length: 15 }, (_, i) => {
    const pt = trajectory[i % Math.max(1, trajectory.length)];
    const base = pt ? (pt.t30Temp - 1550) / 60 : 0.5;
    const wave = Math.sin(i * 0.85) * 0.28 + 0.52;
    const hFrac = Math.max(0.18, Math.min(0.95, base * 0.5 + wave * 0.5));
    const isYellow = i % 2 === 1;
    return { hFrac, isYellow };
  });

  return (
    <div className="space-y-3">
      {/* Semi-circular dotted arc gauge */}
      <div className="relative flex flex-col items-center">
        <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
          <path
            d={`M ${cx - rOuter - 8} ${cy} A ${rOuter + 8} ${rOuter + 8} 0 0 1 ${cx + rOuter + 8} ${cy}`}
            fill="none"
            stroke="rgba(184,206,130,0.22)"
            strokeWidth="1"
            strokeDasharray="2 3"
          />
          {ticks.map((t, idx) => (
            <line
              key={idx}
              x1={t.x1.toFixed(1)}
              y1={t.y1.toFixed(1)}
              x2={t.x2.toFixed(1)}
              y2={t.y2.toFixed(1)}
              stroke={t.active ? '#B8CE82' : 'rgba(255,255,255,0.12)'}
              strokeWidth="2.4"
              strokeLinecap="round"
            />
          ))}
        </svg>

        <div className="absolute bottom-2 text-center">
          <div className="text-[10px] uppercase tracking-wider text-[#949C96]">{powerLabel}</div>
          <div className="text-base font-mono font-bold text-[#EAECE9] tracking-tight">
            {powerValue} <span className="text-xs font-mono font-normal text-[#B8CE82]">{powerUnit}</span>
          </div>
        </div>

        <div className="w-full flex justify-between px-4 text-[10px] font-mono text-[#949C96] -mt-1">
          <span>0</span>
          <span>100%</span>
        </div>
      </div>

      {/* Two key-value summary lines */}
      <div className="space-y-1.5 text-xs pt-1.5 border-t border-white/[0.08]">
        <div className="flex items-center justify-between">
          <span className="text-[10px] uppercase tracking-wider text-[#949C96]">{metricLeftLabel}</span>
          <span className="font-mono font-semibold text-[#B8CE82] tabular-nums">{metricLeftValue}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[10px] uppercase tracking-wider text-[#949C96]">{metricRightLabel}</span>
          <span className="font-mono font-semibold text-[#EAECE9] tabular-nums">{metricRightValue}</span>
        </div>
      </div>

      {/* Vertical Equalizer Bar Chart */}
      <div className="pt-1">
        <div className="flex items-center justify-between h-16 px-2 gap-1.5">
          <div className="flex flex-col justify-between h-full text-[9px] font-mono text-[#949C96]">
            <span>1630</span>
            <span>°R</span>
            <span>1520</span>
          </div>

          <div className="flex-1 flex items-center justify-between h-full gap-1 px-1">
            {eqBars.map((bar, idx) => (
              <div key={idx} className="h-full flex items-center">
                <div
                  className={`w-1 rounded-full transition-all duration-300 ${
                    bar.isYellow ? 'bg-[#D8B65E]' : 'bg-[#B8CE82]'
                  }`}
                  style={{ height: `${Math.round(bar.hFrac * 100)}%` }}
                />
              </div>
            ))}
          </div>

          <div className="flex flex-col justify-between h-full text-[9px] font-mono text-[#949C96] text-right">
            <span>45</span>
            <span>OPR</span>
            <span>28</span>
          </div>
        </div>

        <div className="flex items-center justify-center gap-4 text-[10px] uppercase tracking-wider text-[#949C96] mt-1.5">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-0.5 bg-[#B8CE82] inline-block" />
            gas path
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-0.5 bg-[#D8B65E] inline-block" />
            thermal load
          </span>
        </div>
      </div>
    </div>
  );
};

/**
 * Circular Compass Spool Dial with glowing center orb and high-density monospace readouts
 */
interface CircularCompassSpoolDialProps {
  centerTitle: string;
  centerValue: string;
  bottomLabel: string;
  bottomValue: string;
  angleDeg: number;
  leftReadouts: Array<{ label: string; value: string }>;
}

export const CircularCompassSpoolDial: React.FC<CircularCompassSpoolDialProps> = ({
  centerTitle,
  centerValue,
  bottomLabel,
  bottomValue,
  angleDeg,
  leftReadouts,
}) => {
  const size = 132;
  const cx = size / 2;
  const cy = size / 2;
  const rTicks = 52;
  const rOrb = 26;

  const ticks = Array.from({ length: 36 }, (_, i) => {
    const rad = (i / 36) * Math.PI * 2;
    const isMajor = i % 6 === 0;
    const r1 = isMajor ? rTicks - 5 : rTicks - 2.5;
    const r2 = rTicks;
    return {
      x1: cx + r1 * Math.cos(rad),
      y1: cy + r1 * Math.sin(rad),
      x2: cx + r2 * Math.cos(rad),
      y2: cy + r2 * Math.sin(rad),
      isMajor,
    };
  });

  const pointerRad = ((angleDeg - 90) * Math.PI) / 180;
  const px1 = cx + (rTicks - 10) * Math.cos(pointerRad);
  const py1 = cy + (rTicks - 10) * Math.sin(pointerRad);
  const px2 = cx + (rTicks + 4) * Math.cos(pointerRad);
  const py2 = cy + (rTicks + 4) * Math.sin(pointerRad);

  return (
    <div className="flex items-center justify-between gap-3">
      {/* Left stacked micro-readouts */}
      <div className="space-y-2.5 min-w-[92px]">
        {leftReadouts.map((item, idx) => (
          <div key={idx}>
            <div className="text-[10px] uppercase tracking-wider text-[#949C96]">{item.label}</div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs font-mono font-bold text-[#EAECE9] tabular-nums">{item.value}</span>
              <span className="w-5 h-0.5 bg-[#82A995] rounded-full relative">
                <span className="w-1.5 h-1.5 rounded-full bg-[#B8CE82] absolute -top-0.5 left-2" />
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Right Circular Dial */}
      <div className="flex flex-col items-center">
        <div className="relative flex items-center justify-center">
          <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
            {ticks.map((t, i) => (
              <line
                key={i}
                x1={t.x1.toFixed(1)}
                y1={t.y1.toFixed(1)}
                x2={t.x2.toFixed(1)}
                y2={t.y2.toFixed(1)}
                stroke={t.isMajor ? '#B8CE82' : 'rgba(255,255,255,0.16)'}
                strokeWidth={t.isMajor ? '1.5' : '1'}
              />
            ))}

            {/* Glowing center orb */}
            <circle
              cx={cx}
              cy={cy}
              r={rOrb}
              fill="rgba(27, 31, 29, 0.9)"
              stroke="#B8CE82"
              strokeWidth="1.2"
            />

            {/* Active Primary Accent Needle */}
            <line
              x1={px1.toFixed(1)}
              y1={py1.toFixed(1)}
              x2={px2.toFixed(1)}
              y2={py2.toFixed(1)}
              stroke="#B8CE82"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </svg>

          <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
            <span className="text-[9px] uppercase tracking-wider text-[#949C96] leading-tight">{centerTitle}</span>
            <span className="text-xs font-mono font-bold text-[#EAECE9] tabular-nums mt-0.5">{centerValue}</span>
          </div>
        </div>

        <div className="text-center -mt-1">
          <div className="text-[10px] uppercase tracking-wider text-[#949C96]">{bottomLabel}</div>
          <div className="text-xs font-mono font-semibold text-[#B8CE82] tabular-nums">{bottomValue}</div>
        </div>
      </div>
    </div>
  );
};

/**
 * 4 vertical hatched columns with normal/warning/critical fill & warning badge [⚠]
 */
interface VerticalTempColumnItem {
  label: string;
  tempText: string;
  fillPct: number; // 0 to 100
  isWarning?: boolean;
}

export const VerticalHatchedTempColumns: React.FC<{
  columns: VerticalTempColumnItem[];
}> = ({ columns }) => {
  return (
    <div className="grid grid-cols-4 gap-3 pt-1">
      {columns.map((col, idx) => (
        <div key={idx} className="flex flex-col items-center">
          {/* Top Temperature Pill */}
          <div className="w-full py-1 rounded-t-xl bg-[#2B302D] text-center text-[11px] font-mono font-semibold text-[#EAECE9] tabular-nums border-b border-white/[0.08]">
            {col.tempText}
          </div>

          {/* Hatched Vertical Bar Track */}
          <div className="relative w-full h-28 rounded-b-xl overflow-hidden hatched-track bg-[#1B1F1D] border border-t-0 border-white/[0.07] flex flex-col justify-end">
            <div
              className="w-full rounded-t-sm transition-all duration-300"
              style={{
                height: `${Math.max(18, Math.min(92, col.fillPct))}%`,
                background: col.isWarning
                  ? 'linear-gradient(180deg, rgba(216,182,94,0.92) 0%, rgba(217,120,101,0.55) 100%)'
                  : 'linear-gradient(180deg, rgba(184,206,130,0.88) 0%, rgba(130,169,149,0.45) 100%)',
              }}
            />

            {/* Warning Tag on Exceedance Column */}
            {col.isWarning && (
              <div
                title="Thermal Threshold Exceedance"
                className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-[#D8B65E] text-[#181B19] rounded-lg px-2 py-1 shadow-md flex items-center justify-center"
              >
                <AlertTriangle className="w-3.5 h-3.5 stroke-[2.2]" />
              </div>
            )}
          </div>

          <span className="text-[10px] uppercase tracking-wider text-[#949C96] mt-1.5 truncate">{col.label}</span>
        </div>
      ))}
    </div>
  );
};

/**
 * Double-ring circular gauge for Overview-themed dark glassmorphism HUD cards
 */
export const DoubleRingGaugeLight: React.FC<{
  value: string;
  unit: string;
  fraction: number;
  leftTopLabel: string;
  leftTopVal: string;
  leftBottomLabel: string;
  leftBottomVal: string;
}> = ({
  value,
  unit,
  fraction,
  leftTopLabel,
  leftTopVal,
  leftBottomLabel,
  leftBottomVal,
}) => {
  const size = 128;
  const cx = size / 2;
  const cy = size / 2 + 6;
  const r = 46;
  const startAngle = -210;
  const endAngle = 30;
  const sweep = endAngle - startAngle; // 240 deg

  const polar = (deg: number, rad: number) => {
    const a = (deg * Math.PI) / 180;
    return { x: cx + rad * Math.cos(a), y: cy + rad * Math.sin(a) };
  };

  const arcPath = (sDeg: number, eDeg: number, rad: number) => {
    const s = polar(sDeg, rad);
    const e = polar(eDeg, rad);
    const large = eDeg - sDeg <= 180 ? 0 : 1;
    return `M ${s.x.toFixed(1)} ${s.y.toFixed(1)} A ${rad} ${rad} 0 ${large} 1 ${e.x.toFixed(1)} ${e.y.toFixed(1)}`;
  };

  const activeEnd = startAngle + Math.max(0.05, Math.min(1, fraction)) * sweep;

  return (
    <div className="flex items-center justify-between gap-2">
      <div className="space-y-3">
        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-xl font-mono font-bold text-[#EAECE9] tabular-nums">{leftTopVal}</span>
            <span className="w-4 h-4 rounded-full bg-[#82A995]/20 border border-[#82A995]/50 text-[#82A995] flex items-center justify-center">
              <ArrowUpRight className="w-2.5 h-2.5" />
            </span>
          </div>
          <span className="text-[11px] text-[#949C96] block">{leftTopLabel}</span>
        </div>

        <div>
          <div className="flex items-center gap-1.5">
            <span className="text-xl font-mono font-bold text-[#B8CE82] tabular-nums">{leftBottomVal}</span>
            <span className="w-4 h-4 rounded-full bg-[#B8CE82]/20 border border-[#B8CE82]/50 text-[#B8CE82] flex items-center justify-center">
              <ArrowUpRight className="w-2.5 h-2.5" />
            </span>
          </div>
          <span className="text-[11px] text-[#949C96] block">{leftBottomLabel}</span>
        </div>
      </div>

      <div className="relative flex items-center justify-center">
        <svg width={size} height={size - 10} viewBox={`0 0 ${size} ${size - 6}`} aria-hidden="true">
          <path
            d={arcPath(startAngle, endAngle, r)}
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="8"
            strokeLinecap="round"
          />
          <path
            d={arcPath(startAngle, activeEnd, r)}
            fill="none"
            stroke="#B8CE82"
            strokeWidth="8"
            strokeLinecap="round"
          />
          <circle cx={cx} cy={cy} r={32} fill="#1B1F1D" stroke="rgba(255,255,255,0.08)" />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center pt-2">
          <span className="text-xl font-mono font-bold text-[#EAECE9] tabular-nums">{value}</span>
          <span className="text-[9px] uppercase tracking-wider text-[#949C96]">{unit}</span>
        </div>
      </div>
    </div>
  );
};

/**
 * Smooth dual-color Bezier spline chart with monospace axis readouts matching Overview Flight Cycle Trend
 */
export const SmoothBezierTrendChart: React.FC<{
  trajectory: TrajectoryPoint[];
  sensorFaultActive: boolean;
}> = ({ trajectory, sensorFaultActive }) => {
  if (!trajectory.length) return null;

  const width = 280;
  const height = 112;
  const padX = 24;
  const padY = 14;
  const plotW = width - padX - 10;
  const plotH = height - padY * 2;

  const rulPts = trajectory.map((pt, i) => {
    const x = padX + (i / Math.max(1, trajectory.length - 1)) * plotW;
    const norm = Math.max(0.08, Math.min(0.95, pt.rulMean / 115));
    const y = padY + (1 - norm) * plotH;
    return { x, y };
  });

  const t30Pts = trajectory.map((pt, i) => {
    const x = padX + (i / Math.max(1, trajectory.length - 1)) * plotW;
    const norm = Math.max(0.1, Math.min(0.92, (pt.t30Temp - 1545) / 68));
    const y = padY + (1 - norm) * plotH;
    return { x, y };
  });

  const smoothSvgPath = (pts: Array<{ x: number; y: number }>) => {
    if (pts.length < 2) return '';
    let d = `M ${pts[0].x.toFixed(1)} ${pts[0].y.toFixed(1)}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i];
      const p1 = pts[i + 1];
      const midX = ((p0.x + p1.x) / 2).toFixed(1);
      d += ` C ${midX} ${p0.y.toFixed(1)}, ${midX} ${p1.y.toFixed(1)}, ${p1.x.toFixed(1)} ${p1.y.toFixed(1)}`;
    }
    return d;
  };

  const midIdx = Math.floor(trajectory.length / 2);
  const cursorX = rulPts[midIdx]?.x ?? width / 2;

  return (
    <div className="w-full">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-28 overflow-visible"
        aria-label="Conformal RUL and Thermal Creep Trend Chart"
      >
        {[0, 0.25, 0.5, 0.75, 1].map((g, idx) => {
          const y = padY + g * plotH;
          return (
            <g key={idx}>
              <line
                x1={padX}
                y1={y}
                x2={width - 8}
                y2={y}
                stroke="rgba(255, 255, 255, 0.06)"
                strokeWidth="1"
              />
              <text
                x={2}
                y={y + 3}
                fontSize="8"
                fontFamily="JetBrains Mono, monospace"
                fill="#949C96"
              >
                {Math.round((1 - g) * 100)}
              </text>
            </g>
          );
        })}

        {/* Vertical dashed reference cursor line at midpoint */}
        <line
          x1={cursorX}
          y1={padY - 4}
          x2={cursorX}
          y2={height - padY + 2}
          stroke="rgba(184, 206, 130, 0.45)"
          strokeWidth="1"
          strokeDasharray="3 3"
        />

        {/* Primary Accent / Normal RUL Spline */}
        <path
          d={smoothSvgPath(rulPts)}
          fill="none"
          stroke={sensorFaultActive ? '#D97865' : '#B8CE82'}
          strokeWidth="2.2"
        />

        {/* Warning Thermal Spline */}
        <path
          d={smoothSvgPath(t30Pts)}
          fill="none"
          stroke="#D8B65E"
          strokeWidth="2.2"
        />

        {rulPts[midIdx] && (
          <circle
            cx={rulPts[midIdx].x}
            cy={rulPts[midIdx].y}
            r="3.5"
            fill="#B8CE82"
            stroke="#111A19"
            strokeWidth="1.5"
          />
        )}
        {t30Pts[midIdx] && (
          <circle
            cx={t30Pts[midIdx].x}
            cy={t30Pts[midIdx].y}
            r="3.5"
            fill="#D8B65E"
            stroke="#111A19"
            strokeWidth="1.5"
          />
        )}
      </svg>
    </div>
  );
};
