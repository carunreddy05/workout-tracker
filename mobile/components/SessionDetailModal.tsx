import { useEffect, useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet, Modal, Alert } from 'react-native';
import { format } from 'date-fns';

import type { Theme } from '@/constants/Colors';
import { updateSession } from '@/lib/workoutRepo';
import { isBodyweightOnly } from '../../src/utils/exerciseMeasurement';
import { parseDateKey } from '../../src/utils/week';
import type { Session, Exercise, Set as WorkoutSet } from '../../src/types/WorkoutEntry';

/**
 * Shared view/edit session detail — used by both the History list and
 * Home's calendar day-tap (PRD §16 "edit from History afterward", §18
 * calendar tap-through). Editing is scoped to weight/reps/done on existing
 * sets only (no add/remove exercise or set) and deliberately does not
 * recompute PRs — see lib/workoutRepo.ts's updateSession for why.
 */
export default function SessionDetailModal({
  session,
  theme,
  onClose,
  onUpdated,
}: {
  session: Session | null;
  theme: Theme;
  onClose: () => void;
  onUpdated: () => void;
}) {
  const [editMode, setEditMode] = useState(false);
  const [draft, setDraft] = useState<Exercise[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setDraft(session ? session.exercises.map(ex => ({ ...ex, sets: ex.sets.map(s => ({ ...s })) })) : []);
    setEditMode(false);
  }, [session?.id]);

  const updateDraftSet = (exIdx: number, setIdx: number, patch: Partial<WorkoutSet>) => {
    setDraft(prev =>
      prev.map((ex, i) =>
        i === exIdx ? { ...ex, sets: ex.sets.map((s, j) => (j === setIdx ? { ...s, ...patch } : s)) } : ex
      )
    );
  };

  const handleSave = async () => {
    if (!session) return;
    setSaving(true);
    try {
      await updateSession(session.id, draft);
      setEditMode(false);
      onUpdated();
    } catch (err) {
      console.warn('Failed to update session:', err);
      Alert.alert("Couldn't save changes", 'Check your connection and try again.', [{ text: 'OK' }]);
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    if (editMode && session) {
      setDraft(session.exercises.map(ex => ({ ...ex, sets: ex.sets.map(s => ({ ...s })) })));
      setEditMode(false);
    }
    onClose();
  };

  return (
    <Modal visible={!!session} animationType="slide" onRequestClose={handleClose}>
      <View style={{ flex: 1, backgroundColor: theme.bg, paddingTop: 60 }}>
        {session && (
          <>
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.date, { color: theme.mute }]}>{format(parseDateKey(session.date), 'EEEE, MMMM d')}</Text>
            <Text style={[styles.title, { color: theme.ink, fontFamily: 'InstrumentSerif_400Regular' }]}>
              {session.title || 'Workout'}
            </Text>
            <Text style={[styles.meta, { color: theme.mute }]}>
              {session.durationMin} min · {session.sets} sets
              {session.volume > 0 ? ` · ${Math.round(session.volume)} lb volume` : ''}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 16, alignItems: 'center' }}>
            {session.exercises.length > 0 && (
              <Pressable onPress={() => setEditMode(e => !e)} hitSlop={10}>
                <Text style={{ color: theme.accent, fontFamily: 'Sora_600SemiBold', fontSize: 14 }}>
                  {editMode ? 'Cancel' : 'Edit'}
                </Text>
              </Pressable>
            )}
            <Pressable onPress={handleClose} hitSlop={10}>
              <Text style={{ color: theme.mute, fontSize: 22 }}>✕</Text>
            </Pressable>
          </View>
        </View>

        <ScrollView contentContainerStyle={{ padding: 20, gap: 12, paddingBottom: editMode ? 100 : 20 }}>
          {draft.length === 0 ? (
            <Text style={{ color: theme.mute, fontFamily: 'Sora_400Regular' }}>
              No exercises logged — a quick workout, and it still counts.
            </Text>
          ) : (
            draft.map((ex, exIdx) => {
              const bodyweight = isBodyweightOnly(ex.name);
              return (
                <View key={exIdx} style={[styles.exerciseCard, { backgroundColor: theme.surface, borderColor: theme.line }]}>
                  <Text style={{ color: theme.ink, fontFamily: 'Sora_600SemiBold', fontSize: 15 }}>{ex.name}</Text>

                  {editMode ? (
                    <View style={{ gap: 8, marginTop: 10 }}>
                      {ex.sets.map((set, setIdx) => (
                        <View
                          key={setIdx}
                          style={[styles.setRow, { backgroundColor: set.done ? `${theme.accent}22` : theme.surface2, borderColor: set.done ? theme.accent : 'transparent' }]}
                        >
                          <Text style={{ color: theme.mute, fontSize: 12, fontFamily: 'Sora_600SemiBold', width: 20 }}>S{setIdx + 1}</Text>
                          {!bodyweight && (
                            <>
                              <TextInput
                                value={String(set.w)}
                                onChangeText={t => updateDraftSet(exIdx, setIdx, { w: parseFloat(t) || 0 })}
                                keyboardType="decimal-pad"
                                style={[styles.numInput, { color: theme.ink, backgroundColor: theme.surface, borderColor: theme.line }]}
                              />
                              <Text style={{ color: theme.mute, fontSize: 12 }}>lb ×</Text>
                            </>
                          )}
                          <TextInput
                            value={String(set.r)}
                            onChangeText={t => updateDraftSet(exIdx, setIdx, { r: parseInt(t, 10) || 0 })}
                            keyboardType="number-pad"
                            style={[styles.numInput, { color: theme.ink, backgroundColor: theme.surface, borderColor: theme.line }]}
                          />
                          {bodyweight && <Text style={{ color: theme.mute, fontSize: 12 }}>reps</Text>}
                          <View style={{ flex: 1 }} />
                          <Pressable
                            onPress={() => updateDraftSet(exIdx, setIdx, { done: !set.done })}
                            hitSlop={8}
                            style={[styles.checkCircle, { backgroundColor: set.done ? theme.accent : 'transparent', borderColor: set.done ? theme.accent : theme.line2 }]}
                          >
                            {set.done && <Text style={{ color: theme.accentInk, fontSize: 13, fontWeight: '700' }}>✓</Text>}
                          </Pressable>
                        </View>
                      ))}
                    </View>
                  ) : (
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
                      {ex.sets.map((set, j) => (
                        <View key={j} style={[styles.setChip, { backgroundColor: theme.surface2, borderColor: theme.line }]}>
                          <Text style={{ color: theme.ink2, fontSize: 12, fontFamily: 'Sora_600SemiBold' }}>
                            {bodyweight ? `${set.r} reps` : `${set.w}lb × ${set.r}`}
                            {set.pr ? ' ✦' : ''}
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              );
            })
          )}
        </ScrollView>

        {editMode && (
          <View style={[styles.saveBar, { backgroundColor: theme.bg, borderColor: theme.line }]}>
            <Pressable
              onPress={handleSave}
              disabled={saving}
              style={[styles.saveButton, { backgroundColor: saving ? theme.mute : theme.accent }]}
            >
              <Text style={{ color: theme.accentInk, fontFamily: 'Sora_700Bold', fontSize: 15 }}>
                {saving ? 'Saving…' : 'Save Changes'}
              </Text>
            </Pressable>
          </View>
        )}
          </>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', paddingHorizontal: 20 },
  date: { fontSize: 12, fontFamily: 'Sora_600SemiBold' },
  title: { fontSize: 28, marginTop: 2 },
  meta: { fontSize: 13, fontFamily: 'Sora_400Regular', marginTop: 4 },
  exerciseCard: { borderRadius: 14, borderWidth: 1, padding: 14 },
  setChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, borderWidth: 1 },
  setRow: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 10, borderRadius: 12, borderWidth: 1 },
  numInput: { width: 52, height: 34, borderRadius: 8, borderWidth: 1, textAlign: 'center', fontFamily: 'Sora_600SemiBold', fontSize: 14 },
  checkCircle: { width: 30, height: 30, borderRadius: 15, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  saveBar: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: 16, borderTopWidth: 1 },
  saveButton: { borderRadius: 16, paddingVertical: 16, alignItems: 'center' },
});
