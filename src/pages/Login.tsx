import React, { useState } from 'react';
import { useLocation, useNavigate, Link, Navigate } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, LogIn, ArrowRight, ChevronRight } from 'lucide-react';
import { GoogleAuthProvider, signInWithEmailAndPassword, signInWithPopup, sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '@/firebase';
import TrackfitMark from '@/components/TrackfitMark';
import { Input } from '@/components/ui/input';
import { useAuth, normalizeIdentifier } from '@/lib/auth';

export default function Login() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const locationState = location.state as { from?: { pathname?: string } } | undefined;
  const from = locationState?.from?.pathname || '/dashboard';

  if (!authLoading && user) {
    return <Navigate to={from} replace />;
  }

  const handleEmailPasswordLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setInfo(null);

    if (!identifier || !password) {
      setError('Please enter both username/email and password.');
      return;
    }

    try {
      setLoading(true);
      const { email } = normalizeIdentifier(identifier);

      if (!email) {
        setError('Please enter a valid username or email.');
        setLoading(false);
        return;
      }

      await signInWithEmailAndPassword(auth, email, password);
      navigate(from, { replace: true });
    } catch (err: any) {
      let message = 'Unable to sign in. Please check your details.';
      if (err?.code === 'auth/user-not-found') {
        message = 'No account found for that username or email.';
      } else if (err?.code === 'auth/wrong-password') {
        message = 'Incorrect password. Please try again.';
      } else if (err?.code === 'auth/too-many-requests') {
        message = 'Too many attempts. Please try again later.';
      } else if (err?.code === 'auth/configuration-not-found') {
        message =
          'Authentication is not fully configured for this Firebase project. Enable Email/Password sign-in in your Firebase console.';
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    setInfo(null);
    try {
      setLoading(true);
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      navigate(from, { replace: true });
    } catch (err: any) {
      if (err?.code !== 'auth/popup-closed-by-user') {
        setError('Google sign-in failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    setError(null);
    setInfo(null);

    if (!identifier) {
      setError('Enter your email above so we can send a reset link.');
      return;
    }

    if (!identifier.includes('@')) {
      setError('Password reset requires an email address, not just a username.');
      return;
    }

    try {
      setLoading(true);
      await sendPasswordResetEmail(auth, identifier.trim());
      setInfo('Password reset link sent. Check your inbox.');
    } catch (err: any) {
      let message = 'Unable to send reset link right now.';
      if (err?.code === 'auth/user-not-found') {
        message = 'No account found for that email.';
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-[#020805] via-[#020907] to-black px-4 py-10 text-zinc-100">
      <div className="mx-auto w-full max-w-sm sm:max-w-md">
        <div className="relative w-full rounded-[38px] border border-emerald-500/20 bg-gradient-to-b from-[#07140b] via-[#031007] to-black p-7 shadow-[0_26px_80px_rgba(0,0,0,0.85)]">
          <div className="absolute inset-x-10 -top-12 flex justify-center">
            <div className="relative flex h-24 w-24 items-center justify-center rounded-full border border-emerald-400/40 bg-gradient-to-b from-[#0f2a18] via-[#03150a] to-black shadow-[0_0_45px_rgba(34,197,94,0.75)]">
              <div className="absolute inset-1 rounded-full bg-gradient-to-b from-emerald-500/30 via-emerald-600/10 to-transparent" />
              <TrackfitMark size={40} />
            </div>
          </div>

          <div className="mt-10 space-y-1 text-center">
            <h1 className="text-2xl font-semibold text-white sm:text-3xl">Welcome Back</h1>
            <p className="text-sm text-emerald-100/80">
              Log in to continue your fitness journey
            </p>
          </div>

          <form onSubmit={handleEmailPasswordLogin} className="mt-8 space-y-5">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-200/80">
                Username or Email
              </label>
              <div className="relative">
                <Input
                  type="text"
                  autoComplete="username"
                  placeholder="Enter your username or email"
                  value={identifier}
                  onChange={event => setIdentifier(event.target.value)}
                  className="h-11 rounded-2xl border-emerald-500/30 bg-black/40 pr-11 text-sm text-emerald-50 placeholder:text-emerald-100/40"
                />
                <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-emerald-300/80">
                  <Mail className="h-4 w-4" />
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-200/80">
                  Password
                </label>
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-[11px] font-medium text-emerald-300 hover:text-emerald-200"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  value={password}
                  onChange={event => setPassword(event.target.value)}
                  className="h-11 rounded-2xl border-emerald-500/30 bg-black/40 pr-11 text-sm text-emerald-50 placeholder:text-emerald-100/40"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(prev => !prev)}
                  className="absolute inset-y-0 right-3 flex items-center text-emerald-300/80 hover:text-emerald-200"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                  <span className="sr-only">
                    {showPassword ? 'Hide password' : 'Show password'}
                  </span>
                </button>
                <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-emerald-300/80">
                  <Lock className="h-4 w-4" />
                </span>
              </div>
            </div>

            {error && (
              <p className="rounded-2xl border border-rose-500/40 bg-rose-950/40 px-3 py-2 text-xs text-rose-200">
                {error}
              </p>
            )}
            {info && (
              <p className="rounded-2xl border border-emerald-500/40 bg-emerald-950/40 px-3 py-2 text-xs text-emerald-200">
                {info}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-3xl bg-gradient-to-r from-emerald-400 to-lime-400 py-3 text-sm font-semibold text-emerald-950 shadow-[0_20px_60px_rgba(34,197,94,0.6)] transition hover:shadow-[0_26px_70px_rgba(34,197,94,0.75)] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-emerald-900 border-t-transparent" />
                  Logging In…
                </>
              ) : (
                <>
                  <span>→</span>
                  Log In
                </>
              )}
            </button>
          </form>

          <div className="my-6 flex items-center gap-3 text-[11px] font-medium uppercase tracking-[0.25em] text-emerald-100/60">
            <span className="h-px flex-1 bg-emerald-500/30" />
            <span>Or continue with</span>
            <span className="h-px flex-1 bg-emerald-500/30" />
          </div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="flex w-full items-center justify-between rounded-3xl border border-emerald-500/30 bg-black/60 px-4 py-3 text-sm font-medium text-emerald-50 shadow-[0_10px_45px_rgba(0,0,0,0.85)] hover:bg-black/80 disabled:cursor-not-allowed disabled:opacity-70"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white">
                <span className="text-lg leading-none">G</span>
              </span>
              <span>Login with Gmail</span>
            </div>
            <span className="text-emerald-300">→</span>
          </button>

          <p className="mt-6 text-center text-xs text-emerald-100/70">
            Don&apos;t have an account?{' '}
            <Link
              to="/register"
              className="font-semibold text-emerald-400 hover:text-emerald-300"
            >
              Register Here <span className="ml-1 inline">→</span>
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
