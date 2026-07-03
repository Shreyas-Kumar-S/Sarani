import React, { useRef, useState } from 'react';
import { Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useColorScheme } from 'nativewind';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import BaseScreen from './BaseScreen';
import Header from '@/components/ui/Header';
import SectionTitle from '@/components/ui/SectionTitle';
import TaskRow from '@/components/ui/TaskRow';
import PrimaryButton from '@/components/ui/PrimaryButton';
import { strings } from '@/constants/strings';
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

    setIsAddingTask(true);
    requestAnimationFrame(() => inputRef.current?.focus());
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

  return (
    <BaseScreen className="pt-2">
      <Header title={greeting} />
      <ScrollView contentContainerClassName="pt-5" showsVerticalScrollIndicator={false}>
        <View className="rounded-[28px] bg-white dark:bg-surface-dark-primary/90 px-5 py-6 shadow-lg shadow-black/[0.09] dark:shadow-black/[0.22] border border-black/[0.05] dark:border-transparent">
          {sections.map((section, sectionIndex) => (
            <View
              key={section.title}
              className={`${sectionIndex === sections.length - 1 ? '' : 'mb-7'}`}
            >
              <SectionTitle title={sectionIndex === 0 ? sectionTitle : section.title} />
              <View className="rounded-[22px] bg-surface-secondary dark:bg-surface-dark-secondary/80 px-4 py-2">
                {section.items.map((item, index) => (
                  <Animated.View
                    key={`${section.title}-${item.label}-${index}`}
                    entering={FadeInDown.duration(220)}
                    className="border-b border-ink-quaternary/15 dark:border-ink-dark-quaternary/15 last:border-b-0"
                  >
                    {editing?.section === sectionIndex && editing?.item === index ? (
                      <View className="flex-row items-center py-[13px]">
                        <TextInput
                          value={editDraft}
                          onChangeText={setEditDraft}
                          onSubmitEditing={commitEdit}
                          onBlur={commitEdit}
                          autoFocus
                          returnKeyType="done"
                          placeholderTextColor={
                            isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.28)'
                          }
                          className="flex-1 text-[21px] leading-7 text-ink-secondary dark:text-ink-dark-secondary"
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
                  <View className="flex-row items-center border-t border-ink-quaternary/15 dark:border-ink-dark-quaternary/15 py-[13px]">
                    <TextInput
                      ref={inputRef}
                      value={draftTask}
                      onChangeText={setDraftTask}
                      onSubmitEditing={submitTask}
                      onBlur={handleInputBlur}
                      submitBehavior="submit"
                      returnKeyType="done"
                      placeholder={strings.tasks.newTaskPlaceholder}
                      placeholderTextColor={isDark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.28)'}
                      className="flex-1 text-[21px] leading-7 text-ink-secondary dark:text-ink-dark-secondary"
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
        </View>
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
