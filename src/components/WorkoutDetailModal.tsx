import React, { useEffect } from 'react';
import { format, parse } from 'date-fns';
import { X, Flame, Zap, Star } from 'lucide-react';
import type { Session } from '@/types/WorkoutEntry';

interface WorkoutDetailModalProps {
  session: Session | null;
  isOpen: boolean;
  onClose: () => void;
}

const kgToLbs = (kg: number) => Math.round(kg * 2.20462 * 10) / 10;

export default function WorkoutDetailModal({ session, isOpen, onClose }: WorkoutDetailModalProps) {
  // Close on Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('keydown', handler);
      return () => document.removeEventListener('keydown', handler);
    }
  }, [isOpen, onClose]);

  if (!isOpen || !session) return null;

  const sessionDate = parse(session.date, 'yyyy-MM-dd', new Date());

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 transition-opacity duration-200 pointer-events-auto"
        onClick={onClose}
        style={{
          background: 'rgba(0, 0, 0, 0.5)',
          opacity: isOpen ? 1 : 0,
        }}
      />

      {/* Modal */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl max-w-2xl mx-auto transition-transform duration-300"
        style={{
          background: 'var(--tf-bg)',
          transform: isOpen ? 'translateY(0)' : 'translateY(100%)',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header with close button */}
        <div
          className="flex items-center justify-between px-6 py-4 border-b sticky top-0"
          style={{ borderColor: 'var(--tf-line)' }}
        >
          <div>
            <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--tf-mute)' }}>
              Workout Details
            </p>
            <p className="text-sm font-semibold mt-1" style={{ color: 'var(--tf-ink)' }}>
              {format(sessionDate, 'EEEE, MMM d')}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg transition-all hover:opacity-70"
            style={{ background: 'var(--tf-surface)', color: 'var(--tf-mute)' }}
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="overflow-y-auto flex-1 px-6 py-4">
          {/* Session info header */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold" style={{ color: 'var(--tf-ink)' }}>
              {session.title}
            </h2>
            <p className="text-sm mt-2" style={{ color: 'var(--tf-mute)' }}>
              {session.durationMin} min • {session.sets} sets
            </p>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            {/* Volume */}
            <div
              className="p-3 rounded-2xl"
              style={{ background: 'var(--tf-surface)', border: '1px solid var(--tf-line)' }}
            >
              <div className="flex items-center gap-2 mb-2">
                <div
                  className="w-6 h-6 rounded-lg flex items-center justify-center"
                  style={{ background: 'rgba(59, 130, 246, 0.12)', color: '#3b82f6' }}
                >
                  <Zap className="w-4 h-4" />
                </div>
                <p className="text-xs font-semibold" style={{ color: 'var(--tf-mute)' }}>
                  Volume
                </p>
              </div>
              <p className="text-lg font-bold" style={{ color: 'var(--tf-ink)' }}>
                {isNaN(session.volume) ? '0.0' : (session.volume / 1000).toFixed(1)}
                <span className="text-xs ml-1" style={{ color: 'var(--tf-mute)' }}>
                  K kg
                </span>
              </p>
            </div>

            {/* PRs */}
            <div
              className="p-3 rounded-2xl"
              style={{ background: 'var(--tf-surface)', border: '1px solid var(--tf-line)' }}
            >
              <div className="flex items-center gap-2 mb-2">
                <div
                  className="w-6 h-6 rounded-lg flex items-center justify-center"
                  style={{ background: 'rgba(34, 197, 94, 0.12)', color: 'var(--tf-good)' }}
                >
                  <Star className="w-4 h-4" fill="currentColor" />
                </div>
                <p className="text-xs font-semibold" style={{ color: 'var(--tf-mute)' }}>
                  PRs
                </p>
              </div>
              <p className="text-lg font-bold" style={{ color: 'var(--tf-ink)' }}>
                {session.prs || 0}
              </p>
            </div>

            {/* Duration */}
            <div
              className="p-3 rounded-2xl"
              style={{ background: 'var(--tf-surface)', border: '1px solid var(--tf-line)' }}
            >
              <div className="flex items-center gap-2 mb-2">
                <div
                  className="w-6 h-6 rounded-lg flex items-center justify-center"
                  style={{ background: 'rgba(249, 115, 22, 0.12)', color: 'var(--tf-accent)' }}
                >
                  <Flame className="w-4 h-4" />
                </div>
                <p className="text-xs font-semibold" style={{ color: 'var(--tf-mute)' }}>
                  Duration
                </p>
              </div>
              <p className="text-lg font-bold" style={{ color: 'var(--tf-ink)' }}>
                {session.durationMin}
                <span className="text-xs ml-1" style={{ color: 'var(--tf-mute)' }}>
                  min
                </span>
              </p>
            </div>
          </div>

          {/* Exercises */}
          <div className="mb-6">
            <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: 'var(--tf-mute)' }}>
              Exercises ({session.exercises.length})
            </p>
            <div className="space-y-3">
              {session.exercises.map((exercise, exIdx) => (
                <div
                  key={exIdx}
                  className="rounded-2xl p-4"
                  style={{ background: 'var(--tf-surface)', border: '1px solid var(--tf-line)' }}
                >
                  <div className="mb-3">
                    <p className="font-semibold" style={{ color: 'var(--tf-ink)' }}>
                      {exercise.name}
                    </p>
                    <p className="text-xs mt-1" style={{ color: 'var(--tf-mute)' }}>
                      {exercise.focus} • {exercise.kind}
                    </p>
                  </div>

                  {/* Sets */}
                  <div className="space-y-2">
                    {exercise.sets.map((set, setIdx) => (
                      <div
                        key={setIdx}
                        className="flex items-center justify-between p-2 rounded-lg"
                        style={{ background: 'var(--tf-surface2)' }}
                      >
                        <p className="text-xs font-semibold" style={{ color: 'var(--tf-mute)' }}>
                          Set {setIdx + 1}
                        </p>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p className="text-sm font-semibold" style={{ color: 'var(--tf-ink)' }}>
                              {set.w} kg
                            </p>
                            <p className="text-xs" style={{ color: 'var(--tf-mute)' }}>
                              ({kgToLbs(set.w).toFixed(0)} lbs)
                            </p>
                          </div>
                          <p className="text-xs font-semibold" style={{ color: 'var(--tf-mute)' }}>
                            ×
                          </p>
                          <p className="text-sm font-semibold min-w-8 text-right" style={{ color: 'var(--tf-ink)' }}>
                            {set.r}
                          </p>
                          {set.pr && (
                            <div
                              className="w-5 h-5 rounded-full flex items-center justify-center"
                              style={{ background: 'rgba(34, 197, 94, 0.12)', color: 'var(--tf-good)' }}
                            >
                              <span className="text-xs font-bold">PR</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          {session.notes && (
            <div className="mb-6">
              <p className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--tf-mute)' }}>
                Notes
              </p>
              <div
                className="p-4 rounded-2xl"
                style={{ background: 'var(--tf-surface)', border: '1px solid var(--tf-line)' }}
              >
                <p style={{ color: 'var(--tf-ink)' }}>{session.notes}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
