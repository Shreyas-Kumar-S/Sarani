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

  about: {
    title: 'Origins',
    tagline: 'A calm space to plan your day, week, and someday — one gentle task at a time.',
    exploreSectionsLabel: 'EXPLORE SECTIONS',
    featuresComingLabel: 'FEATURES TO COME',
    sections: {
      today: {
        label: 'Today',
        description:
          "Add the tasks you want to get done today — your immediate, in-the-moment focus.",
      },
      upcoming: {
        label: 'Upcoming',
        description:
          "Plan ahead. Tomorrow holds the tasks you're preparing for next, before they become today's work.",
      },
      someday: {
        label: 'Someday',
        description:
          'A holding space for longer-term or someday/maybe work — things worth doing eventually, no deadline attached.',
      },
      history: {
        label: 'History',
        description:
          "A record of everything you've completed, organized by month, so you can look back gently on your progress.",
      },
      about:{
        label: 'About',
        description: "Where you are right now, shows the apps info"
      },
    },
    upcomingFeatures: [
      { title: 'Streaks & reminders', description: 'Gentle nudges to keep your habits going.' },
      { title: 'Weekly reflections', description: 'A quiet summary of how your week went.' },
      { title: 'Shared lists', description: 'Plan someday goals together with others.' },
    ],
  },

  nav: {
    flameToast: 'Stay tuned',
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
    openAbout: 'About Serein',
    closeAbout: 'Close',
    flameTeaser: 'Coming soon',
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
