import React, { useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import type { PerformanceLevel } from '../types/dpsube';
import {
  formatTimeMs,
  getLevelToneClasses,
  LEVEL_DEFINITIONS,
} from '../utils/levels';

export function LevelsPage() {
  const { profile, singleSolves, averageSessions } = useAuth();

  const distribution = useMemo(() => {
    const singleCounts: Record<PerformanceLevel, number> = {
      L0: 0,
      L1: 0,
      L2: 0,
      L3: 0,
      L4: 0,
      L5: 0,
      L6: 0,
      L7: 0,
      L8: 0,
      L9: 0,
    };
    const avgCounts: Record<PerformanceLevel, number> = {
      L0: 0,
      L1: 0,
      L2: 0,
      L3: 0,
      L4: 0,
      L5: 0,
      L6: 0,
      L7: 0,
      L8: 0,
      L9: 0,
    };

    for (const s of singleSolves) {
      singleCounts[s.level] = (singleCounts[s.level] ?? 0) + 1;
    }
    for (const a of averageSessions) {
      avgCounts[a.averageLevel] = (avgCounts[a.averageLevel] ?? 0) + 1;
    }

    return { singleCounts, avgCounts };
  }, [singleSolves, averageSessions]);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-display text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Performance Level System
        </h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Ten continuous performance tiers from L0 to L1. Faster solving times earn higher
          performance levels across both Single and Average of 5 tracking.
        </p>
      </div>

      {/* User Current & Best Level Standings */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Best Single Level
          </div>
          <div
            className={`mt-2 font-mono tabular-nums text-3xl font-bold ${getLevelToneClasses(
              profile?.bestSingleLevel
            )}`}
          >
            {profile?.bestSingleLevel || '—'}
          </div>
          <div className="mt-1 font-mono tabular-nums text-xs text-slate-500 dark:text-slate-400">
            {formatTimeMs(profile?.bestSingleMs)}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Current Single Level
          </div>
          <div
            className={`mt-2 font-mono tabular-nums text-3xl font-bold ${getLevelToneClasses(
              profile?.currentSingleLevel
            )}`}
          >
            {profile?.currentSingleLevel || '—'}
          </div>
          <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Most recent official solve
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Best Average Level
          </div>
          <div
            className={`mt-2 font-mono tabular-nums text-3xl font-bold ${getLevelToneClasses(
              profile?.bestAverageLevel
            )}`}
          >
            {profile?.bestAverageLevel || '—'}
          </div>
          <div className="mt-1 font-mono tabular-nums text-xs text-slate-500 dark:text-slate-400">
            {formatTimeMs(profile?.bestAverageMs)}
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Current Average Level
          </div>
          <div
            className={`mt-2 font-mono tabular-nums text-3xl font-bold ${getLevelToneClasses(
              profile?.currentAverageLevel
            )}`}
          >
            {profile?.currentAverageLevel || '—'}
          </div>
          <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Most recent Ao5 session
          </div>
        </div>
      </div>

      {/* Level Classification Matrix */}
      <div className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h3 className="font-display text-base font-semibold text-slate-900 dark:text-white">
            Continuous Time Classification
          </h3>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Evaluated with millisecond precision
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-50/70 dark:bg-slate-950/40">
                <th className="py-3 px-5">Level</th>
                <th className="py-3 px-4">Target Range</th>
                <th className="py-3 px-4">Continuous Boundary</th>
                <th className="py-3 px-4">Your Status</th>
                <th className="py-3 px-4 text-right">Single Solves</th>
                <th className="py-3 px-5 text-right">Ao5 Sessions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
              {LEVEL_DEFINITIONS.map((def) => {
                const isBestSingle = profile?.bestSingleLevel === def.level;
                const isBestAvg = profile?.bestAverageLevel === def.level;
                const isCurSingle = profile?.currentSingleLevel === def.level;
                const isCurAvg = profile?.currentAverageLevel === def.level;

                const statusNotes: string[] = [];
                if (isBestSingle) statusNotes.push('Best Single');
                if (isBestAvg) statusNotes.push('Best Ao5');
                if (isCurSingle && !isBestSingle) statusNotes.push('Current Single');
                if (isCurAvg && !isBestAvg) statusNotes.push('Current Ao5');

                const singleCount = distribution.singleCounts[def.level] ?? 0;
                const avgCount = distribution.avgCounts[def.level] ?? 0;
                const highlighted = statusNotes.length > 0;

                return (
                  <tr
                    key={def.level}
                    className={`transition-colors ${
                      highlighted
                        ? 'bg-blue-50/50 dark:bg-blue-950/20'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                    }`}
                  >
                    <td className="py-3 px-5">
                      <span
                        className={`font-mono tabular-nums font-bold ${getLevelToneClasses(
                          def.level
                        )}`}
                      >
                        {def.level}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-900 dark:text-slate-100 whitespace-nowrap">
                      {def.rangeText}
                    </td>
                    <td className="py-3 px-4 font-mono tabular-nums text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                      {def.exactBoundaryText}
                    </td>
                    <td className="py-3 px-4 text-xs font-medium text-blue-700 dark:text-blue-400">
                      {statusNotes.length > 0 ? statusNotes.join(' · ') : '—'}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-700 dark:text-slate-300">
                      {singleCount}
                    </td>
                    <td className="py-3 px-5 text-right font-mono tabular-nums text-slate-700 dark:text-slate-300">
                      {avgCount}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
