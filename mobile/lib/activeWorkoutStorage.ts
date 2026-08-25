import AsyncStorage from '@react-native-async-storage/async-storage';
import { todayKey } from '../../src/utils/week';

/**
 * Local-first active-workout persistence (PRD §21: "an active workout must
 * never depend on continuous connectivity" and must survive backgrounding,
 * screen lock, and accidental termination).
 *
 * This is intentionally the only piece of Train-screen infrastructure built
 * in the mobile foundation phase — the actual Start/Continue Workout UI is
 * "Core product" (PRD Days 5-7), not foundation. What's here just needs to
 * durably hold workout-in-progress state across app restarts; nothing reads
 * or writes it yet outside this module's own round-trip.
 */

export interface ActiveWorkoutSet {
  w: number;
  r: number;
  done: boolean;
}

export interface ActiveWorkoutExercise {
  name: string;
  focus: string;
  kind: string;
  sets: ActiveWorkoutSet[];
}

export interface ActiveWorkout {
  /** Local-only identifier; not a Firestore doc id until synced. */
  localId: string;
  /** Local calendar date the workout belongs to ("yyyy-MM-dd"). */
  date: string;
  /** ISO timestamp of when the workout was started, for duration display. */
  startedAtIso: string;
  /** User's optional split choice (SW-3: the user may skip this entirely). */
  splitLabel?: string;
  exercises: ActiveWorkoutExercise[];
  /**
   * 'active': still being trained. 'pendingSync': user tapped Finish while
   * offline (or before a sync completed) — must be retried until it reaches
   * Firestore, never silently dropped.
   */
  status: 'active' | 'pendingSync';
}

const STORAGE_KEY = 'gymtracker.activeWorkout.v1';

function generateLocalId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

/** Constructs a new empty active workout anchored to today's local date. */
export function createActiveWorkout(splitLabel?: string): ActiveWorkout {
  return {
    localId: generateLocalId(),
    date: todayKey(),
    startedAtIso: new Date().toISOString(),
    splitLabel,
    exercises: [],
    status: 'active',
  };
}

export async function saveActiveWorkout(workout: ActiveWorkout): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(workout));
}

export async function loadActiveWorkout(): Promise<ActiveWorkout | null> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as ActiveWorkout;
  } catch {
    // Corrupted record shouldn't crash the app on launch — treat as no
    // active workout rather than throwing during startup.
    return null;
  }
}

export async function clearActiveWorkout(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY);
}
