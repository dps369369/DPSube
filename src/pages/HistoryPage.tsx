import React, { useMemo, useState } from 'react';
import { ChevronDown, ChevronRight, Trash2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { deleteAverageSession, deleteSingleSolve } from '../services/dpsubeDb';
import type { AverageSessionRecord, SingleSolveRecord } from '../types/dpsube';
import { calculateLevel, formatTimeMs, getLevelToneClasses } from '../utils/levels';

type HistoryTab = 'single' | 'ao5';
type SourceFilter = 'ALL' | 'SINGLE' | 'AO5';

function formatFullDate(ts: { toDate: () => Date } | null | undefined): string {
  if (!ts) return 'Just now';
  return ts.toDate().toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function HistoryPage() {
  const { user, singleSolves, averageSessions } = useAuth();
  const [tab, setTab] = useState<HistoryTab>('single');
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>('ALL');
  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const filteredSingles = useMemo(() => {
    if (sourceFilter === 'ALL') return singleSolves;
    return singleSolves.filter((s) => s.source === sourceFilter);
  }, [singleSolves, sourceFilter]);

  const handleDeleteSingle = async (solve: SingleSolveRecord) => {
    if (!user) return;
    setDeletingId(solve.id);
    setErrorMsg(null);
    try {
      await deleteSingleSolve(user.uid, solve);
      setConfirmDeleteId(null);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to delete solve.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleDeleteSession = async (session: AverageSessionRecord) => {
    if (!user) return;
    setDeletingId(session.id);
    setErrorMsg(null);
    try {
      await deleteAverageSession(user.uid, session);
      setConfirmDeleteId(null);
      if (expandedSessionId === session.id) {
        setExpandedSessionId(null);
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to delete Ao5 session.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Solving History
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Inspect every official single solve and completed Average of 5 session.
          </p>
        </div>

        <div className="flex items-center gap-1 p-1 bg-slate-200/70 dark:bg-slate-800 rounded-lg self-start sm:self-auto">
          <button
            type="button"
            onClick={() => {
              setTab('single');
              setConfirmDeleteId(null);
            }}
            className={`px-4 py-2 text-xs font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap ${
              tab === 'single'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Single Solves ({singleSolves.length})
          </button>
          <button
            type="button"
            onClick={() => {
              setTab('ao5');
              setConfirmDeleteId(null);
            }}
            className={`px-4 py-2 text-xs font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap ${
              tab === 'ao5'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Average Sessions ({averageSessions.length})
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3.5 rounded-lg border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/40 text-sm text-rose-700 dark:text-rose-300">
          {errorMsg}
        </div>
      )}

      {tab === 'single' ? (
        <div className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden">
          <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
              {(['ALL', 'SINGLE', 'AO5'] as SourceFilter[]).map((src) => (
                <button
                  key={src}
                  type="button"
                  onClick={() => setSourceFilter(src)}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                    sourceFilter === src
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {src === 'ALL' ? 'All Methods' : src === 'SINGLE' ? 'Single Only' : 'From Ao5'}
                </button>
              ))}
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Showing {filteredSingles.length} solves
            </span>
          </div>

          {filteredSingles.length === 0 ? (
            <div className="p-10 text-center text-sm text-slate-500 dark:text-slate-400">
              No single solves found for this filter.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-500 dark:text-slate-400 bg-slate-50/70 dark:bg-slate-950/40">
                    <th className="py-3 px-5">Solving Time</th>
                    <th className="py-3 px-4">Level</th>
                    <th className="py-3 px-4">Tracking Method</th>
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                  {filteredSingles.map((solve) => {
                    const isConfirming = confirmDeleteId === solve.id;
                    const isDeleting = deletingId === solve.id;

                    return (
                      <tr
                        key={solve.id}
                        className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        <td className="py-3 px-5 font-mono tabular-nums font-semibold text-slate-900 dark:text-white whitespace-nowrap">
                          {formatTimeMs(solve.timeMs)}
                        </td>
                        <td
                          className={`py-3 px-4 font-mono tabular-nums font-semibold whitespace-nowrap ${getLevelToneClasses(
                            solve.level
                          )}`}
                        >
                          {solve.level}
                        </td>
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                          {solve.source === 'AO5' ? 'Ao5' : 'Single'}
                        </td>
                        <td className="py-3 px-4 text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">
                          {formatFullDate(solve.createdAt)}
                        </td>
                        <td className="py-3 px-5 text-right whitespace-nowrap">
                          {solve.source === 'AO5' ? (
                            <button
                              type="button"
                              onClick={() => {
                                setTab('ao5');
                                setExpandedSessionId(solve.averageSessionId);
                              }}
                              className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                            >
                              View Ao5 Session
                            </button>
                          ) : isConfirming ? (
                            <div className="inline-flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => handleDeleteSingle(solve)}
                                disabled={isDeleting}
                                className="text-xs font-semibold text-rose-600 dark:text-rose-400 hover:underline cursor-pointer"
                              >
                                {isDeleting ? 'Deleting...' : 'Confirm'}
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteId(null)}
                                className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(solve.id)}
                              className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 cursor-pointer"
                              aria-label="Delete solve"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Delete</span>
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div className="rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden">
          {averageSessions.length === 0 ? (
            <div className="p-10 text-center text-sm text-slate-500 dark:text-slate-400">
              No completed Average of 5 sessions recorded yet.
            </div>
          ) : (
            <div className="divide-y divide-slate-200 dark:divide-slate-800">
              {averageSessions.map((session) => {
                const isExpanded = expandedSessionId === session.id;
                const isConfirming = confirmDeleteId === session.id;
                const isDeleting = deletingId === session.id;

                return (
                  <div key={session.id} className="p-4 sm:p-5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedSessionId(isExpanded ? null : session.id)
                        }
                        className="flex items-center gap-3 text-left cursor-pointer group"
                      >
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
                        )}
                        <div>
                          <div className="flex items-center gap-2.5">
                            <span className="font-mono tabular-nums text-lg font-bold text-slate-900 dark:text-white">
                              {formatTimeMs(session.averageMs)}
                            </span>
                            <span className="text-slate-300 dark:text-slate-700">·</span>
                            <span
                              className={`font-mono tabular-nums text-sm font-semibold ${getLevelToneClasses(
                                session.averageLevel
                              )}`}
                            >
                              {session.averageLevel}
                            </span>
                          </div>
                          <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                            {formatFullDate(session.createdAt)} ·{' '}
                            <span className="font-mono tabular-nums">
                              {session.solveTimesMs.map((t) => formatTimeMs(t)).join(', ')}
                            </span>
                          </div>
                        </div>
                      </button>

                      <div className="flex items-center gap-3 pl-7 sm:pl-0">
                        {isConfirming ? (
                          <div className="inline-flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleDeleteSession(session)}
                              disabled={isDeleting}
                              className="text-xs font-semibold text-rose-600 dark:text-rose-400 hover:underline cursor-pointer"
                            >
                              {isDeleting ? 'Deleting...' : 'Confirm Delete Session & 5 Solves'}
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmDeleteId(null)}
                              className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(session.id)}
                            className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 sm:grid-cols-5 gap-3 pl-0 sm:pl-7">
                        {session.solveTimesMs.map((ms, idx) => {
                          const lvl = calculateLevel(ms);
                          return (
                            <div
                              key={session.solveIds[idx] ?? idx}
                              className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800"
                            >
                              <div className="text-xs text-slate-500 dark:text-slate-400">
                                Solve {idx + 1}
                              </div>
                              <div className="mt-1 font-mono tabular-nums font-semibold text-slate-900 dark:text-white">
                                {formatTimeMs(ms)}
                              </div>
                              <div
                                className={`text-xs font-semibold mt-0.5 ${getLevelToneClasses(
                                  lvl
                                )}`}
                              >
                                {lvl}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
