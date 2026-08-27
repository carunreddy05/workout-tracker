import { collection, addDoc, updateDoc, doc, getDocs, query, where } from 'firebase/firestore';
import { db } from './firebase';
import { parseDateKey } from '../../src/utils/week';
import { detectPRs, calculateVolume } from '../../src/utils/firestore';
import type { Session, Exercise } from '../../src/types/WorkoutEntry';

/**
 * Mobile writes/reads the modern typed Session shape directly — unlike the
 * web app, which still has years of legacy "dateDay string + w@r sets"
 * documents to stay compatible with (see src/utils/firestore.ts's
 * migrateEntry). Mobile has no such legacy data: each install gets a fresh
 * anonymous userId (PRD §20), so there's nothing old to read compatibly
 * with. Same `gymEntries` collection, new shape, no migration needed here.
 */

const SAVE_TIMEOUT_MS = 15000;

/**
 * Without Firestore's own offline queue on RN (see lib/firebase.ts), a
 * write attempted with no connectivity can hang rather than reject —
 * leaving the UI stuck on "Saving…" with no feedback. Fail fast instead so
 * the caller can tell the user to retry.
 *
 * Known limitation: this doesn't cancel the underlying addDoc call, only
 * the wait for it. If connectivity returns after the timeout and the user
 * has since retried, both attempts could eventually succeed, saving the
 * workout twice. Full fix would need an idempotency key on the write (or a
 * real cancellable request) — not built here; worth revisiting if this
 * shows up in practice rather than pre-building for a narrow edge case.
 */
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error('Save timed out — check your connection.')), ms)),
  ]);
}

export async function fetchSessions(userId: string): Promise<Session[]> {
  const snap = await getDocs(query(collection(db, 'gymEntries'), where('userId', '==', userId)));
  const sessions = snap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<Session, 'id'>) }));
  return sessions.sort((a, b) => parseDateKey(b.date).getTime() - parseDateKey(a.date).getTime());
}

/**
 * Saves a completed workout as one Firestore write (PRD §16: Finish Workout
 * is a single step, already saved by the time the summary appears — no
 * second "Save" the user has to separately tap). PRs are detected against
 * the caller's already-fetched session history before writing, so the
 * saved document carries pr:true on the sets that earned it.
 */
export async function saveSession(
  userId: string,
  draft: Omit<Session, 'id' | 'userId' | 'volume' | 'sets' | 'prs'>,
  pastSessions: Session[]
): Promise<Session> {
  const withPRs = detectPRs({ ...draft, id: '', userId, volume: 0, sets: 0, prs: 0 }, pastSessions);

  const doneSets = withPRs.exercises.flatMap(ex => ex.sets.filter(s => s.done));
  const volume = calculateVolume(withPRs);
  const prs = doneSets.filter(s => s.pr).length;

  const { id: _discard, ...toSave } = {
    ...withPRs,
    userId,
    sets: doneSets.length,
    volume,
    prs,
  };

  const ref = await withTimeout(addDoc(collection(db, 'gymEntries'), toSave), SAVE_TIMEOUT_MS);
  return { ...toSave, id: ref.id };
}

/**
 * Edits an already-saved session's exercises (PRD §16: "the user may edit
 * the session from History afterward"). Recomputes this session's own
 * volume and set count from the edited data. Deliberately does NOT
 * recompute PRs — an edited set could newly qualify as (or invalidate) a
 * PR, but re-running PR detection across a user's whole history on every
 * edit is a much bigger cascading-recalculation problem than this pass
 * takes on. PR flags stay exactly as they were recorded at Finish time.
 */
export async function updateSession(sessionId: string, exercises: Exercise[]): Promise<{ volume: number; sets: number }> {
  const doneSets = exercises.flatMap(ex => ex.sets.filter(s => s.done));
  // calculateVolume only reads .exercises, but needs a full Session shape —
  // the rest of these fields are unused placeholders for that call alone.
  const volume = calculateVolume({
    id: '',
    userId: '',
    date: '',
    weekday: '',
    title: '',
    split: 'push',
    durationMin: 0,
    sets: 0,
    volume: 0,
    prs: 0,
    exercises,
  });
  const sets = doneSets.length;

  await withTimeout(updateDoc(doc(db, 'gymEntries', sessionId), { exercises, volume, sets }), SAVE_TIMEOUT_MS);
  return { volume, sets };
}

/**
 * Previous-workout autofill (PRD §10, LOG-1/LOG-2): the most recent past
 * session containing this exercise, if any. `sessions` must already be
 * sorted newest-first (fetchSessions does this).
 */
export function findLastPerformance(sessions: Session[], exerciseName: string): Exercise | null {
  for (const session of sessions) {
    const match = session.exercises.find(ex => ex.name === exerciseName);
    if (match) return match;
  }
  return null;
}
