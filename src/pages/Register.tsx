import React, { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Lock, User, ArrowRight, ChevronRight } from 'lucide-react';
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  signInWithPopup,
  updateProfile,
} from 'firebase/auth';
import { auth } from '@/firebase';
import { Input } from '@/components/ui/input';
import TrackfitMark from '@/components/TrackfitMark';
import { useAuth, normalizeIdentifier } from '@/lib/auth';

export default function Register() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const locationState = location.state as { from?: { pathname?: string } } | undefined;
  const from = locationState?.from?.pathname || '/dashboard';

  if (!authLoading && user) {
    return <Navigate to={from} replace />;
  }

  const handleRegister = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!identifier || !password || !confirmPassword) {
      setError('Please fill in all fields.');
      return;
    }

    if (password.length < 6) {
      setError('Password should be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    try {
      setLoading(true);
      const { email, displayNameHint } = normalizeIdentifier(identifier);

      if (!email) {
        setError('Please enter a username or email.');
        setLoading(false);
        return;
      }

      const credentials = await createUserWithEmailAndPassword(auth, email, password);

      const displayName = displayNameHint || undefined;
      if (displayName) {
        await updateProfile(credentials.user, { displayName });
      }

      navigate('/onboarding/goals', { replace: true });
    } catch (err: any) {
      let message = 'Unable to create your account right now.';
      if (err?.code === 'auth/email-already-in-use') {
        message = 'An account with that email already exists.';
      } else if (err?.code === 'auth/weak-password') {
        message = 'Password is too weak. Please choose a stronger one.';
      } else if (err?.code === 'auth/configuration-not-found') {
        message =
          'Authentication is not fully configured for this Firebase project. Enable Email/Password sign-in in your Firebase console.';
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleRegister = async () => {
    setError(null);
    try {
      setLoading(true);
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      navigate(from, { replace: true });
    } catch (err: any) {
      if (err?.code !== 'auth/popup-closed-by-user') {
        setError('Google sign-up failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-[#021607] via-[#020f08] to-black px-4 py-10 text-zinc-100">
      <div className="mx-auto w-full max-w-sm sm:max-w-md">
        <div className="relative w-full rounded-[38px] border border-emerald-500/20 bg-gradient-to-b from-[#06230d] via-[#031208] to-black p-7 shadow-[0_26px_80px_rgba(0,0,0,0.85)]">
          <div className="absolute inset-x-10 -top-14 flex justify-center">
            <div className="relative flex h-24 w-24 items-center justify-center rounded-[26px] border border-emerald-400/40 bg-gradient-to-b from-emerald-400 to-emerald-500 shadow-[0_0_45px_rgba(34,197,94,0.8)]">
              <div className="absolute inset-[6px] rounded-[22px] bg-gradient-to-b from-[#022509] via-[#03140b] to-black" />
              <div className="relative flex items-center justify-center">
                <TrackfitMark size={40} />
              </div>
            </div>
          </div>

          <div className="mt-12 space-y-1 text-center">
            <h1 className="text-2xl font-semibold text-white sm:text-3xl">
              Join <span className="text-emerald-400">Trackfit</span>
            </h1>
            <p className="text-sm text-emerald-100/80">
              Start your journey to a healthier you today.
            </p>
          </div>

          <form onSubmit={handleRegister} className="mt-8 space-y-5">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-200/80">
                Username or Email
              </label>
              <div className="relative">
                <Input
                  type="text"
                  autoComplete="username"
                  placeholder="Enter your username"
                  value={identifier}
                  onChange={event => setIdentifier(event.target.value)}
                  className="h-11 rounded-2xl border-emerald-500/30 bg-black/40 pl-10 pr-4 text-sm text-emerald-50 placeholder:text-emerald-100/40"
                />
                <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-emerald-300/80">
                  <User className="h-4 w-4" />
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-200/80">
                Password
              </label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="Create a password"
                  value={password}
                  onChange={event => setPassword(event.target.value)}
                  className="h-11 rounded-2xl border-emerald-500/30 bg-black/40 pl-10 pr-11 text-sm text-emerald-50 placeholder:text-emerald-100/40"
                />
                <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-emerald-300/80">
                  <Lock className="h-4 w-4" />
                </span>
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
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-200/80">
                Confirm Password
              </label>
              <div className="relative">
                <Input
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={event => setConfirmPassword(event.target.value)}
                  className="h-11 rounded-2xl border-emerald-500/30 bg-black/40 pl-10 pr-11 text-sm text-emerald-50 placeholder:text-emerald-100/40"
                />
                <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-emerald-300/80">
                  <Lock className="h-4 w-4" />
                </span>
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(prev => !prev)}
                  className="absolute inset-y-0 right-3 flex items-center text-emerald-300/80 hover:text-emerald-200"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                  <span className="sr-only">
                    {showConfirmPassword ? 'Hide password' : 'Show password'}
                  </span>
                </button>
              </div>
            </div>

            {error && (
              <p className="rounded-2xl border border-rose-500/40 bg-rose-950/40 px-3 py-2 text-xs text-rose-200">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="mt-1 flex w-full items-center justify-center gap-2 rounded-3xl bg-gradient-to-r from-emerald-400 to-lime-400 py-3 text-sm font-semibold text-emerald-950 shadow-[0_20px_60px_rgba(34,197,94,0.6)] transition hover:shadow-[0_26px_70px_rgba(34,197,94,0.75)] disabled:cursor-not-allowed disabled:opacity-70"
            >
              <span>Register</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          <div className="my-6 flex items-center gap-3 text-[11px] font-medium uppercase tracking-[0.25em] text-emerald-100/60">
            <span className="h-px flex-1 bg-emerald-500/30" />
            <span>Or register with</span>
            <span className="h-px flex-1 bg-emerald-500/30" />
          </div>

          <button
            type="button"
            onClick={handleGoogleRegister}
            disabled={loading}
            className="flex w-full items-center justify-between rounded-3xl border border-emerald-500/30 bg-black/60 px-4 py-3 text-sm font-medium text-emerald-50 shadow-[0_10px_45px_rgba(0,0,0,0.85)] hover:bg-black/80 disabled:cursor-not-allowed disabled:opacity-70"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white">
                <span className="text-lg leading-none">G</span>
              </span>
              <span>Continue with Google</span>
            </div>
            <ChevronRight className="h-4 w-4 text-emerald-300" />
          </button>

          <p className="mt-6 text-center text-xs text-emerald-100/70">
            Already have an account?{' '}
            <Link
              to="/login"
              className="font-semibold text-emerald-400 hover:text-emerald-300"
            >
              Login Here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
