import React from 'react';
import type { WidgetTaskHandlerProps } from 'react-native-android-widget';
import { loadDailyFocus } from '../hooks/dailyFocus';
import { TaskWidget } from './TaskWidget';

export async function widgetTaskHandler(props: WidgetTaskHandlerProps) {
  if (props.widgetInfo.widgetName !== 'Sarani') {
    return;
  }
  switch (props.widgetAction) {
    case 'WIDGET_ADDED':
    case 'WIDGET_UPDATE':
    case 'WIDGET_RESIZED': {
      const focus = await loadDailyFocus();
      const { width, height } = props.widgetInfo;
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
