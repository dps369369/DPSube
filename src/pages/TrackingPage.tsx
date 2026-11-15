import React, { useCallback, useState } from 'react';
import { Check, RefreshCw, RotateCcw, Save, Trash2 } from 'lucide-react';
import { Stopwatch } from '../components/Stopwatch';
import { useAuth } from '../contexts/AuthContext';
import { saveAverageSession, saveSingleSolve } from '../services/dpsubeDb';
import {
  calculateLevel,
  formatTimeMs,
  generateScramble,
  getLevelToneClasses,
} from '../utils/levels';

type TrackingMode = 'single' | 'ao5';

export function TrackingPage() {
  const { user, profile } = useAuth();
  const [mode, setMode] = useState<TrackingMode>('single');
  const [scramble, setScramble] = useState<string>(() => generateScramble());

  // Single Solving state
  const [pendingSingleMs, setPendingSingleMs] = useState<number | null>(null);
  const [singleSavedNotice, setSingleSavedNotice] = useState<string | null>(null);
  const [singleResetKey, setSingleResetKey] = useState(0);

  // Average of 5 (Ao5) state
  const [ao5Solves, setAo5Solves] = useState<number[]>([]);
  const [ao5ResetKey, setAo5ResetKey] = useState(0);
  const [ao5SavedNotice, setAo5SavedNotice] = useState<string | null>(null);

  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const refreshScramble = useCallback(() => {
    setScramble(generateScramble());
  }, []);

  // --- Single Solving Handlers ---
  const handleSingleComplete = useCallback((timeMs: number) => {
    setPendingSingleMs(timeMs);
    setSingleSavedNotice(null);
    setErrorMsg(null);
  }, []);

  const handleSaveSingle = async () => {
    if (!user || pendingSingleMs === null) return;
    setSaving(true);
    setErrorMsg(null);
    try {
      const res = await saveSingleSolve(user.uid, pendingSingleMs);
      setPendingSingleMs(null);
      setSingleResetKey((k) => k + 1);
      setScramble(generateScramble());
      setSingleSavedNotice(
        `Saved ${formatTimeMs(res.timeMs)} (${res.level})${
          res.isNewBestSingle ? ' — New Personal Best Single!' : ''
        }`
      );
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to save solve.');
    } finally {
      setSaving(false);
    }
  };

  const handleDiscardSingle = () => {
    setPendingSingleMs(null);
    setSingleResetKey((k) => k + 1);
    setSingleSavedNotice(null);
  };

  // --- Average of 5 (Ao5) Handlers ---
  const handleAo5SolveComplete = useCallback((timeMs: number) => {
    setAo5SavedNotice(null);
    setErrorMsg(null);
    setAo5Solves((prev) => {
      if (prev.length >= 5) return prev;
      const next = [...prev, timeMs];
      return next;
    });
    setScramble(generateScramble());
    setAo5ResetKey((k) => k + 1);
  }, []);

  const ao5Complete = ao5Solves.length === 5;
  const ao5MeanMs = ao5Complete
    ? Math.round(ao5Solves.reduce((sum, t) => sum + t, 0) / 5)
    : null;
  const ao5MeanLevel = ao5MeanMs !== null ? calculateLevel(ao5MeanMs) : null;

  const handleSaveAo5 = async () => {
    if (!user || ao5Solves.length !== 5) return;
    setSaving(true);
    setErrorMsg(null);
    try {
      const res = await saveAverageSession(user.uid, ao5Solves);
      const pbFlags: string[] = [];
      if (res.isNewBestAverage) pbFlags.push('New Personal Best Average');
      if (res.isNewBestSingle) pbFlags.push('New Personal Best Single');
      setAo5Solves([]);
      setAo5ResetKey((k) => k + 1);
      setScramble(generateScramble());
      setAo5SavedNotice(
        `Saved Ao5 session: ${formatTimeMs(res.averageMs)} (${res.averageLevel})${
          pbFlags.length > 0 ? ` — ${pbFlags.join(' & ')}!` : ''
        }`
      );
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to save Ao5 session.');
    } finally {
      setSaving(false);
    }
  };

  const handleDiscardAo5 = () => {
    setAo5Solves([]);
    setAo5ResetKey((k) => k + 1);
    setAo5SavedNotice(null);
    setScramble(generateScramble());
  };

  const pendingSingleLevel =
    pendingSingleMs !== null ? calculateLevel(pendingSingleMs) : null;
  const isPendingSinglePB =
    pendingSingleMs !== null &&
    (profile?.bestSingleMs === null ||
      profile?.bestSingleMs === undefined ||
      pendingSingleMs < profile.bestSingleMs);

  const isAo5BestAveragePB =
    ao5MeanMs !== null &&
    (profile?.bestAverageMs === null ||
      profile?.bestAverageMs === undefined ||
      ao5MeanMs < profile.bestAverageMs);

  return (
    <div className="space-y-6">
      {/* Mode Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Official Tracking
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            All saved results count toward your official records, levels, and solving history.
          </p>
        </div>

        <div className="flex items-center gap-1 p-1 bg-slate-200/70 dark:bg-slate-800 rounded-lg self-start sm:self-auto">
          <button
            type="button"
            onClick={() => {
              setMode('single');
              setErrorMsg(null);
            }}
            className={`px-4 py-2 text-xs font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap ${
              mode === 'single'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Single Solving
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('ao5');
              setErrorMsg(null);
            }}
            className={`px-4 py-2 text-xs font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap ${
              mode === 'ao5'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Average of 5 (Ao5)
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3.5 rounded-lg border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/40 text-sm text-rose-700 dark:text-rose-300">
          {errorMsg}
        </div>
      )}

      {/* Scramble Bar */}
      <div className="px-4 py-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
            3x3 Scramble
          </div>
          <div className="mt-1 font-mono text-sm sm:text-base font-medium text-slate-900 dark:text-slate-100 tracking-wide break-words">
            {scramble}
          </div>
        </div>
        <button
          type="button"
          onClick={refreshScramble}
          className="h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-medium text-slate-700 dark:text-slate-200 inline-flex items-center gap-1.5 cursor-pointer transition-colors whitespace-nowrap shrink-0 self-start sm:self-center"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>New Scramble</span>
        </button>
      </div>

      {/* Main Timer Workspace */}
      {mode === 'single' ? (
        <div className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden">
          <Stopwatch
            onComplete={handleSingleComplete}
            externalResetKey={singleResetKey}
            initialTimeMs={pendingSingleMs}
            statusLabel="Official Single Solve"
            accentLabel={
              profile?.bestSingleMs
                ? `PB: ${formatTimeMs(profile.bestSingleMs)}`
                : 'No PB recorded yet'
            }
          />

          {singleSavedNotice && (
            <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-emerald-50/70 dark:bg-emerald-950/30 flex items-center justify-center gap-2 text-sm font-medium text-emerald-700 dark:text-emerald-300">
              <Check className="w-4 h-4 shrink-0" />
              <span>{singleSavedNotice}</span>
            </div>
          )}

          {pendingSingleMs !== null && (
            <div className="px-6 py-5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  Completed Solve Ready to Record
                </div>
                <div className="mt-1 flex items-center gap-3">
                  <span className="font-mono tabular-nums text-2xl font-bold text-slate-900 dark:text-white">
                    {formatTimeMs(pendingSingleMs)}
                  </span>
                  <span className="text-slate-300 dark:text-slate-700">·</span>
                  <span className={`font-semibold text-sm ${getLevelToneClasses(pendingSingleLevel)}`}>
                    Level {pendingSingleLevel}
                  </span>
                  {isPendingSinglePB && (
                    <>
                      <span className="text-slate-300 dark:text-slate-700">·</span>
                      <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                        New Personal Best
                      </span>
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={handleDiscardSingle}
                  disabled={saving}
                  className="h-10 px-4 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-sm font-medium text-slate-700 dark:text-slate-200 inline-flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Discard</span>
                </button>
                <button
                  type="button"
                  onClick={handleSaveSingle}
                  disabled={saving}
                  className="h-10 px-5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold inline-flex items-center gap-2 cursor-pointer transition-colors"
                >
                  <Save className="w-4 h-4" />
                  <span>{saving ? 'Saving...' : 'Save Official Solve'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {/* Ao5 Slot Progress Bar */}
          <div className="grid grid-cols-5 gap-2 sm:gap-3">
            {[0, 1, 2, 3, 4].map((slotIdx) => {
              const solveMs = ao5Solves[slotIdx];
              const isCurrent = !ao5Complete && slotIdx === ao5Solves.length;
              const lvl = solveMs !== undefined ? calculateLevel(solveMs) : null;
              return (
                <div
                  key={slotIdx}
                  className={`p-3 rounded-xl border transition-colors ${
                    solveMs !== undefined
                      ? 'bg-white dark:bg-slate-900 border-blue-200 dark:border-blue-900'
                      : isCurrent
                        ? 'bg-blue-50/60 dark:bg-blue-950/30 border-blue-500'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 opacity-60'
                  }`}
                >
                  <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    Solve {slotIdx + 1}
                  </div>
                  <div className="mt-1 font-mono tabular-nums text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                    {solveMs !== undefined ? formatTimeMs(solveMs) : isCurrent ? 'Ready' : '—'}
                  </div>
                  <div className={`text-xs font-medium mt-0.5 ${getLevelToneClasses(lvl)}`}>
                    {lvl ? lvl : '\u00A0'}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Ao5 Timer or Summary Card */}
          <div className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden">
            {!ao5Complete ? (
              <>
                <Stopwatch
                  onComplete={handleAo5SolveComplete}
                  externalResetKey={ao5ResetKey}
                  statusLabel={`Average of 5 · Solve ${ao5Solves.length + 1} of 5`}
                  accentLabel={
                    profile?.bestAverageMs
                      ? `Best Ao5: ${formatTimeMs(profile.bestAverageMs)}`
                      : 'Unfinished sessions are not counted'
                  }
                />
                {ao5Solves.length > 0 && (
                  <div className="px-6 py-3.5 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50 flex items-center justify-between">
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {ao5Solves.length} of 5 solves completed. Complete all 5 to record this session.
                    </span>
                    <button
                      type="button"
                      onClick={handleDiscardAo5}
                      className="text-xs font-medium text-rose-600 dark:text-rose-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Reset Session</span>
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="p-6 sm:p-8 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
                  <div>
                    <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
                      Completed Average of 5 (Arithmetic Mean of 5 Solves)
                    </div>
                    <div className="mt-2 flex items-baseline gap-3">
                      <span className="font-mono tabular-nums text-4xl sm:text-5xl font-bold text-slate-900 dark:text-white">
                        {formatTimeMs(ao5MeanMs)}
                      </span>
                      <span
                        className={`text-lg font-semibold ${getLevelToneClasses(ao5MeanLevel)}`}
                      >
                        Level {ao5MeanLevel}
                      </span>
                    </div>
                    {isAo5BestAveragePB && (
                      <div className="mt-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                        New Personal Best Average
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2.5">
                    <button
                      type="button"
                      onClick={handleDiscardAo5}
                      disabled={saving}
                      className="h-10 px-4 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-sm font-medium text-slate-700 dark:text-slate-200 inline-flex items-center gap-1.5 cursor-pointer transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Discard</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveAo5}
                      disabled={saving}
                      className="h-10 px-5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold inline-flex items-center gap-2 cursor-pointer transition-colors"
                    >
                      <Save className="w-4 h-4" />
                      <span>{saving ? 'Saving...' : 'Save Ao5 Session'}</span>
                    </button>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-3">
                    All Five Individual Solves (+5 Total Single Solves)
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    {ao5Solves.map((ms, idx) => {
                      const lvl = calculateLevel(ms);
                      return (
                        <div
                          key={idx}
                          className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800"
                        >
                          <div className="text-xs text-slate-500 dark:text-slate-400">
                            Solve #{idx + 1}
                          </div>
                          <div className="mt-1 font-mono tabular-nums font-bold text-slate-900 dark:text-white">
                            {formatTimeMs(ms)}
                          </div>
                          <div className={`text-xs font-semibold mt-0.5 ${getLevelToneClasses(lvl)}`}>
                            {lvl}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {ao5SavedNotice && (
              <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-emerald-50/70 dark:bg-emerald-950/30 flex items-center justify-center gap-2 text-sm font-medium text-emerald-700 dark:text-emerald-300">
                <Check className="w-4 h-4 shrink-0" />
                <span>{ao5SavedNotice}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
