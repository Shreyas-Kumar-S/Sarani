'use no memo';
import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';
import type { DailyFocusStatus } from '@/hooks/dailyFocus';
import { layoutFor, TILE } from './widgetLayout';

const THEME = {
  light: {
    surface: '#fbfaf7',
    badgeWash: 'rgba(139, 178, 140, 0.22)',
    badgeText: '#6f8f5f',
    text: '#000000',
  },
  dark: {
    surface: '#1d1d1d',
    badgeWash: 'rgba(159, 215, 188, 0.22)',
    badgeText: '#9fd7bc',
    text: '#ffffff',
  },
} as const;

function copyFor(status: DailyFocusStatus, label: string | null): string {
  switch (status) {
    case 'active':
      return label ?? '';
    case 'completed':
      return 'Your Next 1thing!';
    case 'deleted':
      return 'Your 1thing?';
    case 'unset':
    default:
      return "What's the one thing for today?";
  }
}

export function TaskWidget({
  status,
  label,
  theme = 'light',
  width,
  height,
}: {
  status: DailyFocusStatus;
  label: string | null;
  theme?: keyof typeof THEME;
  // Widget bounds in dp, as Android reports them. They drive the layout maths
  // (padding, gap, type size, line count) and nothing else — the tile itself
  // is match_parent. The native side measures its root at the bounds it reads
  // at draw time, and those can be a resize step newer than the numbers a
  // queued task was handed; a tile pinned to the older numbers gets cropped
  // by the bitmap (or leaves a transparent margin), whereas match_parent
  // always fills exactly what gets drawn. Required so no caller falls back to
  // wrap_content, which hugs the content instead of filling the cell.
  width: number;
  height: number;
}) {
  const t = THEME[theme];
  const text = copyFor(status, label);
  const layout = layoutFor(width, height, text);

  return (
    <FlexWidget
      style={{
        width: 'match_parent',
        height: 'match_parent',
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: t.surface,
        borderRadius: TILE.radius,
        paddingHorizontal: layout.paddingX,
        paddingVertical: layout.paddingY,
      }}
      accessibilityLabel={`Sarani: ${text}`}
      clickAction="OPEN_APP"
    >
      <FlexWidget
        style={{
          width: TILE.badge,
          height: TILE.badge,
          borderRadius: 12,
          backgroundColor: t.badgeWash,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <TextWidget text="S" style={{ fontSize: 14, fontWeight: 'bold', color: t.badgeText }} />
      </FlexWidget>
      <FlexWidget style={{ width: layout.gap, height: 1 }} />
      {/* width 0 + flex 1 is Android's "take exactly the leftover space" idiom
        (LinearLayout weight), and it has to live on a FlexWidget: TextWidget
        doesn't map style.flex onto the underlying layout weight, so flex on
        the text itself is silently dropped. Without a bounded width the
        TextView measures at its full single-line width and Android crops it
        at the parent's edge — it never wraps. */}
      <FlexWidget style={{ flex: 1, width: 0, flexDirection: 'row' }}>
        {/* Type is sized in dp, not sp: the size was chosen to fit these exact
          bounds, and letting the system font scale multiply it afterwards
          would undo that fit (and ellipsise copy that had room). Someone who
          needs larger type can make the widget larger; the layout follows. */}
        <TextWidget
          text={text}
          maxLines={layout.maxLines}
          truncate="END"
          allowFontScaling={false}
          style={{
            width: 'match_parent',
            fontSize: layout.fontSize,
            fontWeight: 'bold',
            color: t.text,
            lineHeight: layout.lineHeight,
          }}
        />
      </FlexWidget>
    </FlexWidget>
  );
}
