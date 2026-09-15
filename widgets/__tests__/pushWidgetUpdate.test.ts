import type React from 'react';
import { requestWidgetUpdate } from 'react-native-android-widget';
import { pushWidgetUpdate } from '../pushWidgetUpdate';

jest.mock('react-native-android-widget', () => ({
  requestWidgetUpdate: jest.fn(),
  FlexWidget: () => null,
  TextWidget: () => null,
}));

const mocked = requestWidgetUpdate as jest.MockedFunction<typeof requestWidgetUpdate>;

describe('pushWidgetUpdate', () => {
  it('renders both themes at the bounds the library hands back', () => {
    pushWidgetUpdate({ status: 'active', label: 'Retrt', date: '2026-09-14' });
    expect(mocked).toHaveBeenCalledTimes(1);
    const { widgetName, renderWidget } = mocked.mock.calls[0][0];
    expect(widgetName).toBe('Sarani');
    const out = renderWidget({
      widgetName: 'Sarani',
      widgetId: 3,
      width: 210,
      height: 44,
      screenInfo: { screenHeightDp: 800, screenWidthDp: 360, density: 3, densityDpi: 480 },
    }) as { light: React.JSX.Element; dark: React.JSX.Element };
    expect(out.light.props).toMatchObject({ width: 210, height: 44, theme: 'light', label: 'Retrt' });
    expect(out.dark.props).toMatchObject({ width: 210, height: 44, theme: 'dark' });
  });

  it('treats a missing widget as nothing to do', () => {
    pushWidgetUpdate({ status: 'unset', label: null, date: '2026-09-14' });
    expect(() => mocked.mock.calls[0][0].widgetNotFound?.()).not.toThrow();
  });
});
