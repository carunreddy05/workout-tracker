import { useEffect, useState } from 'react';
import { StyleSheet, ScrollView } from 'react-native';

import { Text, View } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { auth } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { todayKey, getWeekBounds } from '../../../src/utils/week';
import { format } from 'date-fns';

/**
 * Home foundation screen (PRD Days 3-4 scope): proves the app shell,
 * theme, shared-logic import, and anonymous auth actually work end to
 * end. The real Home hierarchy (today's plan, weekly consistency card,
 * activity calendar — PRD §6) is Days 5-7 "Core product", not this phase.
 */
export default function HomeScreen() {
  const scheme = useColorScheme();
  const theme = Colors[scheme];
  const [uid, setUid] = useState<string | null>(null);

  useEffect(() => onAuthStateChanged(auth, user => setUid(user?.uid ?? null)), []);

  const today = todayKey();
  const { start, end } = getWeekBounds();

  return (
    <ScrollView style={{ backgroundColor: theme.bg }} contentContainerStyle={styles.container}>
      <Text style={[styles.eyebrow, { color: theme.mute }]}>TODAY</Text>
      <Text style={[styles.title, { color: theme.ink, fontFamily: 'InstrumentSerif_400Regular' }]}>
        {format(new Date(), 'EEEE, MMM d')}
      </Text>

      <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.line }]}>
        <Text style={[styles.cardLabel, { color: theme.mute }]}>FOUNDATION CHECK</Text>
        <Row label="Shared date util (todayKey)" value={today} theme={theme} />
        <Row label="Calendar week start" value={format(start, 'MMM d')} theme={theme} />
        <Row label="Calendar week end" value={format(end, 'MMM d')} theme={theme} />
        <Row label="Anonymous auth" value={uid ? `signed in (${uid.slice(0, 8)}…)` : 'signing in…'} theme={theme} />
      </View>

      <Text style={[styles.note, { color: theme.mute }]}>
        This screen exists to verify the mobile foundation end to end — real Home content (today&apos;s plan, weekly
        goal, activity calendar) comes next.
      </Text>
    </ScrollView>
  );
}

function Row({ label, value, theme }: { label: string; value: string; theme: (typeof Colors)['dark'] }) {
  return (
    <View style={[styles.row, { backgroundColor: 'transparent' }]}>
      <Text style={[styles.rowLabel, { color: theme.ink2 }]}>{label}</Text>
      <Text style={[styles.rowValue, { color: theme.accent }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    paddingTop: 32,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    fontFamily: 'Sora_700Bold',
  },
  title: {
    fontSize: 34,
    marginTop: 6,
    marginBottom: 20,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 10,
  },
  cardLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    fontFamily: 'Sora_700Bold',
    marginBottom: 4,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  rowLabel: {
    fontSize: 13,
    fontFamily: 'Sora_400Regular',
  },
  rowValue: {
    fontSize: 13,
    fontFamily: 'Sora_600SemiBold',
  },
  note: {
    marginTop: 20,
    fontSize: 13,
    fontFamily: 'Sora_400Regular',
    lineHeight: 19,
  },
});
