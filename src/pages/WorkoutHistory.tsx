
// Styled table version with enhanced headers and workout type
import React, { useEffect, useState } from 'react';
import { db } from '@/firebase';
import { collection, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format, isAfter, subDays } from 'date-fns';
import BackHeader from '@/components/BackHeader';

const workoutOptions = ['All', 'Chest/Triceps', 'Back/Biceps', 'Shoulders', 'Legs', 'Core'];

export default function WorkoutHistory() {
  const [entries, setEntries] = useState<any[]>([]);
  const [filterType, setFilterType] = useState('All');
  const [filterDays, setFilterDays] = useState(30);
  const [toast, setToast] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    const fetchEntries = async () => {
      const snapshot = await getDocs(collection(db, 'gymEntries'));
      const data = snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data(),
      }));
      setEntries(data);
    };
    fetchEntries();
  }, []);

  const handleDelete = async (id: string) => {
    await deleteDoc(doc(db, 'gymEntries', id));
    setEntries(prev => prev.filter(e => e.id !== id));
    setToast('🗑️ Entry deleted');
    setTimeout(() => setToast(''), 2000);
  };

  const handleNoteChange = async (id: string, newNote: string) => {
    await updateDoc(doc(db, 'gymEntries', id), { notes: newNote });
    setEntries(prev =>
      prev.map(e => (e.id === id ? { ...e, notes: newNote } : e))
    );
  };

  const filteredEntries = entries.filter(entry => {
    const matchType = filterType === 'All' || entry.workoutType === filterType;
    const entryDate = new Date(entry.dateDay?.split(' - ')[0]);
    const withinRange = isAfter(entryDate, subDays(new Date(), filterDays));
    return matchType && withinRange;
  });

  return (
    <div className="space-y-8 px-2 sm:px-4 pb-10">
      {toast && (
        <div className="fixed top-4 right-4 bg-green-600 text-white px-4 py-2 rounded shadow z-50">
          {toast}
        </div>
      )}

      <BackHeader title="📋 Workout History" />

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <label className="text-sm text-zinc-400">Filter by Type</label>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {workoutOptions.map(type => (
                <SelectItem key={type} value={type}>{type}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex-1">
          <label className="text-sm text-zinc-400">Filter by Days</label>
          <Select value={String(filterDays)} onValueChange={d => setFilterDays(Number(d))}>
            <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[7, 14, 30, 90].map(days => (
                <SelectItem key={days} value={String(days)}>{`Last ${days} days`}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {filteredEntries.length === 0 ? (
        <div className="text-zinc-400 text-sm mt-4">No entries found.</div>
      ) : (
        <div className="space-y-6">
          {filteredEntries.map(entry => (
            <Card key={entry.id} className="bg-zinc-900 border border-zinc-700 px-4 py-4 space-y-3">
              <CardContent className="p-0 space-y-3">
                <div className="flex justify-between items-start flex-wrap gap-2">
                  <div className="text-indigo-400 font-bold text-sm">
                    📅 {entry.dateDay}
                  </div>
                  <div className="flex gap-3 text-sm">
                    <button onClick={() => setEditingId(entry.id)} className="text-green-400 hover:text-green-600">✏️ Edit</button>
                    <button onClick={() => handleDelete(entry.id)} className="text-red-400 hover:text-red-600">🗑️ Delete</button>
                  </div>
                </div>

                <div className="text-base text-indigo-300 font-bold border-b border-zinc-600 pb-1">
                  💪 {entry.workoutType}
                </div>

                <div className="overflow-auto text-sm text-white">
                <table className="w-full text-sm text-left mt-3 border-collapse">
                  <thead>
                    <tr className="bg-indigo-700 text-white">
                      <th className="px-3 py-2">Exercise</th>
                      <th className="px-3 py-2 text-center">Set 1</th>
                      <th className="px-3 py-2 text-center">Set 2</th>
                      <th className="px-3 py-2 text-center">Set 3</th>
                      <th className="px-3 py-2 text-center">Set 4</th>
                    </tr>
                  </thead>
                  <tbody className="text-white">
                    {entry.exercises.map((ex, idx) => (
                      <tr key={idx} className="border-t border-zinc-600">
                        <td className="px-3 py-2">{ex.name}</td>
                        {ex.sets.map((set, i) => (
                          <td key={i} className="px-2 py-2 text-center">{set ? `${set} lb` : '-'}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>

                </div>

                {entry.cardio && (
                  <div className="text-sm bg-zinc-800 border border-pink-500 rounded-md p-2">
                    <div className="text-pink-400 font-semibold mb-1">🏃 Cardio</div>
                    <div className="text-zinc-300 text-xs">
                      Incline: {entry.cardio.incline || '-'} | Speed: {entry.cardio.speed || '-'} mph | Time: {entry.cardio.time || '-'} min
                    </div>
                  </div>
                )}

                {entry.notes && (
                  <div className="text-xs text-zinc-400 bg-zinc-800 border border-zinc-700 rounded-md px-3 py-2">
                    📝 <span className="text-zinc-300">{entry.notes}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
