
// src/pages/Dashboard.tsx
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import '@/styles/calendar-custom.css';
import { db } from '@/firebase';
import { collection, getDocs } from 'firebase/firestore';
import WeekdayChart from '@/components/WeekdayChart';
import KpiCard from '@/components/KpiCard';
import { format } from 'date-fns';
import Slider from 'react-slick';
import WeightChart from '@/components/WeightChart';

interface WorkoutEntry {
  dateDay: string;
  workoutType: string;
  exercises?: { name: string; sets: string[] }[];
  cardio?: { incline?: string; speed?: string; time?: string };
  notes?: string;
}

const quotes = [
  "The only bad workout is the one that didn't happen.",
  "No pain, no gain.",
  "Push yourself, because no one else is going to do it for you.",
  "The body achieves what the mind believes.",
  "Success starts with self-discipline.",
  "Don't wish for a good body, work for it.",
  "It never gets easier, you just get stronger.",
  "Excuses don't burn calories.",
  "A one hour workout is 4% of your day. No excuses."
];

export default function Dashboard() {
  const [entries, setEntries] = useState<WorkoutEntry[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [randomQuote, setRandomQuote] = useState('');

  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      const snapshot = await getDocs(collection(db, 'gymEntries'));
      const loaded = snapshot.docs.map(doc => doc.data() as WorkoutEntry);
      setEntries(loaded);
    };
    fetchData();
    const today = format(new Date(), 'yyyy-MM-dd');
    const dailyIndex = today
      .split('')
      .reduce((acc, char) => acc + char.charCodeAt(0), 0) % quotes.length;
  
    setRandomQuote(quotes[dailyIndex]);
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

  const handleDateClick = (date: Date) => {
    const match = getWorkoutInfo(date);
    if (match) {
      navigate(`/details/${match.dateDay}`);
    }
  };

  const selectedWorkout = getWorkoutInfo(selectedDate);

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="mt-4 space-y-1">
        <h1 className="text-xl sm:text-2xl font-medium text-white">Welcome back, <span className="font-semibold">Carun</span>!</h1>
      </div>

      {/* Add Workout Button */}
      <Link 
        to="/entry" 
        className="block w-full bg-[#00ff00] hover:bg-[#00ff00]/90 text-black font-semibold text-lg rounded-2xl py-4 px-6 text-center transition-colors relative overflow-hidden"
        style={{ 
          boxShadow: '0 0 30px rgba(0,255,0,0.3)',
          textShadow: '0 0 5px rgba(255,255,255,0.3)'
        }}
      >
        <span className="relative z-10 flex items-center justify-center gap-2">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
          Add Workout
        </span>
      </Link>
    
      {/* Quote Section */}
      <div className="w-full max-w-4xl mx-auto px-4 bg-black/90 rounded-[28px] mb-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-[#00ff00]/5" />
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'linear-gradient(90deg, rgba(0,255,0,0.05) 0%, rgba(0,255,0,0.02) 50%, transparent 100%)',
            boxShadow: '0 0 40px rgba(0,255,0,0.15), inset 0 0 20px rgba(0,255,0,0.1)'
          }}
        />
        <Slider
          autoplay
          infinite
          dots={false}
          speed={800}
          autoplaySpeed={8000}
          arrows={false}
          className="py-6"
        >
          {quotes.map((quote, index) => (
            <div key={index} className="px-4">
              <p 
                className="text-xl sm:text-2xl font-semibold text-[#00ff00] tracking-wide" 
                style={{ textShadow: '0 0 20px rgba(0,255,0,0.5)' }}
              >
                "{quote}"
              </p>
            </div>
          ))}
        </Slider>
      </div>

      {/* KPI Cards */}
      <div className="w-full max-w-7xl mx-auto bg-transparent rounded-[28px] p-4 mb-8 flex flex-col items-center justify-center py-8">
        <div className="grid grid-cols-3 gap-8 sm:gap-12 lg:gap-16 mb-0 items-stretch justify-items-stretch">
          <div className="flex items-stretch">
            <KpiCard
              title="Days logged"
              value={stats.days.size}
              layout="square"
            />
          </div>

          <div className="flex items-stretch">
            <KpiCard
              title="Workouts"
              value={stats.total}
              layout="square"
            />
          </div>

          <div className="flex items-stretch">
            <KpiCard
              title="Cardio days"
              value={stats.cardioDays.size}
              layout="square"
            />
          </div>
        </div>
      </div>



      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
      <div className="space-y-4">
        <Link
          to="/entry"
          className="bg-gradient-to-br from-indigo-600 to-indigo-800 p-6 rounded-xl shadow-lg hover:brightness-110 transition block border border-indigo-400"
        >
          <h3 className="text-lg font-bold mb-2 text-white">📝 Add Workout</h3>
          <p className="text-sm text-indigo-100">Log today’s workout and sets.</p>
        </Link>

        <Link
          to="/gann"
          className="bg-gradient-to-br from-pink-600 to-pink-800 p-6 rounded-xl shadow-lg hover:brightness-110 transition block border border-pink-400"
        >
          <h3 className="text-lg font-bold mb-2 text-white">GANN THEORY NUMBERS</h3>
          <p className="text-sm text-pink-100">Quickly generate GANN numbers from a stock price.</p>
        </Link>

        <Link
          to="/history"
          className="bg-zinc-800 p-6 rounded-xl shadow-md hover:bg-zinc-700 transition block border border-zinc-600"
        >
          <h3 className="text-lg font-bold mb-2 text-white">📂 Workout History</h3>
          <p className="text-sm text-zinc-400">View, edit, or delete your workout log.</p>
        </Link>
      </div>


        <div className="w-full">
          <h3 className="text-lg font-bold text-indigo-300 mb-2">📅 Workout Calendar</h3>
          <div className="bg-zinc-900 p-4 rounded-lg shadow-md w-full max-w-full">
            <Calendar
              onChange={(value: any) => handleDateClick(value as Date)}
              value={selectedDate}
              tileContent={({ date, view }) =>
                view === 'month' && getWorkoutInfo(date) ? (
                  <div className="mt-1 px-1">
                    <div className="bg-green-600 text-white text-[10px] px-1 py-[6px] rounded font-semibold whitespace-normal break-words text-center leading-tight min-h-[28px]">
                      {getWorkoutInfo(date)?.workoutType}
                    </div>
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

        <div className="mt-6">
          <WeightChart entries={entries} />
      </div>
      </div>
    </div>
  );
}

