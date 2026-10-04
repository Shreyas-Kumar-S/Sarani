# Brag Plan: Sarani

This video tells people who keep a task list that **Sarani never decides for you
what deserves your next day — you do.**

## What is this app?

A calm, offline, account-free task app with three places for a task to live —
Today, Next Day, Someday — where nothing moves between them unless you move it,
and one chosen thing can live on your home screen.

## The angle

The current film (`brag-output/Sarani.mp4`, 30s) is a strong *brand* film: a
cool "attention" studio turning warm, calm serif copy lifted from the app, real
phone captures, and an embossed-paper close. Its weakness is order — it asks the
viewer to accept "From Attention to Intention" in the first five seconds and
spends 8.75s on name, meaning and promise before any task appears.

This cut keeps every strong treatment and **reverses the order**: behaviour
first, philosophy last. The tagline is withheld until the close, where the
viewer has just watched it happen — an unfinished task that did not move itself,
and one intention placed outside the app.

The differentiator is **no automatic carry-forward**, verified in
`hooks/rollover.ts`: at day change completed Today tasks go to History;
unfinished Today tasks stay in Today and wear an **Undone** tag; tapping the tag
moves the task to Next Day. Next Day and Someday are never touched. Nothing ever
moves between lists on its own.

## Hook (first 2–3 seconds)

"Not everything needs your attention." — one line, cool monochrome studio (the
existing film's "attention" world), fast-in then held. It creates the tension
the rest of the film resolves. The frame then warms — the film's one colour
turn, preserved — as the phone arrives.

## Key moments (the middle)

1. **The product, used** — real footage: "Watch the materialists" typed and
   committed; it lands *above* the already-ticked "Fix your product" (completed
   sinks below unfinished). Then real taps: Coming up / Tomorrow (a task ticked),
   Someday / This weekend (a task ticked).
2. **The next morning** — enlarged close-up of the Today card: the ticked task
   leaves for History, the three unfinished ones stay and each gains **Undone**.
   A tap on one Undone tag and *that same row* travels down into the Tomorrow
   card. This is the strongest storytelling moment.
3. **One Thing** — back on the real phone: press-and-hold the flame (the app's
   own 650ms ring), type "Buy Cake for Mom" into the real sheet, and the typed
   line travels out of the app to its place in the real home-screen widget —
   Flame → One Thing → home screen as one continuous object.

## Outro / punchline

Embossed paper close (preserved from the current film): the S mark, "Sarani",
and the app's own tagline **"From Attention to Intention."** — now earned.

## User flow worth showing

Capture a task → tick things off across Today / Next Day / Someday → next
morning, choose what an unfinished task deserves → hold the flame → the One
Thing appears on the home screen.

## Tone

- Preset: `polished`
- Creative direction: quiet editorial product film — Things / Linear / Apple
  restraint; the product has a point of view and doesn't raise its voice.
- Interpretation: 5 scenes, long settled holds, one continuous camera idea per
  scene, soft crossfades and match-moves, no kinetic type, 3–5 quiet SFX.

## Format: landscape — 1920x1080 (matches the current film and its assets)
## Duration: 24.0 seconds

## Visual identity (from the project and the current film)

- Background: app page `#FBF9F7` (sampled) / film studio `#F4F4F2` → warm
  `#FBFAF8` → paper `#EFE7D4`–`#E4D9BE`
- Accent: sage `#7A9B76` (tailwind `primary`); deep `#5F7A5C`
- Text: ink `#3A4A44`; app ink `rgba(0,0,0,0.60)` for UI rows
- Display font: Cormorant Garamond — kept deliberately. It is on the creative
  skill's overused list, but it is the current film's established type,
  standing in for the app's Georgia `font-serif`; the brief says preserve.
- UI font (close-up only): a clean grotesque close to the device's system sans,
  used only inside the recreated Today/Tomorrow cards.
- Strongest visual element: real phone captures in the bezel-only device shell;
  the embossed paper S.

## What is real and what is recreated (honesty ledger)

| Moment | Source |
|---|---|
| Typing, commit, completed-sinks, tab taps, ticks | Real screen recording `sarani.mp4` 30.5–41.8s |
| Flame hold ring | Rebuild of the app's own indicator from `_layout.tsx` constants (as in the current film) |
| One Thing sheet, typed line, home-screen widget | Real screenshots supplied 2026-09-16 |
| **Undone close-up** | **Recreated in HTML** from `TaskRow.tsx` styles and the real card (colours sampled from the capture). No capture of this state exists — it needs a day to pass. Shown enlarged, as a design close-up, not as a fake phone screenshot. A real capture should replace it when one exists. |

Copy on screen is either the app's own (`strings.ts`: tab/section titles,
"Undone", "From Attention to Intention") or a short authored line.
Sample data note: the Tomorrow list in the real footage contains "Check up on
Rohit" (a first name from the user's own demo data, also in the current film).
It is visible for under a second at 2x; the close-up omits it.

## Share copy (draft)

Introducing Sarani: a quiet task app that never decides for you where an
unfinished task goes. It waits in Today, marked Undone, until you choose whether
it still matters, and the one thing you pick lives on your home screen.
(Final in `share-copy.txt`. The first draft said Sarani "doesn't carry
yesterday into today" — inaccurate: the task does stay in Today, marked Undone.)

## Audio direction

- Role: warm bed, sparse professional accents.
- Music: the existing Sarani bed (`sarani-bed.mp3`, built from the
  user-supplied track) — brand continuity; bundled "Happy Beats" tracks read too
  corporate for this tone. Re-cut to 24s with a settle, not a fade to nothing.
- Music treatment: enters under the hook at low level, lifts slightly as the
  frame warms, holds under the product, recedes under the close and *settles*.
- Music cue guidance: detect at composition time (`analyze_music_cues.py` via
  uv, or `hyperframes beats`). Target 1–2 locks: the Undone tap (~10.4s) and the
  widget arrival (~17.2s). The current 30s build's natural swells were ~6.2 /
  ~14.9 / ~23.6s.
- Audio-reactive treatment: subtle — the warm studio's light glow breathes with
  RMS. No waveforms.
- SFX posture: sparse (4–5), motion-matched, soft. Candidates: task committed,
  Undone tag tapped, row landing in Tomorrow, sheet opening after the hold,
  widget arrival, close.
- Restraint rule: no per-keystroke sounds, no sound on every tab tap, nothing
  bright or glassy.

## Storyboard

### Scene 1 — Not everything — 0.0–2.4s (2.4s)
Cool studio, grain. Centre-left: "Not everything needs your attention." (italic
serif, large). Fast-in by 0.9s, held 1.2s settled, eases out.
Sequential/interaction: none.
Audio intent: quiet opening, bed fades in.
Transition mood: soft → the frame warms as the phone arrives.

### Scene 2 — The product — 2.4–7.4s (5.0s)
Warm studio. Device casing lands empty at the right (2.4–3.0), screen wakes into
real footage. Left panel, held for the whole scene:
- "Sarani" (sage, small italic serif wordmark)
- "Today. Next Day. Someday." (headline; the app's own tab names)
- "Capture it. Choose when it matters." (body)
Device: 3.1–5.4 capture clip (typing tail → commit → new task lands above the
ticked one); 5.4–7.4 lists clip (tap to Coming up, a tick, tap to Someday, a
tick). Gentle continuous push-in.
Sequential/interaction: yes — real typing, commit, two real tab taps, two ticks.
Audio-coupled idea: one soft cue on the commit only.
Transition mood: match-move → the phone zooms toward its list and dissolves into
the enlarged card in the same place.

### Scene 3 — The next morning — 7.4–13.4s (6.0s)
Right side (where the phone was): enlarged Today card over an enlarged Tomorrow
card. A small italic caption "The next morning." sits above the Today card.
- 8.1: the ticked "Fix your product" slides out (it went to History)
- 8.5: the three unfinished rows each gain the **Undone** tag, staggered
- Left panel: "Nothing moves forward on its own." (8.6) then
  "You choose what still matters." (10.9)
- 10.3: a tap ring blooms on the Undone tag of "Call mom"; the row lifts,
  travels down into the Tomorrow card under "Help dad with car wash", the tag
  dissolves as it lands (≈10.4–11.4)
- holds to 13.0, eases out
Sequential/interaction: yes — three tags one by one (0.12s apart, accents, not
text); one simulated tap; one continuous row move (same element, FLIP).
Audio-coupled idea: tap click at 10.3; soft landing at ~11.3.
Transition mood: soft → the phone returns.

### Scene 4 — One Thing — 13.4–20.0s (6.6s)
Real phone returns (Today). Left panel headline "One Thing."; body
"Press and hold the flame." → later swaps to "Kept where you'll see it."
- 14.1: the app's hold ring fills over 650ms around the flame
- 14.95: the real capture sheet; "Buy Cake for Mom" types in (real pixels)
- 16.7: the typed line lifts off the sheet; the screen becomes the real home
  screen; the line travels up and settles into the widget (≈16.7–17.5)
- body swaps at 17.4; hold to 19.6
Sequential/interaction: yes — long press, typing, handoff.
Audio-coupled idea: soft cue as the sheet opens; the one warm "arrival" accent
when the line lands in the widget.
Transition mood: soft → paper.

### Scene 5 — Close — 20.0–24.0s (4.0s)
Paper warms in, grain. Embossed S (the app's own splash stroke), "Sarani", then
"From Attention to Intention." Settled from ~21.6s to the end.
Audio intent: music recedes and settles; one soft impact under the emboss.

**Music mood for this video:** warm, calm, unhurried.
**Audio summary:** a quiet bed that opens under the hook, carries the product
without pushing it, lets two interactions speak, and settles under the name.

### Clarity check (before build)

1. What is Sarani? — scene 2: a task app with Today / Next Day / Someday, shown
   in use.
2. What does it do differently? — scene 3: unfinished tasks don't move
   themselves; you choose. Scene 4: one thing lives on your home screen.
3. Why want that? — scene 1 sets the tension ("not everything needs your
   attention"); scenes 3–4 resolve it; scene 5 names it.

## v2 (2026-09-26) — slower footage, desktop + mobile

- **Bubbles in the real footage slowed ≥2x.** They were fast because the screen
  recording was sped up 2.35x / 2.08x to fit. Now 1.1x (capture, recording
  34.2–35.9s) and 1.0x real time (lists, recording 36.7–41.55s): 2.1x slower.
  Scene 2 grew by 1.5s; holds after scenes 3–4 and the close were trimmed without
  dropping any line below its reading time. Total 25.0s.
- **Two outputs from one generator** (`build/make-compositions.mjs`), identical
  timing, per-device layout:
  - `brag-desktop.mp4` — 1920x1080, copy left / device or cards right.
  - `brag-mobile.mp4` — 1080x1920, copy top / device (1.19x) or cards below.
    Type for a phone in the hand: hook 104px, headlines 100–128px, body 60px,
    close tagline 60px; cards at 2.2x app scale (row text 37px); side margins
    90px; nothing essential below y≈1560.
- The flame sheet now opens on the bed's 16.32s onset (16.38s).
- The Undone tap ring is now centred on the pill (v1 sat slightly left of it).
- v1 render kept in `_previous-v1/`.
