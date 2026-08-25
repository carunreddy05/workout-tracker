/**
 * Firestore helpers: data migration, calculations, PR detection
 * Single source of truth for volume/streak/PR logic (currently duplicated in 3 places)
 */

import type {
  Set,
  Exercise,
  Session,
  LegacyGymEntry,
} from '@/types/WorkoutEntry';
import { format } from 'date-fns';
import { toDateKey, parseDateKey, isDateKeyInWeek } from './week';
import { calcSetVolume, isBodyweightOnly } from './exerciseMeasurement';

/**
 * Parse legacy "weight@reps" string format into typed Set objects
 */
export function parseSetString(setStr: string): Omit<Set, 'done' | 'pr' | 'skipped'> | null {
  // Try formats: "80@10", "80 @ 10", "80 x 10", etc.
  const match = setStr.match(/(\d+(?:\.\d+)?)\s*[@x×]\s*(\d+)/i);
  if (!match) return null;
  return {
    w: parseFloat(match[1]),
    r: parseInt(match[2], 10),
  };
}

/**
 * Convert legacy sets array ["80@10", "85@8"] to typed Set[] (all marked done)
 */
export function parseSets(legacySetStrings: string[]): Set[] {
  return legacySetStrings
    .map(str => {
      const parsed = parseSetString(str);
      return parsed ? { ...parsed, done: true, pr: false } : null;
    })
    .filter((s): s is Set => s !== null);
}

/**
 * Convert legacy GymEntry to typed Session (for backward compatibility)
 * Assumes the entry came from a past session already stored in Firestore
 */
export function migrateEntry(
  id: string,
  legacy: LegacyGymEntry,
  userId: string
): Session | null {
  // Parse dateDay format: "2026-06-02 - Tuesday". The date portion is the
  // part that matters for counting/grouping — a missing or malformed
  // weekday label used to drop the whole session (undercounting weekly
  // totals); now it's derived from the date instead of discarding the entry.
  const [dateStr, weekdayStr] = (legacy.dateDay || '').split(' - ');
  const parsedDate = dateStr ? parseDateKey(dateStr) : null;
  if (!dateStr || !parsedDate || Number.isNaN(parsedDate.getTime())) return null;

  const weekday = weekdayStr ? weekdayStr.substring(0, 3) : format(parsedDate, 'EEE');

  const exercises: Exercise[] = (legacy.exercises || []).map((ex: any) => ({
    name: ex.name,
    focus: '',
    kind: '',
    targetSets: ex.sets?.length || 0,
    lastWeight: 0,
    lastReps: 10,
    sets: parseSets(ex.sets || []),
  }));

  const doneSets = exercises.flatMap(ex => ex.sets.filter(s => s.done));
  const volume = exercises.reduce(
    (sum, ex) => sum + ex.sets.filter(s => s.done).reduce((s, set) => s + calcSetVolume(ex.name, set.w, set.r), 0),
    0
  );
  const prs = doneSets.filter(s => s.pr).length;

  return {
    id,
    userId,
    date: dateStr,
    weekday,
    title: legacy.workoutType,
    split: mapWorkoutTypeToSplit(legacy.workoutType),
    durationMin: 60, // estimate if not stored
    sets: doneSets.length,
    volume,
    prs,
    exercises,
    notes: legacy.notes,
  };
}

/**
 * Map workoutType strings to normalized split ids
 */
export function mapWorkoutTypeToSplit(
  workoutType: string
): "push" | "pull" | "legs" | "core" {
  const map: Record<string, "push" | "pull" | "legs" | "core"> = {
    'Chest/Triceps': 'push',
    'Back/Biceps': 'pull',
    'Legs': 'legs',
    'Core': 'core',
    'Shoulders': 'push', // default to push
  };
  return map[workoutType] || 'push';
}

/**
 * Calculate volume (weight × reps) for a session
 * Single source of truth (currently computed in Dashboard, History, Detail independently)
 */
export function calculateVolume(session: Session): number {
  return session.exercises.reduce((sum, ex) => {
    const exVolume = ex.sets
      .filter(s => s.done)
      .reduce((ssum, s) => ssum + calcSetVolume(ex.name, s.w, s.r), 0);
    return sum + exVolume;
  }, 0);
}

/**
 * Detect PRs by comparing each set against historical best for that exercise
 * Modifies session in-place, setting pr:true on new personal records
 */
export function detectPRs(session: Session, pastSessions: Session[]): Session {
  const exerciseHistory = new Map<string, { maxWeight: number; maxReps: number; maxVolume: number }>();

  // Build historical record of each exercise. For bodyweight exercises,
  // volume is always 0 (see calcSetVolume), so rank by reps instead —
  // otherwise a bodyweight exercise could never register a PR.
  for (const past of pastSessions) {
    for (const ex of past.exercises) {
      const bodyweightOnly = isBodyweightOnly(ex.name);
      const doneSetsSorted = [...ex.sets.filter(s => s.done)].sort((a, b) =>
        bodyweightOnly ? b.r - a.r : calcSetVolume(ex.name, b.w, b.r) - calcSetVolume(ex.name, a.w, a.r)
      );
      if (doneSetsSorted.length > 0) {
        const best = doneSetsSorted[0];
        exerciseHistory.set(ex.name, {
          maxWeight: best.w,
          maxReps: best.r,
          maxVolume: calcSetVolume(ex.name, best.w, best.r),
        });
      }
    }
  }

  // Check current session for PRs
  for (const ex of session.exercises) {
    const history = exerciseHistory.get(ex.name);
    const bodyweightOnly = isBodyweightOnly(ex.name);
    for (const set of ex.sets) {
      if (!set.done) continue;
      if (bodyweightOnly) {
        set.pr = !history || set.r > history.maxReps;
        continue;
      }
      const volume = calcSetVolume(ex.name, set.w, set.r);
      set.pr =
        !history ||
        volume > history.maxVolume ||
        (volume === history.maxVolume && set.w > history.maxWeight);
    }
  }

  return session;
}

/**
 * Calculate active streak: count consecutive days backward from today with at least one session
 * (Only counts done sessions in the current date; partial sessions don't break the streak)
 */
export function calculateStreak(sessions: Session[]): number {
  if (sessions.length === 0) return 0;

  const sessionDates = new Set(sessions.map(s => s.date));
  let streak = 0;
  let checkDate = new Date();

  while (true) {
    const dateStr = toDateKey(checkDate);
    if (sessionDates.has(dateStr)) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}

/**
 * Count sessions in the current calendar week (Sunday 12:00 AM local ->
 * Saturday 11:59:59 PM local). This must stay the one definition of "week"
 * — every feature that shows a weekly count should call this rather than
 * recomputing its own window (a rolling 7-day window is NOT the same thing
 * and was the source of a real Home-vs-History inconsistency bug).
 */
export function sessionCountThisWeek(sessions: Session[], referenceDate: Date = new Date()): number {
  return sessions.filter(s => isDateKeyInWeek(s.date, referenceDate)).length;
}

/**
 * Split library: canonical exercises for each split
 * (Extracted from WorkoutEntry.tsx guidedExerciseLibrary)
 */
export const SPLIT_LIBRARY = {
  push: [
    { name: 'Incline Chest Press', focus: 'Upper Chest', kind: 'Compound', defWeight: 22.5, defReps: 10 },
    { name: 'Flat Chest Press', focus: 'Mid Chest', kind: 'Compound', defWeight: 25, defReps: 10 },
    { name: 'Shoulder Press', focus: 'Front Delts', kind: 'Compound', defWeight: 18, defReps: 10 },
    { name: 'Lateral Raise', focus: 'Side Delts', kind: 'Isolation', defWeight: 8, defReps: 14 },
    { name: 'Triceps Pushdown', focus: 'Triceps', kind: 'Isolation', defWeight: 22.5, defReps: 12 },
    { name: 'Overhead Triceps Ext', focus: 'Triceps', kind: 'Isolation', defWeight: 16, defReps: 12 },
  ],
  pull: [
    { name: 'Lat Pulldown', focus: 'Lats', kind: 'Compound', defWeight: 60, defReps: 12 },
    { name: 'Chest Supported Row', focus: 'Mid Back', kind: 'Compound', defWeight: 50, defReps: 10 },
    { name: 'Single Arm Pulldown', focus: 'Lower Lats', kind: 'Compound', defWeight: 25, defReps: 10 },
    { name: 'Face Pull', focus: 'Rear Delts', kind: 'Isolation', defWeight: 20, defReps: 15 },
    { name: 'Hammer Curl', focus: 'Biceps', kind: 'Isolation', defWeight: 14, defReps: 12 },
    { name: 'Incline DB Curl', focus: 'Biceps', kind: 'Isolation', defWeight: 12, defReps: 10 },
  ],
  legs: [
    { name: 'Back Squat', focus: 'Quads', kind: 'Compound', defWeight: 100, defReps: 6 },
    { name: 'Leg Press', focus: 'Quads', kind: 'Compound', defWeight: 160, defReps: 12 },
    { name: 'Romanian Deadlift', focus: 'Hamstrings', kind: 'Compound', defWeight: 80, defReps: 8 },
    { name: 'Seated Leg Curl', focus: 'Hamstrings', kind: 'Isolation', defWeight: 45, defReps: 12 },
    { name: 'Bulgarian Split Squat', focus: 'Glutes', kind: 'Compound', defWeight: 16, defReps: 10 },
    { name: 'Calf Raise', focus: 'Calves', kind: 'Isolation', defWeight: 90, defReps: 15 },
  ],
  core: [
    { name: 'Cable Crunch', focus: 'Upper Abs', kind: 'Isolation', defWeight: 35, defReps: 12 },
    { name: 'Hanging Knee Raise', focus: 'Lower Abs', kind: 'Stability', defWeight: 0, defReps: 12 },
    { name: 'Reverse Crunch', focus: 'Lower Abs', kind: 'Isolation', defWeight: 0, defReps: 15 },
    { name: 'Pallof Press', focus: 'Obliques', kind: 'Stability', defWeight: 15, defReps: 12 },
    { name: 'Dead Bug', focus: 'Deep Core', kind: 'Stability', defWeight: 0, defReps: 10 },
  ],
};
