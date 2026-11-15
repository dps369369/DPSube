import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
  type Unsubscribe,
} from 'firebase/firestore';
import type { User } from 'firebase/auth';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import type {
  AverageSessionRecord,
  PerformanceLevel,
  SingleSolveRecord,
  UserProfile,
} from '../types/dpsube';
import { calculateLevel } from '../utils/levels';

function createDocId(prefix: string): string {
  const rand = Math.random().toString(36).slice(2, 10);
  return `${prefix}_${Date.now()}_${rand}`;
}

function sortByCreatedAtDesc<
  T extends { id: string; createdAt: { toMillis: () => number } | null }
>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    const aMs = a.createdAt ? a.createdAt.toMillis() : Number.MAX_SAFE_INTEGER;
    const bMs = b.createdAt ? b.createdAt.toMillis() : Number.MAX_SAFE_INTEGER;
    if (bMs !== aMs) return bMs - aMs;
    return b.id.localeCompare(a.id);
  });
}

export function sanitizeUsername(raw: string, fallback = 'Cuber'): string {
  const cleaned = raw.trim().replace(/\s+/g, ' ').slice(0, 40);
  if (cleaned.length >= 2) return cleaned;
  return fallback;
}

export function sanitizePhotoUrl(raw: string | null | undefined): string {
  if (!raw) return '';
  const trimmed = raw.trim();
  if (trimmed.length > 500) return '';
  if (trimmed === '' || trimmed.startsWith('https://') || trimmed.startsWith('http://')) {
    return trimmed;
  }
  return '';
}

function clampTimeMs(rawMs: number): number {
  const rounded = Math.round(rawMs);
  return Math.max(10, Math.min(86400000, rounded));
}

export async function ensureUserProfile(
  user: User,
  preferredUsername?: string
): Promise<UserProfile> {
  const userPath = `users/${user.uid}`;
  const userRef = doc(db, 'users', user.uid);

  let snap;
  try {
    snap = await getDoc(userRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, userPath);
  }

  if (snap.exists()) {
    return snap.data() as UserProfile;
  }

  const fallbackName = user.email ? user.email.split('@')[0] : 'Cuber';
  const username = sanitizeUsername(
    preferredUsername || user.displayName || fallbackName,
    'Cuber'
  );
  const photoUrl = sanitizePhotoUrl(user.photoURL);

  const initialDoc = {
    uid: user.uid,
    username,
    photoUrl,
    cubeType: '3x3' as const,
    bestSingleMs: null,
    bestSingleLevel: null,
    currentSingleLevel: null,
    bestAverageMs: null,
    bestAverageLevel: null,
    currentAverageLevel: null,
    totalSingleSolves: 0,
    totalAverageSessions: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  try {
    await setDoc(userRef, initialDoc);
    const createdSnap = await getDoc(userRef);
    return createdSnap.data() as UserProfile;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, userPath);
  }
}

export function subscribeUserProfile(
  uid: string,
  onData: (profile: UserProfile | null) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const path = `users/${uid}`;
  const userRef = doc(db, 'users', uid);

  return onSnapshot(
    userRef,
    (snapshot) => {
      if (snapshot.exists()) {
        onData(snapshot.data() as UserProfile);
      } else {
        onData(null);
      }
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.GET, path);
      } catch (wrapped) {
        onError?.(wrapped as Error);
      }
    }
  );
}

export function subscribeSingleSolves(
  uid: string,
  onData: (solves: SingleSolveRecord[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const path = `users/${uid}/singleSolves`;
  const q = query(collection(db, 'users', uid, 'singleSolves'), where('userId', '==', uid));

  return onSnapshot(
    q,
    (snapshot) => {
      const rows = sortByCreatedAtDesc(
        snapshot.docs.map((d) => d.data() as SingleSolveRecord)
      );
      onData(rows);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch (wrapped) {
        onError?.(wrapped as Error);
      }
    }
  );
}

export function subscribeAverageSessions(
  uid: string,
  onData: (sessions: AverageSessionRecord[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const path = `users/${uid}/averageSessions`;
  const q = query(collection(db, 'users', uid, 'averageSessions'), where('userId', '==', uid));

  return onSnapshot(
    q,
    (snapshot) => {
      const rows = sortByCreatedAtDesc(
        snapshot.docs.map((d) => d.data() as AverageSessionRecord)
      );
      onData(rows);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, path);
      } catch (wrapped) {
        onError?.(wrapped as Error);
      }
    }
  );
}

export interface SaveSingleResult {
  solveId: string;
  timeMs: number;
  level: PerformanceLevel;
  isNewBestSingle: boolean;
}

export async function saveSingleSolve(uid: string, rawTimeMs: number): Promise<SaveSingleResult> {
  const timeMs = clampTimeMs(rawTimeMs);
  const level = calculateLevel(timeMs);
  const solveId = createDocId('solve');
  const userRef = doc(db, 'users', uid);
  const solveRef = doc(db, 'users', uid, 'singleSolves', solveId);
  const path = `users/${uid}/singleSolves/${solveId}`;

  try {
    let isNewBestSingle = false;

    await runTransaction(db, async (tx) => {
      const userSnap = await tx.get(userRef);
      if (!userSnap.exists()) {
        throw new Error('User profile does not exist.');
      }
      const current = userSnap.data() as UserProfile;

      isNewBestSingle = current.bestSingleMs === null || timeMs < current.bestSingleMs;
      const nextBestSingleMs = isNewBestSingle ? timeMs : current.bestSingleMs;
      const nextBestSingleLevel =
        nextBestSingleMs !== null ? calculateLevel(nextBestSingleMs) : null;

      tx.set(solveRef, {
        id: solveId,
        userId: uid,
        timeMs,
        level,
        source: 'SINGLE',
        averageSessionId: null,
        cubeType: '3x3',
        createdAt: serverTimestamp(),
      });

      tx.update(userRef, {
        bestSingleMs: nextBestSingleMs,
        bestSingleLevel: nextBestSingleLevel,
        currentSingleLevel: level,
        totalSingleSolves: current.totalSingleSolves + 1,
        updatedAt: serverTimestamp(),
      });
    });

    return { solveId, timeMs, level, isNewBestSingle };
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export interface SaveAverageResult {
  sessionId: string;
  averageMs: number;
  averageLevel: PerformanceLevel;
  isNewBestSingle: boolean;
  isNewBestAverage: boolean;
}

export async function saveAverageSession(
  uid: string,
  rawTimesMs: number[]
): Promise<SaveAverageResult> {
  if (rawTimesMs.length !== 5) {
    throw new Error('Average of 5 requires exactly 5 completed solves.');
  }

  const solveTimesMs = rawTimesMs.map(clampTimeMs);
  const averageMs = clampTimeMs(solveTimesMs.reduce((sum, t) => sum + t, 0) / 5);
  const averageLevel = calculateLevel(averageMs);
  const solveLevels = solveTimesMs.map(calculateLevel);
  const sessionId = createDocId('ao5');
  const solveIds = solveTimesMs.map((_, idx) => createDocId(`ao5s${idx + 1}`));
  const minNewSingle = Math.min(...solveTimesMs);

  const userRef = doc(db, 'users', uid);
  const sessionRef = doc(db, 'users', uid, 'averageSessions', sessionId);
  const path = `users/${uid}/averageSessions/${sessionId}`;

  try {
    let isNewBestSingle = false;
    let isNewBestAverage = false;

    await runTransaction(db, async (tx) => {
      const userSnap = await tx.get(userRef);
      if (!userSnap.exists()) {
        throw new Error('User profile does not exist.');
      }
      const current = userSnap.data() as UserProfile;

      isNewBestSingle = current.bestSingleMs === null || minNewSingle < current.bestSingleMs;
      const nextBestSingleMs = isNewBestSingle ? minNewSingle : current.bestSingleMs;
      const nextBestSingleLevel =
        nextBestSingleMs !== null ? calculateLevel(nextBestSingleMs) : null;

      isNewBestAverage = current.bestAverageMs === null || averageMs < current.bestAverageMs;
      const nextBestAverageMs = isNewBestAverage ? averageMs : current.bestAverageMs;
      const nextBestAverageLevel =
        nextBestAverageMs !== null ? calculateLevel(nextBestAverageMs) : null;

      solveTimesMs.forEach((timeMs, index) => {
        const solveRef = doc(db, 'users', uid, 'singleSolves', solveIds[index]);
        tx.set(solveRef, {
          id: solveIds[index],
          userId: uid,
          timeMs,
          level: solveLevels[index],
          source: 'AO5',
          averageSessionId: sessionId,
          cubeType: '3x3',
          createdAt: serverTimestamp(),
        });
      });

      tx.set(sessionRef, {
        id: sessionId,
        userId: uid,
        solveIds,
        solveTimesMs,
        averageMs,
        averageLevel,
        cubeType: '3x3',
        createdAt: serverTimestamp(),
      });

      tx.update(userRef, {
        bestSingleMs: nextBestSingleMs,
        bestSingleLevel: nextBestSingleLevel,
        currentSingleLevel: solveLevels[4],
        bestAverageMs: nextBestAverageMs,
        bestAverageLevel: nextBestAverageLevel,
        currentAverageLevel: averageLevel,
        totalSingleSolves: current.totalSingleSolves + 5,
        totalAverageSessions: current.totalAverageSessions + 1,
        updatedAt: serverTimestamp(),
      });
    });

    return {
      sessionId,
      averageMs,
      averageLevel,
      isNewBestSingle,
      isNewBestAverage,
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

function computeStatsFromRemaining(
  remainingSolves: SingleSolveRecord[],
  remainingSessions: AverageSessionRecord[]
) {
  let bestSingleMs: number | null = null;
  for (const s of remainingSolves) {
    if (bestSingleMs === null || s.timeMs < bestSingleMs) {
      bestSingleMs = s.timeMs;
    }
  }
  const bestSingleLevel = bestSingleMs !== null ? calculateLevel(bestSingleMs) : null;
  const currentSingleLevel = remainingSolves.length > 0 ? remainingSolves[0].level : null;

  let bestAverageMs: number | null = null;
  for (const sess of remainingSessions) {
    if (bestAverageMs === null || sess.averageMs < bestAverageMs) {
      bestAverageMs = sess.averageMs;
    }
  }
  const bestAverageLevel = bestAverageMs !== null ? calculateLevel(bestAverageMs) : null;
  const currentAverageLevel =
    remainingSessions.length > 0 ? remainingSessions[0].averageLevel : null;

  return {
    bestSingleMs,
    bestSingleLevel,
    currentSingleLevel,
    bestAverageMs,
    bestAverageLevel,
    currentAverageLevel,
    totalSingleSolves: remainingSolves.length,
    totalAverageSessions: remainingSessions.length,
  };
}

export async function deleteSingleSolve(uid: string, solve: SingleSolveRecord): Promise<void> {
  if (solve.source !== 'SINGLE') {
    throw new Error('Ao5 solves must be removed by deleting their parent Average Session.');
  }

  const path = `users/${uid}/singleSolves/${solve.id}`;
  try {
    const [solvesSnap, sessionsSnap] = await Promise.all([
      getDocs(query(collection(db, 'users', uid, 'singleSolves'), where('userId', '==', uid))),
      getDocs(query(collection(db, 'users', uid, 'averageSessions'), where('userId', '==', uid))),
    ]);

    const remainingSolves = sortByCreatedAtDesc(
      solvesSnap.docs
        .map((d) => d.data() as SingleSolveRecord)
        .filter((s) => s.id !== solve.id)
    );
    const remainingSessions = sortByCreatedAtDesc(
      sessionsSnap.docs.map((d) => d.data() as AverageSessionRecord)
    );

    const nextStats = computeStatsFromRemaining(remainingSolves, remainingSessions);

    const batch = writeBatch(db);
    batch.delete(doc(db, 'users', uid, 'singleSolves', solve.id));
    batch.update(doc(db, 'users', uid), {
      ...nextStats,
      updatedAt: serverTimestamp(),
    });
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function deleteAverageSession(
  uid: string,
  session: AverageSessionRecord
): Promise<void> {
  const path = `users/${uid}/averageSessions/${session.id}`;
  try {
    const [solvesSnap, sessionsSnap] = await Promise.all([
      getDocs(query(collection(db, 'users', uid, 'singleSolves'), where('userId', '==', uid))),
      getDocs(query(collection(db, 'users', uid, 'averageSessions'), where('userId', '==', uid))),
    ]);

    const deletedSolveSet = new Set(session.solveIds);
    const remainingSolves = sortByCreatedAtDesc(
      solvesSnap.docs
        .map((d) => d.data() as SingleSolveRecord)
        .filter((s) => !deletedSolveSet.has(s.id))
    );
    const remainingSessions = sortByCreatedAtDesc(
      sessionsSnap.docs
        .map((d) => d.data() as AverageSessionRecord)
        .filter((s) => s.id !== session.id)
    );

    const nextStats = computeStatsFromRemaining(remainingSolves, remainingSessions);

    const batch = writeBatch(db);
    batch.delete(doc(db, 'users', uid, 'averageSessions', session.id));
    for (const solveId of session.solveIds) {
      batch.delete(doc(db, 'users', uid, 'singleSolves', solveId));
    }
    batch.update(doc(db, 'users', uid), {
      ...nextStats,
      updatedAt: serverTimestamp(),
    });
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function updateUserProfileInfo(
  uid: string,
  rawUsername: string,
  rawPhotoUrl: string
): Promise<void> {
  const username = sanitizeUsername(rawUsername, '');
  if (username.length < 2) {
    throw new Error('Username must be at least 2 characters long.');
  }
  const photoUrl = sanitizePhotoUrl(rawPhotoUrl);
  const path = `users/${uid}`;

  try {
    await updateDoc(doc(db, 'users', uid), {
      username,
      photoUrl,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}
