import React from 'react';
import { requestWidgetUpdate } from 'react-native-android-widget';
import type { DailyFocus } from '@/hooks/dailyFocus';
import { TaskWidget } from './TaskWidget';

// Pushes the given state to every placed home-screen widget immediately.
// Without this the widget only refreshes on its updatePeriodMillis tick (30
// min, and Android batches those) or when added/resized — which reads as
// random, laggy updates rather than the instant reflection the flame implies.
// updatePeriodMillis stays as the backstop that clears the widget at midnight
// without the app being opened.
//
// Both variants are rendered and handed to Android, which picks one per its
// own night mode. Sending a single tree resolved from the app's `isDark`
// looked right until the widget refreshed itself in the background — that
// path has no app state to read, so it fell back to light and a dark-mode
// home screen got a cream tile. The pair also means the widget re-themes on a
// system theme change without waiting for the app to push again.
//
// This is a direct native call — tens of milliseconds — as opposed to the
// Android-triggered path (add / resize / periodic tick), which goes through
// WorkManager and a headless JS task.
export function pushWidgetUpdate(focus: DailyFocus) {
  requestWidgetUpdate({
    widgetName: 'Sarani',
    // renderWidget is called once per placed widget and handed that widget's
    // real bounds, so the size comes from Android here exactly as it does in
    // the headless task handler.
    renderWidget: ({ width, height }) => ({
      light: (
        <TaskWidget
          status={focus.status}
          label={focus.label}
          theme="light"
          width={width}
          height={height}
        />
      ),
      dark: (
        <TaskWidget
          status={focus.status}
          label={focus.label}
          theme="dark"
          width={width}
          height={height}
        />
      ),
    }),
    widgetNotFound: () => {
      // No widget on the home screen yet — nothing to update, not an error.
    },
  });
}
