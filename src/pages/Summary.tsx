import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { format } from 'date-fns';
import { addDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/firebase';
import { useAuth } from '@/lib/auth';
import type { Session, Exercise, Set } from '@/types/WorkoutEntry';

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

  const state = location.state as { queue: QueuedExercise[]; today: string } | null;

  if (!state || !state.queue || state.queue.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen" style={{ background: 'var(--tf-bg)' }}>
        <p style={{ color: 'var(--tf-ink)' }}>No workout data</p>
      </div>
    );
  }

  const { queue, today } = state;

  // Calculate totals
  const totalSets = queue.reduce((sum, ex) => sum + ex.sets.length, 0);
  const totalVolume = queue.reduce((sum, ex) => {
    return sum + ex.sets.reduce((exSum, set) => exSum + set.w * set.r, 0);
  }, 0);

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);
    try {
      // Get weekday from date
      const date = new Date(today);
      const weekday = format(date, 'EEE');

      // Convert queue to Exercise objects
      const exercises: Exercise[] = queue.map(qEx => ({
        name: qEx.name,
        focus: qEx.focus,
        kind: qEx.kind,
        targetSets: qEx.sets.length,
        lastWeight: qEx.sets[0]?.w || 0,
        lastReps: qEx.sets[0]?.r || 10,
        sets: qEx.sets,
      }));

      // Create session document
      const sessionData: Session = {
        id: '', // Will be set by Firestore
        userId: user.uid,
        date: today,
        weekday,
        title: 'Today\'s Workout',
        split: 'push', // Can be enhanced to auto-detect
        durationMin: Math.round(totalSets * 2.5), // Estimate
        sets: totalSets,
        volume: totalVolume,
        prs: 0, // Can implement PR detection later
        exercises,
      };

      const docRef = await addDoc(collection(db, 'workouts'), sessionData);
      sessionData.id = docRef.id;

      // Show success and navigate to dashboard
      navigate('/dashboard', { state: { message: 'Workout saved!' } });
    } catch (err) {
      console.error('Error saving workout:', err);
      alert('Failed to save workout. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigate('/train', { state: { queue, today } });
  };

  return (
    <div className="pb-24" style={{ background: 'var(--tf-bg)', color: 'var(--tf-ink)' }}>
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
                    {kgToLbs(set.w).toFixed(0)} lbs × {set.r}
                  </div>
                ))}
              </div>

              {/* Exercise volume */}
              <p className="text-xs mt-3" style={{ color: 'var(--tf-mute)' }}>
                Volume:{' '}
                <span style={{ color: 'var(--tf-accent)' }}>
                  {Math.round(ex.sets.reduce((sum, s) => sum + s.w * s.r, 0))}
                </span>
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div
        className="fixed bottom-0 left-0 right-0 p-4 border-t flex gap-3"
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
          className="flex-1 px-4 py-3 rounded-2xl font-semibold text-sm transition disabled:opacity-50"
          style={{
            background: saving ? 'var(--tf-mute)' : 'var(--tf-accent)',
            color: 'var(--tf-accent-ink)',
          }}
        >
          {saving ? 'Saving...' : 'Save Workout'}
        </button>
      </div>
    </div>
  );
}
