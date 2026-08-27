import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { format } from 'date-fns';
import { AnimatePresence, motion } from 'framer-motion';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '@/firebase';
import { useAuth } from '@/lib/auth';
import type { Set } from '@/types/WorkoutEntry';
import { todayKey, parseDateKey } from '@/utils/week';
import { calcSetVolume, isBodyweightOnly } from '@/utils/exerciseMeasurement';

const kgToLbs = (kg: number) => Math.round(kg * 2.20462 * 10) / 10;

interface QueuedExercise {
  name: string;
  focus: string;
  kind: string;
  sets: Set[];
  image?: string | null;
}

export default function Summary() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);

  const [showSuccess, setShowSuccess] = useState(false);
  const state = location.state as { queue: QueuedExercise[]; today?: string; date?: string; cardio?: { speed: number; time: number } | null } | null;

  if (!state || !state.queue || state.queue.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen" style={{ background: 'var(--tf-bg)' }}>
        <p style={{ color: 'var(--tf-ink)' }}>No workout data</p>
      </div>
    );
  }

  const { queue, cardio } = state;
  const workoutDate = state.date || state.today || todayKey();

  // Calculate totals
  const totalSets = queue.reduce((sum, ex) => sum + ex.sets.length, 0);
  const totalVolume = queue.reduce((sum, ex) => {
    return sum + ex.sets.reduce((exSum, set) => exSum + calcSetVolume(ex.name, set.w, set.r), 0);
  }, 0);

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);
    try {
      // Convert queue to legacy format (what Dashboard.tsx expects)
      const exercises = queue.map(qEx => ({
        name: qEx.name,
        sets: qEx.sets.map(set => `${set.w}@${set.r}`),
      }));

      // Create legacy entry document
      const newEntry = {
        userId: user.uid,
        dateDay: `${workoutDate} - ${format(parseDateKey(workoutDate), 'EEEE')}`,
        weight: 0,
        workoutType: 'Today\'s Workout',
        exercises,
        notes: '',
        cardio: cardio || null,
      };

      await addDoc(collection(db, 'gymEntries'), newEntry);

      // Show success modal
      setShowSuccess(true);

      // Navigate after 2 seconds
      setTimeout(() => {
        navigate('/dashboard', { state: { message: 'Workout saved!' } });
      }, 2000);
    } catch (err) {
      console.error('Error saving workout:', err);
      setSaving(false);
      alert('Failed to save workout. Please try again.');
    }
  };

  const handleCancel = () => {
    navigate('/train', { state: { queue, date: workoutDate } });
  };

  return (
    <div className="pb-24" style={{ background: 'var(--tf-bg)', color: 'var(--tf-ink)' }}>
      {/* Success Modal */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="rounded-2xl px-8 py-12 text-center max-w-sm"
              style={{ background: 'var(--tf-surface)', border: '1px solid var(--tf-line)' }}
            >
              <div className="text-5xl mb-4">✓</div>
              <p className="text-2xl font-bold mb-2" style={{ color: 'var(--tf-ink)' }}>
                Workout Saved!
              </p>
              <p className="text-sm" style={{ color: 'var(--tf-mute)' }}>
                {queue.length} exercise{queue.length > 1 ? 's' : ''} · {totalSets} sets · {Math.round(totalVolume)}kg total
              </p>
              <p className="text-xs mt-4" style={{ color: 'var(--tf-mute2)' }}>
                Redirecting to dashboard...
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="px-6 py-6 border-b" style={{ borderColor: 'var(--tf-line)' }}>
        <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--tf-mute)' }}>
          Review
        </p>
        <p className="mt-2 text-2xl font-bold">
          Session Summary
        </p>
      </div>

      {/* Stats */}
      <div className="px-6 py-6 grid grid-cols-3 gap-3">
        <div
          className="rounded-xl p-4 text-center"
          style={{ background: 'var(--tf-surface)', border: '1px solid var(--tf-line)' }}
        >
          <p className="text-2xl font-bold" style={{ color: 'var(--tf-accent)' }}>
            {queue.length}
          </p>
          <p className="text-xs mt-1" style={{ color: 'var(--tf-mute)' }}>
            Exercises
          </p>
        </div>
        <div
          className="rounded-xl p-4 text-center"
          style={{ background: 'var(--tf-surface)', border: '1px solid var(--tf-line)' }}
        >
          <p className="text-2xl font-bold" style={{ color: 'var(--tf-accent)' }}>
            {totalSets}
          </p>
          <p className="text-xs mt-1" style={{ color: 'var(--tf-mute)' }}>
            Sets
          </p>
        </div>
        <div
          className="rounded-xl p-4 text-center"
          style={{ background: 'var(--tf-surface)', border: '1px solid var(--tf-line)' }}
        >
          <p className="text-2xl font-bold" style={{ color: 'var(--tf-accent)' }}>
            {Math.round(totalVolume / 100) / 10}k
          </p>
          <p className="text-xs mt-1" style={{ color: 'var(--tf-mute)' }}>
            Volume
          </p>
        </div>
      </div>

      {/* Exercises Breakdown */}
      <div className="px-6 py-4">
        <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--tf-mute)' }}>
          Exercises
        </p>
        <div className="space-y-3">
          {queue.map((ex, idx) => (
            <div
              key={`${ex.name}-${idx}`}
              className="rounded-xl p-4"
              style={{ background: 'var(--tf-surface)', border: '1px solid var(--tf-line)' }}
            >
              <p className="font-semibold" style={{ color: 'var(--tf-ink)' }}>
                {ex.name}
              </p>
              <p className="text-xs mt-1 mb-3" style={{ color: 'var(--tf-mute)' }}>
                {ex.focus} · {ex.kind}
              </p>

              {/* Sets Display */}
              <div className="flex flex-wrap gap-2">
                {ex.sets.map((set, setIdx) => (
                  <div
                    key={`${ex.name}-set-${setIdx}`}
                    className="px-3 py-1 rounded-full text-xs font-semibold"
                    style={{
                      background: 'var(--tf-surface2)',
                      border: '1px solid var(--tf-line)',
                      color: 'var(--tf-ink2)',
                    }}
                  >
                    {isBodyweightOnly(ex.name) ? `${set.r} reps` : `${kgToLbs(set.w).toFixed(0)} lbs × ${set.r}`}
                  </div>
                ))}
              </div>

              {/* Exercise volume */}
              {!isBodyweightOnly(ex.name) && (
                <p className="text-xs mt-3" style={{ color: 'var(--tf-mute)' }}>
                  Volume:{' '}
                  <span style={{ color: 'var(--tf-accent)' }}>
                    {Math.round(ex.sets.reduce((sum, s) => sum + calcSetVolume(ex.name, s.w, s.r), 0))}
                  </span>
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Cardio Section (if included) */}
      {cardio && (
        <div className="px-6 py-4 border-t" style={{ borderColor: 'var(--tf-line)' }}>
          <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--tf-mute)' }}>
            Cardio Finisher
          </p>
          <div
            className="rounded-2xl p-4 flex items-center justify-between"
            style={{ background: 'var(--tf-surface)', border: '1px solid var(--tf-line)' }}
          >
            <div>
              <p className="text-sm" style={{ color: 'var(--tf-mute)' }}>
                Treadmill
              </p>
              <p className="text-lg font-semibold mt-1" style={{ color: 'var(--tf-ink)' }}>
                {cardio.speed} km/h · {cardio.time} min
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p className="text-xs" style={{ color: 'var(--tf-mute)' }}>
                Duration
              </p>
              <p className="text-xl font-bold" style={{ color: 'var(--tf-accent)' }}>
                {cardio.time}m
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div
        className="fixed bottom-20 left-0 right-0 p-4 border-t flex gap-3 z-40"
        style={{
          background: 'var(--tf-bg)',
          borderColor: 'var(--tf-line)',
        }}
      >
        <button
          onClick={handleCancel}
          disabled={saving}
          className="flex-1 px-4 py-3 rounded-2xl font-semibold text-sm transition disabled:opacity-50"
          style={{
            background: 'var(--tf-surface)',
            border: '1px solid var(--tf-line2)',
            color: 'var(--tf-ink2)',
          }}
        >
          Back
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex-1 px-4 py-3 rounded-2xl font-semibold text-sm transition disabled:opacity-60 disabled:cursor-not-allowed"
          style={{
            background: saving ? 'var(--tf-mute)' : 'var(--tf-accent)',
            color: 'var(--tf-accent-ink)',
          }}
        >
          {saving ? (
            <span className="flex items-center justify-center gap-2">
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              Saving...
            </span>
          ) : (
            'Save Workout'
          )}
        </button>
      </div>
    </div>
  );
}
