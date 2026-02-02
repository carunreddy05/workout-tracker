import React, { useState } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { subDays, format } from 'date-fns';
import { db } from '@/firebase';
import { useAuth } from '@/lib/auth';

const WORKOUT_TYPES = [
  'Chest/Triceps',
  'Back/Biceps',
  'Shoulders',
  'Legs',
  'Core',
];

const DAYS_BACK = 90;

export default function SeedDebug() {
  const { user } = useAuth();
  const [seeding, setSeeding] = useState(false);
  const [created, setCreated] = useState(0);
  const [error, setError] = useState<string | null>(null);

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 text-zinc-100">
        <p className="text-sm text-zinc-400">Log in to seed test data.</p>
      </div>
    );
  }

  const handleSeed = async () => {
    setSeeding(true);
    setCreated(0);
    setError(null);

    try {
      const today = new Date();
      let count = 0;

      for (let i = 0; i < DAYS_BACK; i += 1) {
        // Roughly every other day
        if (Math.random() < 0.5) continue;

        const date = subDays(today, i);
        const yyyyMmDd = format(date, 'yyyy-MM-dd');
        const dayName = format(date, 'EEEE');

        const workoutType =
          WORKOUT_TYPES[Math.floor(Math.random() * WORKOUT_TYPES.length)];

        const baseWeight = 70 + Math.floor(Math.random() * 8);

        const entry = {
          userId: user.uid,
          dateDay: `${yyyyMmDd} - ${dayName}`,
          workoutType,
          weight: baseWeight,
          exercises: [
            {
              name: 'Bench Press',
              sets: ['80@10', '85@8', '90@6'],
            },
            {
              name: 'Lat Pulldown',
              sets: ['55@12', '60@10', '60@8'],
            },
          ],
          cardio: {
            incline: '2%',
            speed: '5',
            time: '10',
          },
          notes: 'Seeded workout for testing.',
        };

        await addDoc(collection(db, 'gymEntries'), entry);
        count += 1;
        setCreated(count);
      }
    } catch (e) {
      console.error(e);
      setError('Unable to seed entries. Check console for details.');
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4 text-zinc-100">
      <div className="w-full max-w-sm rounded-3xl border border-emerald-500/30 bg-[#05090a] p-6 shadow-[0_24px_80px_rgba(0,0,0,0.85)]">
        <h1 className="text-lg font-semibold text-white">Seed Test Data</h1>
        <p className="mt-1 text-xs text-zinc-400">
          Creates random workout entries for the last 3 months for your current
          account.
        </p>
        <p className="mt-1 text-xs text-emerald-300/80">
          Current user: <span className="font-mono">{user.email || user.uid}</span>
        </p>

        <button
          type="button"
          onClick={handleSeed}
          disabled={seeding}
          className="mt-5 flex w-full items-center justify-center rounded-2xl bg-gradient-to-r from-emerald-400 to-lime-400 py-2.5 text-sm font-semibold text-emerald-950 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {seeding ? 'Seeding…' : 'Seed last 3 months'}
        </button>

        <p className="mt-3 text-xs text-emerald-200">
          Created entries: <span className="font-semibold">{created}</span>
        </p>

        {error && (
          <p className="mt-2 rounded-xl border border-rose-500/40 bg-rose-950/40 px-3 py-2 text-xs text-rose-200">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}

