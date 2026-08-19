# Sarani

**Move Gently Forward**

A calm, minimalist task manager built with React Native and Expo. Sarani explores how software can feel quiet, predictable, and respectful of attention — both in UX and in engineering. No account, no cloud, no streaks to break: your tasks stay on your device.

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

**Origins / About** — a quiet in-app info screen (reachable via a small info button) explaining what Sarani is and why, a walkthrough of each tab, and a teaser of what's coming next.

**Quality bar** — TypeScript throughout, ESLint + Prettier, an app-wide error boundary, and a co-located Jest test suite (24 suites, ~99 tests) covering the task store, rollover logic, persistence, date/history formatting, and the History screen's month filtering.

## Feature plan

_Adapted from the product roadmap — reflects where the app has actually landed today. The originally-scoped "Notes" journal / "Lists" tab was superseded by the History tab described above during development._

### V1 — free core, launch-ready
- **Gentle reminders** — opt-in notifications, no red badge counts, soft copy
- **Recurring tasks** — daily/weekly repeat
- **Privacy-promise onboarding** — intro screens ending in "No account. No cloud. Yours."
- **Evening wind-down ritual** (signature feature) — one soft daily notification opening a 30-second review: glance at what rolled over, add or move tomorrow's tasks, done
- Production readiness: real icons/splash, EAS build profiles, store listings, a privacy policy, a real-device + accessibility pass

### V1.5 — "Sarani Pro" (one-time unlock, no subscription)
- **Atmosphere themes** for the animated background (Rain, Forest, Dawn, Night)
- **Home-screen widgets** (iOS + Android)
- **Encrypted backup + import**
- **Alternate app icons**, **focus mode** (one task at a time)

### V2 — sync, sharing & the web app (one subscription, one backend)
Cross-device sync, a web app, and tap-to-share are treated as one project, built once. Local-first and end-to-end encrypted throughout — offline stays the default, sync is additive, and the server never sees plaintext. Households before companies; a serverless QR/deep-link snapshot share comes before live shared lists.

### Deliberately not planned
Tags, priorities, projects/sub-tasks, calendar integrations, AI features, and sign-in before it's genuinely required for sync (v2). Saying no to feature-parity with the bigger apps is the point.

## Implementation notes

Non-obvious decisions behind the code, kept here instead of as inline comments so the source stays readable at a glance. Organized by file.

### `app/_layout.tsx`
- Provider nesting order: `GestureHandlerRootView` → `KeyboardProvider` → `SafeAreaProvider` → `ErrorBoundary` → `AppConfigProvider`, wrapping the `Stack` navigator.
- On a repeat launch (`hasSeenWelcome()` true), `SplashScreen`'s `onFinish` docks the theme toggle instantly and jumps straight to the `'app'` phase, skipping the one-time welcome curtain.

### `app/(tabs)/_layout.tsx`
- The `oxlint-disable-next-line react-doctor/rn-no-non-native-navigator` on the top import is deliberate: the floating blurred tab bar and its rising entrance animation are built on the JS navigator; `native-tabs` cannot render this custom design.
- `BAR_RISE_DISTANCE` is how far below its resting spot the bar starts (its height + bottom offset, i.e. fully off-screen), and drives how far it rises once the startup reveal completes.
- `TAB_BAR_BOTTOM`/`TAB_BAR_HEIGHT`/`TAB_BAR_RADIUS` describe the floating tab bar's geometry; `StayTunedToast` also reads them so its pill lands just above the bar regardless of screen width.
- `TAB_BAR_SLOTS` lists the bar's five equally-spaced columns in display order. `'flame'` isn't a real route (it doesn't appear in `state.routes`) — it's spliced in as its own `flex-1` slot alongside the four real tabs so all five share the row equally, instead of the flame floating over whichever tab happens to land at screen-center.
- `TaskTabIcon` reflects a tab's task state: an empty square until every task in the tab is checked off, then a ticked square. Its `color` prop is typed `ColorValue`, not `string`, because RN 0.85 widened the `tabBarIcon` callback's type to admit platform colors (`OpaqueColorValue`), which `Feather` accepts too.
- `GLOW_SIZE`/`ICON_SIZE`/`GLOW_OFFSET` size the halo behind the flame icon (punched in on press, then eased back out) — a radial-gradient SVG circle, the same technique `AnimatedBackground` uses for its orbs, rather than a shadow, since colored `View` shadows don't render reliably on Android.
- `FlameTeaserButton` is a teaser for a not-yet-built feature, sitting in its own column between Upcoming and Someday. It isn't a real route — tapping it just surfaces a "stay tuned" pill rather than navigating anywhere. Its glow color/opacity differ by theme: a brighter, more saturated green reads as a genuine glow against the dark background, while the same hue at a gentler strength suits a light one (the neon version would look garish rather than glowing on a pale surface).
- `RisingTabBar` is the whole floating tab bar, hand-built (rather than the default `BottomTabBar`) specifically so a non-route column like the flame teaser can be inserted. It rises into place once per app launch, then lays out five equal-width flex columns (Today, Upcoming, Flame, Someday, History) so the teaser shares the row evenly with the real tabs. Its `progress` shared value starts already-settled (`revealed ? 1 : 0`) when mounted after the reveal (e.g. Fast Refresh), so the rise animation only ever plays on a genuine cold launch. Its background lives in its own clipped `View` layer, separate from the shadow-casting container, so the blur's rounded corners don't also clip the shadow.
- `StayTunedToast` uses a full-width wrapper with `alignItems: 'center'` rather than a fixed-width box centered via `left: 50%` + `translateX` — a hardcoded width squeezed the pill's text below its natural size, wrapping "Stay tuned" onto two lines. Sizing to content keeps it one line on any phone width.
- The atmospheric background `View` in `TabsLayout` is a persistent layer rendered once, behind the navigator, so it stays continuous across tab switches instead of remounting per screen.

### `components/screens/TaskListScreen.tsx`
- `keepInputOpenRef` is set on the commit button's `pressIn` (which fires before the input's `blur`) so the blur handler knows to keep the add-task row open for rapid entry.
- `startAddingTask` relies on the input mounting with `autoFocus` to raise the keyboard reliably. An earlier `requestAnimationFrame(focus)` approach raced the mount and frequently lost, leaving the row open with no keyboard.
- `commitEdit` saves the trimmed draft if there is one; an emptied draft cancels the edit rather than deleting the task — deletion has its own deliberate swipe gesture.
- `handleInputBlurRef`/`commitEditRef` mirror the latest `handleInputBlur`/`commitEdit` closures into refs so the `keyboardDidHide` listener effect below can subscribe exactly once (empty dependency array) instead of tearing down and re-subscribing on every render.
- The `keyboardDidHide` listener is a safety net: some keyboard-dismiss gestures (iOS swipe-down, Android back) hide the keyboard without ever blurring the focused `TextInput`, which would otherwise leave a row stuck open with no way to close it. `isFocused()` still reporting `true` at that point is exactly that case (a real blur, e.g. from the commit button, has already cleared it by then), so it forces the same close path `onBlur` would have taken — for both the add row and the edit row.
- Keyboard handling on the scroll view: `KeyboardAwareScrollView` (from `react-native-keyboard-controller`) replaces an earlier hand-rolled `scrollToEnd`/`measureLayout` + `keyboardDidShow` timing approach. The old approach leaned on `ScrollView`'s `automaticallyAdjustKeyboardInsets`, which is iOS-only — on Android, the keyboard's show animation plus the window's `adjustResize` reflow could easily outrun a fixed timeout, leaving the focused row hidden behind the keyboard on a long list. `KeyboardAwareScrollView` tracks the focused input's real position on both platforms instead.
  - It isn't NativeWind's built-in `ScrollView`, so `contentContainerClassName`'s implicit `contentContainerStyle` mapping doesn't apply — `pt-5` (20px) is written out directly as `contentContainerStyle={{ paddingTop: 20 }}`.
  - `keyboardShouldPersistTaps="handled"` and `keyboardDismissMode="interactive"` are needed because, without them, taps aimed at the commit button are swallowed by the scroll view's keyboard-dismiss responder, which defaults to `"never"`.
- Task rows are keyed on `` `${section.title}-${item.label}` ``, deliberately not index-keyed: completed tasks sink to the bottom, so an index-based key would change for every row below the one just checked, remounting them all and replaying their entrance animation. Keying on the label lets React move the existing row instead. (Two identical labels in one tab would collide, but the effect is only cosmetic — mutations are index-based, not key-based.)
- The add-row `TextInput` has no `onSubmitEditing`/`submitBehavior`: letting "Done" fall through to the default blur makes blur the single commit path, so "Done" genuinely finishes and closes the row. Rapid entry is still available through the arrow button, which deliberately keeps the row open (see `keepInputOpenRef` above).

### `components/ui/GlassCard.tsx`
- `GlassCard` is a frosted-glass surface: a real blur of whatever drifts behind it (the atmospheric bubbles) plus a semi-opaque tint so text stays fully readable. The shadow lives on the outer `View`; the inner `View` clips the blur to the corner radius. The `className` prop applies to the inner content wrapper — use it for padding (e.g. `"px-5 py-6"`).
- The tint sits over the blur: dark mode leans near-black, since the blur material itself is grey and a light tint over it would read grey; light mode stays a sheer glass tint instead.

### `components/ui/TaskRow.tsx`
- App-wide row gesture language: tap the checkbox to complete, tap the text to edit, swipe left to delete ("let it go").
- Row rhythm is deliberately tighter than it looks like it should be. At 21px/28px leading with 13px padding a row was ~54px tall, so barely 9 fit on a phone before scrolling — reported as "you can't have a list of 10." Most of that height was leading and padding rather than glyph size, so those were trimmed hardest; the text itself only dropped to 17px, which is iOS's own body size and still comfortably legible.

### `jest.setup.js`
- `react-native-reanimated` is mocked with a local stand-in (`jest/reanimatedMock.cjs`) that mirrors Reanimated's own mock semantics, because Reanimated 4's own mock entry can no longer be loaded under Jest.
- `expo-font` is mocked as already-loaded so `@expo/vector-icons` doesn't call `setState` asynchronously after render — that was producing `act()` warnings in tests.
- `@react-native-async-storage/async-storage` and `react-native-keyboard-controller` are each mocked with that library's own official Jest mock.

Promotional Video:
https://drive.google.com/file/d/1LWuj-zIE6o7-zld5EElP1Nm2RsuJ2hyZ/view?usp=sharing

Apk: https://drive.google.com/file/d/1LlhKRT_vjEacqntrge-f7h2ezij1umko/view?usp=sharing