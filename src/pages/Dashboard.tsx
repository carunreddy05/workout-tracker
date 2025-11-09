// src/pages/Dashboard.tsx
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import '@/styles/calendar-custom.css';
import { db } from '@/firebase';
import { collection, getDocs } from 'firebase/firestore';
import KpiCard from '@/components/KpiCard';
import { format } from 'date-fns';
import WeekdayChart from '@/components/WeekdayChart';
import WeightChart from '@/components/WeightChart';

interface WorkoutEntry {
  dateDay: string;
  workoutType: string;
  exercises?: { name: string; sets: string[] }[];
  cardio?: { incline?: string; speed?: string; time?: string };
  notes?: string;
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
        if (e.cardio && (e.cardio.incline || e.cardio.speed || e.cardio.time)) {
          acc.cardioDays.add(date.toDateString());
        }
      }
      return acc;
    },
    {
      total: 0,
      days: new Set<string>(),
      cardioDays: new Set<string>(),
    }
  );

  const getWorkoutInfo = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return entries.find(e => e.dateDay?.startsWith(dateStr)) || null;
  };

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="mt-4">
        <h1 className="text-2xl font-medium text-white mb-6">Welcome back, <span className="font-semibold">Carun</span>!</h1>
      </div>
    
      {/* Quote Section */}
      <div className="w-full px-4 py-6 bg-[#121212] rounded-[24px] relative overflow-hidden border border-[#00ff00]/20">
        <div className="absolute inset-0 bg-gradient-to-b from-[#00ff00]/10 to-transparent opacity-50" />
        <p className="relative z-10 text-[#00ff00] text-xl font-medium text-center">
          "A one hour workout is 4% of your day. No excuses."
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-3 gap-4">
        <KpiCard
          title="Days logged"
          value={stats.days.size}
          layout="square"
        />
        <KpiCard
          title="Workouts"
          value={stats.total}
          layout="square"
        />
        <KpiCard
          title="Cardio days"
          value={stats.cardioDays.size}
          layout="square"
        />
      </div>

      {/* Add Workout Button */}
      <Link 
        to="/entry" 
        className="block w-full bg-[#00ff00] hover:bg-[#00ff00]/90 text-black font-semibold text-lg rounded-[24px] py-4 px-6 text-center transition-colors relative overflow-hidden"
        style={{ 
          boxShadow: '0 0 30px rgba(0,255,0,0.3)',
        }}
      >
        <span className="relative z-10 flex items-center justify-center gap-2">
          + Add Workout
        </span>
      </Link>

      {/* Calendar Section */}
      <div>
        <h3 className="text-2xl font-medium text-[#A5B4FC] mb-4">Workout Calendar</h3>
        <div className="bg-[#0B0B0F] p-4 rounded-[24px] w-full max-w-full">
          <Calendar
            onChange={(date) => date && setSelectedDate(date as Date)}
            value={selectedDate}
            tileContent={({ date, view }) => {
              const workout = getWorkoutInfo(date);
              if (view === 'month' && workout) {
                const type = workout.workoutType?.split('/')[0].toLowerCase();
                const colorClass = `workout-type-${type}`;
                const displayText = workout.workoutType?.split('/')[0];
                return (
                  <div className="h-full w-full relative">
                    <div className={`workout-indicator ${colorClass}`}>
                      {displayText}
                    </div>
                  </div>
                );
              }
              return null;
            }}
          />
        </div>
      </div>

      {/* Workout History Link */}
      <Link
        to="/history"
        className="flex items-center justify-between p-4 bg-zinc-900 rounded-[24px] text-white hover:bg-zinc-800 transition"
      >
        <div className="flex items-center gap-3">
          <span className="text-lg">📋</span>
          <div>
            <h3 className="text-base font-medium">Workout History</h3>
            <p className="text-sm text-zinc-400">View your completed workouts</p>
          </div>
        </div>
        <span className="text-zinc-400">→</span>
      </Link>

      {/* Weight Chart */}
      <div className="mt-6">
        <WeightChart entries={entries} />
      </div>
    </div>
  );
}