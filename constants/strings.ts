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
    lists: 'Lists',
  },

  today: {
    greeting: "Today's focus",
    sectionTitle: 'Today',
    footerNote: 'Move gently forward',
  },

  upcoming: {
    greeting: 'Coming up',
    sectionTitle: 'Tomorrow',
  },

  someday: {
    greeting: 'Someday, maybe',
    sectionTitle: 'This weekend',
  },

  tasks: {
    addCta: '+ Add task',
    newTaskPlaceholder: 'New task',
  },

  notes: {
    title: 'Notes',
    intro: 'Get thoughts out of your head\nand breathe a little easier',
    newNoteCta: '+ New note',
  },

  a11y: {
    toggleTheme: 'Toggle color theme',
  },
} as const;
