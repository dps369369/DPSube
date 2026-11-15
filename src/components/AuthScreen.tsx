import React, { useState } from 'react';
import { ArrowRight, CheckCircle2, Mail, RefreshCw, ShieldAlert } from 'lucide-react';
import authCubeImg from '../assets/images/auth_cube_studio_1794733636219.jpg';
import { useAuth } from '../contexts/AuthContext';

type AuthMode = 'login' | 'register' | 'forgot';

function mapAuthError(err: unknown): { message: string; isProviderDisabled: boolean } {
  const raw = err instanceof Error ? err.message : String(err);
  if (raw.includes('auth/operation-not-allowed')) {
    return {
      message:
        'Email/Password sign-in is not yet enabled in the Firebase Console for this project. You can sign in immediately with Google below, or enable Email/Password under Firebase Console → Authentication → Sign-in method.',
      isProviderDisabled: true,
    };
  }
  if (raw.includes('auth/invalid-credential') || raw.includes('auth/wrong-password')) {
    return { message: 'Incorrect email or password. Please try again.', isProviderDisabled: false };
  }
  if (raw.includes('auth/user-not-found')) {
    return { message: 'No account found with that email address.', isProviderDisabled: false };
  }
  if (raw.includes('auth/email-already-in-use')) {
    return {
      message: 'An account with this email already exists. Please sign in instead.',
      isProviderDisabled: false,
    };
  }
  if (raw.includes('auth/weak-password')) {
    return {
      message: 'Password must be at least 6 characters long.',
      isProviderDisabled: false,
    };
  }
  if (raw.includes('auth/popup-closed-by-user')) {
    return { message: 'Google sign-in popup was closed before completing.', isProviderDisabled: false };
  }
  return { message: raw.replace('Firebase: ', ''), isProviderDisabled: false };
}

export function AuthScreen() {
  const {
    user,
    needsVerification,
    registerWithEmail,
    loginWithEmail,
    loginWithGoogle,
    resetPassword,
    resendVerification,
    refreshVerificationStatus,
    logout,
  } = useAuth();

  const [mode, setMode] = useState<AuthMode>('login');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);
  const [imgFailed, setImgFailed] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setInfoMsg(null);

    if (mode === 'register') {
      if (username.trim().length < 2) {
        setErrorMsg('Username must be at least 2 characters.');
        return;
      }
      if (password !== confirmPassword) {
        setErrorMsg('Passwords do not match.');
        return;
      }
    }

    setSubmitting(true);
    try {
      if (mode === 'login') {
        await loginWithEmail(email, password);
      } else if (mode === 'register') {
        await registerWithEmail(username, email, password);
        setInfoMsg('Account created. A verification link has been sent to your email.');
      } else {
        await resetPassword(email);
        setInfoMsg('Password reset instructions have been sent to your email.');
      }
    } catch (err) {
      const mapped = mapAuthError(err);
      setErrorMsg(mapped.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogle = async () => {
    setErrorMsg(null);
    setInfoMsg(null);
    setSubmitting(true);
    try {
      await loginWithGoogle();
    } catch (err) {
      const mapped = mapAuthError(err);
      setErrorMsg(mapped.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCheckVerification = async () => {
    setErrorMsg(null);
    setInfoMsg(null);
    setSubmitting(true);
    try {
      const verified = await refreshVerificationStatus();
      if (!verified) {
        setErrorMsg(
          'Your email is still unverified. Click the link in your inbox, then refresh again.'
        );
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Unable to check verification status.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResendVerification = async () => {
    setErrorMsg(null);
    setInfoMsg(null);
    setSubmitting(true);
    try {
      await resendVerification();
      setInfoMsg('Verification email resent. Please check your inbox and spam folder.');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to resend verification email.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col lg:flex-row">
      {/* Left Brand & Studio Showcase Column */}
      <div className="lg:w-1/2 bg-slate-900 text-white p-8 sm:p-12 lg:p-16 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-slate-800">
        <div>
          <div className="flex items-center justify-between">
            <span className="font-display text-2xl font-bold tracking-tight text-white">
              DPSube
            </span>
            <span className="text-xs font-medium text-slate-400">
              3x3 Performance Tracker
            </span>
          </div>

          <div className="mt-12 max-w-lg">
            <h1 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white leading-tight [text-wrap:balance]">
              Track. Improve. Progress.
            </h1>
            <p className="mt-4 text-base text-slate-300 leading-relaxed">
              Precision Rubik&apos;s Cube timing built for structured improvement. Record
              official single solves and Average of 5 sessions, monitor continuous L0–L9
              levels, and keep practice runs strictly separate from your personal records.
            </p>
          </div>
        </div>

        <div className="my-8 lg:my-10">
          <div className="rounded-xl overflow-hidden border border-slate-800 bg-slate-950 aspect-[4/3] max-h-[340px] w-full">
            {!imgFailed ? (
              <img
                src={authCubeImg}
                alt="Matte black 3x3 speedcube beside a precision digital chronometer"
                referrerPolicy="no-referrer"
                onError={() => setImgFailed(true)}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-slate-900 text-slate-400 text-sm">
                DPSube Precision Chronometer Studio
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6 pt-6 border-t border-slate-800 text-sm">
          <div>
            <div className="font-mono tabular-nums text-lg font-semibold text-white">1 ms</div>
            <div className="text-xs text-slate-400 mt-0.5">Storage precision</div>
          </div>
          <div>
            <div className="font-mono tabular-nums text-lg font-semibold text-white">L0–L9</div>
            <div className="text-xs text-slate-400 mt-0.5">Continuous tiers</div>
          </div>
          <div>
            <div className="font-mono tabular-nums text-lg font-semibold text-white">Ao5</div>
            <div className="text-xs text-slate-400 mt-0.5">Atomic session logs</div>
          </div>
        </div>
      </div>

      {/* Right Authentication Column */}
      <div className="lg:w-1/2 flex items-center justify-center p-6 sm:p-12">
        <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 sm:p-8">
          {needsVerification && user ? (
            <div>
              <div className="flex items-center gap-2.5 text-amber-600 dark:text-amber-400 mb-3">
                <Mail className="w-5 h-5" />
                <span className="text-sm font-semibold">Email Verification Required</span>
              </div>
              <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-white">
                Verify your account
              </h2>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                We sent a verification link to{' '}
                <span className="font-medium text-slate-900 dark:text-slate-200">
                  {user.email}
                </span>
                . Please verify your email address before accessing your official solving database.
              </p>

              {errorMsg && (
                <div className="mt-4 p-3 rounded-lg border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/40 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2">
                  <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {infoMsg && (
                <div className="mt-4 p-3 rounded-lg border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/40 text-xs text-emerald-700 dark:text-emerald-300 flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{infoMsg}</span>
                </div>
              )}

              <div className="mt-6 space-y-3">
                <button
                  type="button"
                  onClick={handleCheckVerification}
                  disabled={submitting}
                  className="w-full h-11 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold inline-flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  <RefreshCw className={`w-4 h-4 ${submitting ? 'animate-spin' : ''}`} />
                  <span>I Have Verified — Continue</span>
                </button>
                <button
                  type="button"
                  onClick={handleResendVerification}
                  disabled={submitting}
                  className="w-full h-11 px-4 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-sm font-medium cursor-pointer transition-colors"
                >
                  Resend Verification Email
                </button>
                <button
                  type="button"
                  onClick={logout}
                  className="w-full h-10 px-4 text-xs font-medium text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 cursor-pointer"
                >
                  Sign out and use a different account
                </button>
              </div>
            </div>
          ) : (
            <div>
              {/* Mode Switcher */}
              <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg mb-6">
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setErrorMsg(null);
                    setInfoMsg(null);
                  }}
                  className={`flex-1 py-2 text-xs font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                    mode === 'login'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode('register');
                    setErrorMsg(null);
                    setInfoMsg(null);
                  }}
                  className={`flex-1 py-2 text-xs font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                    mode === 'register'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Create Account
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode('forgot');
                    setErrorMsg(null);
                    setInfoMsg(null);
                  }}
                  className={`flex-1 py-2 text-xs font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                    mode === 'forgot'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  Reset Password
                </button>
              </div>

              <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-white">
                {mode === 'login' && 'Sign in to DPSube'}
                {mode === 'register' && 'Create your DPSube profile'}
                {mode === 'forgot' && 'Reset your password'}
              </h2>
              <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
                {mode === 'login' && 'Access your personal solving tracker and official history.'}
                {mode === 'register' && 'Start recording official single solves and Ao5 sessions.'}
                {mode === 'forgot' && 'Enter your email address to receive a password reset link.'}
              </p>

              {errorMsg && (
                <div className="mt-4 p-3 rounded-lg border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/40 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2 leading-relaxed">
                  <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {infoMsg && (
                <div className="mt-4 p-3 rounded-lg border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/40 text-xs text-emerald-700 dark:text-emerald-300 flex items-start gap-2 leading-relaxed">
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{infoMsg}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="mt-5 space-y-4">
                {mode === 'register' && (
                  <div>
                    <label
                      htmlFor="auth-username"
                      className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
                    >
                      Username
                    </label>
                    <input
                      id="auth-username"
                      type="text"
                      required
                      minLength={2}
                      maxLength={40}
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="AlexCuber"
                      className="w-full h-11 px-3.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                )}

                <div>
                  <label
                    htmlFor="auth-email"
                    className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
                  >
                    Email address
                  </label>
                  <input
                    id="auth-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full h-11 px-3.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                {mode !== 'forgot' && (
                  <div>
                    <label
                      htmlFor="auth-password"
                      className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
                    >
                      Password
                    </label>
                    <input
                      id="auth-password"
                      type="password"
                      required
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="At least 6 characters"
                      className="w-full h-11 px-3.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                )}

                {mode === 'register' && (
                  <div>
                    <label
                      htmlFor="auth-confirm"
                      className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5"
                    >
                      Confirm password
                    </label>
                    <input
                      id="auth-confirm"
                      type="password"
                      required
                      minLength={6}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter password"
                      className="w-full h-11 px-3.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
                    />
                  </div>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full h-11 px-4 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold inline-flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  <span>
                    {submitting
                      ? 'Processing...'
                      : mode === 'login'
                        ? 'Sign In'
                        : mode === 'register'
                          ? 'Create Account'
                          : 'Send Reset Link'}
                  </span>
                  {!submitting && <ArrowRight className="w-4 h-4" />}
                </button>
              </form>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200 dark:border-slate-800" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-white dark:bg-slate-900 px-3 text-slate-500 dark:text-slate-400">
                    or continue with
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleGoogle}
                disabled={submitting}
                className="w-full h-11 px-4 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-950 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 text-sm font-medium inline-flex items-center justify-center gap-2.5 cursor-pointer transition-colors"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24Z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14Z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96Z"
                  />
                </svg>
                <span>Continue with Google</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
