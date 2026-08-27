import { useCallback, useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase';
import { fetchSessions } from './workoutRepo';
import type { Session } from '../../src/types/WorkoutEntry';

/**
 * Shared session list for Home/Train/History — avoids each screen
 * duplicating its own Firestore query. Refetches whenever the signed-in
 * user changes (anonymous auth resolving after launch) and exposes
 * `refetch` for screens to call after saving a workout.
 */
export function useSessions() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  const refetch = useCallback(async (uid: string) => {
    setLoading(true);
    try {
      const fetched = await fetchSessions(uid);
      setSessions(fetched);
    } catch (err) {
      console.warn('Failed to fetch sessions:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, user => {
      setUserId(user?.uid ?? null);
      if (user) refetch(user.uid);
    });
    return unsubscribe;
  }, [refetch]);

  return {
    sessions,
    loading,
    userId,
    refetch: () => (userId ? refetch(userId) : Promise.resolve()),
  };
}
