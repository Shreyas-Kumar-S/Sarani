import type { TaskSection } from '../../components/screens/TaskListScreen';

export const todaySections: TaskSection[] = [
  {
    title: 'Today',
    items: [
      { label: 'Yoga + meditation', checked: true },
      { label: 'Mindful walk outside' },
      { label: 'Call Sarah (3pm)', time: '3:00' },
      { label: 'Read 15 pages' },
      { label: 'Wake up slow\n10-min podcast' },
    ],
  },
];

export const upcomingSections: TaskSection[] = [
  {
    title: 'Tomorrow',
    items: [{ label: 'Plan week ahead' }, { label: 'Pick up package' }],
  },
  {
    title: 'Thursday',
    items: [{ label: 'Dentist appointment', time: '11:00' }],
  },
  {
    title: 'This weekend',
    items: [{ label: 'Grocery shop' }, { label: 'Plant new flowers' }],
  },
];

export const somedaySections: TaskSection[] = [
  {
    title: 'This weekend',
    items: [{ label: 'Sketch the habit overview' }, { label: 'Collect favorite quiet moments' }],
  },
  {
    title: 'Ideas',
    items: [{ label: 'Build a weekly reflection view' }, { label: 'Explore soft color themes' }],
  },
];
