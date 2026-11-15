import React, { useState } from 'react';
import {
  Award,
  BarChart3,
  Clock,
  History,
  Layers,
  LogOut,
  Menu,
  Moon,
  Sun,
  Swords,
  Timer,
  User as UserIcon,
  X,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import type { NavRoute } from '../types/dpsube';
import { Avatar } from './Avatar';

interface LayoutProps {
  activeRoute: NavRoute;
  onNavigate: (route: NavRoute) => void;
  darkMode: boolean;
  onToggleDarkMode: () => void;
  children: React.ReactNode;
}

const OFFICIAL_NAV: { id: NavRoute; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
  { id: 'tracking', label: 'Tracking', icon: Timer },
  { id: 'levels', label: 'Levels', icon: Layers },
  { id: 'records', label: 'Records', icon: Award },
  { id: 'history', label: 'History', icon: History },
  { id: 'profile', label: 'Profile', icon: UserIcon },
];

const PRACTICE_NAV: { id: NavRoute; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'quick-solving', label: 'Quick Solving', icon: Clock },
  { id: 'quick-versus', label: 'Quick Versus', icon: Swords },
];

const ROUTE_TITLES: Record<NavRoute, { section: string; title: string }> = {
  dashboard: { section: 'Official', title: 'Dashboard' },
  tracking: { section: 'Official', title: 'Tracking' },
  levels: { section: 'Official', title: 'Levels' },
  records: { section: 'Official', title: 'Records' },
  history: { section: 'Official', title: 'History' },
  profile: { section: 'Official', title: 'Profile' },
  'quick-solving': { section: 'Practice', title: 'Quick Solving' },
  'quick-versus': { section: 'Practice', title: 'Quick Versus' },
};

export function Layout({
  activeRoute,
  onNavigate,
  darkMode,
  onToggleDarkMode,
  children,
}: LayoutProps) {
  const { profile, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const meta = ROUTE_TITLES[activeRoute];

  const handleSelectRoute = (route: NavRoute) => {
    onNavigate(route);
    setMobileOpen(false);
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800">
      <div className="h-14 px-5 flex items-center justify-between border-b border-slate-200 dark:border-slate-800 shrink-0">
        <button
          type="button"
          onClick={() => handleSelectRoute('dashboard')}
          className="font-display text-lg font-bold tracking-tight text-slate-900 dark:text-white cursor-pointer whitespace-nowrap"
        >
          DPSube
        </button>
        <button
          type="button"
          onClick={() => setMobileOpen(false)}
          className="lg:hidden p-1.5 rounded-md text-slate-500 hover:text-slate-900 dark:hover:text-white cursor-pointer"
          aria-label="Close navigation"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-5 space-y-6" aria-label="Primary">
        <div>
          <div className="px-3 mb-2 text-xs font-medium text-slate-400 dark:text-slate-500">
            Performance
          </div>
          <ul className="space-y-1">
            {OFFICIAL_NAV.map((item) => {
              const Icon = item.icon;
              const isActive = activeRoute === item.id;
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => handleSelectRoute(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer whitespace-nowrap ${
                      isActive
                        ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
          <div className="px-3 mb-2 text-xs font-medium text-slate-400 dark:text-slate-500">
            Practice Environments
          </div>
          <ul className="space-y-1">
            {PRACTICE_NAV.map((item) => {
              const Icon = item.icon;
              const isActive = activeRoute === item.id;
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => handleSelectRoute(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer whitespace-nowrap ${
                      isActive
                        ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white'
                        : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </nav>

      <div className="p-3 border-t border-slate-200 dark:border-slate-800 space-y-2 shrink-0">
        <button
          type="button"
          onClick={() => handleSelectRoute('profile')}
          className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-left cursor-pointer"
        >
          <Avatar
            src={profile?.photoUrl}
            alt={profile?.username || 'User profile'}
            sizeClass="w-8 h-8"
          />
          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium text-slate-900 dark:text-white truncate">
              {profile?.username || 'Cuber'}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
              {profile?.currentSingleLevel ? `Single ${profile.currentSingleLevel}` : 'Unranked'}
            </div>
          </div>
        </button>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onToggleDarkMode}
            className="flex-1 h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 inline-flex items-center justify-center gap-1.5 cursor-pointer transition-colors whitespace-nowrap"
          >
            {darkMode ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            <span>{darkMode ? 'Light' : 'Dark'}</span>
          </button>
          <button
            type="button"
            onClick={logout}
            className="flex-1 h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-700 dark:hover:text-rose-400 inline-flex items-center justify-center gap-1.5 cursor-pointer transition-colors whitespace-nowrap"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign out</span>
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-60 shrink-0 sticky top-0 h-screen">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-950/50"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
          <div className="relative w-64 max-w-[80vw] h-full z-10">{sidebarContent}</div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 flex flex-col">
        <header className="h-14 px-4 sm:px-6 lg:px-8 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4 sticky top-0 z-30">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-2 -ml-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
              aria-label="Open navigation"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 text-sm min-w-0">
              <span className="text-slate-400 dark:text-slate-500 hidden sm:inline whitespace-nowrap">
                DPSube
              </span>
              <span className="text-slate-300 dark:text-slate-700 hidden sm:inline">/</span>
              <span className="text-slate-500 dark:text-slate-400 whitespace-nowrap">
                {meta.section}
              </span>
              <span className="text-slate-300 dark:text-slate-700">/</span>
              <h1 className="font-display font-semibold text-slate-900 dark:text-white truncate">
                {meta.title}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {activeRoute !== 'tracking' && (
              <button
                type="button"
                onClick={() => onNavigate('tracking')}
                className="h-9 px-3.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer transition-colors whitespace-nowrap shrink-0"
              >
                <Timer className="w-3.5 h-3.5" />
                <span>Start Tracking</span>
              </button>
            )}
          </div>
        </header>

        <main className="flex-1 w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
