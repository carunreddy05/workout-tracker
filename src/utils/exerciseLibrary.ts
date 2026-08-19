/**
 * Comprehensive exercise library organized by muscle groups
 * Used by Train.tsx and WorkoutEntry.tsx for exercise selection
 */

export interface LibraryExercise {
  name: string;
  focus: string;           // e.g., "Upper Chest", "Lats"
  kind: string;            // e.g., "Compound", "Isolation"
  defWeight: number;       // default weight in kg
  defReps: number;         // default reps
}

export const EXERCISE_LIBRARY: Record<string, LibraryExercise[]> = {
  chest: [
    { name: 'Barbell Bench Press', focus: 'Mid Chest', kind: 'Compound', defWeight: 60, defReps: 8 },
    { name: 'Incline Barbell Bench', focus: 'Upper Chest', kind: 'Compound', defWeight: 50, defReps: 8 },
    { name: 'Decline Bench Press', focus: 'Lower Chest', kind: 'Compound', defWeight: 60, defReps: 8 },
    { name: 'Dumbbell Bench Press', focus: 'Mid Chest', kind: 'Compound', defWeight: 30, defReps: 10 },
    { name: 'Incline Dumbbell Press', focus: 'Upper Chest', kind: 'Compound', defWeight: 25, defReps: 10 },
    { name: 'Chest Fly Machine', focus: 'Mid Chest', kind: 'Isolation', defWeight: 40, defReps: 12 },
    { name: 'Dumbbell Fly', focus: 'Mid Chest', kind: 'Isolation', defWeight: 20, defReps: 12 },
    { name: 'Cable Chest Fly', focus: 'Mid Chest', kind: 'Isolation', defWeight: 25, defReps: 12 },
    { name: 'Push Ups', focus: 'Mid Chest', kind: 'Compound', defWeight: 0, defReps: 15 },
  ],
  back: [
    { name: 'Barbell Deadlift', focus: 'Full Back', kind: 'Compound', defWeight: 100, defReps: 5 },
    { name: 'Bent Over Barbell Row', focus: 'Mid Back', kind: 'Compound', defWeight: 80, defReps: 6 },
    { name: 'Lat Pulldown', focus: 'Lats', kind: 'Compound', defWeight: 60, defReps: 10 },
    { name: 'Chest Supported Row', focus: 'Mid Back', kind: 'Compound', defWeight: 50, defReps: 8 },
    { name: 'Single Arm Cable Row', focus: 'Lats', kind: 'Compound', defWeight: 35, defReps: 10 },
    { name: 'Machine Row', focus: 'Mid Back', kind: 'Compound', defWeight: 70, defReps: 8 },
    { name: 'Seal Row', focus: 'Mid Back', kind: 'Compound', defWeight: 45, defReps: 10 },
    { name: 'Face Pull', focus: 'Rear Delts', kind: 'Isolation', defWeight: 15, defReps: 15 },
    { name: 'Dumbbell Row', focus: 'Lats', kind: 'Compound', defWeight: 35, defReps: 8 },
  ],
  shoulders: [
    { name: 'Barbell Shoulder Press', focus: 'Shoulders', kind: 'Compound', defWeight: 50, defReps: 8 },
    { name: 'Dumbbell Shoulder Press', focus: 'Shoulders', kind: 'Compound', defWeight: 25, defReps: 10 },
    { name: 'Machine Shoulder Press', focus: 'Shoulders', kind: 'Compound', defWeight: 60, defReps: 10 },
    { name: 'Lateral Raise', focus: 'Side Delts', kind: 'Isolation', defWeight: 10, defReps: 12 },
    { name: 'Front Dumbbell Raise', focus: 'Front Delts', kind: 'Isolation', defWeight: 10, defReps: 12 },
    { name: 'Reverse Pec Deck', focus: 'Rear Delts', kind: 'Isolation', defWeight: 35, defReps: 12 },
    { name: 'Shoulder Shrug', focus: 'Traps', kind: 'Isolation', defWeight: 80, defReps: 8 },
    { name: 'Machine Lateral Raise', focus: 'Side Delts', kind: 'Isolation', defWeight: 40, defReps: 12 },
  ],
  biceps: [
    { name: 'Barbell Curl', focus: 'Biceps', kind: 'Compound', defWeight: 30, defReps: 8 },
    { name: 'Dumbbell Curl', focus: 'Biceps', kind: 'Compound', defWeight: 15, defReps: 10 },
    { name: 'Hammer Curl', focus: 'Biceps', kind: 'Isolation', defWeight: 15, defReps: 10 },
    { name: 'Incline Dumbbell Curl', focus: 'Biceps', kind: 'Isolation', defWeight: 12, defReps: 10 },
    { name: 'Preacher Curl', focus: 'Biceps', kind: 'Isolation', defWeight: 25, defReps: 8 },
    { name: 'Cable Curl', focus: 'Biceps', kind: 'Isolation', defWeight: 20, defReps: 12 },
    { name: 'Machine Curl', focus: 'Biceps', kind: 'Isolation', defWeight: 40, defReps: 10 },
  ],
  triceps: [
    { name: 'Triceps Pushdown', focus: 'Triceps', kind: 'Isolation', defWeight: 25, defReps: 12 },
    { name: 'Overhead Triceps Extension', focus: 'Triceps', kind: 'Isolation', defWeight: 20, defReps: 10 },
    { name: 'Dips', focus: 'Triceps', kind: 'Compound', defWeight: 0, defReps: 8 },
    { name: 'Close Grip Bench Press', focus: 'Triceps', kind: 'Compound', defWeight: 50, defReps: 8 },
    { name: 'Skull Crushers', focus: 'Triceps', kind: 'Isolation', defWeight: 20, defReps: 10 },
    { name: 'Rope Pushdown', focus: 'Triceps', kind: 'Isolation', defWeight: 25, defReps: 12 },
  ],
  quads: [
    { name: 'Barbell Back Squat', focus: 'Quads', kind: 'Compound', defWeight: 80, defReps: 6 },
    { name: 'Barbell Front Squat', focus: 'Quads', kind: 'Compound', defWeight: 60, defReps: 8 },
    { name: 'Leg Press', focus: 'Quads', kind: 'Compound', defWeight: 200, defReps: 10 },
    { name: 'Hack Squat', focus: 'Quads', kind: 'Compound', defWeight: 120, defReps: 8 },
    { name: 'Leg Extension', focus: 'Quads', kind: 'Isolation', defWeight: 60, defReps: 12 },
    { name: 'Smith Machine Squat', focus: 'Quads', kind: 'Compound', defWeight: 80, defReps: 8 },
  ],
  hamstrings: [
    { name: 'Romanian Deadlift', focus: 'Hamstrings', kind: 'Compound', defWeight: 80, defReps: 8 },
    { name: 'Lying Leg Curl', focus: 'Hamstrings', kind: 'Isolation', defWeight: 60, defReps: 10 },
    { name: 'Seated Leg Curl', focus: 'Hamstrings', kind: 'Isolation', defWeight: 50, defReps: 10 },
    { name: 'Standing Leg Curl', focus: 'Hamstrings', kind: 'Isolation', defWeight: 30, defReps: 12 },
    { name: 'Nordic Curl', focus: 'Hamstrings', kind: 'Compound', defWeight: 0, defReps: 6 },
  ],
  glutes: [
    { name: 'Bulgarian Split Squat', focus: 'Glutes', kind: 'Compound', defWeight: 30, defReps: 8 },
    { name: 'Hip Thrust', focus: 'Glutes', kind: 'Compound', defWeight: 100, defReps: 8 },
    { name: 'Smith Machine Hip Thrust', focus: 'Glutes', kind: 'Compound', defWeight: 120, defReps: 8 },
    { name: 'Glute Cable Kickback', focus: 'Glutes', kind: 'Isolation', defWeight: 15, defReps: 12 },
    { name: 'Leg Press (Glute Focus)', focus: 'Glutes', kind: 'Compound', defWeight: 200, defReps: 12 },
  ],
  abs: [
    { name: 'Cable Crunch', focus: 'Abs', kind: 'Isolation', defWeight: 35, defReps: 12 },
    { name: 'Ab Wheel Rollout', focus: 'Abs', kind: 'Compound', defWeight: 0, defReps: 10 },
    { name: 'Decline Sit Ups', focus: 'Abs', kind: 'Isolation', defWeight: 0, defReps: 12 },
    { name: 'Machine Crunch', focus: 'Abs', kind: 'Isolation', defWeight: 50, defReps: 12 },
    { name: 'Hanging Knee Raise', focus: 'Lower Abs', kind: 'Compound', defWeight: 0, defReps: 10 },
  ],
};

/**
 * Flat array of all exercises for search
 */
export const ALL_EXERCISES = Object.values(EXERCISE_LIBRARY).flat();
