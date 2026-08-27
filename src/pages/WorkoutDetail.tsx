import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '@/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { useAuth } from '@/lib/auth';
import { calcSetVolume, isBodyweightOnly } from '@/utils/exerciseMeasurement';

const SERIF: React.CSSProperties = { fontFamily: "'Instrument Serif', Georgia, serif" };
const MONO: React.CSSProperties = { fontFamily: "'Geist Mono', monospace" };

const splitLabels: Record<string, string> = {
  'Back/Biceps': 'Pull',
  'Chest/Triceps': 'Push',
  Legs: 'Legs',
  Core: 'Core',
  Shoulders: 'Shoulders',
};

export default function WorkoutDetail() {
  const { dateDay } = useParams();
  const navigate = useNavigate();
  const [entry, setEntry] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!user || !dateDay) return;
    const fetchEntry = async () => {
      const q = query(collection(db, 'gymEntries'), where('userId', '==', user.uid), where('dateDay', '==', dateDay));
      const snap = await getDocs(q);
      setEntry(snap.empty ? null : snap.docs[0].data());
      setLoading(false);
    };
    fetchEntry();
  }, [dateDay, user]);

  const parseSet = (raw: string) => {
    if (!raw) return { w: '—', r: '—' };
    const parts = raw.split('@');
    if (parts.length === 2) return { w: parts[0] || '—', r: parts[1] || '—' };
    return { w: raw, r: '—' };
  };

  const calcVolume = (entry: any) => {
    if (!entry?.exercises?.length) return 0;
    return entry.exercises.reduce((sum: number, ex: any) =>
      sum + ex.sets.reduce((s: number, raw: string) => {
        const parts = raw?.split('@');
        if (parts?.length === 2) { const w = parseFloat(parts[0]) || 0; const r = parseFloat(parts[1]) || 0; return s + calcSetVolume(ex.name, w, r); }
        return s;
      }, 0), 0);
  };

  const numFmt = new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 });
  const hairline: React.CSSProperties = { borderColor: 'var(--tf-line)', borderStyle: 'solid' };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-48">
        <p style={{ ...SERIF, fontStyle: 'italic', color: 'var(--tf-mute)' }}>Loading…</p>
      </div>
    );
  }

  if (!entry) {
    return (
      <div className="pt-12 text-center">
        <p className="text-lg" style={{ ...SERIF, fontStyle: 'italic', color: 'var(--tf-mute)' }}>Session not found.</p>
        <button onClick={() => navigate('/history')} className="mt-4 text-sm underline" style={{ color: 'var(--tf-accent)' }}>
          ← Back to history
        </button>
      </div>
    );
  }

  const splitLabel = splitLabels[entry.workoutType] || entry.workoutType || 'Session';
  const dateParts = entry.dateDay?.split(' - ');
  const dateStr = dateParts?.[0] || '';
  const weekday = dateParts?.[1] || '';
  const vol = calcVolume(entry);
  const totalSets = (entry.exercises || []).reduce((s: number, ex: any) => s + (ex.sets?.length || 0), 0);

  return (
    <div className="pb-4" style={{ color: 'var(--tf-ink)' }}>

      {/* ── Top bar ── */}
      <div className="flex items-center justify-between pt-4 pb-2 px-1">
        <button onClick={() => navigate('/history')} className="text-sm font-medium flex items-center gap-1 transition" style={{ color: 'var(--tf-mute)' }}>
          ← Back
        </button>
        <p className="text-xs font-medium" style={{ ...MONO, color: 'var(--tf-mute)', letterSpacing: '0.06em' }}>
          {weekday?.slice(0, 3).toUpperCase() || ''} · {dateStr}
        </p>
        <div className="w-12" />
      </div>

      {/* ── Title ── */}
      <section className="py-5 px-1">
        <h1 className="leading-none" style={{ ...SERIF, fontSize: 'clamp(40px, 12vw, 56px)', letterSpacing: '-0.02em', color: 'var(--tf-ink)' }}>
          {splitLabel}.
        </h1>
        <p className="mt-2 text-base" style={{ ...SERIF, fontStyle: 'italic', color: 'var(--tf-mute)' }}>
          {numFmt.format(vol)} kg · {totalSets} sets
          {entry.cardio?.time ? ` · ${entry.cardio.time} min` : ''}
          {entry.notes?.toLowerCase().includes('pr') ? <span style={{ color: 'var(--tf-accent)' }}> · PRs ✦</span> : null}
        </p>
      </section>

      {/* ── Volume stat ── */}
      <div style={{ ...hairline, borderTopWidth: '1px' }} />
      <section className="py-5 px-1">
        <p className="text-[10px] font-medium uppercase tracking-[0.18em]" style={{ ...MONO, color: 'var(--tf-mute)' }}>TOTAL VOLUME</p>
        <p className="mt-1" style={{ ...SERIF, fontSize: 'clamp(48px, 14vw, 72px)', letterSpacing: '-0.04em', lineHeight: '0.95', color: 'var(--tf-ink)' }}>
          {numFmt.format(vol)}<span className="text-xl ml-2" style={{ color: 'var(--tf-mute)' }}>kg</span>
        </p>
      </section>

      {/* ── Exercise list ── */}
      <div style={{ ...hairline, borderTopWidth: '1px' }}>
        {(entry.exercises || []).map((ex: any, i: number) => (
          <div key={i} className="py-4 px-1" style={{ ...hairline, borderBottomWidth: '1px' }}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-lg" style={{ ...SERIF, color: 'var(--tf-ink)' }}>{ex.name}</p>
              <p className="text-[10px] uppercase tracking-wide" style={{ ...MONO, color: 'var(--tf-mute)' }}>{ex.sets?.length} sets</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {(ex.sets || []).map((raw: string, j: number) => {
                const { w, r } = parseSet(raw);
                const isPr = entry.notes?.toLowerCase().includes('pr') && j === ex.sets.length - 1;
                return (
                  <span
                    key={j}
                    className="rounded-full px-3 py-1 text-[12px]"
                    style={{
                      background: isPr ? 'rgba(232,165,90,0.1)' : 'var(--tf-surface)',
                      border: `1px solid ${isPr ? 'var(--tf-accent)' : 'var(--tf-line)'}`,
                      color: isPr ? 'var(--tf-accent)' : 'var(--tf-ink2)',
                    }}
                  >
                    <span style={{ ...MONO, fontSize: '10px', color: isPr ? 'var(--tf-accent2)' : 'var(--tf-mute)' }}>S{j + 1} </span>
                    <span style={SERIF}>{isBodyweightOnly(ex.name) ? `${r} reps` : `${w}kg × ${r}`}</span>
                    {isPr && <span className="ml-1" style={{ color: 'var(--tf-accent)' }}>✦</span>}
                  </span>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* ── Cardio section ── */}
      {entry.cardio && (
        <>
          <div style={{ ...hairline, borderTopWidth: '1px' }} />
          <section className="py-4 px-1">
            <p className="text-[10px] font-medium uppercase tracking-[0.14em] mb-2" style={{ ...MONO, color: 'var(--tf-mute)' }}>CARDIO</p>
            <div className="flex gap-6">
              {entry.cardio.incline && (
                <div><p className="text-xs" style={{ color: 'var(--tf-mute)' }}>Incline</p><p className="text-lg mt-0.5" style={{ ...SERIF, color: 'var(--tf-ink)' }}>{entry.cardio.incline}%</p></div>
              )}
              {entry.cardio.speed && (
                <div><p className="text-xs" style={{ color: 'var(--tf-mute)' }}>Speed</p><p className="text-lg mt-0.5" style={{ ...SERIF, color: 'var(--tf-ink)' }}>{entry.cardio.speed}</p></div>
              )}
              {entry.cardio.time && (
                <div><p className="text-xs" style={{ color: 'var(--tf-mute)' }}>Time</p><p className="text-lg mt-0.5" style={{ ...SERIF, color: 'var(--tf-ink)' }}>{entry.cardio.time} min</p></div>
              )}
            </div>
          </section>
        </>
      )}

      {/* ── Notes ── */}
      {entry.notes && (
        <>
          <div style={{ ...hairline, borderTopWidth: '1px' }} />
          <section className="py-4 px-1">
            <p className="text-[10px] font-medium uppercase tracking-[0.14em] mb-2" style={{ ...MONO, color: 'var(--tf-mute)' }}>NOTES</p>
            <p className="text-sm" style={{ color: 'var(--tf-ink2)' }}>{entry.notes}</p>
          </section>
        </>
      )}

      {/* ── Actions ── */}
      <div style={{ ...hairline, borderTopWidth: '1px' }} />
      <section className="py-5 px-1 flex gap-3">
        <button onClick={() => navigate('/history')}
          className="flex-1 rounded-full py-3 text-sm font-medium transition"
          style={{ border: '1px solid var(--tf-line)', color: 'var(--tf-mute)' }}>
          ← History
        </button>
        <button onClick={() => navigate('/entry')}
          className="flex-[1.4] rounded-full py-3 text-sm font-medium transition"
          style={{ background: 'var(--tf-ink)', color: 'var(--tf-accent-ink)' }}>
          Repeat session →
        </button>
      </section>
    </div>
  );
}
