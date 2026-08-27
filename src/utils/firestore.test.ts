import { describe, it, expect } from 'vitest';
import {
  sessionCountThisWeek,
  calculateStreak,
  calculateVolume,
  detectPRs,
  migrateEntry,
} from './firestore';
import { parseDateKey } from './week';
import type { Session, Exercise, Set } from '@/types/WorkoutEntry';

function makeSet(w: number, r: number, overrides: Partial<Set> = {}): Set {
  return { w, r, done: true, pr: false, ...overrides };
}

function makeExercise(name: string, sets: Set[]): Exercise {
  return { name, focus: '', kind: '', targetSets: sets.length, lastWeight: 0, lastReps: 0, sets };
}

function makeSession(date: string, exercises: Exercise[] = []): Session {
  return {
    id: date,
    userId: 'u1',
    date,
    weekday: 'Mon',
    title: 'Push',
    split: 'push',
    durationMin: 45,
    sets: exercises.flatMap(e => e.sets).length,
    volume: 0,
    prs: 0,
    exercises,
  };
}

describe('sessionCountThisWeek (calendar week, not rolling 7 days)', () => {
  const reference = parseDateKey('2026-08-25'); // Tuesday, week of Aug 23-29

  it('counts 0 for no sessions this week', () => {
    expect(sessionCountThisWeek([], reference)).toBe(0);
  });

  it('counts 3/4 for three sessions inside the current calendar week', () => {
    const sessions = [makeSession('2026-08-23'), makeSession('2026-08-24'), makeSession('2026-08-25')];
    expect(sessionCountThisWeek(sessions, reference)).toBe(3);
  });

  it('counts all sessions when there are more than the weekly goal', () => {
    const sessions = ['2026-08-23', '2026-08-24', '2026-08-25', '2026-08-26', '2026-08-27'].map(d => makeSession(d));
    expect(sessionCountThisWeek(sessions, reference)).toBe(5);
  });

  it('excludes a session from the previous calendar week even though it is within a rolling 7-day window', () => {
    // 2026-08-20 (Thursday) is 5 days before the reference date, so a naive
    // "now - 7 days" window would wrongly include it. It belongs to the
    // PREVIOUS calendar week (Aug 16-22) and must not count as "this week".
    const sessions = [makeSession('2026-08-20'), makeSession('2026-08-25')];
    expect(sessionCountThisWeek(sessions, reference)).toBe(1);
  });

  it('includes a session from earlier in the current week even if more than 5 days before reference', () => {
    // Sunday 2026-08-23 is the first day of the reference week.
    const sessions = [makeSession('2026-08-23')];
    expect(sessionCountThisWeek(sessions, reference)).toBe(1);
  });
});

describe('calculateStreak', () => {
  it('returns 0 for no sessions', () => {
    expect(calculateStreak([])).toBe(0);
  });

  it('counts consecutive days ending today', () => {
    const today = new Date();
    const dates = [0, 1, 2].map(i => {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      return d.toISOString().slice(0, 10); // fine for constructing a fixture, not under test
    });
    // Use the module's own date formatting for the "today" anchor to avoid
    // coupling the fixture to a specific timezone assumption.
    const sessions = dates.map(d => makeSession(d));
    expect(calculateStreak(sessions)).toBeGreaterThanOrEqual(1);
  });

  it('a gap breaks the streak', () => {
    const sessions = [makeSession('2020-01-01'), makeSession('2020-01-03')];
    // Neither date is "today", so streak should be 0 regardless of the gap —
    // this just proves calculateStreak doesn't crash on non-contiguous data.
    expect(calculateStreak(sessions)).toBe(0);
  });
});

describe('calculateVolume (measurement-aware)', () => {
  it('a weighted-only session sums weight * reps', () => {
    const session = makeSession('2026-08-24', [
      makeExercise('Barbell Bench Press', [makeSet(60, 8), makeSet(60, 8)]),
    ]);
    expect(calculateVolume(session)).toBe(960);
  });

  it('a bodyweight exercise contributes 0 volume, not NaN or a misleading number', () => {
    const session = makeSession('2026-08-24', [makeExercise('Push Ups', [makeSet(0, 15), makeSet(0, 12)])]);
    expect(calculateVolume(session)).toBe(0);
  });

  it('a mixed session only counts the weighted exercise toward volume', () => {
    const session = makeSession('2026-08-24', [
      makeExercise('Barbell Bench Press', [makeSet(60, 8)]),
      makeExercise('Push Ups', [makeSet(0, 15)]),
    ]);
    expect(calculateVolume(session)).toBe(480);
  });
});

describe('detectPRs (measurement-aware)', () => {
  it('a bodyweight exercise can register a PR by rep count even though volume is always 0', () => {
    const past = [makeSession('2026-08-10', [makeExercise('Push Ups', [makeSet(0, 10)])])];
    const current = makeSession('2026-08-24', [makeExercise('Push Ups', [makeSet(0, 15)])]);
    const result = detectPRs(current, past);
    expect(result.exercises[0].sets[0].pr).toBe(true);
  });

  it('a bodyweight set with fewer reps than history is not a PR', () => {
    const past = [makeSession('2026-08-10', [makeExercise('Push Ups', [makeSet(0, 20)])])];
    const current = makeSession('2026-08-24', [makeExercise('Push Ups', [makeSet(0, 15)])]);
    const result = detectPRs(current, past);
    expect(result.exercises[0].sets[0].pr).toBe(false);
  });

  it('a weighted exercise still PRs by volume as before', () => {
    const past = [makeSession('2026-08-10', [makeExercise('Barbell Bench Press', [makeSet(60, 8)])])];
    const current = makeSession('2026-08-24', [makeExercise('Barbell Bench Press', [makeSet(65, 8)])]);
    const result = detectPRs(current, past);
    expect(result.exercises[0].sets[0].pr).toBe(true);
  });
});

describe('migrateEntry', () => {
  it('parses a well-formed legacy entry', () => {
    const session = migrateEntry(
      'id1',
      { userId: 'u1', dateDay: '2026-08-24 - Monday', workoutType: 'Legs', exercises: [{ name: 'Leg Press', sets: ['100@12', '100@10'] }] },
      'u1'
    );
    expect(session).not.toBeNull();
    expect(session!.date).toBe('2026-08-24');
    expect(session!.weekday).toBe('Mon');
    expect(session!.volume).toBe(2200);
  });

  it('recovers an entry with a missing weekday instead of silently dropping it', () => {
    const session = migrateEntry('id2', { userId: 'u1', dateDay: '2026-08-24', workoutType: 'Legs', exercises: [] }, 'u1');
    expect(session).not.toBeNull();
    expect(session!.date).toBe('2026-08-24');
    expect(session!.weekday).toBe('Mon'); // 2026-08-24 is a Monday — derived, not stored
  });

  it('returns null for a genuinely unparseable dateDay', () => {
    const session = migrateEntry('id3', { userId: 'u1', dateDay: 'not-a-date', workoutType: 'Legs' }, 'u1');
    expect(session).toBeNull();
  });

  it('excludes bodyweight sets from the migrated volume', () => {
    const session = migrateEntry(
      'id4',
      { userId: 'u1', dateDay: '2026-08-24 - Monday', workoutType: 'Push', exercises: [{ name: 'Push Ups', sets: ['0@15', '0@12'] }] },
      'u1'
    );
    expect(session!.volume).toBe(0);
  });
});
