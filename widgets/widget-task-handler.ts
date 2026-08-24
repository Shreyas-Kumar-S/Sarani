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
      props.renderWidget(
        React.createElement(TaskWidget, { status: focus.status, label: focus.label })
      );
      break;
    }
    default:
      break;
  }
}
