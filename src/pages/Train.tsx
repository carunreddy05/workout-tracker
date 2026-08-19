import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import axios from 'axios';
import { Minus, Plus, Trash2, Loader } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import type { Set } from '@/types/WorkoutEntry';
import { SPLIT_LIBRARY } from '@/utils/firestore';

const kgToLbs = (kg: number) => Math.round(kg * 2.20462 * 10) / 10;
const lbsToKg = (lbs: number) => Math.round(lbs / 2.20462 * 100) / 100;

interface QueuedExercise {
  name: string;
  focus: string;
  kind: string;
  sets: Set[];
  image?: string | null;
}

interface WgerExercise {
  id: number;
  name: string;
  target_muscle?: { name: string };
  equipment?: { name: string };
  image?: string;
}

interface WgerSearchResult {
  id: number;
  name: string;
  equipment?: { name: string };
  muscles?: Array<{ id: number; name: string }>;
  images?: Array<{ image: string }>;
}

export default function Train() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const today = format(new Date(), 'yyyy-MM-dd');

  // State
  const [mode, setMode] = useState<'manual' | 'automatic'>('manual');
  const [manualInput, setManualInput] = useState('');
  const [autoInput, setAutoInput] = useState('');
  const [manualSuggestions, setManualSuggestions] = useState<typeof SPLIT_LIBRARY['push']>([]);
  const [autoResults, setAutoResults] = useState<WgerSearchResult[]>([]);
  const [autoLoading, setAutoLoading] = useState(false);
  const [queue, setQueue] = useState<QueuedExercise[]>([]);
  const [error, setError] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  // Get all exercises from local library for manual mode
  const allLibraryExercises = useMemo(() => {
    return Object.values(SPLIT_LIBRARY).flat();
  }, []);

  // Manual mode: autocomplete from local library
  useEffect(() => {
    if (!manualInput.trim()) {
      setManualSuggestions([]);
      return;
    }
    const query = manualInput.toLowerCase();
    const filtered = allLibraryExercises.filter(ex =>
      ex.name.toLowerCase().includes(query)
    );
    setManualSuggestions(filtered.slice(0, 8));
  }, [manualInput, allLibraryExercises]);

  // Automatic mode: debounced wger.de search
  useEffect(() => {
    if (mode !== 'automatic') return;

    if (!autoInput.trim()) {
      setAutoResults([]);
      return;
    }

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      setAutoLoading(true);
      try {
        const res = await axios.get(
          `https://wger.de/api/v2/exercise/search/?language=english&term=${encodeURIComponent(autoInput)}`
        );
        const suggestions = (res.data?.suggestions || []).slice(0, 8);
        setAutoResults(suggestions);
      } catch (err) {
        console.error('Error searching exercises:', err);
        setAutoResults([]);
      } finally {
        setAutoLoading(false);
      }
    }, 350); // 350ms debounce

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [autoInput, mode]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    if (showDropdown) {
      document.addEventListener('mousedown', handler);
      return () => document.removeEventListener('mousedown', handler);
    }
  }, [showDropdown]);

  // Add exercise from manual mode
  const addManualExercise = (exercise: typeof SPLIT_LIBRARY['push'][0]) => {
    const defaultWeight = exercise.defWeight;
    const defaultReps = exercise.defReps;

    const newSets: Set[] = Array.from({ length: 3 }, () => ({
      w: defaultWeight,
      r: defaultReps,
      done: false,
      pr: false,
    }));

    const newExercise: QueuedExercise = {
      name: exercise.name,
      focus: exercise.focus,
      kind: exercise.kind,
      sets: newSets,
      image: null,
    };

    setQueue(prev => [...prev, newExercise]);
    setManualInput('');
    setManualSuggestions([]);
    setError('');
  };

  // Add exercise from automatic mode
  const addAutoExercise = (result: WgerSearchResult) => {
    const muscle = result.muscles?.[0]?.name || 'General';
    const equipment = result.equipment?.name || 'N/A';
    const image = result.images?.[0]?.image || null;

    const defaultWeight = 50;
    const defaultReps = 10;

    const newSets: Set[] = Array.from({ length: 3 }, () => ({
      w: defaultWeight,
      r: defaultReps,
      done: false,
      pr: false,
    }));

    const newExercise: QueuedExercise = {
      name: result.name,
      focus: muscle,
      kind: equipment,
      sets: newSets,
      image,
    };

    setQueue(prev => [...prev, newExercise]);
    setAutoInput('');
    setAutoResults([]);
    setError('');
  };

  // Update set weight
  const updateSetWeight = (exIdx: number, setIdx: number, weight: number) => {
    setQueue(prev =>
      prev.map((ex, i) =>
        i === exIdx
          ? { ...ex, sets: ex.sets.map((s, j) => (j === setIdx ? { ...s, w: weight } : s)) }
          : ex
      )
    );
  };

  // Update set reps
  const updateSetReps = (exIdx: number, setIdx: number, reps: number) => {
    setQueue(prev =>
      prev.map((ex, i) =>
        i === exIdx
          ? { ...ex, sets: ex.sets.map((s, j) => (j === setIdx ? { ...s, r: reps } : s)) }
          : ex
      )
    );
  };

  // Delete exercise
  const deleteExercise = (exIdx: number) => {
    setQueue(prev => prev.filter((_, i) => i !== exIdx));
  };

  // Adjust set count
  const adjustSetCount = (exIdx: number, delta: number) => {
    setQueue(prev =>
      prev.map((ex, i) => {
        if (i !== exIdx) return ex;
        const currentCount = ex.sets.length;
        const newCount = Math.max(1, currentCount + delta);

        if (newCount > currentCount) {
          const lastSet = ex.sets[currentCount - 1];
          return {
            ...ex,
            sets: [...ex.sets, { ...lastSet }],
          };
        } else {
          return {
            ...ex,
            sets: ex.sets.slice(0, newCount),
          };
        }
      })
    );
  };

  // Save and go to summary
  const handleSaveAndReview = () => {
    if (queue.length === 0) {
      setError('Add at least one exercise');
      return;
    }

    // Store in session state (via route params or context)
    // Navigate to summary with queue data
    navigate('/summary', { state: { queue, today } });
  };

  const totalSets = queue.reduce((sum, ex) => sum + ex.sets.length, 0);

  return (
    <div className="pb-24" style={{ background: 'var(--tf-bg)', color: 'var(--tf-ink)' }}>
      {/* Header */}
      <div className="px-6 py-6 border-b" style={{ borderColor: 'var(--tf-line)' }}>
        <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--tf-mute)' }}>
          Today's Workout
        </p>
        <p className="mt-2 text-2xl font-bold" style={{ color: 'var(--tf-ink)' }}>
          {format(new Date(), 'EEEE, MMM d')}
        </p>
      </div>

      {/* Mode Toggle */}
      <div className="px-6 py-4 flex gap-2">
        <button
          onClick={() => setMode('manual')}
          className="px-4 py-2 rounded-full text-sm font-semibold transition"
          style={{
            background: mode === 'manual' ? 'var(--tf-accent)' : 'var(--tf-surface)',
            color: mode === 'manual' ? 'var(--tf-accent-ink)' : 'var(--tf-ink2)',
            border: `1px solid ${mode === 'manual' ? 'var(--tf-accent)' : 'var(--tf-line2)'}`,
          }}
        >
          Manual
        </button>
        <button
          onClick={() => setMode('automatic')}
          className="px-4 py-2 rounded-full text-sm font-semibold transition"
          style={{
            background: mode === 'automatic' ? 'var(--tf-accent)' : 'var(--tf-surface)',
            color: mode === 'automatic' ? 'var(--tf-accent-ink)' : 'var(--tf-ink2)',
            border: `1px solid ${mode === 'automatic' ? 'var(--tf-accent)' : 'var(--tf-line2)'}`,
          }}
        >
          API Search
        </button>
      </div>

      {/* Input Section */}
      <div className="px-6 py-4" ref={dropdownRef}>
        {mode === 'manual' ? (
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--tf-mute)' }}>
              Exercise Name
            </label>
            <input
              type="text"
              value={manualInput}
              onChange={e => {
                setManualInput(e.target.value);
                setShowDropdown(true);
              }}
              onFocus={() => setShowDropdown(true)}
              placeholder="Search exercises..."
              className="w-full px-4 py-3 rounded-xl text-sm"
              style={{
                background: 'var(--tf-surface)',
                border: '1px solid var(--tf-line)',
                color: 'var(--tf-ink)',
                outline: 'none',
              }}
            />
            {showDropdown && manualSuggestions.length > 0 && (
              <div
                className="mt-1 rounded-xl overflow-hidden z-20 absolute left-6 right-6 max-w-none"
                style={{ background: 'var(--tf-surface2)', border: '1px solid var(--tf-line2)' }}
              >
                {manualSuggestions.map(ex => (
                  <button
                    key={ex.name}
                    onClick={() => addManualExercise(ex)}
                    className="w-full px-4 py-3 text-left border-b text-sm hover:opacity-80"
                    style={{ borderColor: 'var(--tf-line)', color: 'var(--tf-ink2)' }}
                  >
                    <div className="font-semibold">{ex.name}</div>
                    <div className="text-xs mt-0.5" style={{ color: 'var(--tf-mute)' }}>
                      {ex.focus} · {ex.kind}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--tf-mute)' }}>
              Search API
            </label>
            <div className="relative">
              <input
                type="text"
                value={autoInput}
                onChange={e => {
                  setAutoInput(e.target.value);
                  setShowDropdown(true);
                }}
                onFocus={() => setShowDropdown(true)}
                placeholder="Type to search..."
                className="w-full px-4 py-3 rounded-xl text-sm"
                style={{
                  background: 'var(--tf-surface)',
                  border: '1px solid var(--tf-line)',
                  color: 'var(--tf-ink)',
                  outline: 'none',
                }}
              />
              {autoLoading && (
                <Loader className="absolute right-4 top-3.5 w-4 h-4 animate-spin" style={{ color: 'var(--tf-mute)' }} />
              )}
            </div>
            {showDropdown && autoResults.length > 0 && (
              <div
                className="mt-1 rounded-xl overflow-hidden z-20 absolute left-6 right-6 max-w-none max-h-64 overflow-y-auto"
                style={{ background: 'var(--tf-surface2)', border: '1px solid var(--tf-line2)' }}
              >
                {autoResults.map(result => (
                  <button
                    key={result.id}
                    onClick={() => addAutoExercise(result)}
                    className="w-full px-4 py-3 text-left border-b text-sm hover:opacity-80 flex gap-3 items-start"
                    style={{ borderColor: 'var(--tf-line)' }}
                  >
                    {result.images?.[0]?.image && (
                      <img
                        src={result.images[0].image}
                        alt=""
                        className="w-10 h-10 rounded object-cover shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-sm" style={{ color: 'var(--tf-ink2)' }}>
                        {result.name}
                      </div>
                      <div className="text-xs mt-0.5" style={{ color: 'var(--tf-mute)' }}>
                        {result.muscles?.[0]?.name || 'N/A'} · {result.equipment?.name || 'N/A'}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {error && (
        <div className="px-6 py-2">
          <p className="text-sm" style={{ color: 'var(--tf-danger)' }}>
            {error}
          </p>
        </div>
      )}

      {/* Exercise Queue */}
      <div className="px-6 py-4 border-t" style={{ borderColor: 'var(--tf-line)' }}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--tf-mute)' }}>
              Queue
            </p>
            <p className="mt-1 text-sm" style={{ color: 'var(--tf-mute)' }}>
              {queue.length} exercise{queue.length !== 1 ? 's' : ''} · {totalSets} sets
            </p>
          </div>
        </div>

        {queue.length === 0 ? (
          <div
            className="py-10 rounded-2xl text-center"
            style={{ background: 'var(--tf-surface)', border: '1px solid var(--tf-line)' }}
          >
            <p className="text-sm" style={{ color: 'var(--tf-mute)' }}>
              No exercises yet. Add one above.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {queue.map((ex, exIdx) => (
              <div
                key={`${ex.name}-${exIdx}`}
                className="rounded-2xl p-4"
                style={{ background: 'var(--tf-surface)', border: '1px solid var(--tf-line)' }}
              >
                {/* Exercise header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <p className="font-semibold text-base" style={{ color: 'var(--tf-ink)' }}>
                      {ex.name}
                    </p>
                    <p className="text-xs mt-1" style={{ color: 'var(--tf-mute)' }}>
                      {ex.focus} · {ex.kind}
                    </p>
                  </div>
                  <button
                    onClick={() => deleteExercise(exIdx)}
                    className="p-2 rounded-full transition hover:opacity-70"
                    style={{ background: 'var(--tf-surface2)', color: 'var(--tf-mute2)' }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Set count control */}
                <div className="flex items-center gap-2 mb-4">
                  <p className="text-xs" style={{ color: 'var(--tf-mute)' }}>
                    Sets:
                  </p>
                  <button
                    onClick={() => adjustSetCount(exIdx, -1)}
                    disabled={ex.sets.length <= 1}
                    className="p-1 rounded-full disabled:opacity-30 transition"
                    style={{ border: '1px solid var(--tf-line)', color: 'var(--tf-mute)' }}
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <p className="w-8 text-center text-sm font-semibold" style={{ color: 'var(--tf-ink)' }}>
                    {ex.sets.length}
                  </p>
                  <button
                    onClick={() => adjustSetCount(exIdx, 1)}
                    className="p-1 rounded-full transition"
                    style={{ border: '1px solid var(--tf-line)', color: 'var(--tf-accent)' }}
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>

                {/* Sets editor */}
                <div className="space-y-2">
                  {ex.sets.map((set, setIdx) => (
                    <div
                      key={`${exIdx}-${setIdx}`}
                      className="flex items-center gap-2 p-2 rounded-lg"
                      style={{ background: 'var(--tf-surface2)' }}
                    >
                      <p className="text-xs w-6" style={{ color: 'var(--tf-mute)' }}>
                        S{setIdx + 1}
                      </p>

                      {/* Weight input */}
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => updateSetWeight(exIdx, setIdx, Math.max(5, set.w - 2.5))}
                          className="p-1 rounded-full transition"
                          style={{ border: '1px solid var(--tf-line)', color: 'var(--tf-mute)' }}
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <input
                          type="number"
                          value={set.w}
                          onChange={e => updateSetWeight(exIdx, setIdx, parseFloat(e.target.value) || 0)}
                          className="w-14 px-2 py-1 rounded text-center text-xs font-semibold"
                          style={{
                            background: 'var(--tf-surface)',
                            border: '1px solid var(--tf-line)',
                            color: 'var(--tf-ink)',
                          }}
                        />
                        <button
                          onClick={() => updateSetWeight(exIdx, setIdx, set.w + 2.5)}
                          className="p-1 rounded-full transition"
                          style={{ border: '1px solid var(--tf-line)', color: 'var(--tf-mute)' }}
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <p className="text-xs" style={{ color: 'var(--tf-mute)' }}>
                        {kgToLbs(set.w).toFixed(0)} lbs
                      </p>

                      <p className="text-xs mx-1" style={{ color: 'var(--tf-mute)' }}>
                        ×
                      </p>

                      {/* Reps input */}
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => updateSetReps(exIdx, setIdx, Math.max(1, set.r - 1))}
                          className="p-1 rounded-full transition"
                          style={{ border: '1px solid var(--tf-line)', color: 'var(--tf-mute)' }}
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <input
                          type="number"
                          value={set.r}
                          onChange={e => updateSetReps(exIdx, setIdx, parseInt(e.target.value) || 0)}
                          className="w-10 px-2 py-1 rounded text-center text-xs font-semibold"
                          style={{
                            background: 'var(--tf-surface)',
                            border: '1px solid var(--tf-line)',
                            color: 'var(--tf-ink)',
                          }}
                        />
                        <button
                          onClick={() => updateSetReps(exIdx, setIdx, set.r + 1)}
                          className="p-1 rounded-full transition"
                          style={{ border: '1px solid var(--tf-line)', color: 'var(--tf-mute)' }}
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Sticky Save Button */}
      {queue.length > 0 && (
        <div
          className="fixed bottom-0 left-0 right-0 p-4 border-t"
          style={{
            background: 'var(--tf-bg)',
            borderColor: 'var(--tf-line)',
          }}
        >
          <button
            onClick={handleSaveAndReview}
            className="w-full px-6 py-3 rounded-2xl font-semibold text-sm transition"
            style={{
              background: 'var(--tf-accent)',
              color: 'var(--tf-accent-ink)',
            }}
          >
            Review & Save ({totalSets} sets)
          </button>
        </div>
      )}
    </div>
  );
}
