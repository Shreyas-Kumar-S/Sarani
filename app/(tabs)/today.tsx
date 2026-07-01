import React from 'react';
import TaskListScreen from '@/components/screens/TaskListScreen';
import { useTaskList } from '@/hooks/TaskStore';

export default function TodayScreen() {
  const { tasks, addTask, toggleTask, removeTask } = useTaskList('today');

  return (
    <TaskListScreen
      greeting="Today's focus"
      sectionTitle="Today"
      sections={[{ title: 'Today', items: tasks }]}
      ctaLabel="+ Add task"
      footerNote="Move gently forward"
      onAddTask={addTask}
      onToggleTask={toggleTask}
      onRemoveTask={removeTask}
    />
  );
}
