// src/pages/Dashboard.tsx
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import '@/styles/calendar-custom.css'; // optional for styling tweaks
import { db } from '@/firebase';
import { collection, getDocs } from 'firebase/firestore';
import WeekdayChart from '@/components/WeekdayChart';

interface WorkoutEntry {
  dateDay: string; // e.g., "2025-04-29 - Tuesday"
  workoutType: string;
  exercises?: { name: string; sets: string[] }[];
}

export default function Dashboard() {
  const [entries, setEntries] = useState<WorkoutEntry[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    const fetchData = async () => {
      const snapshot = await getDocs(collection(db, 'gymEntries'));
      const loaded = snapshot.docs.map(doc => doc.data() as WorkoutEntry);
      setEntries(loaded);
    };
    fetchData();
  }, []);

  const currentMonth = new Date().getMonth();
    const stats = entries.reduce(
    (acc, e) => {
        const date = new Date(e.dateDay?.split(' - ')[0]);
        if (date.getMonth() === currentMonth) {
        acc.total++;
        acc.days.add(date.toDateString());
        }
        return acc;
    },
    { total: 0, days: new Set<string>() }
    );

  const getWorkoutInfo = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    const entry = entries.find(e => e.dateDay?.startsWith(dateStr));
    if (!entry) return null;

    return {
      type: entry.workoutType,
      exercises: entry.exercises?.map(e => e.name) || [],
    };
  };

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-indigo-400">🏠 Dashboard</h2>
      <div className="bg-zinc-800 border border-zinc-700 p-4 rounded-md text-sm text-zinc-300 mb-4">
    📆  <span className="text-white font-medium">{stats.days.size}</span> days logged this month · 🏋️‍♂️ <span className="text-white font-medium">{stats.total}</span> workouts
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Quick Access Cards */}
        <div className="space-y-4">
          <Link
            to="/entry"
            className="bg-zinc-800 p-6 rounded-lg shadow-md hover:bg-zinc-700 transition block"
          >
            <h3 className="text-lg font-bold mb-2 text-white">📝 Add Workout</h3>
            <p className="text-sm text-zinc-400">Log today’s workout and sets.</p>
          </Link>

          <Link
            to="/history"
            className="bg-zinc-800 p-6 rounded-lg shadow-md hover:bg-zinc-700 transition block"
          >
            <h3 className="text-lg font-bold mb-2 text-white">📂 Workout History</h3>
            <p className="text-sm text-zinc-400">View, edit, or delete your workout log.</p>
          </Link>
        </div>

        {/* Full Width Calendar */}
        <div className="w-full">
          <h3 className="text-lg font-bold text-indigo-300 mb-2">📅 Workout Calendar</h3>
          <div className="bg-zinc-900 p-4 rounded-lg shadow-md w-full max-w-full">

          <Calendar
            onChange={setSelectedDate}
            value={selectedDate}
            tileContent={({ date, view }) =>
              view === 'month' ? (
                <div className="mt-1 text-center text-white text-[11px] leading-tight space-y-1 px-1">
                  {getWorkoutInfo(date) && (
                    <>
                      <div className="bg-indigo-600 text-white text-[10px] px-1 py-[1px] rounded font-semibold">
                        {getWorkoutInfo(date)?.type}
                      </div>
                      {getWorkoutInfo(date)?.exercises?.slice(0, 2).map((ex, i) => (
                        <div key={i} className="text-[10px] truncate text-zinc-300">
                          {ex}
                        </div>
                      ))}
                    </>
                  )}
                </div>
              ) : null
            }
            tileClassName={({ date }) =>
              getWorkoutInfo(date) ? 'bg-zinc-900 rounded-xl border border-indigo-500' : ''
            }
          />
        </div>

        <WeekdayChart entries={entries} />



        </div>
      </div>
    </div>
  );
}
