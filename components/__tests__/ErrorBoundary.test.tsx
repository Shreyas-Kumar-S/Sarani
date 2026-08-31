import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import { Text } from 'react-native';
import * as Sentry from '@sentry/react-native';
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
    jest.mocked(Sentry.captureException).mockClear();
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

  // The boundary stops the error before Sentry's global handler ever sees it,
  // so this call is the only thing that reports a render crash.
  it('reports the caught error to Sentry with the component stack', () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <ErrorBoundary>
        <Bomb shouldThrow />
      </ErrorBoundary>
    );

    expect(Sentry.captureException).toHaveBeenCalledTimes(1);
    const [error, hint] = jest.mocked(Sentry.captureException).mock.calls[0];
    // captureException's second parameter is a broad union; the boundary only
    // ever passes the contexts-carrying shape, so it's narrowed here.
    const context = hint as { contexts?: { react?: { componentStack?: string } } };
    expect((error as Error).message).toBe('boom');
    // Asserted as "present and non-empty" rather than by content — the exact
    // stack text is React's to change between versions, and what matters here
    // is that the boundary passes it along instead of dropping it.
    expect(typeof context?.contexts?.react?.componentStack).toBe('string');
    expect(context?.contexts?.react?.componentStack).not.toHaveLength(0);
  });

  it('does not report anything when nothing throws', () => {
    render(
      <ErrorBoundary>
        <Text>{'child content'}</Text>
      </ErrorBoundary>
    );

    expect(Sentry.captureException).not.toHaveBeenCalled();
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
