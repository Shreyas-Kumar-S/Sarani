# Hyperframes Composition Brief: Sarani

## Objective
A 24.4s polished launch film for Sarani that makes the product's behaviour
understandable first and lets "From Attention to Intention" land last.

## Output
- Composition directory: `brag-output-2026-09-26-101551/composition/`
- Rendered video: `brag-output-2026-09-26-101551/brag.mp4`
- Format: landscape — 1920x1080, 30fps
- Duration: 24.4s

## Source Material
- Project root: `Sarani/` (React Native + Expo)
- Primary files read: `constants/strings.ts`, `hooks/rollover.ts`,
  `types/task.ts`, `components/ui/TaskRow.tsx`, `hooks/TaskStore.tsx`,
  `tailwind.config.js`, `app/(tabs)/_layout.tsx` (via the previous film's notes),
  `brag-output/VIDEO-CREATION-INSTRUCTIONS.md`, `brag-output/composition/index.html`
- Reference film: `brag-output/Sarani.mp4` (30s) — analysed frame-by-frame
- Master capture: `brag-output/composition/assets/img/sarani.mp4` (73.7s, 120fps)
- Product name: Sarani
- Tagline: "From Attention to Intention" (`welcome.tagline`)
- Key UI moment to recreate: the Undone tag on unfinished Today tasks and the
  move to Tomorrow (no capture exists — recreate from `TaskRow.tsx`)
- Copy that must appear verbatim (app's own):
  - "Today. Next Day. Someday." (tab names)
  - "Today's Focus", "Tomorrow" (section titles)
  - "Undone" (`tasks.carriedOverTag`)
  - "From Attention to Intention" (close)
- Authored copy (short, reviewed): "Not everything needs your attention." /
  "Capture it. Choose when it matters." / "The next morning." /
  "Nothing moves forward on its own." / "You choose what still matters." /
  "One Thing." / "Press and hold the flame." / "Kept where you'll see it."

## Creative Direction
- Tone preset: polished
- Creative direction: quiet editorial product film (Things / Linear / Apple
  restraint)
- Interpretation: long settled holds, one camera idea per scene, match-moves
  and soft crossfades, no kinetic type.
- Angle: behaviour first, philosophy last — see brag-plan.md.
- Hook: "Not everything needs your attention." on the cool studio.
- Outro: embossed S, "Sarani", "From Attention to Intention."
- Avoid: generic SaaS language; gradients/glass beyond the existing studio
  light; kinetic type; bounce; drawing device chrome the captures don't have;
  any feature not in the app (calendar, streaks, reminders, sync, accounts).

## Visual Identity
- Background: cool studio `#F4F4F2`→`#E8E8E4`; warm `#FBFAF8`→`#F1EEE3`;
  paper `#EFE7D4`→`#E4D9BE`; app page `#FBF9F7`
- Text: ink `#3A4A44`, soft ink `rgba(58,74,68,0.68)`; UI ink `rgba(0,0,0,0.6)`
- Accent: sage `#7A9B76`, deep `#5F7A5C`
- Display font: Cormorant Garamond (brand continuity with the current film)
- UI font (recreated cards only): DM Sans 400/500
- References kept from the current film: bezel-only device shell geometry,
  cool→warm colour turn, hold-ring rebuild, real-pixel typing reveal, embossed
  paper close with the app's own S stroke

## Storyboard
Contract: `brag-plan.md`. Final timing (shifted +0.4s after scene 2 to give the
real footage room):
1. Not everything — 0.0–2.4s
2. The product — 2.4–7.8s — real capture + lists clips
3. The next morning — 7.8–13.8s — recreated Today/Tomorrow cards, Undone, move
4. One Thing — 13.8–20.4s — real hold, sheet, typed line → real widget
5. Close — 20.4–24.4s

## Audio
- Role: warm bed, sparse accents. Arc: opens low, lifts with the warm turn,
  carries the product, recedes and settles under the close.
- Music: `assets/music/sarani-bed-24.mp3` (the existing user-supplied Sarani
  bed, re-cut to 24.4s; −20.3 LUFS, −2.7 dBFS peak)
- Music cue guidance: `assets/music/cues/sarani-bed-24.music-cues.json`
  (132.5 BPM; strong cues 6.20 / 7.55 / 14.98 / 23.77s). Locks: 7.55 (zoom into
  the close-up), 14.98 (sheet opens after the hold). Beat snaps: Undone tap
  10.94, widget arrival 17.64, emboss 20.69.
- Audio-reactive: subtle — `assets/music/audio-energy.js` (per-frame mean band
  energy from `extract-audio-data.py`) breathes the warm studio light.
- SFX (low HF risk, from `sfx-analysis.md`): `interface/drop_001` task commit;
  `ui/click2` Undone tap and sheet open; `interface/drop_002` row lands in
  Tomorrow; `impact/impactSoft_medium_002` widget arrival and close.

## Hyperframes Instructions
Built with the Hyperframes domain skills (core, animation, creative, keyframes,
cli). Single paused GSAP timeline registered at `window.__timelines`. Media are
root children. `npx hyperframes check` is the gate before render.
