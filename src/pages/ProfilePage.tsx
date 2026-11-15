import React, { useEffect, useState } from 'react';
import { Check, LogOut, Save } from 'lucide-react';
import { Avatar } from '../components/Avatar';
import { useAuth } from '../contexts/AuthContext';
import { updateUserProfileInfo } from '../services/dpsubeDb';
import { formatTimeMs, getLevelToneClasses } from '../utils/levels';

export function ProfilePage() {
  const { user, profile, logout } = useAuth();
  const [username, setUsername] = useState(profile?.username || '');
  const [photoUrl, setPhotoUrl] = useState(profile?.photoUrl || '');
  const [saving, setSaving] = useState(false);
  const [savedMsg, setSavedMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      setUsername(profile.username);
      setPhotoUrl(profile.photoUrl);
    }
  }, [profile]);

  const registrationDate = profile?.createdAt
    ? profile.createdAt.toDate().toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : user?.metadata?.creationTime
      ? new Date(user.metadata.creationTime).toLocaleDateString(undefined, {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
      : '—';

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setSavedMsg(null);
    setErrorMsg(null);
    try {
      await updateUserProfileInfo(user.uid, username, photoUrl);
      setSavedMsg('Profile details updated.');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            User Profile
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Your official DPSube identity and verified solving performance summary.
          </p>
        </div>

        <button
          type="button"
          onClick={logout}
          className="h-10 px-4 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-rose-50 dark:hover:bg-rose-950/40 hover:text-rose-700 dark:hover:text-rose-400 text-sm font-medium text-slate-700 dark:text-slate-200 inline-flex items-center gap-2 cursor-pointer transition-colors self-start sm:self-auto"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>

      {/* Identity & Official Stats Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="lg:col-span-2 p-6 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
            <Avatar
              src={profile?.photoUrl}
              alt={profile?.username || 'Profile picture'}
              sizeClass="w-16 h-16"
            />
            <div className="min-w-0">
              <h3 className="font-display text-xl font-bold text-slate-900 dark:text-white truncate">
                {profile?.username || 'Cuber'}
              </h3>
              <div className="mt-1 text-xs text-slate-500 dark:text-slate-400 flex flex-wrap items-center gap-2">
                <span>{user?.email}</span>
                <span aria-hidden="true">·</span>
                <span>Registered {registrationDate}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
            <div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Best Single</div>
              <div className="mt-1 font-mono tabular-nums text-2xl font-bold text-slate-900 dark:text-white">
                {formatTimeMs(profile?.bestSingleMs)}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {profile?.bestSingleLevel ? `Level ${profile.bestSingleLevel}` : '—'}
              </div>
            </div>

            <div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Best Average</div>
              <div className="mt-1 font-mono tabular-nums text-2xl font-bold text-slate-900 dark:text-white">
                {formatTimeMs(profile?.bestAverageMs)}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                {profile?.bestAverageLevel ? `Level ${profile.bestAverageLevel}` : '—'}
              </div>
            </div>

            <div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Current Single Level</div>
              <div
                className={`mt-1 font-mono tabular-nums text-2xl font-bold ${getLevelToneClasses(
                  profile?.currentSingleLevel
                )}`}
              >
                {profile?.currentSingleLevel || '—'}
              </div>
            </div>

            <div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Current Average Level</div>
              <div
                className={`mt-1 font-mono tabular-nums text-2xl font-bold ${getLevelToneClasses(
                  profile?.currentAverageLevel
                )}`}
              >
                {profile?.currentAverageLevel || '—'}
              </div>
            </div>

            <div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Total Single Solves</div>
              <div className="mt-1 font-mono tabular-nums text-2xl font-bold text-slate-900 dark:text-white">
                {profile?.totalSingleSolves ?? 0}
              </div>
            </div>

            <div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Total Average Sessions</div>
              <div className="mt-1 font-mono tabular-nums text-2xl font-bold text-slate-900 dark:text-white">
                {profile?.totalAverageSessions ?? 0}
              </div>
            </div>
          </div>
        </section>

        {/* Edit Profile Form */}
        <section className="p-6 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <h3 className="font-display text-base font-semibold text-slate-900 dark:text-white mb-4">
            Edit Profile
          </h3>

          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label
                htmlFor="profile-username"
                className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
              >
                Username
              </label>
              <input
                id="profile-username"
                type="text"
                required
                minLength={2}
                maxLength={40}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label
                htmlFor="profile-photo"
                className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
              >
                Profile Picture URL (optional)
              </label>
              <input
                id="profile-photo"
                type="url"
                maxLength={500}
                value={photoUrl}
                onChange={(e) => setPhotoUrl(e.target.value)}
                placeholder="Leave blank for default cube emblem"
                className="w-full h-10 px-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            {errorMsg && (
              <p className="text-xs text-rose-600 dark:text-rose-400">{errorMsg}</p>
            )}
            {savedMsg && (
              <p className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5" />
                <span>{savedMsg}</span>
              </p>
            )}

            <button
              type="submit"
              disabled={saving}
              className="w-full h-10 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold inline-flex items-center justify-center gap-2 cursor-pointer transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
