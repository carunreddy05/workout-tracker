import React, { useEffect, useMemo, useRef, useState } from 'react';
import { db } from '@/firebase';
import { collection, getDocs, deleteDoc, doc, setDoc, updateDoc, query, where } from 'firebase/firestore';
import { format, isAfter, subDays } from 'date-fns';
import { useAuth } from '@/lib/auth';
import { parseDateKey } from '@/utils/week';
import { calcSetVolume } from '@/utils/exerciseMeasurement';

const SERIF: React.CSSProperties = { fontFamily: "'Instrument Serif', Georgia, serif" };
const MONO: React.CSSProperties = { fontFamily: "'Geist Mono', monospace" };

const workoutOptions = ['All', 'Chest/Triceps', 'Back/Biceps', 'Shoulders', 'Legs', 'Core'];
const splitLabels: Record<string, string> = {
  'Back/Biceps': 'Pull',
  'Chest/Triceps': 'Push',
  Legs: 'Legs',
  Core: 'Core',
  Shoulders: 'Shoulders',
};

type PeriodKey = '7' | '30' | '90' | '0';
const periodTabs: { key: PeriodKey; label: string }[] = [
  { key: '7', label: 'Week' },
  { key: '30', label: 'Month' },
  { key: '90', label: 'Quarter' },
  { key: '0', label: 'All' },
];

export default function WorkoutHistory() {
  const [entries, setEntries] = useState<any[]>([]);
  const [filterType, setFilterType] = useState('All');
  const [filterDays, setFilterDays] = useState<PeriodKey>('30');
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [lastDeletedEntry, setLastDeletedEntry] = useState<any | null>(null);
  const [showUndoBar, setShowUndoBar] = useState(false);
  const undoTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) { setEntries([]); return; }
    const fetchEntries = async () => {
      const snap = await getDocs(query(collection(db, 'gymEntries'), where('userId', '==', user.uid)));
      setEntries(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    };
    fetchEntries();
  }, [user]);

  useEffect(() => () => { if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current); }, []);

  const handleDeleteConfirmed = async () => {
    if (!confirmDeleteId) return;
    const entryToDelete = entries.find(e => e.id === confirmDeleteId);
    if (!entryToDelete) { setConfirmDeleteId(null); return; }
    await deleteDoc(doc(db, 'gymEntries', confirmDeleteId));
    setEntries(prev => prev.filter(e => e.id !== confirmDeleteId));
    setLastDeletedEntry(entryToDelete);
    setConfirmDeleteId(null);
    setShowUndoBar(true);
    if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
    undoTimeoutRef.current = setTimeout(() => { setShowUndoBar(false); setLastDeletedEntry(null); }, 5000);
  };

  const handleUndoDelete = async () => {
    if (!lastDeletedEntry) return;
    const { id, ...data } = lastDeletedEntry;
    await setDoc(doc(db, 'gymEntries', id), data);
    setEntries(prev => [...prev, lastDeletedEntry]);
    setShowUndoBar(false);
    setLastDeletedEntry(null);
    if (undoTimeoutRef.current) clearTimeout(undoTimeoutRef.current);
  };

  const parseSet = (raw: string) => {
    if (!raw) return { w: 0, r: 0 };
    const cleaned = String(raw).replace(/\s+/g, '');
    const atParts = cleaned.split('@');
    if (atParts.length === 2) return { w: parseFloat(atParts[0]) || 0, r: parseFloat(atParts[1]) || 0 };
    const m = cleaned.match(/(\d+(?:\.\d+)?)[x×]?(\d+(?:\.\d+)?)/i);
    if (m) return { w: parseFloat(m[1]) || 0, r: parseFloat(m[2]) || 0 };
    const nums = cleaned.match(/\d+(?:\.\d+)?/g) || [];
    if (nums.length >= 2) return { w: parseFloat(nums[0]!) || 0, r: parseFloat(nums[1]!) || 0 };
    if (nums.length === 1) return { w: parseFloat(nums[0]!) || 0, r: 0 };
    return { w: 0, r: 0 };
  };

  const calcVolume = (entry: any) => {
    if (!entry?.exercises?.length) return 0;
    return entry.exercises.reduce((sum: number, ex: any) =>
      sum + ex.sets.reduce((s: number, raw: string) => {
        const { w, r } = parseSet(raw);
        return s + calcSetVolume(ex.name, w, r);
      }, 0), 0);
  };

  const processedEntries = useMemo(() => {
    const daysNum = Number(filterDays);
    const filtered = entries.filter(entry => {
      const matchType = filterType === 'All' || entry.workoutType === filterType;
      const dateStr = entry.dateDay?.split(' - ')[0];
      if (!dateStr) return false;
      const withinRange = daysNum === 0 ? true : isAfter(parseDateKey(dateStr), subDays(new Date(), daysNum));
      return matchType && withinRange;
    });
    return [...filtered].sort((a, b) => {
      const aDate = a.dateDay?.split(' - ')[0];
      const bDate = b.dateDay?.split(' - ')[0];
      if (!aDate || !bDate) return 0;
      return parseDateKey(bDate).getTime() - parseDateKey(aDate).getTime();
    });
  }, [entries, filterType, filterDays]);

  const monthSummary = useMemo(() => {
    const sessions = entries.filter(e => {
      const d = e.dateDay?.split(' - ')[0];
      return d && isAfter(parseDateKey(d), subDays(new Date(), 30));
    });
    const vol = sessions.reduce((s, e) => s + calcVolume(e), 0);
    return { count: sessions.length, volume: vol };
  }, [entries]);

  const numFmt = new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 });

  const hairline: React.CSSProperties = { borderColor: 'var(--tf-line)', borderStyle: 'solid' };

  return (
    <div className="pb-4" style={{ color: 'var(--tf-ink)' }}>

      {/* ── Delete confirm modal ── */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="mx-4 w-full max-w-xs rounded-[18px] p-6 text-center" style={{ background: 'var(--tf-surface)', border: '1px solid var(--tf-line2)' }}>
            <h2 className="text-lg font-semibold" style={{ ...SERIF, color: 'var(--tf-ink)' }}>Delete session?</h2>
            <p className="mt-2 text-sm" style={{ color: 'var(--tf-mute)' }}>This cannot be undone.</p>
            <div className="mt-5 flex gap-3">
              <button onClick={() => setConfirmDeleteId(null)} className="flex-1 rounded-full py-2.5 text-sm font-medium" style={{ border: '1px solid var(--tf-line)', color: 'var(--tf-ink2)' }}>Cancel</button>
              <button onClick={handleDeleteConfirmed} className="flex-1 rounded-full py-2.5 text-sm font-medium" style={{ background: 'var(--tf-danger)', color: '#fff' }}>Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Undo bar ── */}
      {showUndoBar && lastDeletedEntry && (
        <div className="fixed bottom-28 left-1/2 z-40 flex -translate-x-1/2 items-center gap-4 rounded-full px-5 py-2.5 text-sm shadow-lg" style={{ background: 'var(--tf-surface2)', border: '1px solid var(--tf-line)' }}>
          <span style={{ color: 'var(--tf-ink2)' }}>Session deleted.</span>
          <button onClick={handleUndoDelete} className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--tf-accent)' }}>Undo</button>
        </div>
      )}

      {/* ── Header ── */}
      <section className="pt-6 pb-2 px-1">
        <p className="text-[10px] font-medium uppercase tracking-[0.18em]" style={{ ...MONO, color: 'var(--tf-mute)' }}>HISTORY · 30 DAYS</p>
        <h1 className="mt-2 leading-none" style={{ ...SERIF, fontSize: 'clamp(40px, 10vw, 56px)', letterSpacing: '-0.025em', color: 'var(--tf-ink)' }}>
          Your <em style={{ fontStyle: 'italic', color: 'var(--tf-accent)' }}>month.</em>
        </h1>
        {monthSummary.count > 0 && (
          <p className="mt-2 text-base" style={{ ...SERIF, fontStyle: 'italic', color: 'var(--tf-mute)' }}>
            {monthSummary.count} sessions.{' '}
            <span style={{ color: 'var(--tf-ink2)' }}>
              {numFmt.format(monthSummary.volume)} kilograms
            </span>{' '}
            moved.
          </p>
        )}
      </section>

      {/* ── Period tabs ── */}
      <section className="py-4 px-1">
        <div className="flex gap-2">
          {periodTabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilterDays(tab.key)}
              className="rounded-full px-4 py-1.5 text-[12px] font-medium transition-all"
              style={{
                background: filterDays === tab.key ? 'var(--tf-accent)' : 'transparent',
                color: filterDays === tab.key ? 'var(--tf-accent-ink)' : 'var(--tf-mute)',
                border: `1px solid ${filterDays === tab.key ? 'var(--tf-accent)' : 'var(--tf-line2)'}`,
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </section>

      {/* ── Type filter chips ── */}
      <section className="pb-4 px-1 flex flex-wrap gap-1.5">
        {workoutOptions.map(type => (
          <button
            key={type}
            onClick={() => setFilterType(type)}
            className="rounded-full px-3 py-1 text-[11px] font-medium transition-all"
            style={{
              background: filterType === type ? 'var(--tf-surface2)' : 'transparent',
              color: filterType === type ? 'var(--tf-ink2)' : 'var(--tf-mute)',
              border: `1px solid ${filterType === type ? 'var(--tf-line2)' : 'var(--tf-line)'}`,
            }}
          >
            {splitLabels[type] || type}
          </button>
        ))}
      </section>

      {/* ── Session list ── */}
      <div style={{ ...hairline, borderTopWidth: '1px' }}>
        {processedEntries.length === 0 ? (
          <p className="py-12 text-center text-lg" style={{ ...SERIF, fontStyle: 'italic', color: 'var(--tf-mute)' }}>
            Nothing here yet.
          </p>
        ) : (
          processedEntries.map(entry => {
            const vol = calcVolume(entry);
            const dateStr = entry.dateDay?.split(' - ')[0] || '';
            const weekday = entry.dateDay?.split(' - ')[1] || '';
            const isOpen = !!expanded[entry.id];
            const splitLabel = splitLabels[entry.workoutType] || entry.workoutType;
            const totalSets = (entry.exercises || []).reduce((s: number, ex: any) => s + (ex.sets?.length || 0), 0);
            const dateObj = dateStr ? new Date(dateStr) : new Date();

            return (
              <div key={entry.id} style={{ ...hairline, borderBottomWidth: '1px' }}>
                {/* Session row */}
                <button
                  className="w-full px-1 py-4 flex items-start gap-4 text-left"
                  onClick={() => setExpanded(prev => ({ ...prev, [entry.id]: !isOpen }))}
                >
                  {/* Date column */}
                  <div className="shrink-0 w-11 text-center">
                    <p className="text-[10px] font-medium uppercase tracking-[0.1em]" style={{ ...MONO, color: 'var(--tf-ink2)' }}>
                      {weekday.slice(0, 3).toUpperCase() || format(dateObj, 'EEE').toUpperCase()}
                    </p>
                    <p className="text-sm font-medium mt-0.5" style={{ color: 'var(--tf-mute)' }}>
                      {format(dateObj, 'd')}
                    </p>
                  </div>

                  {/* Title + meta */}
                  <div className="flex-1 min-w-0">
                    <p className="text-xl" style={{ ...SERIF, color: 'var(--tf-ink)' }}>{splitLabel}</p>
                    <p className="mt-0.5 text-xs" style={{ color: 'var(--tf-mute)' }}>
                      {totalSets} sets
                      {entry.cardio?.time ? ` · ${entry.cardio.time} min cardio` : ''}
                    </p>
                  </div>

                  {/* Volume */}
                  <div className="shrink-0 text-right">
                    <p className="text-lg" style={{ ...SERIF, fontStyle: 'italic', color: 'var(--tf-ink2)' }}>
                      {numFmt.format(vol)} kg
                    </p>
                    <p className="mt-0.5 text-[10px] uppercase" style={{ ...MONO, color: 'var(--tf-mute)' }}>
                      {format(dateObj, 'MMM d')}
                    </p>
                  </div>
                </button>

                {/* Expanded exercise list */}
                {isOpen && (
                  <div className="px-1 pb-4 space-y-3">
                    {(entry.exercises || []).map((ex: any, i: number) => (
                      <div key={i}>
                        <div className="flex items-center justify-between">
                          <p className="text-base" style={{ ...SERIF, color: 'var(--tf-ink)' }}>{ex.name}</p>
                          <p className="text-[10px] uppercase tracking-wide" style={{ ...MONO, color: 'var(--tf-mute)' }}>{ex.sets?.length} sets</p>
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {(ex.sets || []).map((s: string, j: number) => {
                            const parts = s?.split('@');
                            const display = parts?.length === 2 ? `${parts[0]}kg × ${parts[1]}` : s;
                            return (
                              <span
                                key={j}
                                className="rounded-full px-3 py-1 text-[11px]"
                                style={{ background: 'var(--tf-surface)', color: 'var(--tf-ink2)', border: '1px solid var(--tf-line)' }}
                              >
                                <span style={{ ...MONO, color: 'var(--tf-mute)', fontSize: '10px' }}>S{j + 1} </span>
                                <span style={SERIF}>{display || '—'}</span>
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    ))}

                    {entry.notes && (
                      <p className="text-xs mt-2" style={{ color: 'var(--tf-mute)' }}>
                        📝 {entry.notes}
                      </p>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 pt-1">
                      {editingId === entry.id ? (
                        <>
                          <button
                            onClick={async () => {
                              await updateDoc(doc(db, 'gymEntries', entry.id), { exercises: entries.find(e => e.id === entry.id)?.exercises });
                              setEditingId(null);
                            }}
                            className="rounded-full px-4 py-1.5 text-[11px] font-medium"
                            style={{ border: '1px solid var(--tf-accent)', color: 'var(--tf-accent)' }}
                          >
                            Save
                          </button>
                          <button onClick={() => setEditingId(null)} className="rounded-full px-4 py-1.5 text-[11px] font-medium" style={{ border: '1px solid var(--tf-line)', color: 'var(--tf-mute)' }}>
                            Cancel
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => { setEditingId(entry.id); setExpanded(prev => ({ ...prev, [entry.id]: true })); }}
                          className="rounded-full px-4 py-1.5 text-[11px] font-medium"
                          style={{ border: '1px solid var(--tf-line)', color: 'var(--tf-mute)' }}
                        >
                          Edit
                        </button>
                      )}
                      <button
                        onClick={() => setConfirmDeleteId(entry.id)}
                        className="rounded-full px-4 py-1.5 text-[11px] font-medium"
                        style={{ border: '1px solid var(--tf-line)', color: 'var(--tf-danger)' }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
