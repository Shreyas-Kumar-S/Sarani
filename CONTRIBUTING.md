# Contributing to Serein

Thanks for considering pitching in. Serein is a calm, minimalist task manager — "move gently forward" isn't just the tagline, it's meant to shape how the code reads too: prefer quiet, deliberate choices over clever ones. This doc gets you from a fresh clone to a running app and a mental model of the codebase.

## Prerequisites

- Node.js (developed against v22; anything reasonably recent should work)
- Yarn (classic, v1.x)
- The Expo Go app on a physical device, and/or Xcode (iOS Simulator) / Android Studio (emulator) for local testing

## Getting started

```bash
git clone <repo-url>
cd Serein
yarn install
yarn start          # Expo dev server — scan the QR with Expo Go, or press i / a / w
```

Other useful scripts:

```bash
yarn ios             # iOS simulator (clears cache)
yarn android         # Android emulator
yarn web             # Web browser
yarn lint            # ESLint + Prettier check
yarn lint:fix        # Auto-fix lint errors
yarn test            # Run the full Jest suite
yarn test:watch      # Watch mode
yarn test:coverage   # Coverage report
```

> Windows note: config files (`babel.config.cjs`, `jest.config.cjs`, `metro.config.cjs`) use the `.cjs` extension because `package.json` sets `"type": "module"`. Don't rename them.

## The lay of the land

Full architecture detail lives in [`CLAUDE.md`](CLAUDE.md) (routing, component layers, state, styling conventions) — read that before your first real change. The short version:

- **`app/`** — expo-router file-based routes. `(tabs)/` holds the four tab screens (Today, Upcoming, Someday, History); each is a thin wrapper that reads/writes state and hands off to a template in `components/screens/`.
- **`components/screens/`** — full-screen templates (data in, layout out).
- **`components/ui/`** — small, reusable primitives (buttons, rows, cards). Check here before writing new UI — a lot of what you need probably already exists.
- **`hooks/`** — state and persistence. `TaskStore.tsx` is the center of gravity: a single `TaskProvider` holds Today/Upcoming/Someday task state *and* the History data derived from it (see "How History works" below). `rollover.ts` is the pure daily-carryover logic; `taskStorage.ts` / `historyStorage.ts` are the AsyncStorage read/write layers.
- **`lib/`** — pure, side-effect-free logic (date formatting, Sanity client, version-gate logic). If it doesn't touch React state, it probably belongs here, not in `hooks/`.
- **`types/`** — shared domain types, so data/state modules never need to import from UI components.
- **`constants/strings.ts`** — every piece of user-facing copy lives here, not inline in components. If you're adding text, add it here first.

### How History actually works (the part that isn't obvious from the file layout)

History isn't a separate data store you write to directly — it's derived from the other three tabs:
- Today's entire day list (done or not) is mirrored live into history as it happens.
- Completing an Upcoming/Someday task logs it under the day you completed it (not the day you created it); un-checking it removes that log entry.
- Promoting a carried-over Today task to Upcoming preserves its completion if it was already checked off — this used to silently drop it, so if you touch `promoteToUpcoming` in `TaskStore.tsx`, check the tests around it first.

`hooks/__tests__/TaskStore.test.tsx` is the best map of these rules in executable form — read it before changing the store.

## Conventions

- **Path alias**: use `@/` for cross-module imports (`@/hooks/TaskStore`); keep same-directory imports relative (`./Sibling`).
- **Styling**: NativeWind (`className`) everywhere, using the design tokens in `tailwind.config.js` (`surface-*`, `ink-*`, `primary`) — avoid raw hex/rgba in components; if a token doesn't exist yet, add it to the config rather than inlining a one-off color. Tokens are hex, not `hsla()` — a chromatic (non-zero-saturation) `hsla()` value was found to render inconsistently across devices; keep new tokens hex too.
- **Dark mode**: automatic via NativeWind's `dark:` variant, driven by `useColorScheme()`. Always add a `dark:` counterpart when you add a color class.
- **Comments**: default to none. Only add one when the *why* isn't obvious from the code — a workaround, a non-obvious invariant, a platform-specific gotcha. Don't narrate what the code already says.
- **No premature abstraction**: three similar lines beat a shared helper built for a hypothetical second caller. Extract when the second real caller shows up.
- **Tests**: co-located in `__tests__/` next to the code they cover, using `jest-expo` + React Native Testing Library. Snapshot files are committed. New logic in `hooks/` or `lib/` should ship with a test alongside it, following the existing files' style (arrange fixtures at the top, `describe`/`it` blocks, no test-only exports from production files).

## Before opening a PR

```bash
yarn lint
yarn test
npx tsc --noEmit
```

All three should be clean. If you touch anything visual, actually run it (`yarn web` is the fastest loop) rather than trusting types/tests alone — they verify correctness, not that a screen looks right.

## Where the roadmap lives

`docs/superpowers/specs/` and `docs/superpowers/plans/` hold the dated, point-in-time planning docs (product roadmap, v1 scope, implementation plans). Treat them as historical records, not living docs — if reality has drifted from one, add a new dated doc rather than editing the old one (see `2026-07-18-v1-readiness-status.md` for an example of re-verifying an older doc's checklist against the actual code).

That readiness doc is also the best source of **what to work on** if you're looking for a first contribution — it lists exactly which v1 checklist items are done, partial, or untouched.

## Getting help

This is an early-stage, small-team project — if something in here is unclear or you hit a decision that isn't documented, open an issue or ask before guessing. Small, focused PRs over large ones; split unrelated cleanup from feature work.
