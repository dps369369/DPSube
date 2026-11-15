import type { Timestamp } from 'firebase/firestore';

export type PerformanceLevel =
  | 'L0'
  | 'L1'
  | 'L2'
  | 'L3'
  | 'L4'
  | 'L5'
  | 'L6'
  | 'L7'
  | 'L8'
  | 'L9';

export type TrackingSource = 'SINGLE' | 'AO5';

export type CubeType = '3x3';

export type NavRoute =
  | 'dashboard'
  | 'tracking'
  | 'levels'
  | 'records'
  | 'history'
  | 'profile'
  | 'quick-solving'
  | 'quick-versus';

export interface UserProfile {
  uid: string;
  username: string;
  photoUrl: string;
  cubeType: CubeType;
  bestSingleMs: number | null;
  bestSingleLevel: PerformanceLevel | null;
  currentSingleLevel: PerformanceLevel | null;
  bestAverageMs: number | null;
  bestAverageLevel: PerformanceLevel | null;
  currentAverageLevel: PerformanceLevel | null;
  totalSingleSolves: number;
  totalAverageSessions: number;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
}

export interface SingleSolveRecord {
  id: string;
  userId: string;
  timeMs: number;
  level: PerformanceLevel;
  source: TrackingSource;
  averageSessionId: string | null;
  cubeType: CubeType;
  createdAt: Timestamp | null;
}

export interface AverageSessionRecord {
  id: string;
  userId: string;
  solveIds: string[];
  solveTimesMs: number[];
  averageMs: number;
  averageLevel: PerformanceLevel;
  cubeType: CubeType;
  createdAt: Timestamp | null;
}
