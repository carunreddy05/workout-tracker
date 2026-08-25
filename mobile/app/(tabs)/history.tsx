import { StyleSheet } from 'react-native';

import { Text, View } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';

/** Placeholder — History (PRD §17-18) is Days 5-7 scope. */
export default function HistoryScreen() {
  const theme = Colors[useColorScheme()];
  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <Text style={[styles.title, { color: theme.ink, fontFamily: 'InstrumentSerif_400Regular' }]}>History</Text>
      <Text style={[styles.body, { color: theme.mute }]}>Past workouts and calendar coming next.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  title: { fontSize: 30 },
  body: { fontSize: 14, fontFamily: 'Sora_400Regular' },
});
