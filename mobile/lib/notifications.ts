import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';
import { getWeekBounds } from '../../src/utils/week';

/**
 * Contextual weekly-goal reminders (PRD §22) — not motivational spam. Three
 * kinds, all computed from real numbers at scheduling time:
 *  - Fri/Sat: goal not yet met, N workouts still needed this week
 *  - Sun: exactly one workout still needed
 *  - Immediate (not scheduled): goal just met, fired right after Finish
 *
 * PRD explicitly says not to request permission on first launch — only
 * after the user sets a weekly goal or completes their first workout, and
 * only after explaining the benefit first (a plain-language Alert before
 * the OS permission dialog).
 */

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

const PROMPTED_KEY = 'gymtracker.notificationsPrompted.v1';
const SCHEDULED_IDS_KEY = 'gymtracker.scheduledReminderIds.v1';

export async function hasPromptedForNotifications(): Promise<boolean> {
  return (await AsyncStorage.getItem(PROMPTED_KEY)) === 'true';
}

/**
 * Shows the "why" first, then the OS permission dialog only if the user
 * agrees. Marks itself prompted either way — we only ask once regardless
 * of the answer, matching normal iOS permission-request etiquette.
 */
export async function requestNotificationPermission(): Promise<boolean> {
  await AsyncStorage.setItem(PROMPTED_KEY, 'true');

  return new Promise(resolve => {
    Alert.alert(
      'Stay on track',
      "We'll send a quick nudge only if you're close to missing your weekly goal — nothing daily, nothing pushy.",
      [
        { text: 'Not now', style: 'cancel', onPress: () => resolve(false) },
        {
          text: 'Enable',
          onPress: async () => {
            const { status } = await Notifications.requestPermissionsAsync();
            resolve(status === 'granted');
          },
        },
      ]
    );
  });
}

async function hasPermission(): Promise<boolean> {
  const { status } = await Notifications.getPermissionsAsync();
  return status === 'granted';
}

/** Next occurrence (this week) of `weekday` (0=Sun..6=Sat) at `hour` local time, or null if already past. */
function upcomingTimeThisWeek(referenceDate: Date, weekday: number, hour: number): Date | null {
  const { start } = getWeekBounds(referenceDate);
  const target = new Date(start);
  target.setDate(target.getDate() + weekday);
  target.setHours(hour, 0, 0, 0);
  return target > referenceDate ? target : null;
}

/**
 * Cancels any previously scheduled reminders and schedules fresh ones for
 * the current week based on current progress. Safe to call repeatedly
 * (Home mount, after Finish, after the goal changes) — always reflects
 * up-to-date numbers rather than stale ones baked in earlier in the week.
 */
export async function scheduleWeeklyReminders(creditedDays: number, weeklyGoal: number, referenceDate: Date = new Date()) {
  const existingIds = JSON.parse((await AsyncStorage.getItem(SCHEDULED_IDS_KEY)) || '[]') as string[];
  await Promise.all(existingIds.map(id => Notifications.cancelScheduledNotificationAsync(id).catch(() => {})));

  if (!(await hasPermission())) {
    await AsyncStorage.setItem(SCHEDULED_IDS_KEY, JSON.stringify([]));
    return;
  }

  const remaining = weeklyGoal - creditedDays;
  if (remaining <= 0) {
    await AsyncStorage.setItem(SCHEDULED_IDS_KEY, JSON.stringify([]));
    return;
  }

  const newIds: string[] = [];

  // Friday 6pm and Saturday 6pm: general "still time" nudge.
  for (const weekday of [5, 6]) {
    const when = upcomingTimeThisWeek(referenceDate, weekday, 18);
    if (!when) continue;
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Weekly goal check-in',
        body: `${creditedDays} of ${weeklyGoal} workouts complete this week. ${remaining} left to hit your goal.`,
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: when },
    });
    newIds.push(id);
  }

  // Sunday 6pm: only when exactly one workout still closes the goal.
  if (remaining === 1) {
    const when = upcomingTimeThisWeek(referenceDate, 0, 18);
    if (when) {
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: 'One workout to go',
          body: 'One more workout completes your weekly goal.',
        },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: when },
      });
      newIds.push(id);
    }
  }

  await AsyncStorage.setItem(SCHEDULED_IDS_KEY, JSON.stringify(newIds));
}

/** Immediate, not scheduled — fired right after Finish when the goal was just met. */
export async function notifyGoalAchieved(weeklyGoal: number, streak: number) {
  if (!(await hasPermission())) return;
  await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Goal met 🔥',
      body:
        streak > 1
          ? `${weeklyGoal} of ${weeklyGoal} this week. Your ${streak}-week consistency streak continues.`
          : `${weeklyGoal} of ${weeklyGoal} this week — nice work.`,
    },
    trigger: null,
  });
}
