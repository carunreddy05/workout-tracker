
// Styled table version with enhanced headers and workout type
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { db } from '@/firebase';
import { collection, getDocs, deleteDoc, doc, setDoc, updateDoc, query, where } from 'firebase/firestore';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { format, isAfter, subDays } from 'date-fns';
import BackHeader from '@/components/BackHeader';
import { useAuth } from '@/lib/auth';

const workoutOptions = ['All', 'Chest/Triceps', 'Back/Biceps', 'Shoulders', 'Legs', 'Core'];

export default function WorkoutHistory() {
  const [entries, setEntries] = useState<any[]>([]);
  const [filterType, setFilterType] = useState('All');
  const [filterDays, setFilterDays] = useState(30); // 0 = all time
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [lastDeletedEntry, setLastDeletedEntry] = useState<any | null>(null);
  const [showUndoBar, setShowUndoBar] = useState(false);
  const undoTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      setEntries([]);
      return;
    }

    const fetchEntries = async () => {
      const gymEntriesRef = collection(db, 'gymEntries');
      const userQuery = query(gymEntriesRef, where('userId', '==', user.uid));
      const snapshot = await getDocs(userQuery);
      const data = snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data(),
      }));
      setEntries(data);
    };
    fetchEntries();
  }, [user]);

  useEffect(() => {
    return () => {
      if (undoTimeoutRef.current) {
        clearTimeout(undoTimeoutRef.current);
      }
    };
  }, []);

  const handleDeleteConfirmed = async () => {
    if (!confirmDeleteId) return;
    const entryToDelete = entries.find(e => e.id === confirmDeleteId);
    if (!entryToDelete) {
      setConfirmDeleteId(null);
      return;
    }

    await deleteDoc(doc(db, 'gymEntries', confirmDeleteId));
    setEntries(prev => prev.filter(e => e.id !== confirmDeleteId));
    setLastDeletedEntry(entryToDelete);
    setConfirmDeleteId(null);
    setShowUndoBar(true);

    if (undoTimeoutRef.current) {
      clearTimeout(undoTimeoutRef.current);
    }
    undoTimeoutRef.current = setTimeout(() => {
      setShowUndoBar(false);
      setLastDeletedEntry(null);
    }, 5000);
  };

  const handleUndoDelete = async () => {
    if (!lastDeletedEntry) return;
    const { id, ...data } = lastDeletedEntry;
    await setDoc(doc(db, 'gymEntries', id), data);
    setEntries(prev => [...prev, lastDeletedEntry]);
    setShowUndoBar(false);
    setLastDeletedEntry(null);
    if (undoTimeoutRef.current) {
      clearTimeout(undoTimeoutRef.current);
    }
  };

  const handleNoteChange = async (id: string, newNote: string) => {
    await updateDoc(doc(db, 'gymEntries', id), { notes: newNote });
    setEntries(prev =>
      prev.map(e => (e.id === id ? { ...e, notes: newNote } : e))
    );
  };

  const processedEntries = useMemo(() => {
    const filtered = entries.filter(entry => {
      const matchType = filterType === 'All' || entry.workoutType === filterType;
      const dateStr = entry.dateDay?.split(' - ')[0];
      if (!dateStr) return false;
      const entryDate = new Date(dateStr);
      const withinRange =
        filterDays === 0 ? true : isAfter(entryDate, subDays(new Date(), filterDays));
      return matchType && withinRange;
    });

    const sorted = [...filtered].sort((a, b) => {
      const aDate = new Date(a.dateDay?.split(' - ')[0]);
      const bDate = new Date(b.dateDay?.split(' - ')[0]);
      return bDate.getTime() - aDate.getTime();
    });

    const groups: { dateKey: string; entries: any[] }[] = [];
    const map: Record<string, any[]> = {};

    sorted.forEach(entry => {
      const dateKey = entry.dateDay?.split(' - ')[0];
      if (!dateKey) return;
      if (!map[dateKey]) {
        map[dateKey] = [];
      }
      map[dateKey].push(entry);
    });

    Object.keys(map)
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
      .forEach(dateKey => {
        groups.push({ dateKey, entries: map[dateKey] });
      });

    return groups;
  }, [entries, filterType, filterDays]);

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

  const formatDate = (dateStr: string) => {
    const d = dateStr ? new Date(dateStr) : new Date();
    return format(d, 'MMM dd, yyyy');
  };

  return (
    <div className="min-h-screen space-y-8 px-2 sm:px-4 pb-10">
      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="mx-4 w-full max-w-xs rounded-3xl bg-[#111216] px-6 py-6 text-center shadow-2xl">
            <h2 className="text-lg font-semibold text-white">Delete Workout?</h2>
            <p className="mt-2 text-sm text-zinc-400">
              Are you sure you want to delete this workout? This action cannot be undone.
            </p>
            <div className="mt-6 space-y-3">
              <button
                onClick={handleDeleteConfirmed}
                className="w-full rounded-full bg-rose-600 py-2 text-sm font-semibold text-white shadow hover:bg-rose-500"
              >
                Delete
              </button>
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="w-full rounded-full bg-[#181a1f] py-2 text-sm font-semibold text-zinc-100 hover:bg-[#20232a]"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showUndoBar && lastDeletedEntry && (
        <div className="fixed bottom-6 left-1/2 z-40 flex -translate-x-1/2 items-center rounded-full bg-black/80 px-5 py-2 text-sm text-white shadow-lg">
          <span>Workout deleted.</span>
          <button
            onClick={handleUndoDelete}
            className="ml-4 text-xs font-semibold tracking-wide text-emerald-400 hover:text-emerald-300"
          >
            UNDO
          </button>
        </div>
      )}

      <BackHeader title="Workout History" showHome={false} titleClassName="text-emerald-300" />

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
            <SelectItem value="7">Last 7 days</SelectItem>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="0">All time</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {processedEntries.length === 0 ? (
        <div className="text-zinc-400 text-sm mt-4">No entries found.</div>
      ) : (
        <div className="space-y-6">
          {processedEntries.map(group => (
            <div key={group.dateKey} className="space-y-3">
              <div className="pl-1 text-sm font-bold text-emerald-300">
                {formatDate(group.dateKey)}
              </div>
              <div className="space-y-4">
                {group.entries.map(entry => {
                  const vol = calcVolume(entry);
                  const minutes = entry.cardio?.time || '—';
                  const isOpen = !!expanded[entry.id];
                  return (
                    <Card
                      key={entry.id}
                      className="rounded-[24px] border border-emerald-500/10 bg-[#0b0f0d] p-0 shadow-[0_20px_60px_rgba(0,0,0,0.45)]"
                    >
                      <CardContent className="p-0">
                        <div className="px-4 py-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="text-xl font-semibold text-white">
                                {entry.workoutType || 'Workout'}
                              </h3>
                            </div>
                            <div className="flex items-center justify-center rounded-full bg-emerald-500/20 p-2 text-emerald-300">
                              ✓
                            </div>
                          </div>
                          <div className="mt-3 flex flex-wrap gap-6 text-sm text-zinc-300">
                            <div className="flex items-center gap-2">
                              <span>⏱️</span>
                              <span>{minutes} mins</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span>🏋️</span>
                              <span>{vol.toLocaleString()} kg</span>
                            </div>
                          </div>
                        </div>
                        <div className="border-t border-white/5 px-4 py-3">
                          <button
                            className="flex w-full items-center justify-between text-left text-white"
                            onClick={() =>
                              setExpanded(prev => ({ ...prev, [entry.id]: !isOpen }))
                            }
                          >
                            <span className="font-semibold">Exercises</span>
                            <span className="text-zinc-400">{isOpen ? '▴' : '▾'}</span>
                          </button>
                          {isOpen && (
                            <div className="mt-3 space-y-2 text-sm">
                              {(editingId === entry.id ? entry.exercises : entry.exercises)?.map(
                                (ex: any, i: number) => (
                                  <div
                                    key={i}
                                    className="rounded-2xl border border-white/10 bg-[#0f1311] p-3"
                                  >
                                    <div className="font-medium text-white">{ex.name}</div>
                                    {editingId === entry.id ? (
                                      <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                                        {ex.sets.map((s: string, j: number) => (
                                          <input
                                            key={j}
                                            defaultValue={s}
                                            onChange={e => {
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
                                          <div
                                            key={j}
                                            className="rounded-lg border border-white/10 px-3 py-1.5 text-center"
                                          >
                                            {s || '—'}
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                )
                              )}
                            </div>
                          )}
                        </div>
                        {entry.notes && (
                          <div className="border-t border-white/5 px-4 py-3 text-xs text-zinc-400">
                            📝 {entry.notes}
                          </div>
                        )}
                        <div className="border-t border-white/5 px-4 py-3 text-right text-xs">
                          {editingId === entry.id ? (
                            <>
                              <button
                                onClick={async () => {
                                  await updateDoc(doc(db, 'gymEntries', entry.id), {
                                    exercises:
                                      entries.find(e => e.id === entry.id)?.exercises ||
                                      entry.exercises,
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
                          <button
                            onClick={() => setConfirmDeleteId(entry.id)}
                            className="text-rose-400 hover:text-rose-300"
                          >
                            Delete
                          </button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
