# Flame Long-Press Widget Capture Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Long-pressing the flame icon fills a ring, raises a focused capture sheet above the keyboard, and on submit pushes the task to a home-screen widget on both iOS and Android.

**Architecture:** Six tasks. Task 1 (the gesture, ring, and sheet) is pure Reanimated/RN UI with no native widget dependency — it's built and fully verifiable before any native toolchain work starts, so there's visible, demoable progress before the bigger commitment. Task 2 moves the project to a custom dev client (needed from here on). Tasks 3–4 spike each platform's widget in isolation. Task 5 wires the two together. Task 6 themes them.

**Tech Stack:** Reanimated 4 (`useAnimatedKeyboard`, `Animated.Circle`), `react-native-android-widget` for Android, `expo-widgets` (official Expo SDK package) for iOS, EAS Build.

**Spec:** The user-supplied handoff brief (gesture state machine, ring geometry, sheet layout, palette, definition of done) — treated as authoritative for every number in Task 1. Companion plan: `docs/superpowers/plans/2026-08-18-task-list-polish.md` (items 1–4, fully independent of this one).

## Decisions locked in before this plan was written

- **Widget approach: Expo/RN-bridged, not raw native.** `react-native-android-widget` for Android (JS-authored widget UI, third-party but well-documented and verified against its current docs — see Task 3). `expo-widgets` for iOS (official Expo SDK package, config-plugin-generated WidgetKit extension target, widget UI authored via Expo UI components — see Task 4). Neither requires hand-writing Swift or Kotlin, though both do generate and depend on real native project structure via `expo prebuild` — this is not purely a JS-only feature the way the rest of the app is.
- **Add-task entry points stay separate.** The existing inline "+ Add task" rows in `TaskListScreen.tsx` are untouched. This plan adds a new, distinct fast-capture path; it does not replace anything already shipped.
- **The coda (home-screen preview) does not ship.** Demo-only, gated behind a flag if kept at all. Real `Done` → a brief in-app confirmation.

## Global Constraints

- **Windows environment note:** this project is developed on Windows. There is no local Xcode or iOS Simulator. iOS dev-client builds must go through EAS Build's cloud macOS runners (`eas build --platform ios`), and on-device verification requires a physical iPhone via ad-hoc/internal distribution — there is no way to visually check the iOS widget without one. Android has no such constraint (a local emulator works fine on Windows).
- Every keyboard-relative layout value in Task 1 is derived from `useAnimatedKeyboard().height`, not hardcoded — see Task 1, Step 4's note on why. Only genuinely fixed values (ring geometry, card width/radius/shadow, badge size, colors) stay as literal constants.
- `HOLD_MS` (650) is a single named constant, not repeated as a magic number anywhere.
- The existing `strings.nav.flameToast` ("Stay tuned") and `strings.a11y.flameTeaser` ("Coming soon") describe a not-yet-built feature. Once this plan lands, the flame does something real — these strings are replaced, not kept alongside the new behavior.
- Run `npx tsc --noEmit` and `npx expo lint` after every task. Most of this plan's real verification is manual/on-device (gesture timing, native widget rendering) — flagged explicitly per task rather than dressed up as automated coverage that doesn't exist.

---

## Task 1: Gesture state machine, ring, and capture sheet

**Files:**
- Modify: `app/(tabs)/_layout.tsx`
- Modify: `constants/strings.ts`

**Interfaces:**
- Produces: `onCapture: (label: string) => void` — fired when the sheet closes with non-empty text. Task 5 wires this to the two widget-push calls; until then it's a no-op stub, stated explicitly (see Step 6).

No widget dependency in this task. Fully buildable and demoable under the app's current setup, before Task 2's dev-client move.

- [ ] **Step 1: State machine**

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
      onCapture(label); // Task 5 gives this a body; see Step 6.
    }
  }, SHEET_CLOSE_MS);
};
```

- [ ] **Step 2: Ring geometry**

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

- [ ] **Step 3: Reduce-motion**

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

- [ ] **Step 4: Capture sheet, keyboard-relative not hardcoded**

The spec's prototype used fixed pixel values (keyboard 280, tab bar bottom 296, card bottom 386) because it's a static HTML mock with one fixed keyboard height. The spec itself flags this: *"drive the sheet's offset from `useAnimatedKeyboard()` rather than a fixed 280"* and *"if you change the keyboard height or bar height, recompute [386] — the first build had it at 312 and it overlapped."* Deriving every offset from the real keyboard height, on the UI thread, fixes that failure mode structurally rather than by picking a better constant — it can't drift out of sync with the tab bar, on any device, in any keyboard configuration.

```tsx
  const keyboard = useAnimatedKeyboard();
  const CAPTURE_GAP = 16; // the spec's gap between tab bar top and the card

  const tabBarAnimatedStyle = useAnimatedStyle(() => ({
    bottom: TAB_BAR_BOTTOM + (captureState === 'active' || captureState === 'closing' ? keyboard.height.value : 0),
  }));

  const captureCardStyle = useAnimatedStyle(() => ({
    bottom: TAB_BAR_BOTTOM + TAB_BAR_HEIGHT + CAPTURE_GAP +
      (captureState === 'active' || captureState === 'closing' ? keyboard.height.value : 0),
  }));
```

(`captureState` needs to be readable from a worklet here — either mirror it into a shared value alongside the `useState`, or, simpler, drive the style purely off `keyboard.height.value` itself: when the keyboard is down, `keyboard.height.value` is `0` regardless of `captureState`, so the `captureState === 'active' || 'closing'` condition is actually redundant — `TAB_BAR_BOTTOM + keyboard.height.value` alone already gives the resting position when no keyboard is up and the raised position exactly when it is. Simplify to that; note this in the implementation rather than carrying the redundant condition.)

Render the card conditionally on `captureState`:

```tsx
      {captureState === 'active' || captureState === 'closing' ? (
        <Animated.View
          style={[{ position: 'absolute', left: 0, right: 0, alignItems: 'center' }, captureCardStyle]}
        >
          <View
            className="w-[86%] rounded-2xl bg-white px-[17px] py-[15px] dark:bg-[#1d1d1d]"
            style={{ shadowColor: '#000', shadowOpacity: 0.14, shadowRadius: 32, shadowOffset: { width: 0, height: 12 }, elevation: 8 }}
          >
            <TextInput
              autoFocus
              value={captureDraft}
              onChangeText={setCaptureDraft}
              onSubmitEditing={submitCapture}
              returnKeyType="done"
              placeholder={strings.tasks.newTaskPlaceholder}
              placeholderTextColor="#b6b3ab"
              className="text-[15.5px] leading-5 text-[#2a2a28] dark:text-[#f2f1ee]"
            />
          </View>
        </Animated.View>
      ) : null}
```

Card entrance/exit: `Animated.View`'s conditional mount already gives an abrupt appear/disappear; add `entering`/`exiting` from Reanimated matching the spec's 340/380ms:

```tsx
import { FadeIn, FadeOut } from 'react-native-reanimated';
// ...
          entering={reduceMotion ? undefined : FadeIn.duration(340)}
          exiting={reduceMotion ? undefined : FadeOut.duration(380)}
```

Note: the spec's "Done key replaces the keyboard's return key" (a custom 86px accessory view) is an iOS `inputAccessoryView` concept without a direct cross-platform RN equivalent; `returnKeyType="done"` plus `onSubmitEditing` gives the same *function* (Done submits) without the custom key styling. Building a literal custom accessory view is a reasonable follow-up, not required for this task's definition of done.

- [ ] **Step 5: Accessibility — plain-tap fallback, never require a hold**

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

- [ ] **Step 6: Wire the capture callback, stubbed for now**

```tsx
  // Task 5 gives this a real body (pushes to both widgets). Stubbed here so
  // this task's own commit is honest about what it does and doesn't do yet.
  const onCapture = (_label: string) => {};
```

- [ ] **Step 7: Retire the teaser strings, add the real ones**

In `constants/strings.ts`, remove `nav.flameToast` and `a11y.flameTeaser` (no longer used — the flame isn't a teaser anymore), add:

```ts
  a11y: {
    // ...existing entries...
    addTask: 'Add task',
    addTaskHint: 'Press and hold to capture a task',
  },
```

If `strings.nav` has no other entries once `flameToast` is removed, remove the now-empty `nav` block entirely rather than leaving it hollow.

- [ ] **Step 8: Manual verification**

No jest coverage in this task — gesture timing and Reanimated worklets don't run meaningfully under the mocked test environment (`jest/reanimatedMock.cjs` fires `withTiming` callbacks synchronously, not over real time). On a device or simulator:
1. Hold the flame — ring should sweep clockwise from 12 o'clock over a visibly-linear ~650ms, haptic fires right as the sheet appears, field is focused with the keyboard already up.
2. Release before ~650ms — ring eases back down quickly (faster than the fill felt), nothing else on screen moves.
3. With a screen reader on, a plain tap opens the sheet immediately, no hold required.
4. Enable reduce-motion (iOS: Settings → Accessibility → Motion; Android: system animation scale) — confirm the sheet still appears after a real 650ms hold, just without the ring sweep or fades.
5. Confirm the card never overlaps the tab bar on both a small (e.g. iPhone SE-class) and large (e.g. Pro Max-class) screen, with and without a home indicator.

- [ ] **Step 9: Full verification**

Run: `npx tsc --noEmit && npx expo lint`
Expected: both clean.

- [ ] **Step 10: Commit**

```bash
git add "app/(tabs)/_layout.tsx" constants/strings.ts
git commit -m "feat: flame long-press gesture, ring, and capture sheet"
```

---

## Task 2: Move to a custom dev client

**Files:**
- Modify: `package.json`
- Modify: `app.json`

**Interfaces:**
- Produces: a working `expo-dev-client` build (Android and iOS) running today's app identically to Expo Go. Tasks 3–6 depend on this.

- [ ] **Step 1: Install expo-dev-client**

```bash
npx expo install expo-dev-client
```

- [ ] **Step 2: Prebuild both platforms**

```bash
npx expo prebuild
```

Generates `android/` (currently absent) and `ios/`. On Windows, the `ios/` project can't be opened locally, but `prebuild` still generates it correctly for EAS's cloud build to consume.

- [ ] **Step 3: Build development clients**

Using the existing `development` profile in `eas.json` (`developmentClient: true`, already present, never used until now):

```bash
eas build --profile development --platform android
eas build --profile development --platform ios
```

Install the Android APK on a device/emulator. For iOS, install via the link EAS provides after the build (requires the device's UDID to already be registered with your Apple Developer account for ad-hoc distribution — register it first if this is a new device).

- [ ] **Step 4: Manual verification — parity with Expo Go, both platforms**

```bash
npx expo start --dev-client
```

On both an Android device/emulator and a physical iPhone: confirm the whole app (all tabs, History, About, dark mode, and Task 1's flame gesture) looks and behaves identically to how it did before this task.

- [ ] **Step 5: Commit**

```bash
git add package.json app.json eas.json
git commit -m "chore: move to a custom dev client to unblock native widget work"
```

(`android/`/`ios/` are prebuild-generated — check `.gitignore` before adding; the standard Expo/CNG setup keeps them out of version control since they're regenerable.)

---

## Task 3: Android widget spike — the real content model

**Files:**
- Modify: `app.json`
- Create: `widgets/TaskWidget.tsx`
- Create: `widgets/widget-task-handler.ts`
- Create: `index.ts`
- Modify: `package.json`

**Interfaces:**
- Consumes: Task 2's dev client.
- Produces: `TaskWidget({ label, theme? })` rendering the spec's single-line tile — proven on-device before Task 5 wires real data into it.

Building the real content model directly (not a throwaway "Hello" spike first) — the spec's tile is simple enough (badge + text, one row) that there's no separate value in spiking something even smaller first, unlike a from-scratch native pipeline where isolating "does the toolchain work" from "does the feature work" mattered more.

- [ ] **Step 1: Install and confirm the current version**

```bash
npm view react-native-android-widget version
npx expo install react-native-android-widget
```

- [ ] **Step 2: Config plugin**

In `app.json`'s `"plugins"` array:

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
              "description": "Shows your most recently captured task."
            }
          ]
        }
      ]
```

- [ ] **Step 3: The widget component — spec's exact tile**

Create `widgets/TaskWidget.tsx`:

```tsx
'use no memo';
import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';

const THEME = {
  light: { surface: '#fbfaf7', badgeWash: 'rgba(139,178,140,.22)', badgeText: '#6f8f5f', text: '#1b1b19' },
  dark: { surface: '#1d1d1d', badgeWash: 'rgba(159,215,188,.22)', badgeText: '#9fd7bc', text: '#f2f1ee' },
} as const;

export function TaskWidget({ label, theme = 'light' }: { label: string; theme?: keyof typeof THEME }) {
  const t = THEME[theme];
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
      accessibilityLabel={`Sarani task: ${label}`}
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
        text={label}
        maxLines={2}
        style={{ fontSize: 17, color: t.text, lineHeight: 23 /* ~1.35 of 17 */ }}
      />
    </FlexWidget>
  );
}
```

- [ ] **Step 4: Task handler + entry point**

Create `widgets/widget-task-handler.ts`:

```ts
import React from 'react';
import type { WidgetTaskHandlerProps } from 'react-native-android-widget';
import { TaskWidget } from './TaskWidget';

export async function widgetTaskHandler(props: WidgetTaskHandlerProps) {
  if (props.widgetInfo.widgetName !== 'Sarani') {
    return;
  }
  switch (props.widgetAction) {
    case 'WIDGET_ADDED':
    case 'WIDGET_UPDATE':
    case 'WIDGET_RESIZED':
      // No task captured yet this session — Task 5 makes this reflect the
      // real most-recent task via persisted storage.
      props.renderWidget(React.createElement(TaskWidget, { label: 'Hold the flame to add a task' }));
      break;
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

Add the "Sarani" widget to an Android home screen. Confirm it shows the cream tile with the green "S" badge and "Hold the flame to add a task," matching the spec's single-line-tile description — no extra chrome, no app-name label.

- [ ] **Step 7: Full verification**

Run: `npx tsc --noEmit && npx expo lint`

- [ ] **Step 8: Commit**

```bash
git add app.json package.json index.ts widgets/
git commit -m "feat: Android home-screen widget rendering the spec's task tile"
```

---

## Task 4: iOS widget spike — the same content model

**Files:**
- Modify: `app.json`
- Create: `widgets/TaskWidget.ios.tsx` (or a shared component with an iOS-specific render path — see Step 3's note)

**Interfaces:**
- Consumes: Task 2's dev client.
- Produces: the same single-line tile, rendered via Expo UI for a real WidgetKit extension.

`expo-widgets` is an official Expo SDK package (confirmed directly from its source in the `expo/expo` monorepo, not a third-party library) — its config plugin generates a real WidgetKit extension as an Xcode target (`ExpoWidgetsTarget`) with an App Group entitlement for data sharing, during `expo prebuild`. Widget UI is authored with Expo UI components (native SwiftUI primitives exposed to JS), not hand-written Swift.

- [ ] **Step 1: Install**

```bash
npx expo install expo-widgets
```

- [ ] **Step 2: Read the installed package's own README before writing widget code**

This is a genuinely newer, faster-moving part of the Expo SDK than `react-native-android-widget` — its exact JS-side API for defining a widget's UI and for pushing updated content from the app wasn't fully resolvable from available docs at the time this plan was written (its config plugin internals are confirmed; its content-authoring and update-call API are not). Before writing Steps 3–4 for real:

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

Sketch, to be reconciled against Step 2's README read — the visual spec (badge + gap + text, exact colors/sizes) is identical to Android's `TaskWidget` (Task 3, Step 3); only the component primitives differ (Expo UI's SwiftUI-mapped components rather than `FlexWidget`/`TextWidget`):

```tsx
// Reconcile against the installed expo-widgets README (Step 2) before
// treating this as final — the exact import names/props may differ.
import { HStack, VStack, Text, Circle } from '@expo/ui/swift-ui'; // confirm actual export path

export function TaskWidget({ label, theme = 'light' }: { label: string; theme?: 'light' | 'dark' }) {
  const t = theme === 'dark'
    ? { surface: '#1d1d1d', badgeWash: 'rgba(159,215,188,.22)', badgeText: '#9fd7bc', text: '#f2f1ee' }
    : { surface: '#fbfaf7', badgeWash: 'rgba(139,178,140,.22)', badgeText: '#6f8f5f', text: '#1b1b19' };

  return (
    <HStack spacing={16} padding={18} background={t.surface} cornerRadius={22}>
      <Circle fill={t.badgeWash} frame={{ width: 28, height: 28 }}>
        <Text weight="bold" size={14} color={t.badgeText}>S</Text>
      </Circle>
      <Text size={17} color={t.text} lineLimit={2}>{label}</Text>
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

On a physical iPhone (no simulator available on Windows): add the "Sarani" widget to a home screen. Confirm the same visual — cream tile, green "S" badge, placeholder text — renders correctly via WidgetKit.

- [ ] **Step 7: Full verification**

Run: `npx tsc --noEmit && npx expo lint`

- [ ] **Step 8: Commit**

```bash
git add app.json widgets/
git commit -m "feat: iOS home-screen widget rendering the spec's task tile"
```

---

## Task 5: Wire captured tasks into both widgets

**Files:**
- Modify: `app/(tabs)/_layout.tsx`
- Modify: `widgets/widget-task-handler.ts`
- Create: `hooks/lastCapturedTask.ts`

**Interfaces:**
- Consumes: `onCapture` from Task 1, `TaskWidget` from Tasks 3–4.

The freshly-added-widget case (before any task has ever been captured, or after the app was fully closed and relaunched) needs a real answer, not just Task 3/4's static placeholder string — persist the last captured label so both a live update and a fresh widget add show the same, correct thing.

- [ ] **Step 1: Persist the last captured task**

Create `hooks/lastCapturedTask.ts`:

```ts
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'sarani.lastCapturedTask.v1';

export async function saveLastCapturedTask(label: string): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, label);
  } catch (error) {
    console.warn('[sarani] failed to save last captured task', error);
  }
}

export async function loadLastCapturedTask(): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(KEY);
  } catch (error) {
    console.warn('[sarani] failed to load last captured task', error);
    return null;
  }
}
```

- [ ] **Step 2: Read it in the task handler's default render**

In `widgets/widget-task-handler.ts`, replace the hardcoded placeholder:

```ts
import { loadLastCapturedTask } from '../hooks/lastCapturedTask';

// ...
    case 'WIDGET_ADDED':
    case 'WIDGET_UPDATE':
    case 'WIDGET_RESIZED': {
      const label = (await loadLastCapturedTask()) ?? 'Hold the flame to add a task';
      props.renderWidget(React.createElement(TaskWidget, { label }));
      break;
    }
```

- [ ] **Step 3: Give onCapture a real body**

In `app/(tabs)/_layout.tsx`, replace Task 1's stub:

```tsx
import { requestWidgetUpdate } from 'react-native-android-widget';
import { saveLastCapturedTask } from '@/hooks/lastCapturedTask';
import { TaskWidget } from '@/widgets/TaskWidget';
// iOS's equivalent update call — confirm the exact name/shape against the
// README read in Task 4, Step 2, then import and call it the same way here.

const onCapture = async (label: string) => {
  await saveLastCapturedTask(label);

  requestWidgetUpdate({
    widgetName: 'Sarani',
    renderWidget: () => ({
      light: React.createElement(TaskWidget, { label, theme: 'light' }),
      dark: React.createElement(TaskWidget, { label, theme: 'dark' }),
    }),
  });

  // Same idea for iOS — call whatever expo-widgets' own update function turned
  // out to be, per Task 4's README read.
};
```

Also add the task to Today — the spec's Definition of Done requires `Done with text → task appears in Today`. This app has `useTaskList('today').addTask(label)` already; call it here too (or hoist `onCapture` to a place with access to `TaskProvider`'s context — the tab layout already sits inside `TaskProvider`, so this is available directly):

```tsx
  const { addTask: addTodayTask } = useTaskList('today');
  // inside onCapture, alongside the widget push:
  addTodayTask(label);
```

- [ ] **Step 4: In-app confirmation instead of the coda**

Per the earlier decision (demo-only coda, not shipped): after `closing` completes and `onCapture` fires, show a brief, quiet confirmation rather than nothing. Simplest version — a short-lived toast reusing the existing `StayTunedToast`-style pill pattern already in this file (the flame previously used one for its "Stay tuned" message; repurpose that same visual language for "Added to Today" instead of introducing a new component).

- [ ] **Step 5: Manual verification — full loop, both platforms**

1. Long-press the flame, type a task, submit.
2. Confirm the task appears in Today.
3. Return to the home screen (Android, then iPhone) — confirm the widget on each shows the new text.
4. Force-quit the app entirely, relaunch, don't capture anything new — confirm the widget still shows the last real task, not the placeholder (proves Step 1/2's persistence, not just the live in-session push).
5. Submit with an empty field — confirm no task is created and neither widget updates.

- [ ] **Step 6: Full verification**

Run: `npx tsc --noEmit && npx expo lint`

- [ ] **Step 7: Commit**

```bash
git add "app/(tabs)/_layout.tsx" widgets/widget-task-handler.ts hooks/lastCapturedTask.ts
git commit -m "feat: push captured tasks to Today and both home-screen widgets"
```

---

## Task 6: Confirm theming end-to-end

**Files:**
- Verify only — Tasks 3–5 already built both widgets theme-aware (`TaskWidget`'s `theme` prop, `onCapture`'s `{ light, dark }` render pair).

- [ ] **Step 1: Manual verification**

On both platforms: switch the device's system theme to dark (widgets follow the OS setting, not this app's own in-app theme toggle — there's no existing bridge between the two, and building one is out of scope here). Confirm both widgets switch to the `#1d1d1d` surface / light text variant. Capture a new task while in dark mode and confirm it still renders correctly in both themes.

- [ ] **Step 2: Commit**

Only if Step 1 surfaces a fix — otherwise this task closes with no diff, confirming Tasks 3–5 already got theming right.

---

## Self-Review

**Spec coverage:** every numbered item in the user's brief — the state machine and its exact timings (§2), ring geometry (§3), sheet layout (§4, translated to keyboard-relative values rather than copied as hardcoded pixels, with the reasoning stated), haptics and accessibility (§5), widget content model (§6), the palette table (§7) — has a task. The Definition of Done checklist (§8) is covered by Task 1 Step 8 and Task 5 Step 5's manual verification lists. The three open product questions (§9) were resolved before this plan was written (see "Decisions locked in" above) rather than left open inside it.

**Placeholder scan:** Task 4's Steps 2–4 are the one place this plan is honestly less certain than the rest — flagged explicitly as needing confirmation against the installed package's own README, with a concrete reason why (a newer, less-documented corner of a fast-moving SDK feature), rather than presenting invented API names as verified fact.

**Type consistency:** `TaskWidget({ label, theme })`'s prop shape is identical across Android (Task 3) and iOS (Task 4); `onCapture(label: string)`'s signature is identical from its Task 1 stub through Task 5's real implementation.
