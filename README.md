# Serein

**Move Gently Forward**

A calm, minimalist task manager built with React Native and Expo. Serein explores how software can feel quiet, predictable, and respectful of attention — both in UX and in engineering. No account, no cloud, no streaks to break: your tasks stay on your device.

## Tech stack

- React Native (Expo SDK 54) + TypeScript
- [expo-router](https://docs.expo.dev/router/introduction/) — file-based routing
- [NativeWind](https://www.nativewind.dev/) — Tailwind for React Native
- [react-native-reanimated](https://docs.swmansion.com/react-native-reanimated/) + `react-native-gesture-handler` — animations and swipe gestures
- AsyncStorage — local, offline-first persistence
- Sanity (read-only) — remote app config, force-update gating, announcements
- Jest + React Native Testing Library — co-located tests

## Current features

**Today / Upcoming / Someday** — three task lists with a shared interaction language: tap the checkbox to complete, tap the label to edit in place, swipe left to delete ("let it go"). All state lives in a single `TaskProvider` (`hooks/TaskStore.tsx`) so the tab bar can reflect per-tab completion.

**Daily rollover** — tasks left unfinished on Today automatically carry forward the next time the app opens, tagged "Undone." Tapping that tag promotes the task into Upcoming.

**History** — a real, data-backed record of what you actually did, not a mock. Each day's Today list is mirrored live into history as it happens (done or not); completing an Upcoming/Someday task logs it under the day you finished it. Browse by month via a horizontally-scrolling strip with a "liquid" pill indicator that stretches and springs between months as you drag; an empty month offers a "Go to Today" call to action instead of a dead end.

**Light & dark mode** — a single persistent toggle that glides from the welcome screen into a docked corner position on first launch, then just works everywhere after.

**Startup choreography** — a deterministic animated SVG splash, followed by a one-time welcome curtain (title/tagline/description, staggered entrance) on first launch only; repeat launches skip straight to the app.

**Remote config, offline-safe** — a single Sanity document drives force-update (blocking) and update-nudge (dismissible) modals plus an announcement modal, all with baked-in fallback content so the app never hangs or blocks if the fetch fails or there's no connection.

**Quality bar** — TypeScript throughout, ESLint + Prettier, and a co-located Jest test suite (20 suites, ~80 tests) covering the task store, rollover logic, persistence, and date/history formatting.

## Feature plan

_Adapted from the product roadmap — reflects where the app has actually landed today. The originally-scoped "Notes" journal / "Lists" tab was superseded by the History tab described above during development._

### V1 — free core, launch-ready
- **Gentle reminders** — opt-in notifications, no red badge counts, soft copy
- **Recurring tasks** — daily/weekly repeat
- **Export / backup** — plain JSON or text, so leaving is always easy
- **Privacy-promise onboarding** — three calm intro screens ending in "No account. No cloud. Yours."
- **Developer notes section** — a quiet "from the maker" note + a "what's coming" list, Sanity-backed
- **Evening wind-down ritual** (signature feature) — one soft daily notification opening a 30-second review: glance at what rolled over, add or move tomorrow's tasks, done
- Production readiness: real icons/splash, EAS build profiles, store listings, a privacy policy, an error boundary, a real-device + accessibility pass

### V1.5 — "Serein Pro" (one-time unlock, no subscription)
- **Atmosphere themes** for the animated background (Rain, Forest, Dawn, Night)
- **Home-screen widgets** (iOS + Android)
- **Encrypted backup + import**
- **Alternate app icons**, **focus mode** (one task at a time)

### V2 — sync, sharing & the web app (one subscription, one backend)
Cross-device sync, a web app, and tap-to-share are treated as one project, built once. Local-first and end-to-end encrypted throughout — offline stays the default, sync is additive, and the server never sees plaintext. Households before companies; a serverless QR/deep-link snapshot share comes before live shared lists.

### Deliberately not planned
Tags, priorities, projects/sub-tasks, calendar integrations, AI features, and sign-in before it's genuinely required for sync (v2). Saying no to feature-parity with the bigger apps is the point.
