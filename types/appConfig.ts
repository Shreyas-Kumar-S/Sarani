export type Announcement = { id: string; title: string; body: string };

export type UpcomingFeature = { title: string; description: string };

export type AppConfig = {
  minSupportedVersion: string;
  latestVersion: string;
  updateMessage?: string;
  announcement?: Announcement | null;
  upcomingFeatures?: UpcomingFeature[];
};

// Shipped in the binary so first launch / offline always has content and never
// force-blocks (minSupportedVersion 0.0.0 => never below).
export const DEFAULT_APP_CONFIG: AppConfig = {
  minSupportedVersion: '0.0.0',
  latestVersion: '1.0.0',
  upcomingFeatures: [
    { title: 'Streaks & reminders', description: 'Gentle nudges to keep your habits going.' },
    { title: 'Weekly reflections', description: 'A quiet summary of how your week went.' },
    { title: 'Shared lists', description: 'Plan someday goals together with others.' },
  ],
  announcement: null,
};
