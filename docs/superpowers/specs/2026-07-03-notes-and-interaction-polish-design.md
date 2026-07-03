# Notes Tab + Interaction Polish — Design

**Date:** 2026-07-03
**Status:** Approved direction (brainstorm with founder)
**Parent:** 2026-07-02-product-roadmap-design.md (v1 scope)

Three pieces of v1 work: making the Notes tab real, fixing the add-task
flow's missing confirmation affordance, and giving the tab bar an entrance
animation. They share a theme — the app should visibly respond to the user.

## 1. Notes tab — "a quiet daily stream"

### Identity

The fourth tab becomes **Notes** (renamed from Lists). Positioning inside
the product: *Today is for doing, Someday is for maybes, Notes is for
keeping.* Pure notes — no checklists, no titles, no folders. Notes fall
under the day they were written, reading like a soft journal.

### Kept notes

Any note can be **kept** (long-press → "Keep"). Kept notes float in a
timeless section above the day stream — where a quote lives unburied.
Everything else stays anchored to its day. Two states, one gesture.

### Data model

`types/note.ts` replaces `NoteBlock` with:

```ts
type Note = {
  id: string;
  text: string;
  createdAt: number; // epoch ms; day grouping is derived from this
  kept: boolean;
};
```

No day entities — grouping is computed at render time.

### Storage & state

Mirrors the task layer exactly:

- `hooks/noteStorage.ts` — AsyncStorage persistence, same load/save
  patterns as `hooks/taskStorage.ts`.
- `NoteStore` provider following `hooks/TaskStore.tsx`'s pattern, mounted
  in `(tabs)/_layout.tsx`. Provider-level (not screen-local) because the
  evening wind-down ritual (roadmap v1 signature feature) will later write
  into today's notes.

### Screen behavior

`components/screens/NotesScreen.tsx` keeps the dark-green sanctuary look:

- **Kept** section on top, rendered only when non-empty.
- Day sections below — *Today*, *Yesterday*, then dates — newest first.
- "New note" CTA opens an inline composer (same pattern as
  TaskListScreen's inline add); tap a note to edit in place.
- Long-press a note → three actions: **Keep** (toggle), **Set it in
  motion** (convert to task), **Let it go** (delete).
- First run: empty, with one gentle empty-state line.
- `data/mock/notes.ts` retires.

### Task bridge — "Set it in motion"

Converts a note into a task in **Today or Someday** (chosen in a small
action sheet) via the existing TaskStore, then removes the note from the
stream. Haptic tick, no modal ceremony.

### Deliberately cut

Titles, search, rich text, images, folders. If a note needs a title, it's
a document, and documents are not Serein's fight.

## 2. Add-task flow — visible commit

Today the only commit paths are the keyboard Done key and a silent
`onBlur` auto-submit; nothing tells the user their text will be saved,
and the input closes after each task.

Changes to `components/screens/TaskListScreen.tsx`:

- **Commit button:** a soft circular arrow-up button in brand green at the
  right edge of the input row — dimmed while the draft is empty, alive
  once there's text. Tapping it (or keyboard Done) commits.
- **Landing feedback:** the new row animates gently into the list
  (fade/slide via Reanimated) with a light haptic tick.
- **Rapid entry:** after committing, the input stays open and focused for
  the next task. Tapping away with an empty draft closes it quietly;
  tapping away with text still saves (safety net, no longer the only path).
- **Dark-mode fix:** placeholder color gets a proper dark variant instead
  of hardcoded `rgba(0,0,0,0.28)`.

## 3. Tab bar entrance animation

On cold launch: splash fades out → ~200ms of stillness → the floating tab
bar **rises from below the screen edge** into place (~700ms, gentle
ease-out, opacity 0 → 1 riding along). Plays once per app launch — never
on tab switches or re-focus.

Implementation shape in `app/(tabs)/_layout.tsx`:

```tsx
tabBar={(props) => (
  <Animated.View style={riseAnimatedStyle}>
    <BottomTabBar {...props} />
  </Animated.View>
)}
```

`BottomTabBar` is the stock bar re-exported by
`@react-navigation/bottom-tabs`, so existing styling (blur, floating
position, notes variant) survives untouched. Reanimated drives
`translateY` from ~130px (bar height + bottom offset) to 0 with
`withDelay + withTiming`.

**Trigger:** the root `_layout.tsx` owns the splash gate and knows when
the fade completes; it passes that moment down (small context or prop)
rather than a guessed hardcoded delay.

The "rise into place" motion becomes a reusable pattern for later
surfaces (Notes composer, wind-down sheet) so the motion language stays
consistent.

## Testing

- Unit: note day-grouping, note storage round-trip, note → task
  conversion.
- Component: add note → keep → convert flow; add-task commit button
  enables/disables with draft text; task submit keeps input open.
- Animation logic (trigger-once-per-launch) verified manually; no
  snapshot of animated frames.

## Build order

1. Add-task commit UX (smallest, no new infrastructure)
2. Tab bar entrance (small, isolated to layouts)
3. Notes tab (meatiest: types, storage, store, screen, bridge)
