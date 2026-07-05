export type Announcement = { id: string; title: string; body: string };

export type AppConfig = {
  minSupportedVersion: string;
  latestVersion: string;
  updateMessage?: string;
  announcement?: Announcement | null;
  devNote?: string;
  pipeline?: string[];
};

// Shipped in the binary so first launch / offline always has content and never
// force-blocks (minSupportedVersion 0.0.0 => never below).
export const DEFAULT_APP_CONFIG: AppConfig = {
  minSupportedVersion: '0.0.0',
  latestVersion: '1.0.0',
  devNote: 'Made quietly, one gentle step at a time. Thank you for being here.',
  pipeline: ['Gentle reminders', 'Recurring tasks', 'A calm evening wind-down'],
  announcement: null,
};
