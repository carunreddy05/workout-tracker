import { useEffect, useState, useCallback } from 'react';
import { ScrollView, View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { format } from 'date-fns';

import Palette from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import ActivityCalendar from '@/components/ActivityCalendar';
import SessionDetailModal from '@/components/SessionDetailModal';
import { useSessions } from '@/lib/useSessions';
import type { Session } from '../../../src/types/WorkoutEntry';
import { useActiveWorkout } from '@/lib/useActiveWorkout';
import { useElapsedLabel } from '@/lib/useElapsedTime';
import { loadWeeklyGoal, saveWeeklyGoal, MIN_WEEKLY_GOAL, MAX_WEEKLY_GOAL } from '@/lib/weeklyGoalStorage';
import { hasPromptedForNotifications, requestNotificationPermission, scheduleWeeklyReminders } from '@/lib/notifications';
import { creditedDaysInWeek, calculateWeeklyGoalStreak } from '../../../src/utils/streak';
import { getTodaySplit, SPLIT_TITLES, SPLIT_SUBTITLES, SPLIT_COUNTS } from '../../../src/utils/plan';

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

export default function HomeScreen() {
  const theme = Palette[useColorScheme()];
  const router = useRouter();
  const { sessions, refetch } = useSessions();
  const { workout, start } = useActiveWorkout();
  const elapsed = useElapsedLabel(workout?.startedAtIso);
  const [weeklyGoal, setWeeklyGoal] = useState(4);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);

  useEffect(() => {
    loadWeeklyGoal().then(setWeeklyGoal);
  }, []);

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch])
  );

  const todaySplit = getTodaySplit();
  const creditedDays = creditedDaysInWeek(sessions);
  const streak = calculateWeeklyGoalStreak(sessions, weeklyGoal);
  const monthCount = sessions.filter(s => s.date.slice(0, 7) === format(new Date(), 'yyyy-MM')).length;
  const totalMinutes = sessions
    .filter(s => s.date.slice(0, 7) === format(new Date(), 'yyyy-MM'))
    .reduce((sum, s) => sum + (s.durationMin || 0), 0);
  const monthPRs = sessions
    .filter(s => s.date.slice(0, 7) === format(new Date(), 'yyyy-MM'))
    .reduce((sum, s) => sum + (s.prs || 0), 0);

  const handleStartOrContinue = async () => {
    if (!workout) {
      await start();
    }
    router.push('/train');
  };

  // Keep reminders current whenever progress or the goal itself changes —
  // scheduleWeeklyReminders is idempotent (cancels+reschedules), so this is
  // safe to call on every relevant render, not just once.
  useEffect(() => {
    scheduleWeeklyReminders(creditedDays, weeklyGoal);
  }, [creditedDays, weeklyGoal]);

  const cycleGoal = async () => {
    const next = weeklyGoal >= MAX_WEEKLY_GOAL ? MIN_WEEKLY_GOAL : weeklyGoal + 1;
    setWeeklyGoal(next);
    await saveWeeklyGoal(next);

    // PRD §22: prompt after the user sets a weekly goal (or their first
    // workout — see Train's handleFinish), never on first launch.
    if (!(await hasPromptedForNotifications())) {
      await requestNotificationPermission();
    }
  };

  return (
    <ScrollView style={{ backgroundColor: theme.bg }} contentContainerStyle={styles.container}>
      <Text style={[styles.eyebrow, { color: theme.mute }]}>{format(new Date(), 'EEEE, MMM d').toUpperCase()}</Text>
      <Text style={[styles.greeting, { color: theme.ink, fontFamily: 'InstrumentSerif_400Regular' }]}>
        {getGreeting()}
      </Text>

      {/* Primary CTA card */}
      <View style={[styles.heroCard, { backgroundColor: theme.accent }]}>
        {workout ? (
          <>
            <Text style={[styles.heroLabel, { color: theme.accentInk }]}>IN PROGRESS</Text>
            <Text style={[styles.heroTitle, { color: theme.accentInk, fontFamily: 'InstrumentSerif_400Regular' }]}>
              {workout.splitLabel || 'Workout'} · {elapsed}
            </Text>
          </>
        ) : (
          <>
            <Text style={[styles.heroLabel, { color: theme.accentInk }]}>{SPLIT_SUBTITLES[todaySplit]}</Text>
            <Text style={[styles.heroTitle, { color: theme.accentInk, fontFamily: 'InstrumentSerif_400Regular' }]}>
              {SPLIT_TITLES[todaySplit]}
            </Text>
            <Text style={[styles.heroMeta, { color: theme.accentInk }]}>
              {SPLIT_COUNTS[todaySplit]} exercises suggested
            </Text>
          </>
        )}
        <Pressable onPress={handleStartOrContinue} style={[styles.heroButton, { backgroundColor: 'rgba(0,0,0,0.15)' }]}>
          <Text style={[styles.heroButtonText, { color: theme.accentInk }]}>
            {workout ? 'Continue Workout →' : 'Start Workout →'}
          </Text>
        </Pressable>
      </View>

      {/* Weekly consistency */}
      <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.line }]}>
        <View style={styles.rowBetween}>
          <View>
            <Text style={[styles.cardLabel, { color: theme.accent }]}>THIS WEEK</Text>
            <Text style={[styles.bigNumber, { color: theme.ink, fontFamily: 'InstrumentSerif_400Regular' }]}>
              {creditedDays} / {weeklyGoal}
            </Text>
            <Text style={[styles.subtext, { color: theme.mute }]}>
              {creditedDays >= weeklyGoal ? 'Goal met!' : `${weeklyGoal - creditedDays} to go`}
              {streak > 0 ? ` · 🔥 ${streak}-week streak` : ''}
            </Text>
          </View>
          <Pressable onPress={cycleGoal} style={[styles.goalButton, { borderColor: theme.line2 }]}>
            <Text style={[styles.goalButtonText, { color: theme.mute }]}>Goal: {weeklyGoal}</Text>
          </Pressable>
        </View>
      </View>

      {/* Activity calendar */}
      <View style={styles.section}>
        <ActivityCalendar sessions={sessions} onDayPress={setSelectedSession} />
      </View>

      {/* Stats row */}
      <View style={styles.statsRow}>
        <Stat label="Workouts" value={String(monthCount)} theme={theme} />
        <Stat label="Minutes" value={String(totalMinutes)} theme={theme} />
        <Stat label="PRs" value={String(monthPRs)} theme={theme} />
      </View>

      <SessionDetailModal session={selectedSession} theme={theme} onClose={() => setSelectedSession(null)} onUpdated={refetch} />
    </ScrollView>
  );
}

function Stat({ label, value, theme }: { label: string; value: string; theme: (typeof Palette)['dark'] }) {
  return (
    <View style={[styles.statCard, { backgroundColor: theme.surface, borderColor: theme.line }]}>
      <Text style={[styles.statValue, { color: theme.ink, fontFamily: 'InstrumentSerif_400Regular' }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: theme.mute }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 20, paddingTop: 24, paddingBottom: 40, gap: 16 },
  eyebrow: { fontSize: 12, fontWeight: '700', letterSpacing: 1, fontFamily: 'Sora_700Bold' },
  greeting: { fontSize: 32, marginTop: 4 },
  heroCard: { borderRadius: 20, padding: 20, gap: 6 },
  heroLabel: { fontSize: 12, fontWeight: '600', fontFamily: 'Sora_600SemiBold', opacity: 0.75 },
  heroTitle: { fontSize: 30 },
  heroMeta: { fontSize: 13, fontFamily: 'Sora_600SemiBold', opacity: 0.85 },
  heroButton: { marginTop: 10, paddingVertical: 14, borderRadius: 14, alignItems: 'center' },
  heroButtonText: { fontSize: 15, fontFamily: 'Sora_700Bold' },
  card: { borderRadius: 16, borderWidth: 1, padding: 16 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1, fontFamily: 'Sora_700Bold' },
  bigNumber: { fontSize: 28, marginTop: 2 },
  subtext: { fontSize: 13, fontFamily: 'Sora_400Regular', marginTop: 2 },
  goalButton: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
  goalButtonText: { fontSize: 12, fontFamily: 'Sora_600SemiBold' },
  section: {},
  statsRow: { flexDirection: 'row', gap: 10 },
  statCard: { flex: 1, borderRadius: 14, borderWidth: 1, padding: 12, alignItems: 'center', gap: 2 },
  statValue: { fontSize: 22 },
  statLabel: { fontSize: 11, fontFamily: 'Sora_600SemiBold' },
});
