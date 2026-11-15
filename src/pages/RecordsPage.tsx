import React, { useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { formatTimeMs, getLevelToneClasses } from '../utils/levels';

export function RecordsPage() {
  const { profile, singleSolves, averageSessions } = useAuth();

  const overallStats = useMemo(() => {
    const soloCount = singleSolves.filter((s) => s.source === 'SINGLE').length;
    const ao5SolveCount = singleSolves.filter((s) => s.source === 'AO5').length;
    const overallMeanMs =
      singleSolves.length > 0
        ? Math.round(
            singleSolves.reduce((sum, s) => sum + s.timeMs, 0) / singleSolves.length
          )
        : null;
    const avgMeanMs =
      averageSessions.length > 0
        ? Math.round(
            averageSessions.reduce((sum, a) => sum + a.averageMs, 0) /
              averageSessions.length
          )
        : null;

    return {
      soloCount,
      ao5SolveCount,
      overallMeanMs,
      avgMeanMs,
    };
  }, [singleSolves, averageSessions]);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-display text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Official Records
        </h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Personal bests update strictly when a faster official solving time is recorded.
        </p>
      </div>

      {/* Single & Average Records Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Single Records */}
        <section className="p-6 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <h3 className="font-display text-base font-semibold text-slate-900 dark:text-white pb-4 border-b border-slate-100 dark:border-slate-800">
            Single Records
          </h3>

          <dl className="divide-y divide-slate-100 dark:divide-slate-800 mt-2">
            <div className="py-3.5 flex items-center justify-between gap-4">
              <dt className="text-sm text-slate-600 dark:text-slate-400">
                Personal Best Single Solve
              </dt>
              <dd className="font-mono tabular-nums text-xl font-bold text-slate-900 dark:text-white">
                {formatTimeMs(profile?.bestSingleMs)}
              </dd>
            </div>
            <div className="py-3.5 flex items-center justify-between gap-4">
              <dt className="text-sm text-slate-600 dark:text-slate-400">
                Personal Best Single Level
              </dt>
              <dd
                className={`font-mono tabular-nums text-lg font-bold ${getLevelToneClasses(
                  profile?.bestSingleLevel
                )}`}
              >
                {profile?.bestSingleLevel || '—'}
              </dd>
            </div>
            <div className="py-3.5 flex items-center justify-between gap-4">
              <dt className="text-sm text-slate-600 dark:text-slate-400">
                Total Single Solves
              </dt>
              <dd className="font-mono tabular-nums text-lg font-semibold text-slate-900 dark:text-white">
                {profile?.totalSingleSolves ?? 0}
              </dd>
            </div>
          </dl>
        </section>

        {/* Average Records */}
        <section className="p-6 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <h3 className="font-display text-base font-semibold text-slate-900 dark:text-white pb-4 border-b border-slate-100 dark:border-slate-800">
            Average Records (Ao5)
          </h3>

          <dl className="divide-y divide-slate-100 dark:divide-slate-800 mt-2">
            <div className="py-3.5 flex items-center justify-between gap-4">
              <dt className="text-sm text-slate-600 dark:text-slate-400">
                Personal Best Average
              </dt>
              <dd className="font-mono tabular-nums text-xl font-bold text-slate-900 dark:text-white">
                {formatTimeMs(profile?.bestAverageMs)}
              </dd>
            </div>
            <div className="py-3.5 flex items-center justify-between gap-4">
              <dt className="text-sm text-slate-600 dark:text-slate-400">
                Personal Best Average Level
              </dt>
              <dd
                className={`font-mono tabular-nums text-lg font-bold ${getLevelToneClasses(
                  profile?.bestAverageLevel
                )}`}
              >
                {profile?.bestAverageLevel || '—'}
              </dd>
            </div>
            <div className="py-3.5 flex items-center justify-between gap-4">
              <dt className="text-sm text-slate-600 dark:text-slate-400">
                Total Average Sessions
              </dt>
              <dd className="font-mono tabular-nums text-lg font-semibold text-slate-900 dark:text-white">
                {profile?.totalAverageSessions ?? 0}
              </dd>
            </div>
          </dl>
        </section>
      </div>

      {/* Overall Statistics */}
      <section className="p-6 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        <h3 className="font-display text-base font-semibold text-slate-900 dark:text-white pb-4 border-b border-slate-100 dark:border-slate-800">
          Overall Statistics
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-6 pt-5">
          <div>
            <div className="text-xs text-slate-500 dark:text-slate-400">Current Single Level</div>
            <div
              className={`mt-1.5 font-mono tabular-nums text-2xl font-bold ${getLevelToneClasses(
                profile?.currentSingleLevel
              )}`}
            >
              {profile?.currentSingleLevel || '—'}
            </div>
          </div>

          <div>
            <div className="text-xs text-slate-500 dark:text-slate-400">Current Average Level</div>
            <div
              className={`mt-1.5 font-mono tabular-nums text-2xl font-bold ${getLevelToneClasses(
                profile?.currentAverageLevel
              )}`}
            >
              {profile?.currentAverageLevel || '—'}
            </div>
          </div>

          <div>
            <div className="text-xs text-slate-500 dark:text-slate-400">Standalone Singles</div>
            <div className="mt-1.5 font-mono tabular-nums text-2xl font-bold text-slate-900 dark:text-white">
              {overallStats.soloCount}
            </div>
          </div>

          <div>
            <div className="text-xs text-slate-500 dark:text-slate-400">Ao5 Individual Solves</div>
            <div className="mt-1.5 font-mono tabular-nums text-2xl font-bold text-slate-900 dark:text-white">
              {overallStats.ao5SolveCount}
            </div>
          </div>

          <div>
            <div className="text-xs text-slate-500 dark:text-slate-400">Lifetime Solve Mean</div>
            <div className="mt-1.5 font-mono tabular-nums text-2xl font-bold text-slate-900 dark:text-white">
              {formatTimeMs(overallStats.overallMeanMs)}
            </div>
          </div>

          <div>
            <div className="text-xs text-slate-500 dark:text-slate-400">Lifetime Ao5 Mean</div>
            <div className="mt-1.5 font-mono tabular-nums text-2xl font-bold text-slate-900 dark:text-white">
              {formatTimeMs(overallStats.avgMeanMs)}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
