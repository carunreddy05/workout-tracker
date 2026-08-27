/**
 * Mobile stores weight in lb, unlike the shared exerciseLibrary.ts (used by
 * both web and mobile), whose defWeight values are documented in kg to
 * match the web app's own convention. This conversion happens exactly once
 * per exercise — at the moment a NEW exercise is added to a workout and its
 * default sets are seeded from the library. From then on, every set mobile
 * saves is already a genuine lb number; nothing downstream (display,
 * previous-performance autofill, volume/PR math) needs to convert again.
 *
 * This is intentionally mobile-only (lib/, not src/utils/) — the web app
 * keeps showing kg everywhere, unchanged.
 */

const KG_TO_LB = 2.20462;

/** Converts a kg default from the shared library to a rounded, gym-friendly lb value. */
export function kgDefaultToLb(kg: number): number {
  if (kg <= 0) return 0;
  return Math.round((kg * KG_TO_LB) / 5) * 5;
}
