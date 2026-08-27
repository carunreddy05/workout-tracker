import { describe, it, expect } from 'vitest';
import { creditedDaysInWeek, calculateWeeklyGoalStreak } from './streak';
import { parseDateKey } from './week';
import type { Session } from '@/types/WorkoutEntry';

function makeSession(date: string): Session {
  return {
    id: date,
    userId: 'u1',
    date,
    weekday: 'Mon',
    title: 'Push',
    split: 'push',
    durationMin: 45,
    sets: 0,
    volume: 0,
    prs: 0,
    exercises: [],
  };
}

// Reference: Tuesday 2026-08-25, week of Aug 23 (Sun) - Aug 29 (Sat).
const reference = parseDateKey('2026-08-25');

describe('creditedDaysInWeek', () => {
  it('is 0 with no sessions', () => {
    expect(creditedDaysInWeek([], reference)).toBe(0);
  });

  it('counts distinct days within the week', () => {
    const sessions = [makeSession('2026-08-23'), makeSession('2026-08-24'), makeSession('2026-08-25')];
    expect(creditedDaysInWeek(sessions, reference)).toBe(3);
  });

  it('caps multiple same-day workouts at one credit (PRD §14 goal-credit rule)', () => {
    const sessions = [makeSession('2026-08-25'), makeSession('2026-08-25'), makeSession('2026-08-25')];
    expect(creditedDaysInWeek(sessions, reference)).toBe(1);
  });

  it('ignores sessions outside the week', () => {
    const sessions = [makeSession('2026-08-16'), makeSession('2026-08-30')];
    expect(creditedDaysInWeek(sessions, reference)).toBe(0);
  });
});

describe('calculateWeeklyGoalStreak', () => {
  const weeklyGoal = 4;

  it('is 0 with no sessions', () => {
    expect(calculateWeeklyGoalStreak([], weeklyGoal, reference)).toBe(0);
  });

  it('counts the current week if it already met the goal, plus consecutive prior weeks', () => {
    const sessions = [
      // current week: Aug 23-29, 4 distinct days
      ...['2026-08-23', '2026-08-24', '2026-08-25', '2026-08-26'].map(makeSession),
      // prior week: Aug 16-22, 4 distinct days
      ...['2026-08-16', '2026-08-17', '2026-08-18', '2026-08-19'].map(makeSession),
      // two weeks prior: Aug 9-15, 5 distinct days (>4 still counts as met)
      ...['2026-08-09', '2026-08-10', '2026-08-11', '2026-08-12', '2026-08-13'].map(makeSession),
    ];
    expect(calculateWeeklyGoalStreak(sessions, weeklyGoal, reference)).toBe(3);
  });

  it('an in-progress current week that has not yet met the goal does not break the streak', () => {
    const sessions = [
      // current week: only 1 day so far, goal not met yet
      makeSession('2026-08-25'),
      // prior 3 weeks all met the goal
      ...['2026-08-16', '2026-08-17', '2026-08-18', '2026-08-19'].map(makeSession),
      ...['2026-08-09', '2026-08-10', '2026-08-11', '2026-08-12'].map(makeSession),
      ...['2026-08-02', '2026-08-03', '2026-08-04', '2026-08-05'].map(makeSession),
    ];
    expect(calculateWeeklyGoalStreak(sessions, weeklyGoal, reference)).toBe(3);
  });

  it('a genuinely failed prior week stops the streak there', () => {
    const sessions = [
      // current week not met
      makeSession('2026-08-25'),
      // prior week (Aug 16-22) only 1 day — failed
      makeSession('2026-08-18'),
      // two weeks back met goal, but streak should not reach it
      ...['2026-08-09', '2026-08-10', '2026-08-11', '2026-08-12'].map(makeSession),
    ];
    expect(calculateWeeklyGoalStreak(sessions, weeklyGoal, reference)).toBe(0);
  });

  it('exactly meeting the goal (4/4) counts the same as exceeding it', () => {
    const sessions = ['2026-08-23', '2026-08-24', '2026-08-25', '2026-08-26'].map(makeSession);
    expect(calculateWeeklyGoalStreak(sessions, weeklyGoal, reference)).toBe(1);
  });
});
