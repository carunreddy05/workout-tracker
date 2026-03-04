import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronRight, Dumbbell, Shield, Sparkles, Target } from 'lucide-react';

const splits = [
  {
    id: 'push',
    title: 'Push',
    subtitle: 'Chest, Shoulders, Triceps',
    duration: '45-55 min',
    intensity: 'Strength',
    to: '/workouts/push-day?split=push',
  },
  {
    id: 'pull',
    title: 'Pull',
    subtitle: 'Back, Biceps, Rear Delts',
    duration: '45-55 min',
    intensity: 'Power',
    to: '/workouts/push-day?split=pull',
  },
  {
    id: 'legs',
    title: 'Legs',
    subtitle: 'Quads, Hamstrings, Glutes',
    duration: '50-65 min',
    intensity: 'Volume',
    to: '/workouts/push-day?split=legs',
  },
  {
    id: 'core',
    title: 'Core',
    subtitle: 'Abs, Obliques, Stability',
    duration: '20-35 min',
    intensity: 'Control',
    to: '/workouts/push-day?split=core',
  },
];

export default function WorkoutSelection() {
  const navigate = useNavigate();
  const day = new Date().getDay();
  const recommendedSplit = day === 1 || day === 4 ? 'pull' : day === 2 || day === 5 ? 'legs' : 'push';

  return (
    <div className="mx-auto w-full max-w-md space-y-6">
      <header className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate('/dashboard')}
          className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-[#101216] px-4 py-2 text-xs font-semibold text-white shadow-[0_10px_30px_rgba(0,0,0,0.35)] hover:bg-[#151821]"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back</span>
        </button>
        <div className="flex items-center gap-2 text-emerald-300">
          <Sparkles className="h-4 w-4" />
          <span className="text-xs font-semibold uppercase tracking-[0.3em]">Workout Selection</span>
        </div>
      </header>

      <section className="rounded-[32px] border border-emerald-500/20 bg-gradient-to-b from-[#05150a] to-black p-6 shadow-[0_22px_55px_rgba(0,0,0,0.7)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-200/80">Your Split</p>
            <h1 className="mt-2 text-2xl font-semibold text-white">Choose today&apos;s focus</h1>
            <p className="mt-1 text-sm text-emerald-100/70">Step 1 of 2: select a split, then add exercises.</p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-200 shrink-0">
            <Target className="h-5 w-5" />
          </div>
        </div>

        <div className="mt-4 rounded-2xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-3">
          <div className="flex items-center justify-between gap-4 text-xs">
            <span className="text-emerald-100/80">Recommended today</span>
            <span className="rounded-full bg-emerald-500/25 px-3 py-1 font-semibold uppercase tracking-[0.2em] text-emerald-100">
              {splits.find(split => split.id === recommendedSplit)?.title}
            </span>
          </div>
        </div>

        <div className="mt-3 flex justify-end">
          <Link
            to="/entry"
            className="rounded-full border border-white/10 bg-black/40 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-200 hover:border-emerald-400/40 hover:text-white"
          >
            Review Page
          </Link>
        </div>

        <div className="mt-5 space-y-3">
          {splits.map(split => (
            <Link
              key={split.title}
              to={split.to}
              className="group block rounded-2xl border border-white/10 bg-[#0b1110] p-4 transition hover:border-emerald-400/45 hover:bg-[#101a17]"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-semibold text-white">{split.title}</h2>
                    {split.id === recommendedSplit && (
                      <span className="rounded-full bg-emerald-500/20 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-emerald-200">
                        Recommended
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-zinc-300">{split.subtitle}</p>
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 text-emerald-200 transition group-hover:translate-x-1" />
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-white/10 bg-black/40 px-3 py-1 text-xs text-zinc-200">
                  {split.duration}
                </span>
                <span className="rounded-full border border-white/10 bg-black/40 px-3 py-1 text-xs text-zinc-200">
                  {split.intensity}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/35 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-100">
                  <Dumbbell className="h-3.5 w-3.5" />
                  Choose Split
                </span>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-5 rounded-2xl border border-white/10 bg-black/35 px-4 py-3">
          <div className="flex items-center gap-3 text-xs text-zinc-300">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-200">
              <Shield className="h-4 w-4" />
            </span>
            <p>
              Step 2: after selecting a split, choose a muscle group and quick-add suggested exercises.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
