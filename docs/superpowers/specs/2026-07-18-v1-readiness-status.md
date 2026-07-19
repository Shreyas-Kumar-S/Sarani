# Serein v1 — Readiness Status

**Date:** 2026-07-18
**Status:** Verified against the working tree (not a planning doc — a snapshot of what's actually built)
**Parent:** [V1 Scope](2026-07-03-v1-scope.md) · [Product Roadmap](2026-07-02-product-roadmap-design.md)

The 2026-07-03 scope doc's "Already built" section and checklist have drifted from reality (it still lists a Notes/FlashList tab, since replaced by History; react-doctor and test counts have moved). This doc re-checks each of that doc's 8 remaining-work items against the current code, file by file, rather than relying on memory. Nothing here changes what "v1" means — it's the same 8 items — just an honest read on where each one actually stands today.

## The 8 items, re-verified

| # | Item | Status | Evidence |
|---|------|--------|----------|
| 1 | Wire app icons + splash | ✅ **Done** | `app.json` has light/dark icons wired for iOS, Android (adaptive icon), web favicon, and both native + JS splash screens. Real PNGs exist in `assets/icons/` (not placeholders). |
| 2 | Sanity content layer | ⚠️ **Partial** | Force-update (blocking) + update-nudge (dismissible) + announcement modal are all live and offline-safe (`hooks/AppConfigStore.tsx`, `components/UpdateGate.tsx`, `components/AnnouncementModal.tsx`, cached fallback via `hooks/appConfigStorage.ts`). But the **"Developers section" screen itself was never built** — `types/appConfig.ts` and `lib/sanity.ts` already model `devNotes`/`pipeline`, there's just no screen rendering them yet. |
| 3 | Notifications + evening wind-down | ❌ **Not started** | No `expo-notifications` in `package.json`. This blocks the signature feature too (it's built on the same plumbing). |
| 4 | Recurring tasks | ❌ **Not started** | No repeat/schedule logic anywhere in `hooks/TaskStore.tsx` or `hooks/rollover.ts`. |
| 5 | Export / backup | ❌ **Not started** | No `expo-sharing` / `expo-file-system` / share-sheet code anywhere. |
| 6 | Privacy onboarding | ❌ **Not started** | The existing `WelcomeCurtain` is a one-time brand intro (title/tagline/description), not the "3 calm screens → no account, no cloud, yours" privacy-promise flow the scope doc calls for. No dedicated onboarding route exists in `app/`. |
| 7 | Production machinery | ⚠️ **Partial** | EAS build profiles are done (`eas.json` has dev/preview/production). Still open: store listings + screenshots, a published privacy policy, an error boundary (none exists anywhere in the tree), a real-device QA pass, and a full accessibility sweep (accessibility props exist on 7 components — checkboxes, buttons, rows — but coverage isn't exhaustive; e.g. `PrimaryButton`'s `Pressable` has no explicit `accessibilityRole`). |
| 8 | Marketing landing site | ❌ **Not started** | Separate project; nothing expected in this repo. |

## What that means, ranked by the scope doc's own "smallest risk first" build order

1. ~~Icons + splash~~ — already done, skip.
2. **Sanity content layer** — finish the loop: build the actual "from the maker" / "what's coming" screen consuming `devNotes`/`pipeline` (the fetch + fallback plumbing is the hard part and it's already done).
3. **Notifications + evening wind-down** — the biggest remaining lift; nothing exists yet, and it's the signature v1 feature.
4. **Recurring → export → onboarding** — three independent, medium-sized features, none started.
5. **Production machinery** — half done (EAS profiles ✅); still need an error boundary, a privacy policy, store assets, and an accessibility pass before this can close.
6. **Marketing site** — separate effort, not blocking the app build itself.

## Bottom line

Of the 8 checklist items: **1 fully done, 2 partially done, 5 not started.** The two partials (Sanity content layer, production machinery) are each the "easy half done, harder half open" — worth finishing those next since the foundation is already in place, before starting the three untouched features (notifications, recurring, export) and the onboarding flow.
