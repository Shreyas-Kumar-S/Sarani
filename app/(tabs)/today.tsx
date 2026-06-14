import React, { useState } from 'react';
import TaskListScreen, { TaskItem } from '../../components/screens/TaskListScreen';

export default function TodayScreen() {
  const [tasks, setTasks] = useState<TaskItem[]>([]);

  const addTask = (label: string) => {
    setTasks((currentTasks) => [...currentTasks, { label, checked: false }]);
  };

  const toggleTask = (_sectionIndex: number, itemIndex: number) => {
    setTasks((currentTasks) =>
      currentTasks.map((task, index) =>
        index === itemIndex ? { ...task, checked: !task.checked } : task
      )
    );
  };

  return (
    <TaskListScreen
      greeting="Good morning"
      sectionTitle="Today"
      sections={[{ title: 'Today', items: tasks }]}
      ctaLabel="+ Add task"
      footerNote="Move gently forward"
      onAddTask={addTask}
      onToggleTask={toggleTask}
    />
  );
}
