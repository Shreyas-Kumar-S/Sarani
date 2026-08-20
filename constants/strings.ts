export const strings = {
  welcome: {
    title: 'Welcome to Sarani',
    // Shown directly under the title, dictionary-style — the name is unfamiliar
    // by design, so it explains itself at first contact rather than in a menu.
    nameMeaning: 'सरणी — a path, and a row of things set down',
    tagline: 'From Attention to Intention',
    privacyPromise: 'No account. No cloud. Yours — offline, always.',
    description: [
      'Life is unpredictable — let’s focus on what truly matters.',
      'A quiet space for thoughts, tasks and intentions.',
      'Let life stay unpredictable. Let Sarani keep the thread.',
    ],
  },

  tabs: {
    today: 'Today',
    upcoming: 'Next Day',
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
    nameLabel: 'THE NAME',
    nameMeaning:
      'Sarani — सरणी — is Sanskrit for a path, and also for a row: a line of things set down in order. It grows from सृ (sṛ), to flow, to move onward. Both meanings live here. Your days are the path; each day is a row of small things you meant to do.',
    coreIdea:
      "The world runs on attention. Sarani runs on intention. It doesn't try to hold down a reality that keeps changing — it just keeps a quiet record of what you meant to do, so you never lose the thread while everything else moves.",
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
    },

  tasks: {
    addCta: '+ Add task',
    newTaskPlaceholder: 'New task',
    carriedOverTag: 'Undone',
    // First-pass copy — wording deliberately deferred; change freely.
    decayedTag: 'Been a while',
  },

  actions: {
    letItGo: 'Let it go',
  },

  a11y: {
    toggleTheme: 'Toggle color theme',
    commitTask: 'Add this task',
    commitEdit: 'Save changes',
    openAbout: 'About Sarani',
    closeAbout: 'Close',
    editTaskPrefix: 'Edit',
    editTaskInput: 'Edit task text',
    newTaskInput: 'New task text',
    moveToUpcoming: 'Move to Upcoming',
    addTask: 'Add task',
    addTaskHint: 'Press and hold to capture a task',
  },

  errorBoundary: {
    title: 'Something went quietly wrong',
    body: "This screen ran into a problem. It's been noted — try again, or come back to it a little later.",
    retry: 'Try again',
  },

  update: {
    blockedTitle: 'Time for a fresh start',
    blockedBody: 'This version has gently retired. Update to keep moving forward.',
    button: 'Update Sarani',
    nudgeTitle: 'A new version is gently waiting',
    nudgeBody: "When you have a moment, there's a fresh update for Sarani.",
    later: 'Later',
  },
} as const;
