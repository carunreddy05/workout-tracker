/**
 * Exercise measurement model — single source of truth for whether an
 * exercise's sets should contribute weight-based training volume.
 *
 * Why this exists: volume was computed everywhere as `weight * reps`, but
 * bodyweight exercises (Push Ups, etc.) are logged with weight = 0, so they
 * always produced 0 volume and looked broken in the UI. The fix isn't to
 * fake a bodyweight number — it's to stop treating every exercise as
 * "weighted" and instead ask what kind of exercise it actually is.
 *
 * V1 (web) only distinguishes 'weighted' vs 'bodyweight', since those are
 * the only two the current UI (a single weight+reps set editor) can
 * represent. The full six-type model from the mobile PRD
 * (weightedBodyweight / assistedBodyweight / duration / distance) is kept
 * here as the target enum so the mobile port doesn't need a second migration
 * — 'weighted' and 'bodyweight' are the only values actually assigned today.
 */

import { ALL_EXERCISES } from './exerciseLibrary';

export type MeasurementType =
  | 'weighted'
  | 'bodyweight'
  | 'weightedBodyweight'
  | 'assistedBodyweight'
  | 'duration'
  | 'distance';

/** Measurement types whose weight × reps is meaningful training volume. */
const VOLUME_ELIGIBLE: ReadonlySet<MeasurementType> = new Set<MeasurementType>(['weighted', 'weightedBodyweight']);

/**
 * Exercise names that are pure-bodyweight (reps only, no meaningful load).
 * Sourced from the library entries with defWeight: 0 — kept as an explicit
 * list rather than inferred from defWeight so a future weighted exercise
 * that happens to default to 0 (e.g. "add your own plates") doesn't get
 * silently miscategorized.
 */
const BODYWEIGHT_EXERCISE_NAMES: ReadonlySet<string> = new Set([
  'Push Ups',
  'Dips',
  'Nordic Curl',
  'Ab Wheel Rollout',
  'Decline Sit Ups',
  'Hanging Knee Raise',
  // SPLIT_LIBRARY (firestore.ts) bodyweight entries not present in ALL_EXERCISES:
  'Reverse Crunch',
  'Dead Bug',
]);

const NAME_TO_TYPE = new Map<string, MeasurementType>(
  ALL_EXERCISES.map(ex => [ex.name, BODYWEIGHT_EXERCISE_NAMES.has(ex.name) ? 'bodyweight' : 'weighted'])
);
BODYWEIGHT_EXERCISE_NAMES.forEach(name => {
  if (!NAME_TO_TYPE.has(name)) NAME_TO_TYPE.set(name, 'bodyweight');
});

/**
 * Look up an exercise's measurement type by name. Defaults to 'weighted'
 * for anything not in the library (e.g. legacy Firestore entries whose
 * exercise was later renamed/removed) — this preserves current behavior
 * for unknown exercises rather than silently zeroing their volume.
 */
export function getMeasurementType(exerciseName: string): MeasurementType {
  return NAME_TO_TYPE.get(exerciseName) ?? 'weighted';
}

/** True if weight × reps is meaningful volume for this exercise. */
export function isVolumeEligible(exerciseName: string): boolean {
  return VOLUME_ELIGIBLE.has(getMeasurementType(exerciseName));
}

/** Volume contribution of a single set, 0 for non-volume-eligible exercises. */
export function calcSetVolume(exerciseName: string, weight: number, reps: number): number {
  return isVolumeEligible(exerciseName) ? weight * reps : 0;
}

/** True if this exercise's sets should hide the weight field and show reps only. */
export function isBodyweightOnly(exerciseName: string): boolean {
  return getMeasurementType(exerciseName) === 'bodyweight';
}
