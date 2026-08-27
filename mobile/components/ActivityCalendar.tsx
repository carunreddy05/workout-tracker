import { useMemo } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { startOfMonth, endOfMonth, eachDayOfInterval, format, getDay } from 'date-fns';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { toDateKey } from '../../src/utils/week';
import type { Session } from '../../src/types/WorkoutEntry';

const DAY_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

/**
 * Simple month grid (PRD §6/§18: "simple month visualization showing
 * completed workout days" with enough date context to identify actual
 * dates — the web app's month view originally shipped without day numbers,
 * which was a real usability gap; this one shows them from the start).
 * Tapping a worked day opens SessionDetailModal (§18: tap a completed day
 * to see what was trained) — the caller owns that modal's open/close state.
 */
export default function ActivityCalendar({ sessions, onDayPress }: { sessions: Session[]; onDayPress: (session: Session) => void }) {
  const theme = Colors[useColorScheme()];
  const today = new Date();
  const start = startOfMonth(today);
  const end = endOfMonth(today);
  const days = eachDayOfInterval({ start, end });
  const leadingBlanks = getDay(start); // Sun=0

  // If multiple sessions land on the same date, the first one found is
  // what a tap shows — a deliberate simplification, not a "pick one" flow.
  const sessionByDate = useMemo(() => {
    const map = new Map<string, Session>();
    for (const s of sessions) {
      if (!map.has(s.date)) map.set(s.date, s);
    }
    return map;
  }, [sessions]);

  return (
    <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.line }]}>
      <Text style={[styles.label, { color: theme.mute }]}>{format(today, 'MMMM yyyy').toUpperCase()}</Text>
      <View style={styles.headerRow}>
        {DAY_LABELS.map((d, i) => (
          <Text key={i} style={[styles.dayLabel, { color: theme.mute }]}>
            {d}
          </Text>
        ))}
      </View>
      <View style={styles.grid}>
        {Array.from({ length: leadingBlanks }).map((_, i) => (
          <View key={`blank-${i}`} style={styles.cell} />
        ))}
        {days.map(day => {
          const key = toDateKey(day);
          const session = sessionByDate.get(key);
          const worked = !!session;
          const isToday = key === toDateKey(today);
          return (
            <View key={key} style={styles.cell}>
              <Pressable
                disabled={!worked}
                onPress={() => session && onDayPress(session)}
                style={[
                  styles.dot,
                  {
                    backgroundColor: worked ? theme.accent : theme.surface2,
                    borderColor: isToday ? theme.accent : worked ? theme.accent : theme.line,
                    borderWidth: isToday ? 1.5 : 1,
                  },
                ]}
              >
                <Text style={[styles.dayNum, { color: worked ? theme.accentInk : theme.mute }]}>{format(day, 'd')}</Text>
              </Pressable>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 16, borderWidth: 1, padding: 16 },
  label: { fontSize: 11, fontWeight: '700', letterSpacing: 1, fontFamily: 'Sora_700Bold', marginBottom: 10 },
  headerRow: { flexDirection: 'row' },
  dayLabel: { flex: 1, textAlign: 'center', fontSize: 11, fontFamily: 'Sora_600SemiBold', marginBottom: 6 },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { width: `${100 / 7}%`, aspectRatio: 1, alignItems: 'center', justifyContent: 'center', padding: 2 },
  dot: { width: '100%', height: '100%', borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  dayNum: { fontSize: 11, fontFamily: 'Sora_600SemiBold' },
});
