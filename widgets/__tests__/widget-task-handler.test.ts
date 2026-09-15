import { getWidgetInfo } from 'react-native-android-widget';
import { loadDailyFocus } from '../../hooks/dailyFocus';
import { widgetTaskHandler } from '../widget-task-handler';

jest.mock('react-native-android-widget', () => ({
  getWidgetInfo: jest.fn(),
  FlexWidget: () => null,
  TextWidget: () => null,
}));

jest.mock('../../hooks/dailyFocus', () => ({
  loadDailyFocus: jest.fn(),
}));

const mockedInfo = getWidgetInfo as jest.MockedFunction<typeof getWidgetInfo>;
const mockedLoad = loadDailyFocus as jest.MockedFunction<typeof loadDailyFocus>;

const screenInfo = { screenHeightDp: 800, screenWidthDp: 360, density: 3, densityDpi: 480 };

function call(action: 'WIDGET_ADDED' | 'WIDGET_UPDATE' | 'WIDGET_RESIZED') {
  const renderWidget = jest.fn();
  const promise = widgetTaskHandler({
    widgetInfo: { widgetName: 'Sarani', widgetId: 7, width: 300, height: 100, screenInfo },
    widgetAction: action,
    renderWidget,
  });
  return { renderWidget, promise };
}

beforeEach(() => {
  jest.clearAllMocks();
  mockedLoad.mockResolvedValue({ status: 'active', label: 'Retrt', date: '2026-09-14' });
});

describe('widgetTaskHandler', () => {
  it('renders with the bounds Android reports now, not the ones from when the task was queued', async () => {
    mockedInfo.mockResolvedValue([
      { widgetName: 'Sarani', widgetId: 7, width: 200, height: 40, screenInfo },
    ]);
    const { renderWidget, promise } = call('WIDGET_RESIZED');
    await promise;
    expect(renderWidget).toHaveBeenCalledTimes(1);
    const { light, dark } = renderWidget.mock.calls[0][0];
    expect(light.props).toMatchObject({ width: 200, height: 40, theme: 'light', label: 'Retrt' });
    expect(dark.props).toMatchObject({ width: 200, height: 40, theme: 'dark' });
  });

  it('falls back to the queued bounds when the fresh lookup has nothing for this id', async () => {
    mockedInfo.mockResolvedValue([
      { widgetName: 'Sarani', widgetId: 99, width: 1, height: 1, screenInfo },
    ]);
    const { renderWidget, promise } = call('WIDGET_UPDATE');
    await promise;
    expect(renderWidget.mock.calls[0][0].light.props).toMatchObject({ width: 300, height: 100 });
  });

  it('falls back to the queued bounds when the fresh lookup fails', async () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    mockedInfo.mockRejectedValue(new Error('no module'));
    const { renderWidget, promise } = call('WIDGET_ADDED');
    await promise;
    expect(renderWidget.mock.calls[0][0].light.props).toMatchObject({ width: 300, height: 100 });
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it('ignores widgets that are not Sarani', async () => {
    const renderWidget = jest.fn();
    await widgetTaskHandler({
      widgetInfo: { widgetName: 'Other', widgetId: 1, width: 1, height: 1, screenInfo },
      widgetAction: 'WIDGET_UPDATE',
      renderWidget,
    });
    expect(renderWidget).not.toHaveBeenCalled();
    expect(mockedLoad).not.toHaveBeenCalled();
  });
});
