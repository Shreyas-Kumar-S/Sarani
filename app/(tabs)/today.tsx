import React from 'react';
import TaskListScreen from '@/components/screens/TaskListScreen';
import { strings } from '@/constants/strings';
import { useTaskList } from '@/hooks/TaskStore';

export default function TodayScreen() {
  const { tasks, addTask, toggleTask, removeTask } = useTaskList('today');

  return (
    <TaskListScreen
      greeting={strings.today.greeting}
      sectionTitle={strings.today.sectionTitle}
      sections={[{ title: strings.today.sectionTitle, items: tasks }]}
      ctaLabel={strings.tasks.addCta}
      footerNote={strings.today.footerNote}
      onAddTask={addTask}
      onToggleTask={toggleTask}
      onRemoveTask={removeTask}
    />
  );
}
