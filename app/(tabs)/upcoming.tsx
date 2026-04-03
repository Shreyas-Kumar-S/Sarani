import TaskListScreen from '../../components/screens/TaskListScreen';
import { upcomingSections } from '../../data/mock/tasks';

export default function UpcomingScreen() {
  return (
    <TaskListScreen
      greeting="Hello again"
      sectionTitle="Tomorrow"
      sections={upcomingSections}
      ctaLabel="+ Add task"
    />
  );
}
