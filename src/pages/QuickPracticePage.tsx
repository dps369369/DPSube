import React, { useCallback, useState } from 'react';
import { RefreshCw, RotateCcw, Trash2 } from 'lucide-react';
import { Stopwatch } from '../components/Stopwatch';
import {
  calculateLevel,
  formatTimeMs,
  generateScramble,
  getLevelToneClasses,
} from '../utils/levels';

interface PracticeSolve {
  id: number;
  timeMs: number;
}

interface VersusRound {
  round: number;
  yourTimeMs: number;
  targetTimeMs: number;
  won: boolean;
}

interface QuickPracticePageProps {
  mode: 'quick-solving' | 'quick-versus';
}

export function QuickPracticePage({ mode }: QuickPracticePageProps) {
  // Quick Solving local-only state (NEVER persisted to Firestore)
  const [scramble, setScramble] = useState<string>(() => generateScramble());
  const [quickSolves, setQuickSolves] = useState<PracticeSolve[]>([]);
  const [quickResetKey, setQuickResetKey] = useState(0);

  // Quick Versus local-only state (NEVER persisted to Firestore)
  const [targetSeconds, setTargetSeconds] = useState<number>(30);
  const [versusRounds, setVersusRounds] = useState<VersusRound[]>([]);
  const [versusResetKey, setVersusResetKey] = useState(0);

  const handleQuickComplete = useCallback((timeMs: number) => {
    setQuickSolves((prev) => [{ id: Date.now(), timeMs }, ...prev]);
    setScramble(generateScramble());
  }, []);

  const handleVersusComplete = useCallback(
    (timeMs: number) => {
      const targetMs = Math.max(1000, Math.round(targetSeconds * 1000));
      setVersusRounds((prev) => [
        {
          round: prev.length + 1,
          yourTimeMs: timeMs,
          targetTimeMs: targetMs,
          won: timeMs <= targetMs,
        },
        ...prev,
      ]);
      setScramble(generateScramble());
    },
    [targetSeconds]
  );

  const quickBestMs =
    quickSolves.length > 0 ? Math.min(...quickSolves.map((s) => s.timeMs)) : null;
  const quickMeanMs =
    quickSolves.length > 0
      ? Math.round(
          quickSolves.reduce((sum, s) => sum + s.timeMs, 0) / quickSolves.length
        )
      : null;

  const versusWins = versusRounds.filter((r) => r.won).length;
  const versusLosses = versusRounds.length - versusWins;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {mode === 'quick-solving' ? 'Quick Solving' : 'Quick Versus'}
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Unrestricted local practice environment. Results here never affect your official
            records, levels, or solving history.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setScramble(generateScramble())}
          className="h-9 px-3.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-200 inline-flex items-center gap-1.5 cursor-pointer transition-colors self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>New Scramble</span>
        </button>
      </div>

      {/* Scramble Banner */}
      <div className="px-4 py-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
          Practice Scramble
        </div>
        <div className="mt-1 font-mono text-sm sm:text-base font-medium text-slate-900 dark:text-slate-100 tracking-wide">
          {scramble}
        </div>
      </div>

      {mode === 'quick-solving' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <Stopwatch
              onComplete={handleQuickComplete}
              externalResetKey={quickResetKey}
              statusLabel="Practice Mode · Unofficial"
              accentLabel="Not recorded to profile"
            />
          </div>

          <section className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-display text-sm font-semibold text-slate-900 dark:text-white">
                Local Session ({quickSolves.length})
              </h3>
              {quickSolves.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setQuickSolves([]);
                    setQuickResetKey((k) => k + 1);
                  }}
                  className="text-xs text-rose-600 dark:text-rose-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 py-3 border-b border-slate-100 dark:border-slate-800 text-xs">
              <div>
                <div className="text-slate-500 dark:text-slate-400">Session Best</div>
                <div className="mt-0.5 font-mono tabular-nums text-base font-bold text-slate-900 dark:text-white">
                  {formatTimeMs(quickBestMs)}
                </div>
              </div>
              <div>
                <div className="text-slate-500 dark:text-slate-400">Session Mean</div>
                <div className="mt-0.5 font-mono tabular-nums text-base font-bold text-slate-900 dark:text-white">
                  {formatTimeMs(quickMeanMs)}
                </div>
              </div>
            </div>

            {quickSolves.length === 0 ? (
              <div className="flex-1 flex items-center justify-center py-8 text-xs text-slate-500 dark:text-slate-400 text-center">
                Complete a practice solve to view temporary session times.
              </div>
            ) : (
              <ul className="mt-2 max-h-64 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                {quickSolves.map((s, idx) => {
                  const lvl = calculateLevel(s.timeMs);
                  return (
                    <li key={s.id} className="py-2 flex items-center justify-between">
                      <span className="text-xs text-slate-400 font-mono tabular-nums">
                        #{quickSolves.length - idx}
                      </span>
                      <span className="font-mono tabular-nums font-semibold text-slate-900 dark:text-white">
                        {formatTimeMs(s.timeMs)}
                      </span>
                      <span className={`font-mono text-xs font-semibold ${getLevelToneClasses(lvl)}`}>
                        {lvl}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            {/* Target Pace Control */}
            <div className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
              <div>
                <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  Target Opponent Pace (seconds)
                </div>
                <div className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                  Beat this benchmark time to win the round
                </div>
              </div>

              <div className="flex items-center gap-2">
                {[20, 26, 30, 45, 60].map((sec) => (
                  <button
                    key={sec}
                    type="button"
                    onClick={() => setTargetSeconds(sec)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold transition-colors cursor-pointer ${
                      targetSeconds === sec
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {sec}s
                  </button>
                ))}
                <input
                  type="number"
                  min={5}
                  max={300}
                  step={1}
                  value={targetSeconds}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    if (!Number.isNaN(v) && v >= 1 && v <= 600) {
                      setTargetSeconds(v);
                    }
                  }}
                  aria-label="Custom target seconds"
                  className="w-16 h-8 px-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 font-mono text-xs text-center text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <Stopwatch
                onComplete={handleVersusComplete}
                externalResetKey={versusResetKey}
                statusLabel="Quick Versus · Practice Match"
                accentLabel={`Target: ${targetSeconds.toFixed(2)}s`}
              />
            </div>
          </div>

          <section className="p-5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-display text-sm font-semibold text-slate-900 dark:text-white">
                Match Scoreboard
              </h3>
              {versusRounds.length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    setVersusRounds([]);
                    setVersusResetKey((k) => k + 1);
                  }}
                  className="text-xs text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 inline-flex items-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Match</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3 py-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <div className="text-xs text-slate-500 dark:text-slate-400">Your Wins</div>
                <div className="mt-0.5 font-mono tabular-nums text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                  {versusWins}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-500 dark:text-slate-400">Target Wins</div>
                <div className="mt-0.5 font-mono tabular-nums text-2xl font-bold text-slate-700 dark:text-slate-300">
                  {versusLosses}
                </div>
              </div>
            </div>

            {versusRounds.length === 0 ? (
              <div className="flex-1 flex items-center justify-center py-8 text-xs text-slate-500 dark:text-slate-400 text-center">
                Start a solve to race against your {targetSeconds}s benchmark.
              </div>
            ) : (
              <ul className="mt-2 max-h-64 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {versusRounds.map((r) => (
                  <li key={r.round} className="py-2.5 flex items-center justify-between gap-2">
                    <span className="text-slate-500 dark:text-slate-400 font-mono">
                      R{r.round}
                    </span>
                    <span className="font-mono tabular-nums font-semibold text-slate-900 dark:text-white">
                      {formatTimeMs(r.yourTimeMs)} vs {formatTimeMs(r.targetTimeMs)}
                    </span>
                    <span
                      className={`font-semibold ${
                        r.won
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {r.won ? 'Won' : 'Lost'}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
