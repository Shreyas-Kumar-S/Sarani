# Task List Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship checklist items 1–4 — a fixed History header, a keyboard fix for mid-list editing, a decay tag on stale Tomorrow tasks, and completed Tomorrow/Someday tasks moving into History — as five independently testable, independently shippable changes.

**Architecture:** All five tasks live inside the existing task-list subsystem (`hooks/TaskStore.tsx`, `components/screens/TaskListScreen.tsx`, `components/screens/HistoryScreen.tsx`, `components/ui/TaskRow.tsx`) plus two new pure-logic modules under `lib/`. No new dependencies, no native code, no screens added. Every task keeps `jest`/`tsc`/`expo lint` as its verification gate — this plan has no manual/on-device steps except one explicitly-flagged spot in Task 2.

**Tech Stack:** Expo SDK 56, React Native 0.85, TypeScript 6, NativeWind, Reanimated 4, Jest (`jest-expo` preset) + `@testing-library/react-native`.

**Spec:** `docs/checklist.md` — items 1–4 (item 5, the flame/widget capture flow, is `docs/superpowers/plans/2026-08-18-flame-widget-capture.md`, a separate plan).

## Global Constraints

- No new runtime dependencies — everything here is achievable with what's already installed.
- Match existing conventions exactly: pure/testable logic lives in `lib/`, not inline in components or hooks (see `lib/historyDates.ts`, `lib/rollover.ts` precedent). Display-only derived fields on `TaskItem` (like the existing `carriedOver`) are never persisted to storage.
- `useTaskList`'s display order is already a sort-and-remap layer over the stored array (`hooks/TaskStore.tsx:248-274`) — every mutation callback goes through `storedIndex()`, not the raw display index. Any new code touching that hook must preserve this; a raw index into the displayed `tasks` array is never a valid index into the stored array.
- Row keys in `TaskListScreen.tsx` are label-based, not index-based (`components/screens/TaskListScreen.tsx:193`) — don't reintroduce index keys.
- Run `npx tsc --noEmit`, `npx jest --ci`, and `npx expo lint` after every task; all three must be clean before moving on.

---

## Task 1: History tab — fixed header, scrolling content only

**Files:**
- Modify: `components/screens/HistoryScreen.tsx`
- Test: `components/screens/__tests__/HistoryScreen.test.tsx`

**Interfaces:**
- Consumes: `HistoryMonthSelector` (`components/ui/HistoryMonthSelector.tsx`, unchanged props), `HistoryDayGroup` (unchanged), `useHistory()` (unchanged).
- Produces: nothing new consumed elsewhere — this is a leaf-screen layout change.

Right now the title, the month/year label, `HistoryMonthSelector`, and every day's history all live inside one `ScrollView` (`components/screens/HistoryScreen.tsx:47-100`). The info button and theme toggle are already fixed (they're mounted at the root layout level, outside any tab screen) — only this screen's own header content scrolls away, which is the actual bug.

- [ ] **Step 1: Write the failing test**

Add to `components/screens/__tests__/HistoryScreen.test.tsx`, inside the existing `describe('HistoryScreen', ...)` block:

```tsx
  it('keeps the title and month selector outside the scrolling day list', () => {
    mockDatesWithHistory = ['2026-06-01'];
    mockGetDay.mockReturnValue([{ label: 'a done thing', checked: true }]);

    const { getByTestId } = renderScreen();
    const scrollArea = getByTestId('history-day-scroll');

    // Day content lives inside the scrolling area...
    expect(within(scrollArea).getByText('a done thing')).toBeTruthy();
    // ...but the title and month selector do not, so they stay fixed while it scrolls.
    expect(within(scrollArea).queryByText('June 2026')).toBeNull();
    expect(within(scrollArea).queryByLabelText('select-JUN-2026')).toBeNull();
  });
```

Add the `within` import at the top of the file:

```tsx
import { fireEvent, render, within } from '@testing-library/react-native';
```

(replacing the existing `import { fireEvent, render } from '@testing-library/react-native';`)

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest --ci components/screens/__tests__/HistoryScreen.test.tsx -t "keeps the title and month selector"`
Expected: FAIL — `getByTestId('history-day-scroll')` throws, since no element has that `testID` yet.

- [ ] **Step 3: Split the screen into a fixed header and a scrolling body**

Replace the `return` statement in `components/screens/HistoryScreen.tsx` (currently lines 47-100) with:

```tsx
  return (
    <View className="flex-1 bg-surface-inset dark:bg-surface-dark-inset">
      <View
        style={{
          paddingTop: insets.top + 26,
          paddingHorizontal: SCREEN_PADDING_HORIZONTAL,
        }}
      >
        <Text className="font-serif text-[32px] text-ink-primary dark:text-ink-dark-primary">
          {activeMonth.fullLabel} {activeMonth.year}
        </Text>

        <HistoryMonthSelector
          months={months}
          activeMonthKey={activeMonthKey}
          onSelect={setActiveMonthKey}
          containerWidth={screenWidth - SCREEN_PADDING_HORIZONTAL * 2}
        />
      </View>

      <ScrollView
        testID="history-day-scroll"
        showsVerticalScrollIndicator={false}
        // 24px replaces the header's old `mt-6` gap above the day-history
        // card, now that the card is this ScrollView's first child instead
        // of a sibling further down the same scroll region.
        contentContainerStyle={{
          paddingTop: 24,
          paddingBottom: insets.bottom + 96,
          paddingHorizontal: SCREEN_PADDING_HORIZONTAL,
        }}
      >
        <View className="self-start rounded-t-xl bg-primary/85 px-4 py-2 dark:bg-primary-dark">
          <Text className="text-[13px] font-semibold text-white">
            {activeMonth.fullLabel} History
          </Text>
        </View>
        <View className="rounded-b-2xl rounded-tr-2xl bg-primary/85 p-2 shadow-md dark:bg-primary-dark">
          <View className="rounded-b-xl rounded-tr-xl bg-surface-primary px-4 py-5 dark:bg-surface-dark-primary">
            {days.length === 0 ? (
              <View className="items-center py-6">
                <Text className="mb-1 text-center text-[15px] text-ink-tertiary dark:text-ink-dark-tertiary">
                  {strings.history.emptyTitle}
                </Text>
                <PrimaryButton
                  label={strings.history.emptyCta}
                  onPress={() => router.push('/(tabs)/today')}
                />
              </View>
            ) : (
              days.map((day, index) => (
                <HistoryDayGroup key={day.date} day={day} isLast={index === days.length - 1} />
              ))
            )}
          </View>
        </View>
      </ScrollView>
    </View>
  );
```

This removes the old outer `<View className="mt-6">` wrapper (its gap is now the ScrollView's own `paddingTop: 24`) and drops the old single `ScrollView`'s `contentContainerStyle`'s `paddingTop: insets.top + 26` (that padding moved to the new fixed header `View`, since the ScrollView no longer starts at the very top of the screen).

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest --ci components/screens/__tests__/HistoryScreen.test.tsx`
Expected: PASS — all 6 tests in the file (the 5 existing ones plus the new one).

- [ ] **Step 5: Full verification**

Run: `npx tsc --noEmit && npx expo lint`
Expected: both clean.

- [ ] **Step 6: Commit**

```bash
git add components/screens/HistoryScreen.tsx components/screens/__tests__/HistoryScreen.test.tsx
git commit -m "fix: keep History's title and month selector fixed while content scrolls"
```

---

## Task 2: Scroll a mid-list edit into view above the keyboard

**Files:**
- Create: `lib/scrollToRow.ts`
- Test: `lib/__tests__/scrollToRow.test.ts`
- Modify: `components/screens/TaskListScreen.tsx`

**Interfaces:**
- Produces: `scrollTargetForRow(measuredY: number, topMargin?: number): number` — a pure clamp, consumed only by `TaskListScreen.tsx` in this plan, but written as a standalone module (matching `lib/historyDates.ts`'s `nearestIndex` precedent) so it stays unit-testable independent of any native measurement.

The add row already scrolls itself into view once the list is long enough to push it below the fold (`components/screens/TaskListScreen.tsx:90-100`, the `isAddingTask` effect calling `scrollRef.current?.scrollToEnd(...)`). Editing a task via `startEditingTask` (`TaskListScreen.tsx:102-109`) has no equivalent — on a long list, tapping a task label near the middle can open its editor underneath the keyboard.

- [ ] **Step 1: Write the failing test for the pure clamp**

Create `lib/__tests__/scrollToRow.test.ts`:

```ts
import { scrollTargetForRow } from '../scrollToRow';

describe('scrollTargetForRow', () => {
  it('positions the row topMargin px below the scroll top by default', () => {
    expect(scrollTargetForRow(500)).toBe(476);
  });

  it('honors a custom top margin', () => {
    expect(scrollTargetForRow(100, 40)).toBe(60);
  });

  it('never returns a negative scroll offset for a row near the top', () => {
    expect(scrollTargetForRow(10)).toBe(0);
    expect(scrollTargetForRow(0)).toBe(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest --ci lib/__tests__/scrollToRow.test.ts`
Expected: FAIL — `Cannot find module '../scrollToRow'`.

- [ ] **Step 3: Write the pure implementation**

Create `lib/scrollToRow.ts`:

```ts
// Clamped scroll target for bringing a specific row into view inside a
// ScrollView. `measuredY` is the row's position relative to the ScrollView's
// *content* — what `View.measureLayout(scrollViewNode, ...)` returns, which
// (unlike `.measure()`) is independent of the ScrollView's current scroll
// offset, so this is a direct, scroll-position-agnostic target rather than a
// delta to add to the current offset.
export function scrollTargetForRow(measuredY: number, topMargin = 24): number {
  return Math.max(0, measuredY - topMargin);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest --ci lib/__tests__/scrollToRow.test.ts`
Expected: PASS, all 3 tests.

- [ ] **Step 5: Wire it into TaskListScreen**

In `components/screens/TaskListScreen.tsx`, add the import alongside the existing ones:

```tsx
import { scrollTargetForRow } from '@/lib/scrollToRow';
```

Add a ref for the currently-editing row, next to the existing refs (after `const scrollRef = useRef<ScrollView>(null);` at line 47):

```tsx
  const editingRowRef = useRef<View>(null);
```

Add a new effect immediately after the existing `isAddingTask` scroll effect (after line 100, before `startEditingTask` at line 102):

```tsx
  // Brings the row being edited above the keyboard. automaticallyAdjustKeyboard-
  // Insets (on the ScrollView below) reserves the space but never scrolls
  // off-screen content into it — same problem the add row above already
  // solved with scrollToEnd(), except an edited row can be anywhere in the
  // list, not always at the bottom, so this measures its actual position.
  useEffect(() => {
    if (!editing) {
      return;
    }

    const timer = setTimeout(() => {
      const scrollNode = scrollRef.current;
      const rowNode = editingRowRef.current;
      if (!scrollNode || !rowNode) {
        return;
      }

      // measureLayout wants a host-component ref to measure against. If
      // `scrollNode` (the ScrollView instance) isn't accepted directly by the
      // installed RN/TS version, swap in `scrollNode.getScrollResponder()` or
      // measure against a plain `View` wrapped around the ScrollView's
      // children instead — confirm whichever is needed on-device, since this
      // API has shifted across RN versions and jest's mocked native layer
      // can't catch a mismatch here (see Step 7).
      rowNode.measureLayout(
        scrollNode as unknown as React.ComponentRef<typeof View>,
        (_x, y) => scrollNode.scrollTo({ y: scrollTargetForRow(y), animated: true }),
        () => {}
      );
    }, 50);

    return () => clearTimeout(timer);
  }, [editing]);
```

In the JSX, attach `editingRowRef` to the edit-mode row's wrapper `View` (the one at what's currently line 198, `<View className="flex-row items-center py-[10px]">` inside the `editing?.section === sectionIndex && editing?.item === index ? (...)` branch):

```tsx
                      <View ref={editingRowRef} className="flex-row items-center py-[10px]">
```

- [ ] **Step 6: Run the full test suite to confirm no regression**

Run: `npx jest --ci`
Expected: PASS, all suites — this step adds no new RNTL-level test (native layout/measurement doesn't run under jest; see the comment on `measureLayout` above), so the bar here is that nothing existing breaks.

- [ ] **Step 7: Manual on-device verification**

This is the one step in this plan that can't be settled by `jest`/`tsc` — `measureLayout` needs a real native layout pass. On a physical device or emulator:
1. Add enough tasks to one tab that the list scrolls (15+).
2. Tap a task label near the middle of the list to edit it.
3. Confirm the row is visible above the keyboard, not hidden beneath it.
4. If it isn't, check the console for a `measureLayout` error and apply the fallback noted in Step 5's comment.

- [ ] **Step 8: Full verification**

Run: `npx tsc --noEmit && npx expo lint`
Expected: both clean.

- [ ] **Step 9: Commit**

```bash
git add lib/scrollToRow.ts lib/__tests__/scrollToRow.test.ts components/screens/TaskListScreen.tsx
git commit -m "fix: scroll a mid-list task edit above the keyboard"
```

---

## Task 3: `createdAt` on tasks, with load-time migration

**Files:**
- Modify: `types/task.ts`
- Modify: `hooks/taskStorage.ts`
- Modify: `hooks/TaskStore.tsx`
- Create: `lib/taskDecay.ts`
- Test: `hooks/__tests__/taskStorage.test.ts` (modifies one existing test, adds one)
- Test: `lib/__tests__/taskDecay.test.ts`
- Test: `hooks/__tests__/TaskStore.test.tsx` (adds one test)

**Interfaces:**
- Produces: `TaskItem.createdAt?: string` (local `YYYY-MM-DD`, same format as `todayString()`); `loadTasks(today?: string): Promise<PersistedState | null>` (new optional param, existing no-arg calls keep working); `DECAY_THRESHOLD_DAYS: number`, `daysBetween(from: string, to: string): number`, `isDecayed(task: Pick<TaskItem, 'checked' | 'createdAt'>, today: string): boolean` — all from `lib/taskDecay.ts`, consumed by Task 4.
- Consumes: nothing new.

This is the foundation Task 4 builds on. `TaskItem` has no timestamp today, so "open for more than two days" has nothing to measure from.

- [ ] **Step 1: Add the field**

In `types/task.ts`, add `createdAt` to `TaskItem`:

```ts
export type TaskItem = {
  label: string;
  time?: string;
  checked?: boolean;
  // Local YYYY-MM-DD the task was added — same format as taskStorage's
  // todayString(). Used by lib/taskDecay.ts; not shown anywhere directly.
  createdAt?: string;
  // A Today task that survived a day change → wears the "Undone" tag until the
  // user promotes it to Upcoming. Only ever set on Today tasks.
  carriedOver?: boolean;
};
```

- [ ] **Step 2: Write the failing tests for the storage migration**

In `hooks/__tests__/taskStorage.test.ts`, replace the existing `'round-trips saved state through load'` test with:

```ts
  it('round-trips saved state through load, backfilling createdAt for pre-existing tasks', async () => {
    const state: PersistedState = {
      tasksByTab: {
        today: [{ label: 'breathe', checked: false }],
        upcoming: [{ label: 'walk', checked: true }],
        someday: [],
      },
      lastOpenedDate: '2026-07-02',
    };

    await saveTasks(state);
    const loaded = await loadTasks('2026-07-02');

    expect(loaded).toEqual({
      tasksByTab: {
        today: [{ label: 'breathe', checked: false, createdAt: '2026-07-02' }],
        upcoming: [{ label: 'walk', checked: true, createdAt: '2026-07-02' }],
        someday: [],
      },
      lastOpenedDate: '2026-07-02',
    });
  });

  it('leaves an existing createdAt untouched rather than overwriting it', async () => {
    await AsyncStorage.setItem(
      'sarani.tasks.v1',
      JSON.stringify({
        tasksByTab: {
          today: [{ label: 'old task', checked: false, createdAt: '2026-01-01' }],
          upcoming: [],
          someday: [],
        },
        lastOpenedDate: '2026-07-02',
      })
    );

    const loaded = await loadTasks('2026-07-05');

    expect(loaded?.tasksByTab.today[0].createdAt).toBe('2026-01-01');
  });
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `npx jest --ci hooks/__tests__/taskStorage.test.ts`
Expected: FAIL on both new/changed tests — `loaded` currently has no `createdAt` field at all.

- [ ] **Step 4: Implement the migration in loadTasks**

In `hooks/taskStorage.ts`, replace the `loadTasks` function (currently lines 30-46) with:

```ts
export async function loadTasks(today: string = todayString()): Promise<PersistedState | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as PersistedState;
    const tasksByTab = { ...EMPTY, ...parsed.tasksByTab };

    // Tasks saved before createdAt existed have none. Backfilling to `today`
    // rather than leaving it undefined means decay (lib/taskDecay.ts) starts
    // counting from this load onward instead of being silently disabled
    // forever for anyone who already had tasks saved — and since the
    // backfilled date is today either way, nothing reads as stale on the
    // very load that adds the field.
    const tabs = Object.keys(tasksByTab) as TabKey[];
    const backfilled = tabs.reduce(
      (acc, tab) => {
        acc[tab] = tasksByTab[tab].map((task) =>
          task.createdAt ? task : { ...task, createdAt: today }
        );
        return acc;
      },
      {} as Record<TabKey, TaskItem[]>
    );

    return {
      tasksByTab: backfilled,
      lastOpenedDate: parsed.lastOpenedDate,
    };
  } catch (error) {
    console.warn('[sarani] failed to load tasks', error);
    return null;
  }
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx jest --ci hooks/__tests__/taskStorage.test.ts`
Expected: PASS, all 6 tests in the file.

- [ ] **Step 6: Write the failing test for addTask stamping createdAt**

In `hooks/__tests__/TaskStore.test.tsx`, add inside the top-level `describe('TaskStore', ...)` block (after the `editTask` test, before `promoteTask`):

```tsx
  it('addTask stamps the new task with createdAt', async () => {
    await seed({
      tasksByTab: { today: [], upcoming: [], someday: [] },
      lastOpenedDate: todayString(),
    });

    const { result } = renderHook(useBoth, { wrapper });
    await waitFor(() => expect(result.current.today.tasks).toHaveLength(0));

    act(() => {
      result.current.today.addTask('stretch');
    });

    expect(result.current.today.tasks[0].createdAt).toBe(todayString());
  });
```

- [ ] **Step 7: Run test to verify it fails**

Run: `npx jest --ci hooks/__tests__/TaskStore.test.tsx -t "addTask stamps"`
Expected: FAIL — `createdAt` is `undefined`.

- [ ] **Step 8: Implement in TaskStore**

In `hooks/TaskStore.tsx`:

Change the load effect's call (currently `loadTasks()` at line 61) to pass `today`:

```tsx
      const [loadedTasks, loadedHistory] = await Promise.all([loadTasks(today), loadHistory()]);
```

Change `addTask` (currently lines 112-114):

```tsx
  const addTask = useCallback(
    (tab: TabKey, label: string) => {
      setTasksByTab((prev) => ({
        ...prev,
        [tab]: [...prev[tab], { label, checked: false, createdAt: today }],
      }));
    },
    [today]
  );
```

- [ ] **Step 9: Run tests to verify they pass**

Run: `npx jest --ci hooks/__tests__/TaskStore.test.tsx`
Expected: PASS, all tests in the file.

- [ ] **Step 10: Write the failing tests for the decay predicate**

Create `lib/__tests__/taskDecay.test.ts`:

```ts
import { daysBetween, isDecayed, DECAY_THRESHOLD_DAYS } from '../taskDecay';

describe('daysBetween', () => {
  it('counts whole calendar days between two local dates', () => {
    expect(daysBetween('2026-07-01', '2026-07-04')).toBe(3);
    expect(daysBetween('2026-07-01', '2026-07-01')).toBe(0);
  });
});

describe('isDecayed', () => {
  it(`is false for a task created ${DECAY_THRESHOLD_DAYS} days ago or fewer`, () => {
    expect(isDecayed({ checked: false, createdAt: '2026-07-01' }, '2026-07-03')).toBe(false);
  });

  it(`is true once a task has sat open more than ${DECAY_THRESHOLD_DAYS} days`, () => {
    expect(isDecayed({ checked: false, createdAt: '2026-07-01' }, '2026-07-04')).toBe(true);
  });

  it('is never true for a completed task, regardless of age', () => {
    expect(isDecayed({ checked: true, createdAt: '2026-01-01' }, '2026-07-04')).toBe(false);
  });

  it('is false when createdAt is missing', () => {
    expect(isDecayed({ checked: false, createdAt: undefined }, '2026-07-04')).toBe(false);
  });
});
```

- [ ] **Step 11: Run tests to verify they fail**

Run: `npx jest --ci lib/__tests__/taskDecay.test.ts`
Expected: FAIL — `Cannot find module '../taskDecay'`.

- [ ] **Step 12: Implement the decay predicate**

Create `lib/taskDecay.ts`:

```ts
import { TaskItem } from '@/types/task';

export const DECAY_THRESHOLD_DAYS = 2;

// Whole calendar days between two local YYYY-MM-DD dates — matches how
// `today` and `createdAt` are both recorded (see taskStorage.ts's
// todayString), so this stays correct without touching real-time Date
// arithmetic on anything but midnight-aligned strings.
export function daysBetween(fromDate: string, toDate: string): number {
  const from = new Date(`${fromDate}T00:00:00`);
  const to = new Date(`${toDate}T00:00:00`);
  return Math.round((to.getTime() - from.getTime()) / (24 * 60 * 60 * 1000));
}

// A task decays once it's sat unchecked for more than DECAY_THRESHOLD_DAYS.
// Checked tasks never decay, and a task with no createdAt (shouldn't happen
// past taskStorage's migration, but this stays defensive) is treated as not
// yet decayed rather than crashing on the comparison.
export function isDecayed(
  task: Pick<TaskItem, 'checked' | 'createdAt'>,
  today: string
): boolean {
  if (task.checked || !task.createdAt) {
    return false;
  }
  return daysBetween(task.createdAt, today) > DECAY_THRESHOLD_DAYS;
}
```

- [ ] **Step 13: Run tests to verify they pass**

Run: `npx jest --ci lib/__tests__/taskDecay.test.ts`
Expected: PASS, all 5 tests.

- [ ] **Step 14: Full verification**

Run: `npx tsc --noEmit && npx jest --ci && npx expo lint`
Expected: all clean.

- [ ] **Step 15: Commit**

```bash
git add types/task.ts hooks/taskStorage.ts hooks/TaskStore.tsx lib/taskDecay.ts \
  hooks/__tests__/taskStorage.test.ts hooks/__tests__/TaskStore.test.tsx lib/__tests__/taskDecay.test.ts
git commit -m "feat: add createdAt to tasks, with load-time migration and a decay predicate"
```

---

## Task 4: Decay tag on stale Tomorrow tasks

**Files:**
- Modify: `types/task.ts`
- Modify: `hooks/TaskStore.tsx`
- Modify: `constants/strings.ts`
- Modify: `components/ui/TaskRow.tsx`
- Modify: `components/screens/TaskListScreen.tsx`
- Test: `hooks/__tests__/TaskStore.test.tsx` (adds tests)
- Test: `components/ui/__tests__/TaskRow.test.tsx` (adds tests)

**Interfaces:**
- Consumes: `isDecayed` from `lib/taskDecay.ts` (Task 3).
- Produces: `TaskItem.decayed?: boolean` (display-only, computed in `useTaskList`, never persisted — same convention as the existing display-order sink); `TaskRow`'s new `decayed?: boolean` prop.

Scoped to Tomorrow (Upcoming) only, per the original request — Today has its own `carriedOver` concept, and Someday is explicitly the app's undated bucket (`strings.about.sections.someday.description`: "no deadline attached"), so decay doesn't apply there.

The tag's copy (`strings.tasks.decayedTag`) is a first-pass string — the original request explicitly deferred finalizing the wording. It's a real value (not a placeholder) so the feature is complete and correct today; changing it later is a one-line edit in `constants/strings.ts`.

- [ ] **Step 1: Add the display-only field**

In `types/task.ts`, add `decayed` next to `carriedOver`:

```ts
export type TaskItem = {
  label: string;
  time?: string;
  checked?: boolean;
  createdAt?: string;
  carriedOver?: boolean;
  // Tomorrow-only, computed live in useTaskList from createdAt — never
  // persisted, same convention as the display-order sink in that hook.
  decayed?: boolean;
};
```

- [ ] **Step 2: Write the failing tests for decay in useTaskList**

In `hooks/__tests__/TaskStore.test.tsx`, add a new top-level `describe` block (after the `'completed tasks sink to the bottom'` block, before `'history'`):

```tsx
  describe('decay tag on stale Upcoming tasks', () => {
    it('flags an unchecked Upcoming task as decayed once it is older than the threshold', async () => {
      await AsyncStorage.setItem(
        'sarani.tasks.v1',
        JSON.stringify({
          tasksByTab: {
            today: [],
            upcoming: [{ label: 'old plan', checked: false, createdAt: '2026-06-01' }],
            someday: [],
          },
          lastOpenedDate: todayString(),
        })
      );

      const { result } = renderHook(useBoth, { wrapper });
      await waitFor(() => expect(result.current.upcoming.tasks).toHaveLength(1));

      expect(result.current.upcoming.tasks[0].decayed).toBe(true);
    });

    it('does not flag a recently-added Upcoming task', async () => {
      await AsyncStorage.setItem(
        'sarani.tasks.v1',
        JSON.stringify({
          tasksByTab: {
            today: [],
            upcoming: [{ label: 'fresh plan', checked: false, createdAt: todayString() }],
            someday: [],
          },
          lastOpenedDate: todayString(),
        })
      );

      const { result } = renderHook(useBoth, { wrapper });
      await waitFor(() => expect(result.current.upcoming.tasks).toHaveLength(1));

      expect(result.current.upcoming.tasks[0].decayed).toBe(false);
    });

    it('never flags a Someday task, regardless of age', async () => {
      await AsyncStorage.setItem(
        'sarani.tasks.v1',
        JSON.stringify({
          tasksByTab: {
            today: [],
            upcoming: [],
            someday: [{ label: 'old someday', checked: false, createdAt: '2026-01-01' }],
          },
          lastOpenedDate: todayString(),
        })
      );

      const { result } = renderHook(useWithHistory, { wrapper });
      await waitFor(() => expect(result.current.someday.tasks).toHaveLength(1));

      expect(result.current.someday.tasks[0].decayed).toBeUndefined();
    });
  });
```

- [ ] **Step 3: Run tests to verify they fail**

Run: `npx jest --ci hooks/__tests__/TaskStore.test.tsx -t "decay tag"`
Expected: FAIL — `decayed` is `undefined` on the Upcoming task in both of the first two tests.

- [ ] **Step 4: Wire today and decay into the store's public value and useTaskList**

`useTaskList` needs `today` (to call `isDecayed`), but `today` isn't currently exposed on the `TaskStore` context value. In `hooks/TaskStore.tsx`:

Add `today` to the `TaskStore` type (currently lines 17-26):

```tsx
type TaskStore = {
  tasksByTab: Record<TabKey, TaskItem[]>;
  today: string;
  todaySnapshots: HistoryByDate;
  otherCompletions: HistoryByDate;
  addTask: (tab: TabKey, label: string) => void;
  toggleTask: (tab: TabKey, itemIndex: number) => void;
  removeTask: (tab: TabKey, itemIndex: number) => void;
  editTask: (tab: TabKey, itemIndex: number, label: string) => void;
  promoteToUpcoming: (itemIndex: number) => void;
};
```

Add `today` to the `value` memo (currently lines 201-222):

```tsx
  const value = useMemo(
    () => ({
      tasksByTab,
      today,
      todaySnapshots,
      otherCompletions,
      addTask,
      toggleTask,
      removeTask,
      editTask,
      promoteToUpcoming,
    }),
    [
      tasksByTab,
      today,
      todaySnapshots,
      otherCompletions,
      addTask,
      toggleTask,
      removeTask,
      editTask,
      promoteToUpcoming,
    ]
  );
```

Add the import at the top of the file:

```tsx
import { isDecayed } from '@/lib/taskDecay';
```

Replace `useTaskList` (currently lines 248-274) with:

```tsx
export function useTaskList(tab: TabKey) {
  const { tasksByTab, today, addTask, toggleTask, removeTask, editTask, promoteToUpcoming } =
    useTaskStore();
  const stored = tasksByTab[tab];

  const { tasks, order } = useMemo(() => {
    // Array.prototype.sort is stable, so each group keeps its insertion order.
    const indices = stored.map((_, index) => index);
    indices.sort((a, b) => Number(stored[a].checked) - Number(stored[b].checked));
    const ordered = indices.map((index) => stored[index]);

    // Decay is a Tomorrow-only concept — see the comment on TaskItem.decayed.
    const displayed =
      tab === 'upcoming'
        ? ordered.map((task) => ({ ...task, decayed: isDecayed(task, today) }))
        : ordered;

    return { tasks: displayed, order: indices };
  }, [stored, tab, today]);

  const storedIndex = (displayIndex: number) => order[displayIndex] ?? displayIndex;

  return {
    tasks,
    addTask: (label: string) => addTask(tab, label),
    toggleTask: (_sectionIndex: number, itemIndex: number) =>
      toggleTask(tab, storedIndex(itemIndex)),
    removeTask: (_sectionIndex: number, itemIndex: number) =>
      removeTask(tab, storedIndex(itemIndex)),
    editTask: (_sectionIndex: number, itemIndex: number, label: string) =>
      editTask(tab, storedIndex(itemIndex), label),
    promoteTask: (itemIndex: number) => promoteToUpcoming(storedIndex(itemIndex)),
  };
}
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx jest --ci hooks/__tests__/TaskStore.test.tsx`
Expected: PASS, all tests in the file.

- [ ] **Step 6: Add the tag copy**

In `constants/strings.ts`, add to the `tasks` block (currently lines 85-89):

```ts
  tasks: {
    addCta: '+ Add task',
    newTaskPlaceholder: 'New task',
    carriedOverTag: 'Undone',
    // First-pass copy — wording deliberately deferred; change freely.
    decayedTag: 'Been a while',
  },
```

- [ ] **Step 7: Write the failing test for TaskRow rendering the tag**

In `components/ui/__tests__/TaskRow.test.tsx`, add:

```tsx
import { strings } from '@/constants/strings';

  it('shows the decayed tag when a task has sat open too long', () => {
    const api = render(<TaskRow label="old plan" decayed onToggle={jest.fn()} />);

    expect(api.getByText(strings.tasks.decayedTag)).toBeTruthy();
  });

  it('does not show the decayed tag on a normal task', () => {
    const api = render(<TaskRow label="fresh plan" onToggle={jest.fn()} />);

    expect(api.queryByText(strings.tasks.decayedTag)).toBeNull();
  });
```

(Add the `strings` import alongside the existing imports at the top of the file.)

- [ ] **Step 8: Run tests to verify they fail**

Run: `npx jest --ci components/ui/__tests__/TaskRow.test.tsx -t "decayed tag"`
Expected: FAIL — `TaskRow` doesn't accept or render a `decayed` prop yet.

- [ ] **Step 9: Implement in TaskRow**

In `components/ui/TaskRow.tsx`, add `decayed` to the props type (currently lines 10-19):

```tsx
type TaskRowProps = {
  label: string;
  time?: string;
  checked?: boolean;
  carriedOver?: boolean;
  decayed?: boolean;
  onToggle?: () => void;
  onLabelPress?: () => void;
  onDelete?: () => void;
  onTagPress?: () => void;
};
```

Destructure it in the function signature (currently lines 23-32):

```tsx
export default function TaskRow({
  label,
  time,
  checked,
  carriedOver,
  decayed,
  onToggle,
  onLabelPress,
  onDelete,
  onTagPress,
}: TaskRowProps) {
```

Render it right after the `carriedOver` tag block (currently lines 76-88), as a plain (non-pressable) pill — no interaction was requested for it:

```tsx
      {decayed ? (
        <View className="ml-3 rounded-full bg-primary/15 px-2.5 py-1">
          <Text className="text-[12px] font-medium text-primary">{strings.tasks.decayedTag}</Text>
        </View>
      ) : null}
```

- [ ] **Step 10: Run tests to verify they pass**

Run: `npx jest --ci components/ui/__tests__/TaskRow.test.tsx`
Expected: PASS, all tests in the file.

- [ ] **Step 11: Thread it through TaskListScreen**

In `components/screens/TaskListScreen.tsx`, add `decayed={item.decayed}` to the `TaskRow` usage (currently lines 227-246), alongside the existing `carriedOver={item.carriedOver}`:

```tsx
                      <TaskRow
                        label={item.label}
                        time={item.time}
                        checked={item.checked}
                        carriedOver={item.carriedOver}
                        decayed={item.decayed}
                        onToggle={
                          onToggleTask ? () => onToggleTask(sectionIndex, index) : undefined
                        }
                        onLabelPress={
                          onEditTask
                            ? () => startEditingTask(sectionIndex, index, item.label)
                            : undefined
                        }
                        onDelete={
                          onRemoveTask ? () => onRemoveTask(sectionIndex, index) : undefined
                        }
                        onTagPress={
                          onPromoteTask ? () => onPromoteTask(sectionIndex, index) : undefined
                        }
                      />
```

`item.decayed` is only ever populated for the Upcoming tab (Task 4, Step 4), so Today and Someday screens pass `undefined` here automatically — no per-screen change needed, matching how `onPromoteTask` is already only wired from `app/(tabs)/today.tsx`.

- [ ] **Step 12: Full verification**

Run: `npx tsc --noEmit && npx jest --ci && npx expo lint`
Expected: all clean.

- [ ] **Step 13: Commit**

```bash
git add types/task.ts hooks/TaskStore.tsx constants/strings.ts components/ui/TaskRow.tsx \
  components/screens/TaskListScreen.tsx hooks/__tests__/TaskStore.test.tsx \
  components/ui/__tests__/TaskRow.test.tsx
git commit -m "feat: tag Upcoming tasks that have sat open more than 2 days"
```

---

## Task 5: Completed Tomorrow/Someday tasks move into History

**Files:**
- Modify: `hooks/TaskStore.tsx`
- Modify: `components/screens/TaskListScreen.tsx`
- Test: `hooks/__tests__/TaskStore.test.tsx` (adds tests)

**Interfaces:**
- Consumes: nothing new.
- Produces: nothing new consumed elsewhere — internal to the store.

Applies to **both** Upcoming and Someday (confirmed — the original request only named Tomorrow, but Someday has the identical mechanism and would otherwise be the only tab left where a completed task sits forever). Checking a task in either tab already logs it into `otherCompletions[today]` (`hooks/TaskStore.tsx`, existing `toggleTask`) — this task makes the checked task actually leave the live tab afterward, rather than sitting there checked forever.

Removal is delayed 700ms so the checkmark itself is visible before the row disappears — an instant vanish would read as the tap doing something unexpected rather than "this task moved to History." Removal is keyed by object identity, not array index or label: a plain index would race any other mutation to the tab in that 700ms window (exactly the class of bug the display-order sink already had to guard against — see the `storedIndex` comment above `useTaskList`), and a label match could collide with a second task of the same name added in the interim.

- [ ] **Step 1: Write the failing tests**

In `hooks/__tests__/TaskStore.test.tsx`, add a new top-level `describe` block (after `'decay tag on stale Upcoming tasks'`, before `'history'`):

```tsx
  describe('completed Upcoming/Someday tasks leave the tab into History', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('removes a checked Upcoming task from the live tab after a short delay', async () => {
      await seed({
        tasksByTab: {
          today: [],
          upcoming: [{ label: 'read a book', checked: false }],
          someday: [],
        },
        lastOpenedDate: todayString(),
      });

      const { result } = renderHook(useBoth, { wrapper });
      await waitFor(() => expect(result.current.upcoming.tasks).toHaveLength(1));

      act(() => {
        result.current.upcoming.toggleTask(0, 0);
      });
      // Still present immediately — the delay is what lets the checkmark be seen.
      expect(result.current.upcoming.tasks).toHaveLength(1);

      act(() => {
        jest.advanceTimersByTime(700);
      });

      expect(result.current.upcoming.tasks).toHaveLength(0);
    });

    it('applies the same delayed removal to Someday', async () => {
      await seed({
        tasksByTab: {
          today: [],
          upcoming: [],
          someday: [{ label: 'learn pottery', checked: false }],
        },
        lastOpenedDate: todayString(),
      });

      const { result } = renderHook(useWithHistory, { wrapper });
      await waitFor(() => expect(result.current.someday.tasks).toHaveLength(1));

      act(() => {
        result.current.someday.toggleTask(0, 0);
      });
      act(() => {
        jest.advanceTimersByTime(700);
      });

      expect(result.current.someday.tasks).toHaveLength(0);
    });

    it('does not remove the task if unchecked again before the delay elapses', async () => {
      await seed({
        tasksByTab: {
          today: [],
          upcoming: [{ label: 'read a book', checked: false }],
          someday: [],
        },
        lastOpenedDate: todayString(),
      });

      const { result } = renderHook(useBoth, { wrapper });
      await waitFor(() => expect(result.current.upcoming.tasks).toHaveLength(1));

      act(() => {
        result.current.upcoming.toggleTask(0, 0);
      });
      act(() => {
        result.current.upcoming.toggleTask(0, 0);
      });
      act(() => {
        jest.advanceTimersByTime(700);
      });

      expect(result.current.upcoming.tasks).toHaveLength(1);
      expect(result.current.upcoming.tasks[0].checked).toBe(false);
    });

    it('schedules removal when promoting an already-completed carried-over task into Upcoming', async () => {
      await seed({
        tasksByTab: {
          today: [{ label: 'carry', checked: true, carriedOver: true }],
          upcoming: [],
          someday: [],
        },
        lastOpenedDate: todayString(),
      });

      const { result } = renderHook(useBoth, { wrapper });
      await waitFor(() => expect(result.current.today.tasks).toHaveLength(1));

      act(() => {
        result.current.today.promoteTask(0);
      });
      expect(result.current.upcoming.tasks).toHaveLength(1);

      act(() => {
        jest.advanceTimersByTime(700);
      });

      expect(result.current.upcoming.tasks).toHaveLength(0);
    });
  });
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx jest --ci hooks/__tests__/TaskStore.test.tsx -t "leave the tab into History"`
Expected: FAIL — the first three new tests fail because nothing removes the task after 700ms; the fourth passes already by coincidence of the existing behavior, but starts genuinely exercising the new code path once Step 4 lands.

- [ ] **Step 3: Confirm the existing promote-history test still passes unmodified**

Run: `npx jest --ci hooks/__tests__/TaskStore.test.tsx -t "preserves history when promoting"`
Expected: PASS — this existing test promotes an already-checked task and asserts on `result.current.upcoming.tasks` immediately after the `act()` call, well before any 700ms delay could fire, and RNTL's automatic cleanup (Step 4's timer bookkeeping) prevents the eventual timer from leaking into later tests. No changes needed to this test.

- [ ] **Step 4: Implement scheduled removal**

In `hooks/TaskStore.tsx`, add near the top of `TaskProvider`, after the `today` state (currently line 52):

```tsx
  // Delay before a just-completed Upcoming/Someday task disappears from the
  // live tab into History — long enough that the checkmark itself is seen
  // before the row goes away, short enough that it still reads as one
  // motion ("this moved to History") rather than two.
  const COMPLETED_REMOVAL_DELAY_MS = 700;
  // Pending removal timers, tracked so a still-mounted TaskProvider never
  // calls setState after it's gone (test cleanup unmounts synchronously;
  // this timer doesn't). Cleared on unmount below.
  const pendingRemovals = useRef(new Set<ReturnType<typeof setTimeout>>());
  useEffect(() => {
    return () => {
      pendingRemovals.current.forEach(clearTimeout);
      pendingRemovals.current.clear();
    };
  }, []);

  // Removes `completedTask` from `tab` by object identity, not index — an
  // index captured now could point at a different task by the time this
  // fires, if anything else in the tab changes during the delay. Toggling
  // the task back to unchecked before the timer fires is naturally a no-op:
  // un-checking creates a new object (a fresh `{...t, checked: false}`), so
  // the originally-captured checked reference simply no longer matches
  // anything in the array by the time this runs.
  const scheduleCompletedRemoval = useCallback((tab: TabKey, completedTask: TaskItem) => {
    const timer = setTimeout(() => {
      pendingRemovals.current.delete(timer);
      setTasksByTab((prev) => ({
        ...prev,
        [tab]: prev[tab].filter((t) => t !== completedTask),
      }));
    }, COMPLETED_REMOVAL_DELAY_MS);
    pendingRemovals.current.add(timer);
  }, []);
```

Replace `toggleTask` (currently lines 121-154) with:

```tsx
  const toggleTask = useCallback(
    (tab: TabKey, itemIndex: number) => {
      const task = tasksByTab[tab][itemIndex];
      if (!task) {
        return;
      }

      const nextChecked = !task.checked;
      const nextTask = { ...task, checked: nextChecked };

      setTasksByTab((prev) => ({
        ...prev,
        [tab]: prev[tab].map((t, i) => (i === itemIndex ? nextTask : t)),
      }));

      if (tab !== 'today') {
        setOtherCompletions((prevOther) => {
          const dayEntries = prevOther[today] ?? [];
          const withoutExisting = dayEntries.filter((entry) => entry.label !== task.label);

          if (nextChecked) {
            return {
              ...prevOther,
              [today]: [...withoutExisting, { label: task.label, checked: true }],
            };
          }

          return withoutExisting.length === dayEntries.length
            ? prevOther
            : { ...prevOther, [today]: withoutExisting };
        });

        if (nextChecked) {
          scheduleCompletedRemoval(tab, nextTask);
        }
      }
    },
    [tasksByTab, today, scheduleCompletedRemoval]
  );
```

Replace `promoteToUpcoming` (currently lines 172-199) with:

```tsx
  const promoteToUpcoming = useCallback(
    (itemIndex: number) => {
      const task = tasksByTab.today[itemIndex];
      if (!task) {
        return;
      }

      const { carriedOver: _carriedOver, ...promoted } = task;

      setTasksByTab((prev) => ({
        ...prev,
        today: prev.today.filter((_, i) => i !== itemIndex),
        upcoming: [...prev.upcoming, promoted],
      }));

      if (task.checked) {
        setOtherCompletions((prevOther) => {
          const dayEntries = prevOther[today] ?? [];
          const withoutExisting = dayEntries.filter((entry) => entry.label !== task.label);
          return {
            ...prevOther,
            [today]: [...withoutExisting, { label: task.label, checked: true }],
          };
        });
        scheduleCompletedRemoval('upcoming', promoted);
      }
    },
    [tasksByTab, today, scheduleCompletedRemoval]
  );
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx jest --ci hooks/__tests__/TaskStore.test.tsx`
Expected: PASS, all tests in the file (including the untouched pre-existing ones from Step 3).

- [ ] **Step 6: Add an exit animation so the removal isn't an abrupt cut**

Without this, the row would vanish instantly once the 700ms timer fires, rather than fading — undermining the point of the delay. In `components/screens/TaskListScreen.tsx`, add `FadeOut` to the existing Reanimated import (currently line 6):

```tsx
import Animated, { FadeInDown, FadeOut } from 'react-native-reanimated';
```

Add `exiting={FadeOut.duration(300)}` to the row's `Animated.View` (currently lines 185-196, alongside the existing `entering={FadeInDown.duration(220)}`):

```tsx
                  <Animated.View
                    key={`${section.title}-${item.label}`}
                    entering={FadeInDown.duration(220)}
                    exiting={FadeOut.duration(300)}
                    className="border-b border-ink-quaternary/15 dark:border-ink-dark-quaternary/15 last:border-b-0"
                  >
```

- [ ] **Step 7: Full verification**

Run: `npx tsc --noEmit && npx jest --ci && npx expo lint`
Expected: all clean.

- [ ] **Step 8: Commit**

```bash
git add hooks/TaskStore.tsx components/screens/TaskListScreen.tsx hooks/__tests__/TaskStore.test.tsx
git commit -m "feat: completed Upcoming/Someday tasks move into History"
```

---

## Self-Review

**Spec coverage** (against `docs/checklist.md` items 1–4):
- Item 1 (decay tag) → Tasks 3–4.
- Item 1's second half (completed tasks move to History) → Task 5.
- Item 2 (keyboard covering the add area) → already shipped; the remaining gap (mid-list edit) → Task 2.
- Item 3 (History header) → Task 1.
- Item 4 (widget) → deliberately out of this plan; see `docs/superpowers/plans/2026-08-18-flame-widget-capture.md`.

**Placeholder scan:** none — `strings.tasks.decayedTag`'s value is real and functional; its comment says the wording is a deferred product decision (per the original request), not an unfinished implementation.

**Type consistency:** `TaskItem.decayed`/`createdAt`, `useTaskList`'s return shape, `TaskRow`'s new prop, and `loadTasks`'s new parameter are used identically everywhere they appear across Tasks 3–5.

**Sequencing note:** Tasks 3+4 and Task 5 are independent in code (nothing in Task 5 reads `createdAt` or `decayed`) — they're ordered this way for a cleaner narrative per task, not because of a real dependency. Task 1 and Task 2 have no dependency on anything else in this plan and could ship in any order, including before Tasks 3–5.
