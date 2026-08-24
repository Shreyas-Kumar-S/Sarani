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
}: {
  status: DailyFocusStatus;
  label: string | null;
  theme?: keyof typeof THEME;
}) {
  const t = THEME[theme];
  const text = copyFor(status, label);
  return (
    <FlexWidget
      style={{
        width: 'match_parent',
        height: 'match_parent',
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: t.surface,
        borderRadius: 22,
        padding: 18,
      }}
      accessibilityLabel={`Sarani: ${text}`}
      clickAction="OPEN_APP"
    >
      <FlexWidget
        style={{
          width: 18,
          height: 18,
          borderRadius: 12,
          backgroundColor: t.badgeWash,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <TextWidget text="S" style={{ fontSize: 14, fontWeight: 'bold', color: t.badgeText }} />
      </FlexWidget>
      <FlexWidget style={{ width: 16, height: 1 }} />
      <TextWidget
        text={text}
        maxLines={2}
        style={{ fontSize: 19, fontWeight: 'bold', color: t.text, lineHeight: 25 }}
      />
    </FlexWidget>
  );
}
