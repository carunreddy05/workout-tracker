import React, { useEffect, useMemo, useRef, useState } from 'react';
import { format } from 'date-fns';
import { Calendar } from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowLeft,
  CalendarDays,
  ChevronDown,
  Copy,
  Dumbbell,
  Minus,
  Moon,
  Plus,
  Sparkles,
  SunMedium,
  Trash2,
} from 'lucide-react';
import axios from 'axios';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '@/firebase';
import { useAuth } from '@/lib/auth';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

const workoutOptions = ['Chest/Triceps', 'Back/Biceps', 'Shoulders', 'Legs', 'Core', 'Custom Workout'];

const guidedSplits = [
  {
    id: 'push',
    title: 'Push',
    subtitle: 'Chest, Shoulders, Triceps',
    workoutType: 'Chest/Triceps',
    categories: ['chest', 'shoulders', 'triceps'],
  },
  {
    id: 'pull',
    title: 'Pull',
    subtitle: 'Back, Biceps, Rear Delts',
    workoutType: 'Back/Biceps',
    categories: ['lats', 'mid-back', 'biceps'],
  },
  {
    id: 'legs',
    title: 'Legs',
    subtitle: 'Quads, Hamstrings, Glutes',
    workoutType: 'Legs',
    categories: ['quads', 'hamstrings', 'glutes'],
  },
  {
    id: 'core',
    title: 'Core',
    subtitle: 'Abs, Obliques, Stability',
    workoutType: 'Core',
    categories: ['upper-abs', 'lower-abs', 'obliques'],
  },
] as const;

const categoryLabels: Record<string, string> = {
  chest: 'Chest',
  shoulders: 'Shoulders',
  triceps: 'Triceps',
  lats: 'Lats',
  'mid-back': 'Mid Back',
  biceps: 'Biceps',
  quads: 'Quads',
  hamstrings: 'Hamstrings',
  glutes: 'Glutes',
  'upper-abs': 'Upper Abs',
  'lower-abs': 'Lower Abs',
  obliques: 'Obliques',
};

type GuidedExercise = {
  name: string;
  focus: string;
  category: string;
  kind: 'Compound' | 'Isolation' | 'Stability';
  sets: string;
  reps: string;
  level: string;
  image?: string;
};

const guidedExerciseLibrary: Record<string, GuidedExercise[]> = {
  push: [
    { name: 'Incline Chest Press', focus: 'Upper Pectorals', category: 'chest', kind: 'Compound', sets: '3-4 sets', reps: '8-12 reps', level: 'Intermediate' },
    { name: 'Flat Chest Press', focus: 'Mid Chest', category: 'chest', kind: 'Compound', sets: '3-4 sets', reps: '8-12 reps', level: 'Beginner' },
    { name: 'Dumbbell Shoulder Press', focus: 'Front/Side Delts', category: 'shoulders', kind: 'Compound', sets: '3-4 sets', reps: '8-12 reps', level: 'Intermediate' },
    { name: 'Lateral Raise', focus: 'Side Delts', category: 'shoulders', kind: 'Isolation', sets: '3 sets', reps: '12-20 reps', level: 'Beginner' },
    { name: 'Cable Triceps Pushdown', focus: 'Triceps', category: 'triceps', kind: 'Isolation', sets: '3 sets', reps: '10-15 reps', level: 'Beginner' },
  ],
  pull: [
    { name: 'Lat Pulldown', focus: 'Lats', category: 'lats', kind: 'Compound', sets: '3-4 sets', reps: '8-12 reps', level: 'Beginner' },
    { name: 'Single Arm Cable Pulldown', focus: 'Lower Lats', category: 'lats', kind: 'Compound', sets: '3 sets', reps: '10-12 reps', level: 'Intermediate' },
    { name: 'Chest Supported Row', focus: 'Mid Back', category: 'mid-back', kind: 'Compound', sets: '3-4 sets', reps: '8-12 reps', level: 'Intermediate' },
    { name: 'Face Pull', focus: 'Rear Delts', category: 'mid-back', kind: 'Isolation', sets: '3 sets', reps: '12-20 reps', level: 'Beginner' },
    { name: 'Hammer Curl', focus: 'Biceps', category: 'biceps', kind: 'Isolation', sets: '3 sets', reps: '10-15 reps', level: 'Beginner' },
  ],
  legs: [
    { name: 'Back Squat', focus: 'Quads & Glutes', category: 'quads', kind: 'Compound', sets: '3-5 sets', reps: '5-10 reps', level: 'Intermediate' },
    { name: 'Leg Press', focus: 'Quads', category: 'quads', kind: 'Compound', sets: '3-4 sets', reps: '10-15 reps', level: 'Beginner' },
    { name: 'Romanian Deadlift', focus: 'Hamstrings', category: 'hamstrings', kind: 'Compound', sets: '3-4 sets', reps: '6-10 reps', level: 'Intermediate' },
    { name: 'Seated Leg Curl', focus: 'Hamstrings', category: 'hamstrings', kind: 'Isolation', sets: '3 sets', reps: '10-15 reps', level: 'Beginner' },
    { name: 'Bulgarian Split Squat', focus: 'Glutes', category: 'glutes', kind: 'Compound', sets: '3 sets', reps: '8-12 reps', level: 'Intermediate' },
  ],
  core: [
    { name: 'Cable Crunch', focus: 'Upper Abs', category: 'upper-abs', kind: 'Isolation', sets: '3-4 sets', reps: '10-15 reps', level: 'Beginner' },
    { name: 'Dead Bug', focus: 'Deep Core', category: 'upper-abs', kind: 'Stability', sets: '3 sets', reps: '8-12 reps/side', level: 'Beginner' },
    { name: 'Hanging Knee Raise', focus: 'Lower Abs', category: 'lower-abs', kind: 'Stability', sets: '3 sets', reps: '8-15 reps', level: 'Intermediate' },
    { name: 'Reverse Crunch', focus: 'Lower Abs', category: 'lower-abs', kind: 'Isolation', sets: '3 sets', reps: '10-15 reps', level: 'Beginner' },
    { name: 'Pallof Press', focus: 'Obliques', category: 'obliques', kind: 'Stability', sets: '3 sets', reps: '10-15 reps/side', level: 'Beginner' },
  ],
};

type ExerciseItem = {
  name: string;
  image?: string | null;
  sets: string[];
};

type SuggestionItem = {
  value: string;
  data?: {
    name?: string;
    image_thumbnail?: string;
  };
};

const createSet = (weight = '', reps = '10') => `${weight}@${reps}`;
const createDefaultSets = (count = 3) => Array.from({ length: count }, () => createSet());

const splitSet = (raw: string) => {
  const [weight = '', reps = ''] = (raw || '@').split('@');
  return { weight, reps };
};

const sanitizeDecimal = (value: string) => value.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1').trim();
const sanitizeWholeNumber = (value: string) => value.replace(/[^\d]/g, '').trim();

const getRecommendedWorkoutType = (date: Date) => {
  const day = date.getDay();
  if (day === 1 || day === 4) return 'Back/Biceps';
  if (day === 2 || day === 5) return 'Legs';
  if (day === 0) return 'Core';
  return 'Chest/Triceps';
};

const getRecommendedSplitId = (date: Date) => {
  const day = date.getDay();
  if (day === 1 || day === 4) return 'pull';
  if (day === 2 || day === 5) return 'legs';
  if (day === 0) return 'core';
  return 'push';
};

const readPendingExercises = (storageKey: string): ExerciseItem[] => {
  try {
    const raw = JSON.parse(localStorage.getItem(storageKey) || '[]');
    return Array.isArray(raw) ? raw : [];
  } catch {
    return [];
  }
};

const normalizeExercise = (exercise: ExerciseItem): ExerciseItem | null => {
  const trimmedName = exercise.name.trim();
  const normalizedSets = (exercise.sets || [])
    .map(rawSet => {
      const { weight, reps } = splitSet(rawSet);
      const nextWeight = sanitizeDecimal(weight);
      const nextReps = sanitizeWholeNumber(reps);
      if (!nextWeight && !nextReps) return null;
      if (!nextReps || Number.parseInt(nextReps, 10) < 1) return null;
      return `${nextWeight}@${nextReps}`;
    })
    .filter(Boolean) as string[];

  if (!trimmedName || normalizedSets.length === 0) return null;

  return {
    ...exercise,
    name: trimmedName,
    sets: normalizedSets,
  };
};

export default function WorkoutEntry() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [isLightMode, setIsLightMode] = useState(() => localStorage.getItem('workoutEntryTheme') === 'light');
  const [date, setDate] = useState(new Date());
  const [showCalendar, setShowCalendar] = useState(false);
  const [workoutType, setWorkoutType] = useState(() => getRecommendedWorkoutType(new Date()));
  const [weight, setWeight] = useState('');
  const [notes, setNotes] = useState('');
  const [includeCardio, setIncludeCardio] = useState(true);
  const [incline, setIncline] = useState('5');
  const [speed, setSpeed] = useState('3.2');
  const [cardioTime, setCardioTime] = useState('15');
  const [exerciseList, setExerciseList] = useState<ExerciseItem[]>([]);
  const [exerciseName, setExerciseName] = useState('');
  const [draftSets, setDraftSets] = useState<string[]>(createDefaultSets());
  const [selectedExercise, setSelectedExercise] = useState<SuggestionItem['data'] | null>(null);
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [formError, setFormError] = useState('');
  const [queueNotice, setQueueNotice] = useState('');
  const [suppressFetch, setSuppressFetch] = useState(false);
  const [manualOpen, setManualOpen] = useState(false);
  const [guidedSplit, setGuidedSplit] = useState(() => getRecommendedSplitId(new Date()));
  const [guidedCategory, setGuidedCategory] = useState('');
  const [guidedSetCount, setGuidedSetCount] = useState('3');
  const [guidedWeight, setGuidedWeight] = useState('');
  const [guidedReps, setGuidedReps] = useState('10');
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const pendingKey = useMemo(
    () => (user ? `pendingWorkoutExercises_${user.uid}` : 'pendingWorkoutExercises_guest'),
    [user]
  );

  const pendingCount = exerciseList.length;
  const queueHasExercises = pendingCount > 0;
  const totalSets = exerciseList.reduce((sum, exercise) => sum + (exercise.sets?.length || 0), 0);
  const saveLabel = queueHasExercises ? `Save ${pendingCount} exercise${pendingCount > 1 ? 's' : ''}` : 'Save Workout';
  const currentSplit = guidedSplits.find(split => split.id === guidedSplit) || guidedSplits[0];
  const visibleGuidedExercises = (guidedExerciseLibrary[guidedSplit] || []).filter(exercise =>
    guidedCategory ? exercise.category === guidedCategory : true
  );

  const theme = isLightMode
    ? {
        page: 'text-slate-900',
        shell: 'rounded-[28px] border border-[#d8e6df] bg-[linear-gradient(180deg,#fdfefb_0%,#f3f8f5_100%)] shadow-[0_20px_70px_rgba(15,23,42,0.07)]',
        section: 'rounded-3xl border border-[#d7e2dd] bg-white/90',
        sectionStrong: 'rounded-3xl border border-[#cde6d7] bg-[linear-gradient(180deg,#ffffff_0%,#f6fbf8_100%)]',
        sectionTint: 'rounded-3xl border border-[#cfe5db] bg-[linear-gradient(180deg,#f4fbf7_0%,#ebf7f1_100%)]',
        muted: 'text-slate-500',
        label: 'text-slate-500',
        title: 'text-slate-950',
        text: 'text-slate-700',
        chip: 'border-[#d6e0db] bg-white text-slate-600 hover:border-emerald-200 hover:text-slate-900',
        chipActive: 'border-[#9fd0b3] bg-emerald-100 text-emerald-900',
        input: 'border-[#d7e1dd] bg-white text-slate-950 placeholder:text-slate-400',
        queueEmpty: 'border-[#d6e0db] bg-white/95',
        card: 'border-[#d6e0db] bg-white/95',
        cardMuted: 'border-[#dfe7e3] bg-[#f7fbf8]',
        accentButton: 'border-emerald-300 bg-emerald-600 text-white',
        subtleButton: 'border-[#d6e0db] bg-white text-slate-700',
        saveBar: 'border-[#d6e0db] bg-white/95',
      }
    : {
        page: 'text-zinc-100',
        shell: 'rounded-[28px] border border-[#1d1f25] bg-gradient-to-br from-[#0b0c10] via-[#0a0f12] to-[#050607] shadow-[0_25px_80px_rgba(0,0,0,0.6)]',
        section: 'rounded-3xl border border-white/8 bg-[#0d1016]',
        sectionStrong: 'rounded-3xl border border-emerald-500/20 bg-[#070c0a]',
        sectionTint: 'rounded-3xl border border-emerald-500/20 bg-[#071009]',
        muted: 'text-zinc-500',
        label: 'text-zinc-400',
        title: 'text-white',
        text: 'text-zinc-300',
        chip: 'border-white/10 bg-black/30 text-zinc-400 hover:text-white',
        chipActive: 'border-emerald-400/60 bg-emerald-500/15 text-emerald-100',
        input: 'border-white/10 bg-[#10121a] text-white placeholder:text-zinc-500',
        queueEmpty: 'border-white/10 bg-black/35',
        card: 'border-white/10 bg-black/30',
        cardMuted: 'border-white/8 bg-[#090b11]',
        accentButton: 'border-emerald-400/55 bg-emerald-500/12 text-emerald-100',
        subtleButton: 'border-white/10 bg-black/30 text-zinc-300',
        saveBar: 'border-white/10 bg-[#06080d]/95',
      };

  useEffect(() => {
    localStorage.setItem('workoutEntryTheme', isLightMode ? 'light' : 'dark');
  }, [isLightMode]);

  useEffect(() => {
    const stored = readPendingExercises(pendingKey);
    setExerciseList(stored);
  }, [pendingKey]);

  useEffect(() => {
    const matchedSplit = guidedSplits.find(split => split.workoutType === workoutType);
    if (matchedSplit) {
      setGuidedSplit(matchedSplit.id);
      if (!matchedSplit.categories.includes(guidedCategory as never)) {
        setGuidedCategory(matchedSplit.categories[0]);
      }
    }
  }, [workoutType, guidedCategory]);

  useEffect(() => {
    if (!guidedCategory || !currentSplit.categories.includes(guidedCategory as never)) {
      setGuidedCategory(currentSplit.categories[0]);
    }
  }, [currentSplit, guidedCategory]);

  useEffect(() => {
    if (exerciseList.length > 0) {
      localStorage.setItem(pendingKey, JSON.stringify(exerciseList));
      return;
    }
    localStorage.removeItem(pendingKey);
  }, [exerciseList, pendingKey]);

  useEffect(() => {
    if (!exerciseName.trim()) {
      setSuggestions([]);
      return;
    }
    if (suppressFetch) return;

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoadingSuggestions(true);
      try {
        const res = await axios.get(
          `https://wger.de/api/v2/exercise/search/?language=english&term=${encodeURIComponent(exerciseName)}`
        );
        const nextSuggestions = (res.data?.suggestions || []).filter((item: SuggestionItem) => !!item.value);
        setSuggestions(nextSuggestions);
      } catch {
        setSuggestions([]);
      }
      setLoadingSuggestions(false);
    }, 350);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [exerciseName, suppressFetch]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setSuggestions([]);
      }
    };
    if (suggestions.length > 0) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [suggestions]);

  const showQueueSaved = (message: string) => {
    setQueueNotice(message);
    setTimeout(() => setQueueNotice(''), 1800);
  };

  const updateDraftSet = (index: number, field: 'weight' | 'reps', value: string) => {
    setDraftSets(prev =>
      prev.map((set, setIndex) => {
        if (setIndex !== index) return set;
        const current = splitSet(set);
        const nextWeight = field === 'weight' ? sanitizeDecimal(value) : sanitizeDecimal(current.weight);
        const nextReps = field === 'reps' ? sanitizeWholeNumber(value) : sanitizeWholeNumber(current.reps);
        return `${nextWeight}@${nextReps}`;
      })
    );
  };

  const addDraftSet = () => {
    setDraftSets(prev => {
      const lastSet = prev[prev.length - 1];
      const nextSet = lastSet ? createSet(splitSet(lastSet).weight, splitSet(lastSet).reps || '10') : createSet();
      return [...prev, nextSet];
    });
  };

  const removeDraftSet = (index: number) => {
    setDraftSets(prev => (prev.length > 1 ? prev.filter((_, setIndex) => setIndex !== index) : prev));
  };

  const updateExerciseSetField = (exerciseIndex: number, setIndex: number, field: 'weight' | 'reps', value: string) => {
    setExerciseList(prev =>
      prev.map((exercise, currentExerciseIndex) => {
        if (currentExerciseIndex !== exerciseIndex) return exercise;
        const updatedSets = exercise.sets.map((set, currentSetIndex) => {
          if (currentSetIndex !== setIndex) return set;
          const current = splitSet(set);
          const nextWeight = field === 'weight' ? sanitizeDecimal(value) : sanitizeDecimal(current.weight);
          const nextReps = field === 'reps' ? sanitizeWholeNumber(value) : sanitizeWholeNumber(current.reps);
          return `${nextWeight}@${nextReps}`;
        });
        return { ...exercise, sets: updatedSets };
      })
    );
  };

  const addSetToExercise = (exerciseIndex: number) => {
    setExerciseList(prev =>
      prev.map((exercise, currentExerciseIndex) => {
        if (currentExerciseIndex !== exerciseIndex) return exercise;
        const lastSet = exercise.sets[exercise.sets.length - 1];
        const clone = lastSet ? createSet(splitSet(lastSet).weight, splitSet(lastSet).reps || '10') : createSet();
        return { ...exercise, sets: [...exercise.sets, clone] };
      })
    );
  };

  const removeSetFromExercise = (exerciseIndex: number, setIndex: number) => {
    setExerciseList(prev =>
      prev.map((exercise, currentExerciseIndex) => {
        if (currentExerciseIndex !== exerciseIndex) return exercise;
        if (exercise.sets.length <= 1) return exercise;
        return { ...exercise, sets: exercise.sets.filter((_, currentSetIndex) => currentSetIndex !== setIndex) };
      })
    );
  };

  const duplicateExercise = (exerciseIndex: number) => {
    setExerciseList(prev => {
      const target = prev[exerciseIndex];
      if (!target) return prev;
      const copy = { ...target, sets: [...target.sets] };
      return [...prev.slice(0, exerciseIndex + 1), copy, ...prev.slice(exerciseIndex + 1)];
    });
    showQueueSaved('Exercise duplicated.');
  };

  const removeExercise = (exerciseIndex: number) => {
    setExerciseList(prev => prev.filter((_, index) => index !== exerciseIndex));
  };

  const addExerciseToQueue = (exercise: ExerciseItem, notice: string) => {
    const normalized = normalizeExercise(exercise);
    if (!normalized) {
      setFormError('Add an exercise name and at least one valid set before continuing.');
      return false;
    }
    setExerciseList(prev => [...prev, normalized]);
    setFormError('');
    showQueueSaved(notice);
    return true;
  };

  const addManualExercise = () => {
    const added = addExerciseToQueue(
      {
        name: exerciseName,
        image: selectedExercise?.image_thumbnail ? `https://wger.de${selectedExercise.image_thumbnail}` : null,
        sets: draftSets,
      },
      'Exercise added to queue.'
    );

    if (!added) return;
    setExerciseName('');
    setDraftSets(createDefaultSets());
    setSelectedExercise(null);
    setSuggestions([]);
    setSuppressFetch(false);
    setManualOpen(false);
  };

  const addGuidedExercise = (exercise: GuidedExercise) => {
    const setCount = Math.max(1, Number.parseInt(guidedSetCount || '3', 10));
    addExerciseToQueue(
      {
        name: exercise.name,
        image: exercise.image || null,
        sets: Array.from({ length: setCount }, () => createSet(sanitizeDecimal(guidedWeight), sanitizeWholeNumber(guidedReps) || '10')),
      },
      `${exercise.name} added to queue.`
    );
  };

  const clearQueue = () => {
    setExerciseList([]);
    setFormError('');
    setQueueNotice('');
  };

  const saveEntry = async () => {
    if (!user) return;

    const normalizedExercises = exerciseList.map(normalizeExercise).filter(Boolean) as ExerciseItem[];

    if (!normalizedExercises.length) {
      setFormError('Add at least one exercise with reps before saving.');
      return;
    }

    if (normalizedExercises.length !== exerciseList.length) {
      setFormError('One or more exercises still have incomplete sets. Fix or remove them before saving.');
      return;
    }

    const nextWeight = sanitizeDecimal(weight);
    const cardioPayload = includeCardio
      ? {
          incline: sanitizeDecimal(incline),
          speed: sanitizeDecimal(speed),
          time: sanitizeWholeNumber(cardioTime),
        }
      : null;

    if (includeCardio && !cardioPayload.time) {
      setFormError('Enter cardio time in minutes or turn cardio off.');
      return;
    }

    const day = format(date, 'EEEE');
    const newEntry = {
      userId: user.uid,
      dateDay: `${format(date, 'yyyy-MM-dd')} - ${day}`,
      weight: nextWeight ? parseFloat(nextWeight) : 0,
      workoutType: workoutType || getRecommendedWorkoutType(date),
      exercises: normalizedExercises,
      notes: notes.trim(),
      cardio: includeCardio ? cardioPayload : null,
    };

    await addDoc(collection(db, 'gymEntries'), newEntry);

    const storageKey = `gymEntries_${user.uid}`;
    const localEntries = readPendingExercises(storageKey) as unknown as object[];
    localStorage.setItem(storageKey, JSON.stringify([...localEntries, newEntry]));

    setShowSuccessModal(true);
    setTimeout(() => setShowSuccessModal(false), 1800);

    setWorkoutType(getRecommendedWorkoutType(new Date()));
    setExerciseList([]);
    setNotes('');
    setIncludeCardio(true);
    setIncline('5');
    setSpeed('3.2');
    setCardioTime('15');
    setWeight('');
    setFormError('');
    setQueueNotice('');
    localStorage.removeItem(pendingKey);
  };

  const baseInput = `h-11 rounded-2xl ${theme.input}`;
  const compactInput = `h-10 rounded-xl ${theme.input}`;
  const chipBase = `rounded-full border px-3 py-2 text-xs font-semibold uppercase tracking-[0.16em] transition`;

  return (
    <div className={`space-y-4 pb-36 sm:pb-24 ${theme.page}`}>
      <header className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => navigate('/dashboard')}
          className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold ${theme.subtleButton}`}
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setManualOpen(value => !value)}
            className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold ${theme.subtleButton}`}
          >
            <Sparkles className="h-3.5 w-3.5" />
            Manual Entry
          </button>
          <button
            type="button"
            onClick={() => setIsLightMode(value => !value)}
            className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold ${theme.subtleButton}`}
            aria-label="Toggle light and dark mode"
          >
            {isLightMode ? <Moon className="h-3.5 w-3.5" /> : <SunMedium className="h-3.5 w-3.5" />}
            {isLightMode ? 'Dark' : 'Light'}
          </button>
        </div>
      </header>

      <AnimatePresence>
        {showSuccessModal && (
          <motion.div
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.94 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          >
            <div className={`${theme.shell} px-8 py-8 text-center`}>
              <div className="text-2xl font-semibold text-emerald-500">Workout Logged</div>
              <p className={`mt-2 text-sm ${theme.muted}`}>Entry saved.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <section className={`${theme.shell} p-4 sm:p-5`}>
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.38em] text-emerald-500">Log Workout</p>
            <h1 className={`mt-1 text-3xl font-semibold ${theme.title}`}>Compact workout entry</h1>
            <p className={`mt-2 max-w-2xl text-sm ${theme.muted}`}>
              Pick a split, tap exercises into the queue, and only open manual entry if you need it.
            </p>
          </div>

          <div className={`${theme.section} grid grid-cols-3 gap-2 p-2 min-w-[240px]`}>
            <div className="rounded-2xl px-3 py-2 text-center">
              <p className={`text-[10px] uppercase tracking-[0.22em] ${theme.label}`}>Exercises</p>
              <p className={`mt-1 text-lg font-semibold ${theme.title}`}>{pendingCount}</p>
            </div>
            <div className="rounded-2xl px-3 py-2 text-center">
              <p className={`text-[10px] uppercase tracking-[0.22em] ${theme.label}`}>Sets</p>
              <p className={`mt-1 text-lg font-semibold ${theme.title}`}>{totalSets}</p>
            </div>
            <div className="rounded-2xl bg-emerald-500/10 px-3 py-2 text-center">
              <p className="text-[10px] uppercase tracking-[0.22em] text-emerald-500">Focus</p>
              <p className="mt-1 text-sm font-semibold text-emerald-600">{workoutType}</p>
            </div>
          </div>
        </div>

        <div className="mt-4 grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
          <div className={`${theme.section} p-4`}>
            <div className="flex items-center gap-2 text-emerald-500">
              <CalendarDays className="h-4 w-4" />
              <p className="text-xs font-semibold uppercase tracking-[0.28em]">Session Basics</p>
            </div>

            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <div>
                <label className={`text-[10px] font-semibold uppercase tracking-[0.26em] ${theme.label}`}>Training Date</label>
                <button
                  type="button"
                  onClick={() => setShowCalendar(value => !value)}
                  className={`mt-2 w-full rounded-2xl border px-4 py-3 text-left text-sm font-semibold ${theme.input}`}
                >
                  {format(date, 'MMMM dd, yyyy - EEEE')}
                </button>
                {showCalendar && (
                  <div className={`${theme.section} mt-3 p-3`}>
                    <Calendar
                      value={date}
                      onChange={(nextDate: Date | Date[]) => {
                        if (Array.isArray(nextDate)) return;
                        setDate(nextDate);
                        setShowCalendar(false);
                      }}
                    />
                  </div>
                )}
              </div>

              <div>
                <label className={`text-[10px] font-semibold uppercase tracking-[0.26em] ${theme.label}`}>Weight (kg)</label>
                <Input
                  value={weight}
                  onChange={event => setWeight(sanitizeDecimal(event.target.value))}
                  inputMode="decimal"
                  placeholder="Optional"
                  className={`mt-2 ${baseInput}`}
                />
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {workoutOptions.map(option => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setWorkoutType(option)}
                  className={`${chipBase} ${option === workoutType ? theme.chipActive : theme.chip}`}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>

          <div className={`${theme.sectionTint} p-4`}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-500">Cardio</p>
                <h2 className={`mt-1 text-xl font-semibold ${theme.title}`}>Finisher</h2>
                <p className={`mt-1 text-xs ${theme.muted}`}>Compact treadmill defaults. Turn it off if not needed.</p>
              </div>
              <label className="relative inline-flex cursor-pointer items-center">
                <input
                  type="checkbox"
                  className="peer sr-only"
                  checked={includeCardio}
                  onChange={() => setIncludeCardio(value => !value)}
                />
                <div className="h-7 w-12 rounded-full bg-emerald-300/60 transition-all peer-checked:bg-emerald-500">
                  <div className="h-7 w-7 rounded-full bg-white shadow transition-transform peer-checked:translate-x-5" />
                </div>
              </label>
            </div>

            {includeCardio && (
              <div className="mt-4 grid grid-cols-3 gap-2">
                <Input value={incline} onChange={e => setIncline(sanitizeDecimal(e.target.value))} inputMode="decimal" className={baseInput} />
                <Input value={speed} onChange={e => setSpeed(sanitizeDecimal(e.target.value))} inputMode="decimal" className={baseInput} />
                <Input value={cardioTime} onChange={e => setCardioTime(sanitizeWholeNumber(e.target.value))} inputMode="numeric" className={baseInput} />
              </div>
            )}
          </div>
        </div>

        <div className={`${theme.sectionStrong} mt-4 p-4`}>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-500">Guided Add</p>
              <h2 className={`mt-1 text-xl font-semibold ${theme.title}`}>Tap exercises into the queue</h2>
            </div>

            <div className="grid gap-2 sm:grid-cols-[1fr_90px_110px_90px]">
              <Input value={guidedSetCount} onChange={e => setGuidedSetCount(sanitizeWholeNumber(e.target.value))} inputMode="numeric" placeholder="Sets" className={baseInput} />
              <Input value={guidedWeight} onChange={e => setGuidedWeight(sanitizeDecimal(e.target.value))} inputMode="decimal" placeholder="Wt" className={baseInput} />
              <Input value={guidedReps} onChange={e => setGuidedReps(sanitizeWholeNumber(e.target.value))} inputMode="numeric" placeholder="Reps" className={baseInput} />
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {guidedSplits.map(split => (
              <button
                key={split.id}
                type="button"
                onClick={() => {
                  setGuidedSplit(split.id);
                  setWorkoutType(split.workoutType);
                  setGuidedCategory(split.categories[0]);
                }}
                className={`${chipBase} ${guidedSplit === split.id ? theme.chipActive : theme.chip}`}
              >
                {split.title}
              </button>
            ))}
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {currentSplit.categories.map(category => (
              <button
                key={category}
                type="button"
                onClick={() => setGuidedCategory(category)}
                className={`${chipBase} ${guidedCategory === category ? theme.chipActive : theme.chip}`}
              >
                {categoryLabels[category] || category}
              </button>
            ))}
          </div>

          <div className="mt-4 grid gap-3 lg:grid-cols-2">
            {visibleGuidedExercises.map(exercise => (
              <article key={exercise.name} className={`${theme.card} rounded-3xl border p-4`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className={`truncate text-base font-semibold ${theme.title}`}>{exercise.name}</h3>
                    <p className={`mt-1 text-sm ${theme.muted}`}>{exercise.focus}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => addGuidedExercise(exercise)}
                    className={`rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] ${theme.accentButton}`}
                  >
                    Add
                  </button>
                </div>
                <div className="mt-3 flex flex-wrap gap-2 text-[11px]">
                  <span className={`${theme.cardMuted} rounded-full border px-3 py-1 ${theme.text}`}>{exercise.kind}</span>
                  <span className={`${theme.cardMuted} rounded-full border px-3 py-1 ${theme.text}`}>{exercise.sets}</span>
                  <span className={`${theme.cardMuted} rounded-full border px-3 py-1 ${theme.text}`}>{exercise.reps}</span>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className={`${theme.sectionStrong} mt-4 p-4`}>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-500">Queue</p>
              <p className={`mt-1 text-sm ${theme.muted}`}>Exercises are saved to your queue as soon as you add them.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setManualOpen(value => !value)}
                className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] ${theme.subtleButton}`}
              >
                Manual
                <ChevronDown className={`h-3.5 w-3.5 transition ${manualOpen ? 'rotate-180' : ''}`} />
              </button>
              {queueHasExercises && (
                <button
                  type="button"
                  onClick={clearQueue}
                  className={`rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] ${theme.subtleButton}`}
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          <div aria-live="polite" className="mt-3 min-h-5">
            {queueNotice && <p className="text-sm font-medium text-emerald-500">{queueNotice}</p>}
          </div>

          {queueHasExercises ? (
            <div className="mt-3 grid gap-3 xl:grid-cols-2">
              {exerciseList.map((exercise, exerciseIndex) => (
                <article key={`${exercise.name}-${exerciseIndex}`} className={`${theme.card} rounded-[26px] border p-3`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className={`truncate text-base font-semibold ${theme.title}`}>{exercise.name}</h3>
                      <p className={`mt-1 text-xs ${theme.muted}`}>{exercise.sets.length} sets</p>
                    </div>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => duplicateExercise(exerciseIndex)} className={`rounded-full border p-2 ${theme.subtleButton}`} aria-label={`Duplicate ${exercise.name}`}>
                        <Copy className="h-4 w-4" />
                      </button>
                      <button type="button" onClick={() => removeExercise(exerciseIndex)} className={`rounded-full border p-2 ${theme.subtleButton}`} aria-label={`Remove ${exercise.name}`}>
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-3 space-y-2">
                    {exercise.sets.map((setValue, setIndex) => {
                      const { weight: setWeight, reps: setReps } = splitSet(setValue);
                      return (
                        <div key={`${exercise.name}-${setIndex}`} className={`${theme.cardMuted} rounded-xl border px-3 py-2.5`}>
                          <div className="grid gap-2 md:grid-cols-[56px_1fr_1fr_auto_auto] md:items-center">
                            <p className={`text-[10px] font-semibold uppercase tracking-[0.22em] ${theme.label}`}>S{setIndex + 1}</p>
                            <Input
                              value={setWeight}
                              onChange={event => updateExerciseSetField(exerciseIndex, setIndex, 'weight', event.target.value)}
                              inputMode="decimal"
                              placeholder="Weight"
                              className={compactInput}
                            />
                            <Input
                              value={setReps}
                              onChange={event => updateExerciseSetField(exerciseIndex, setIndex, 'reps', event.target.value)}
                              inputMode="numeric"
                              placeholder="Reps"
                              className={compactInput}
                            />
                            <button
                              type="button"
                              onClick={() => removeSetFromExercise(exerciseIndex, setIndex)}
                              disabled={exercise.sets.length <= 1}
                              className={`h-10 rounded-xl border px-3 text-[10px] font-semibold uppercase tracking-[0.12em] ${theme.subtleButton}`}
                            >
                              Remove
                            </button>
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() =>
                                  updateExerciseSetField(exerciseIndex, setIndex, 'reps', String(Math.max(1, Number.parseInt(setReps || '10', 10) - 1)))
                                }
                                className={`h-10 rounded-xl border px-3 ${theme.subtleButton}`}
                                aria-label="Decrease reps"
                              >
                                <Minus className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  updateExerciseSetField(exerciseIndex, setIndex, 'reps', String(Math.max(1, Number.parseInt(setReps || '10', 10) + 1)))
                                }
                                className={`h-10 rounded-xl border px-3 ${theme.subtleButton}`}
                                aria-label="Increase reps"
                              >
                                <Plus className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <button
                    type="button"
                    onClick={() => addSetToExercise(exerciseIndex)}
                    className={`mt-3 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.16em] ${theme.accentButton}`}
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add Set
                  </button>
                </article>
              ))}
            </div>
          ) : (
            <div className={`${theme.queueEmpty} mt-3 rounded-3xl border px-4 py-8 text-center`}>
              <Sparkles className="mx-auto h-8 w-8 text-emerald-500" />
              <h3 className={`mt-3 text-lg font-semibold ${theme.title}`}>No exercises queued</h3>
              <p className={`mt-2 text-sm ${theme.muted}`}>Use Guided Add above, or open Manual if you need a custom exercise.</p>
            </div>
          )}
        </div>

        <div className={`${theme.section} mt-4 overflow-hidden`}>
          <button
            type="button"
            onClick={() => setManualOpen(value => !value)}
            className="flex w-full items-center justify-between px-4 py-4 text-left"
            aria-expanded={manualOpen}
          >
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-emerald-500">Manual Entry</p>
              <p className={`mt-1 text-sm ${theme.muted}`}>Search or create a custom exercise only when needed.</p>
            </div>
            <ChevronDown className={`h-5 w-5 transition ${manualOpen ? 'rotate-180' : ''}`} />
          </button>

          {manualOpen && (
            <div className="border-t border-black/5 px-4 pb-4 pt-4">
              <div ref={dropdownRef}>
                <Input
                  value={exerciseName}
                  onChange={event => {
                    setSuppressFetch(false);
                    setExerciseName(event.target.value);
                    setFormError('');
                  }}
                  placeholder="Search exercise name..."
                  autoComplete="off"
                  className={baseInput}
                />
                {loadingSuggestions && <p className={`mt-2 text-xs ${theme.muted}`}>Fetching suggestions…</p>}
                {suggestions.length > 0 && (
                  <ul className={`${theme.card} mt-2 max-h-56 overflow-y-auto rounded-2xl border`}>
                    {suggestions.map((item, index) => (
                      <li key={`${item.value}-${index}`}>
                        <button
                          type="button"
                          onClick={() => {
                            setExerciseName(item.value);
                            setSelectedExercise(item.data || null);
                            setSuppressFetch(true);
                            setSuggestions([]);
                          }}
                          className="flex w-full items-center gap-3 px-3 py-3 text-left"
                        >
                          {item.data?.image_thumbnail && (
                            <img src={`https://wger.de${item.data.image_thumbnail}`} alt="" className="h-8 w-8 rounded-lg object-cover" />
                          )}
                          <span className={theme.title}>{item.value}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="mt-4 space-y-2">
                {draftSets.map((setValue, index) => {
                  const { weight: setWeight, reps: setReps } = splitSet(setValue);
                  return (
                    <div key={`draft-set-${index}`} className={`${theme.cardMuted} rounded-2xl border p-3`}>
                      <div className="flex items-center justify-between gap-2">
                        <p className={`text-[10px] font-semibold uppercase tracking-[0.22em] ${theme.label}`}>Set {index + 1}</p>
                        <button
                          type="button"
                          onClick={() => removeDraftSet(index)}
                          disabled={draftSets.length <= 1}
                          className={`rounded-full border px-2 py-1 text-[10px] font-semibold ${theme.subtleButton}`}
                        >
                          Remove
                        </button>
                      </div>
                      <div className="mt-2 grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
                        <Input value={setWeight} onChange={event => updateDraftSet(index, 'weight', event.target.value)} inputMode="decimal" placeholder="Weight" className={baseInput} />
                        <Input value={setReps} onChange={event => updateDraftSet(index, 'reps', event.target.value)} inputMode="numeric" placeholder="Reps" className={baseInput} />
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => updateDraftSet(index, 'reps', String(Math.max(1, Number.parseInt(setReps || '10', 10) - 1)))}
                            className={`rounded-2xl border px-3 ${theme.subtleButton}`}
                          >
                            <Minus className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => updateDraftSet(index, 'reps', String(Math.max(1, Number.parseInt(setReps || '10', 10) + 1)))}
                            className={`rounded-2xl border px-3 ${theme.subtleButton}`}
                          >
                            <Plus className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                <button type="button" onClick={addDraftSet} className={`rounded-full border px-4 py-3 text-sm font-semibold ${theme.subtleButton}`}>
                  Add Set
                </button>
                <button type="button" onClick={addManualExercise} className={`flex-1 rounded-full border px-4 py-3 text-sm font-semibold ${theme.accentButton}`}>
                  Add To Queue
                </button>
              </div>
            </div>
          )}
        </div>

        <div className={`${theme.section} mt-4 p-4`}>
          <label className={`text-[10px] font-semibold uppercase tracking-[0.26em] ${theme.label}`}>Notes</label>
          <Textarea
            value={notes}
            onChange={event => setNotes(event.target.value)}
            placeholder="Quick notes, PRs, or cues..."
            className={`mt-2 min-h-[100px] rounded-2xl ${theme.input}`}
          />
        </div>

        <div aria-live="polite" className="mt-4 min-h-6">
          {formError && <p className="text-sm font-medium text-rose-500">{formError}</p>}
        </div>
      </section>

      <div className="fixed inset-x-0 bottom-16 z-40 px-4 sm:bottom-4">
        <div className={`${theme.saveBar} mx-auto flex w-full max-w-5xl flex-col gap-3 rounded-[26px] border p-3 shadow-[0_20px_60px_rgba(0,0,0,0.18)] backdrop-blur md:flex-row md:items-center md:justify-between`}>
          <div className="min-w-0">
            <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-emerald-500">Ready To Save</p>
            <p className={`mt-1 text-sm ${theme.muted}`}>
              {queueHasExercises ? `${pendingCount} exercise${pendingCount > 1 ? 's' : ''} ready for ${format(date, 'MMM d')}.` : 'Add at least one exercise before saving.'}
            </p>
          </div>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className={`rounded-full border px-5 py-3 text-sm font-semibold ${theme.subtleButton}`}
            >
              Home
            </button>
            <button
              type="button"
              onClick={saveEntry}
              disabled={!queueHasExercises}
              className="rounded-full bg-gradient-to-r from-emerald-500 to-lime-400 px-6 py-3 text-sm font-semibold text-[#041208] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {saveLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
