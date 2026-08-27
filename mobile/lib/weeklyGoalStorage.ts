import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Weekly workout goal, stored locally per device. A full Settings screen is
 * out of scope for V1 (§26: settings aren't even a bottom tab) — this is
 * the minimum needed to satisfy "user can set a weekly goal" (§36 item 3)
 * without building a screen for it yet. Surfaced as a tap-to-cycle control
 * on Home.
 */

const STORAGE_KEY = 'gymtracker.weeklyGoal.v1';
export const DEFAULT_WEEKLY_GOAL = 4;
export const MIN_WEEKLY_GOAL = 1;
export const MAX_WEEKLY_GOAL = 7;

export async function loadWeeklyGoal(): Promise<number> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  const parsed = raw ? parseInt(raw, 10) : NaN;
  return Number.isFinite(parsed) && parsed >= MIN_WEEKLY_GOAL && parsed <= MAX_WEEKLY_GOAL ? parsed : DEFAULT_WEEKLY_GOAL;
}

export async function saveWeeklyGoal(goal: number): Promise<void> {
  const clamped = Math.min(MAX_WEEKLY_GOAL, Math.max(MIN_WEEKLY_GOAL, goal));
  await AsyncStorage.setItem(STORAGE_KEY, String(clamped));
}
