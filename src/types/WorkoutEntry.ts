/**
 * Direction C — Typed workout data model
 * Replacing string-encoded sets with structured per-set tracking
 */

export interface Set {
  w: number;
  r: number;
  done: boolean;
  pr: boolean;
  skipped?: boolean;
}

export interface Exercise {
  name: string;
  focus: string;        // e.g., "Upper Chest", "Lats"
  kind: string;         // e.g., "Compound", "Isolation"
  targetSets: number;
  lastWeight: number;
  lastReps: number;
  sets: Set[];
}

export interface Session {
  id: string;                    // Firestore doc id
  userId: string;
  date: string;                  // "yyyy-MM-dd"
  weekday: string;               // "Mon", "Tue", etc.
  title: string;                 // e.g., "Push", "Legs"
  split: "push" | "pull" | "legs" | "core";
  durationMin: number;
  sets: number;                  // total sets logged
  volume: number;                // sum of weight × reps
  prs: number;                   // count of PR sets
  exercises: Exercise[];
  notes?: string;
}

export interface Profile {
  userId: string;
  goals?: string[];
  units?: { weight: "kg" | "lbs"; distance: "km" | "mi" };
  weeklySessionGoal?: number;    // target sessions per week
  restTimerSeconds?: number;     // default rest time (60/90/120)
  onboardingCompleted: boolean;
}

/**
 * Legacy format (still in Firestore for backward compatibility)
 * Sets are encoded as "weight@reps" strings
 */
export interface LegacyGymEntry {
  userId: string;
  dateDay: string;                              // "yyyy-MM-dd - EEEE"
  weight?: number;
  workoutType: string;                          // "Chest/Triceps", "Back/Biceps", etc.
  exercises?: { name: string; sets: string[] }[]; // sets are "80@10" format
  cardio?: { incline?: string; speed?: string; time?: string };
  notes?: string;
}
