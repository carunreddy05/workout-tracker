
// src/pages/WorkoutDetail.tsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '@/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';

export default function WorkoutDetail() {
  const { dateDay } = useParams();
  const navigate = useNavigate();
  const [entry, setEntry] = useState<any | null>(null);

  useEffect(() => {
    const fetchEntry = async () => {
      const q = query(collection(db, 'gymEntries'), where('dateDay', '==', dateDay));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        setEntry(snapshot.docs[0].data());
      }
    };
    fetchEntry();
  }, [dateDay]);

  if (!entry) {
    return <div className="text-center text-zinc-400 mt-10">Loading workout details...</div>;
  }

  return (
    <div className="px-4 py-6 max-w-3xl mx-auto space-y-6">
      <button
        onClick={() => navigate('/')}
        className="text-sm text-indigo-400 hover:text-indigo-300 underline"
      >
        ← Back to Dashboard
      </button>

      <div className="bg-zinc-900 border border-zinc-700 p-4 rounded">
        <div className="text-indigo-300 font-bold text-lg mb-2">{entry.dateDay}</div>
        <div className="text-white font-semibold mb-2">💪 Workout Type: {entry.workoutType}</div>

        <table className="w-full text-sm text-left mt-3 border-collapse">
          <thead className="bg-indigo-700 text-white">
            <tr>
              <th className="px-3 py-2">Exercise</th>
              <th className="px-3 py-2 text-center">Set 1</th>
              <th className="px-3 py-2 text-center">Set 2</th>
              <th className="px-3 py-2 text-center">Set 3</th>
              <th className="px-3 py-2 text-center">Set 4</th>
            </tr>
          </thead>
          <tbody>
            {(entry.exercises || []).map((ex: any, i: number) => (
              <tr key={i} className="border-b border-zinc-800 text-white">
                <td className="px-3 py-2 font-medium">{ex.name}</td>
                {ex.sets.map((set: string, idx: number) => (
                  <td key={idx} className="px-2 py-2 text-center">{set ? `${set} lb` : '-'}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>

        {entry.cardio && (
          <div className="mt-4 bg-zinc-800 border border-pink-500 p-3 rounded text-sm text-pink-400">
            🏃 Cardio: Incline <span className="text-white">{entry.cardio.incline}</span>, Speed <span className="text-white">{entry.cardio.speed}</span> mph, Time <span className="text-white">{entry.cardio.time}</span> min
          </div>
        )}

        {entry.notes && (
          <div className="mt-3 text-sm bg-zinc-800 border border-zinc-600 text-zinc-300 p-3 rounded">
            📝 Notes: {entry.notes}
          </div>
        )}
      </div>
    </div>
  );
}
