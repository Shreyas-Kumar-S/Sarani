import React from 'react';
import {
  getWidgetInfo,
  type WidgetInfo,
  type WidgetTaskHandlerProps,
} from 'react-native-android-widget';
import { loadDailyFocus } from '../hooks/dailyFocus';
import { TaskWidget } from './TaskWidget';

// The width/height on widgetInfo were read when Android queued this task —
// and a resize drag queues one per step, each of which then waits on
// WorkManager (or on JS booting). By the time the task runs, the launcher
// can be several steps further on, and the native side will draw the bitmap
// at *those* bounds. Re-reading them here keeps the layout maths in step
// with the bitmap. The queued numbers stay as the fallback.
async function currentBounds(queued: WidgetInfo): Promise<Pick<WidgetInfo, 'width' | 'height'>> {
  try {
    const fresh = (await getWidgetInfo(queued.widgetName)).find(
      (w) => w.widgetId === queued.widgetId
    );
    if (fresh && fresh.width > 0 && fresh.height > 0) {
      return { width: fresh.width, height: fresh.height };
    }
  } catch (error) {
    console.warn('[sarani] widget bounds lookup failed, using queued bounds', error);
  }
  return { width: queued.width, height: queued.height };
}

export async function widgetTaskHandler(props: WidgetTaskHandlerProps) {
  if (props.widgetInfo.widgetName !== 'Sarani') {
    return;
  }
  switch (props.widgetAction) {
    case 'WIDGET_ADDED':
    case 'WIDGET_UPDATE':
    case 'WIDGET_RESIZED': {
      const [focus, { width, height }] = await Promise.all([
        loadDailyFocus(),
        currentBounds(props.widgetInfo),
      ]);
      // This handler runs headless — there's no app state here to read a
      // theme from, so rendering one tree meant always falling back to the
      // light default. Handing Android both variants lets it pick per its own
      // night mode, which is also what makes the widget follow a system theme
      // change on its own rather than only when the app pushes.
      const common = { status: focus.status, label: focus.label, width, height };
      props.renderWidget({
        light: React.createElement(TaskWidget, { ...common, theme: 'light' }),
        dark: React.createElement(TaskWidget, { ...common, theme: 'dark' }),
      });
      break;
    }
    default:
      break;
  }
}
