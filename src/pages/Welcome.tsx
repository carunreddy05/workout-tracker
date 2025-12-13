import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import TrackfitMark from '@/components/TrackfitMark';
import { useAuth } from '@/lib/auth';

export default function Welcome() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, loading, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0b2f17] via-[#041c11] to-black px-3 py-4 text-zinc-100">
      <div className="mx-auto flex h-screen max-w-sm flex-col sm:max-w-md">
        {/* Top row: logo + dots + skip */}
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl border border-emerald-400/70 bg-black/40">
              <TrackfitMark size={24} />
            </div>
            <p className="text-[14px] font-semibold text-white">Trackfit</p>
          </div>
          <div className="flex items-center gap-3 text-[11px]">
            <div className="flex items-center gap-1.5 text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500/40" />
              <span className="h-1.5 w-4 rounded-full bg-emerald-400" />
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500/40" />
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500/40" />
            </div>
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="font-medium text-emerald-200 hover:text-emerald-100"
            >
              Skip
            </button>
          </div>
        </header>

        {/* Hero image with rounded card + calories overlay */}
        <section className="mt-3 flex-1">
          <div className="relative overflow-hidden rounded-[34px] bg-black/70 h-full">
            <div
              className="h-full bg-cover bg-center"
              style={{ backgroundImage: "url('/trackfit-hero.jpg')" }}
            />
            <div className="absolute inset-0 rounded-[34px] bg-gradient-to-b from-black/20 via-black/5 to-black/75" />

            <div className="absolute inset-x-5 bottom-5 rounded-3xl bg-black/80 px-4 py-3 text-[11px] text-emerald-50 shadow-[0_24px_50px_rgba(0,0,0,0.9)]">
              <div className="flex items-center justify-between text-xs">
                <span className="inline-flex items-center gap-2 text-emerald-200">
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-[10px] text-emerald-950">
                    🔥
                  </span>
                  <span className="uppercase tracking-[0.16em] text-emerald-200">
                    Calories Burned
                  </span>
                </span>
                <span className="text-[11px] text-emerald-100/80">Today</span>
              </div>
              <div className="mt-2 flex items-baseline justify-between">
                <p className="text-lg font-semibold text-white">840 kcal</p>
                <p className="text-[10px] text-emerald-100/70">Goal: 900</p>
              </div>
              <div className="mt-2 h-1.5 rounded-full bg-emerald-900/50">
                <div className="h-full w-[80%] rounded-full bg-gradient-to-r from-emerald-400 to-lime-400" />
              </div>
            </div>
          </div>
        </section>

        {/* Copy + actions */}
        <section className="mt-auto flex flex-col gap-6 pb-8">
          <div className="space-y-2 text-center">
            <h1 className="text-4xl font-bold leading-tight text-white">
              Track Your <span className="text-emerald-400">Progress</span>,<br />
              Achieve Your <span className="text-emerald-400">Goals</span>
            </h1>
            <p className="text-base text-emerald-50/70">
              Join the community of movers. Analytics, tracking, and coaching all in one place.
            </p>
          </div>

          <div className="space-y-3">
            <button
              type="button"
              onClick={() => navigate('/register')}
              className="flex w-full items-center justify-center gap-2 rounded-3xl bg-gradient-to-r from-emerald-400 to-lime-400 py-3 text-sm font-semibold text-emerald-950 shadow-[0_20px_60px_rgba(34,197,94,0.7)] transition hover:shadow-[0_24px_70px_rgba(34,197,94,0.85)]"
            >
              Get Started <span>→</span>
            </button>

            <button
              type="button"
              onClick={() => navigate('/login')}
              className="flex w-full items-center justify-center rounded-3xl border border-emerald-500/25 bg-black/60 py-3 text-sm font-semibold text-emerald-50 shadow-[0_12px_40px_rgba(0,0,0,0.85)] hover:bg-black/75"
            >
              Log In
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
