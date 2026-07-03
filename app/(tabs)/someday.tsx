import React from 'react';
import TaskListScreen from '@/components/screens/TaskListScreen';
import { strings } from '@/constants/strings';
import { useTaskList } from '@/hooks/TaskStore';

export default function SomedayScreen() {
  const { tasks, addTask, toggleTask, removeTask, editTask } = useTaskList('someday');

  return (
    <TaskListScreen
      greeting={strings.someday.greeting}
      sectionTitle={strings.someday.sectionTitle}
      sections={[{ title: strings.someday.sectionTitle, items: tasks }]}
      ctaLabel={strings.tasks.addCta}
      onAddTask={addTask}
      onToggleTask={toggleTask}
      onRemoveTask={removeTask}
      onEditTask={editTask}
    />
  );
}
