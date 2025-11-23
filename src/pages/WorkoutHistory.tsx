
// Styled table version with enhanced headers and workout type
import React, { useEffect, useMemo, useState } from 'react';
import { db } from '@/firebase';
import { collection, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { Card, CardContent } from '@/components/ui/card';
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
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

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

  // helpers to compute volume from sets like "100x10" or "100 @ 10" or "100 10"
  const parseSet = (raw: string): { w: number; r: number } => {
    if (!raw) return { w: 0, r: 0 };
    const cleaned = String(raw).replace(/\s+/g, '');
    const atParts = cleaned.split('@');
    if (atParts.length === 2) {
      const w = parseFloat(atParts[0]) || 0;
      const r = parseFloat(atParts[1]) || 0;
      return { w, r };
    }
    const m = cleaned.match(/(\d+(?:\.\d+)?)[x×]?(\d+(?:\.\d+)?)/i);
    if (m) {
      return { w: parseFloat(m[1]) || 0, r: parseFloat(m[2]) || 0 };
    }
    const nums = cleaned.match(/\d+(?:\.\d+)?/g) || [];
    if (nums.length >= 2) return { w: parseFloat(nums[0]) || 0, r: parseFloat(nums[1]) || 0 };
    if (nums.length === 1) return { w: parseFloat(nums[0]) || 0, r: 0 };
    return { w: 0, r: 0 };
  };

  const calcVolume = (entry: any) => {
    if (!entry?.exercises?.length) return 0;
    return entry.exercises.reduce((sum: number, ex: any) => {
      return (
        sum +
        ex.sets.reduce((s: number, raw: string) => {
          const { w, r } = parseSet(raw);
          return s + (w * r || 0);
        }, 0)
      );
    }, 0);
  };

  const formatDate = (dateDay: string) => {
    const raw = dateDay?.split(' - ')[0];
    const d = raw ? new Date(raw) : new Date();
    return format(d, 'MMM dd, yyyy');
  };

  return (
    <div className="space-y-8 px-2 sm:px-4 pb-10">
      {toast && (
        <div className="fixed top-4 right-4 bg-green-600 text-white px-4 py-2 rounded shadow z-50">
          {toast}
        </div>
      )}

      <BackHeader title="📋 Workout History" showHome={false} titleClassName="text-indigo-400" />

      <div className="flex flex-wrap gap-3">
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="rounded-full border border-white/10 bg-[#111216] px-4 py-2 text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-[#0b0c10] text-white">
            {workoutOptions.map(type => (
              <SelectItem key={type} value={type}>{type}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={String(filterDays)} onValueChange={d => setFilterDays(Number(d))}>
          <SelectTrigger className="rounded-full border border-white/10 bg-[#111216] px-4 py-2 text-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-[#0b0c10] text-white">
            {[7, 14, 30, 90].map(days => (
              <SelectItem key={days} value={String(days)}>{`Last ${days} days`}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {filteredEntries.length === 0 ? (
        <div className="text-zinc-400 text-sm mt-4">No entries found.</div>
      ) : (
        <div className="space-y-5">
          {filteredEntries.map(entry => {
            const vol = calcVolume(entry);
            const minutes = entry.cardio?.time || '—';
            const isOpen = !!expanded[entry.id];
            return (
              <Card key={entry.id} className="rounded-[24px] border border-emerald-500/10 bg-[#0b0f0d] p-0 shadow-[0_20px_60px_rgba(0,0,0,0.45)]">
                <CardContent className="p-0">
                  <div className="px-4 py-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-semibold text-emerald-300">{formatDate(entry.dateDay)}</p>
                        <h3 className="text-xl font-semibold text-white">{entry.workoutType || 'Workout'}</h3>
                      </div>
                      <div className="flex items-center justify-center rounded-full bg-emerald-500/20 p-2 text-emerald-300">✓</div>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-6 text-sm text-zinc-300">
                      <div className="flex items-center gap-2"><span>⏱️</span><span>{minutes} mins</span></div>
                      <div className="flex items-center gap-2"><span>🏋️</span><span>{vol.toLocaleString()} kg</span></div>
                    </div>
                  </div>
                  <div className="border-t border-white/5 px-4 py-3">
                    <button
                      className="flex w-full items-center justify-between text-left text-white"
                      onClick={() => setExpanded(prev => ({ ...prev, [entry.id]: !isOpen }))}
                    >
                      <span className="font-semibold">Exercises</span>
                      <span className="text-zinc-400">{isOpen ? '▴' : '▾'}</span>
                    </button>
                    {isOpen && (
                      <div className="mt-3 space-y-2 text-sm">
                        {(editingId === entry.id ? entry.exercises : entry.exercises)?.map((ex: any, i: number) => (
                          <div key={i} className="rounded-2xl border border-white/10 bg-[#0f1311] p-3">
                            <div className="font-medium text-white">{ex.name}</div>
                            {editingId === entry.id ? (
                              <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                                {ex.sets.map((s: string, j: number) => (
                                  <input
                                    key={j}
                                    defaultValue={s}
                                    onChange={(e) => {
                                      const next = entries.map(en => ({ ...en }));
                                      const target = next.find(en => en.id === entry.id);
                                      if (!target) return;
                                      target.exercises[i].sets[j] = e.target.value;
                                      setEntries(next);
                                    }}
                                    className="rounded-lg border border-white/10 bg-[#0b0c10] px-3 py-1.5 text-white"
                                  />
                                ))}
                              </div>
                            ) : (
                              <div className="mt-2 grid grid-cols-2 gap-2 text-zinc-300 sm:grid-cols-4">
                                {ex.sets.map((s: string, j: number) => (
                                  <div key={j} className="rounded-lg border border-white/10 px-3 py-1.5 text-center">
                                    {s || '—'}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  {entry.notes && (
                    <div className="border-t border-white/5 px-4 py-3 text-xs text-zinc-400">📝 {entry.notes}</div>
                  )}
                  <div className="border-t border-white/5 px-4 py-3 text-right text-xs">
                    {editingId === entry.id ? (
                      <>
                        <button
                          onClick={async () => {
                            await updateDoc(doc(db, 'gymEntries', entry.id), {
                              exercises: entries.find(e => e.id === entry.id)?.exercises || entry.exercises,
                            });
                            setEditingId(null);
                          }}
                          className="mr-3 rounded-full border border-emerald-400/40 px-3 py-1 text-emerald-300 hover:bg-emerald-400/10"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="mr-3 rounded-full border border-white/10 px-3 py-1 text-zinc-300 hover:text-white"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => {
                          setEditingId(entry.id);
                          setExpanded(prev => ({ ...prev, [entry.id]: true }));
                        }}
                        className="mr-3 text-emerald-300 hover:text-emerald-200"
                      >
                        Edit
                      </button>
                    )}
                    <button onClick={() => handleDelete(entry.id)} className="text-rose-400 hover:text-rose-300">Delete</button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
