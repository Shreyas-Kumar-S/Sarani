import * as Sentry from '@sentry/react-native';
import React from 'react';
import { Text, View } from 'react-native';
import PrimaryButton from '@/components/ui/PrimaryButton';
import { strings } from '@/constants/strings';

// Kept separate from the class below so it can use hooks/nativewind's dark:
// variant normally — React error boundaries themselves must be class
// components (there's no hook equivalent for componentDidCatch), but nothing
// stops that class from rendering an ordinary functional component for the
// fallback UI itself.
function ErrorFallback({ onRetry }: { onRetry: () => void }) {
  return (
    <View className="flex-1 items-center justify-center bg-surface-page dark:bg-surface-dark-page px-8">
      <Text className="mb-2 text-center font-serif text-2xl text-ink-primary dark:text-ink-dark-primary">
        {strings.errorBoundary.title}
      </Text>
      <Text className="mb-2 max-w-sm text-center text-base leading-6 text-ink-secondary dark:text-ink-dark-secondary">
        {strings.errorBoundary.body}
      </Text>
      <PrimaryButton label={strings.errorBoundary.retry} onPress={onRetry} />
    </View>
  );
}

type ErrorBoundaryProps = { children: React.ReactNode };
type ErrorBoundaryState = { hasError: boolean };

// Catches render-time errors anywhere below it in the tree and shows a calm
// fallback instead of the blank white screen React otherwise leaves on an
// uncaught error. Does not catch errors in event handlers or async code —
// that's a React limitation, not an oversight here; those are handled at
// their own call sites (see the try/catch + console.warn pattern already
// used throughout hooks/ and lib/).
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown, info: { componentStack?: string }) {
    console.error('[sarani] uncaught render error', error, info.componentStack);
    // Caught errors never reach Sentry's own global handler — the boundary
    // stops them by design — so this is the only place a render crash gets
    // reported. The component stack goes along as context because the
    // fallback UI deliberately tells the user nothing about what broke.
    Sentry.captureException(error, {
      contexts: { react: { componentStack: info.componentStack } },
    });
  }

  reset = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return <ErrorFallback onRetry={this.reset} />;
    }

    return this.props.children;
  }
}
