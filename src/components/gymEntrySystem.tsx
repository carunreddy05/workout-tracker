import React, { useState, useEffect, useRef } from 'react';
import { format } from 'date-fns';
import { Calendar } from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '@/firebase'; 
import { collection, addDoc, getDocs, deleteDoc, doc } from 'firebase/firestore';

const workoutOptions = {
  'Chest/Triceps': ['Bench Press', 'Incline DB Press', 'Cable Fly'],
  'Back/Biceps': ['Deadlift', 'Lat Pulldown', 'Barbell Row'],
  Shoulders: ['Overhead Press', 'Lateral Raise', 'Front Raise'],
  Legs: ['Squat', 'Lunges', 'Leg Press'],
  Core: ['Plank', 'Sit-ups', 'Leg Raises'],
};

const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function GymEntrySystem() {
  const [date, setDate] = useState(new Date());
  const [day, setDay] = useState('');
  const [workoutType, setWorkoutType] = useState('');
  const [exercise, setExercise] = useState('');
  const [sets, setSets] = useState(['', '', '', '']);
  const [notes, setNotes] = useState('');
  const [entries, setEntries] = useState([]);
  const [showCalendar, setShowCalendar] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [toastMessage, setToastMessage] = useState('');
  const [loading, setLoading] = useState(true);

  const entriesEndRef = useRef(null);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(''), 2000);
  };

  const scrollToBottom = () => {
    if (entriesEndRef.current) {
      entriesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const fetchEntries = async () => {
    setLoading(true);
    const querySnapshot = await getDocs(collection(db, "gymEntries"));
    const fetchedEntries = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    }));
    setEntries(fetchedEntries);
    setLoading(false);
  };

  const addEntry = async () => {
    if (day && workoutType && exercise) {
      if (editingEntry) {
        // Editing logic can be added later with updateDoc
      } else {
        await addDoc(collection(db, "gymEntries"), {
          date: format(date, 'yyyy-MM-dd'),
          day,
          workoutType,
          exercise,
          sets,
          notes,
        });
        showToast('✅ Entry Added!');
        fetchEntries();
        setTimeout(() => scrollToBottom(), 500);
      }
      setDay('');
      setWorkoutType('');
      setExercise('');
      setSets(['', '', '', '']);
      setNotes('');
    }
  };

  const deleteEntry = async (id: string) => {
    await deleteDoc(doc(db, "gymEntries", id));
    showToast('🗑️ Entry Deleted!');
    fetchEntries();
  };

  const downloadCSV = () => {
    const header = ["Date", "Day", "Workout Type", "Exercise", "Set 1", "Set 2", "Set 3", "Set 4", "Notes"];
    const rows = entries.map(e => [
      e.date, e.day, e.workoutType, e.exercise, e.sets[0], e.sets[1], e.sets[2], e.sets[3], e.notes
    ]);
    const csvContent = [header, ...rows]
      .map(row => row.map(value => `"${value}"`).join(","))
      .join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'gym_entries.csv');
    link.click();
    showToast('📥 CSV Downloaded!');
  };

  useEffect(() => {
    fetchEntries();
  }, []);

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

      {/* Header */}
      <h1 className="text-4xl font-extrabold text-center mb-8 text-indigo-400 tracking-tight">
        🏋️ Personal Workout Tracker
      </h1>
      <p className="text-center text-zinc-400 mb-10 text-sm">
        Log your sessions. Track your progress. Stay consistent. 💪
      </p>

      {/* Top Buttons */}
      <div className="flex flex-col md:flex-row justify-end mb-6 gap-2">
        <button onClick={downloadCSV} className="bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-2 rounded-lg shadow-md">
          📥 Download CSV
        </button>
      </div>

      {/* Entry Form */}
      <Card className="bg-zinc-800 border border-zinc-700">
        <CardContent className="space-y-6 p-6">
          <div>
            <label className="block font-medium mb-1 text-zinc-300">Select Date</label>
            <Input readOnly value={format(date, 'yyyy-MM-dd')} onClick={() => setShowCalendar(!showCalendar)} className="cursor-pointer bg-zinc-700 border-zinc-600 text-white" />
            {showCalendar && (
              <div className="mt-2 bg-white p-2 rounded-md shadow-md">
                <Calendar value={date} onChange={(d: any) => { setDate(d); setShowCalendar(false); }} />
              </div>
            )}
          </div>

          <div>
            <label className="block font-medium mb-1 text-zinc-300">Select Day</label>
            <Select onValueChange={setDay} value={day}>
              <SelectTrigger className="w-full bg-zinc-700 border-zinc-600 text-white">
                <SelectValue placeholder="Select Day" />
              </SelectTrigger>
              <SelectContent>
                {daysOfWeek.map((d) => (
                  <SelectItem key={d} value={d}>{d}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block font-medium mb-1 text-zinc-300">Workout Type</label>
            <Select onValueChange={(val) => { setWorkoutType(val); setExercise(''); }} value={workoutType}>
              <SelectTrigger className="w-full bg-zinc-700 border-zinc-600 text-white">
                <SelectValue placeholder="Select Workout Type" />
              </SelectTrigger>
              <SelectContent>
                {Object.keys(workoutOptions).map((type) => (
                  <SelectItem key={type} value={type}>{type}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {workoutType && (
            <div>
              <label className="block font-medium mb-1 text-zinc-300">Exercise</label>
              <Select onValueChange={setExercise} value={exercise}>
                <SelectTrigger className="w-full bg-zinc-700 border-zinc-600 text-white">
                  <SelectValue placeholder="Select Exercise" />
                </SelectTrigger>
                <SelectContent>
                  {workoutOptions[workoutType].map((ex) => (
                    <SelectItem key={ex} value={ex}>{ex}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {exercise && (
            <div className="grid grid-cols-2 gap-4">
              {[...Array(4)].map((_, i) => (
                <Input key={i} placeholder={`Set ${i + 1} (lbs x reps)`} value={sets[i]} onChange={(e) => {
                  const updated = [...sets];
                  updated[i] = e.target.value;
                  setSets(updated);
                }} className="bg-zinc-700 border-zinc-600 text-white" />
              ))}
            </div>
          )}

          <div>
            <label className="block font-medium mb-1 text-zinc-300">Notes</label>
            <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Any notes..." className="bg-zinc-700 border-zinc-600 text-white" />
          </div>

          <div className="flex justify-center">
            <button onClick={addEntry} className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-6 py-2 rounded-lg mt-4 shadow-md">
              Add Entry
            </button>
          </div>
        </CardContent>
      </Card>

      {/* Entries */}
      {loading ? (
        <div className="text-center mt-10 text-zinc-400">Loading entries...</div>
      ) : entries.length > 0 ? (
        <div className="mt-10 space-y-4">
          <h2 className="text-2xl font-bold text-indigo-400">Workout Entries</h2>
          <AnimatePresence>
            {entries.map((entry: any) => (
              <motion.div key={entry.id} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }} transition={{ duration: 0.3 }}>
                <Card className="bg-zinc-800 border border-zinc-700">
                  <CardContent className="p-4 text-zinc-200">
                    <div className="flex justify-between items-center">
                      <div className="text-lg font-semibold text-indigo-300">
                        {entry.date} - {entry.day}
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => deleteEntry(entry.id)} className="text-red-400 hover:text-red-600 text-sm">🗑️ Delete</button>
                      </div>
                    </div>
                    <div className="text-md">💪 Workout: <span className="text-white">{entry.workoutType}</span></div>
                    <div className="text-md">🏋️‍♂️ Exercise: <span className="text-white">{entry.exercise}</span></div>
                    <div className="text-sm mt-2 space-y-1">
                      {entry.sets.map((s: string, i: number) => (
                        <div key={i}>Set {i + 1}: <span className="text-white">{s || '-'}</span></div>
                      ))}
                    </div>
                    <div className="mt-2 text-zinc-400 text-sm">
                      📝 Notes: {entry.notes || 'None'}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
          <div ref={entriesEndRef} />
        </div>
      ) : (
        <div className="text-center text-zinc-400 mt-10">No entries yet. Start logging your workouts! 🏋️</div>
      )}

      {/* Footer */}
      <footer className="mt-16 text-center text-zinc-500 text-xs">
        © {new Date().getFullYear()} Gym Log Pro. Built with 💻, 🏋️‍♂️, and ☕.
      </footer>
    </div>
  );
}
