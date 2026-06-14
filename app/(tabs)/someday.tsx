import React from 'react';
import TaskListScreen from '../../components/screens/TaskListScreen';
import { somedaySections } from '../../data/mock/tasks';

export default function SomedayScreen() {
  return (
    <TaskListScreen
      greeting="Hello again"
      sectionTitle="This weekend"
      sections={somedaySections}
      ctaLabel="+ Add task"
    />
  );
}
