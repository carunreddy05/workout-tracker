import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '@/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { useAuth } from '@/lib/auth';
import type { Session } from '@/types/WorkoutEntry';
import { calculateStreak, calculateVolume, sessionCountThisWeek, migrateEntry } from '@/utils/firestore';
import { Flame, Zap, Star, Bell, Edit } from 'lucide-react';

const SPLIT_TITLES = {
  push: 'Push',
  pull: 'Pull',
  legs: 'Legs',
  core: 'Core',
};

const SPLIT_SUBTITLES = {
  push: 'Chest · Shoulders · Triceps',
  pull: 'Back · Biceps · Rear Delts',
  legs: 'Quads · Hamstrings · Glutes',
  core: 'Abs · Obliques · Stability',
};

const SPLIT_COUNTS = {
  push: 5,
  pull: 5,
  legs: 5,
  core: 4,
};

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function getTodaySplit(): 'push' | 'pull' | 'legs' | 'core' {
  const day = new Date().getDay();
  if (day === 1 || day === 4) return 'pull';  // Mon, Thu
  if (day === 2 || day === 5) return 'legs';  // Tue, Fri
  if (day === 0) return 'core';               // Sun
  return 'push';                              // Wed, Sat
}

function formatDate() {
  const opts: Intl.DateTimeFormatOptions = { weekday: 'long', month: 'long', day: 'numeric' };
  return new Date().toLocaleDateString('en-US', opts).toUpperCase();
}

function getUserName(user: any): string {
  if (!user) return 'Friend';

  // Try displayName first
  if (user.displayName) {
    return user.displayName.split(' ')[0]; // First name only
  }

  // Fall back to email
  if (user.email) {
    const namePart = user.email.split('@')[0];
    return namePart.charAt(0).toUpperCase() + namePart.slice(1);
  }

  return 'Friend';
}

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setSessions([]);
      setLoading(false);
      return;
    }

    const fetchSessions = async () => {
      try {
        const snap = await getDocs(
          query(collection(db, 'gymEntries'), where('userId', '==', user.uid))
        );
        // Convert old format to new Session type
        const converted = snap.docs
          .map(doc => {
            const data = doc.data() as any;
            const migrated = migrateEntry(doc.id, data, user.uid);
            return migrated;
          })
          .filter((s): s is Session => s !== null)
          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setSessions(converted);
      } catch (error) {
        console.error('Error fetching sessions:', error);
        setSessions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSessions();
  }, [user]);

  const empty = sessions.length === 0;
  const lastSession = sessions[0];
  const streak = Math.max(0, calculateStreak(sessions) || 0);
  const weeklyGoal = 4;
  const weeklyDone = sessionCountThisWeek(sessions);
  const weekPct = Math.min(weeklyDone / weeklyGoal, 1);
  const totalVol = Math.max(0, sessions.reduce((sum, s) => {
    const vol = calculateVolume(s);
    return sum + (isNaN(vol) ? 0 : vol);
  }, 0));
  const todaySplit = getTodaySplit();

  const handleStartTraining = () => {
    navigate('/train');
  };

  const handleEditSession = () => {
    navigate('/entry'); // TODO: replace with Pick screen
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--tf-bg)' }}>
      {/* Page content with padding */}
      <div className="pb-32 px-6 pt-8">
        {/* ── Header ── */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <p style={{ color: 'var(--tf-mute)', fontSize: '12px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              {formatDate()}
            </p>
            <h1 style={{ color: 'var(--tf-ink)', fontSize: '24px', fontWeight: 700, letterSpacing: '-0.02em', marginTop: '6px' }}>
              {empty ? `Welcome, ${getUserName(user)}` : `${getGreeting()}, ${getUserName(user)}`}
            </h1>
          </div>
          <button
            className="w-11 h-11 flex items-center justify-center rounded-lg"
            style={{ background: 'transparent', color: 'var(--tf-mute)' }}
            aria-label="Notifications"
          >
            <Bell size={20} />
          </button>
        </div>

        {/* ── Weekly progress card ── */}
        <div
          className="flex items-center gap-5 p-5 rounded-2xl mb-5"
          style={{ background: 'var(--tf-surface)', border: '1px solid var(--tf-line)' }}
        >
          {/* Progress ring (simplified) */}
          <div className="flex-shrink-0 w-20 h-20 rounded-full flex items-center justify-center" style={{ background: 'var(--tf-surface2)' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--tf-ink)' }}>
                {weeklyDone}
              </div>
              <div style={{ fontSize: '11px', color: 'var(--tf-mute)', fontWeight: 600 }}>
                /{weeklyGoal}
              </div>
            </div>
          </div>

          {/* Text */}
          <div className="flex-1">
            <p style={{ fontSize: '12px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--tf-accent)', marginBottom: '2px' }}>
              THIS WEEK
            </p>
            <p style={{ fontSize: '18px', fontWeight: 700, color: 'var(--tf-ink)', marginBottom: '3px' }}>
              {weeklyDone < weeklyGoal ? `${weeklyGoal - weeklyDone} to go` : 'Goal met!'}
            </p>
            <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--tf-mute)' }}>
              {streak}-day streak
            </p>
          </div>
        </div>

        {/* ── Stat row (3 cards) ── */}
        <div className="grid grid-cols-3 gap-3 mb-5">
          {/* Streak */}
          <div
            className="p-3 rounded-2xl flex flex-col gap-2"
            style={{ background: 'var(--tf-surface)', border: '1px solid var(--tf-line)' }}
          >
            <div className="w-9 h-9 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(249, 115, 22, 0.12)', color: 'var(--tf-accent)' }}>
              <Flame size={18} />
            </div>
            <div>
              <p style={{ fontSize: '11px', fontWeight: 600, color: 'var(--tf-mute)', marginBottom: '2px' }}>Streak</p>
              <p style={{ fontSize: '18px', fontWeight: 700, color: 'var(--tf-ink)' }}>{streak}</p>
              <p style={{ fontSize: '10px', fontWeight: 600, color: 'var(--tf-mute)' }}>days</p>
            </div>
          </div>

          {/* Volume */}
          <div
            className="p-3 rounded-2xl flex flex-col gap-2"
            style={{ background: 'var(--tf-surface)', border: '1px solid var(--tf-line)' }}
          >
            <div className="w-9 h-9 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(59, 130, 246, 0.12)', color: '#3b82f6' }}>
              <Zap size={18} />
            </div>
            <div>
              <p style={{ fontSize: '11px', fontWeight: 600, color: 'var(--tf-mute)', marginBottom: '2px' }}>Volume</p>
              <p style={{ fontSize: '18px', fontWeight: 700, color: 'var(--tf-ink)' }}>
                {isNaN(totalVol) ? '0.0' : (totalVol / 1000).toFixed(1)}
              </p>
              <p style={{ fontSize: '10px', fontWeight: 600, color: 'var(--tf-mute)' }}>K kg</p>
            </div>
          </div>

          {/* PRs */}
          <div
            className="p-3 rounded-2xl flex flex-col gap-2"
            style={{ background: 'var(--tf-surface)', border: '1px solid var(--tf-line)' }}
          >
            <div className="w-9 h-9 rounded-2xl flex items-center justify-center" style={{ background: 'rgba(34, 197, 94, 0.12)', color: 'var(--tf-good)' }}>
              <Star size={18} fill="currentColor" />
            </div>
            <div>
              <p style={{ fontSize: '11px', fontWeight: 600, color: 'var(--tf-mute)', marginBottom: '2px' }}>PRs</p>
              <p style={{ fontSize: '18px', fontWeight: 700, color: 'var(--tf-ink)' }}>
                {(lastSession?.prs || 0) || 0}
              </p>
            </div>
          </div>
        </div>

        {/* ── Today's plan hero (gradient card) ── */}
        <div className="mb-5">
          <p style={{ fontSize: '12px', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--tf-mute)', marginBottom: '8px' }}>
            {empty ? 'Recommended' : "Today's plan"}
          </p>
          <div
            className="p-5 rounded-2xl flex flex-col gap-4"
            style={{
              background: `linear-gradient(135deg, var(--tf-accent) 0%, var(--tf-accent2) 100%)`,
            }}
          >
            <div>
              <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--tf-accent-ink)', opacity: 0.7, marginBottom: '4px' }}>
                {SPLIT_SUBTITLES[todaySplit]}
              </p>
              <h2 style={{ fontSize: '26px', fontWeight: 700, color: 'var(--tf-accent-ink)', letterSpacing: '-0.02em' }}>
                {SPLIT_TITLES[todaySplit]}
              </h2>
            </div>

            <div style={{ display: 'flex', gap: '14px', fontSize: '13px', fontWeight: 700, color: 'var(--tf-accent-ink)', opacity: 0.85 }}>
              <span>{SPLIT_COUNTS[todaySplit]} exercises</span>
              <span>~52 min</span>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={handleStartTraining}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-2xl font-semibold transition-all"
                style={{
                  background: 'rgba(0, 0, 0, 0.15)',
                  color: 'var(--tf-accent-ink)',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '14px',
                  minHeight: '44px',
                }}
              >
                Start training →
              </button>
              <button
                onClick={handleEditSession}
                className="flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-2xl font-semibold transition-all"
                style={{
                  background: 'rgba(0, 0, 0, 0.1)',
                  color: 'var(--tf-accent-ink)',
                  border: 'none',
                  cursor: 'pointer',
                }}
                aria-label="Edit workout"
              >
                <Edit size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* ── Last session card ── */}
        {!empty && lastSession && (
          <div
            className="p-4 rounded-2xl flex justify-between items-center"
            style={{ background: 'var(--tf-surface)', border: '1px solid var(--tf-line)' }}
          >
            <div>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--tf-ink)' }}>
                {lastSession.title || 'Last Session'}
              </h3>
              <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--tf-mute)', marginTop: '4px' }}>
                {lastSession.weekday} · {lastSession.sets || 0} sets
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: '18px', fontWeight: 700, color: 'var(--tf-ink)', fontVariantNumeric: 'tabular-nums' }}>
                {isNaN(lastSession.volume) ? '0.0' : (lastSession.volume / 1000).toFixed(1)}
                <span style={{ fontSize: '11px', color: 'var(--tf-mute)', fontWeight: 600, marginLeft: '2px' }}>K kg</span>
              </p>
              {(lastSession.prs || 0) > 0 && (
                <p style={{ fontSize: '12px', color: 'var(--tf-good)', fontWeight: 700, marginTop: '4px' }}>
                  {lastSession.prs} PR{lastSession.prs > 1 ? 's' : ''}
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Bottom tab bar - static positioned */}
      <div
        className="fixed bottom-0 left-0 right-0 flex justify-around items-center py-4 px-6"
        style={{
          background: `linear-gradient(180deg, transparent 0%, var(--tf-bg) 40%)`,
          borderTop: '1px solid var(--tf-line2)',
          maxWidth: '100%',
        }}
      >
        <button
          onClick={() => {}}
          className="flex flex-col items-center gap-1 text-center"
          style={{ color: 'var(--tf-accent)', cursor: 'pointer', background: 'none', border: 'none', padding: '8px 16px' }}
        >
          <div style={{ fontSize: '18px' }}>🏠</div>
          <p style={{ fontSize: '11px', fontWeight: 600 }}>Home</p>
        </button>
        <button
          onClick={() => navigate('/train')}
          className="flex flex-col items-center gap-1 text-center"
          style={{ color: 'var(--tf-mute)', cursor: 'pointer', background: 'none', border: 'none', padding: '8px 16px' }}
        >
          <div style={{ fontSize: '18px' }}>🏋️</div>
          <p style={{ fontSize: '11px', fontWeight: 600 }}>Train</p>
        </button>
        <button
          onClick={() => navigate('/history')}
          className="flex flex-col items-center gap-1 text-center"
          style={{ color: 'var(--tf-mute)', cursor: 'pointer', background: 'none', border: 'none', padding: '8px 16px' }}
        >
          <div style={{ fontSize: '18px' }}>📊</div>
          <p style={{ fontSize: '11px', fontWeight: 600 }}>History</p>
        </button>
      </div>
    </div>
  );
}
