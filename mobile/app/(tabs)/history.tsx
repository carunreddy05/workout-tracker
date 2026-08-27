import { useCallback, useState } from 'react';
import { View, Text, FlatList, Pressable, StyleSheet } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { format } from 'date-fns';

import Palette from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import SessionDetailModal from '@/components/SessionDetailModal';
import { useSessions } from '@/lib/useSessions';
import { parseDateKey } from '../../../src/utils/week';
import { creditedDaysInWeek, calculateWeeklyGoalStreak } from '../../../src/utils/streak';
import { loadWeeklyGoal } from '@/lib/weeklyGoalStorage';
import type { Session } from '../../../src/types/WorkoutEntry';

export default function HistoryScreen() {
  const theme = Palette[useColorScheme()];
  const { sessions, refetch } = useSessions();
  const [selected, setSelected] = useState<Session | null>(null);
  const [weeklyGoal, setWeeklyGoal] = useState(4);

  useFocusEffect(
    useCallback(() => {
      refetch();
      loadWeeklyGoal().then(setWeeklyGoal);
    }, [refetch])
  );

  const thisMonth = format(new Date(), 'yyyy-MM');
  const monthSessions = sessions.filter(s => s.date.slice(0, 7) === thisMonth);
  const monthMinutes = monthSessions.reduce((sum, s) => sum + (s.durationMin || 0), 0);
  const monthPRs = monthSessions.reduce((sum, s) => sum + (s.prs || 0), 0);
  const creditedDays = creditedDaysInWeek(sessions);
  const streak = calculateWeeklyGoalStreak(sessions, weeklyGoal);

  // The modal already reflects its own saved draft immediately — this
  // refetch is so the list underneath (durations, PR badges) is current
  // once the user closes back out to it.
  const handleUpdated = async () => {
    await refetch();
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <FlatList
        data={sessions}
        keyExtractor={s => s.id}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View style={[styles.summaryCard, { backgroundColor: theme.surface, borderColor: theme.line }]}>
            <Text style={[styles.summaryLabel, { color: theme.mute }]}>{format(new Date(), 'MMMM').toUpperCase()}</Text>
            <Text style={[styles.summaryTitle, { color: theme.ink, fontFamily: 'InstrumentSerif_400Regular' }]}>
              {monthSessions.length} workout{monthSessions.length !== 1 ? 's' : ''}
            </Text>
            <Text style={[styles.summaryLine, { color: theme.mute }]}>
              {Math.floor(monthMinutes / 60)}h {monthMinutes % 60}m trained · {creditedDays}/{weeklyGoal} this week
              {streak > 0 ? ` · 🔥 ${streak}-week streak` : ''}
              {monthPRs > 0 ? ` · ${monthPRs} PR${monthPRs > 1 ? 's' : ''}` : ''}
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable onPress={() => setSelected(item)} style={[styles.row, { borderColor: theme.line }]}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.rowTitle, { color: theme.ink }]}>{item.title || 'Workout'}</Text>
              <Text style={[styles.rowMeta, { color: theme.mute }]}>
                {format(parseDateKey(item.date), 'EEE, MMM d')} · {item.durationMin} min
                {item.exercises.length > 0 ? ` · ${item.exercises.length} exercises` : ''}
              </Text>
            </View>
            {item.prs > 0 && (
              <View style={[styles.prBadge, { backgroundColor: `${theme.good}22` }]}>
                <Text style={{ color: theme.good, fontSize: 11, fontFamily: 'Sora_700Bold' }}>{item.prs} PR</Text>
              </View>
            )}
          </Pressable>
        )}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={[styles.emptyText, { color: theme.mute }]}>No workouts yet. Start one from the Train tab.</Text>
          </View>
        }
      />

      <SessionDetailModal session={selected} theme={theme} onClose={() => setSelected(null)} onUpdated={handleUpdated} />
    </View>
  );
}

const styles = StyleSheet.create({
  listContent: { padding: 20, paddingBottom: 40, gap: 10 },
  summaryCard: { borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 12 },
  summaryLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 1, fontFamily: 'Sora_700Bold' },
  summaryTitle: { fontSize: 26, marginTop: 4 },
  summaryLine: { fontSize: 13, fontFamily: 'Sora_400Regular', marginTop: 4 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, gap: 8 },
  rowTitle: { fontSize: 15, fontFamily: 'Sora_600SemiBold' },
  rowMeta: { fontSize: 12, fontFamily: 'Sora_400Regular', marginTop: 2 },
  prBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 },
  emptyState: { paddingTop: 60, alignItems: 'center' },
  emptyText: { fontFamily: 'Sora_400Regular', fontSize: 13 },
});
