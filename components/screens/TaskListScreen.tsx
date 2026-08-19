import React, { useEffect, useRef, useState } from 'react';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColorScheme } from 'nativewind';
import { Keyboard, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import BaseScreen from './BaseScreen';
import GlassCard from '@/components/ui/GlassCard';
import Header from '@/components/ui/Header';
import SectionTitle from '@/components/ui/SectionTitle';
import TaskRow from '@/components/ui/TaskRow';
import PrimaryButton from '@/components/ui/PrimaryButton';
import { strings } from '@/constants/strings';
import { scrollTargetForRow } from '@/lib/scrollToRow';
import { TaskSection } from '@/types/task';

type TaskListScreenProps = {
  greeting: string;
  sectionTitle: string;
  sections: TaskSection[];
  ctaLabel: string;
  footerNote?: string;
  onAddTask?: (label: string) => void;
  onToggleTask?: (sectionIndex: number, itemIndex: number) => void;
  onRemoveTask?: (sectionIndex: number, itemIndex: number) => void;
  onEditTask?: (sectionIndex: number, itemIndex: number, label: string) => void;
  onPromoteTask?: (sectionIndex: number, itemIndex: number) => void;
};

export default function TaskListScreen({
  greeting,
  sectionTitle,
  sections,
  ctaLabel,
  footerNote,
  onAddTask,
  onToggleTask,
  onRemoveTask,
  onEditTask,
  onPromoteTask,
}: TaskListScreenProps) {
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [draftTask, setDraftTask] = useState('');
  const [editing, setEditing] = useState<{ section: number; item: number } | null>(null);
  const [editDraft, setEditDraft] = useState('');
  const inputRef = useRef<TextInput>(null);
  const editInputRef = useRef<TextInput>(null);
  const scrollRef = useRef<ScrollView>(null);
  const editingRowRef = useRef<View>(null);
  // Set on the commit button's pressIn (which fires before the input's blur)
  // so the blur handler knows to keep the input open for rapid entry.
  const keepInputOpenRef = useRef(false);
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const canAddTasks = Boolean(onAddTask);
  const hasDraft = draftTask.trim().length > 0;

  const startAddingTask = () => {
    if (!canAddTasks) {
      return;
    }

    // The input mounts with autoFocus, which raises the keyboard reliably. The
    // previous requestAnimationFrame(focus) raced the mount and frequently
    // lost, leaving the row open with no keyboard.
    setIsAddingTask(true);
  };

  const submitTask = () => {
    const label = draftTask.trim();

    if (!label || !onAddTask) {
      return;
    }

    onAddTask(label);
    setDraftTask('');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  const handleInputBlur = () => {
    const keepOpen = keepInputOpenRef.current;
    keepInputOpenRef.current = false;
    submitTask();

    if (!keepOpen) {
      setIsAddingTask(false);
    }
  };

  // Bring a freshly-opened input above the keyboard. automaticallyAdjustKeyboard-
  // Insets reserves the space, but on a long list the add row is already below
  // the fold, so it still needs scrolling to.
  useEffect(() => {
    if (!isAddingTask) {
      return;
    }

    const timer = setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 50);
    return () => clearTimeout(timer);
  }, [isAddingTask]);

  // Brings the row being edited above the keyboard. automaticallyAdjustKeyboard-
  // Insets (on the ScrollView below) reserves the space but never scrolls
  // off-screen content into it — same problem the add row above already
  // solved with scrollToEnd(), except an edited row can be anywhere in the
  // list, not always at the bottom, so this measures its actual position.
  useEffect(() => {
    if (!editing) {
      return;
    }

    const timer = setTimeout(() => {
      const scrollNode = scrollRef.current;
      const rowNode = editingRowRef.current;
      if (!scrollNode || !rowNode) {
        return;
      }

      // measureLayout wants a host-component ref to measure against. If
      // `scrollNode` (the ScrollView instance) isn't accepted directly by the
      // installed RN/TS version, swap in `scrollNode.getScrollResponder()` or
      // measure against a plain `View` wrapped around the ScrollView's
      // children instead — confirm whichever is needed on-device, since this
      // API has shifted across RN versions and jest's mocked native layer
      // can't catch a mismatch here (see Step 7).
      rowNode.measureLayout(
        scrollNode as unknown as React.ComponentRef<typeof View>,
        (_x, y) => scrollNode.scrollTo({ y: scrollTargetForRow(y), animated: true }),
        () => {}
      );
    }, 50);

    return () => clearTimeout(timer);
  }, [editing]);

  const startEditingTask = (sectionIndex: number, itemIndex: number, label: string) => {
    if (!onEditTask) {
      return;
    }

    setEditing({ section: sectionIndex, item: itemIndex });
    setEditDraft(label);
  };

  // Saves the trimmed draft if there is one; an emptied draft cancels the edit
  // rather than deleting the task (deletion has its own deliberate gesture).
  const commitEdit = () => {
    if (!editing) {
      return;
    }

    const label = editDraft.trim();

    if (label && onEditTask) {
      onEditTask(editing.section, editing.item, label);
    }

    setEditing(null);
    setEditDraft('');
  };

  // Both handlers close over current drafts, so they're mirrored into refs and
  // the listener below subscribes exactly once. Previously this effect had no
  // dependency array at all and tore down/re-subscribed on every render.
  const handleInputBlurRef = useRef(handleInputBlur);
  const commitEditRef = useRef(commitEdit);
  useEffect(() => {
    handleInputBlurRef.current = handleInputBlur;
    commitEditRef.current = commitEdit;
  });

  // Some keyboard-dismiss gestures (iOS swipe-down, Android back) hide the
  // keyboard without ever blurring the TextInput, so a row otherwise stays
  // stuck open with a "focused" input the user can't close. isFocused() still
  // reporting true here is exactly that case (a real blur, e.g. from the
  // commit button, has already cleared it by the time this fires), so force
  // the same close path that onBlur would have taken. This covers the edit row
  // too, which previously had no such safety net and could be left stranded.
  useEffect(() => {
    const hideSub = Keyboard.addListener('keyboardDidHide', () => {
      if (inputRef.current?.isFocused()) {
        inputRef.current.blur();
        handleInputBlurRef.current();
      }

      if (editInputRef.current?.isFocused()) {
        editInputRef.current.blur();
        commitEditRef.current();
      }
    });

    return () => hideSub.remove();
  }, []);

  return (
    <BaseScreen className="pt-2">
      <Header title={greeting} />
      <ScrollView
        ref={scrollRef}
        contentContainerClassName="pt-5"
        showsVerticalScrollIndicator={false}
        // Without these the keyboard simply covers the add row once the list is
        // long enough (iOS never moved anything), and taps aimed at the commit
        // button are swallowed by the scroll view's keyboard-dismiss responder,
        // which defaults to "never".
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        automaticallyAdjustKeyboardInsets
      >
        <GlassCard className="px-5 py-6">
          {sections.map((section, sectionIndex) => (
            <View
              key={section.title}
              className={`${sectionIndex === sections.length - 1 ? '' : 'mb-7'}`}
            >
              <SectionTitle title={sectionIndex === 0 ? sectionTitle : section.title} />
              <View className="rounded-[22px] px-4 py-2">
                {section.items.map((item, index) => (
                  <Animated.View
                    // Deliberately not index-keyed: completed tasks sink, so an
                    // index-based key would change for every row below the one
                    // just checked, remounting them all and replaying their
                    // entrance animation. Keyed on the label, React moves the
                    // existing row instead. (Two identical labels in one tab
                    // would collide, but the effect is cosmetic — mutations are
                    // index-based, not key-based.)
                    key={`${section.title}-${item.label}`}
                    entering={FadeInDown.duration(220)}
                    className="border-b border-ink-quaternary/15 dark:border-ink-dark-quaternary/15 last:border-b-0"
                  >
                    {editing?.section === sectionIndex && editing?.item === index ? (
                      <View ref={editingRowRef} className="flex-row items-center py-[10px]">
                        <TextInput
                          accessibilityLabel={strings.a11y.editTaskInput}
                          ref={editInputRef}
                          value={editDraft}
                          onChangeText={setEditDraft}
                          onSubmitEditing={commitEdit}
                          onBlur={commitEdit}
                          autoFocus
                          returnKeyType="done"
                          placeholderTextColor={
                            isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.28)'
                          }
                          className="flex-1 text-[17px] leading-6 text-ink-secondary dark:text-ink-dark-secondary"
                        />
                        <Pressable
                          accessibilityRole="button"
                          accessibilityLabel={strings.a11y.commitEdit}
                          disabled={!editDraft.trim()}
                          onPress={commitEdit}
                          hitSlop={8}
                          className={`ml-3 h-9 w-9 items-center justify-center rounded-full ${
                            editDraft.trim() ? 'bg-primary' : 'bg-primary/30'
                          }`}
                        >
                          <Feather name="check" size={18} color="#F6F2EC" />
                        </Pressable>
                      </View>
                    ) : (
                      <TaskRow
                        label={item.label}
                        time={item.time}
                        checked={item.checked}
                        carriedOver={item.carriedOver}
                        decayed={item.decayed}
                        onToggle={
                          onToggleTask ? () => onToggleTask(sectionIndex, index) : undefined
                        }
                        onLabelPress={
                          onEditTask
                            ? () => startEditingTask(sectionIndex, index, item.label)
                            : undefined
                        }
                        onDelete={
                          onRemoveTask ? () => onRemoveTask(sectionIndex, index) : undefined
                        }
                        onTagPress={
                          onPromoteTask ? () => onPromoteTask(sectionIndex, index) : undefined
                        }
                      />
                    )}
                  </Animated.View>
                ))}
                {canAddTasks && isAddingTask && sectionIndex === 0 ? (
                  <View className="flex-row items-center border-t border-ink-quaternary/15 dark:border-ink-dark-quaternary/15 py-[10px]">
                    <TextInput
                      accessibilityLabel={strings.a11y.newTaskInput}
                      ref={inputRef}
                      value={draftTask}
                      onChangeText={setDraftTask}
                      onBlur={handleInputBlur}
                      // No onSubmitEditing/submitBehavior: letting Done fall
                      // through to the default blur makes blur the single
                      // commit path, so "Done" genuinely finishes and closes
                      // the row. Rapid entry is still available through the
                      // arrow button, which keeps the row open deliberately.
                      autoFocus
                      returnKeyType="done"
                      placeholder={strings.tasks.newTaskPlaceholder}
                      placeholderTextColor={isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.28)'}
                      className="flex-1 text-[17px] leading-6 text-ink-secondary dark:text-ink-dark-secondary"
                    />
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={strings.a11y.commitTask}
                      disabled={!hasDraft}
                      onPressIn={() => {
                        keepInputOpenRef.current = true;
                      }}
                      onPress={submitTask}
                      hitSlop={8}
                      className={`ml-3 h-9 w-9 items-center justify-center rounded-full ${
                        hasDraft ? 'bg-primary' : 'bg-primary/30'
                      }`}
                    >
                      <Feather name="arrow-up" size={18} color="#F6F2EC" />
                    </Pressable>
                  </View>
                ) : null}
              </View>
            </View>
          ))}
          {sections.length === 1 ? (
            <PrimaryButton label={ctaLabel} onPress={startAddingTask} />
          ) : (
            <View className="mt-1">
              <PrimaryButton label={ctaLabel} onPress={startAddingTask} />
            </View>
          )}
        </GlassCard>
        {footerNote ? (
          <View className="mt-6 items-center pb-6">
            <Text className="font-serif text-base tracking-wide text-ink-tertiary dark:text-ink-dark-tertiary">
              {footerNote}
            </Text>
          </View>
        ) : null}
      </ScrollView>
    </BaseScreen>
  );
}
