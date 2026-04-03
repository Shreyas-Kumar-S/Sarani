import TaskListScreen from '../../components/screens/TaskListScreen';
import { todaySections } from '../../data/mock/tasks';

export default function TodayScreen() {
  return (
    <TaskListScreen
      greeting="Good morning"
      sectionTitle="Today"
      sections={todaySections}
      ctaLabel="+ Add task"
      footerNote="Move gently forward"
    />
  );
}
