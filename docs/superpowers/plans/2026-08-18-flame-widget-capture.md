# Flame Long-Press Widget Capture Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Long-pressing the flame icon declares (or manages) the user's "One Thing" for the day. The flame is not a second `+ Add task` — it's the only path that sets, replaces, completes, or clears what a home-screen widget shows, on both iOS and Android.

**Architecture:** Seven tasks. Task 1 (the gesture, ring, and sheet) and Task 2 (the Daily Focus data layer and dual-mode sheet) are both pure JS/Reanimated/AsyncStorage — no native widget dependency, fully buildable and demoable in Expo Go before any native toolchain work starts. Task 3 moves the project to a custom dev client (needed from here on). Tasks 4–5 spike each platform's widget in isolation, now rendering the real Daily Focus content model instead of a placeholder string. Task 6 wires widget pushes into the Daily Focus transitions. Task 7 themes them.

**Tech Stack:** Reanimated 4 (`useAnimatedKeyboard`, `Animated.Circle`), AsyncStorage, `react-native-android-widget` for Android, `expo-widgets` (official Expo SDK package) for iOS, EAS Build.

**Spec:** The user-supplied handoff brief (gesture state machine, ring geometry, sheet layout, palette, definition of done) — treated as authoritative for every number in Task 1. The product semantics below (what the flame *means*, the Daily Focus data model, the three widget copy states) were renegotiated after Task 1 shipped, through a design review — see "Decisions locked in" for the resolved shape. Companion plan: `docs/superpowers/plans/2026-08-18-task-list-polish.md` (items 1–4, fully independent of this one).

## Decisions locked in before this plan was written

- **The flame means "make this my One Thing," not "quick-add a task."** This is the load-bearing distinction from the regular `+ Add task` rows: those add to the Today list and never touch the widget; the flame never touches the Today list and only it can change the widget. Two structurally separate paths to the same underlying idea (capturing text), kept apart on purpose.
- **A flame-captured task does not appear in the Today list.** It's a standalone declaration, not a task among tasks — avoids cluttering Today with what's really a daily headline, and sidesteps needing a task ID (see the data model below).
- **Widget approach: Expo/RN-bridged, not raw native.** `react-native-android-widget` for Android (JS-authored widget UI, third-party but well-documented and verified against its current docs — see Task 4). `expo-widgets` for iOS (official Expo SDK package, config-plugin-generated WidgetKit extension target, widget UI authored via Expo UI components — see Task 5). Neither requires hand-writing Swift or Kotlin, though both do generate and depend on real native project structure via `expo prebuild` — this is not purely a JS-only feature the way the rest of the app is.
- **Add-task entry points stay separate.** The existing inline "+ Add task" rows in `TaskListScreen.tsx` are untouched, and always will be — this plan never wires them to the widget.
- **The coda (home-screen preview) does not ship.** Demo-only, gated behind a flag if kept at all.
- **Data model: `DailyFocus`, not `lastCapturedTask`.** A standalone persisted record, not a pointer into the Today array (there is nothing to point to — see above) and not a bare string (a bare string can't distinguish *why* it's empty, and three of the copy states below depend on that):

  ```ts
  type DailyFocusStatus = 'unset' | 'active' | 'completed' | 'deleted';

  type DailyFocus = {
    status: DailyFocusStatus;
    label: string | null; // set only when status === 'active'
    date: string;          // YYYY-MM-DD this record belongs to — see hooks/taskStorage.ts's todayString()
  };
  ```

  This is real, persisted, tri/four-state — the completed/deleted copy below must survive Android's own background widget refresh (which can fire minutes after the in-app action, outside the app's control), not just last until the next app-driven push.

- **The flame's long-press is dual-mode, not always a blank capture.** No Daily Focus set (`unset`/`completed`/`deleted`) → the sheet is a blank input, same as Task 1 built. A Daily Focus already `active` → the sheet instead shows the current label with Complete / Delete / Replace actions (replace = type new text and submit, same as declaring fresh). Same single entry point handles both "declare" and "manage" — nothing new added elsewhere in the app, and it keeps the invariant that only the flame touches this state.
- **No rollover across days.** Unlike the regular Today list (which carries unfinished tasks forward, tagged "Undone"), an unfinished Daily Focus does not survive a day change. A new day resets straight to `unset` regardless of yesterday's status.
- **Three widget copy states, each with a distinct trigger** (this replaces Task 3's original single "Hold the flame to add a task" placeholder):
  | Trigger | `status` | Widget shows |
  |---|---|---|
  | Fresh widget / new day / never set | `unset` | "What's the one thing for today?" |
  | Flame declares/replaces "X" | `active` | "S · X" |
  | Daily Focus completed via the flame's manage mode | `completed` | "Your Next 1thing!" |
  | Daily Focus deleted via the flame's manage mode | `deleted` | "Your 1thing?" |
- **Tapping the widget opens the Today tab. Nothing else.** Not the capture sheet, not the manage sheet — plain navigation to `(tabs)/today`.

## Global Constraints

- **Windows environment note:** this project is developed on Windows. There is no local Xcode or iOS Simulator. iOS dev-client builds must go through EAS Build's cloud macOS runners (`eas build --platform ios`), and on-device verification requires a physical iPhone via ad-hoc/internal distribution — there is no way to visually check the iOS widget without one. Android has no such constraint (a local emulator works fine on Windows).
- Every keyboard-relative layout value in Task 1 is derived from `useAnimatedKeyboard().height`, not hardcoded — see Task 1, Step 4's note on why. Only genuinely fixed values (ring geometry, card width/radius/shadow, badge size, colors) stay as literal constants.
- `HOLD_MS` (650) is a single named constant, not repeated as a magic number anywhere.
- The existing `strings.nav.flameToast` ("Stay tuned") and `strings.a11y.flameTeaser` ("Coming soon") described a not-yet-built feature and were already retired in Task 1 (along with the `StayTunedToast` component it belonged to, removed in a later keyboard/blur cleanup pass — do not reintroduce it or reference it from Task 6's in-app confirmation).
- Run `npx tsc --noEmit` and `npx expo lint` after every task. Most of this plan's real verification is manual/on-device (gesture timing, native widget rendering) — flagged explicitly per task rather than dressed up as automated coverage that doesn't exist.

---

## Task 1: Gesture state machine, ring, and capture sheet — SHIPPED

**Status:** done and merged. Kept below as the historical record of what was built; do not re-run its steps. Its scope has since been extended by Task 2 (dual-mode sheet, manage actions) — Task 1 itself only ever built the blank-capture half.

**Files:**
- Modify: `app/(tabs)/_layout.tsx`
- Modify: `constants/strings.ts`

**Interfaces:**
- Produces: `onCapture: (label: string) => void` — fired when the sheet closes with non-empty text. Task 2 replaces this stub with the real Daily Focus write; until then it was a no-op, stated explicitly (see Step 6).

No widget dependency in this task. Fully buildable and demoable under the app's current setup, before the dev-client move.

- [x] **Step 1: State machine**

Five states, matching the spec exactly: `idle | holding | active | closing`. (`coda` is demo-only — see the note in Step 7; it isn't part of the state machine's real-build path at all, since the real build's post-`closing` behavior is just "return to idle," not a distinct visible state.)

In the tab-bar root component (`app/(tabs)/_layout.tsx`, where `handleFlamePress` currently lives), replace the flame's press handling with:

```tsx
type CaptureState = 'idle' | 'holding' | 'active' | 'closing';

const HOLD_MS = 650; // dev tweak range 300-1200 per the spec; kept as one constant.
const RING_REWIND_MS = 200;
const RING_OPACITY_OUT_MS = 220;
const SHEET_CLOSE_MS = 420;

const [captureState, setCaptureState] = useState<CaptureState>('idle');
const [captureDraft, setCaptureDraft] = useState('');
const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

const clearHoldTimer = () => {
  if (holdTimer.current) {
    clearTimeout(holdTimer.current);
    holdTimer.current = null;
  }
};

// Cleared on unmount so a still-pending hold timer never fires setState
// after the tab bar is gone.
useEffect(() => clearHoldTimer, []);

const beginHold = () => {
  // press is ignored unless idle — prevents re-entry while the sheet is open.
  if (captureState !== 'idle') {
    return;
  }
  setCaptureState('holding');
  fill.value = withTiming(1, { duration: HOLD_MS, easing: Easing.linear });
  holdTimer.current = setTimeout(() => {
    setCaptureState('active');
    setCaptureDraft('');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    fill.value = 1; // holds at full; fades out separately once the sheet is up
    fillOpacity.value = withDelay(
      780,
      withTiming(0, { duration: RING_OPACITY_OUT_MS })
    );
  }, HOLD_MS);
};

const endHold = () => {
  // release only acts while holding — during `active` the finger has long
  // since lifted, and a release-triggered cancel there would kill a capture
  // that already succeeded. Covers finger-up, finger-leaves-hit-area, and
  // gesture interruption alike, since all three route through onPressOut.
  if (captureState !== 'holding') {
    return;
  }
  clearHoldTimer();
  setCaptureState('idle');
  fill.value = withTiming(0, { duration: RING_REWIND_MS, easing: Easing.bezier(0.22, 0.61, 0.36, 1) });
  fillOpacity.value = withTiming(0, { duration: RING_OPACITY_OUT_MS });
};

const submitCapture = () => {
  const label = captureDraft.trim();
  setCaptureState('closing');
  fillOpacity.value = 0;
  fill.value = 0;
  setTimeout(() => {
    setCaptureState('idle');
    if (label) {
      onCapture(label); // Task 2 gives this a body; see Step 6.
    }
  }, SHEET_CLOSE_MS);
};
```

- [x] **Step 2: Ring geometry**

Exact values from the spec — slot 42×42, ring canvas 52×52 offset −5 on both axes (concentric, overhangs by 5px), `r=24.5`, stroke 2.5, circumference `2π×24.5 = 153.94`.

```tsx
const RING_CANVAS = 52;
const RING_OFFSET = -5;
const RING_RADIUS = 24.5;
const RING_STROKE_WIDTH = 2.5;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS; // 153.938...

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
```

Shared values (alongside the existing `glow` shared value in `FlameTeaserButton` — this component is being renamed; see Step 5):

```tsx
  const fill = useSharedValue(0);
  const fillOpacity = useSharedValue(0);

  const ringAnimatedProps = useAnimatedProps(() => ({
    strokeDashoffset: RING_CIRCUMFERENCE * (1 - fill.value),
  }));
  const ringOpacityStyle = useAnimatedStyle(() => ({ opacity: fillOpacity.value }));
```

`beginHold` above needs to also raise `fillOpacity` at press-start (140ms, per the spec's `filling` row) — add to the top of `beginHold`, before the `fill.value = withTiming(...)` line:

```tsx
  fillOpacity.value = withTiming(1, { duration: 140, easing: Easing.out(Easing.quad) });
```

JSX — a sibling of the existing glow `Svg`, before the flame `<Image>`:

```tsx
      <Animated.View
        pointerEvents="none"
        style={[
          { position: 'absolute', width: RING_CANVAS, height: RING_CANVAS, left: RING_OFFSET, top: RING_OFFSET },
          ringOpacityStyle,
        ]}
      >
        <Svg width={RING_CANVAS} height={RING_CANVAS}>
          <AnimatedCircle
            cx={RING_CANVAS / 2}
            cy={RING_CANVAS / 2}
            r={RING_RADIUS}
            stroke={isDark ? '#9fd7bc' : '#7A9B76'}
            strokeWidth={RING_STROKE_WIDTH}
            strokeLinecap="round"
            fill="none"
            strokeDasharray={`${RING_CIRCUMFERENCE} ${RING_CIRCUMFERENCE}`}
            // Rotated so the sweep starts at 12 o'clock, not 3 o'clock (SVG's default).
            transform={`rotate(-90 ${RING_CANVAS / 2} ${RING_CANVAS / 2})`}
            animatedProps={ringAnimatedProps}
          />
        </Svg>
      </Animated.View>
```

The linear/cubic-bezier easing split from the spec matters: `beginHold`'s fill uses `Easing.linear` (it's a progress meter — any ease makes the threshold feel early or late), `endHold`'s rewind uses `Easing.bezier(0.22, 0.61, 0.36, 1)` (a release should feel dismissed, not mechanically undone).

**Note (post-Task-1 fix):** the shipped `RING_OFFSET` value was `-5`, matching a "42×42 slot" described only in this spec's prose but never actually built as a layout box — the button really shrinks to the 24px icon it wraps. The fix landed as `RING_OFFSET = -(RING_CANVAS - ICON_SIZE) / 2` (i.e. `-14`), the same formula the existing glow offset already used, so both stay genuinely concentric with the real icon regardless of future size tweaks. If re-deriving this from scratch, use that formula, not the literal `-5` above.

- [x] **Step 3: Reduce-motion**

```tsx
  const reduceMotion = useReducedMotion(); // from 'react-native-reanimated'
```

Reduce-motion skips the ring sweep and cross-fades but keeps the real `HOLD_MS` timer — the threshold is the interaction, not its animation. Guard the animated parts of `beginHold`/`endHold`:

```tsx
  const beginHold = () => {
    if (captureState !== 'idle') return;
    setCaptureState('holding');
    if (!reduceMotion) {
      fillOpacity.value = withTiming(1, { duration: 140 });
      fill.value = withTiming(1, { duration: HOLD_MS, easing: Easing.linear });
    }
    holdTimer.current = setTimeout(() => {
      setCaptureState('active');
      setCaptureDraft('');
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      if (!reduceMotion) {
        fill.value = 1;
        fillOpacity.value = withDelay(780, withTiming(0, { duration: RING_OPACITY_OUT_MS }));
      }
    }, HOLD_MS);
  };
```

(Same guard pattern in `endHold`.) The sheet's own entrance (Step 4) similarly skips its slide/fade under reduce-motion and just appears.

- [x] **Step 4: Capture sheet, keyboard-relative not hardcoded**

The spec's prototype used fixed pixel values (keyboard 280, tab bar bottom 296, card bottom 386) because it's a static HTML mock with one fixed keyboard height. The spec itself flags this: *"drive the sheet's offset from `useAnimatedKeyboard()` rather than a fixed 280"* and *"if you change the keyboard height or bar height, recompute [386] — the first build had it at 312 and it overlapped."* Deriving every offset from the real keyboard height, on the UI thread, fixes that failure mode structurally rather than by picking a better constant — it can't drift out of sync with the tab bar, on any device, in any keyboard configuration.

```tsx
  const keyboard = useAnimatedKeyboard();
  const CAPTURE_GAP = 16; // the spec's gap between tab bar top and the card

  const captureCardStyle = useAnimatedStyle(() => ({
    bottom: TAB_BAR_BOTTOM + TAB_BAR_HEIGHT + CAPTURE_GAP + keyboard.height.value,
  }));
```

**Note (post-Task-1 fix):** the shipped version also raised the tab bar itself with `keyboard.height.value`. That was wrong — it made the tab bar rise for *any* keyboard, including the regular per-tab add-task row (which already handles its own keyboard scrolling via `KeyboardAwareScrollView`). The fix removed the keyboard term from the tab bar's own animated style entirely; only the capture card (above) tracks keyboard height. The tab bar now stays at a fixed `TAB_BAR_BOTTOM` and simply sits behind the keyboard like a normal nav bar, which is what the code above already reflects.

Render the card conditionally on `captureState`:

```tsx
      {captureState === 'active' || captureState === 'closing' ? (
        <Animated.View
          style={[{ position: 'absolute', left: 0, right: 0, alignItems: 'center' }, captureCardStyle]}
        >
          <View
            className="w-[86%] rounded-2xl"
            style={{ boxShadow: '0px 12px 32px rgba(0, 0, 0, 0.14)' }}
          >
            <View className="overflow-hidden rounded-2xl bg-white px-[17px] py-[15px] dark:bg-[#1d1d1d]">
              <TextInput
                autoFocus
                value={captureDraft}
                onChangeText={setCaptureDraft}
                onBlur={submitCapture}
                returnKeyType="done"
                placeholder={strings.tasks.newTaskPlaceholder}
                placeholderTextColor="#b6b3ab"
                className="text-[15.5px] leading-5 text-[#2a2a28] dark:text-[#f2f1ee]"
              />
            </View>
          </View>
        </Animated.View>
      ) : null}
```

**Note (post-Task-1 fixes, both already reflected above):** the card originally used `shadowColor`/`shadowOpacity`/`elevation` on a single view, which flashed an unrounded shadow/border for a frame on Android during the Reanimated mount/unmount fade (elevation-based shadows and Reanimated layout animations don't compose cleanly on Android). Fixed by splitting into an outer shadow-casting view (`boxShadow`, no clipping) and an inner clipped view (`overflow-hidden`), matching the pattern `GlassCard.tsx` already used. Separately, the original wiring used `onSubmitEditing={submitCapture}` as the commit path; that left the sheet stuck open if dismissed any other way (tap away, back button, swipe down) since nothing else triggered a close. Fixed by wiring `onBlur={submitCapture}` as the *single* commit path instead (Done still works, since it naturally blurs), plus a `keyboardDidHide` safety net for the back-button/swipe case where the keyboard can disappear without ever firing blur — mirrors the identical, already-proven pattern in `TaskListScreen.tsx`'s own add-task row.

Card entrance/exit: `Animated.View`'s conditional mount already gives an abrupt appear/disappear; add `entering`/`exiting` from Reanimated matching the spec's 340/380ms:

```tsx
import { FadeIn, FadeOut } from 'react-native-reanimated';
// ...
          entering={reduceMotion ? undefined : FadeIn.duration(340)}
          exiting={reduceMotion ? undefined : FadeOut.duration(380)}
```

Note: the spec's "Done key replaces the keyboard's return key" (a custom 86px accessory view) is an iOS `inputAccessoryView` concept without a direct cross-platform RN equivalent; `returnKeyType="done"` gives the same *function* (Done blurs, which now commits) without the custom key styling. Building a literal custom accessory view is a reasonable follow-up, not required for this task's definition of done.

- [x] **Step 5: Accessibility — plain-tap fallback, never require a hold**

```tsx
  const [screenReaderOn, setScreenReaderOn] = useState(false);
  useEffect(() => {
    AccessibilityInfo.isScreenReaderEnabled().then(setScreenReaderOn);
    const sub = AccessibilityInfo.addEventListener('screenReaderChanged', setScreenReaderOn);
    return () => sub.remove();
  }, []);

  const handlePress = () => {
    if (screenReaderOn && captureState === 'idle') {
      setCaptureState('active');
      setCaptureDraft('');
    }
    // A normal (non-screen-reader) quick tap does nothing new — releasing
    // before HOLD_MS already routes through endHold via onPressOut, which
    // rewinds the ring and returns to idle. There's no separate "tap" action
    // to fire here for a sighted user; the old teaser toast is retired.
  };
```

Rename `FlameTeaserButton` to `FlameCaptureButton` (it's no longer a teaser) and give it real `accessibilityLabel`/`accessibilityHint`:

```tsx
    <Pressable
      onPress={handlePress}
      onPressIn={beginHold}
      onPressOut={endHold}
      onLongPress={() => {}} // state transition already happens on the HOLD_MS timer in beginHold; RN's own onLongPress isn't used for timing, just kept so accessibility services that synthesize a long-press gesture (rather than press+hold) still trigger the same path — wire it to call the timer's callback body directly if testing shows RN's synthesized long-press doesn't route through onPressIn/onPressOut on some assistive tech.
      delayLongPress={HOLD_MS}
      accessibilityRole="button"
      accessibilityLabel={strings.a11y.addTask}
      accessibilityHint={strings.a11y.addTaskHint}
      hitSlop={12}
      style={({ pressed }) => (pressed ? { opacity: 0.6 } : null)}
      className="items-center justify-center"
    >
```

- [x] **Step 6: Wire the capture callback, stubbed for now**

```tsx
  // Task 2 gives this a real body (writes Daily Focus). Stubbed here so
  // this task's own commit is honest about what it does and doesn't do yet.
  const onCapture = (_label: string) => {};
```

- [x] **Step 7: Retire the teaser strings, add the real ones**

In `constants/strings.ts`, remove `nav.flameToast` and `a11y.flameTeaser` (no longer used — the flame isn't a teaser anymore), add:

```ts
  a11y: {
    // ...existing entries...
    addTask: 'Add task',
    addTaskHint: 'Press and hold to capture a task',
  },
```

If `strings.nav` has no other entries once `flameToast` is removed, remove the now-empty `nav` block entirely rather than leaving it hollow.

- [x] **Step 8: Manual verification**

No jest coverage in this task — gesture timing and Reanimated worklets don't run meaningfully under the mocked test environment (`jest/reanimatedMock.cjs` fires `withTiming` callbacks synchronously, not over real time). On a device or simulator:
1. Hold the flame — ring should sweep clockwise from 12 o'clock over a visibly-linear ~650ms, haptic fires right as the sheet appears, field is focused with the keyboard already up.
2. Release before ~650ms — ring eases back down quickly (faster than the fill felt), nothing else on screen moves.
3. With a screen reader on, a plain tap opens the sheet immediately, no hold required.
4. Enable reduce-motion (iOS: Settings → Accessibility → Motion; Android: system animation scale) — confirm the sheet still appears after a real 650ms hold, just without the ring sweep or fades.
5. Confirm the card never overlaps the tab bar on both a small (e.g. iPhone SE-class) and large (e.g. Pro Max-class) screen, with and without a home indicator.

- [x] **Step 9: Full verification**

Run: `npx tsc --noEmit && npx expo lint`
Expected: both clean.

- [x] **Step 10: Commit**

```bash
git add "app/(tabs)/_layout.tsx" constants/strings.ts
git commit -m "feat: flame long-press gesture, ring, and capture sheet"
```

---

## Task 2: Daily Focus data layer and dual-mode capture sheet

**Files:**
- Create: `hooks/dailyFocus.ts`
- Modify: `app/(tabs)/_layout.tsx`
- Modify: `constants/strings.ts`

**Interfaces:**
- Produces: `DailyFocus` type, `loadDailyFocus`/`saveDailyFocus` persistence, and a dual-mode flame sheet (declare vs manage). Task 6 consumes this to push widget updates on every transition.
- Consumes: nothing new — still no widget dependency. Like Task 1, fully buildable and demoable in Expo Go before the dev-client move (Task 3).

No native toolchain needed here — this is the JS/AsyncStorage half of the renegotiated spec (see "Decisions locked in" above for the full data model and copy table).

- [x] **Step 1: The Daily Focus store**

Create `hooks/dailyFocus.ts`, reusing the existing `todayString()` helper from `hooks/taskStorage.ts` rather than reimplementing date formatting:

```ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { todayString } from './taskStorage';

const KEY = 'sarani.dailyFocus.v1';

export type DailyFocusStatus = 'unset' | 'active' | 'completed' | 'deleted';

export type DailyFocus = {
  status: DailyFocusStatus;
  label: string | null;
  date: string;
};

const EMPTY = (status: DailyFocusStatus): DailyFocus => ({
  status,
  label: null,
  date: todayString(),
});

// Resolves a persisted record against the current date — a record from a
// previous day is never carried forward (no rollover, regardless of status),
// it's just today's "nothing set yet" state.
function resolveForToday(stored: DailyFocus | null): DailyFocus {
  if (!stored || stored.date !== todayString()) {
    return EMPTY('unset');
  }
  return stored;
}

export async function loadDailyFocus(): Promise<DailyFocus> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    return resolveForToday(raw ? (JSON.parse(raw) as DailyFocus) : null);
  } catch (error) {
    console.warn('[sarani] failed to load daily focus', error);
    return EMPTY('unset');
  }
}

async function persist(next: DailyFocus): Promise<DailyFocus> {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(next));
  } catch (error) {
    console.warn('[sarani] failed to save daily focus', error);
  }
  return next;
}

export const declareDailyFocus = (label: string) =>
  persist({ status: 'active', label, date: todayString() });

export const completeDailyFocus = () => persist(EMPTY('completed'));

export const deleteDailyFocus = () => persist(EMPTY('deleted'));
```

- [x] **Step 2: Load it once on mount**

In `TabsLayout` (`app/(tabs)/_layout.tsx`), alongside the existing capture state:

```tsx
  const [dailyFocus, setDailyFocus] = useState<DailyFocus | null>(null);

  useEffect(() => {
    loadDailyFocus().then(setDailyFocus);
  }, []);
```

`dailyFocus === null` means "not loaded yet" (first frame only); treat it the same as `unset` for rendering purposes, but don't let the flame's press handlers act until it resolves, to avoid a declare/manage flicker on cold start.

- [x] **Step 3: Dual-mode press handling**

`handleFlamePress` (the screen-reader plain-tap path) and the hold-to-`active` transition in `beginHold` both currently do the same thing unconditionally: open a blank sheet. Both need to branch on whether `dailyFocus?.status === 'active'`:

```tsx
  const isManaging = dailyFocus?.status === 'active';

  // Inside beginHold's HOLD_MS timeout, and inside handlePress's screen-reader
  // branch: instead of always setCaptureDraft(''), seed the draft when managing
  // an existing focus so Replace works by just editing the pre-filled text.
  setCaptureDraft(isManaging ? (dailyFocus!.label ?? '') : '');
```

- [x] **Step 4: Manage-mode sheet UI**

The sheet's `TextInput` (Task 1, Step 4) stays as the single text field for both modes — declaring and replacing both end with typed text + submit. Manage mode adds two actions above/beside it, visible only when `isManaging`:

```tsx
      {isManaging ? (
        <View className="flex-row justify-end gap-3 pb-2">
          <Pressable onPress={handleDeleteFocus} accessibilityRole="button" accessibilityLabel={strings.a11y.deleteFocus}>
            <Text className="text-[13px] text-[#a15c5c]">{strings.tasks.deleteFocus}</Text>
          </Pressable>
          <Pressable onPress={handleCompleteFocus} accessibilityRole="button" accessibilityLabel={strings.a11y.completeFocus}>
            <Text className="text-[13px] text-primary">{strings.tasks.completeFocus}</Text>
          </Pressable>
        </View>
      ) : null}
```

(Exact placement/styling is a detail to settle during implementation, not specified further here — the spec only fixes the *behavior*, not this sub-screen's visual layout.)

```tsx
  const handleCompleteFocus = async () => {
    const next = await completeDailyFocus();
    setDailyFocus(next);
    submitCapture(); // closes the sheet the same way Done does, without adding a new label
  };

  const handleDeleteFocus = async () => {
    const next = await deleteDailyFocus();
    setDailyFocus(next);
    submitCapture();
  };
```

`submitCapture` (Task 1) already closes the sheet and, separately, calls `onCapture(label)` only if `captureDraft` is non-empty — Complete/Delete should clear the draft first (`setCaptureDraft('')`) so that close doesn't also fire a spurious declare.

- [x] **Step 5: `onCapture` writes a real declare/replace**

Replace Task 1's stub:

```tsx
  const onCapture = async (label: string) => {
    const next = await declareDailyFocus(label);
    setDailyFocus(next);
    // Task 6 adds the widget push here.
  };
```

- [x] **Step 6: Copy**

In `constants/strings.ts`, add (exact placement/grouping is a detail — keep near the existing `tasks`/`a11y` blocks):

```ts
  tasks: {
    // ...existing entries...
    completeFocus: 'Complete',
    deleteFocus: 'Delete',
  },
  a11y: {
    // ...existing entries...
    completeFocus: 'Complete your One Thing',
    deleteFocus: 'Delete your One Thing',
  },
```

The three widget-facing copy states ("What's the one thing for today?", "Your Next 1thing!", "Your 1thing?") belong to the widget content model, not this file — see Task 4/5. The capture sheet's own `TextInput` placeholder is unchanged from Task 1 (`strings.tasks.newTaskPlaceholder`, "New task") for both declare and replace; revisit only if that reads oddly once it's actually on screen next to the "One Thing" framing.

- [x] **Step 7: Full verification**

Run: `npx tsc --noEmit && npx expo lint`

- [x] **Step 8: Manual verification**

1. Long-press the flame with nothing set — blank sheet, same as Task 1.
2. Type a task, submit — sheet closes; confirm (via a temporary log or the next task's widget once built) that a Daily Focus was persisted, and confirm the task did **not** appear in Today.
3. Long-press the flame again — sheet now shows the previously-declared text with Complete/Delete visible, not a blank field.
4. Edit the text and submit — Daily Focus updates to the new label (replace path).
5. Long-press, tap Complete — sheet closes, status becomes `completed`.
6. Long-press again — back to a blank sheet (not manage mode), since `completed` isn't `active`.
7. Repeat 2–3, then tap Delete instead of Complete — same blank-sheet-on-next-open outcome, different persisted status.
8. Force-quit and relaunch the app the same day — the previously `active` focus (if any) is still shown in manage mode; nothing resets just from restarting.

- [x] **Step 9: Commit**

```bash
git add "app/(tabs)/_layout.tsx" constants/strings.ts hooks/dailyFocus.ts
git commit -m "feat: Daily Focus data layer and dual-mode flame sheet"
```

---

## Task 3: Move to a custom dev client

**Files:**
- Modify: `package.json`
- Modify: `app.json`

**Interfaces:**
- Produces: a working `expo-dev-client` build (Android and iOS) running today's app identically to Expo Go. Tasks 4–7 depend on this.

- [ ] **Step 1: Install expo-dev-client**

```bash
npx expo install expo-dev-client
```

- [ ] **Step 2: Prebuild both platforms**

```bash
npx expo prebuild
```

Generates `android/` and `ios/` fresh. On Windows, the `ios/` project can't be opened locally, but `prebuild` still generates it correctly for EAS's cloud build to consume.

- [ ] **Step 3: Build development clients**

Using the existing `development` profile in `eas.json` (`developmentClient: true`, already present, never used until now):

```bash
eas build --profile development --platform android
eas build --profile development --platform ios
```

Install the Android APK on a device/emulator. For iOS, install via the link EAS provides after the build (requires the device's UDID to already be registered with your Apple Developer account for ad-hoc distribution — register it first if this is a new device; this is a manual Apple Developer portal step, not something the agent can do).

- [ ] **Step 4: Manual verification — parity with Expo Go, both platforms**

```bash
npx expo start --dev-client
```

On both an Android device/emulator and a physical iPhone: confirm the whole app (all tabs, History, About, dark mode, and the flame's declare/manage sheet from Tasks 1–2) looks and behaves identically to how it did before this task.

- [ ] **Step 5: Commit**

```bash
git add package.json app.json eas.json
git commit -m "chore: move to a custom dev client to unblock native widget work"
```

(`android/`/`ios/` are prebuild-generated — check `.gitignore` before adding; the standard Expo/CNG setup keeps them out of version control since they're regenerable.)

---

## Task 4: Android widget spike — the real content model

**Files:**
- Modify: `app.json`
- Create: `widgets/TaskWidget.tsx`
- Create: `widgets/widget-task-handler.ts`
- Create: `index.ts`
- Modify: `package.json`

**Interfaces:**
- Consumes: Task 3's dev client, Task 2's `DailyFocus` type and `loadDailyFocus()`.
- Produces: `TaskWidget({ status, label, theme? })` rendering all three copy states from "Decisions locked in" — proven on-device before Task 6 wires live pushes into it.

Building the real content model directly (not a throwaway "Hello" spike first) — the spec's tile is simple enough (badge + text, one row) that there's no separate value in spiking something even smaller first, unlike a from-scratch native pipeline where isolating "does the toolchain work" from "does the feature work" mattered more.

- [ ] **Step 1: Install and confirm the current version**

```bash
npm view react-native-android-widget version
npx expo install react-native-android-widget
```

- [ ] **Step 2: Config plugin**

In `app.json`'s `"plugins"` array. `clickAction: "OPEN_APP"` (or the equivalent supported by the installed version — confirm against its current docs) is what makes tapping the widget open the app plainly, per the "tapping the widget opens Today, nothing else" decision — the actual routing to the Today tab specifically happens on the JS side once the app opens (expo-router's default entry already resolves to Today; no special deep link needed unless testing shows otherwise):

```json
      [
        "react-native-android-widget",
        {
          "widgets": [
            {
              "name": "Sarani",
              "label": "Sarani",
              "minWidth": "250dp",
              "minHeight": "80dp",
              "description": "Shows your One Thing for today."
            }
          ]
        }
      ]
```

- [ ] **Step 3: The widget component — all three copy states**

Create `widgets/TaskWidget.tsx`. Unlike the original single-`label` version, this now takes the full `DailyFocus` shape and resolves copy itself, so the task handler (Step 4) stays a thin resolve-and-render layer:

```tsx
'use no memo';
import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';
import type { DailyFocusStatus } from '@/hooks/dailyFocus';

const THEME = {
  light: { surface: '#fbfaf7', badgeWash: 'rgba(139,178,140,.22)', badgeText: '#6f8f5f', text: '#1b1b19' },
  dark: { surface: '#1d1d1d', badgeWash: 'rgba(159,215,188,.22)', badgeText: '#9fd7bc', text: '#f2f1ee' },
} as const;

// Mirrors the copy table in the plan's "Decisions locked in" section — keep
// these two in sync if the wording ever changes.
function copyFor(status: DailyFocusStatus, label: string | null): string {
  switch (status) {
    case 'active':
      return label ?? '';
    case 'completed':
      return 'Your Next 1thing!';
    case 'deleted':
      return 'Your 1thing?';
    case 'unset':
    default:
      return "What's the one thing for today?";
  }
}

export function TaskWidget({
  status,
  label,
  theme = 'light',
}: {
  status: DailyFocusStatus;
  label: string | null;
  theme?: keyof typeof THEME;
}) {
  const t = THEME[theme];
  const text = copyFor(status, label);
  return (
    <FlexWidget
      style={{
        width: 'match_parent',
        height: 'match_parent',
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: t.surface,
        borderRadius: 22,
        padding: 18,
      }}
      accessibilityLabel={`Sarani: ${text}`}
      clickAction="OPEN_APP"
    >
      <FlexWidget
        style={{
          width: 28,
          height: 28,
          borderRadius: 14,
          backgroundColor: t.badgeWash,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <TextWidget text="S" style={{ fontSize: 14, fontWeight: 'bold', color: t.badgeText }} />
      </FlexWidget>
      <FlexWidget style={{ width: 16, height: 1 }} />
      <TextWidget
        text={text}
        maxLines={2}
        style={{ fontSize: 17, color: t.text, lineHeight: 23 /* ~1.35 of 17 */ }}
      />
    </FlexWidget>
  );
}
```

Confirm `clickAction="OPEN_APP"` (or wherever the installed version's docs place this — it may be a top-level widget prop rather than per-`FlexWidget`) against the package's current API before treating this as final; the tap-opens-app behavior is a hard requirement from "Decisions locked in," not optional.

- [ ] **Step 4: Task handler + entry point**

Create `widgets/widget-task-handler.ts` — resolves the persisted `DailyFocus` (already date-checked by `loadDailyFocus()`, so a stale previous-day record here correctly renders as `unset` without any extra logic):

```ts
import React from 'react';
import type { WidgetTaskHandlerProps } from 'react-native-android-widget';
import { loadDailyFocus } from '../hooks/dailyFocus';
import { TaskWidget } from './TaskWidget';

export async function widgetTaskHandler(props: WidgetTaskHandlerProps) {
  if (props.widgetInfo.widgetName !== 'Sarani') {
    return;
  }
  switch (props.widgetAction) {
    case 'WIDGET_ADDED':
    case 'WIDGET_UPDATE':
    case 'WIDGET_RESIZED': {
      const focus = await loadDailyFocus();
      props.renderWidget(React.createElement(TaskWidget, { status: focus.status, label: focus.label }));
      break;
    }
    default:
      break;
  }
}
```

Create `index.ts` at the project root:

```ts
// expo-router's usual "main": "expo-router/entry" registers the root
// component as a side effect of being imported. Importing it here for that
// effect, then registering the widget task handler alongside it, is the
// standard way to add extra AppRegistry-level setup to an expo-router app.
import 'expo-router/entry';
import { registerWidgetTaskHandler } from 'react-native-android-widget';
import { widgetTaskHandler } from './widgets/widget-task-handler';

registerWidgetTaskHandler(widgetTaskHandler);
```

Change `package.json`'s `"main"`:

```json
  "main": "index.ts",
```

- [ ] **Step 5: Rebuild — native config changed**

```bash
npx expo prebuild --platform android --clean
eas build --profile development --platform android
```

- [ ] **Step 6: Manual verification**

Add the "Sarani" widget to an Android home screen with no Daily Focus set — confirm it shows the cream tile with the green "S" badge and "What's the one thing for today?" (not the old "Hold the flame to add a task"). Tap the widget — confirm it opens the app to the Today tab.

- [ ] **Step 7: Full verification**

Run: `npx tsc --noEmit && npx expo lint`

- [ ] **Step 8: Commit**

```bash
git add app.json package.json index.ts widgets/
git commit -m "feat: Android home-screen widget rendering the Daily Focus content model"
```

---

## Task 5: iOS widget spike — the same content model

**Files:**
- Modify: `app.json`
- Create: `widgets/TaskWidget.ios.tsx` (or a shared component with an iOS-specific render path — see Step 3's note)

**Interfaces:**
- Consumes: Task 3's dev client, Task 2's `DailyFocus` type.
- Produces: the same three-copy-state tile, rendered via Expo UI for a real WidgetKit extension.

`expo-widgets` is an official Expo SDK package (confirmed directly from its source in the `expo/expo` monorepo, not a third-party library) — its config plugin generates a real WidgetKit extension as an Xcode target (`ExpoWidgetsTarget`) with an App Group entitlement for data sharing, during `expo prebuild`. Widget UI is authored with Expo UI components (native SwiftUI primitives exposed to JS), not hand-written Swift.

- [ ] **Step 1: Install**

```bash
npx expo install expo-widgets
```

- [ ] **Step 2: Read the installed package's own README before writing widget code**

This is a genuinely newer, faster-moving part of the Expo SDK than `react-native-android-widget` — its exact JS-side API for defining a widget's UI, for pushing updated content from the app, and for handling widget taps (open-app behavior) wasn't fully resolvable from available docs at the time this plan was written (its config plugin internals are confirmed; its content-authoring, update-call, and tap-handling API are not). Before writing Steps 3–4 for real:

```bash
cat node_modules/expo-widgets/README.md
```

Read it directly — this determines the exact shape of Step 3 below. If the installed README describes a different API than what's sketched here, follow the README; this plan's sketch is a best-effort placeholder for a real, current API this task's own first step will confirm.

- [ ] **Step 3: Config plugin**

In `app.json`'s `"plugins"` array (exact shape per the config plugin source: `bundleIdentifier`/`groupIdentifier` are optional — the plugin derives sane fallbacks from `ios.bundleIdentifier` if omitted, per `withIosWidgets.ts`):

```json
      [
        "expo-widgets",
        {
          "widgets": [
            {
              "name": "Sarani"
            }
          ]
        }
      ]
```

- [ ] **Step 4: The widget component**

Sketch, to be reconciled against Step 2's README read — the visual spec (badge + gap + text, exact colors/sizes) is identical to Android's `TaskWidget` (Task 4, Step 3), and so is the copy-resolution logic (`copyFor(status, label)`); only the component primitives differ (Expo UI's SwiftUI-mapped components rather than `FlexWidget`/`TextWidget`):

```tsx
// Reconcile against the installed expo-widgets README (Step 2) before
// treating this as final — the exact import names/props may differ.
import { HStack, VStack, Text, Circle } from '@expo/ui/swift-ui'; // confirm actual export path
import type { DailyFocusStatus } from '@/hooks/dailyFocus';

function copyFor(status: DailyFocusStatus, label: string | null): string {
  // Same table as Android's TaskWidget.tsx — keep the two in sync.
  switch (status) {
    case 'active': return label ?? '';
    case 'completed': return 'Your Next 1thing!';
    case 'deleted': return 'Your 1thing?';
    default: return "What's the one thing for today?";
  }
}

export function TaskWidget({
  status,
  label,
  theme = 'light',
}: {
  status: DailyFocusStatus;
  label: string | null;
  theme?: 'light' | 'dark';
}) {
  const t = theme === 'dark'
    ? { surface: '#1d1d1d', badgeWash: 'rgba(159,215,188,.22)', badgeText: '#9fd7bc', text: '#f2f1ee' }
    : { surface: '#fbfaf7', badgeWash: 'rgba(139,178,140,.22)', badgeText: '#6f8f5f', text: '#1b1b19' };

  return (
    <HStack spacing={16} padding={18} background={t.surface} cornerRadius={22}>
      <Circle fill={t.badgeWash} frame={{ width: 28, height: 28 }}>
        <Text weight="bold" size={14} color={t.badgeText}>S</Text>
      </Circle>
      <Text size={17} color={t.text} lineLimit={2}>{copyFor(status, label)}</Text>
    </HStack>
  );
}
```

- [ ] **Step 5: Rebuild — native config changed**

```bash
npx expo prebuild --platform ios --clean
eas build --profile development --platform ios
```

- [ ] **Step 6: Manual verification**

On a physical iPhone (no simulator available on Windows): add the "Sarani" widget to a home screen with no Daily Focus set. Confirm the same visual as Android — cream tile, green "S" badge, "What's the one thing for today?" — renders correctly via WidgetKit. Tap the widget — confirm it opens the app to the Today tab.

- [ ] **Step 7: Full verification**

Run: `npx tsc --noEmit && npx expo lint`

- [ ] **Step 8: Commit**

```bash
git add app.json widgets/
git commit -m "feat: iOS home-screen widget rendering the Daily Focus content model"
```

---

## Task 6: Wire live pushes into both widgets

**Files:**
- Modify: `app/(tabs)/_layout.tsx`

**Interfaces:**
- Consumes: `declareDailyFocus`/`completeDailyFocus`/`deleteDailyFocus` from Task 2, `TaskWidget` from Tasks 4–5.

Tasks 4–5's widgets already resolve correctly from persisted storage on their own OS-triggered refresh cycle (`WIDGET_UPDATE` etc.) — that's what makes the three copy states survive a background refresh per "Decisions locked in." This task only adds the *live* push, so the widget updates the instant an action happens in-app rather than waiting for the next OS-triggered refresh.

- [ ] **Step 1: Push on every Daily Focus transition**

In `app/(tabs)/_layout.tsx`, `onCapture`, `handleCompleteFocus`, and `handleDeleteFocus` (Task 2) each already call one of the `hooks/dailyFocus.ts` mutators and get back the new `DailyFocus`. Add a widget push right after each:

```tsx
import { requestWidgetUpdate } from 'react-native-android-widget';
import { TaskWidget } from '@/widgets/TaskWidget';
// iOS's equivalent update call — confirm the exact name/shape against the
// README read in Task 5, Step 2, then call it the same way here.

const pushWidgetUpdate = (focus: DailyFocus) => {
  requestWidgetUpdate({
    widgetName: 'Sarani',
    renderWidget: () => ({
      light: React.createElement(TaskWidget, { status: focus.status, label: focus.label, theme: 'light' }),
      dark: React.createElement(TaskWidget, { status: focus.status, label: focus.label, theme: 'dark' }),
    }),
  });
  // Same idea for iOS — call whatever expo-widgets' own update function turned
  // out to be, per Task 5's README read.
};
```

Call `pushWidgetUpdate(next)` at the end of `onCapture`, `handleCompleteFocus`, and `handleDeleteFocus` alike — all three already have the fresh `DailyFocus` in scope from Task 2's implementation.

- [ ] **Step 2: In-app confirmation on declare/replace**

Per the "coda does not ship" decision: after `closing` completes and a declare/replace succeeds, show a brief, quiet confirmation rather than nothing. The `StayTunedToast` component this was originally going to repurpose no longer exists (removed in a later cleanup pass, along with the "Stay tuned" flow it belonged to) — build a small equivalent inline rather than reintroducing it, or fold a one-line confirmation into the sheet's own close animation. Exact visual is an implementation detail; the requirement is just "quiet, brief, present" — no modal, no loud success state.

- [ ] **Step 3: Manual verification — full loop, both platforms**

1. Long-press the flame, type a task, submit.
2. Confirm the task does **not** appear in Today (this is the opposite of the original plan's requirement — see "Decisions locked in").
3. Return to the home screen (Android, then iPhone) — confirm the widget on each now shows "S · <label>".
4. Force-quit the app entirely, relaunch, don't touch the flame — confirm the widget still shows the same label (proves Task 4/5's own storage-resolve path, not just the live push from this task).
5. Long-press the flame again (manage mode) and tap Complete — confirm the widget updates to "Your Next 1thing!" without a rebuild/relaunch.
6. Repeat with Delete — confirm "Your 1thing?".
7. Let a Daily Focus sit `active` overnight (or simulate a date change) — confirm the widget shows "What's the one thing for today?" the next day, not the previous label.
8. Submit the capture sheet with an empty field — confirm no Daily Focus is written and neither widget updates.
9. Tap the widget on each platform — confirm it opens straight to the Today tab.

- [ ] **Step 4: Full verification**

Run: `npx tsc --noEmit && npx expo lint`

- [ ] **Step 5: Commit**

```bash
git add "app/(tabs)/_layout.tsx"
git commit -m "feat: push Daily Focus changes live to both home-screen widgets"
```

---

## Task 7: Confirm theming end-to-end

**Files:**
- Verify only — Tasks 4–6 already built both widgets theme-aware (`TaskWidget`'s `theme` prop, the light/dark render pair in Task 6's `pushWidgetUpdate`).

- [ ] **Step 1: Manual verification**

On both platforms: switch the device's system theme to dark (widgets follow the OS setting, not this app's own in-app theme toggle — there's no existing bridge between the two, and building one is out of scope here). Confirm both widgets switch to the `#1d1d1d` surface / light text variant, across all four copy states (unset, active, completed, deleted) — not just the active/labeled one, since those are the states most likely to have only been checked in one theme during earlier tasks.

- [ ] **Step 2: Commit**

Only if Step 1 surfaces a fix — otherwise this task closes with no diff, confirming Tasks 4–6 already got theming right.

---

## Self-Review

**Spec coverage:** every numbered item in the user's original brief — the state machine and its exact timings (§2), ring geometry (§3), sheet layout (§4), haptics and accessibility (§5), widget content model (§6), the palette table (§7) — has a task, and Task 1 (which covers §2–§5) already shipped. The product semantics renegotiated afterward (flame = "One Thing" declaration, `DailyFocus` data model, dual-mode sheet, three-state widget copy, no-rollover, tap-opens-Today) are captured in "Decisions locked in" and threaded through Tasks 2, 4, 5, and 6, replacing the earlier `lastCapturedTask`/single-placeholder design those tasks originally specified.

**Placeholder scan:** Task 5's Steps 2–4 remain the one place this plan is honestly less certain than the rest — flagged explicitly as needing confirmation against the installed package's own README, with a concrete reason why (a newer, less-documented corner of a fast-moving SDK feature), rather than presenting invented API names as verified fact. The exact visual layout of Task 2's manage-mode Complete/Delete actions is likewise left as an implementation detail rather than a specified pixel layout, since the spec only ever fixed the *behavior* here, not this sub-screen's look.

**Type consistency:** `TaskWidget({ status, label, theme })`'s prop shape is identical across Android (Task 4) and iOS (Task 5), and both resolve copy via the same four-way `switch` on `DailyFocusStatus`. `DailyFocus`'s shape (Task 2) is consumed unchanged by the widget task handlers (Task 4/5) and the live-push path (Task 6) — no separate "widget content" type exists alongside it.
