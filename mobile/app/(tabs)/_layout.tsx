import { Text } from 'react-native';
import { SymbolView } from 'expo-symbols';
import { Tabs } from 'expo-router';

import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useClientOnlyValue } from '@/components/useClientOnlyValue';

/**
 * Primary navigation per the iOS V1 PRD (§26): Home, Train, History.
 * Settings/profile are accessed separately (not a bottom tab).
 *
 * SF Symbols render on iOS only (this app's actual target); `fallback`
 * covers Android/web with the same emoji glyphs the web app's bottom tab
 * bar already uses, for a consistent (if non-native) look there.
 */
function TabIcon({ symbol, fallback, color }: { symbol: string; fallback: string; color: string }) {
  return (
    // @ts-expect-error — `name` is typed as the SFSymbol union, but this
    // build's types don't export it for external string comparison; the
    // native module validates the name at runtime instead.
    <SymbolView name={symbol} tintColor={color} size={26} fallback={<Text style={{ fontSize: 22 }}>{fallback}</Text>} />
  );
}

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme];

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.accent,
        tabBarInactiveTintColor: theme.mute,
        tabBarStyle: { backgroundColor: theme.bg, borderTopColor: theme.line2 },
        headerStyle: { backgroundColor: theme.bg },
        headerTintColor: theme.ink,
        headerShown: useClientOnlyValue(false, true),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <TabIcon symbol="house.fill" fallback="🏠" color={color} />,
        }}
      />
      <Tabs.Screen
        name="train"
        options={{
          title: 'Train',
          tabBarIcon: ({ color }) => (
            <TabIcon symbol="figure.strengthtraining.traditional" fallback="🏋️" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'History',
          tabBarIcon: ({ color }) => <TabIcon symbol="clock.arrow.circlepath" fallback="📊" color={color} />,
        }}
      />
    </Tabs>
  );
}
