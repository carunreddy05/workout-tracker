import React, { useState, useRef, useEffect } from 'react';
import { format } from 'date-fns';
import { Calendar } from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { Link } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '@/firebase';
import { collection, addDoc, getDocs } from 'firebase/firestore';
import axios from "axios";

const workoutOptions = ['Chest/Triceps', 'Back/Biceps', 'Shoulders', 'Legs', 'Core', 'Custom Workout'];

export default function WorkoutEntry() {
  const [date, setDate] = useState(new Date());
  const [showCalendar, setShowCalendar] = useState(false);
  const [workoutType, setWorkoutType] = useState('');
  const [exerciseName, setExerciseName] = useState('');
  // Each set is stored as `${weight}@${reps}`. Start with 4 sets default, 10 reps each.
  const defaultSets = ['@10', '@10', '@10', '@10'];
  const [sets, setSets] = useState<string[]>(defaultSets);
  const [exerciseList, setExerciseList] = useState<any[]>([]);
  const [notes, setNotes] = useState('');
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [includeCardio, setIncludeCardio] = useState(false);
  const [incline, setIncline] = useState('');
  const [speed, setSpeed] = useState('');
  const [cardioTime, setCardioTime] = useState('');
  const [weight, setWeight] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState<any>(null);
  const [entryError, setEntryError] = useState<string>('');
  const entriesEndRef = useRef(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const exerciseInputRef = useRef<HTMLInputElement | null>(null);
  const [suppressFetch, setSuppressFetch] = useState(false);

  // Debounce timer
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch suggestions when exerciseName changes
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
        // Store the full suggestion object
        setSuggestions(
          res.data.suggestions.filter((item: any) => !!item.value)
        );
      } catch {
        setSuggestions([]);
      }
      setLoadingSuggestions(false);
    }, 400);
    // Cleanup
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [exerciseName, suppressFetch]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setSuggestions([]);
      }
    }
    if (suggestions.length > 0) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [suggestions]);

  const addExercise = () => {
    if (!exerciseName.trim()) {
      setEntryError('Please choose an exercise first.');
      return;
    }
    setEntryError('');
    const imageThumb = selectedExercise?.image_thumbnail
      ? `https://wger.de${selectedExercise.image_thumbnail}`
      : null;
    setExerciseList(prev => [
      ...prev,
      {
        name: exerciseName,
        // Firestore does not allow undefined values
        image: imageThumb,
        sets: [...sets],
      },
    ]);
    setExerciseName('');
    setSelectedExercise(null);
    setSuggestions([]);
    setSuppressFetch(false);
    setSets(defaultSets);
  };

  const addSetRow = () => {
    setSets(prev => [...prev, '@10']);
  };

  const removeSetRow = (index: number) => {
    setSets(prev => prev.length > 1 ? prev.filter((_, i) => i !== index) : prev);
  };

  const changeReps = (index: number, delta: number) => {
    setSets(prev => {
      const next = [...prev];
      const [w, rRaw] = (next[index] || '').split('@');
      const current = parseInt(rRaw || '10', 10);
      const newReps = Math.max(1, current + delta);
      next[index] = `${w || ''}@${newReps}`;
      return next;
    });
  };

  const saveEntry = async () => {
    if (workoutType && exerciseList.length > 0) {
      const day = format(date, 'EEEE');
      
      const newEntry = {
        dateDay: `${format(date, 'yyyy-MM-dd')} - ${day}`,
        weight: weight ? parseFloat(weight) : 0,
        workoutType,
        exercises: exerciseList,
        notes,
        cardio: includeCardio
          ? { incline, speed, time: cardioTime }
          : null,
      };
      await addDoc(collection(db, "gymEntries"), newEntry);

      const localEntries = JSON.parse(localStorage.getItem('gymEntries') || '[]');
      localStorage.setItem('gymEntries', JSON.stringify([...localEntries, newEntry]));

      
      setWorkoutType('');
      setExerciseList([]);
      setNotes('');
      setIncludeCardio(false);
      setIncline('');
      setSpeed('');
      setCardioTime('');
      setShowSuccessModal(true);
      setTimeout(() => setShowSuccessModal(false), 2000);
      setWeight('');
    }
  };
  

  return (
    <div className="space-y-8 pb-24">
      <AnimatePresence>
        {showSuccessModal && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50"
          >
            <div className="rounded-3xl border border-emerald-400/25 bg-[#0b0f0c] px-8 py-10 text-center shadow-[0_35px_120px_rgba(0,0,0,0.65)]">
              <div className="text-3xl font-semibold text-emerald-300">Workout Logged</div>
              <p className="mt-3 text-sm text-zinc-400">Keep the streak alive. Entry saved.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <section className="rounded-[32px] border border-[#1d1f25] bg-gradient-to-br from-[#0b0c10] via-[#0a0f12] to-[#050607] p-6 shadow-[0_25px_80px_rgba(0,0,0,0.6)]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.4em] text-emerald-400">Log Workout</p>
            <h1 className="text-3xl font-semibold text-white">Dial in the details</h1>
            <p className="text-sm text-zinc-400">Date, type, sets, and cardio — all in one flow.</p>
          </div>
          <span className="rounded-full border border-emerald-400/30 px-4 py-1 text-xs font-semibold uppercase tracking-[0.4em] text-emerald-200">
            Session Builder
          </span>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-xs font-semibold uppercase tracking-[0.3em] text-zinc-400">Select Date</label>
            <button
              type="button"
              onClick={() => setShowCalendar(!showCalendar)}
              className="mt-2 w-full rounded-2xl border border-white/10 bg-[#13141b] px-4 py-3 text-left font-semibold text-white transition hover:border-emerald-400/40"
            >
              {format(date, "MMMM dd, yyyy - EEEE")}
            </button>
            {showCalendar && (
              <div className="mt-3 rounded-2xl border border-white/5 bg-black/80 p-3 shadow-2xl">
                <Calendar
                  value={date}
                  onChange={(d: any) => {
                    setDate(d);
                    setShowCalendar(false);
                  }}
                />
              </div>
            )}
          </div>
          <div>
            <label className="text-xs font-semibold uppercase tracking-[0.3em] text-zinc-400">Today's Weight (kg)</label>
            <Input
              type="number"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="e.g., 102"
              className="mt-2 rounded-2xl border border-white/5 bg-[#13141b] text-white focus-visible:border-emerald-400/70"
            />
          </div>
        </div>

        <div className="mt-6">
          <label className="text-xs font-semibold uppercase tracking-[0.3em] text-zinc-400">Workout Type</label>
          <Select onValueChange={setWorkoutType} value={workoutType}>
            <SelectTrigger className="mt-2 w-full rounded-2xl border border-white/5 bg-[#13141b] text-white focus-visible:border-emerald-400/70">
              <SelectValue placeholder="Select Workout Type" />
            </SelectTrigger>
            <SelectContent className="bg-[#0d0f14] text-white">
              {workoutOptions.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {workoutType && (
          <div className="mt-8 rounded-[28px] border border-white/5 bg-[#0c0e12] p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-300">Exercise Builder</p>
                <h2 className="text-2xl font-semibold text-white">Sets & Volume</h2>
              </div>
            </div>
            <div className="mt-5 space-y-5">
              <div ref={dropdownRef}>
                <label className="text-xs font-semibold uppercase tracking-[0.3em] text-zinc-400">Exercise Name</label>
                <Input
                  ref={exerciseInputRef}
                  value={exerciseName}
                  onChange={(e) => {
                    setSuppressFetch(false);
                    setExerciseName(e.target.value);
                    setEntryError('');
                  }}
                  placeholder="e.g., Bench Press"
                  className="mt-2 rounded-2xl border border-white/5 bg-[#151820] text-white focus-visible:border-emerald-400/70"
                  autoComplete="off"
                />
                {entryError && (
                  <div className="mt-1 text-xs font-medium text-rose-400">{entryError}</div>
                )}
                {loadingSuggestions && (
                  <div className="mt-1 text-xs text-zinc-500">Fetching suggestions…</div>
                )}
                {suggestions.length > 0 && (
                  <ul className="mt-2 max-h-40 overflow-y-auto rounded-2xl border border-white/10 bg-[#050607]">
                    {suggestions.map((item, idx) => (
                      <li
                        key={idx}
                        className="flex cursor-pointer items-center gap-3 px-3 py-2 text-sm text-white hover:bg-white/5"
                        onClick={() => {
                          setExerciseName(item.value);
                          setSelectedExercise(item.data);
                          setSuppressFetch(true);
                          setSuggestions([]);
                          // blur to prevent re-open
                          setTimeout(() => exerciseInputRef.current?.blur(), 0);
                        }}
                      >
                        {item.data.image_thumbnail && (
                          <img
                            src={`https://wger.de${item.data.image_thumbnail}`}
                            alt={item.value}
                            className="h-8 w-8 rounded-lg border border-white/10"
                          />
                        )}
                        {item.value}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <div className="space-y-3">
                {sets.map((setValue, idx) => {
                  const [weightValue, repsValue] = setValue.split('@');
                  return (
                    <div
                      key={idx}
                      className="flex items-center gap-3 rounded-2xl border border-white/10 bg-[#090b11] px-4 py-3"
                    >
                      <span className="whitespace-nowrap text-sm font-semibold tracking-[0.15em] text-zinc-500">
                        {`set${idx + 1}`}
                      </span>
                      <div className="flex-1 min-w-0">
                        <label className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.3em] text-zinc-500">Wt</label>
                        <div className="rounded-2xl border border-white/10 bg-[#10121a] px-3 py-2 text-white focus-within:border-emerald-400/60">
                          <input
                          value={weightValue || ''}
                          onChange={(e) => {
                            const updated = [...sets];
                            updated[idx] = `${e.target.value}@${repsValue || ''}`;
                            setSets(updated);
                          }}
                          placeholder="Weight"
                          className="w-full bg-transparent text-base text-white placeholder:text-zinc-500 focus:outline-none"
                          />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <label className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.3em] text-zinc-500">Rep</label>
                        <div className="rounded-2xl border border-emerald-400/30 bg-[#10121a] px-3 py-2 text-white focus-within:border-emerald-400/70">
                          <input
                          value={repsValue || ''}
                          onChange={(e) => {
                            const updated = [...sets];
                            updated[idx] = `${weightValue || ''}@${e.target.value}`;
                            setSets(updated);
                          }}
                          placeholder="Reps"
                          className="w-full bg-transparent text-base text-white placeholder:text-zinc-500 focus:outline-none"
                          />
                        </div>
                      </div>
                      <div className="flex shrink-0 gap-2 text-zinc-500">
                        <button
                          type="button"
                          onClick={() => changeReps(idx, -1)}
                          className="rounded-full border border-white/15 px-2 py-1 text-xs hover:text-white"
                        >
                          −
                        </button>
                        <button
                          type="button"
                          onClick={() => changeReps(idx, +1)}
                          className="rounded-full border border-white/15 px-2 py-1 text-xs hover:text-white"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-4 flex justify-center">
                <button
                  type="button"
                  onClick={addExercise}
                  className="flex w-full items-center justify-center rounded-[18px] border border-emerald-400/60 bg-gradient-to-r from-emerald-400 via-emerald-500 to-lime-400 px-5 py-3 text-sm font-semibold text-[#041208] shadow-[0_18px_40px_rgba(34,197,94,0.35)] hover:brightness-110 sm:w-1/2"
                >
                  ➕ Add Exercise
                </button>
              </div>

              {exerciseList.length > 0 && (
                <div className="space-y-3">
                  {exerciseList.map((ex, idx) => (
                    <div
                      key={idx}
                      className="rounded-2xl border border-white/5 bg-[#090c11] p-4 text-sm text-zinc-300"
                    >
                      <div className="mb-3 flex items-center gap-3">
                        {ex.image ? (
                          <img
                            src={ex.image}
                            alt={ex.name}
                            className="h-10 w-10 rounded-lg border border-white/10 object-cover"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-lg border border-white/10 bg-white/5" />
                        )}
                        {/* Intentionally do not show name text per request */}
                      </div>
                      <div className="mt-1 space-y-2 text-xs text-zinc-400">
                        {ex.sets.map((set: string, i: number) => {
                          const [w, r] = (set || '').split('@');
                          return (
                            <div key={i} className="flex items-center gap-3 rounded-xl border border-white/5 px-4 py-2">
                              <span className="text-zinc-500">{i + 1}</span>
                              <span className="flex-1 text-white">{w || '—'} kg</span>
                              <span className="flex-1 text-white">{r || '—'} reps</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {selectedExercise && selectedExercise.image_thumbnail && (
                <div className="flex items-center gap-3 rounded-2xl border border-white/5 bg-[#07090d] p-3 text-sm text-zinc-400">
                  <img
                    src={`https://wger.de${selectedExercise.image_thumbnail}`}
                    alt={selectedExercise.name}
                    className="h-12 w-12 rounded-xl border border-white/5"
                  />
                  {selectedExercise.name}
                </div>
              )}
            </div>
          </div>
        )}

        <div className="mt-8 rounded-[32px] border border-emerald-400/20 bg-gradient-to-br from-[#03140b] via-[#041c0f] to-[#020805] p-6 shadow-[0_30px_70px_rgba(12,212,123,0.12)]">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-300">Cardio Block</p>
              <h2 className="text-xl font-semibold text-white">Optional Finisher</h2>
              <p className="text-xs text-emerald-100/70">Dial in incline, speed & pace when you want to sweat it out.</p>
            </div>
            <label className="relative inline-flex cursor-pointer items-center">
              <input type="checkbox" className="peer sr-only" checked={includeCardio} onChange={() => setIncludeCardio(!includeCardio)} />
              <div className="h-6 w-12 rounded-full bg-emerald-400/30 peer-checked:bg-lime-300/80 transition-all">
                <div className="h-6 w-6 rounded-full bg-white shadow peer-checked:translate-x-6" />
              </div>
            </label>
          </div>
          {includeCardio && (
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              <Input
                value={incline}
                onChange={(e) => setIncline(e.target.value)}
                placeholder="Incline"
                className="rounded-2xl border border-emerald-500/30 bg-[#07150b] text-white"
              />
              <Input
                value={speed}
                onChange={(e) => setSpeed(e.target.value)}
                placeholder="Speed (mph)"
                className="rounded-2xl border border-emerald-500/30 bg-[#07150b] text-white"
              />
              <Input
                value={cardioTime}
                onChange={(e) => setCardioTime(e.target.value)}
                placeholder="Time (mins)"
                className="rounded-2xl border border-emerald-500/30 bg-[#07150b] text-white"
              />
            </div>
          )}
        </div>

        <div className="mt-8">
          <label className="text-xs font-semibold uppercase tracking-[0.3em] text-zinc-400">Notes</label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Mental cues, how it felt, next session focus…"
            className="mt-2 min-h-[120px] rounded-2xl border border-white/5 bg-[#151820] text-white focus-visible:border-emerald-400/70"
          />
        </div>

        <div className="mt-8 flex flex-col items-center gap-3">
          <button
            onClick={saveEntry}
            className="w-full rounded-[30px] bg-gradient-to-r from-emerald-400 via-emerald-500 to-lime-400 py-4 text-lg font-semibold text-[#041208] shadow-[0_20px_40px_rgba(16,185,129,0.4)] transition hover:brightness-110 sm:w-auto sm:px-16"
          >
            Save Workout
          </button>
          <Link
            to="/"
            className="w-full rounded-[30px] bg-gradient-to-r from-emerald-400 via-emerald-500 to-lime-400 py-4 text-lg font-semibold text-[#041208] text-center shadow-[0_20px_40px_rgba(16,185,129,0.4)] transition hover:brightness-110 sm:w-auto sm:px-16"
          >
            Home
          </Link>
        </div>
      </section>
    </div>
  );
}
