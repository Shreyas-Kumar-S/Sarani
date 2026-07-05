import React from 'react';
import TaskListScreen from '@/components/screens/TaskListScreen';
import { strings } from '@/constants/strings';
import { useTaskList } from '@/hooks/TaskStore';

export default function UpcomingScreen() {
  const { tasks, addTask, toggleTask, removeTask, editTask } = useTaskList('upcoming');

  return (
    <TaskListScreen
      greeting={strings.upcoming.greeting}
      sectionTitle={strings.upcoming.sectionTitle}
      sections={[{ title: strings.upcoming.sectionTitle, items: tasks }]}
      ctaLabel={strings.tasks.addCta}
      onAddTask={addTask}
      onToggleTask={toggleTask}
      onRemoveTask={removeTask}
      onEditTask={editTask}
    />
  );
}
