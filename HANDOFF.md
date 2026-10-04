# Sarani — session handoff

Scratch file for starting a fresh chat. Untracked; delete when consumed.

## Standing rules

- **No AI attribution anywhere.** No `Co-Authored-By`, no "Generated with" footers, no bot co-author on commits or PRs. Commit and open PRs as Shreyas-Kumar-S only. This has been violated by tooling defaults before — check `git log -1 --format=%B | grep -i "co-authored\|claude"` after committing.
- Leave edits uncommitted for the user to verify unless told to commit.
- Don't start Metro; the user runs it. Don't trigger EAS builds without being asked.
- Be crisp. Short, pointed answers over long essays.

## Current state

- **2026-09-15:** `feat/flame-widget-capture` was committed (`b0fd92b`, `ea15b44`) and PR #13 **merged into `main`** (`6175384`). Now on `refactor/background-motion-shapes` off `main`, **uncommitted**: `AnimatedBackground` split into `components/ui/background/Floater.tsx` (motion only) + `shapes/{Bubble,Bulb}.tsx` behind a `{size,color,opacity}` contract and a `SHAPES` registry. Same six orbs and positions. Then on the same branch: the four clear bubbles now `wander` on 1-D value noise (`background/noise.ts`) via `useFrameCallback`, seeded per launch, bounded by the same drift radius; the two bulb anchors keep `loop`; reduce-motion holds everything still. 17 new tests; `jest/reanimatedMock.cjs` gained `useFrameCallback` and `useReducedMotion`. New shapes are the deliberate follow-up. Haptics for the flame: proposed (selection tick on hold start, success on declare/complete, light on delete), not approved, not built.
- GitHub says the remote moved to `git@github.com:Shreyas-Kumar-S/Sarani.git`; pushes work via redirect, `git remote set-url` is optional.
- **Earlier state (for context):**
- **Branch:** `feat/flame-widget-capture` (base `main`), clean tree
- **HEAD:** `9bf20bc` fix: wrap the widget's text and stop the stale bitmap showing at the wrong size
- **Latest build:** FINISHED 2026-09-22 09:53 — https://expo.dev/artifacts/eas/KRixgFtG5OKtYukHXfBosXZkCF5lIDbXzcf69Bm_NnA.apk
  (preview APK; labelled `6175384` = main, but built from the uncommitted `refactor/background-motion-shapes` tree: motion/shape split + bubble wander at ~25% faster step times)
- Build before that (widget fixes only): https://expo.dev/artifacts/eas/PpQ90tO3WbTOmPwXaX5NW5cYwvIgnqxge2zYQQ3fFzc.apk
  (preview profile, internal APK, 2026-09-14 21:56; labelled `9bf20bc` but built from the uncommitted working tree with the widget resize/text-fit changes below)
- Previous build (pre-fix): https://expo.dev/artifacts/eas/ox2ajWa_I0h-DhsTjWeurPF5XuMEJPOWkFdCEX9dOVM.apk
- **Gates:** tsc clean, lint 0 errors / 5 pre-existing warnings, 129 tests passing

### Open PRs

| Repo | PR | Notes |
|---|---|---|
| `Shreyas-Kumar-S/Sarani` | #13 | Description is **stale** — written at Task 1, branch now has ~20 commits |
| `Shreyas-Kumar-S/soochi` | #1 | Clean-history mirror, description current |

`soochi` is a **separate repo**, not a branch — a history-rewritten copy with all Claude trailers stripped via `git-filter-repo --replace-message`. It shares no common ancestor with `Sarani`, so syncing means re-running the filter on a fresh clone and force-pushing, never an incremental push. Tree hashes were verified identical after each sync.

## What the feature is

The **flame** is not a quick-add. Long-pressing it declares **the One Thing for today**, and that One Thing is what the Android home-screen widget shows. It deliberately does **not** add to the Today list.

- `DailyFocus = { status: 'unset'|'active'|'completed'|'deleted', label, date }`, AsyncStorage-backed
- **No rollover** — if the stored date isn't today it resolves to `unset`
- Copy by status: active → the label; completed → "Your Next 1thing!"; deleted → "Your 1thing?"; unset → "What's the one thing for today?"
- Sheet is dual-mode: capture when nothing declared, manage (Complete/Delete) when active

## Key files

| Path | Role |
|---|---|
| `widgets/TaskWidget.tsx` | Widget UI. `width`/`height` are **required** props |
| `widgets/widget-task-handler.ts` | Headless handler (WIDGET_ADDED/UPDATE/RESIZED) |
| `app/(tabs)/_layout.tsx` | Flame state machine, capture sheet, scrim, `pushWidgetUpdate` (~line 417) |
| `hooks/dailyFocus.ts` | Data layer, `resolveForToday` date guard |
| `app.json` | Widget config: 110dp × 40dp min, 3×1 target cells |
| `patches/react-native-android-widget+0.22.1.patch` | scaleType fix (see below) |

## How the widget actually works — read before touching it

`react-native-android-widget` does **not** render native views. Every update:

1. JS renders the React tree → JSON
2. Native builds real Android Views offscreen
3. Measures, lays out, draws to an ARGB_8888 Bitmap
4. **PNG-compresses at quality 100 and writes it to disk**
5. Serves it via ContentProvider URI → `setImageViewUri` → `updateAppWidget`

**Twice per update** (light + dark tree, so Android can pick per night mode via `layout-night/`).

Two update paths, ~100× apart in cost:

- **App push** (`requestWidgetUpdate`) — direct native call, tens of ms. Used on every declare/complete/delete.
- **Android-triggered** (add / resize / `updatePeriodMillis` tick) — `onAppWidgetOptionsChanged` → WorkManager → HeadlessJS → **boots a JS context if the app is dead** → AsyncStorage/SQLite → render. Hundreds of ms to seconds. Not reachable from JS.

## Bugs fixed this session (don't re-break)

- **Widget resized itself at random** — app-side push ignored the bounds `requestWidgetUpdate` passes its callback and fell back to `match_parent`, which draws smaller than the launcher's cell. `width`/`height` are now required props so there's no fallback to regress into.
- **EAS builds failed in the bundle phase** (`Cannot read properties of undefined (reading 'match')`) — `withSentryConfig` is the bare-RN path; it wraps Metro's serializer and expects `{ code, map }`, which Expo's doesn't return. `metro.config.cjs` now uses **`getSentryExpoConfig`**, which calls `getDefaultConfig` internally and registers the debug ID through Expo's own hook. Never reproduces in dev — the dev server doesn't run that serializer. Repro locally with `npx expo export:embed --eager --platform android --dev false`.
- **Text never wrapped** — `TextWidget` with no width defaults to `WRAP_CONTENT`; a TextView with WRAP_CONTENT in a horizontal LinearLayout measures at full single-line width and gets cropped. `maxLines` was dead code. Fixed with Android's `width: 0` + `flex: 1`, which **must** sit on a wrapping `FlexWidget` — `TextWidget` silently drops `style.flex` (only `FlexWidget.convertProps` maps it to `weight`).
- **Padding/line count now derive from `height`** — `app.json` allows resize to 40dp, less than old fixed padding + one line box.
- **Resize showed wallpaper through the widget** — library layout used `scaleType="matrix"` (identity → natural size, top-left, unscaled), so during the 7-step round trip the stale bitmap sat wrong-sized with a transparent gap. Patched to `fitXY` via **patch-package** (`postinstall` script added). Identical in steady state; degrades to a brief stretch instead of a hole.

**Not verified on-device yet:** the text-wrap fix and the `fitXY` resize fix. Both are in the APK above.

### 2026-09-14 session — resize + text fit (uncommitted, needs a new APK)

Root causes found by reading the native pipeline, not guessed:

- **Two clocks.** `buildData` snapshots width/height when `onAppWidgetOptionsChanged` fires; the queued task bakes them into the tile as fixed dp; but `RNWidget.drawWidget` measures its root at the options *at draw time* — a later resize step. FrameLayout gives a fixed-size child its own size even when larger than the parent, so the bitmap crops the tile (blank dark box, square bottom corners) or leaves a transparent margin. Fix: tile is `match_parent` again (the earlier "match_parent shrinks" diagnosis was really "no size = wrap_content"; both explicit dims and match_parent produce the same bitmap because the root is measured from the same options), and `widget-task-handler.ts` re-reads bounds via `getWidgetInfo` before rendering.
- **No coalescing, no ordering.** Every resize step enqueued its own WorkManager job; they ran concurrently and whichever `drawWidgetById` landed last won. Plus expedited-quota fallback / OEM throttling held the render back for seconds, during which `fitXY` showed the stale bitmap stretched. Fix (patch-package, compiles via `gradlew :react-native-android-widget:compileDebugJavaWithJavac --offline`): `WIDGET_RESIZED` is unique work per widget id with REPLACE, and **any** widget event starts the headless task in-process when a React instance is already alive, falling back to WorkManager only when JS has to boot.
- **Text couldn't adapt.** 19sp fixed, one line at 1-row height, 70dp of fixed chrome in a 110dp-min tile → "Yo…". Fix: `widgets/widgetLayout.ts` picks type size 19→13dp, wrapping before shrinking, vertical padding yielding first, chrome tightening under 180dp. Type is now **dp not sp** (`allowFontScaling={false}`) so the fit maths is exact. Floor is 13dp; past that it ellipsises rather than going microscopic.
- **Midnight staleness** (item 3 below): done — one `AppState` listener in `(tabs)/_layout.tsx` reloads focus and pushes the widget on every foreground and on mount. `pushWidgetUpdate` moved to `widgets/pushWidgetUpdate.tsx`.

Tests: 20 new in `widgets/__tests__/` (layout maths, tree shape, handler bounds refresh, push). Gates: tsc clean, lint 0/5 pre-existing, 149 tests. **Nothing on-device yet** — build a new preview APK to check resize and the 2-cell tile.

Validated against the web afterwards: the library's own Limitations page and issue #34 confirm it crops when the reported size is smaller than the actual cell and has no fix; upstream master still has no in-process dispatch or resize coalescing and 0.23.0 (unreleased) only adds `widgetCategory`, so the patch stays necessary. Android's docs confirm the 73n−16 cell formula (110dp minWidth = never a single cell; a "1-cell" tile here is really 2 cells). AOSP Launcher3 updates the options on each cell-snap step of a drag, not per pixel and not only on release. One gap found and closed: React Native's headless-task docs require a wake lock when starting from a BroadcastReceiver; the in-process path now holds a timed partial wake lock released on task finish (RN's own `acquireWakeLockNow` is a static, never-released lock — don't use it). **Gradle gotcha:** the compile writes into the library's `android/build/` in node_modules; delete it before `npx patch-package`, or the patch swells to 1200+ lines of .class noise.

## Earlier decisions worth not relitigating

- Lock-screen widgets **abandoned** — implemented and XML verified correct, but neither OxygenOS nor OriginOS surfaces third-party keyguard widgets.
- Expo config plugins: `withDangerousMod` chains so **later-registered runs FIRST**.
- EAS uploads the **local working directory**, including uncommitted changes — not a git commit.
- `AnnouncementModal.test.tsx` is intermittently flaky in full runs, passes in isolation. Pre-existing.

## Open work

1. **Verify the two widget fixes** on-device with the APK above.
2. **Notifications** — raised, never scoped. Nothing installed (`expo-notifications` absent). README V1 lists two separate items: "Gentle reminders" (opt-in) and the **Evening wind-down ritual** (flagged signature feature). Local-only fits the "No account. No cloud." promise. Android 13+ needs `POST_NOTIFICATIONS`; keep the daily trigger inexact.
   **Open design question:** no-rollover means the evening notification is the only place the app can say "you didn't finish it" — which is the guilt mechanic the app exists to avoid. Probably should ask about *tomorrow* rather than report on today. Product call, not technical.
3. **Two real staleness bugs, both unfixed:**
   - `app/(tabs)/_layout.tsx:373` — `loadDailyFocus()` runs in a `useEffect` with empty deps. If the process survives midnight, `dailyFocus` holds yesterday's `active` label and the sheet offers to manage a One Thing that no longer exists. Contradicts the no-rollover decision.
   - Same on the widget: `updatePeriodMillis: 1800000` is the only midnight reset and is already at Android's 30-min floor, batched by Doze, throttled harder on OriginOS/OxygenOS.
   - **Proposed fix for both:** one `AppState` listener that reloads focus and pushes the widget on foreground. Few lines, no permissions.
4. **Sarani PR #13 description is stale** — rewrite or leave.
5. Plan doc `docs/superpowers/plans/2026-08-18-flame-widget-capture.md` has ~23 unchecked boxes though Tasks 6/7 largely landed.
6. Deferred (`docs/checklist.md` item 6): `expo-doctor` Hermes V1 regression + 7 packages behind.
7. **Blocked:** iOS widget (Task 5) — needs a paid Apple Developer account.
8. **Optional upstream PR** to `react-native-android-widget`: the `scaleType` fix, `widgetCategory` + `minResizeWidth/Height` support, and — biggest latency win — skipping WorkManager for `WIDGET_RESIZED` since `onAppWidgetOptionsChanged` already runs in the app's process.
