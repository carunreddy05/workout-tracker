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

  const saveEdit = async (id: string, exercises: any[]) => {
    await updateDoc(doc(db, 'gymEntries', id), { exercises });
    setEntries(prev => prev.map(e => (e.id === id ? { ...e, exercises } : e)));
    setEditingId(null);
    setToast('✅ Entry updated');
    setTimeout(() => setToast(''), 2000);
  };

  const filteredEntries = entries.filter(entry => {
    const matchType = filterType === 'All' || entry.workoutType === filterType;
    const entryDate = new Date(entry.dateDay?.split(' - ')[0]);
    const withinRange = isAfter(entryDate, subDays(new Date(), filterDays));
    return matchType && withinRange;
  });

  return (
    <div className="space-y-8">
      {toast && (
        <div className="fixed top-4 right-4 bg-green-600 text-white px-4 py-2 rounded shadow z-50">
          {toast}
        </div>
      )}

      <BackHeader title="📝 Log Workout" />

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <label className="block text-sm text-zinc-400 mb-1">Filter by Type</label>
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
          <label className="block text-sm text-zinc-400 mb-1">Filter by Days</label>
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

      {/* Entries */}
      {filteredEntries.length === 0 ? (
        <div className="text-zinc-400 text-sm mt-4">No entries found.</div>
      ) : (
        <div className="space-y-4">
          {filteredEntries.map(entry => (
            <Card key={entry.id} className="bg-zinc-800 border border-zinc-700">
              <CardContent className="p-4 space-y-2">
                <div className="flex justify-between items-center">
                  <div className="text-lg font-semibold text-indigo-300">{entry.dateDay || '📅 Date Unknown'}</div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditingId(entry.id)}
                      className="text-green-400 hover:text-green-600 text-sm"
                    >
                      ✏️ Edit
                    </button>
                    <button
                      onClick={() => handleDelete(entry.id)}
                      className="text-red-400 hover:text-red-600 text-sm"
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>

                <div className="text-md">
                  💪 Workout: <span className="text-white">{entry.workoutType}</span>
                </div>

                {(entry.exercises || []).map((ex: any, idx: number) => (
                  <div key={idx} className="mt-1">
                    {editingId === entry.id ? (
                      <div className="space-y-1">
                        <Input
                          value={ex.name}
                          onChange={(e) => {
                            const updated = [...entry.exercises];
                            updated[idx].name = e.target.value;
                            setEntries(prev => prev.map(e => e.id === entry.id ? { ...e, exercises: updated } : e));
                          }}
                          className="bg-zinc-700 border-zinc-600 text-white"
                        />
                        {ex.sets.map((s: string, i: number) => (
                          <Input
                            key={i}
                            value={s}
                            onChange={(e) => {
                              const updated = [...entry.exercises];
                              updated[idx].sets[i] = e.target.value;
                              setEntries(prev => prev.map(e => e.id === entry.id ? { ...e, exercises: updated } : e));
                            }}
                            placeholder={`Set ${i + 1}`}
                            className="bg-zinc-700 border-zinc-600 text-white"
                          />
                        ))}
                      </div>
                    ) : (
                      <>
                        <div className="font-semibold text-white">{ex.name}</div>
                        <div className="text-sm text-zinc-400">
                          {ex.sets.map((s: string, i: number) => (
                            <div key={i}>Set {i + 1}: {s || '-'}</div>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                ))}

                {/* Notes */}
                <div className="mt-2 text-sm text-zinc-400">
                  📝 Notes:
                  <Input
                    className="mt-1 bg-zinc-700 border-zinc-600 text-white"
                    value={entry.notes}
                    onChange={(e) => handleNoteChange(entry.id, e.target.value)}
                  />
                </div>

                {editingId === entry.id && (
                  <button
                    onClick={() => saveEdit(entry.id, entry.exercises)}
                    className="mt-3 px-4 py-1 bg-indigo-600 hover:bg-indigo-700 rounded text-white text-sm"
                  >
                    💾 Save Changes
                  </button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
