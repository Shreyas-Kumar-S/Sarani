// Pure layout maths for the home-screen tile. Kept free of the widget
// library so it can be unit-tested and reasoned about on its own.
//
// The tile has no measurement pass of its own: the library renders the tree
// once, offscreen, into a bitmap the exact size of the widget, and anything
// that doesn't fit is simply cropped. So every dimension that depends on the
// bounds — padding, gap, type size, line box, line count — has to be decided
// here, up front, from the width and height Android reports.

export const TILE = {
  /** Horizontal and vertical padding when there is room for it. */
  padding: 18,
  /** Horizontal padding on a narrow tile. */
  paddingXMin: 12,
  /** Vertical padding floor — the text takes priority over the inset. */
  paddingYMin: 6,
  badge: 18,
  gap: 16,
  gapMin: 10,
  /** Below this width the chrome tightens so the copy gets the space. */
  narrowWidth: 180,
  fontMax: 19,
  fontMin: 13,
  lineHeightRatio: 1.3,
  radius: 22,
  /**
   * Average glyph advance as a fraction of the type size, for the bold
   * system sans. Deliberately a touch generous: over-estimating width makes
   * the tile pick a slightly smaller size, under-estimating makes it
   * ellipsise copy that would have fitted.
   */
  charWidthEm: 0.55,
} as const;

export type WidgetLayout = {
  paddingX: number;
  paddingY: number;
  gap: number;
  fontSize: number;
  lineHeight: number;
  maxLines: number;
};

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/**
 * Greedy word-wrap on the average advance, the way Android will break the
 * line. Words wider than the line break mid-word, as they do on the TextView.
 */
export function estimateLines(text: string, fontSize: number, innerWidth: number): number {
  const charWidth = fontSize * TILE.charWidthEm;
  const words = text.trim().split(/\s+/).filter(Boolean);
  let lines = 1;
  let lineWidth = 0;
  for (const word of words) {
    const wordWidth = word.length * charWidth;
    if (lineWidth === 0) {
      lineWidth = wordWidth;
    } else if (lineWidth + charWidth + wordWidth <= innerWidth) {
      lineWidth += charWidth + wordWidth;
    } else {
      lines += 1;
      lineWidth = wordWidth;
    }
    while (lineWidth > innerWidth) {
      lines += 1;
      lineWidth -= innerWidth;
    }
  }
  return lines;
}

/**
 * Picks the largest type size, from fontMax down to fontMin, at which the
 * copy fits inside the bounds once vertical padding has given way to the
 * minimum. Wrapping is preferred to shrinking: a size is accepted as soon as
 * the wrapped line count fits. If nothing fits at fontMin the tile keeps that
 * floor and relies on the TextView's end-ellipsis for the rest — tiny type is
 * worse than a trailing "…" for a glanceable surface.
 */
export function layoutFor(width: number, height: number, text: string): WidgetLayout {
  const narrow = width < TILE.narrowWidth;
  const paddingX = narrow ? TILE.paddingXMin : TILE.padding;
  const gap = narrow ? TILE.gapMin : TILE.gap;
  const innerWidth = Math.max(1, width - paddingX * 2 - TILE.badge - gap);
  const innerHeight = Math.max(1, height - TILE.paddingYMin * 2);

  let fallback: WidgetLayout | null = null;
  for (let fontSize = TILE.fontMax; fontSize >= TILE.fontMin; fontSize -= 1) {
    const lineHeight = Math.round(fontSize * TILE.lineHeightRatio);
    const linesAvailable = Math.max(1, Math.floor(innerHeight / lineHeight));
    const linesNeeded = estimateLines(text, fontSize, innerWidth);
    const linesUsed = Math.min(linesNeeded, linesAvailable);
    // Padding grows back once the text has what it needs, so a short label on
    // a roomy tile keeps the full inset rather than hugging the top edge.
    const paddingY = clamp(
      Math.floor((height - linesUsed * lineHeight) / 2),
      TILE.paddingYMin,
      TILE.padding
    );
    // maxLines is derived from the padding actually applied, not from the
    // estimate, so an under-estimate ellipsises instead of clipping a line.
    const maxLines = Math.max(1, Math.floor((height - paddingY * 2) / lineHeight));
    const layout = { paddingX, paddingY, gap, fontSize, lineHeight, maxLines };
    if (linesNeeded <= linesAvailable) {
      return layout;
    }
    fallback = layout;
  }
  return fallback as WidgetLayout;
}
