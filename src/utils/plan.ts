/**
 * Shared workout-split rotation, used by both the web Dashboard and the
 * mobile Home/Train screens so "today's plan" always agrees across
 * platforms. Extracted from Dashboard.tsx, which now imports from here.
 */

export type Split = 'push' | 'pull' | 'legs' | 'core';

export const SPLIT_TITLES: Record<Split, string> = {
  push: 'Push',
  pull: 'Pull',
  legs: 'Legs',
  core: 'Core',
};

export const SPLIT_SUBTITLES: Record<Split, string> = {
  push: 'Chest · Shoulders · Triceps',
  pull: 'Back · Biceps · Rear Delts',
  legs: 'Quads · Hamstrings · Glutes',
  core: 'Abs · Obliques · Stability',
};

export const SPLIT_COUNTS: Record<Split, number> = {
  push: 5,
  pull: 5,
  legs: 5,
  core: 4,
};

/** Sun=0 -> core, Mon/Thu -> pull, Tue/Fri -> legs, Wed/Sat -> push. */
export function getTodaySplit(referenceDate: Date = new Date()): Split {
  const day = referenceDate.getDay();
  if (day === 1 || day === 4) return 'pull';
  if (day === 2 || day === 5) return 'legs';
  if (day === 0) return 'core';
  return 'push';
}
