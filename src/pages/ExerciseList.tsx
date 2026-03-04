import React, { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, ChevronRight, Play, Search, SlidersHorizontal } from 'lucide-react';
import { useAuth } from '@/lib/auth';

const splitTitles: Record<string, string> = {
  push: 'Push Day',
  pull: 'Pull Day',
  legs: 'Leg Day',
  core: 'Core Workout',
};

type ExerciseItem = {
  name: string;
  focus: string;
  category: string;
  kind: 'Compound' | 'Isolation' | 'Stability';
  sets: string;
  reps: string;
  level: string;
  image?: string;
};

const exerciseLibrary: Record<string, ExerciseItem[]> = {
  push: [
    {
      name: 'Incline Chest Press',
      focus: 'Upper Pectorals',
      category: 'chest',
      kind: 'Compound',
      sets: '3-4 sets',
      reps: '8 - 12 reps',
      level: 'Intermediate',
      image: '/trackfit-hero.jpg',
    },
    {
      name: 'Dumbbell Shoulder Press',
      focus: 'Front/Side Delts',
      category: 'shoulders',
      kind: 'Compound',
      sets: '3-4 sets',
      reps: '8 - 12 reps',
      level: 'Intermediate',
    },
    {
      name: 'Cable Triceps Pushdown',
      focus: 'Triceps Lateral Head',
      category: 'triceps',
      kind: 'Isolation',
      sets: '3 sets',
      reps: '10 - 15 reps',
      level: 'Beginner',
    },
    {
      name: 'Lateral Raise',
      focus: 'Side Delts',
      category: 'shoulders',
      kind: 'Isolation',
      sets: '3 sets',
      reps: '12 - 20 reps',
      level: 'Beginner',
    },
  ],
  pull: [
    {
      name: 'Lat Pulldown',
      focus: 'Lats',
      category: 'lats',
      kind: 'Compound',
      sets: '3-4 sets',
      reps: '8 - 12 reps',
      level: 'Beginner',
      image: '/trackfit-hero.jpg',
    },
    {
      name: 'Chest Supported Row',
      focus: 'Mid Back',
      category: 'mid-back',
      kind: 'Compound',
      sets: '3-4 sets',
      reps: '8 - 12 reps',
      level: 'Intermediate',
    },
    {
      name: 'Incline Dumbbell Curl',
      focus: 'Biceps Long Head',
      category: 'biceps',
      kind: 'Isolation',
      sets: '3 sets',
      reps: '10 - 15 reps',
      level: 'Beginner',
    },
    {
      name: 'Face Pull',
      focus: 'Rear Delts',
      category: 'mid-back',
      kind: 'Isolation',
      sets: '3 sets',
      reps: '12 - 20 reps',
      level: 'Beginner',
    },
  ],
  legs: [
    {
      name: 'Back Squat',
      focus: 'Quads & Glutes',
      category: 'quads',
      kind: 'Compound',
      sets: '3-5 sets',
      reps: '5 - 10 reps',
      level: 'Intermediate',
      image: '/trackfit-hero.jpg',
    },
    {
      name: 'Romanian Deadlift',
      focus: 'Hamstrings',
      category: 'hamstrings',
      kind: 'Compound',
      sets: '3-4 sets',
      reps: '6 - 10 reps',
      level: 'Intermediate',
    },
    {
      name: 'Bulgarian Split Squat',
      focus: 'Quads/Glutes',
      category: 'glutes',
      kind: 'Compound',
      sets: '3 sets',
      reps: '8 - 12 reps',
      level: 'Intermediate',
    },
    {
      name: 'Seated Leg Curl',
      focus: 'Hamstrings',
      category: 'hamstrings',
      kind: 'Isolation',
      sets: '3 sets',
      reps: '10 - 15 reps',
      level: 'Beginner',
    },
  ],
  core: [
    {
      name: 'Cable Crunch',
      focus: 'Upper Abs',
      category: 'upper-abs',
      kind: 'Isolation',
      sets: '3-4 sets',
      reps: '10 - 15 reps',
      level: 'Beginner',
      image: '/trackfit-hero.jpg',
    },
    {
      name: 'Hanging Knee Raise',
      focus: 'Lower Abs',
      category: 'lower-abs',
      kind: 'Stability',
      sets: '3 sets',
      reps: '8 - 15 reps',
      level: 'Intermediate',
    },
    {
      name: 'Pallof Press',
      focus: 'Obliques',
      category: 'obliques',
      kind: 'Stability',
      sets: '3 sets',
      reps: '10 - 15 reps/side',
      level: 'Beginner',
    },
    {
      name: 'Dead Bug',
      focus: 'Deep Core',
      category: 'upper-abs',
      kind: 'Stability',
      sets: '3 sets',
      reps: '8 - 12 reps/side',
      level: 'Beginner',
    },
  ],
};

const filters = ['All', 'Compound', 'Isolation', 'Stability'];

export default function ExerciseList() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const split = searchParams.get('split') || 'push';
  const category = searchParams.get('category') || 'chest';
  const splitTitle = splitTitles[split] || splitTitles.push;

  const { user } = useAuth();
  const pendingKey = useMemo(
    () => (user ? `pendingWorkoutExercises_${user.uid}` : 'pendingWorkoutExercises_guest'),
    [user]
  );
  const [activeFilter, setActiveFilter] = useState('All');
  const [sets, setSets] = useState([
    { weight: '', reps: '' },
    { weight: '', reps: '' },
    { weight: '', reps: '' },
  ]);
  const [saveNotice, setSaveNotice] = useState('');

  const splitExercises = exerciseLibrary[split] || exerciseLibrary.push;
  const exercisesByCategory = splitExercises.filter(exercise => exercise.category === category);
  const visibleExercises = (exercisesByCategory.length ? exercisesByCategory : splitExercises).filter(exercise =>
    activeFilter === 'All' ? true : exercise.kind === activeFilter
  );
  const primaryExercise = visibleExercises[0] || splitExercises[0];

  const addSet = () => {
    setSets(prev => [...prev, { weight: '', reps: '' }]);
  };

  const removeSet = (index: number) => {
    setSets(prev => (prev.length > 1 ? prev.filter((_, i) => i !== index) : prev));
  };

  const updateSet = (index: number, field: 'weight' | 'reps', value: string) => {
    setSets(prev => prev.map((row, i) => (i === index ? { ...row, [field]: value } : row)));
  };

  const saveToWorkout = (exerciseName?: string) => {
    const formattedSets = sets
      .filter(row => row.weight || row.reps)
      .map(row => `${row.weight}@${row.reps}`);

    const payload = {
      name: exerciseName || primaryExercise.name,
      sets: formattedSets.length ? formattedSets : ['@'],
    };

    const existing = JSON.parse(localStorage.getItem(pendingKey) || '[]');
    localStorage.setItem(pendingKey, JSON.stringify([...existing, payload]));
    setSaveNotice(`${payload.name} added to log queue.`);
    setTimeout(() => setSaveNotice(''), 2000);
  };

  return (
    <div className="mx-auto w-full max-w-md space-y-6">
      <header className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate(`/workouts/push-day?split=${split}`)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-[#101216] text-white"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="text-center">
          <p className="text-xs uppercase tracking-[0.3em] text-emerald-200/70">{splitTitle}</p>
          <h1 className="text-lg font-semibold text-white">
            {(category || 'all').replace('-', ' ')} Exercises
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-[#101216] text-emerald-200">
            <Search className="h-4 w-4" />
          </button>
          <button className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-[#101216] text-emerald-200">
            <SlidersHorizontal className="h-4 w-4" />
          </button>
        </div>
      </header>

      <div className="flex flex-wrap items-center gap-2">
        {filters.map(filter => (
          <button
            key={filter}
            type="button"
            onClick={() => setActiveFilter(filter)}
            className={[
              'rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] transition',
              filter === activeFilter
                ? 'border-emerald-500/40 bg-emerald-500/20 text-emerald-200'
                : 'border-white/10 bg-black/40 text-zinc-400 hover:text-white',
            ].join(' ')}
          >
            {filter}
          </button>
        ))}
      </div>

      <div className="rounded-[30px] border border-emerald-500/25 bg-gradient-to-b from-[#07150b] via-[#04120a] to-black p-5 shadow-[0_26px_70px_rgba(0,0,0,0.75)]">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-200/70">Recommended Starter</p>

        <div className="mt-4 overflow-hidden rounded-2xl border border-emerald-500/30 bg-black/60">
          <div className="relative">
            <div
              className="h-44 w-full bg-cover bg-center"
              style={{ backgroundImage: `url('${primaryExercise.image || '/trackfit-hero.jpg'}')` }}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/30 to-black/75" />
            <button className="absolute inset-0 m-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/60 text-emerald-50 shadow-[0_0_30px_rgba(34,197,94,0.6)]">
              <Play className="h-5 w-5" />
            </button>
            <span className="absolute right-3 top-3 rounded-full bg-emerald-500/30 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-100">
              Best Match
            </span>
          </div>
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-white">{primaryExercise.name}</h2>
                <p className="text-xs text-emerald-100/70">Focus on {primaryExercise.focus}</p>
              </div>
              <button
                type="button"
                onClick={() => saveToWorkout(primaryExercise.name)}
                className="rounded-full bg-emerald-500/20 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-100"
              >
                Add
              </button>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-3 text-xs text-emerald-100/70">
              <div className="rounded-xl border border-white/10 bg-black/40 p-3">
                <p className="text-[10px] uppercase tracking-[0.2em] text-emerald-200/70">Suggested</p>
                <p className="mt-1 text-sm font-semibold text-white">{primaryExercise.sets}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-black/40 p-3">
                <p className="text-[10px] uppercase tracking-[0.2em] text-emerald-200/70">Rep Range</p>
                <p className="mt-1 text-sm font-semibold text-white">{primaryExercise.reps}</p>
              </div>
              <div className="rounded-xl border border-white/10 bg-black/40 p-3">
                <p className="text-[10px] uppercase tracking-[0.2em] text-emerald-200/70">Difficulty</p>
                <p className="mt-1 text-sm font-semibold text-white">{primaryExercise.level}</p>
              </div>
            </div>

            <div className="mt-4 rounded-2xl border border-emerald-500/25 bg-[#0b120c] p-4">
              <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.25em] text-emerald-200/70">
                <span>Log Performance</span>
                <span className="text-emerald-100/60">Sets</span>
              </div>
              <div className="mt-4 space-y-3">
                {sets.map((row, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/40 px-3 py-2"
                  >
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500/20 text-xs font-semibold text-emerald-100">
                      {index + 1}
                    </span>
                    <input
                      value={row.weight}
                      onChange={event => updateSet(index, 'weight', event.target.value)}
                      placeholder="Weight"
                      className="w-full bg-transparent text-sm text-emerald-50 placeholder:text-emerald-100/40 focus:outline-none"
                    />
                    <input
                      value={row.reps}
                      onChange={event => updateSet(index, 'reps', event.target.value)}
                      placeholder="Reps"
                      className="w-full bg-transparent text-sm text-emerald-50 placeholder:text-emerald-100/40 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => removeSet(index)}
                      className="rounded-full border border-white/10 px-2 py-1 text-[11px] text-zinc-400 hover:text-white"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={addSet}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-emerald-100"
              >
                + Add Set
              </button>
            </div>

            <button
              type="button"
              onClick={() => saveToWorkout(primaryExercise.name)}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-400 to-lime-400 py-3 text-sm font-semibold text-emerald-950 shadow-[0_12px_40px_rgba(34,197,94,0.55)]"
            >
              Add Exercise to Workout Log
              <ChevronRight className="h-4 w-4" />
            </button>
            {saveNotice && (
              <p className="mt-3 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-100">
                {saveNotice}
              </p>
            )}
          </div>
        </div>

        <div className="mt-5 space-y-3">
          {visibleExercises.slice(1).map(exercise => (
            <div
              key={exercise.name}
              className="flex items-center justify-between rounded-2xl border border-white/10 bg-black/40 px-4 py-3"
            >
              <div>
                <p className="text-sm font-semibold text-white">{exercise.name}</p>
                <p className="text-xs text-emerald-100/70">Target: {exercise.focus}</p>
              </div>
              <button
                type="button"
                onClick={() => saveToWorkout(exercise.name)}
                className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-emerald-100"
              >
                Add
              </button>
            </div>
          ))}
        </div>

        <Link
          to="/entry"
          className="mt-4 flex w-full items-center justify-center rounded-2xl border border-white/10 bg-black/45 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-200"
        >
          Go To Log Workout
        </Link>
      </div>
    </div>
  );
}
