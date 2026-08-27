import { useMemo, useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet, Modal, FlatList, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { format } from 'date-fns';

import Palette, { type Theme } from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useActiveWorkout } from '@/lib/useActiveWorkout';
import { useSessions } from '@/lib/useSessions';
import { useElapsedLabel } from '@/lib/useElapsedTime';
import { saveSession, findLastPerformance } from '@/lib/workoutRepo';
import type { ActiveWorkoutExercise, ActiveWorkoutSet } from '@/lib/activeWorkoutStorage';
import { loadWeeklyGoal } from '@/lib/weeklyGoalStorage';
import { kgDefaultToLb } from '@/lib/units';
import { hasPromptedForNotifications, requestNotificationPermission, notifyGoalAchieved } from '@/lib/notifications';
import { ALL_EXERCISES, type LibraryExercise } from '../../../src/utils/exerciseLibrary';
import { isBodyweightOnly } from '../../../src/utils/exerciseMeasurement';
import { getTodaySplit, SPLIT_TITLES, type Split } from '../../../src/utils/plan';
import { parseDateKey } from '../../../src/utils/week';
import { creditedDaysInWeek, calculateWeeklyGoalStreak } from '../../../src/utils/streak';
import type { Session, Exercise as SessionExercise } from '../../../src/types/WorkoutEntry';


const SPLIT_CHOICES = ['Push', 'Pull', 'Legs', 'Upper', 'Lower', 'Cardio', 'Other'] as const;

/**
 * Session.split is a fixed push/pull/legs/core enum (shared with the web
 * app), but the free-text splitLabel a user picks here is wider. This is a
 * best-effort bucket for that field only — splitLabel/title carries the
 * actual chosen label for display.
 */
function toSplitEnum(label: string | undefined): Split {
  switch (label) {
    case 'Push':
    case 'Upper':
      return 'push';
    case 'Pull':
      return 'pull';
    case 'Legs':
    case 'Lower':
      return 'legs';
    default:
      return 'core';
  }
}

export default function TrainScreen() {
  const theme = Palette[useColorScheme()];
  const router = useRouter();
  const { workout, start, update, finish } = useActiveWorkout();
  const { sessions, userId, refetch } = useSessions();
  const elapsed = useElapsedLabel(workout?.startedAtIso);
  const [showAddExercise, setShowAddExercise] = useState(false);
  const [saving, setSaving] = useState(false);
  const [completedSummary, setCompletedSummary] = useState<Session | null>(null);
  const [promptNotificationsOnDismiss, setPromptNotificationsOnDismiss] = useState(false);

  const handleDismissSummary = async () => {
    setCompletedSummary(null);
    if (promptNotificationsOnDismiss) {
      setPromptNotificationsOnDismiss(false);
      await requestNotificationPermission();
    }
    router.push('/');
  };

  if (!workout) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: theme.bg }]}>
        <Text style={[styles.emptyTitle, { color: theme.ink, fontFamily: 'InstrumentSerif_400Regular' }]}>
          Ready when you are
        </Text>
        <Text style={[styles.emptyBody, { color: theme.mute }]}>
          Start a workout and the timer begins immediately — pick a type or log exercises after, both optional.
        </Text>
        <Pressable
          onPress={() => start(SPLIT_TITLES[getTodaySplit()])}
          style={[styles.startButton, { backgroundColor: theme.accent }]}
        >
          <Text style={[styles.startButtonText, { color: theme.accentInk }]}>Start Workout</Text>
        </Pressable>
        <WorkoutCompleteModal session={completedSummary} theme={theme} onDone={handleDismissSummary} />
      </View>
    );
  }

  const totalSets = workout.exercises.reduce((sum, ex) => sum + ex.sets.length, 0);

  const addExercise = (lib: LibraryExercise) => {
    const previous = findLastPerformance(sessions, lib.name);
    const bodyweight = isBodyweightOnly(lib.name);
    // previous.sets came from a session mobile saved itself, so it's
    // already in lb — only the shared library's kg-denominated default
    // needs converting, and only once, right here.
    const baseSets: ActiveWorkoutSet[] = previous
      ? previous.sets.slice(0, 4).map(s => ({ w: bodyweight ? 0 : s.w, r: s.r, done: false }))
      : Array.from({ length: 3 }, () => ({ w: bodyweight ? 0 : kgDefaultToLb(lib.defWeight), r: lib.defReps, done: false }));

    const newExercise: ActiveWorkoutExercise = { name: lib.name, focus: lib.focus, kind: lib.kind, sets: baseSets };
    update(w => ({ ...w, exercises: [...w.exercises, newExercise] }));
    setShowAddExercise(false);
  };

  const removeExercise = (index: number) => {
    update(w => ({ ...w, exercises: w.exercises.filter((_, i) => i !== index) }));
  };

  const updateSet = (exIdx: number, setIdx: number, patch: Partial<ActiveWorkoutSet>) => {
    update(w => ({
      ...w,
      exercises: w.exercises.map((ex, i) =>
        i === exIdx ? { ...ex, sets: ex.sets.map((s, j) => (j === setIdx ? { ...s, ...patch } : s)) } : ex
      ),
    }));
  };

  const addSet = (exIdx: number) => {
    update(w => ({
      ...w,
      exercises: w.exercises.map((ex, i) => {
        if (i !== exIdx) return ex;
        const last = ex.sets[ex.sets.length - 1];
        return { ...ex, sets: [...ex.sets, last ? { ...last, done: false } : { w: 0, r: 10, done: false }] };
      }),
    }));
  };

  const setSplit = (label: string) => {
    update(w => ({ ...w, splitLabel: label }));
  };

  const handleFinish = async () => {
    if (!userId) return;
    setSaving(true);
    try {
      const wasFirstEver = sessions.length === 0;
      const weeklyGoal = await loadWeeklyGoal();
      const wasGoalMetBefore = creditedDaysInWeek(sessions) >= weeklyGoal;

      const saved = await saveSession(
        userId,
        {
          date: workout.date,
          weekday: format(parseDateKey(workout.date), 'EEE'),
          title: workout.splitLabel || 'Workout',
          split: toSplitEnum(workout.splitLabel),
          durationMin: Math.max(1, Math.round((Date.now() - new Date(workout.startedAtIso).getTime()) / 60000)),
          exercises: workout.exercises.map(ex => ({
            name: ex.name,
            focus: ex.focus,
            kind: ex.kind,
            targetSets: ex.sets.length,
            lastWeight: 0,
            lastReps: 0,
            sets: ex.sets.map(s => ({ w: s.w, r: s.r, done: s.done, pr: false })),
          })),
        },
        sessions
      );
      // Clear the active-workout record now — the data is safely in the
      // saved Session either way, so there is nothing left to lose even if
      // this device never sees another connectivity window before the app
      // is reopened (see lib/firebase.ts for why Firestore itself can't
      // queue this write offline on RN).
      await finish();
      await refetch();

      const updatedSessions = [saved, ...sessions];
      const isGoalMetNow = creditedDaysInWeek(updatedSessions) >= weeklyGoal;
      if (!wasGoalMetBefore && isGoalMetNow) {
        await notifyGoalAchieved(weeklyGoal, calculateWeeklyGoalStreak(updatedSessions, weeklyGoal));
      }

      setCompletedSummary(saved);
      // PRD §22: prompt after the user's first completed workout (or after
      // setting a weekly goal — see Home's cycleGoal), not on first launch.
      // Deferred until the summary is dismissed so it doesn't collide with it.
      if (wasFirstEver && !(await hasPromptedForNotifications())) {
        setPromptNotificationsOnDismiss(true);
      }
    } catch (err) {
      console.warn('Failed to save workout:', err);
      Alert.alert(
        "Couldn't save workout",
        'Your progress is still here — nothing was lost. Check your connection and try Finish again.',
        [{ text: 'OK' }]
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Text style={[styles.timer, { color: theme.accent, fontFamily: 'InstrumentSerif_400Regular' }]}>
            {elapsed}
          </Text>
          <Text style={[styles.headerMeta, { color: theme.mute }]}>
            {workout.exercises.length} exercise{workout.exercises.length !== 1 ? 's' : ''} · {totalSets} sets
          </Text>
        </View>

        {/* Split picker — entirely optional (SW-3) */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipRow}>
          {SPLIT_CHOICES.map(choice => (
            <Pressable
              key={choice}
              onPress={() => setSplit(choice)}
              style={[
                styles.chip,
                {
                  backgroundColor: workout.splitLabel === choice ? theme.accent : theme.surface,
                  borderColor: workout.splitLabel === choice ? theme.accent : theme.line,
                },
              ]}
            >
              <Text style={{ color: workout.splitLabel === choice ? theme.accentInk : theme.ink2, fontFamily: 'Sora_600SemiBold', fontSize: 13 }}>
                {choice}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Exercises */}
        {workout.exercises.length === 0 ? (
          <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.line, alignItems: 'center' }]}>
            <Text style={[styles.emptyExerciseText, { color: theme.mute }]}>
              No exercises yet. A quick workout with none logged still counts — add one below only if you want to.
            </Text>
          </View>
        ) : (
          workout.exercises.map((ex, exIdx) => (
            <ExerciseCard
              key={`${ex.name}-${exIdx}`}
              exercise={ex}
              previous={findLastPerformance(sessions, ex.name)}
              theme={theme}
              onRemove={() => removeExercise(exIdx)}
              onUpdateSet={(setIdx, patch) => updateSet(exIdx, setIdx, patch)}
              onAddSet={() => addSet(exIdx)}
            />
          ))
        )}

        <Pressable onPress={() => setShowAddExercise(true)} style={[styles.addButton, { borderColor: theme.line2 }]}>
          <Text style={[styles.addButtonText, { color: theme.accent }]}>+ Add Exercise</Text>
        </Pressable>
      </ScrollView>

      <View style={[styles.finishBar, { backgroundColor: theme.bg, borderColor: theme.line }]}>
        <Pressable
          onPress={handleFinish}
          disabled={saving}
          style={[styles.finishButton, { backgroundColor: saving ? theme.mute : theme.accent }]}
        >
          <Text style={[styles.finishButtonText, { color: theme.accentInk }]}>
            {saving ? 'Saving…' : 'Finish Workout'}
          </Text>
        </Pressable>
      </View>

      <AddExerciseModal visible={showAddExercise} theme={theme} onClose={() => setShowAddExercise(false)} onPick={addExercise} />
      <WorkoutCompleteModal session={completedSummary} theme={theme} onDone={handleDismissSummary} />
    </View>
  );
}

function ExerciseCard({
  exercise,
  previous,
  theme,
  onRemove,
  onUpdateSet,
  onAddSet,
}: {
  exercise: ActiveWorkoutExercise;
  previous: SessionExercise | null;
  theme: Theme;
  onRemove: () => void;
  onUpdateSet: (setIdx: number, patch: Partial<ActiveWorkoutSet>) => void;
  onAddSet: () => void;
}) {
  const bodyweight = isBodyweightOnly(exercise.name);

  return (
    <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.line }]}>
      <View style={styles.rowBetween}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.exerciseName, { color: theme.ink }]}>{exercise.name}</Text>
          <Text style={[styles.exerciseMeta, { color: theme.mute }]}>
            {exercise.focus} · {exercise.kind}
          </Text>
        </View>
        <Pressable onPress={onRemove} hitSlop={10}>
          <Text style={{ color: theme.mute, fontSize: 18 }}>✕</Text>
        </Pressable>
      </View>

      {/* Last vs. Today (PRD LOG-3): the prefilled values above came from
          somewhere — show that explicitly so a user never mistakes a
          historical value for a set they actually completed today. */}
      {previous && (
        <View style={styles.lastTimeRow}>
          <Text style={[styles.lastTimeLabel, { color: theme.mute }]}>LAST</Text>
          <Text style={[styles.lastTimeValue, { color: theme.ink2 }]} numberOfLines={1}>
            {previous.sets
              .map(s => (bodyweight ? `${s.r} reps` : `${s.w}lb×${s.r}`))
              .join('  ')}
          </Text>
        </View>
      )}

      {previous && <Text style={[styles.lastTimeLabel, { color: theme.accent, marginTop: 8 }]}>TODAY</Text>}
      <View style={{ marginTop: previous ? 6 : 10, gap: 8 }}>
        {exercise.sets.map((set, setIdx) => (
          <SetRow key={setIdx} index={setIdx} set={set} bodyweight={bodyweight} theme={theme} onChange={patch => onUpdateSet(setIdx, patch)} />
        ))}
      </View>

      <Pressable onPress={onAddSet} style={{ marginTop: 10 }}>
        <Text style={{ color: theme.accent, fontFamily: 'Sora_600SemiBold', fontSize: 13 }}>+ Add set</Text>
      </Pressable>
    </View>
  );
}

function SetRow({
  index,
  set,
  bodyweight,
  theme,
  onChange,
}: {
  index: number;
  set: ActiveWorkoutSet;
  bodyweight: boolean;
  theme: Theme;
  onChange: (patch: Partial<ActiveWorkoutSet>) => void;
}) {
  return (
    <View
      style={[
        styles.setRow,
        { backgroundColor: set.done ? `${theme.accent}22` : theme.surface2, borderColor: set.done ? theme.accent : 'transparent' },
      ]}
    >
      <Text style={[styles.setIndex, { color: theme.mute }]}>S{index + 1}</Text>

      {!bodyweight && (
        <>
          {/* Tap-to-type numeric entry (PRD §11) — native keyboard, no custom stepper needed */}
          <TextInput
            value={String(set.w)}
            onChangeText={t => onChange({ w: parseFloat(t) || 0 })}
            keyboardType="decimal-pad"
            style={[styles.numInput, { color: theme.ink, backgroundColor: theme.surface, borderColor: theme.line }]}
          />
          <Text style={[styles.setUnit, { color: theme.mute }]}>lb ×</Text>
        </>
      )}

      <TextInput
        value={String(set.r)}
        onChangeText={t => onChange({ r: parseInt(t, 10) || 0 })}
        keyboardType="number-pad"
        style={[styles.numInput, { color: theme.ink, backgroundColor: theme.surface, borderColor: theme.line }]}
      />
      <Text style={[styles.setUnit, { color: theme.mute }]}>{bodyweight ? 'reps' : ''}</Text>

      <View style={{ flex: 1 }} />
      {/* Large completion target (PRD §11) — its own Pressable, not the whole
          row, so tapping into the inputs above never accidentally toggles it. */}
      <Pressable
        onPress={() => onChange({ done: !set.done })}
        hitSlop={8}
        style={[styles.checkCircle, { backgroundColor: set.done ? theme.accent : 'transparent', borderColor: set.done ? theme.accent : theme.line2 }]}
      >
        {set.done && <Text style={{ color: theme.accentInk, fontSize: 14, fontWeight: '700' }}>✓</Text>}
      </Pressable>
    </View>
  );
}

/** PRD §16: Finish Workout is already saved by the time this appears — this is a summary, not a second save step. */
function WorkoutCompleteModal({ session, theme, onDone }: { session: Session | null; theme: Theme; onDone: () => void }) {
  return (
    <Modal visible={!!session} animationType="fade" transparent onRequestClose={onDone}>
      <View style={styles.summaryBackdrop}>
        {session && (
          <View style={[styles.summarySheet, { backgroundColor: theme.surface, borderColor: theme.line }]}>
            <Text style={styles.summaryCheck}>✓</Text>
            <Text style={[styles.summaryTitle, { color: theme.ink, fontFamily: 'InstrumentSerif_400Regular' }]}>
              Workout Complete
            </Text>
            <View style={styles.summaryStatsRow}>
              <SummaryStat value={String(session.durationMin)} label="min" theme={theme} />
              <SummaryStat value={String(session.exercises.length)} label={session.exercises.length === 1 ? 'exercise' : 'exercises'} theme={theme} />
              <SummaryStat value={String(session.sets)} label="sets" theme={theme} />
            </View>
            {(session.volume > 0 || session.prs > 0) && (
              <View style={styles.summaryStatsRow}>
                {session.volume > 0 && <SummaryStat value={`${Math.round(session.volume)}lb`} label="volume" theme={theme} />}
                {session.prs > 0 && <SummaryStat value={String(session.prs)} label={session.prs === 1 ? 'PR' : 'PRs'} theme={theme} accent />}
              </View>
            )}
            <Pressable onPress={onDone} style={[styles.summaryDoneButton, { backgroundColor: theme.accent }]}>
              <Text style={{ color: theme.accentInk, fontFamily: 'Sora_700Bold', fontSize: 15 }}>Done</Text>
            </Pressable>
          </View>
        )}
      </View>
    </Modal>
  );
}

function SummaryStat({ value, label, theme, accent }: { value: string; label: string; theme: Theme; accent?: boolean }) {
  return (
    <View style={{ alignItems: 'center', flex: 1 }}>
      <Text style={{ color: accent ? theme.accent : theme.ink, fontSize: 20, fontFamily: 'InstrumentSerif_400Regular' }}>{value}</Text>
      <Text style={{ color: theme.mute, fontSize: 11, fontFamily: 'Sora_600SemiBold', marginTop: 2 }}>{label}</Text>
    </View>
  );
}

function AddExerciseModal({
  visible,
  theme,
  onClose,
  onPick,
}: {
  visible: boolean;
  theme: Theme;
  onClose: () => void;
  onPick: (lib: LibraryExercise) => void;
}) {
  const [query, setQuery] = useState('');
  const results = useMemo(() => {
    if (!query.trim()) return ALL_EXERCISES.slice(0, 20);
    const q = query.toLowerCase();
    return ALL_EXERCISES.filter(ex => ex.name.toLowerCase().includes(q)).slice(0, 30);
  }, [query]);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: theme.bg, paddingTop: 60 }}>
        <View style={[styles.rowBetween, { paddingHorizontal: 20, marginBottom: 12 }]}>
          <Text style={[styles.modalTitle, { color: theme.ink, fontFamily: 'InstrumentSerif_400Regular' }]}>Add Exercise</Text>
          <Pressable onPress={onClose} hitSlop={10}>
            <Text style={{ color: theme.mute, fontSize: 20 }}>✕</Text>
          </Pressable>
        </View>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search exercises…"
          placeholderTextColor={theme.mute}
          style={[styles.searchInput, { color: theme.ink, backgroundColor: theme.surface, borderColor: theme.line, marginHorizontal: 20 }]}
        />
        <FlatList
          data={results}
          keyExtractor={item => item.name}
          contentContainerStyle={{ padding: 20 }}
          renderItem={({ item }) => (
            <Pressable onPress={() => onPick(item)} style={[styles.resultRow, { borderColor: theme.line }]}>
              <Text style={[styles.resultName, { color: theme.ink }]}>{item.name}</Text>
              <Text style={[styles.resultMeta, { color: theme.mute }]}>
                {item.focus} · {item.kind}
              </Text>
            </Pressable>
          )}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 12 },
  emptyTitle: { fontSize: 30 },
  emptyBody: { fontSize: 14, fontFamily: 'Sora_400Regular', textAlign: 'center', lineHeight: 20 },
  startButton: { marginTop: 12, paddingHorizontal: 28, paddingVertical: 16, borderRadius: 999 },
  startButtonText: { fontSize: 16, fontFamily: 'Sora_700Bold' },
  container: { padding: 20, paddingBottom: 120, gap: 14 },
  header: { marginBottom: 4 },
  timer: { fontSize: 40 },
  headerMeta: { fontSize: 13, fontFamily: 'Sora_400Regular', marginTop: 2 },
  chipRow: { flexGrow: 0, marginBottom: 4 },
  chip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 8, marginRight: 8 },
  card: { borderRadius: 16, borderWidth: 1, padding: 14 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  emptyExerciseText: { fontSize: 13, fontFamily: 'Sora_400Regular', textAlign: 'center', lineHeight: 19 },
  exerciseName: { fontSize: 16, fontFamily: 'Sora_600SemiBold' },
  exerciseMeta: { fontSize: 12, fontFamily: 'Sora_400Regular', marginTop: 2 },
  setRow: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10, borderRadius: 12, borderWidth: 1 },
  setIndex: { fontSize: 12, fontFamily: 'Sora_600SemiBold', width: 20 },
  numInput: { width: 52, height: 36, borderRadius: 8, borderWidth: 1, textAlign: 'center', fontFamily: 'Sora_600SemiBold', fontSize: 14 },
  setUnit: { fontSize: 12, fontFamily: 'Sora_400Regular' },
  checkCircle: { width: 32, height: 32, borderRadius: 16, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  addButton: { borderWidth: 1, borderStyle: 'dashed', borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  addButtonText: { fontFamily: 'Sora_700Bold', fontSize: 14 },
  finishBar: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16, borderTopWidth: 1 },
  finishButton: { borderRadius: 16, paddingVertical: 16, alignItems: 'center' },
  finishButtonText: { fontSize: 16, fontFamily: 'Sora_700Bold' },
  modalTitle: { fontSize: 26 },
  searchInput: { borderWidth: 1, borderRadius: 12, padding: 12, fontSize: 14, fontFamily: 'Sora_400Regular' },
  resultRow: { paddingVertical: 12, borderBottomWidth: 1 },
  lastTimeRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8, marginTop: 10 },
  lastTimeLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5, fontFamily: 'Sora_700Bold' },
  lastTimeValue: { fontSize: 12, fontFamily: 'Sora_400Regular', flexShrink: 1 },
  summaryBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  summarySheet: { width: '100%', maxWidth: 360, borderRadius: 24, borderWidth: 1, padding: 28, alignItems: 'center' },
  summaryCheck: { fontSize: 40, marginBottom: 8 },
  summaryTitle: { fontSize: 26, marginBottom: 18 },
  summaryStatsRow: { flexDirection: 'row', width: '100%', marginBottom: 4 },
  summaryDoneButton: { marginTop: 16, width: '100%', paddingVertical: 15, borderRadius: 14, alignItems: 'center' },
  resultName: { fontSize: 15, fontFamily: 'Sora_600SemiBold' },
  resultMeta: { fontSize: 12, fontFamily: 'Sora_400Regular', marginTop: 2 },
});
