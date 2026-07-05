# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Serein is a calm, minimalist task manager built with React Native + Expo SDK 54. The guiding aesthetic — "move gently forward" — influences both UX and code style: prefer quiet, deliberate choices over clever ones.

## Commands

```bash
# Development
yarn start              # Start Expo dev server
yarn ios                # iOS simulator (clears cache)
yarn android            # Android emulator
yarn web                # Web browser

# Quality
yarn lint               # ESLint + Prettier check
yarn lint:fix           # Auto-fix lint errors

# Tests
yarn test               # Run all Jest tests
yarn test:watch         # Watch mode
yarn test:coverage      # Coverage report
jest path/to/test.tsx   # Run a single test file
```

> Config files use `.cjs` extension (`babel.config.cjs`, `jest.config.cjs`, `metro.config.cjs`) because `package.json` sets `"type": "module"`.

## Architecture

### Routing — expo-router file-based

```
app/
  _layout.tsx           # Root: splash gate → Stack navigator
  index.tsx             # Redirects to /(tabs)/today
  (tabs)/
    _layout.tsx         # Floating blurred tab bar (Today / Upcoming / Someday / Lists)
    today.tsx
    upcoming.tsx
    someday.tsx
    lists.tsx
```

`_layout.tsx` controls the two-phase startup: native splash → custom animated SVG splash → main app.

### Component layers

```
components/
  screens/              # Full-screen templates (data-in, layout-out)
    BaseScreen.tsx      # SafeAreaView wrapper; variant="notes" swaps background
    TaskListScreen.tsx  # Reusable task list with inline add-task input
    NotesScreen.tsx     # Dark green notes variant
  ui/                   # Primitive building blocks
    Header.tsx
    SectionTitle.tsx
    TaskRow.tsx
    PrimaryButton.tsx
    AtmosphericBackground.tsx  # Drifting blurred blobs (persistent bg layer)
  SplashScreen.tsx      # Reanimated fade-out wrapper
  SplashLogo.tsx        # SVG logo, exports SplashLogoLight + SplashLogoDark
```

Tab screens are thin: they read/write task state and call the matching screen template. Presentation lives in `components/screens/`.

### State — task store

`hooks/TaskStore.tsx` holds a single `TaskProvider` (mounted in `(tabs)/_layout.tsx`) keyed by tab (`today` / `upcoming` / `someday`). Screens use `useTaskList(tab)`; the tab bar uses `useTabAllComplete(tab)` to flip its icon to a ticked square once every task in a tab is checked. Lifting this state up is what lets the tab bar react to per-tab completion.

### Domain types

Shared types live in `types/` (`types/task.ts` → `TaskItem`, `TaskSection`; `types/note.ts` → `NoteBlock`) so data and state modules never import from UI components.

### Styling — NativeWind (Tailwind for RN)

All styling uses NativeWind `className` props. The design token vocabulary lives in `tailwind.config.js`:

- **Surfaces**: `bg-surface-page`, `bg-surface-primary`, `bg-surface-dark-*`
- **Text**: `text-ink-primary`, `text-ink-secondary`, `text-ink-dark-*` (opacity-based scale)
- **Brand green**: `primary` (#7A9B76 light / #9DB89A dark)
- **Typography**: `font-serif` = Georgia stack; default sans = system

Dark mode is driven by `useColorScheme()` from NativeWind. The `dark:` variant works automatically.

### Mock data

`data/mock/notes.ts` — exports `notesBlocks` (typed as `NoteBlock[]`), consumed by the Lists tab.

Task tabs start empty (first-run experience); users add their own. There is no backend or persistence yet.

### Path alias

`@/*` resolves to the repo root — configured in `tsconfig.json` (type-checking + Metro) and mirrored in `jest.config.cjs` `moduleNameMapper`. Prefer it for cross-module imports; keep same-directory imports relative (`./Sibling`).

### Tests

Tests live co-located in `__tests__/` directories next to the code they cover. The jest preset is `jest-expo`. Snapshot files are committed.
