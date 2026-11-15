import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Play, RotateCcw, Square } from 'lucide-react';
import { calculateLevel, formatTimeMs, getLevelToneClasses } from '../utils/levels';

interface StopwatchProps {
  onComplete: (timeMs: number) => void;
  disabled?: boolean;
  externalResetKey?: number | string;
  initialTimeMs?: number | null;
  statusLabel?: string;
  allowSpacebar?: boolean;
  accentLabel?: string;
}

export function Stopwatch({
  onComplete,
  disabled = false,
  externalResetKey,
  initialTimeMs = null,
  statusLabel,
  allowSpacebar = true,
  accentLabel,
}: StopwatchProps) {
  const [running, setRunning] = useState(false);
  const [elapsedMs, setElapsedMs] = useState<number>(initialTimeMs ?? 0);

  const startPerfRef = useRef<number>(0);
  const rafRef = useRef<number | null>(null);
  const runningRef = useRef<boolean>(false);

  const stopRaf = () => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  };

  useEffect(() => {
    stopRaf();
    runningRef.current = false;
    setRunning(false);
    setElapsedMs(initialTimeMs ?? 0);
  }, [externalResetKey, initialTimeMs]);

  useEffect(() => {
    return () => stopRaf();
  }, []);

  const tick = useCallback(() => {
    if (!runningRef.current) return;
    const now = performance.now();
    setElapsedMs(Math.max(0, Math.round(now - startPerfRef.current)));
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  const handleStart = useCallback(() => {
    if (disabled || runningRef.current) return;
    startPerfRef.current = performance.now();
    runningRef.current = true;
    setRunning(true);
    setElapsedMs(0);
    rafRef.current = requestAnimationFrame(tick);
  }, [disabled, tick]);

  const handleStop = useCallback(() => {
    if (!runningRef.current) return;
    const finalMs = Math.max(10, Math.round(performance.now() - startPerfRef.current));
    stopRaf();
    runningRef.current = false;
    setRunning(false);
    setElapsedMs(finalMs);
    onComplete(finalMs);
  }, [onComplete]);

  const handleReset = useCallback(() => {
    if (runningRef.current) return;
    setElapsedMs(0);
  }, []);

  useEffect(() => {
    if (!allowSpacebar) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code !== 'Space') return;
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      ) {
        return;
      }

      if (e.repeat) return;
      e.preventDefault();

      if (runningRef.current) {
        handleStop();
      } else if (!disabled) {
        handleStart();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [allowSpacebar, disabled, handleStart, handleStop]);

  const currentLevel = elapsedMs > 0 ? calculateLevel(elapsedMs) : null;

  return (
    <div className="flex flex-col items-center justify-center w-full py-6 sm:py-10 px-4">
      {(statusLabel || accentLabel) && (
        <div className="flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400 mb-3">
          {statusLabel && <span>{statusLabel}</span>}
          {statusLabel && accentLabel && <span aria-hidden="true">·</span>}
          {accentLabel && <span className="text-slate-700 dark:text-slate-300">{accentLabel}</span>}
        </div>
      )}

      <div
        role="timer"
        aria-live="off"
        className={`font-mono tabular-nums tracking-tight select-none transition-colors duration-150 ${
          running
            ? 'text-blue-600 dark:text-blue-400'
            : 'text-slate-900 dark:text-slate-50'
        } text-6xl sm:text-7xl md:text-8xl font-semibold leading-none`}
      >
        {formatTimeMs(elapsedMs, false)}
        <span className="text-2xl sm:text-3xl font-normal text-slate-400 dark:text-slate-500 ml-1">
          {elapsedMs < 60000 ? 's' : ''}
        </span>
      </div>

      <div className="mt-4 h-6 flex items-center justify-center text-sm">
        {running ? (
          <span className="text-blue-600 dark:text-blue-400 font-medium">
            Timing in progress — press Space or Stop when solved
          </span>
        ) : elapsedMs > 0 && currentLevel ? (
          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
            <span>Recorded:</span>
            <span className="font-mono tabular-nums font-semibold text-slate-900 dark:text-slate-100">
              {elapsedMs} ms
            </span>
            <span aria-hidden="true">·</span>
            <span className={`font-semibold ${getLevelToneClasses(currentLevel)}`}>
              Level {currentLevel}
            </span>
          </div>
        ) : (
          <span className="text-slate-500 dark:text-slate-400">
            Press Spacebar or click Start to begin solving
          </span>
        )}
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        {!running ? (
          <button
            type="button"
            onClick={handleStart}
            disabled={disabled}
            className="inline-flex items-center justify-center gap-2.5 min-w-[168px] h-12 px-6 rounded-lg bg-blue-600 hover:bg-blue-700 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-base transition-all cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Start Timer</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={handleStop}
            className="inline-flex items-center justify-center gap-2.5 min-w-[168px] h-12 px-6 rounded-lg bg-rose-600 hover:bg-rose-700 active:scale-[0.99] text-white font-semibold text-base transition-all cursor-pointer whitespace-nowrap shrink-0 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-600"
          >
            <Square className="w-4 h-4 fill-current" />
            <span>Stop Timer</span>
          </button>
        )}

        {!running && elapsedMs > 0 && (
          <button
            type="button"
            onClick={handleReset}
            disabled={disabled}
            className="inline-flex items-center justify-center gap-2 h-12 px-4 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 font-medium text-sm transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Clear</span>
          </button>
        )}
      </div>
    </div>
  );
}
