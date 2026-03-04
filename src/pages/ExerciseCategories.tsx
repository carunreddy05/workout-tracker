import React, { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ChevronRight, Flame, LayoutGrid, Plus, Shield } from 'lucide-react';
import { useAuth } from '@/lib/auth';

const splitMap = {
  push: {
    label: 'Push Day',
    categories: [
      { name: 'Chest', count: 6, to: '/workouts/chest?split=push&category=chest' },
      { name: 'Shoulders', count: 5, to: '/workouts/chest?split=push&category=shoulders' },
      { name: 'Triceps', count: 5, to: '/workouts/chest?split=push&category=triceps' },
    ],
    recommendedExercises: [
      'Incline Chest Press (Upper Chest)',
      'Mid-Chest Press (Flat Bench)',
      'Decline Chest Press (Lower Chest)',
      'Overhead Cable Tricep Extension',
      'Rope Push Down',
      'Cable Kickbacks (No Attachments)',
    ],
  },
  pull: {
    label: 'Pull Day',
    categories: [
      { name: 'Lats', count: 5, to: '/workouts/chest?split=pull&category=lats' },
      { name: 'Mid Back', count: 5, to: '/workouts/chest?split=pull&category=mid-back' },
      { name: 'Biceps', count: 5, to: '/workouts/chest?split=pull&category=biceps' },
    ],
    recommendedExercises: [
      'LAT Pulldown',
      'Straight Arm Cable Pulldown',
      'Single-Arm Cable Row/Pulldown',
      'Body-Solid - Seated Row Machine',
      'Lean In Biceps Cable Curl',
      'Hammer Curls Dumbbell',
    ],
  },
  legs: {
    label: 'Leg Day',
    categories: [
      { name: 'Quads', count: 5, to: '/workouts/chest?split=legs&category=quads' },
      { name: 'Hamstrings', count: 4, to: '/workouts/chest?split=legs&category=hamstrings' },
      { name: 'Glutes', count: 4, to: '/workouts/chest?split=legs&category=glutes' },
    ],
    recommendedExercises: [
      'Romanian Deadlift',
      'Leg Press Machine',
      'Seated Leg Extension',
      'Leg Curl',
      'Standing Calf Raise',
    ],
  },
  core: {
    label: 'Core Workout',
    categories: [
      { name: 'Upper Abs', count: 4, to: '/workouts/chest?split=core&category=upper-abs' },
      { name: 'Lower Abs', count: 4, to: '/workouts/chest?split=core&category=lower-abs' },
      { name: 'Obliques', count: 4, to: '/workouts/chest?split=core&category=obliques' },
    ],
    recommendedExercises: ['Cable Crunch', 'Hanging Knee Raise', 'Pallof Press'],
  },
} as const;

export default function ExerciseCategories() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [saveNotice, setSaveNotice] = useState('');
  const [quickAddConfig, setQuickAddConfig] = useState<Record<string, { setCount: string; weight: string; reps: string }>>({});
  const selectedSplit = (searchParams.get('split') || 'push') as keyof typeof splitMap;
  const splitConfig = splitMap[selectedSplit] || splitMap.push;
  const pendingKey = useMemo(
    () => (user ? `pendingWorkoutExercises_${user.uid}` : 'pendingWorkoutExercises_guest'),
    [user]
  );

  const updateQuickAddConfig = (
    exerciseName: string,
    field: 'setCount' | 'weight' | 'reps',
    value: string
  ) => {
    setQuickAddConfig(prev => ({
      ...prev,
      [exerciseName]: {
        setCount: prev[exerciseName]?.setCount ?? '3',
        weight: prev[exerciseName]?.weight ?? '',
        reps: prev[exerciseName]?.reps ?? '10',
        [field]: value,
      },
    }));
  };

  const quickAddExercise = (exerciseName: string) => {
    const config = quickAddConfig[exerciseName] ?? { setCount: '3', weight: '', reps: '10' };
    const setCount = Number.parseInt(config.setCount, 10);
    const weight = config.weight.trim();
    const reps = config.reps.trim();

    if (!weight || !reps || Number.isNaN(setCount) || setCount < 1) {
      setSaveNotice(`Enter sets, weight, and reps for ${exerciseName} before adding.`);
      setTimeout(() => setSaveNotice(''), 2200);
      return;
    }

    const existing = JSON.parse(localStorage.getItem(pendingKey) || '[]');
    const payload = {
      name: exerciseName,
      sets: Array.from({ length: setCount }, () => `${weight}@${reps}`),
    };
    localStorage.setItem(pendingKey, JSON.stringify([...existing, payload]));
    setSaveNotice(`${exerciseName} added. Continue adding or review in Log Workout.`);
    setTimeout(() => setSaveNotice(''), 2200);
  };

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
            <p className="text-xs uppercase tracking-[0.3em] text-emerald-200/70">{splitConfig.label}</p>
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
        <p className="text-xs font-semibold uppercase tracking-[0.32em] text-emerald-200/70">Step 2 of 2</p>
        <p className="mt-2 text-sm text-emerald-100/70">
          Pick a muscle group or quick-add recommended exercises for {splitConfig.label.toLowerCase()}.
        </p>

        <div className="mt-6 space-y-4">
          {splitConfig.categories.map(category => (
            <Link
              key={category.name}
              to={category.to}
              className="group flex items-center justify-between rounded-2xl border border-emerald-500/25 bg-black/60 px-4 py-4 transition hover:border-emerald-400/45 hover:bg-[#101613]"
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-200">
                  <Flame className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{category.name}</p>
                  <p className="text-xs text-emerald-100/70">{category.count}+ Exercises</p>
                </div>
              </div>
              <ChevronRight className="h-4 w-4 text-emerald-200" />
            </Link>
          ))}
        </div>

        <div className="mt-6 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-4 text-sm">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-200/70">Quick Add</p>
              <p className="mt-1 text-sm text-emerald-100/70">Tap to add recommended exercises to your log queue.</p>
            </div>
            <Link
              to="/entry"
              className="rounded-full border border-emerald-400/30 bg-emerald-500/20 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-emerald-100"
            >
              Review
            </Link>
          </div>

          <div className="mt-4 grid gap-3">
            {splitConfig.recommendedExercises.map(exercise => (
              <div key={exercise} className="rounded-xl border border-white/10 bg-black/35 px-3 py-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm text-white">{exercise}</span>
                  <button
                    type="button"
                    onClick={() => quickAddExercise(exercise)}
                    className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-100"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add
                  </button>
                </div>

                <div className="mt-3 grid grid-cols-3 gap-2">
                  <label className="text-[10px] uppercase tracking-[0.2em] text-emerald-100/70">
                    Sets
                    <input
                      type="number"
                      min="1"
                      value={quickAddConfig[exercise]?.setCount ?? '3'}
                      onChange={event => updateQuickAddConfig(exercise, 'setCount', event.target.value)}
                      className="mt-1 w-full rounded-lg border border-white/10 bg-black/60 px-2 py-1.5 text-xs text-white focus:border-emerald-400/50 focus:outline-none"
                    />
                  </label>
                  <label className="text-[10px] uppercase tracking-[0.2em] text-emerald-100/70">
                    Weight
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder="e.g. 25"
                      value={quickAddConfig[exercise]?.weight ?? ''}
                      onChange={event => updateQuickAddConfig(exercise, 'weight', event.target.value)}
                      className="mt-1 w-full rounded-lg border border-white/10 bg-black/60 px-2 py-1.5 text-xs text-white placeholder:text-zinc-500 focus:border-emerald-400/50 focus:outline-none"
                    />
                  </label>
                  <label className="text-[10px] uppercase tracking-[0.2em] text-emerald-100/70">
                    Reps
                    <input
                      type="number"
                      min="1"
                      value={quickAddConfig[exercise]?.reps ?? '10'}
                      onChange={event => updateQuickAddConfig(exercise, 'reps', event.target.value)}
                      className="mt-1 w-full rounded-lg border border-white/10 bg-black/60 px-2 py-1.5 text-xs text-white focus:border-emerald-400/50 focus:outline-none"
                    />
                  </label>
                </div>
              </div>
            ))}
          </div>

          {saveNotice && (
            <div className="mt-3 rounded-xl border border-emerald-500/35 bg-emerald-500/15 px-3 py-2 text-xs text-emerald-100">
              {saveNotice}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
