import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AboutScreen from '../AboutScreen';
import { strings } from '@/constants/strings';
import { DEFAULT_APP_CONFIG } from '@/types/appConfig';
import * as appConfigStore from '@/hooks/AppConfigStore';

const mockBack = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ back: mockBack, push: jest.fn() }),
}));

jest.spyOn(appConfigStore, 'useAppConfig').mockReturnValue({
  config: DEFAULT_APP_CONFIG,
  updateState: 'none',
});

const safeAreaMetrics = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 0, left: 0, right: 0, bottom: 0 },
};

const renderScreen = () =>
  render(
    <SafeAreaProvider initialMetrics={safeAreaMetrics}>
      <AboutScreen />
    </SafeAreaProvider>
  );

describe('AboutScreen', () => {
  beforeEach(() => {
    mockBack.mockClear();
  });

  it('shows the Today section detail by default', () => {
    const api = renderScreen();
    expect(api.getByText(strings.about.sections.today.description)).toBeTruthy();
  });

  it('switches the detail card when a different section is tapped', () => {
    const api = renderScreen();

    fireEvent.press(api.getByText(strings.about.sections.history.label));

    expect(api.getByText(strings.about.sections.history.description)).toBeTruthy();
    expect(api.queryByText(strings.about.sections.today.description)).toBeNull();
  });

  it('lists every upcoming feature from the app config', () => {
    const api = renderScreen();
    DEFAULT_APP_CONFIG.upcomingFeatures?.forEach((feature) => {
      expect(api.getByText(feature.title)).toBeTruthy();
    });
  });

  it('closes via the router when the close button is pressed', () => {
    const api = renderScreen();
    fireEvent.press(api.getByLabelText(strings.a11y.closeAbout));
    expect(mockBack).toHaveBeenCalled();
  });
});
