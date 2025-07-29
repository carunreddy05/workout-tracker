import React, { useState, useRef, useEffect } from 'react';
import { format } from 'date-fns';
import { Calendar } from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '@/firebase';
import { collection, addDoc, getDocs } from 'firebase/firestore';
import BackHeader from '@/components/BackHeader';
import axios from "axios";

const workoutOptions = ['Chest/Triceps', 'Back/Biceps', 'Shoulders', 'Legs', 'Core'];

export default function WorkoutEntry() {
  const [date, setDate] = useState(new Date());
  const [showCalendar, setShowCalendar] = useState(false);
  const [workoutType, setWorkoutType] = useState('');
  const [exerciseName, setExerciseName] = useState('');
  const [sets, setSets] = useState(['', '', '', '']);
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
  const entriesEndRef = useRef(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);

  // Debounce timer
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch suggestions when exerciseName changes
  useEffect(() => {
    if (!exerciseName.trim()) {
      setSuggestions([]);
      return;
    }
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
  }, [exerciseName]);

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
    if (exerciseName.trim() !== '') {
      setExerciseList(prev => [...prev, { name: exerciseName, sets }]);
      setExerciseName('');
      setSets(['', '', '', '']);
    }
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
    <div className="space-y-8">
      <AnimatePresence>
        {showSuccessModal && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          >
            <div className="bg-zinc-800 p-8 rounded-lg shadow-lg text-center space-y-2">
              <div className="text-2xl text-green-400 font-bold">✅ Workout Saved!</div>
              <div className="text-zinc-300 text-sm">Your workout has been logged successfully.</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <BackHeader title="📝 Log Workout" />

      <Card className="bg-zinc-800 border border-zinc-700">
        <CardContent className="space-y-6 p-6">
          <div>
            <label className="block font-medium mb-1 text-zinc-300">Select Date</label>
            <Input
              readOnly
              value={`${format(date, 'yyyy-MM-dd')} - ${format(date, 'EEEE')}`}
              onClick={() => setShowCalendar(!showCalendar)}
              className="cursor-pointer bg-zinc-700 border-zinc-600 text-white"
            />
            {showCalendar && (
              <div className="mt-2 bg-white p-2 rounded-md shadow-md">
                <Calendar value={date} onChange={(d: any) => { setDate(d); setShowCalendar(false); }} />
              </div>
            )}
          </div>

          <div>
            <label className="block font-medium mb-1 text-zinc-300">Today's Weight (kg)</label>
            <Input
              type="number"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="e.g., 102"
              className="bg-zinc-700 border-zinc-600 text-white"
            />
          </div>

          <div>
            <label className="block font-medium mb-1 text-zinc-300">Workout Type</label>
            <Select onValueChange={setWorkoutType} value={workoutType}>
              <SelectTrigger className="w-full bg-zinc-700 border-zinc-600 text-white">
                <SelectValue placeholder="Select Workout Type" />
              </SelectTrigger>
              <SelectContent>
                {workoutOptions.map(type => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {workoutType && (
            <div className="space-y-4">
              <div>
                <label className="block font-medium mb-1 text-zinc-300">Exercise Name</label>
                <div ref={dropdownRef}>
                  <Input
                    value={exerciseName}
                    onChange={(e) => setExerciseName(e.target.value)}
                    placeholder="e.g., Bench Press"
                    className="bg-zinc-700 border-zinc-600 text-white"
                    autoComplete="off"
                  />
                  {loadingSuggestions && (
                    <div className="text-xs text-zinc-400 mt-1">Loading...</div>
                  )}
                  {suggestions.length > 0 && (
                    <ul className="bg-zinc-800 border border-zinc-600 rounded mt-1 max-h-40 overflow-y-auto">
                      {suggestions.map((item, idx) => (
                        <li
                          key={idx}
                          className="px-3 py-2 hover:bg-zinc-700 cursor-pointer text-white flex items-center"
                          onClick={() => {
                            setExerciseName(item.value);
                            setSelectedExercise(item.data);
                            setSuggestions([]);
                          }}
                        >
                          {item.data.image_thumbnail && (
                            <img
                              src={`https://wger.de${item.data.image_thumbnail}`}
                              alt={item.value}
                              className="w-6 h-6 mr-2 rounded"
                            />
                          )}
                          {item.value}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {sets.map((set, idx) => (
                  <Input
                    key={idx}
                    placeholder={`Set ${idx + 1} (lbs x reps)`}
                    value={set}
                    onChange={(e) => {
                      const updated = [...sets];
                      updated[idx] = e.target.value;
                      setSets(updated);
                    }}
                    className="bg-zinc-700 border-zinc-600 text-white"
                  />
                ))}
              </div>

              <button
                onClick={addExercise}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2 rounded-lg mt-2 shadow-md"
              >
                ➕ Add Exercise
              </button>

              {exerciseList.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-lg font-semibold mb-2 text-indigo-400">Exercises Added:</h3>
                  {exerciseList.map((ex, idx) => (
                    <div key={idx} className="border border-zinc-600 p-2 rounded-md mb-2">
                      <div className="font-semibold text-white">{ex.name}</div>
                      <div className="text-sm text-zinc-400">
                        {ex.sets.map((set: string, i: number) => (
                          <div key={i}>Set {i + 1}: {set || '-'}</div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {selectedExercise && selectedExercise.image_thumbnail && (
                <div className="mt-2 flex items-center">
                  <img
                    src={`https://wger.de${selectedExercise.image_thumbnail}`}
                    alt={selectedExercise.name}
                    className="w-12 h-12 rounded mr-2 border border-zinc-600"
                  />
                  <span className="text-zinc-300">{selectedExercise.name}</span>
                </div>
              )}
            </div>
          )}

          {/* Cardio Fields */}
          <div className="space-y-2">
            <label className="inline-flex items-center text-zinc-300 font-medium">
              <input
                type="checkbox"
                checked={includeCardio}
                onChange={() => setIncludeCardio(!includeCardio)}
                className="mr-2"
              />
              🏃 Include Cardio
            </label>
            {includeCardio && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Input
                  value={incline}
                  onChange={(e) => setIncline(e.target.value)}
                  placeholder="Incline"
                  className="bg-zinc-700 border-zinc-600 text-white"
                />
                <Input
                  value={speed}
                  onChange={(e) => setSpeed(e.target.value)}
                  placeholder="Speed (mph)"
                  className="bg-zinc-700 border-zinc-600 text-white"
                />
                <Input
                  value={cardioTime}
                  onChange={(e) => setCardioTime(e.target.value)}
                  placeholder="Time (mins)"
                  className="bg-zinc-700 border-zinc-600 text-white"
                />
              </div>
            )}
          </div>

          <div>
            <label className="block font-medium mb-1 text-zinc-300">Notes</label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional notes..."
              className="bg-zinc-700 border-zinc-600 text-white"
            />
          </div>

          <div className="flex justify-center">
            <button
              onClick={saveEntry}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-2 rounded-lg mt-4 shadow-md"
            >
              💾 Save Workout
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
