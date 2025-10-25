
// src/pages/Dashboard.tsx
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import '@/styles/calendar-custom.css';
import { db } from '@/firebase';
import { collection, getDocs } from 'firebase/firestore';
import WeekdayChart from '@/components/WeekdayChart';
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
  "Train insane or remain the same.",
  "No pain, no gain.",
  "Push yourself, because no one else is going to do it for you.",
  "The body achieves what the mind believes.",
  "Sweat is fat crying.",
  "Success starts with self-discipline.",
  "Don’t wish for a good body. Work for it.",
  "It never gets easier, you just get stronger.",
  "Excuses don’t burn calories.",
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
    <div className="space-y-8">

       {/* Welcome & Heading Section */}
    <div className="mt-4 space-y-1 text-center sm:text-left">
      <h1 className="text-lg sm:text-xl font-medium text-amber-300">👋 Welcome back, <span className="font-semibold text-white">Carun</span>!</h1>
      {/* <h1 className="text-3xl font-extrabold text-indigo-400 mt-1 tracking-tight">🏠 Dashboard</h1> */}
    </div>
    
       {/* 🔥 Random Workout Quote */}
       <div className="w-full max-w-xl mx-auto px-2 bg-gradient-to-r from-indigo-700 via-purple-700 to-pink-600 rounded-lg p-4 shadow-md text-center mb-4">
        <Slider
          autoplay
          infinite
          dots
          speed={600}
          autoplaySpeed={6000}
          arrows={false}
        >
          {quotes.map((quote, index) => (
            <div key={index}>
              <p className="text-lg font-semibold italic text-white">{`"${quote}"`}</p>
            </div>
          ))}
        </Slider>
      </div>

   
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="flex items-center gap-2 bg-gradient-to-r from-zinc-800 via-zinc-700 to-zinc-800 border border-zinc-600 rounded-full px-4 py-2 text-sm text-white shadow hover:scale-[1.03] transition">
          📅 <span className="font-semibold">{stats.days.size}</span>
          <span className="text-zinc-300">days logged</span>
        </div>
        
        <div className="flex items-center gap-2 bg-gradient-to-r from-green-700 via-emerald-600 to-green-700 border border-green-600 rounded-full px-4 py-2 text-sm text-white shadow hover:scale-[1.03] transition">
          🏋️ <span className="font-semibold">{stats.total}</span>
          <span className="text-emerald-100">workouts</span>
        </div>
        
        <div className="flex items-center gap-2 bg-gradient-to-r from-pink-700 via-fuchsia-600 to-pink-700 border border-pink-600 rounded-full px-4 py-2 text-sm text-white shadow hover:scale-[1.03] transition">
          🏃 <span className="font-semibold">{stats.cardioDays.size}</span>
          <span className="text-pink-100">cardio days</span>
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
          <h3 className="text-lg font-bold mb-2 text-white">🔢 GANN numbers</h3>
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
              onChange={handleDateClick}
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

