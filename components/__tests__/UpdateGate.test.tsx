import React from 'react';
import { Linking, Text } from 'react-native';
import { fireEvent, render } from '@testing-library/react-native';
import { UpdateGate } from '../UpdateGate';
import { strings } from '@/constants/strings';
import * as store from '@/hooks/AppConfigStore';

const mockState = (updateState: 'blocked' | 'nudge' | 'none') =>
  jest.spyOn(store, 'useAppConfig').mockReturnValue({
    updateState,
    config: { minSupportedVersion: '1.0.0', latestVersion: '1.0.0' },
  });

describe('UpdateGate', () => {
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
});
