import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronRight, Dumbbell, Flame, Sparkles } from 'lucide-react';

const splits = [
  {
    title: 'Push Day',
    subtitle: 'Chest, Shoulders, Triceps',
    image: '/trackfit-hero.jpg',
    accent: 'bg-emerald-500/20',
    active: true,
    to: '/workouts/push-day',
  },
  {
    title: 'Pull Day',
    subtitle: 'Back, Biceps, Rear Delts',
    image: '/trackfit-hero.jpg',
    accent: 'bg-emerald-500/10',
    active: false,
    to: '/workouts/push-day',
  },
  {
    title: 'Leg Day',
    subtitle: 'Quads, Hamstrings, Glutes',
    image: '/trackfit-hero.jpg',
    accent: 'bg-emerald-500/10',
    active: false,
    to: '/workouts/push-day',
  },
  {
    title: 'Core Workout',
    subtitle: 'Abs, Obliques, Stability',
    image: '/trackfit-hero.jpg',
    accent: 'bg-emerald-500/10',
    active: false,
    to: '/workouts/push-day',
  },
];

export default function WorkoutSelection() {
  const navigate = useNavigate();

  return (
    <div className="mx-auto w-full max-w-md space-y-6">
      <header className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate('/dashboard')}
          className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-[#101216] px-4 py-2 text-xs font-semibold text-white shadow-[0_10px_30px_rgba(0,0,0,0.35)] hover:bg-[#151821]"
        >
          <span>←</span>
          <span>Back</span>
        </button>
        <div className="flex items-center gap-2 text-emerald-300">
          <Sparkles className="h-4 w-4" />
          <span className="text-xs font-semibold uppercase tracking-[0.3em]">Workout Selection</span>
        </div>
      </header>

      <div className="rounded-[34px] border border-emerald-500/20 bg-gradient-to-b from-[#06160c] via-[#031008] to-black p-6 shadow-[0_26px_70px_rgba(0,0,0,0.75)]">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-200/80">Your Split</p>
            <h1 className="mt-2 text-2xl font-semibold text-white">Choose today&apos;s focus</h1>
            <p className="mt-1 text-sm text-emerald-100/70">Dialed routines built for your goal.</p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-200">
            <Dumbbell className="h-5 w-5" />
          </div>
        </div>

        <div className="mt-6 space-y-4">
          {splits.map(split => (
            <Link
              key={split.title}
              to={split.to}
              className="group relative block overflow-hidden rounded-[26px] border border-white/10 bg-black/40"
            >
              <div
                className="h-36 w-full bg-cover bg-center"
                style={{ backgroundImage: `url('${split.image}')` }}
              />
              <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/35 to-black/80" />
              <div className="absolute inset-0 flex flex-col justify-between p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.32em] text-emerald-200/70">Active Selection</p>
                    <h2 className="mt-2 text-lg font-semibold text-white">{split.title}</h2>
                    <p className="text-xs text-emerald-100/70">{split.subtitle}</p>
                  </div>
                  <span
                    className={[
                      'inline-flex items-center gap-2 rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.28em]',
                      split.active
                        ? 'bg-emerald-500/30 text-emerald-100'
                        : 'bg-white/10 text-zinc-300',
                    ].join(' ')}
                  >
                    {split.active ? 'Selected' : 'Choose'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-emerald-100/70">
                  <span className="inline-flex items-center gap-2">
                    <span className={`inline-flex h-8 w-8 items-center justify-center rounded-full ${split.accent}`}>
                      <Flame className="h-4 w-4 text-emerald-200" />
                    </span>
                    Estimated 45 min
                  </span>
                  <ChevronRight className="h-4 w-4 text-emerald-200" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
