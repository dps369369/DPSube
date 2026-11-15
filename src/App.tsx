import React, { useEffect, useState } from 'react';
import { AuthScreen } from './components/AuthScreen';
import { Layout } from './components/Layout';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { DashboardPage } from './pages/DashboardPage';
import { HistoryPage } from './pages/HistoryPage';
import { LevelsPage } from './pages/LevelsPage';
import { ProfilePage } from './pages/ProfilePage';
import { QuickPracticePage } from './pages/QuickPracticePage';
import { RecordsPage } from './pages/RecordsPage';
import { TrackingPage } from './pages/TrackingPage';
import type { NavRoute } from './types/dpsube';

function ProtectedApp() {
  const { user, authLoading, needsVerification, dataError } = useAuth();
  const [route, setRoute] = useState<NavRoute>('dashboard');
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    try {
      return localStorage.getItem('dpsube_theme') === 'dark';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    const root = document.documentElement;
    if (darkMode) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    try {
      localStorage.setItem('dpsube_theme', darkMode ? 'dark' : 'light');
    } catch {
      // Ignore storage errors in restricted contexts
    }
  }, [darkMode]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-6">
        <div className="text-center space-y-2">
          <div className="font-display text-xl font-bold text-slate-900 dark:text-white">
            DPSube
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Restoring session...
          </div>
        </div>
      </div>
    );
  }

  if (!user || needsVerification) {
    return <AuthScreen />;
  }

  return (
    <Layout
      activeRoute={route}
      onNavigate={setRoute}
      darkMode={darkMode}
      onToggleDarkMode={() => setDarkMode((d) => !d)}
    >
      {dataError && (
        <div className="mb-6 p-4 rounded-xl border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/40 text-sm text-rose-700 dark:text-rose-300">
          {dataError}
        </div>
      )}

      {route === 'dashboard' && <DashboardPage onNavigate={setRoute} />}
      {route === 'tracking' && <TrackingPage />}
      {route === 'levels' && <LevelsPage />}
      {route === 'records' && <RecordsPage />}
      {route === 'history' && <HistoryPage />}
      {route === 'profile' && <ProfilePage />}
      {route === 'quick-solving' && <QuickPracticePage mode="quick-solving" />}
      {route === 'quick-versus' && <QuickPracticePage mode="quick-versus" />}
    </Layout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ProtectedApp />
    </AuthProvider>
  );
}
