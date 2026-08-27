/**
 * Weekly-goal consistency streak (PRD §14) — deliberately isolated from
 * week.ts and firestore.ts's existing daily calculateStreak(), which is a
 * different, older metric (consecutive calendar DAYS with a session) still
 * used by the web Dashboard. This is the new streak definition for V1
 * mobile: consecutive WEEKS where the weekly goal was met.
 *
 * "For consistency purposes, default to a maximum of one workout-goal
 * credit per calendar day" (PRD §14) is intentionally its own function
 * (creditedDaysInWeek) rather than inlined, per the PRD's explicit request
 * to keep the goal-credit rule isolated and changeable later.
 */

import type { Session } from '../types/WorkoutEntry';
import { getWeekBounds, isDateKeyInWeek } from './week';

/**
 * Number of distinct calendar days with at least one session in the
 * calendar week containing `referenceDate`. Multiple workouts on the same
 * day still each appear in History/analytics — they just don't inflate
 * this count past 1 for that day.
 */
export function creditedDaysInWeek(sessions: Session[], referenceDate: Date = new Date()): number {
  const dateKeys = new Set(sessions.filter(s => isDateKeyInWeek(s.date, referenceDate)).map(s => s.date));
  return dateKeys.size;
}

/**
 * Consecutive weeks (most recent backward) where creditedDaysInWeek met
 * weeklyGoal. The week containing `referenceDate` is only counted if it has
 * ALREADY met the goal; if it hasn't (yet), that does not break or zero the
 * streak — per PRD §14, "the current week should not break the streak
 * until the week has ended". A genuine shortfall in any fully-elapsed prior
 * week stops the count there.
 */
export function calculateWeeklyGoalStreak(
  sessions: Session[],
  weeklyGoal: number,
  referenceDate: Date = new Date()
): number {
  if (weeklyGoal <= 0) return 0;

  let streak = 0;
  let cursor = referenceDate;
  let isCurrentWeek = true;

  while (true) {
    const met = creditedDaysInWeek(sessions, cursor) >= weeklyGoal;

    if (isCurrentWeek) {
      isCurrentWeek = false;
      if (met) streak += 1;
      // Not met yet: skip without breaking, since the week isn't over.
    } else {
      if (!met) break;
      streak += 1;
    }

    const { start } = getWeekBounds(cursor);
    const previousWeekDate = new Date(start);
    previousWeekDate.setDate(previousWeekDate.getDate() - 1); // last day of the prior week
    cursor = previousWeekDate;
  }

  return streak;
}
