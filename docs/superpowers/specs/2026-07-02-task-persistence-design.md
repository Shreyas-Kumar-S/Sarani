# Local task persistence + daily rollover — design

Date: 2026-07-02
Status: Approved (design), pending implementation plan

## Problem

Tasks live only in `TaskProvider` in-memory state (`hooks/TaskStore.tsx`). Any
reload — app restart on native, browser refresh on web — wipes every task. We
want tasks to persist locally on-device so they survive reloads.

Additionally, the "Today" bucket should not silently accumulate stale work.
When a new day begins, completed Today tasks should clear, and unfinished ones
should remain in Today but visibly marked as carried over ("Undone"), with a
one-tap way to move them into Upcoming.

## Goals

- Tasks in all three buckets (Today / Upcoming / Someday) persist across
  reloads on iOS, Android, and web.
- On a new day: Today's completed tasks are removed; Today's unfinished tasks
  stay in Today and are flagged as carried over.
- A carried-over task shows a small "Undone" tag; tapping the tag moves that
  task into Upcoming.

## Storage engine decision

Use **`react-native-mmkv`** for native (iOS/Android) and **`localStorage`** on
web, behind one small synchronous key-value abstraction. Rationale:

- MMKV is synchronous and fast. Because `localStorage` is also synchronous, the
  entire persistence layer is synchronous on every platform — the store can
  read saved state during its initial render, so there is **no async load, no
  `hydrated` flag, and no empty-list flash**.
- MMKV is a native module: it does **not** run in Expo Go and requires a
  development build (`expo prebuild` + a dev client / EAS build). See "Build &
  workflow impact" below.

## Non-goals (YAGNI)

- No backend or cloud sync.
- No per-task creation/due dates — a single `lastOpenedDate` drives the
  rollover rule.
- No changes to Upcoming/Someday rollover behavior.
- No async/hydration handling — the sync storage layer makes it unnecessary.

## Build & workflow impact (MMKV)

- `react-native-mmkv` is a native module; **Expo Go can no longer run the app.**
  The project must move to a development build:
  - `npx expo prebuild` to generate native projects, then `npx expo run:ios` /
    `run:android` (or an EAS dev-client build) for day-to-day dev.
  - The `yarn ios` / `yarn android` scripts (currently plain `expo start`) will
    be updated to the dev-build flow as part of implementation.
- Web (`yarn web`) is unaffected and continues to work via `localStorage`.
- No config plugin is required for MMKV; autolinking handles it after prebuild.
- `react-native-mmkv` v3 requires the New Architecture, which is enabled by
  default on Expo SDK 54 — expected to be a non-issue, to be confirmed at
  implementation time.

## Data model (`types/task.ts`)

Add one optional field to `TaskItem`:

```ts
carriedOver?: boolean; // a Today task that survived a day change → wears the "Undone" tag
```

Only Today tasks ever set this. Default (absent/`false`) means a normal task.

## Persistence layer

Two levels, so JSON logic is written once and only the raw KV backend is
platform-split:

### Synchronous KV backend (platform-split via Metro extensions)

A minimal interface:

```ts
type Kv = {
  getString(key: string): string | undefined;
  set(key: string, value: string): void;
};
```

- `hooks/storage/kv.native.ts` — backed by a module-level `new MMKV()` instance.
- `hooks/storage/kv.web.ts` — backed by `window.localStorage` (guarded with a
  `typeof window` check so static web rendering doesn't crash).

Metro resolves `./storage/kv` to the correct file per platform; consumers never
branch on platform themselves.

### Task storage (`hooks/taskStorage.ts`, platform-agnostic)

- Single storage key: `serein.tasks.v1` (versioned for future migrations).
- Persisted shape:

  ```ts
  type PersistedState = {
    tasksByTab: Record<TabKey, TaskItem[]>;
    lastOpenedDate: string; // local YYYY-MM-DD
  };
  ```

- `loadTasks(): PersistedState | null` — synchronous. Reads the key via the KV
  backend, `JSON.parse`s, and merges `tasksByTab` over the empty defaults so a
  missing tab key never crashes. On any read/parse error, logs quietly and
  returns `null` (treated as first run).
- `saveTasks(state: PersistedState): void` — synchronous. `JSON.stringify` +
  `kv.set`, wrapped in try/catch.
- A small date helper produces the local `YYYY-MM-DD` string.

## Rollover logic (pure function)

`applyDailyRollover(tasksByTab, lastOpenedDate, today)`:

- If `lastOpenedDate === today` → return the input unchanged (and signal "no
  change" so the caller can skip a redundant write).
- Otherwise, transform the **Today** bucket only:
  - Drop tasks where `checked === true`.
  - Mark every remaining (unchecked) task `carriedOver: true`.
  - Leave Upcoming and Someday untouched.

Pure: no storage access, no reading the clock inside — the caller passes
`today`. This keeps it trivially unit-testable.

## Store (`hooks/TaskStore.tsx`)

Because storage is synchronous, state is correct from the first render — no
hydration flag needed.

- **Initial state** via a `useState` initializer that runs once:
  1. `loadTasks()`.
  2. `applyDailyRollover(loaded?.tasksByTab ?? EMPTY_TASKS, loaded?.lastOpenedDate, today)`.
  3. Return the rolled state as the initial `tasksByTab`.
- **On mount** (one effect): `saveTasks({ tasksByTab, lastOpenedDate: today })`
  once, so the rollover result and the new `lastOpenedDate` are recorded even
  if the user makes no edits this session.
- **Persist effect** on `[tasksByTab]`: `saveTasks({ tasksByTab, lastOpenedDate:
  today })`. Safe to run on every change — the initial state already reflects
  saved data, so there is no empty-state clobber risk.
- **New action** `promoteToUpcoming(index)`: removes the task at `index` from
  Today (clearing its `carriedOver` flag) and appends it to Upcoming.
- Existing `addTask` / `toggleTask` / `removeTask` are unchanged; persistence
  is a side effect of state change, not something each action calls directly.
- The screen-facing `useTaskList('today')` gains a `promoteTask(index)` binding;
  other tabs are unaffected.

## UI

- **`components/ui/TaskRow.tsx`**: add optional `carriedOver?: boolean` and
  `onTagPress?: () => void`. When `carriedOver` is set, render a small, calm
  pill labelled "Undone" (muted brand-green family, consistent with the
  minimalist aesthetic) as its own `Pressable` invoking `onTagPress`. The row's
  existing `onPress` (toggle complete) and `onLongPress` (remove) are
  unchanged; the pill is a separate touch target.
- **`components/screens/TaskListScreen.tsx`**: add an optional
  `onPromoteTask?: (sectionIndex, itemIndex) => void`; pass `item.carriedOver`
  and a per-item tag handler into `TaskRow`.
- **`app/(tabs)/today.tsx`**: wire `promoteTask` from the store into
  `onPromoteTask`. `upcoming.tsx` / `someday.tsx` pass nothing new.

## Testing (co-located `__tests__/`)

- **Pure rollover** (`applyDailyRollover`): same-day is a no-op; a day change
  clears completed Today tasks and tags the remaining ones `carriedOver`;
  Upcoming/Someday are untouched. No mocks needed.
- **Task storage** (`taskStorage`): `saveTasks` then `loadTasks` round-trips.
  The KV backend is mocked with a simple in-memory `Map` (our own `Kv`
  interface, so no MMKV/localStorage runtime needed in Jest). Malformed/absent
  data yields `null`.
- **Store** (`TaskStore`): initializes from stored state; `promoteToUpcoming`
  removes from Today, clears the flag, and appends to Upcoming.

## Files touched

- `package.json` — add `react-native-mmkv` (via `expo install`); update
  `ios` / `android` scripts to the dev-build flow.
- `app.json` — no plugin needed; native projects come from `expo prebuild`.
- `types/task.ts` — `carriedOver` field.
- `hooks/storage/kv.native.ts`, `hooks/storage/kv.web.ts` — sync KV backends.
- `hooks/taskStorage.ts` — synchronous load/save + date helper.
- `hooks/TaskStore.tsx` — sync init, persist effect, `promoteToUpcoming`,
  `applyDailyRollover` (pure module).
- `components/ui/TaskRow.tsx` — "Undone" tag.
- `components/screens/TaskListScreen.tsx` — thread promote handler + flag.
- `app/(tabs)/today.tsx` — wire promote action.
- `jest.config.cjs` — only if a mock wiring for the KV module is needed.
- New `__tests__/` files for rollover, storage, and store.
