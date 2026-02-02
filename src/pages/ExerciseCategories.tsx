import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronRight, Flame, LayoutGrid, Shield } from 'lucide-react';

const categories = [
  { name: 'Chest', count: 3, active: true, to: '/workouts/chest' },
  { name: 'Triceps', count: 2, active: true, to: '/workouts/chest' },
  { name: 'Shoulders', count: 0, active: false, to: '/workouts/chest' },
];

export default function ExerciseCategories() {
  const navigate = useNavigate();

  return (
    <div className="mx-auto w-full max-w-md space-y-6">
      <header className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate('/workouts/select')}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-[#101216] text-white"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-200">
            <LayoutGrid className="h-4 w-4" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-emerald-200/70">Push Day</p>
            <h1 className="text-lg font-semibold text-white">Exercise Categories</h1>
          </div>
        </div>
        <button
          type="button"
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-[#101216] text-emerald-200"
        >
          <Shield className="h-4 w-4" />
        </button>
      </header>

      <div className="rounded-[32px] border border-emerald-500/25 bg-gradient-to-b from-[#06170c] via-[#04130a] to-black p-6 shadow-[0_26px_70px_rgba(0,0,0,0.8)]">
        <p className="text-xs font-semibold uppercase tracking-[0.32em] text-emerald-200/70">Select a muscle group</p>
        <p className="mt-2 text-sm text-emerald-100/70">Start your workout with a focus.</p>

        <div className="mt-6 space-y-4">
          {categories.map(category => (
            <Link
              key={category.name}
              to={category.to}
              className={[
                'group flex items-center justify-between rounded-2xl border px-4 py-4 transition',
                category.active
                  ? 'border-emerald-500/30 bg-black/60'
                  : 'border-white/10 bg-black/30 opacity-70',
              ].join(' ')}
            >
              <div className="flex items-center gap-3">
                <div
                  className={[
                    'flex h-10 w-10 items-center justify-center rounded-2xl',
                    category.active ? 'bg-emerald-500/20 text-emerald-200' : 'bg-white/10 text-zinc-400',
                  ].join(' ')}
                >
                  <Flame className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{category.name}</p>
                  <p className="text-xs text-emerald-100/70">{category.count} Exercises</p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-emerald-200" />
            </Link>
          ))}
        </div>

        <div className="mt-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-4 text-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-200/70">Ready to crush it?</p>
              <p className="mt-1 text-sm text-emerald-100/70">Estimated duration 45 minutes</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/30 text-emerald-200">
              <Flame className="h-4 w-4" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
