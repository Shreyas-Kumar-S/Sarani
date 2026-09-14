'use no memo';
import React from 'react';
import { FlexWidget, TextWidget } from 'react-native-android-widget';
import type { DailyFocusStatus } from '@/hooks/dailyFocus';

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

const PADDING = 18;
const BADGE = 18;
const GAP = 16;
const LINE_HEIGHT = 25;

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
  // Real widget bounds in dp, as Android reports them. Required, not
  // optional: 'match_parent' renders smaller than the launcher's actual cell
  // (the library's documented size-discrepancy limitation, which it resolves
  // by cropping), so a caller that omits the size silently draws the widget
  // at the wrong size. Every render path is handed these by the library —
  // the task handler via widgetInfo, requestWidgetUpdate via its
  // renderWidget callback — so there is no caller that legitimately lacks
  // them, and making them required keeps it that way.
  width: number;
  height: number;
}) {
  const t = THEME[theme];
  const text = copyFor(status, label);

  // Vertical padding gives way before the text does. A full line box needs
  // LINE_HEIGHT, and app.json lets the widget be resized down to 40dp, which
  // is less than PADDING * 2 + LINE_HEIGHT — so at the small end fixed padding
  // would eat the line and Android would clip the glyphs.
  const paddingY = Math.max(6, Math.min(PADDING, (height - LINE_HEIGHT) / 2));
  // Only as many lines as actually fit. maxLines beyond that doesn't wrap into
  // space that isn't there; it just hands Android a taller TextView to crop.
  const maxLines = Math.max(1, Math.floor((height - paddingY * 2) / LINE_HEIGHT));

  return (
    <FlexWidget
      style={{
        width,
        height,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: t.surface,
        borderRadius: 22,
        paddingHorizontal: PADDING,
        paddingVertical: paddingY,
      }}
      accessibilityLabel={`Sarani: ${text}`}
      clickAction="OPEN_APP"
    >
      <FlexWidget
        style={{
          width: BADGE,
          height: BADGE,
          borderRadius: 12,
          backgroundColor: t.badgeWash,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <TextWidget text="S" style={{ fontSize: 14, fontWeight: 'bold', color: t.badgeText }} />
      </FlexWidget>
      <FlexWidget style={{ width: GAP, height: 1 }} />
      {/* width 0 + flex 1 is Android's "take exactly the leftover space" idiom
        (LinearLayout weight), and it has to live on a FlexWidget: TextWidget
        doesn't map style.flex onto the underlying layout weight, so flex on
        the text itself is silently dropped. Without a bounded width the
        TextView measures at its full single-line width and Android crops it
        at the parent's edge — it never wraps, which also made maxLines below
        dead code. */}
      <FlexWidget style={{ flex: 1, width: 0, flexDirection: 'row' }}>
        <TextWidget
          text={text}
          maxLines={maxLines}
          truncate="END"
          style={{
            width: 'match_parent',
            fontSize: 19,
            fontWeight: 'bold',
            color: t.text,
            lineHeight: LINE_HEIGHT,
          }}
        />
      </FlexWidget>
    </FlexWidget>
  );
}
