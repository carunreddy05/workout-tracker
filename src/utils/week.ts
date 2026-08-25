/**
 * Single source of truth for local-calendar-date parsing and week boundaries.
 *
 * Why this file exists: `new Date("2026-08-24")` parses the string as UTC
 * midnight, not local midnight. For any timezone west of UTC that renders as
 * the previous local day; for timezones east of UTC, taking a local Date and
 * converting it back to a "yyyy-MM-dd" key via `.toISOString()` has the
 * opposite failure mode. Both bugs are real in this codebase (see
 * sessionCountThisWeek / calculateStreak in firestore.ts) and both are fixed
 * by routing every local-date <-> string conversion through this module.
 */

import { parseISO, format, startOfWeek, endOfWeek, isWithinInterval } from 'date-fns';

/** A date key in "yyyy-MM-dd" form, always interpreted as a *local* calendar date. */
export type DateKey = string;

/**
 * Parse a "yyyy-MM-dd" date key as local midnight.
 * Do NOT use `new Date(dateKey)` for this — it parses as UTC midnight and
 * silently shifts the calendar date for any non-UTC timezone.
 */
export function parseDateKey(dateKey: DateKey): Date {
  return parseISO(dateKey);
}

/**
 * Format a Date as a "yyyy-MM-dd" key using its LOCAL calendar date.
 * Do NOT use `date.toISOString().split('T')[0]` for this — toISOString
 * converts to UTC first, which shifts the date for timezones east of UTC.
 */
export function toDateKey(date: Date): DateKey {
  return format(date, 'yyyy-MM-dd');
}

/** Today's date key in local time. */
export function todayKey(): DateKey {
  return toDateKey(new Date());
}

/**
 * Calendar-week bounds (Sunday 00:00:00.000 local -> Saturday 23:59:59.999
 * local) containing `referenceDate`. This is the one definition of "week"
 * every feature (Home, History, activity calendar, streak, notifications)
 * must share — do not recompute week boundaries locally in a component.
 */
export function getWeekBounds(referenceDate: Date = new Date()): { start: Date; end: Date } {
  return {
    start: startOfWeek(referenceDate, { weekStartsOn: 0 }),
    end: endOfWeek(referenceDate, { weekStartsOn: 0 }),
  };
}

/** True if `dateKey` falls within the calendar week containing `referenceDate`. */
export function isDateKeyInWeek(dateKey: DateKey, referenceDate: Date = new Date()): boolean {
  const { start, end } = getWeekBounds(referenceDate);
  return isWithinInterval(parseDateKey(dateKey), { start, end });
}
