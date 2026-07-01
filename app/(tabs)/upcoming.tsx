import React from 'react';
import TaskListScreen from '@/components/screens/TaskListScreen';
import { useTaskList } from '@/hooks/TaskStore';

export default function UpcomingScreen() {
  const { tasks, addTask, toggleTask, removeTask } = useTaskList('upcoming');

  return (
    <TaskListScreen
      greeting="Coming up"
      sectionTitle="Tomorrow"
      sections={[{ title: 'Tomorrow', items: tasks }]}
      ctaLabel="+ Add task"
      onAddTask={addTask}
      onToggleTask={toggleTask}
      onRemoveTask={removeTask}
    />
  );
}
