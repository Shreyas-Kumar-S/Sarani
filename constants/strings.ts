export const strings = {
  welcome: {
    title: 'Welcome to Serein',
    tagline: 'From Attention to Intention',
    description: [
      'The world moves fast, and it wants all of you — every ping, every checklist, every task competing for the same sliver of attention your actual life needs. Somewhere in that race, the to-do list stopped serving you and started running you.',
      "Serein steps back from that. It doesn't try to pin down a reality that's always shifting — it simply stays beside it, holding a quiet record of what you meant to do, so intention never gets lost chasing attention.",
      'Let life stay unpredictable. Let Serein keep the thread.',
    ],
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
    coreIdea:
      "The world runs on attention. Serein runs on intention. It doesn't try to hold down a reality that keeps changing — it just keeps a quiet record of what you meant to do, so you never lose the thread while everything else moves.",
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
