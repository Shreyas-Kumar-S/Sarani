# Priority checklist

Living doc — update in place as items land or priorities shift. Ordered by
priority; the order is deliberate, see "Why this order" at the bottom.

## 1. Keyboard: scroll a mid-list edit into view

**Status:** partly shipped. The add row already scrolls above the keyboard
(`components/screens/TaskListScreen.tsx`, the `isAddingTask` effect + the
ScrollView's `automaticallyAdjustKeyboardInsets`/`keyboardShouldPersistTaps`).

**Gap:** `startEditingTask` — tapping a task's label to edit it — triggers no
scroll. On a long list, editing a task near the middle can still land it under
the keyboard.

**Fix:** same pattern as the add row — scroll the edited row into view when
`editing` is set. Needs a way to locate that row's y-position (`onLayout` per
row, or `scrollTo` off a measured ref) rather than the add row's `scrollToEnd`,
since the edited row isn't always at the bottom.

**Size:** small.

## 2. History tab: fix header, scroll content only

**Current:** everything — title, month/year, the horizontal month selector,
and the day groups — lives inside one `ScrollView` in
`components/screens/HistoryScreen.tsx`. The info button and theme toggle are
already outside it (mounted in `app/_layout.tsx`, unaffected by this).

**Fix:** pull the title + `HistoryMonthSelector` out of the `ScrollView` into
a fixed header `View` above it; only the day-group list scrolls underneath.
Content padding-top needs to account for the header's real height instead of
just `insets.top`.

**Size:** small–medium. Contained to one screen.

## 3. Tomorrow — decay tag on stale open tasks

**New requirement:** `TaskItem` has no timestamp today (`types/task.ts`). Add
`createdAt`, set on `addTask`. Existing tasks already in storage won't have
one — decide a fallback (e.g. treat "no createdAt" as "not yet stale," or
backfill to today's date on next load) rather than have them all light up as
stale on the app's next open.

**Rule:** unchecked, `createdAt` more than 2 days ago → decayed. Exact wording
deferred, per your note — a boolean/derived flag is enough for now, the tag
copy can follow later.

**Size:** small–medium. Needs the storage migration above before the tag
itself is real work.

## 4. Tomorrow + Someday — completed tasks move into History

**Decision:** applies to both tabs (not Tomorrow-only), so the two tabs that
share this completion mechanism behave the same way.

**Current:** checking a task in Upcoming/Someday already logs it into
`otherCompletions[today]` (`hooks/TaskStore.tsx`, `toggleTask`) — but the task
also stays in the live tab, checked, forever. Last session's "completed sinks
to the bottom" change makes that more tolerable but doesn't solve it — this
is the real fix.

**Change:** once logged to history, remove the task from the tab's stored
array instead of leaving it checked in place. Needs a decision on timing —
instantly on check (task vanishes the moment you tap it), or after a short
delay so the check-off is visually confirmed first (closer to how Today
currently behaves, where a checked task just sits until day rollover). I'd
default to a brief delay (checked state visible for ~600ms–1s, then removed)
so it doesn't feel like the task vanished before you saw it happen — flag if
you want instant instead.

**Size:** medium. Touches the store's completion path for two tabs plus the
removal/animation timing.

## 5. Flame icon: long-press → "One Thing" capture → home-screen widget

**Full spec:** `docs/superpowers/plans/2026-08-18-flame-widget-capture.md` — this
entry is a summary, not the source of truth; the plan has the exact numbers
and the full renegotiated product model.

**Status:** Task 1 (gesture, ring, capture sheet) shipped and merged (PR #13).
Tasks 2–7 not started.

**Product semantics, renegotiated after Task 1 shipped:** the flame is not a
second `+ Add task` — it means "make this my One Thing." A flame-captured
task does **not** appear in the Today list; it's a standalone daily
declaration (`DailyFocus`, persisted as `{ status, label, date }`, not a
task-array pointer) that only the flame can set, replace, complete, or clear.
Long-pressing again while one is already active doesn't reopen a blank input —
it shows the current One Thing with Complete/Delete/Replace actions, the same
single entry point handling both "declare" and "manage." No rollover across
days: an unfinished Daily Focus does not carry forward, unlike the regular
Today list. The widget has three distinct copy states, not one placeholder —
"What's the one thing for today?" (never set / new day), "Your Next 1thing!"
(just completed), "Your 1thing?" (just deleted) — stored as real state so they
survive Android's own background widget refresh, not just a live push.
Tapping the widget opens the Today tab, plainly, nothing else.

**The gesture, precisely specified** (previously just "circular fill
animation"): a 4-state machine — `idle → holding → active → closing`. Hold
threshold is a single named constant, **650ms**. The ring fills linearly
(a progress meter, not eased — any ease makes the threshold feel early or
late) from 12 o'clock, on a 52px canvas, `r=24.5`, 2.5px stroke. Release
before 650ms and it eases back down faster than it filled (200ms) rather than
unwinding in slow motion. A haptic fires exactly once, right at the 650ms
threshold — none on early release. The capture sheet is positioned **off the
real keyboard height** (`useAnimatedKeyboard()`), not hardcoded pixels — a
fixed-pixel version is exactly what broke once already in the design
prototype this spec came from when the keyboard height changed. The tab bar
itself does **not** rise with the keyboard (an early build did this
unconditionally and it also affected the regular add-task row by mistake) —
it stays put and sits behind the keyboard like a normal nav bar.

**Accessibility, not an afterthought:** a long-press gesture is invisible to
screen readers by construction, so a screen-reader user gets a plain tap that
opens the same sheet immediately, no hold required. Reduce-motion skips the
ring sweep and the sheet's fade/slide but keeps the real 650ms hold — the
threshold is the interaction, the animation is just how it's shown.

**Widget approach — decided:** `react-native-android-widget` for Android
(third-party, well-documented, JS-authored) **and** `expo-widgets` for iOS
(an *official* Expo SDK package, confirmed from its own source — its config
plugin generates a real WidgetKit extension target during `prebuild`; widget
UI is authored in Expo UI components, not hand-written Swift). Both platforms,
not Android-first-iOS-later as originally scoped — chosen explicitly over
hand-writing true native WidgetKit/Glance, since neither requires you or me to
hand-author Swift or Kotlin. **Both still require leaving Expo Go for a
custom dev client** — this is still a real workflow change, not just a
dependency add.

**One thing this explicitly does *not* do**, decided rather than assumed:
the existing inline "+ Add task" rows in each tab are completely untouched —
they never read from or write to the Daily Focus, and the flame never adds to
Today. Separately, the flashy "return to the home screen so you can see the
widget" moment from the original design prototype does **not** ship — that
was a demo aid; a real declare/replace gets a brief, quiet in-app confirmation
instead.

**Windows-specific constraint, worth knowing before this starts:** no local
Xcode or iOS Simulator on this machine. iOS builds go through EAS's cloud
runners, and the only way to actually see the iOS widget is a physical
iPhone.

**Size:** large — bigger than originally scoped, now that it covers both
platforms from the start rather than Android-first. The gesture/ring/sheet
(plan Task 1) and the Daily Focus data layer + dual-mode sheet (plan Task 2)
both need no native toolchain and can land, and be demoed, before the
dev-client move (plan Task 3) — Task 1 already has, Task 2 is next.

## 6. `expo-doctor` findings — deferred, not urgent

**Status:** not started. Explicitly deprioritized — noted for later, not part
of the active work above.

Running `npx expo-doctor` surfaces 2 failing checks (20/22 pass):

- **Hermes V1 memory regression.** This project's `expo@56.0.18` ships a
  Hermes build (`250829098.0.10`) affected by a known memory regression;
  the fix landed in `250829098.0.16`. Expo's own advice is to upgrade to
  Expo SDK 57 (`expo@^57.0.9` or later) via `npx expo install expo@^57.0.9 --fix`,
  which pulls in React Native 0.86.2+ (the first RN version bundling the
  fixed Hermes). See https://expo.dev/changelog/sdk-57#known-regressions.
- **7 packages behind their SDK 56 patch versions** (`@expo/metro-runtime`,
  `expo`, `expo-constants`, `expo-image`, `expo-linking`, `expo-router`,
  `expo-symbols`) — fixable independently of the SDK 57 question via
  `npx expo install --check`.

**Why deferred:** an SDK bump (54→56) already happened once this session;
another major-version jump (56→57) mid-flame-widget-work is exactly the kind
of change that risks destabilizing the native toolchain currently mid-use for
Tasks 3–7 (dev client, `react-native-android-widget`, eventually
`expo-widgets`). Worth doing once the flame/widget work reaches a stable
resting point, not interleaved with it.

**Size:** small for the patch-version bump alone (`npx expo install --check`);
medium for the full SDK 57 upgrade, since that's a real dependency-graph
change (React Native 0.85→0.86+) that needs the same tsc/lint/test/on-device
verification pass as the SDK 54→56 upgrade got.

---

## Why this order

1 and 2 are UI-only, no data model or storage changes, no migration risk —
cheapest wins first.

3 and 4 both touch `TaskStore` and task data. 4 is ordered after 3 because 4
changes the same completion path that 3's decay logic will want to read from
(a decayed task that gets completed should stop decaying and start heading to
History) — building 4 second means it can be built with 3's new `createdAt`
field already in place, rather than the reverse.

5 is last because it's the only item that changes the *project's workflow*
(Expo Go → dev client) rather than just the app's code, and it's the only one
with real technical risk (two different native toolchains, a genuinely new
interaction pattern). Everything else is safe to ship independently before
this one is even started.
