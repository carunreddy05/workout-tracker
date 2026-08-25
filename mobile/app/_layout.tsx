import { useFonts } from 'expo-font';
import { Sora_400Regular, Sora_600SemiBold, Sora_700Bold } from '@expo-google-fonts/sora';
import { InstrumentSerif_400Regular, InstrumentSerif_400Regular_Italic } from '@expo-google-fonts/instrument-serif';
import { Stack, ThemeProvider } from 'expo-router';
import type { Theme } from '@react-navigation/native';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';
import { ensureAnonymousAuth } from '@/lib/firebase';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

// Prevent the splash screen from auto-hiding before fonts/auth are ready.
SplashScreen.preventAutoHideAsync();

function buildNavTheme(scheme: 'light' | 'dark'): Theme {
  const c = Colors[scheme];
  return {
    dark: scheme === 'dark',
    colors: {
      primary: c.accent,
      background: c.bg,
      card: c.surface,
      text: c.ink,
      border: c.line2,
      notification: c.accent,
    },
    fonts: {
      regular: { fontFamily: 'Sora_400Regular', fontWeight: '400' },
      medium: { fontFamily: 'Sora_600SemiBold', fontWeight: '600' },
      bold: { fontFamily: 'Sora_700Bold', fontWeight: '700' },
      heavy: { fontFamily: 'Sora_700Bold', fontWeight: '700' },
    },
  };
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Sora_400Regular,
    Sora_600SemiBold,
    Sora_700Bold,
    InstrumentSerif_400Regular,
    InstrumentSerif_400Regular_Italic,
  });
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    if (fontError) throw fontError;
  }, [fontError]);

  // V1 accounts model (PRD §20): sign in anonymously in the background,
  // never block the UI on it — there is no login wall to clear.
  useEffect(() => {
    ensureAnonymousAuth()
      .catch(err => console.warn('Anonymous auth failed:', err))
      .finally(() => setAuthReady(true));
  }, []);

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return <RootLayoutNav authReady={authReady} />;
}

function RootLayoutNav({ authReady }: { authReady: boolean }) {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme];

  return (
    <ThemeProvider value={buildNavTheme(colorScheme)}>
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: theme.bg },
          headerTintColor: theme.ink,
          contentStyle: { backgroundColor: theme.bg },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      </Stack>
    </ThemeProvider>
  );
}
