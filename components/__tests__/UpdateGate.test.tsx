import React from 'react';
import { Linking, Text } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { UpdateGate } from '../UpdateGate';
import { strings } from '@/constants/strings';
import * as store from '@/hooks/AppConfigStore';

const mockState = (updateState: 'blocked' | 'nudge' | 'none') =>
  jest.spyOn(store, 'useAppConfig').mockReturnValue({
    updateState,
    config: { minSupportedVersion: '1.0.0', latestVersion: '1.0.0' },
  });

describe('UpdateGate', () => {
  beforeEach(() => AsyncStorage.clear());
  afterEach(() => jest.restoreAllMocks());

  it('renders children when no update is required', () => {
    mockState('none');
    const api = render(
      <UpdateGate>
        <Text>{'child content'}</Text>
      </UpdateGate>
    );
    expect(api.getByText('child content')).toBeTruthy();
  });

  it('shows a blocking modal and opens the store when blocked', () => {
    mockState('blocked');
    const open = jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined as never);
    const api = render(
      <UpdateGate>
        <Text>{'child content'}</Text>
      </UpdateGate>
    );
    expect(api.getByText(strings.update.blockedTitle)).toBeTruthy();
    fireEvent.press(api.getByText(strings.update.button));
    expect(open).toHaveBeenCalled();
  });

  it('shows a dismissible nudge and opens the store when pressed', async () => {
    mockState('nudge');
    const open = jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined as never);
    const api = render(
      <UpdateGate>
        <Text>{'child content'}</Text>
      </UpdateGate>
    );

    await waitFor(() => expect(api.getByText(strings.update.nudgeTitle)).toBeTruthy());
    expect(api.getByText(strings.update.nudgeBody)).toBeTruthy();

    fireEvent.press(api.getByText(strings.update.button));
    expect(open).toHaveBeenCalled();
  });

  it('hides the nudge when Later is pressed', async () => {
    mockState('nudge');
    const api = render(
      <UpdateGate>
        <Text>{'child content'}</Text>
      </UpdateGate>
    );

    await waitFor(() => expect(api.getByText(strings.update.nudgeTitle)).toBeTruthy());

    fireEvent.press(api.getByText(strings.update.later));

    await waitFor(() => expect(api.queryByText(strings.update.nudgeTitle)).toBeNull());
  });
});
