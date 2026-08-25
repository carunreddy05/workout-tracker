import { StyleSheet } from 'react-native';

import { Text, View } from '@/components/Themed';
import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';

/**
 * Placeholder — the Start Workout flow (PRD §7-11) is Days 5-7 scope.
 * lib/activeWorkoutStorage.ts already exists for it to build on.
 */
export default function TrainScreen() {
  const theme = Colors[useColorScheme()];
  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <Text style={[styles.title, { color: theme.ink, fontFamily: 'InstrumentSerif_400Regular' }]}>Train</Text>
      <Text style={[styles.body, { color: theme.mute }]}>Start Workout flow coming next.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  title: { fontSize: 30 },
  body: { fontSize: 14, fontFamily: 'Sora_400Regular' },
});
