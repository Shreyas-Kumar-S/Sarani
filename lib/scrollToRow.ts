// Clamped scroll target for bringing a specific row into view inside a
// ScrollView. `measuredY` is the row's position relative to the ScrollView's
// *content* — what `View.measureLayout(scrollViewNode, ...)` returns, which
// (unlike `.measure()`) is independent of the ScrollView's current scroll
// offset, so this is a direct, scroll-position-agnostic target rather than a
// delta to add to the current offset.
export function scrollTargetForRow(measuredY: number, topMargin = 24): number {
  return Math.max(0, measuredY - topMargin);
}
