# Serein Product Roadmap — v1 through v2

**Date:** 2026-07-02 (revised 2026-07-03)
**Status:** Approved direction (brainstorm with founder)

## Positioning

> **"The todo app that doesn't guilt you."**
> No account. No red badges. No streaks to break. Your tasks never leave your phone.

**Target user:** privacy-conscious, gentle-productivity seekers — people burned out
by hustle apps, including the ADHD/overwhelm audience. Later: small shared groups
(households first, teams after).

**Revenue model:** free core forever + one-time "Serein Pro" unlock ($6–8).
The only future subscription is the sharing/sync tier (v2). No ads, ever.

**Launch horizon:** lean mobile v1 in app stores in ~1 month
(founder decision 2026-07-03: ship lean, learn from real reviews, defer
auth/widgets/sharing).

**Brand marks:** the sage "S" is the app icon (light/dark ready). The green
**flame** is the **Pro mark** — the visual cue anywhere a Pro feature is
gated, and the alternate Pro app icon.

## V1 — free core (ship in ~1 month)

Table stakes (each missing one costs stars in reviews):

1. **Gentle reminders** — expo-notifications; opt-in, no red badge counts,
   soft copy. A todo app that never reminds gets uninstalled. ("Scheduling",
   per founder, means reminders + recurring — not calendar integration.)
2. **Task editing + moving** — edit task text; move tasks between
   Today / Upcoming / Someday. *(Built. Note: swipe-to-move was cut for v1;
   left-swipe delete + tap-to-edit only. Rollover promote stays.)*
3. **Recurring tasks** — daily/weekly repeat. Biggest retention lever in the
   category.
4. **Export / backup** — plain JSON or text export. The privacy audience checks
   for exit rights before trusting an app. Free tier includes this.
5. **Privacy-promise onboarding** — three calm intro screens ending with
   "No account. No cloud. Yours."
6. **Developers section** — a quiet "from the maker" note + a "what's coming"
   list. Content sourced from Sanity (see Infrastructure), with baked-in
   fallback so it works offline / on first launch. Adds soul and a reason to
   reopen; shares the same fetch as force-update.

**Signature feature: Evening wind-down ritual.**
At a user-chosen hour, one soft notification: *"Want to set tomorrow down
gently?"* Opens a 30-second review flow: glance at what rolled over, add or
move tomorrow's tasks, done. Builds a daily ritual (retention) without
streak-shame. Depends on the notifications plumbing above — shared work.

Supporting details already in place: `rollover.ts` (unfinished tasks flow
forward), AsyncStorage persistence, per-tab TaskStore, haptics, Notes journal
(day-grouped, FlashList), 100/100 react-doctor health.

**Production machinery (not a feature, but launch-blocking):** wire the new
icons + splash, EAS build profiles, store listings + screenshots, privacy
policy (Apple requires one even offline), an error boundary, real-device pass,
accessibility sweep.

**Infrastructure & production tooling (founder decisions 2026-07-03):**

- **Sanity CMS (free tier)** — the app's read-only content/config source, NOT
  user data (todos stay local). One `appConfig` doc drives force-update, plus
  `devNotes` / `pipeline` for the Developers section and update messages.
  Fetched on launch via the cached CDN endpoint; app ships baked-in fallback
  content and degrades gracefully offline (cache last-known, never hang/block
  on a failed fetch).
- **Force-update / update-nudge / announcement modals** — pure JS: compare the
  running version (`expo-application`) against Sanity's `minSupportedVersion`
  (blocking) / `latestVersion` (dismissible nudge). No native module; works in
  Expo Go. NOT a Sentry feature — Sentry is crash-only.
- **Sentry (free Developer plan)** — crash/error reporting. Expo config plugin;
  dev continues in Expo Go, telemetry captured in EAS/production builds. Chosen
  over Firebase Crashlytics to avoid a mandatory custom dev client and Google
  dependency; Firebase Remote Config is redundant given the Sanity config.

**Around launch (small, separate from the app):** a **marketing landing site**
(`serein.app` — hero, screenshots, download links, privacy promise, public
home for the dev notes/changelog). ~1–2 days on a static stack; free hosting.
This is NOT the app-in-a-browser — that waits for sync (see V2).

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

## V2 — sync, sharing & the web app: one subscription, one backend

**Founder decision (2026-07-03): sync, the web app, and tap-to-share are the
SAME project.** "Sync my own devices," "use Serein on the web," and "share a
list with my partner" all ride the same accounts + backend + sync engine. Build
it ONCE. This is the moment accounts finally earn their place and the only
recurring subscription in the product.

**Architecture stance — local-first, not server-owns-your-data.** To keep the
"your data, on your device" thesis true even with sync on:

- Offline stays the *default*; sync is additive, never a rewrite.
- **End-to-end encrypted** — the relay/server never sees plaintext.
- Candidate stacks: local-first sync engines (PowerSync, ElectricSQL, or a CRDT
  layer like Legend-State / Automerge / Yjs + a dumb relay); Supabase as the
  pragmatic managed middle. Avoid Firebase (Google-owned undercuts the privacy
  brand).

**Sequencing within v2:** own-device sync + web app first (people like to dial
in and focus at a desk), then sharing — **households before companies**
("shared grocery list with your partner" sells more easily than corporate
teams). Tap-to-share opens with the serverless **QR / deep-link snapshot**
(no infra, privacy-pure, one-time copy), graduating to live shared lists on the
E2E backend. **Bluetooth/BLE P2P: skipped** — a novelty the QR/link path does
better without pairing pain.

Nothing in v1/v1.5 blocks this path; the web build is already possible via
`react-native-web` — it's the shared *data* that waits for this backend.

## Non-goals (deliberate)

Tags, priorities, projects/sub-tasks, calendar integrations, AI features. Each
drags Serein toward Todoist feature-parity, where it loses. Saying no is the
product. *(A web app is no longer a non-goal — it is deferred to V2, gated on
sync, not rejected.)*

## Success criteria

- Lean mobile v1 live on both stores within ~1 month with the table-stakes
  features plus evening wind-down and the developers section.
- First 50 organic reviews mention "calm," "simple," or "no account."
- Pro unlock converting by v1.5; the sync/sharing subscription (v2) is designed
  only after real users ask for it — not built on speculation.

## Deferred, deliberately (so they stop nagging)

- **Google / any sign-in** — contradicts "no account" until sync/sharing (v2),
  and even then account creation should be optional and privacy-preserving,
  not Google-first.
- **Widgets (iOS/Android)** — v1.5 Pro; first native-code investment (leaves
  Expo Go for a custom dev client).
- **Sync + web app + tap-to-share** — v2, one merged project (see above).
