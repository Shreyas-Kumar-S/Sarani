# Serein Product Roadmap — v1 through v2

**Date:** 2026-07-02
**Status:** Approved direction (brainstorm with founder)

## Positioning

> **"The todo app that doesn't guilt you."**
> No account. No red badges. No streaks to break. Your tasks never leave your phone.

**Target user:** privacy-conscious, gentle-productivity seekers — people burned out
by hustle apps, including the ADHD/overwhelm audience. Later: small shared groups
(households first, teams after).

**Revenue model:** free core forever + one-time "Serein Pro" unlock ($6–8).
The only future subscription is the sharing/sync tier (v2). No ads, ever.

**Launch horizon:** v1 in app stores in ~1–2 months.

## V1 — free core (ship in 1–2 months)

Table stakes (each missing one costs stars in reviews):

1. **Gentle reminders** — expo-notifications; opt-in, no red badge counts,
   soft copy. A todo app that never reminds gets uninstalled.
2. **Task editing + moving** — edit task text; move tasks between
   Today / Upcoming / Someday.
3. **Recurring tasks** — daily/weekly repeat. Biggest retention lever in the
   category.
4. **Export / backup** — plain JSON or text export. The privacy audience checks
   for exit rights before trusting an app. Free tier includes this.
5. **Privacy-promise onboarding** — three calm intro screens ending with
   "No account. No cloud. Yours."

**Signature feature: Evening wind-down ritual.**
At a user-chosen hour, one soft notification: *"Want to set tomorrow down
gently?"* Opens a 30-second review flow: glance at what rolled over, add or
move tomorrow's tasks, done. Builds a daily ritual (retention) without
streak-shame. Depends on the notifications plumbing above — shared work.

Supporting details already in place: `rollover.ts` (unfinished tasks flow
forward), AsyncStorage persistence, per-tab TaskStore, haptics.

## V1.5 — "Serein Pro" one-time unlock (month 2–3)

Craft + privacy features; none gate core usefulness:

- **Atmosphere themes** — `AtmosphericBackground` palettes: Rain, Forest,
  Dawn, Night. Low build cost, premium feel.
- **Home-screen widgets** (iOS + Android) — most-requested paid feature in
  minimalist todo apps; daily retention hook.
- **Encrypted backup + import** — the privacy power feature.
- **Multiple named lists** — the Lists tab grows into real lists.
- **Alternate app icons; focus mode** (one task at a time) — bundle padding.

Requires: store IAP integration (RevenueCat or expo-iap) and dev accounts.

## V2 — sharing & the subscription (month 4–6+)

Sequenced **households before companies** — "shared grocery list with your
partner" fits the calm brand and sells more easily than corporate teams.

Two candidate architectures, to be brainstormed separately when v1.5 ships:

- **Tap-to-share (serverless):** share a task/list via QR code or E2E link.
  No infra cost; keeps the privacy story pure; limited to snapshot sharing.
- **Serein Sync (E2E-encrypted server):** live shared lists + own-device sync.
  Real subscription revenue; real running costs and complexity.

Nothing in v1/v1.5 blocks either path.

## Non-goals (deliberate)

Tags, priorities, projects/sub-tasks, calendar integrations, AI features,
web app. Each drags Serein toward Todoist feature-parity, where it loses.
Saying no is the product.

## Success criteria

- v1 live on both stores within ~2 months with the five table-stakes features
  plus evening wind-down.
- First 50 organic reviews mention "calm," "simple," or "no account."
- Pro unlock converting by v1.5; sharing tier decision made with real user
  feedback, not guesses.
