import { useColorScheme as useColorSchemeCore } from 'react-native';

/**
 * Always resolves to 'light' | 'dark', never null/undefined, so callers can
 * index Colors[scheme] directly. Trackfit is dark-first (see
 * constants/Colors.ts) — default there when the system reports no
 * preference, rather than defaulting to light.
 */
export function useColorScheme(): 'light' | 'dark' {
  return useColorSchemeCore() === 'light' ? 'light' : 'dark';
}
