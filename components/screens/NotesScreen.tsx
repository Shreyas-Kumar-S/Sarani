import React, { useRef, useState } from 'react';
import { Feather } from '@expo/vector-icons';
import { FlashList } from '@shopify/flash-list';
import * as Haptics from 'expo-haptics';
import { Pressable, Text, TextInput, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import BaseScreen from './BaseScreen';
import Header from '@/components/ui/Header';
import NoteRow from '@/components/ui/NoteRow';
import PrimaryButton from '@/components/ui/PrimaryButton';
import { strings } from '@/constants/strings';
import { groupNotes, type NoteDaySection } from '@/hooks/noteGrouping';
import type { Note } from '@/types/note';

type NotesScreenProps = {
  title: string;
  notes: Note[];
  ctaLabel: string;
  onAddNote?: (text: string) => void;
  onEditNote?: (id: string, text: string) => void;
  onDeleteNote?: (id: string) => void;
};

// A quiet daily stream: notes fall under the day they were written.
export default function NotesScreen({
  title,
  notes,
  ctaLabel,
  onAddNote,
  onEditNote,
  onDeleteNote,
}: NotesScreenProps) {
  const [isComposing, setIsComposing] = useState(false);
  const [draft, setDraft] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState('');
  const inputRef = useRef<TextInput>(null);
  // Same rapid-entry trick as the task screen: the commit button's pressIn
  // fires before the input's blur, letting blur know to keep the composer open.
  const keepComposerOpenRef = useRef(false);

  const days = groupNotes(notes);
  const canCompose = Boolean(onAddNote);
  const hasDraft = draft.trim().length > 0;

  const startComposing = () => {
    if (!canCompose) {
      return;
    }

    setIsComposing(true);
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  const submitNote = () => {
    const text = draft.trim();

    if (!text || !onAddNote) {
      return;
    }

    onAddNote(text);
    setDraft('');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  const handleComposerBlur = () => {
    const keepOpen = keepComposerOpenRef.current;
    keepComposerOpenRef.current = false;
    submitNote();

    if (!keepOpen) {
      setIsComposing(false);
    }
  };

  const startEditing = (note: Note) => {
    if (!onEditNote) {
      return;
    }

    setEditingId(note.id);
    setEditDraft(note.text);
  };

  // An emptied draft cancels the edit rather than deleting the note —
  // deletion has its own deliberate gesture.
  const commitEdit = () => {
    if (!editingId) {
      return;
    }

    const text = editDraft.trim();

    if (text && onEditNote) {
      onEditNote(editingId, text);
    }

    setEditingId(null);
    setEditDraft('');
  };

  const renderNote = (note: Note, isLast: boolean) => (
    <Animated.View
      key={note.id}
      entering={FadeInDown.duration(220)}
      className={
        isLast ? '' : 'border-b border-ink-dark-quaternary/25 dark:border-ink-dark-quaternary/25'
      }
    >
      {editingId === note.id ? (
        <View className="flex-row items-center py-5">
          <TextInput
            value={editDraft}
            onChangeText={setEditDraft}
            onSubmitEditing={commitEdit}
            onBlur={commitEdit}
            autoFocus
            returnKeyType="done"
            placeholderTextColor="rgba(255,255,255,0.35)"
            className="flex-1 text-lg leading-7 font-serif text-ink-dark-primary"
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={strings.a11y.commitEdit}
            disabled={!editDraft.trim()}
            onPress={commitEdit}
            hitSlop={8}
            className={`ml-3 h-9 w-9 items-center justify-center rounded-full ${
              editDraft.trim() ? 'bg-white/25' : 'bg-white/10'
            }`}
          >
            <Feather name="check" size={18} color="#DDE4DF" />
          </Pressable>
        </View>
      ) : (
        <NoteRow
          text={note.text}
          onPress={onEditNote ? () => startEditing(note) : undefined}
          onDelete={onDeleteNote ? () => onDeleteNote(note.id) : undefined}
        />
      )}
    </Animated.View>
  );

  // Each day is one FlashList item: a rounded card holding the day's heading
  // and its notes. Chunking by day keeps the grouped-card design intact while
  // FlashList recycles offscreen days as the journal grows.
  const renderDay = ({ item }: { item: NoteDaySection }) => (
    <View className="mt-4 rounded-[28px] bg-white/10 dark:bg-white/5 px-6 py-2">
      <Text className="pt-4 pb-1 text-[13px] font-medium uppercase tracking-[2px] text-ink-dark-tertiary">
        {item.title}
      </Text>
      {item.notes.map((note, index) => renderNote(note, index === item.notes.length - 1))}
    </View>
  );

  const listHeader = (
    <>
      <View className="rounded-[28px] bg-white/10 dark:bg-white/5 px-7 py-5">
        <View className="flex-row items-center gap-4">
          <Feather name="feather" size={26} color="#DDE4DF" />
          <Text className="flex-1 text-lg leading-7 font-serif text-ink-dark-primary">
            {strings.notes.intro}
          </Text>
        </View>
      </View>

      {canCompose && isComposing ? (
        <View className="mt-4 flex-row items-center rounded-[28px] bg-white/10 dark:bg-white/5 px-6 py-3">
          <TextInput
            ref={inputRef}
            value={draft}
            onChangeText={setDraft}
            onSubmitEditing={submitNote}
            onBlur={handleComposerBlur}
            submitBehavior="submit"
            returnKeyType="done"
            placeholder={strings.notes.newNotePlaceholder}
            placeholderTextColor="rgba(255,255,255,0.35)"
            className="flex-1 text-lg leading-7 font-serif text-ink-dark-primary"
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={strings.a11y.commitNote}
            disabled={!hasDraft}
            onPressIn={() => {
              keepComposerOpenRef.current = true;
            }}
            onPress={submitNote}
            hitSlop={8}
            className={`ml-3 h-9 w-9 items-center justify-center rounded-full ${
              hasDraft ? 'bg-white/25' : 'bg-white/10'
            }`}
          >
            <Feather name="arrow-up" size={18} color="#DDE4DF" />
          </Pressable>
        </View>
      ) : null}

      {notes.length === 0 && !isComposing ? (
        <View className="mt-4 rounded-[28px] bg-white/10 dark:bg-white/5 px-7 py-8">
          <Text className="text-center text-lg leading-7 font-serif text-ink-dark-secondary">
            {strings.notes.empty}
          </Text>
        </View>
      ) : null}
    </>
  );

  return (
    <BaseScreen className="pt-2" variant="notes">
      <Header title={title} centered inverted />
      <FlashList
        data={days}
        keyExtractor={(day) => day.key}
        renderItem={renderDay}
        ListHeaderComponent={listHeader}
        ListFooterComponent={
          <PrimaryButton label={ctaLabel} variant="notes" onPress={startComposing} />
        }
        contentContainerStyle={{ paddingTop: 20, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      />
    </BaseScreen>
  );
}
