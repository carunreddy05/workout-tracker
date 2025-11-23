// src/pages/Dashboard.tsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import '@/styles/calendar-custom.css';
import { db } from '@/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { format, subDays } from 'date-fns';
import WeightChart from '@/components/WeightChart';
import { Settings } from 'lucide-react';

interface WorkoutEntry {
  dateDay: string;
  workoutType: string;
  exercises?: { name: string; sets: string[] }[];
  cardio?: { incline?: string; speed?: string; time?: string };
  notes?: string;
}

type PeriodFilter = 'weekly' | 'monthly' | 'quarter' | 'all';

const periodLabels: Record<PeriodFilter, string> = {
  weekly: 'THIS WEEK',
  monthly: 'THIS MONTH',
  quarter: 'LAST 3 MONTHS',
  all: 'ALL TIME',
};

interface DashboardProps {
  userAvatarUrl?: string;
}

export default function Dashboard({ userAvatarUrl }: DashboardProps = {}) {
  const [entries, setEntries] = useState<WorkoutEntry[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [period, setPeriod] = useState<PeriodFilter>('weekly');
  const [avatarUrl, setAvatarUrl] = useState<string | undefined>(userAvatarUrl);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const snapshot = await getDocs(collection(db, 'gymEntries'));
      const loaded = snapshot.docs.map(doc => doc.data() as WorkoutEntry);
      setEntries(loaded);
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (userAvatarUrl) {
      setAvatarUrl(userAvatarUrl);
    }
  }, [userAvatarUrl]);

  useEffect(() => {
    if (!userAvatarUrl) {
      const saved = localStorage.getItem('dashboardAvatarUrl');
      if (saved) {
        setAvatarUrl(saved);
      }
    }
  }, [userAvatarUrl]);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setAvatarError(null);
    setIsUploadingAvatar(true);

    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      setAvatarUrl(result);
      localStorage.setItem('dashboardAvatarUrl', result);
      setIsUploadingAvatar(false);
      event.target.value = '';
    };
    reader.onerror = () => {
      setAvatarError('Unable to read that image. Please try a different file.');
      setIsUploadingAvatar(false);
      event.target.value = '';
    };
    reader.readAsDataURL(file);
  };

  const formatDateKey = (date: Date) => format(date, 'yyyy-MM-dd');

  const periodEntries = useMemo(() => {
    const now = new Date();
    const startDate = {
      weekly: subDays(now, 7),
      monthly: subDays(now, 30),
      quarter: subDays(now, 90),
      all: undefined,
    }[period];

    if (!startDate) return entries;

    return entries.filter(entry => {
      const entryDate = new Date(entry.dateDay?.split(' - ')[0]);
      return entryDate >= startDate;
    });
  }, [entries, period]);

  const calculateEntryVolume = (entry: WorkoutEntry) => {
    if (!entry.exercises?.length) return 0;

    return entry.exercises.reduce((total, exercise) => {
      const setsVolume = exercise.sets.reduce((setSum, setString) => {
        const normalized = setString?.trim();
        if (!normalized) return setSum;

        const match = normalized.match(/(\d+(?:\.\d+)?)\s*(?:x|×)\s*(\d+(?:\.\d+)?)/i);
        if (match) {
          const weight = parseFloat(match[1]);
          const reps = parseFloat(match[2]);
          return setSum + weight * reps;
        }

        const numbers = normalized.match(/\d+(?:\.\d+)?/g);
        if (numbers && numbers.length >= 2) {
          const weight = parseFloat(numbers[0]);
          const reps = parseFloat(numbers[1]);
          return setSum + weight * reps;
        }

        if (numbers && numbers.length === 1) {
          return setSum + parseFloat(numbers[0]);
        }

        return setSum;
      }, 0);

      return total + setsVolume;
    }, 0);
  };

  const totalVolume = useMemo(
    () => periodEntries.reduce((sum, entry) => sum + calculateEntryVolume(entry), 0),
    [periodEntries]
  );

  const totalWorkouts = periodEntries.length;
  const cardioDays = new Set(
    periodEntries
      .filter(e => e.cardio && (e.cardio.incline || e.cardio.speed || e.cardio.time))
      .map(e => e.dateDay?.split(' - ')[0])
  ).size;

  const activeStreak = useMemo(() => {
    if (!entries.length) return 0;
    const daySet = new Set(entries.map(e => e.dateDay?.split(' - ')[0]));
    let streak = 0;
    let cursor = new Date();

    while (daySet.has(formatDateKey(cursor))) {
      streak += 1;
      cursor = subDays(cursor, 1);
    }

    return streak;
  }, [entries]);

  const newPrs = periodEntries.filter(entry =>
    entry.notes?.toLowerCase().includes('pr')
  ).length;

  const getWorkoutInfo = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    return entries.find(e => e.dateDay?.startsWith(dateStr)) || null;
  };

  const weeklyVolumeData = useMemo(() => {
    const now = new Date();

    return Array.from({ length: 4 }).map((_, index) => {
      const blockIndex = 3 - index;
      const rangeEnd = subDays(now, blockIndex * 7);
      const rangeStart = subDays(rangeEnd, 6);

      const total = entries.reduce((sum, entry) => {
        const entryDate = new Date(entry.dateDay?.split(' - ')[0]);
        if (entryDate >= rangeStart && entryDate <= rangeEnd) {
          return sum + calculateEntryVolume(entry);
        }
        return sum;
      }, 0);

      return {
        label: `Wk ${index + 1}`,
        total: Math.round(total),
      };
    });
  }, [entries]);

  const volumeChange = useMemo(() => {
    const latest = weeklyVolumeData[3]?.total ?? 0;
    const previous = weeklyVolumeData[2]?.total ?? 0;
    if (previous === 0) return 0;
    return Math.round(((latest - previous) / previous) * 100);
  }, [weeklyVolumeData]);

  const muscleFocus = useMemo(() => {
    if (!periodEntries.length) return [];
    const focusMap = periodEntries.reduce<Record<string, number>>((acc, entry) => {
      const key = entry.workoutType?.split('/')[0]?.trim() || 'Other';
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    const total = Object.values(focusMap).reduce((sum, value) => sum + value, 0) || 1;
    const palette = ['#32CD5A', '#3B82F6', '#F472B6', '#FACC15', '#F97316'];

    return Object.entries(focusMap).map(([label, count], index) => ({
      label,
      value: Math.round((count / total) * 100),
      color: palette[index % palette.length],
    }));
  }, [periodEntries]);

  const focusGradient = useMemo(() => {
    if (!muscleFocus.length) {
      return 'radial-gradient(circle, rgba(50,205,90,0.25) 0%, rgba(5,17,8,1) 70%)';
    }

    let cumulative = 0;
    const segments = muscleFocus
      .map(item => {
        const start = cumulative;
        cumulative += item.value;
        return `${item.color} ${start}% ${cumulative}%`;
      })
      .join(', ');

    return `conic-gradient(${segments})`;
  }, [muscleFocus]);

  const workoutTypeBreakdown = useMemo(() => {
    if (!periodEntries.length) {
      return [
        { label: 'Strength', value: 0 },
        { label: 'Cardio', value: 0 },
        { label: 'HIIT', value: 0 },
      ];
    }

    let strength = 0;
    let cardio = 0;
    let hiit = 0;

    periodEntries.forEach(entry => {
      const type = entry.workoutType?.toLowerCase() || '';
      if (type.includes('hiit')) {
        hiit += 1;
        return;
      }

      if (entry.cardio && (entry.cardio.time || entry.cardio.speed || entry.cardio.incline)) {
        cardio += 1;
        return;
      }

      strength += 1;
    });

    const total = Math.max(strength + cardio + hiit, 1);

    return [
      { label: 'Strength', value: Math.round((strength / total) * 100) },
      { label: 'Cardio', value: Math.round((cardio / total) * 100) },
      { label: 'HIIT', value: Math.round((hiit / total) * 100) },
    ];
  }, [periodEntries]);

  const numberFormatter = new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 1,
  });

  const formattedVolume = totalVolume ? `${numberFormatter.format(totalVolume)} kg` : '0 kg';
  const maxVolume = Math.max(...weeklyVolumeData.map(week => week.total), 1);

  return (
    <div className="space-y-6 pb-20">
      <section className="rounded-[36px] border border-[#1e2025] bg-[#0b0c10] p-6 shadow-[0_20px_80px_rgba(0,0,0,0.6)]">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={handleAvatarClick}
              className="group relative h-14 w-14 overflow-hidden rounded-full border border-white/10 bg-gradient-to-br from-emerald-400/30 to-emerald-600/10 transition hover:border-emerald-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/60"
              aria-busy={isUploadingAvatar}
            >
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="User avatar"
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold uppercase tracking-widest text-emerald-100/80">
                  Add
                </span>
              )}
              {!isUploadingAvatar && (
                <span className="absolute inset-0 hidden items-center justify-center bg-black/40 text-[10px] font-semibold uppercase tracking-wider text-white group-hover:flex">
                  Change
                </span>
              )}
              {isUploadingAvatar && (
                <span className="absolute inset-0 flex items-center justify-center bg-black/70 text-[10px] font-semibold uppercase tracking-wider text-white">
                  Uploading…
                </span>
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleAvatarChange}
            />
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.55em] text-emerald-300">
                Your Progress
              </p>
              <h1 className="text-2xl font-semibold text-white">Hello, Carun</h1>
              <p className="text-sm text-zinc-400">Dialed in and consistent.</p>
            </div>
          </div>
          <button className="rounded-full border border-white/10 p-3 text-zinc-400 transition hover:text-white">
            <Settings className="h-5 w-5" />
          </button>
        </div>
        {avatarError && (
          <p className="mt-3 text-xs font-medium text-rose-400">{avatarError}</p>
        )}

        <div className="mt-6 grid grid-cols-4 gap-3">
          {([
            { label: 'Weekly', value: 'weekly' },
            { label: 'Monthly', value: 'monthly' },
            { label: '3 Months', value: 'quarter' },
            { label: 'All Time', value: 'all' },
          ] as { label: string; value: PeriodFilter }[]).map(option => (
            <button
              key={option.value}
              onClick={() => setPeriod(option.value)}
              className={[
                'w-full rounded-full border px-3 py-1.5 text-sm font-semibold transition',
                period === option.value
                  ? 'border-transparent bg-[#46d369] text-[#081604]'
                  : 'border-[#2b2d33] bg-[#15161a] text-zinc-400 hover:text-white',
              ].join(' ')}
            >
              {option.label}
            </button>
          ))}
        </div>

        <div className="mt-7 grid grid-cols-2 gap-4">
          {[
            { label: 'Total Workouts', value: totalWorkouts || 0, sub: periodLabels[period] },
            { label: 'Total Volume', value: formattedVolume, sub: periodLabels[period] },
            { label: 'Active Streak', value: `${activeStreak} days`, sub: 'ON FIRE' },
            { label: 'New PRs', value: newPrs, sub: 'LOGGED IN NOTES' },
          ].map(card => (
            <div
              key={card.label}
              className="space-y-1 rounded-[28px] border border-[#2b2d33] bg-[#141519] px-5 py-6"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-zinc-400">
                {card.label}
              </p>
              <p className="text-3xl font-bold text-white">{card.value}</p>
              <p className="text-[10px] font-semibold uppercase tracking-[0.45em] text-emerald-300">
                {card.sub}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-[28px] border border-[#1c1d21] bg-[#111216] p-5">
        <p className="text-sm font-semibold text-white">Muscle Group Focus</p>
        <div className="mt-6 flex items-center gap-6">
          <div className="relative h-32 w-32">
            <div
              className="h-full w-full rounded-full"
              style={{ background: focusGradient }}
            />
            <div className="absolute inset-4 rounded-full border border-[#1f2024] bg-[#0a0b0f]" />
            <div className="absolute inset-8 flex items-center justify-center rounded-full bg-black text-[10px] font-semibold uppercase tracking-widest text-emerald-200">
              Focus
            </div>
          </div>
          <div className="w-full space-y-3 text-sm">
            {(muscleFocus.length ? muscleFocus : [{ label: 'Log workouts', value: 0, color: '#4ade80' }]).map(segment => (
              <div key={segment.label} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="h-3 w-3 rounded-full" style={{ backgroundColor: segment.color }} />
                  <p className="text-white">{segment.label}</p>
                </div>
                <p className="text-xs text-zinc-400">{segment.value}%</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="rounded-[28px] border border-[#1c1d21] bg-[#111216] p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-white">Workout Type Breakdown</p>
            <p className="text-[10px] uppercase tracking-[0.4em] text-emerald-400">Balance the work</p>
          </div>
          <Link
            to="/entry"
            className="rounded-full border border-emerald-400/40 px-4 py-1 text-sm font-semibold text-emerald-300 hover:bg-emerald-400/10"
          >
            Start Session
          </Link>
        </div>
        <div className="mt-6 space-y-4">
          {workoutTypeBreakdown.map(item => (
            <div key={item.label}>
              <div className="flex items-center justify-between text-sm text-white">
                <span>{item.label}</span>
                <span className="text-emerald-300">{item.value}%</span>
              </div>
              <div className="mt-1 h-2 rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-lime-400"
                  style={{ width: `${item.value}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-[28px] border border-[#1c1d21] bg-[#111216] p-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.4em] text-emerald-400">
              Workout Volume Over Time
            </p>
            <p className="mt-2 text-4xl font-semibold text-white">{formattedVolume}</p>
            <p className="text-[10px] uppercase tracking-[0.3em] text-emerald-300/70">{periodLabels[period]}</p>
          </div>
          <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-sm font-semibold text-emerald-300">
            {volumeChange >= 0 ? `+${volumeChange}%` : `${volumeChange}%`}
          </span>
        </div>
        <div className="mt-6 grid grid-cols-4 gap-3">
          {weeklyVolumeData.map(week => (
            <div key={week.label} className="flex flex-col items-center gap-3">
              <div className="flex h-40 w-full items-end rounded-3xl bg-[#1b1c21] p-2">
                <div
                  className="w-full rounded-2xl bg-gradient-to-b from-lime-400/90 via-emerald-400 to-emerald-500/70 transition-[height]"
                  style={{ height: `${Math.max((week.total / maxVolume) * 100, 12)}%` }}
                />
              </div>
              <p className="text-xs uppercase tracking-wide text-zinc-400">{week.label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-[28px] border border-[#1c1d21] bg-[#111216] p-5 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.4em] text-emerald-300">Workout Calendar</p>
            <h3 className="text-2xl font-semibold text-white">Schedule & Highlights</h3>
          </div>
          <Link
            to="/history"
            className="rounded-full border border-white/10 px-4 py-1 text-sm text-zinc-300 hover:text-white"
          >
            View History
          </Link>
        </div>
        <div className="rounded-[24px] border border-[#1f2024] bg-[#09090d] p-4">
          <Calendar
            onChange={date => date && setSelectedDate(date as Date)}
            value={selectedDate}
            tileContent={({ date, view }) => {
              const workout = getWorkoutInfo(date);
              if (view === 'month' && workout) {
                const type = workout.workoutType?.split('/')[0].toLowerCase();
                const colorClass = `workout-indicator ${`workout-type-${type}`}`;
                const displayText = workout.workoutType?.split('/')[0];
                return (
                  <div className="relative h-full w-full">
                    <div className={colorClass}>{displayText}</div>
                  </div>
                );
              }
              return null;
            }}
          />
        </div>
      </section>

      <WeightChart entries={entries} />
    </div>
  );
}
