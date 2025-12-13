import React, { useState, useEffect, useRef } from 'react';
import { format } from 'date-fns';
import { Calendar } from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '@/firebase';
import { collection, addDoc, getDocs, deleteDoc, doc, setDoc, query, where } from 'firebase/firestore';
import { useAuth } from '@/lib/auth';

const workoutOptions = ['Chest/Triceps', 'Back/Biceps', 'Shoulders', 'Legs', 'Core'];

export default function GymEntrySystem() {
  const [date, setDate] = useState(new Date());
  const [showCalendar, setShowCalendar] = useState(false);
  const [workoutType, setWorkoutType] = useState('');
  const [exerciseName, setExerciseName] = useState('');
  const [sets, setSets] = useState(['', '', '', '']);
  const [exerciseList, setExerciseList] = useState<any[]>([]);
  const [notes, setNotes] = useState('');
  const [entries, setEntries] = useState<any[]>([]);
  const [toastMessage, setToastMessage] = useState('');
  const [editingEntryId, setEditingEntryId] = useState<number | string | null>(null);
  const entriesEndRef = useRef(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | string | null>(null);
  const [lastDeletedEntry, setLastDeletedEntry] = useState<any | null>(null);
  const [showUndoBar, setShowUndoBar] = useState(false);
  const undoTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { user } = useAuth();

  const handleCloseModal = () => {
    setShowSuccessModal(false);
  };
  
  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(''), 2000);
  };

  const scrollToBottom = () => {
    if (entriesEndRef.current) {
      entriesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  useEffect(() => {
    if (!user) {
      setEntries([]);
      return;
    }

    const loadEntries = async () => {
      const storageKey = `gymEntries_${user.uid}`;
      const localData = localStorage.getItem(storageKey);
      if (localData) {
        setEntries(JSON.parse(localData));
      }

      const q = query(collection(db, "gymEntries"), where('userId', '==', user.uid));
      const snapshot = await getDocs(q);
      const cloudData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      if (cloudData.length > 0) {
        setEntries(cloudData);
      }
    };
    loadEntries();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const storageKey = `gymEntries_${user.uid}`;
    localStorage.setItem(storageKey, JSON.stringify(entries));
  }, [entries, user]);

  useEffect(() => {
    return () => {
      if (undoTimeoutRef.current) {
        clearTimeout(undoTimeoutRef.current);
      }
    };
  }, []);

  const addExercise = () => {
    if (exerciseName.trim() !== '') {
      setExerciseList(prev => [...prev, { name: exerciseName, sets }]);
      setExerciseName('');
      setSets(['', '', '', '']);
    }
  };

  const saveEntry = async () => {
    if (!user) return;
    if (workoutType && exerciseList.length > 0) {
      const day = format(date, 'EEEE');
      const newEntry = {
        userId: user.uid,
        dateDay: `${format(date, 'yyyy-MM-dd')} - ${day}`,
        workoutType,
        exercises: exerciseList,
        notes,
      };
      
      const docRef = await addDoc(collection(db, "gymEntries"), newEntry);
      setEntries(prev => [...prev, { id: docRef.id, ...newEntry }]);
      setWorkoutType('');
      setExerciseList([]);
      setNotes('');
      setShowSuccessModal(true);
      setTimeout(() => {
        setShowSuccessModal(false);
      }, 2000);
      setTimeout(() => scrollToBottom(), 500);
    }
  };

  const deleteEntry = async (id: string | number) => {
    const entryToDelete = entries.find(entry => entry.id === id);
    if (!entryToDelete) return;
    await deleteDoc(doc(db, "gymEntries", id as string));
    setEntries(prev => prev.filter(entry => entry.id !== id));
    setLastDeletedEntry(entryToDelete);
    setShowUndoBar(true);

    if (undoTimeoutRef.current) {
      clearTimeout(undoTimeoutRef.current);
    }
    undoTimeoutRef.current = setTimeout(() => {
      setShowUndoBar(false);
      setLastDeletedEntry(null);
    }, 5000);
  };

  const handleUndoDelete = async () => {
    if (!lastDeletedEntry) return;
    const { id, ...data } = lastDeletedEntry;
    await setDoc(doc(db, "gymEntries", id as string), data);
    setEntries(prev => [...prev, lastDeletedEntry]);
    setShowUndoBar(false);
    setLastDeletedEntry(null);
    if (undoTimeoutRef.current) {
      clearTimeout(undoTimeoutRef.current);
    }
  };

  const saveEditedEntry = (id: string | number, updatedEntry: any) => {
    setEntries(prev =>
      prev.map(entry => (entry.id === id ? { ...entry, ...updatedEntry } : entry))
    );
    setEditingEntryId(null);
    showToast('💾 Changes Saved!');
  };

  return (
    <div className="min-h-screen bg-zinc-900 text-zinc-100 p-6 font-sans">
      {/* Toast */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 right-4 bg-green-600 text-white py-2 px-4 rounded shadow-md z-50"
          >
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {confirmDeleteId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="mx-4 w-full max-w-xs rounded-3xl bg-[#111216] px-6 py-6 text-center shadow-2xl">
            <h2 className="text-lg font-semibold text-white">Delete Workout?</h2>
            <p className="mt-2 text-sm text-zinc-400">
              Are you sure you want to delete this workout? This action cannot be undone.
            </p>
            <div className="mt-6 space-y-3">
              <button
                onClick={async () => {
                  if (confirmDeleteId !== null) {
                    await deleteEntry(confirmDeleteId);
                  }
                  setConfirmDeleteId(null);
                }}
                className="w-full rounded-full bg-rose-600 py-2 text-sm font-semibold text-white shadow hover:bg-rose-500"
              >
                Delete
              </button>
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="w-full rounded-full bg-[#181a1f] py-2 text-sm font-semibold text-zinc-100 hover:bg-[#20232a]"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showUndoBar && lastDeletedEntry && (
        <div className="fixed bottom-6 left-1/2 z-40 flex -translate-x-1/2 items-center rounded-full bg-black/80 px-5 py-2 text-sm text-white shadow-lg">
          <span>Workout deleted.</span>
          <button
            onClick={handleUndoDelete}
            className="ml-4 text-xs font-semibold tracking-wide text-emerald-400 hover:text-emerald-300"
          >
            UNDO
          </button>
        </div>
      )}

      <h1 className="text-4xl font-extrabold text-center mb-8 text-indigo-400 tracking-tight">
        🏋️ Gym Entry System
      </h1>

      {/* Form */}
      <Card className="bg-zinc-800 border border-zinc-700">
        <CardContent className="space-y-6 p-6">
          {/* Date and Day */}
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

          {/* Workout Type */}
          <div>
            <label className="block font-medium mb-1 text-zinc-300">Workout Type</label>
            <Select onValueChange={setWorkoutType} value={workoutType}>
              <SelectTrigger className="w-full bg-zinc-700 border-zinc-600 text-white">
                <SelectValue placeholder="Select Workout Type" />
              </SelectTrigger>
              <SelectContent>
                {workoutOptions.map(type => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Exercise and Sets */}
          {workoutType && (
            <div className="space-y-4">
              <div>
                <label className="block font-medium mb-1 text-zinc-300">Exercise Name</label>
                <Input
                  value={exerciseName}
                  onChange={(e) => setExerciseName(e.target.value)}
                  placeholder="Type Exercise Name (e.g., Bench Press)"
                  className="bg-zinc-700 border-zinc-600 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {[...Array(4)].map((_, i) => (
                  <Input
                    key={i}
                    placeholder={`Set ${i + 1} (lbs x reps)`}
                    value={sets[i]}
                    onChange={(e) => {
                      const updated = [...sets];
                      updated[i] = e.target.value;
                      setSets(updated);
                    }}
                    className="bg-zinc-700 border-zinc-600 text-white"
                  />
                ))}
              </div>

              <button onClick={addExercise} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg shadow-md">
                ➕ Add Exercise
              </button>

              {/* Display added exercises */}
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
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block font-medium mb-1 text-zinc-300">Notes</label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any notes..."
              className="bg-zinc-700 border-zinc-600 text-white"
            />
          </div>

          {/* Save Entry */}
          <div className="flex justify-center">
            <button onClick={saveEntry} className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-2 rounded-lg mt-4 shadow-md">
              💾 Save Workout
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Entries List */}
      {entries.length > 0 && (
        <div className="mt-10 space-y-4">
          <h2 className="text-2xl font-bold text-indigo-400">Workout Entries</h2>
          <AnimatePresence>
            {entries.map((entry) => (
              <motion.div key={entry.id} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }} transition={{ duration: 0.3 }}>
                <Card className="bg-zinc-800 border border-zinc-700">
                  <CardContent className="p-4 text-zinc-200">
                    <div className="flex justify-between items-center">
                      <div className="text-lg font-semibold text-indigo-300">
                        {entry.dateDay || "📅 Date Unknown"}
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => setEditingEntryId(entry.id)} className="text-green-400 hover:text-green-600 text-sm">✏️ Edit</button>
                        <button onClick={() => setConfirmDeleteId(entry.id)} className="text-red-400 hover:text-red-600 text-sm">🗑️ Delete</button>
                      </div>
                    </div>

                    <div className="text-md">💪 Workout: <span className="text-white">{entry.workoutType}</span></div>

                    {editingEntryId === entry.id ? (
                      <div className="space-y-3 mt-4">
                        {entry.exercises.map((ex: any, idx: number) => (
                          <div key={idx}>
                            <Input
                              value={ex.name}
                              onChange={(e) => {
                                const updated = [...entry.exercises];
                                updated[idx].name = e.target.value;
                                saveEditedEntry(entry.id, { exercises: updated });
                              }}
                              className="mb-2 bg-zinc-700 border-zinc-600 text-white"
                            />
                            {ex.sets.map((s: string, i: number) => (
                              <Input
                                key={i}
                                value={s}
                                onChange={(e) => {
                                  const updated = [...entry.exercises];
                                  updated[idx].sets[i] = e.target.value;
                                  saveEditedEntry(entry.id, { exercises: updated });
                                }}
                                placeholder={`Set ${i + 1}`}
                                className="mb-2 bg-zinc-700 border-zinc-600 text-white"
                              />
                            ))}
                          </div>
                        ))}
                        <Textarea
                          value={entry.notes}
                          onChange={(e) => saveEditedEntry(entry.id, { notes: e.target.value })}
                          placeholder="Edit Notes"
                          className="bg-zinc-700 border-zinc-600 text-white"
                        />
                      </div>
                    ) : (
                      <>
                        {(entry.exercises || []).map((ex: any, idx: number) => (
                          <div key={idx} className="mt-2">
                            <div className="font-semibold">{ex.name}</div>
                            {ex.sets.map((s: string, i: number) => (
                              <div key={i} className="text-sm text-zinc-400">Set {i + 1}: {s || '-'}</div>
                            ))}
                          </div>
                        ))}
                        <div className="mt-2 text-sm text-zinc-400">📝 Notes: {entry.notes || 'None'}</div>
                      </>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
          <div ref={entriesEndRef} />
        </div>
      )}

{showSuccessModal && (
  <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.9, opacity: 0 }}
      className="bg-zinc-800 text-white px-8 py-6 rounded-lg shadow-lg text-center"
    >
      <div className="text-2xl mb-2">✅ Workout Saved</div>
      <div className="text-zinc-400">You can view it below in your entries</div>
      <button onClick={handleCloseModal} className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 rounded text-sm">
        ✖ Close
      </button>
    </motion.div>
  </div>
)}

    </div>
  );
}
