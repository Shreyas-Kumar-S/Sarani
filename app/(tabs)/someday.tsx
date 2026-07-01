import React from 'react';
import TaskListScreen from '@/components/screens/TaskListScreen';
import { useTaskList } from '@/hooks/TaskStore';

export default function SomedayScreen() {
  const { tasks, addTask, toggleTask, removeTask } = useTaskList('someday');

  return (
    <TaskListScreen
      greeting="Someday, maybe"
      sectionTitle="This weekend"
      sections={[{ title: 'This weekend', items: tasks }]}
      ctaLabel="+ Add task"
      onAddTask={addTask}
      onToggleTask={toggleTask}
      onRemoveTask={removeTask}
    />
  );
}
