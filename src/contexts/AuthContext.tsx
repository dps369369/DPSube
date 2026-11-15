import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  browserLocalPersistence,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendEmailVerification,
  sendPasswordResetEmail,
  setPersistence,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  type User,
} from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';
import {
  ensureUserProfile,
  sanitizeUsername,
  subscribeAverageSessions,
  subscribeSingleSolves,
  subscribeUserProfile,
} from '../services/dpsubeDb';
import type {
  AverageSessionRecord,
  SingleSolveRecord,
  UserProfile,
} from '../types/dpsube';

interface AuthContextValue {
  user: User | null;
  profile: UserProfile | null;
  singleSolves: SingleSolveRecord[];
  averageSessions: AverageSessionRecord[];
  authLoading: boolean;
  dataLoading: boolean;
  dataError: string | null;
  needsVerification: boolean;
  registerWithEmail: (username: string, email: string, password: string) => Promise<void>;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  resendVerification: () => Promise<void>;
  refreshVerificationStatus: () => Promise<boolean>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [singleSolves, setSingleSolves] = useState<SingleSolveRecord[]>([]);
  const [averageSessions, setAverageSessions] = useState<AverageSessionRecord[]>([]);
  const [authLoading, setAuthLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);
  const [dataError, setDataError] = useState<string | null>(null);
  const [pendingUsername, setPendingUsername] = useState<string | undefined>(undefined);

  useEffect(() => {
    setPersistence(auth, browserLocalPersistence).catch(() => {
      // Persistence fallback handled silently by Firebase SDK
    });

    const unsubAuth = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setAuthLoading(false);
    });

    return () => unsubAuth();
  }, []);

  const needsVerification = Boolean(user && !user.emailVerified);

  useEffect(() => {
    if (!user || !user.emailVerified) {
      setProfile(null);
      setSingleSolves([]);
      setAverageSessions([]);
      setDataLoading(false);
      setDataError(null);
      return;
    }

    let cancelled = false;
    let unsubProfile: (() => void) | undefined;
    let unsubSolves: (() => void) | undefined;
    let unsubSessions: (() => void) | undefined;

    async function initUserStreams(activeUser: User) {
      setDataLoading(true);
      setDataError(null);
      try {
        await ensureUserProfile(activeUser, pendingUsername);
        if (cancelled) return;

        unsubProfile = subscribeUserProfile(
          activeUser.uid,
          (prof) => {
            setProfile(prof);
            setDataLoading(false);
          },
          (err) => {
            setDataError(err.message);
            setDataLoading(false);
          }
        );

        unsubSolves = subscribeSingleSolves(
          activeUser.uid,
          (solves) => setSingleSolves(solves),
          (err) => setDataError(err.message)
        );

        unsubSessions = subscribeAverageSessions(
          activeUser.uid,
          (sessions) => setAverageSessions(sessions),
          (err) => setDataError(err.message)
        );
      } catch (err) {
        if (!cancelled) {
          setDataError(err instanceof Error ? err.message : 'Failed to load profile data.');
          setDataLoading(false);
        }
      }
    }

    initUserStreams(user);

    return () => {
      cancelled = true;
      unsubProfile?.();
      unsubSolves?.();
      unsubSessions?.();
    };
  }, [user, user?.emailVerified, pendingUsername]);

  const registerWithEmail = async (username: string, email: string, password: string) => {
    const cleanName = sanitizeUsername(username, 'Cuber');
    setPendingUsername(cleanName);
    const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
    await updateProfile(cred.user, { displayName: cleanName });
    await sendEmailVerification(cred.user);
    setUser({ ...cred.user } as User);
  };

  const loginWithEmail = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email.trim(), password);
  };

  const loginWithGoogle = async () => {
    await signInWithPopup(auth, googleProvider);
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email.trim());
  };

  const resendVerification = async () => {
    if (auth.currentUser && !auth.currentUser.emailVerified) {
      await sendEmailVerification(auth.currentUser);
    }
  };

  const refreshVerificationStatus = async (): Promise<boolean> => {
    if (!auth.currentUser) return false;
    await auth.currentUser.reload();
    await auth.currentUser.getIdToken(true);
    const reloaded = auth.currentUser;
    setUser({ ...reloaded } as User);
    return reloaded.emailVerified;
  };

  const logout = async () => {
    setPendingUsername(undefined);
    await signOut(auth);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        singleSolves,
        averageSessions,
        authLoading,
        dataLoading,
        dataError,
        needsVerification,
        registerWithEmail,
        loginWithEmail,
        loginWithGoogle,
        resetPassword,
        resendVerification,
        refreshVerificationStatus,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return ctx;
}
