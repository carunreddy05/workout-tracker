import { useCallback, useEffect, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import {
  type ActiveWorkout,
  createActiveWorkout,
  saveActiveWorkout,
  loadActiveWorkout,
  clearActiveWorkout,
} from './activeWorkoutStorage';

/**
 * Thin React wrapper over lib/activeWorkoutStorage.ts. AsyncStorage is the
 * source of truth (not a global store), so each screen using this hook
 * reloads on focus via useFocusEffect — simple and correct for V1's scale,
 * without needing a context provider just to keep Home's "Continue
 * Workout" CTA and the Train screen in sync.
 */
export function useActiveWorkout() {
  const [workout, setWorkout] = useState<ActiveWorkout | null>(null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    const loaded = await loadActiveWorkout();
    setWorkout(loaded);
    setLoading(false);
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload])
  );

  const start = useCallback(async (splitLabel?: string) => {
    const created = createActiveWorkout(splitLabel);
    await saveActiveWorkout(created);
    setWorkout(created);
    return created;
  }, []);

  const update = useCallback(async (updater: (w: ActiveWorkout) => ActiveWorkout) => {
    setWorkout(prev => {
      if (!prev) return prev;
      const next = updater(prev);
      saveActiveWorkout(next).catch(err => console.warn('Failed to persist active workout:', err));
      return next;
    });
  }, []);

  const finish = useCallback(async () => {
    await clearActiveWorkout();
    setWorkout(null);
  }, []);

  return { workout, loading, start, update, finish, reload };
}
