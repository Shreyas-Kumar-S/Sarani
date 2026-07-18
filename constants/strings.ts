// Single source of truth for user-facing copy. Keep display text here (not inline
// in components) so wording/tone can be tuned in one place.
export const strings = {
  welcome: {
    title: 'Welcome to Serein',
    tagline: 'Move Gently Forward',
    description:
      "This is a quiet space for your intentions, kept on your device and available offline. There's nothing to keep up with here. Take things as they come.",
  },

  tabs: {
    today: 'Today',
    upcoming: 'Upcoming',
    someday: 'Someday',
    history: 'History',
  },

  today: {
    greeting: "Today",
    sectionTitle: "Today's Focus",
    footerNote: 'Move gently forward',
  },

  upcoming: {
    greeting: 'Coming up',
    sectionTitle: 'Tomorrow',
  },

  someday: {
    greeting: 'Someday',
    sectionTitle: 'This weekend',
  },

  history: {
    emptyTitle: 'This month is quiet so far',
    emptyCta: 'Go to Today',
  },

  tasks: {
    addCta: '+ Add task',
    newTaskPlaceholder: 'New task',
    carriedOverTag: 'Undone',
  },

  actions: {
    letItGo: 'Let it go',
  },

  a11y: {
    toggleTheme: 'Toggle color theme',
    commitTask: 'Add this task',
    commitEdit: 'Save changes',
  },

  update: {
    blockedTitle: 'Time for a fresh start',
    blockedBody: 'This version has gently retired. Update to keep moving forward.',
    button: 'Update Serein',
    nudgeTitle: 'A new version is gently waiting',
    nudgeBody: "When you have a moment, there's a fresh update for Serein.",
    later: 'Later',
  },
} as const;
