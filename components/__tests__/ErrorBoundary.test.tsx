import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { Text } from 'react-native';
import { ErrorBoundary } from '../ErrorBoundary';
import { strings } from '@/constants/strings';

function Bomb({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) {
    throw new Error('boom');
  }
  return <Text>{'safe content'}</Text>;
}

describe('ErrorBoundary', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('renders children when nothing throws', () => {
    const api = render(
      <ErrorBoundary>
        <Text>{'child content'}</Text>
      </ErrorBoundary>
    );
    expect(api.getByText('child content')).toBeTruthy();
  });

  it('shows the calm fallback when a child throws during render', () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});

    const api = render(
      <ErrorBoundary>
        <Bomb shouldThrow />
      </ErrorBoundary>
    );

    expect(api.getByText(strings.errorBoundary.title)).toBeTruthy();
    expect(api.getByLabelText(strings.errorBoundary.retry)).toBeTruthy();
  });

  it('recovers once retried against children that no longer throw', () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});

    const api = render(
      <ErrorBoundary>
        <Bomb shouldThrow />
      </ErrorBoundary>
    );
    expect(api.getByText(strings.errorBoundary.title)).toBeTruthy();

    // Simulates whatever fixed the underlying problem (a re-fetch, a route
    // change) supplying different children — the boundary keeps showing the
    // fallback until retry clears its own state, then renders what it's
    // currently holding.
    api.rerender(
      <ErrorBoundary>
        <Text>{'safe content'}</Text>
      </ErrorBoundary>
    );
    fireEvent.press(api.getByLabelText(strings.errorBoundary.retry));

    expect(api.getByText('safe content')).toBeTruthy();
    expect(api.queryByText(strings.errorBoundary.title)).toBeNull();
  });
});
