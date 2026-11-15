import type { PerformanceLevel } from '../types/dpsube';

export interface LevelDefinition {
  level: PerformanceLevel;
  rank: number; // 10 = fastest (L1), 1 = slowest (L0)
  label: string;
  rangeText: string;
  exactBoundaryText: string;
  description: string;
}

export const LEVEL_DEFINITIONS: LevelDefinition[] = [
  {
    level: 'L1',
    rank: 10,
    label: 'Tier 1 — Sub-26s',
    rangeText: 'Less than 26s',
    exactBoundaryText: '0.00s – 25.99s',
    description: 'High-efficiency lookahead and fluid F2L execution.',
  },
  {
    level: 'L2',
    rank: 9,
    label: 'Tier 2 — 26–29s',
    rangeText: '26–29 seconds',
    exactBoundaryText: '26.00s – 29.99s',
    description: 'Consistent sub-30 solving with minimal pauses.',
  },
  {
    level: 'L3',
    rank: 8,
    label: 'Tier 3 — 30–34s',
    rangeText: '30–34 seconds',
    exactBoundaryText: '30.00s – 34.99s',
    description: 'Approaching the sub-30 barrier with steady recognition.',
  },
  {
    level: 'L4',
    rank: 7,
    label: 'Tier 4 — 35–44s',
    rangeText: '35–44 seconds',
    exactBoundaryText: '35.00s – 44.99s',
    description: 'Solid intermediate pace and growing algorithm fluency.',
  },
  {
    level: 'L5',
    rank: 6,
    label: 'Tier 5 — 45–59s',
    rangeText: '45–59 seconds',
    exactBoundaryText: '45.00s – 59.99s',
    description: 'Sub-minute benchmark achieved across standard solves.',
  },
  {
    level: 'L6',
    rank: 5,
    label: 'Tier 6 — 60–79s',
    rangeText: '60–79 seconds',
    exactBoundaryText: '60.00s – 79.99s',
    description: 'Transitioning from beginner methods toward intuitive F2L.',
  },
  {
    level: 'L7',
    rank: 4,
    label: 'Tier 7 — 80–119s',
    rangeText: '80–119 seconds',
    exactBoundaryText: '80.00s – 119.99s',
    description: 'Sub-2-minute consistency and clean cross planning.',
  },
  {
    level: 'L8',
    rank: 3,
    label: 'Tier 8 — 120–199s',
    rangeText: '120–199 seconds',
    exactBoundaryText: '120.00s – 199.99s',
    description: 'Structured layer-by-layer completion under 3:20.',
  },
  {
    level: 'L9',
    rank: 2,
    label: 'Tier 9 — 200–300s',
    rangeText: '200–300 seconds',
    exactBoundaryText: '200.00s – 300.00s',
    description: 'Complete solves within the five-minute window.',
  },
  {
    level: 'L0',
    rank: 1,
    label: 'Tier 0 — Foundation',
    rangeText: 'More than 300s',
    exactBoundaryText: '> 300.00s',
    description: 'Entry benchmark focused on completion accuracy.',
  },
];

/**
 * Continuous millisecond-precision level classification (L0 to L9).
 * Matches exact boundary rules:
 * - 25.99s (25990ms) -> L1
 * - 26.00s (26000ms) -> L2
 * - 29.99s (29990ms) -> L2
 * - 30.00s (30000ms) -> L3
 * - 300.00s (300000ms) -> L9
 * - > 300.00s (>300000ms) -> L0
 */
export function calculateLevel(timeMs: number): PerformanceLevel {
  if (timeMs < 26000) return 'L1';
  if (timeMs < 30000) return 'L2';
  if (timeMs < 35000) return 'L3';
  if (timeMs < 45000) return 'L4';
  if (timeMs < 60000) return 'L5';
  if (timeMs < 80000) return 'L6';
  if (timeMs < 120000) return 'L7';
  if (timeMs < 200000) return 'L8';
  if (timeMs <= 300000) return 'L9';
  return 'L0';
}

export function getLevelDefinition(level: PerformanceLevel | null | undefined): LevelDefinition | null {
  if (!level) return null;
  return LEVEL_DEFINITIONS.find((d) => d.level === level) ?? null;
}

export function getLevelToneClasses(level: PerformanceLevel | null | undefined): string {
  switch (level) {
    case 'L1':
    case 'L2':
      return 'text-emerald-700 dark:text-emerald-400';
    case 'L3':
    case 'L4':
      return 'text-blue-700 dark:text-blue-400';
    case 'L5':
    case 'L6':
      return 'text-slate-800 dark:text-slate-200';
    case 'L7':
    case 'L8':
      return 'text-amber-700 dark:text-amber-400';
    case 'L9':
    case 'L0':
      return 'text-slate-600 dark:text-slate-400';
    default:
      return 'text-slate-500 dark:text-slate-400';
  }
}

/**
 * Formats milliseconds into crisp speedcubing clock strings:
 * - < 60s: "24.83s" (or without suffix when compact=false -> "24.83")
 * - >= 60s: "1:12.45"
 */
export function formatTimeMs(ms: number | null | undefined, includeUnit = true): string {
  if (ms === null || ms === undefined || Number.isNaN(ms)) {
    return '—';
  }
  const clamped = Math.max(0, Math.round(ms));
  const totalSeconds = Math.floor(clamped / 1000);
  const centiseconds = Math.floor((clamped % 1000) / 10);
  const csStr = centiseconds.toString().padStart(2, '0');

  if (totalSeconds < 60) {
    return `${totalSeconds}.${csStr}${includeUnit ? 's' : ''}`;
  }

  const minutes = Math.floor(totalSeconds / 60);
  const seconds = (totalSeconds % 60).toString().padStart(2, '0');
  return `${minutes}:${seconds}.${csStr}`;
}

export function formatExactSeconds(ms: number): string {
  const sec = (ms / 1000).toFixed(2);
  return `${sec}s`;
}

/**
 * Standard 20-move 3x3 WCA-style scramble generator.
 */
const FACES = ['R', 'L', 'U', 'D', 'F', 'B'] as const;
const AXIS: Record<(typeof FACES)[number], number> = {
  R: 0,
  L: 0,
  U: 1,
  D: 1,
  F: 2,
  B: 2,
};
const MODIFIERS = ['', "'", '2'] as const;

export function generateScramble(length = 20): string {
  const moves: string[] = [];
  let lastFace: (typeof FACES)[number] | null = null;
  let prevAxis = -1;

  for (let i = 0; i < length; i++) {
    let candidate = FACES[Math.floor(Math.random() * FACES.length)];
    while (
      candidate === lastFace ||
      (lastFace !== null && AXIS[candidate] === AXIS[lastFace] && AXIS[candidate] === prevAxis)
    ) {
      candidate = FACES[Math.floor(Math.random() * FACES.length)];
    }
    const mod = MODIFIERS[Math.floor(Math.random() * MODIFIERS.length)];
    moves.push(`${candidate}${mod}`);
    prevAxis = lastFace !== null ? AXIS[lastFace] : -1;
    lastFace = candidate;
  }

  return moves.join(' ');
}
