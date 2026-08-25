import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/firebase';
import DatePickerHeader from '@/components/DatePickerHeader';
import type { Set } from '@/types/WorkoutEntry';
import { ALL_EXERCISES, type LibraryExercise } from '@/utils/exerciseLibrary';
import { isBodyweightOnly } from '@/utils/exerciseMeasurement';

const kgToLbs = (kg: number) => Math.round(kg * 2.20462 * 10) / 10;

interface QueuedExercise {
  name: string;
  focus: string;
  kind: string;
  sets: Set[];
}

export default function Train() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const dropdownRef = useRef<HTMLDivElement>(null);

  const today = format(new Date(), 'yyyy-MM-dd');

  // State
  const [selectedDate, setSelectedDate] = useState(today);
  const [mode, setMode] = useState<'manual' | 'smart'>('manual');
  const [searchInput, setSearchInput] = useState('');
  const [suggestions, setSuggestions] = useState<LibraryExercise[]>([]);
  const [queue, setQueue] = useState<QueuedExercise[]>([]);
  const [error, setError] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [includeCardio, setIncludeCardio] = useState(false);
  const [cardioSpeed, setCardioSpeed] = useState('5');
  const [cardioTime, setCardioTime] = useState('15');
  const [hasExistingData, setHasExistingData] = useState(false);

  // All exercises from library (MVP: both modes use same data)
  const allLibraryExercises = useMemo(() => {
    return ALL_EXERCISES;
  }, []);

  // Check for existing data when date changes
  useEffect(() => {
    const checkExistingData = async () => {
      if (!user) {
        setHasExistingData(false);
        return;
      }

      try {
        const snap = await getDocs(
          query(collection(db, 'gymEntries'), where('userId', '==', user.uid), where('date', '==', selectedDate))
        );
        setHasExistingData(snap.size > 0);
      } catch (error) {
        console.error('Error checking existing data:', error);
        setHasExistingData(false);
      }
    };

    checkExistingData();
  }, [selectedDate, user]);

  // Search: filter library by input (both Manual and Smart modes)
  useEffect(() => {
    if (!searchInput.trim()) {
      setSuggestions([]);
      return;
    }
    const query = searchInput.toLowerCase();
    const filtered = allLibraryExercises.filter(ex =>
      ex.name.toLowerCase().includes(query)
    );
    setSuggestions(filtered.slice(0, 12));
  }, [searchInput, allLibraryExercises]);

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

  // Add exercise to queue
  const addExercise = (exercise: LibraryExercise) => {
    const newSets: Set[] = Array.from({ length: 3 }, () => ({
      w: exercise.defWeight,
      r: exercise.defReps,
      done: false,
      pr: false,
    }));

    const newExercise: QueuedExercise = {
      name: exercise.name,
      focus: exercise.focus,
      kind: exercise.kind,
      sets: newSets,
    };

    setQueue(prev => [...prev, newExercise]);
    setSearchInput('');
    setSuggestions([]);
    setShowDropdown(false);
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

    navigate('/summary', {
      state: {
        queue,
        date: selectedDate,
        cardio: includeCardio ? { speed: parseFloat(cardioSpeed), time: parseInt(cardioTime) } : null
      }
    });
  };

  const handleDateChange = (date: string) => {
    setSelectedDate(date);
    setQueue([]);
    setError('');
  };

  const handleExistingDataClick = () => {
    navigate('/history');
  };

  const totalSets = queue.reduce((sum, ex) => sum + ex.sets.length, 0);

  return (
    <div className="pb-24" style={{ background: 'var(--tf-bg)', color: 'var(--tf-ink)' }}>
      {/* Header with Date Picker */}
      <DatePickerHeader
        selectedDate={selectedDate}
        onDateChange={handleDateChange}
        hasExistingData={hasExistingData}
        onExistingDataClick={handleExistingDataClick}
      />

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
          onClick={() => setMode('smart')}
          className="px-4 py-2 rounded-full text-sm font-semibold transition"
          style={{
            background: mode === 'smart' ? 'var(--tf-accent)' : 'var(--tf-surface)',
            color: mode === 'smart' ? 'var(--tf-accent-ink)' : 'var(--tf-ink2)',
            border: `1px solid ${mode === 'smart' ? 'var(--tf-accent)' : 'var(--tf-line2)'}`,
          }}
        >
          Smart Search
        </button>
      </div>

      {/* Input Section */}
      <div className="px-6 py-4 relative" ref={dropdownRef}>
        <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--tf-mute)' }}>
          {mode === 'manual' ? 'Exercise Name' : 'Search Library'}
        </label>
        <input
          type="text"
          value={searchInput}
          onChange={e => {
            setSearchInput(e.target.value);
            setShowDropdown(true);
          }}
          onFocus={() => setShowDropdown(true)}
          placeholder="Type exercise name..."
          className="w-full px-4 py-3 rounded-xl text-sm"
          style={{
            background: 'var(--tf-surface)',
            border: '1px solid var(--tf-line)',
            color: 'var(--tf-ink)',
            outline: 'none',
          }}
        />

        {showDropdown && suggestions.length > 0 && (
          <div
            className="mt-2 rounded-xl overflow-hidden z-50 w-full max-h-64 overflow-y-auto"
            style={{ background: 'var(--tf-surface2)', border: '1px solid var(--tf-line2)' }}
          >
            {suggestions.map(ex => (
              <button
                key={ex.name}
                onClick={() => addExercise(ex)}
                className="w-full px-4 py-3 text-left border-b text-sm hover:opacity-80 flex flex-col"
                style={{ borderColor: 'var(--tf-line)' }}
              >
                <div className="font-semibold" style={{ color: 'var(--tf-ink2)' }}>
                  {ex.name}
                </div>
                <div className="text-xs mt-0.5" style={{ color: 'var(--tf-mute)' }}>
                  {ex.focus} · {ex.kind}
                </div>
              </button>
            ))}
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

                      {!isBodyweightOnly(ex.name) && (
                        <>
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
                        </>
                      )}

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

                      {isBodyweightOnly(ex.name) && (
                        <p className="text-xs" style={{ color: 'var(--tf-mute)' }}>
                          reps
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Cardio Finisher Section */}
      <div className="px-6 py-4 border-t" style={{ borderColor: 'var(--tf-line)' }}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--tf-mute)' }}>
              Cardio Finisher
            </p>
            <p className="text-sm mt-1" style={{ color: 'var(--tf-mute)' }}>
              Treadmill cooldown (optional)
            </p>
          </div>
          <label className="relative inline-flex cursor-pointer items-center">
            <input
              type="checkbox"
              className="peer sr-only"
              checked={includeCardio}
              onChange={() => setIncludeCardio(!includeCardio)}
            />
            <div
              className="relative h-6 w-11 rounded-full transition-colors"
              style={{
                background: includeCardio ? 'var(--tf-accent)' : 'var(--tf-surface2)',
                border: `1px solid ${includeCardio ? 'var(--tf-accent)' : 'var(--tf-line2)'}`,
              }}
            >
              <div
                className="absolute top-0.5 h-5 w-5 rounded-full transition-transform"
                style={{
                  background: includeCardio ? 'var(--tf-accent-ink)' : 'white',
                  transform: includeCardio ? 'translateX(20px)' : 'translateX(2px)',
                }}
              />
            </div>
          </label>
        </div>

        {includeCardio && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--tf-mute)' }}>
                Speed (km/h)
              </p>
              <input
                type="number"
                step="0.1"
                value={cardioSpeed}
                onChange={e => setCardioSpeed(e.target.value)}
                inputMode="decimal"
                className="w-full px-3 py-2 rounded-lg text-sm font-semibold text-center"
                style={{
                  background: 'var(--tf-surface)',
                  border: '1px solid var(--tf-line)',
                  color: 'var(--tf-ink)',
                }}
              />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--tf-mute)' }}>
                Time (min)
              </p>
              <input
                type="number"
                value={cardioTime}
                onChange={e => setCardioTime(e.target.value)}
                inputMode="numeric"
                className="w-full px-3 py-2 rounded-lg text-sm font-semibold text-center"
                style={{
                  background: 'var(--tf-surface)',
                  border: '1px solid var(--tf-line)',
                  color: 'var(--tf-ink)',
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Sticky Save Button */}
      {queue.length > 0 && (
        <div
          className="fixed bottom-20 left-0 right-0 p-4 border-t z-40"
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
