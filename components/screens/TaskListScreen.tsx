import React, { useRef, useState } from 'react';
import { ScrollView, Text, TextInput, View } from 'react-native';
import BaseScreen from './BaseScreen';
import Header from '@/components/ui/Header';
import SectionTitle from '@/components/ui/SectionTitle';
import TaskRow from '@/components/ui/TaskRow';
import PrimaryButton from '@/components/ui/PrimaryButton';
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
}: TaskListScreenProps) {
  const [isAddingTask, setIsAddingTask] = useState(false);
  const [draftTask, setDraftTask] = useState('');
  const inputRef = useRef<TextInput>(null);
  const canAddTasks = Boolean(onAddTask);

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
    setIsAddingTask(false);
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
                  <View
                    key={`${section.title}-${item.label}-${index}`}
                    className="border-b border-ink-quaternary/15 dark:border-ink-dark-quaternary/15 last:border-b-0"
                  >
                    <TaskRow
                      label={item.label}
                      time={item.time}
                      checked={item.checked}
                      onPress={onToggleTask ? () => onToggleTask(sectionIndex, index) : undefined}
                      onLongPress={
                        onRemoveTask ? () => onRemoveTask(sectionIndex, index) : undefined
                      }
                    />
                  </View>
                ))}
                {canAddTasks && isAddingTask && sectionIndex === 0 ? (
                  <View className="border-t border-ink-quaternary/15 dark:border-ink-dark-quaternary/15 py-[13px]">
                    <TextInput
                      ref={inputRef}
                      value={draftTask}
                      onChangeText={setDraftTask}
                      onSubmitEditing={submitTask}
                      onBlur={submitTask}
                      returnKeyType="done"
                      placeholder="New task"
                      placeholderTextColor="rgba(0,0,0,0.28)"
                      className="text-[21px] leading-7 text-ink-secondary dark:text-ink-dark-secondary"
                    />
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
