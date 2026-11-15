import React, { useMemo, useState } from 'react';
import { ArrowRight, Timer } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import type { NavRoute } from '../types/dpsube';
import { formatTimeMs, getLevelToneClasses } from '../utils/levels';

interface DashboardPageProps {
  onNavigate: (route: NavRoute) => void;
}

function formatShortDate(ts: { toDate: () => Date } | null | undefined): string {
  if (!ts) return 'Just now';
  const d = ts.toDate();
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function DashboardPage({ onNavigate }: DashboardPageProps) {
  const { profile, singleSolves, averageSessions, dataLoading } = useAuth();
  const [chartSeries, setChartSeries] = useState<'single' | 'ao5'>('single');
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);

  const chartPoints = useMemo(() => {
    if (chartSeries === 'single') {
      const chronological = [...singleSolves].slice(0, 30).reverse();
      return chronological.map((s, idx) => ({
        index: idx + 1,
        timeMs: s.timeMs,
        level: s.level,
        label: s.source === 'AO5' ? 'Ao5 Solve' : 'Single',
        date: formatShortDate(s.createdAt),
      }));
    }
    const chronological = [...averageSessions].slice(0, 30).reverse();
    return chronological.map((sess, idx) => ({
      index: idx + 1,
      timeMs: sess.averageMs,
      level: sess.averageLevel,
      label: 'Ao5 Mean',
      date: formatShortDate(sess.createdAt),
    }));
  }, [chartSeries, singleSolves, averageSessions]);

  const recentActivity = useMemo(() => {
    return singleSolves.slice(0, 8);
  }, [singleSolves]);

  if (dataLoading && !profile) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-24 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 animate-pulse"
            />
          ))}
        </div>
        <div className="h-72 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 animate-pulse" />
      </div>
    );
  }

  const svgWidth = 720;
  const svgHeight = 240;
  const padLeft = 52;
  const padRight = 20;
  const padTop = 20;
  const padBottom = 28;
  const plotW = svgWidth - padLeft - padRight;
  const plotH = svgHeight - padTop - padBottom;

  const times = chartPoints.map((p) => p.timeMs);
  const minMs = times.length > 0 ? Math.min(...times) : 0;
  const maxMs = times.length > 0 ? Math.max(...times) : 60000;
  const spanMs = Math.max(1000, maxMs - minMs);
  const yMin = Math.max(0, minMs - spanMs * 0.12);
  const yMax = maxMs + spanMs * 0.12;
  const ySpan = Math.max(1000, yMax - yMin);

  const coords = chartPoints.map((pt, i) => {
    const x =
      chartPoints.length === 1
        ? padLeft + plotW / 2
        : padLeft + (i / (chartPoints.length - 1)) * plotW;
    const y = padTop + plotH - ((pt.timeMs - yMin) / ySpan) * plotH;
    return { ...pt, x, y };
  });

  const polylinePoints = coords.map((c) => `${c.x.toFixed(1)},${c.y.toFixed(1)}`).join(' ');
  const yTicks = [0, 0.5, 1].map((ratio) => {
    const val = yMin + ratio * ySpan;
    const y = padTop + plotH - ratio * plotH;
    return { val, y };
  });

  const hoveredPoint = hoverIdx !== null ? coords[hoverIdx] ?? null : null;

  return (
    <div className="space-y-8">
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            Welcome back, {profile?.username || 'Cuber'}
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Track. Improve. Progress. Official 3x3 performance overview.
          </p>
        </div>
        <button
          type="button"
          onClick={() => onNavigate('tracking')}
          className="h-10 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold inline-flex items-center gap-2 cursor-pointer transition-colors whitespace-nowrap self-start sm:self-auto"
        >
          <Timer className="w-4 h-4" />
          <span>Record Official Solve</span>
        </button>
      </div>

      {/* Main Statistics Strip (6 Metrics) */}
      <section aria-label="Main Statistics">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Best Single
            </div>
            <div className="mt-2 font-mono tabular-nums text-2xl font-bold text-slate-900 dark:text-white">
              {formatTimeMs(profile?.bestSingleMs)}
            </div>
            <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {profile?.bestSingleLevel ? `Level ${profile.bestSingleLevel}` : 'No record yet'}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Best Average
            </div>
            <div className="mt-2 font-mono tabular-nums text-2xl font-bold text-slate-900 dark:text-white">
              {formatTimeMs(profile?.bestAverageMs)}
            </div>
            <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {profile?.bestAverageLevel ? `Level ${profile.bestAverageLevel}` : 'No Ao5 yet'}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Current Single Level
            </div>
            <div
              className={`mt-2 font-mono tabular-nums text-2xl font-bold ${getLevelToneClasses(
                profile?.currentSingleLevel
              )}`}
            >
              {profile?.currentSingleLevel || '—'}
            </div>
            <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Latest single solve
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Current Average Level
            </div>
            <div
              className={`mt-2 font-mono tabular-nums text-2xl font-bold ${getLevelToneClasses(
                profile?.currentAverageLevel
              )}`}
            >
              {profile?.currentAverageLevel || '—'}
            </div>
            <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Latest Ao5 session
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Total Single Solves
            </div>
            <div className="mt-2 font-mono tabular-nums text-2xl font-bold text-slate-900 dark:text-white">
              {profile?.totalSingleSolves ?? 0}
            </div>
            <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Single + Ao5 solves
            </div>
          </div>

          <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Total Average Sessions
            </div>
            <div className="mt-2 font-mono tabular-nums text-2xl font-bold text-slate-900 dark:text-white">
              {profile?.totalAverageSessions ?? 0}
            </div>
            <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Completed Ao5 sets
            </div>
          </div>
        </div>
      </section>

      {/* Progress & Recent Activity Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Progress Trend Chart */}
        <section className="lg:col-span-2 p-5 sm:p-6 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <div>
              <h3 className="font-display text-base font-semibold text-slate-900 dark:text-white">
                Performance Progress
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {chartSeries === 'single'
                  ? 'Most recent 30 official single solves'
                  : 'Most recent 30 completed Ao5 session averages'}
              </p>
            </div>

            <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
              <button
                type="button"
                onClick={() => {
                  setChartSeries('single');
                  setHoverIdx(null);
                }}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                  chartSeries === 'single'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Single Solves
              </button>
              <button
                type="button"
                onClick={() => {
                  setChartSeries('ao5');
                  setHoverIdx(null);
                }}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                  chartSeries === 'ao5'
                    ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Ao5 Sessions
              </button>
            </div>
          </div>

          {chartPoints.length === 0 ? (
            <div className="flex-1 min-h-[220px] flex flex-col items-center justify-center text-center py-8 border border-dashed border-slate-200 dark:border-slate-800 rounded-lg">
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                No {chartSeries === 'single' ? 'official solves' : 'Ao5 sessions'} recorded yet
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs">
                Complete solves in Tracking to plot your solving speed progression over time.
              </p>
              <button
                type="button"
                onClick={() => onNavigate('tracking')}
                className="mt-4 h-9 px-3.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold cursor-pointer transition-colors"
              >
                Open Tracking
              </button>
            </div>
          ) : (
            <div className="relative">
              <div className="h-6 mb-1 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                {hoveredPoint ? (
                  <div className="flex items-center gap-2 font-medium text-slate-700 dark:text-slate-200">
                    <span>#{hoveredPoint.index}</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono tabular-nums">
                      {formatTimeMs(hoveredPoint.timeMs)}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className={getLevelToneClasses(hoveredPoint.level)}>
                      {hoveredPoint.level}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>{hoveredPoint.date}</span>
                  </div>
                ) : (
                  <span>Hover a data point to inspect solve details</span>
                )}
              </div>

              <svg
                viewBox={`0 0 ${svgWidth} ${svgHeight}`}
                className="w-full h-auto overflow-visible"
                role="img"
                aria-label="Solving time progression chart"
              >
                {yTicks.map((tick, idx) => (
                  <g key={idx}>
                    <line
                      x1={padLeft}
                      y1={tick.y}
                      x2={svgWidth - padRight}
                      y2={tick.y}
                      className="stroke-slate-200 dark:stroke-slate-800"
                      strokeDasharray="3 3"
                    />
                    <text
                      x={padLeft - 8}
                      y={tick.y + 4}
                      textAnchor="end"
                      className="fill-slate-400 dark:fill-slate-500 text-[11px] font-mono tabular-nums"
                    >
                      {formatTimeMs(tick.val, false)}
                    </text>
                  </g>
                ))}

                {coords.length > 1 && (
                  <polyline
                    fill="none"
                    stroke="#2563eb"
                    strokeWidth="2.25"
                    strokeLinejoin="round"
                    strokeLinecap="round"
                    points={polylinePoints}
                  />
                )}

                {coords.map((pt, idx) => {
                  const isHovered = hoverIdx === idx;
                  return (
                    <g key={idx}>
                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r={isHovered ? 5.5 : 3.5}
                        className="fill-blue-600 dark:fill-blue-400 stroke-white dark:stroke-slate-900"
                        strokeWidth="2"
                      />
                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r={12}
                        fill="transparent"
                        className="cursor-pointer"
                        onMouseEnter={() => setHoverIdx(idx)}
                        onMouseLeave={() => setHoverIdx(null)}
                      />
                    </g>
                  );
                })}
              </svg>
            </div>
          )}
        </section>

        {/* Recent Activity */}
        <section className="p-5 sm:p-6 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display text-base font-semibold text-slate-900 dark:text-white">
              Recent Activity
            </h3>
            <button
              type="button"
              onClick={() => onNavigate('history')}
              className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
            >
              <span>Full history</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {recentActivity.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-8 border border-dashed border-slate-200 dark:border-slate-800 rounded-lg">
              <p className="text-sm text-slate-600 dark:text-slate-400">
                No official solves yet.
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-500 mt-1">
                Your latest solves will appear here.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {recentActivity.map((solve) => (
                <li
                  key={solve.id}
                  className="py-2.5 flex items-center justify-between gap-3 text-sm"
                >
                  <div className="min-w-0">
                    <div className="font-mono tabular-nums font-semibold text-slate-900 dark:text-white">
                      {formatTimeMs(solve.timeMs)}
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                      <span>{solve.source === 'AO5' ? 'Ao5 Solve' : 'Single'}</span>
                      <span aria-hidden="true">·</span>
                      <span>{formatShortDate(solve.createdAt)}</span>
                    </div>
                  </div>
                  <span
                    className={`font-mono tabular-nums text-xs font-semibold ${getLevelToneClasses(
                      solve.level
                    )}`}
                  >
                    {solve.level}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
