import { useColorScheme } from 'nativewind';
import React, { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import Animated, {
  runOnJS,
  useAnimatedReaction,
  useAnimatedRef,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import HistoryMonthChip from './HistoryMonthChip';
import { HistoryMonth } from '@/types/history';

// Matches tailwind.config.js `ink.tertiary` / `ink-dark.tertiary` — inlined
// because the chip's color fade is a reanimated worklet, which can't read
// nativewind's dark: classes itself.
const INACTIVE_TEXT_LIGHT = 'rgba(0,0,0,0.40)';
const INACTIVE_TEXT_DARK = 'rgba(255,255,255,0.50)';
// Matches tailwind.config.js `primary.DEFAULT`.
const ACTIVE_BG = '#7A9B76';

// Fixed slot width per month chip — lets scroll offset map directly to an
// index (offset / ITEM_WIDTH) instead of measuring each chip's rendered size.
const ITEM_WIDTH = 64;
const PILL_WIDTH = 52;
const PILL_HEIGHT = 32;
// How long the strip must sit still before we treat the centered month as
// settled. Driven off the scroll offset directly (rather than
// onMomentumScrollEnd / onScrollEndDrag) since those fire inconsistently
// across web and native.
const SETTLE_DELAY_MS = 150;

// Maps a horizontal scroll offset to the index of the chip nearest the
// viewport centre, clamped to the valid range. Exported for unit testing —
// this rounding/clamping is what decides which month a scroll settles on.
export function nearestIndex(offsetX: number, count: number) {
  return Math.max(0, Math.min(Math.round(offsetX / ITEM_WIDTH), count - 1));
}

// Slot width per chip; scroll offset maps to an index as offset / ITEM_WIDTH.
export const MONTH_ITEM_WIDTH = ITEM_WIDTH;

type HistoryMonthSelectorProps = {
  months: HistoryMonth[];
  activeMonthKey: string;
  onSelect: (key: string) => void;
  // Width of the visible strip — passed down (rather than measured via
  // onLayout, which doesn't reliably fire for a plain View on web) so the
  // liquid pill can be positioned correctly from the very first render.
  containerWidth: number;
};

// A horizontally-scrolling, snapping month strip with a single "liquid" pill
// highlight: rather than each chip owning its own background, one shared
// pill stretches from wherever it last settled toward whatever's currently
// centered, then springs ("pops") into a normal single-chip pill once the
// drag catches up to a new month. Tapping a chip animates the scroll there,
// so it flows through the exact same stretch/pop behavior as a drag.
export default function HistoryMonthSelector({
  months,
  activeMonthKey,
  onSelect,
  containerWidth,
}: HistoryMonthSelectorProps) {
  const scrollRef = useAnimatedRef<Animated.ScrollView>();
  const settleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrollX = useSharedValue(0);
  // Where the pill is currently anchored — springs to the nearest chip
  // whenever the drag crosses into it (see the useAnimatedReaction below).
  const anchorX = useSharedValue(0);
  // Deliberately not derived inline from activeMonthKey each render: this
  // needs to update per-frame during a drag (see handleScroll below), well
  // before the 150ms settle debounce ever touches activeMonthKey — deriving
  // it from the prop would tie the highlight to that debounce and break the
  // live "following the drag" motion the pill/text fade depend on.
  const [centeredKey, setCenteredKey] = useState(activeMonthKey);
  const sidePadding = containerWidth > ITEM_WIDTH ? (containerWidth - ITEM_WIDTH) / 2 : 0;
  const { colorScheme } = useColorScheme();
  const inactiveTextColor = colorScheme === 'dark' ? INACTIVE_TEXT_DARK : INACTIVE_TEXT_LIGHT;

  // No effect syncing centeredKey from activeMonthKey: activeMonthKey only
  // ever changes via this component's own onSelect call below, which fires
  // exactly when centeredKey has already settled to that same value — a
  // sync effect here would just be echoing state that's already current.

  // Centers the scroller on the active month once we know how wide the
  // viewport is — only relevant on mount/resize since scrolling itself is
  // the only way the active month changes afterward.
  useEffect(() => {
    if (containerWidth <= 0) {
      return;
    }
    const activeIndex = Math.max(
      0,
      months.findIndex((m) => m.key === activeMonthKey)
    );
    const x = activeIndex * ITEM_WIDTH;
    scrollX.value = x;
    anchorX.value = x;
    scrollRef.current?.scrollTo({ x, animated: false });
    // Re-center only when the viewport size changes, not on every activeMonthKey
    // change — those originate from this same scroller and are already centered.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [containerWidth]);

  useEffect(() => {
    return () => {
      if (settleTimer.current) {
        clearTimeout(settleTimer.current);
      }
    };
  }, []);

  // Every time the drag crosses into a new nearest chip, spring the pill's
  // anchor to it — the "pop" once the stretch has carried it far enough.
  // Runs entirely on the UI thread so it reacts instantly during a fast
  // drag, with no JS-thread round trip.
  useAnimatedReaction(
    () => Math.round(scrollX.value / ITEM_WIDTH) * ITEM_WIDTH,
    (current, previous) => {
      if (previous !== null && current !== previous) {
        anchorX.value = withSpring(current, { damping: 16, stiffness: 180, mass: 0.6 });
      }
    }
  );

  const handleScrollUpdate = (offsetX: number) => {
    const month = months[nearestIndex(offsetX, months.length)];
    if (month) {
      setCenteredKey((prev) => (prev === month.key ? prev : month.key));
    }

    if (settleTimer.current) {
      clearTimeout(settleTimer.current);
    }
    settleTimer.current = setTimeout(() => {
      const settledMonth = months[nearestIndex(offsetX, months.length)];
      if (settledMonth && settledMonth.key !== activeMonthKey) {
        onSelect(settledMonth.key);
      }
    }, SETTLE_DELAY_MS);
  };

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x;
      runOnJS(handleScrollUpdate)(event.contentOffset.x);
    },
  });

  // Stretches to span from wherever the pill last settled (anchorX) to
  // whatever's currently centered in the viewport (scrollX), then contracts
  // back to a single chip's width once anchorX catches up to it.
  const pillStyle = useAnimatedStyle(() => {
    const half = PILL_WIDTH / 2;
    const live = scrollX.value;
    const anchor = anchorX.value;
    const leftContent = Math.min(anchor, live) - half;
    const rightContent = Math.max(anchor, live) + half;
    const viewportCenter = containerWidth / 2;
    const left = leftContent - live + viewportCenter;
    const right = rightContent - live + viewportCenter;
    return { left, width: right - left };
  });

  return (
    // marginTop (not padding) for the gap above — margin sits outside the
    // box, so it can't get double-counted against the explicit height below,
    // and an absolutely-positioned child's top: 0 lines up exactly with this
    // box's own top edge with no ambiguity either way.
    <View style={{ position: 'relative', height: PILL_HEIGHT, marginTop: 16 }}>
      <Animated.View
        pointerEvents="none"
        style={[
          {
            position: 'absolute',
            top: 0,
            height: PILL_HEIGHT,
            borderRadius: PILL_HEIGHT / 2,
            backgroundColor: ACTIVE_BG,
          },
          pillStyle,
        ]}
      />
      <Animated.ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={ITEM_WIDTH}
        decelerationRate="fast"
        scrollEventThrottle={16}
        onScroll={scrollHandler}
        style={{ height: PILL_HEIGHT }}
        contentContainerStyle={{ paddingHorizontal: sidePadding }}
      >
        {/* Fixed 12-item carousel, not a virtualization candidate — FlashList/
            FlatList would complicate the exact offset-to-index math (index *
            ITEM_WIDTH) and per-frame worklet styling this scroller depends on,
            for a dataset that never grows. */}
        {months.map((month, index) => (
          <HistoryMonthChip
            key={month.key}
            label={month.shortLabel}
            index={index}
            itemWidth={ITEM_WIDTH}
            scrollX={scrollX}
            anchorX={anchorX}
            active={month.key === centeredKey}
            inactiveTextColor={inactiveTextColor}
            // Tapping animates the strip to that month; the resulting scroll
            // events flow through the same onScroll/settle path as a drag,
            // so there's only one place that ever commits the active month.
            onPress={() => scrollRef.current?.scrollTo({ x: index * ITEM_WIDTH, animated: true })}
          />
        ))}
      </Animated.ScrollView>
    </View>
  );
}
