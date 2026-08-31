import { AnnouncementModal } from '@/components/AnnouncementModal';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import FloatingThemeToggle from '@/components/FloatingThemeToggle';
import InfoButton from '@/components/InfoButton';
import SplashScreen from '@/components/SplashScreen';
import { UpdateGate } from '@/components/UpdateGate';
import WelcomeCurtain, { PRIVACY_ENTER_AT } from '@/components/WelcomeCurtain';
import { AppConfigProvider } from '@/hooks/AppConfigStore';
import { AppRevealProvider } from '@/hooks/AppReveal';
import { CaptureOverlayProvider, useCaptureOverlay } from '@/hooks/CaptureOverlay';
import { hasSeenWelcome, markWelcomeSeen } from '@/hooks/welcomeSeen';
import { SANITY_DATASET, SENTRY_DSN } from '@/constants/appConfig';
import * as Sentry from '@sentry/react-native';
import { isRunningInExpoGo } from 'expo';
import { Stack, useNavigationContainerRef } from 'expo-router';
import * as SplashScreenExpo from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import { useColorScheme } from 'nativewind';
import React, { useEffect, useRef, useState } from 'react';
import { LogBox, StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { KeyboardProvider } from 'react-native-keyboard-controller';
import Animated, {
  Easing,
  runOnJS,
  SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import '../global.css';

SplashScreenExpo.preventAutoHideAsync();

// Deliberately conservative for an app whose whole promise is "No account.
// No cloud." — sendDefaultPii stays off, so no IP address or device
// identifiers ride along with a crash, and nothing about a user's tasks is
// ever attached. What Sentry sees is a stack trace and the device/OS class.
// Tracing is sampled low: this is here for crashes, and performance spans
// would burn the free tier's quota for information nobody is reading yet.
// Reuses the dataset split (see appConfig) so preview builds report as
// development and only real releases land in the production environment.
// expo-router builds on React Navigation, so this is the integration that
// applies — it needs the navigation container handed to it once mounted,
// which RootLayout does below.
const navigationIntegration = Sentry.reactNavigationIntegration({
  enableTimeToInitialDisplay: !isRunningInExpoGo(),
});

Sentry.init({
  dsn: SENTRY_DSN,
  enabled: SENTRY_DSN.length > 0,
  environment: __DEV__ ? 'development' : SANITY_DATASET,
  sendDefaultPii: false,
  tracesSampleRate: 0.1,
  integrations: [navigationIntegration],
  enableNativeFramesTracking: !isRunningInExpoGo(),
});

// LogBox.ignoreLogs only hides the in-app red/yellow box; the underlying
// console.warn still fires and reaches Metro/remote-debugger consoles. This
// specific warning isn't ours to fix — NativeWind's react-native-css-interop
// runtime unconditionally registers className support for the deprecated
// core SafeAreaView (alongside the correct react-native-safe-area-context
// one) on every app boot, which alone triggers React Native's warnOnce for
// it, regardless of whether SafeAreaView is ever rendered.
LogBox.ignoreLogs(['SafeAreaView has been deprecated']);
const originalConsoleWarn = console.warn;
console.warn = (...args: Parameters<typeof console.warn>) => {
  if (typeof args[0] === 'string' && args[0].includes('SafeAreaView has been deprecated')) {
    return;
  }
  originalConsoleWarn(...args);
};

type Phase = 'splash' | 'welcome' | 'app';

const ALWAYS_SHOW_WELCOME = false;

// Both controls are absolutely positioned against the full screen, so the
// absoluteFill wrapper leaves their placement untouched. It exists to fade
// and disable them together while the flame's capture sheet is open — they
// render above that sheet's scrim and would otherwise stay lit and tappable
// over a dimmed app. Timings match the scrim's own fades.
function FloatingControls({
  dock,
  introDelay,
  showInfo,
}: {
  dock: SharedValue<number>;
  introDelay?: number;
  showInfo: boolean;
}) {
  const { isCaptureOpen } = useCaptureOverlay();
  const hidden = useSharedValue(0);

  useEffect(() => {
    hidden.value = withTiming(isCaptureOpen ? 1 : 0, { duration: isCaptureOpen ? 340 : 380 });
  }, [isCaptureOpen, hidden]);

  const fadeStyle = useAnimatedStyle(() => ({ opacity: 1 - hidden.value }));

  return (
    <Animated.View
      pointerEvents={isCaptureOpen ? 'none' : 'box-none'}
      style={[StyleSheet.absoluteFill, fadeStyle]}
    >
      <FloatingThemeToggle dock={dock} introDelay={introDelay} />
      {showInfo ? <InfoButton /> : null}
    </Animated.View>
  );
}

function RootLayout() {
  const [appIsReady, setAppIsReady] = useState(false);
  const [phase, setPhase] = useState<Phase>('splash');

  const skipWelcomeRef = useRef(false);
  const { colorScheme } = useColorScheme();

  // Hands the live navigation container to the integration configured above,
  // which is what turns route changes into breadcrumbs and screen spans.
  const navigationRef = useNavigationContainerRef();
  useEffect(() => {
    if (navigationRef) {
      navigationIntegration.registerNavigationContainer(navigationRef);
    }
  }, [navigationRef]);

  useEffect(() => {
    SystemUI.setBackgroundColorAsync(colorScheme === 'dark' ? '#000000' : '#FBFAF8');
  }, [colorScheme]);

  const curtainOpacity = useSharedValue(1);
  const dock = useSharedValue(0);

  useEffect(() => {
    let warmupTimer: ReturnType<typeof setTimeout>;
    let cancelled = false;
    async function prepare() {
      try {
        const seenWelcome = await hasSeenWelcome();
        if (!cancelled) skipWelcomeRef.current = ALWAYS_SHOW_WELCOME ? false : seenWelcome;
        await new Promise((resolve) => {
          warmupTimer = setTimeout(resolve, 100);
        });
      } catch (e) {
        console.warn('Error loading resources:', e);
      } finally {
        if (!cancelled) setAppIsReady(true);
        await SplashScreenExpo.hideAsync();
      }
    }
    prepare();
    return () => {
      cancelled = true;
      clearTimeout(warmupTimer);
    };
  }, []);

  const finishWelcome = () => {
    dock.value = withTiming(1, { duration: 700, easing: Easing.inOut(Easing.cubic) });
    curtainOpacity.value = withTiming(
      0,
      { duration: 600, easing: Easing.out(Easing.cubic) },
      (finished) => {
        if (finished) {
          runOnJS(setPhase)('app');
          runOnJS(markWelcomeSeen)();
        }
      }
    );
  };

  if (!appIsReady) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <KeyboardProvider>
        <SafeAreaProvider>
          <ErrorBoundary>
            <AppConfigProvider>
              <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
              <UpdateGate>
                {phase === 'splash' ? (
                  <SplashScreen
                    onFinish={() => {
                      if (skipWelcomeRef.current) {
                        dock.value = 1;
                        setPhase('app');
                      } else {
                        setPhase('welcome');
                      }
                    }}
                  />
                ) : (
                  <AppRevealProvider revealed={phase === 'app'}>
                    <CaptureOverlayProvider>
                      <View style={{ flex: 1 }}>
                        <Stack
                          screenOptions={{
                            headerShown: false,
                            contentStyle: {
                              backgroundColor: colorScheme === 'dark' ? '#000000' : '#FBFAF8',
                            },
                          }}
                        >
                          <Stack.Screen name="index" />
                          <Stack.Screen name="(tabs)" />
                          <Stack.Screen
                            name="about"
                            options={{
                              presentation: 'card',
                              animation: 'slide_from_bottom',
                              contentStyle: {
                                backgroundColor: colorScheme === 'dark' ? '#000000' : '#FBFAF8',
                              },
                            }}
                          />
                        </Stack>
                        {phase === 'welcome' ? (
                          <WelcomeCurtain
                            curtainOpacity={curtainOpacity}
                            onSequenceComplete={finishWelcome}
                          />
                        ) : null}
                        {/* On a repeat launch the welcome curtain is skipped, so
                          there is nothing to wait for — leaving introDelay
                          undefined fell through to the component's 1200ms
                          default and left the toggle missing for over a second
                          after the app was already interactive. */}
                        <FloatingControls
                          dock={dock}
                          introDelay={phase === 'welcome' ? PRIVACY_ENTER_AT : 0}
                          showInfo={phase === 'app'}
                        />
                      </View>
                    </CaptureOverlayProvider>
                  </AppRevealProvider>
                )}
              </UpdateGate>
              {phase === 'app' ? <AnnouncementModal /> : null}
            </AppConfigProvider>
          </ErrorBoundary>
        </SafeAreaProvider>
      </KeyboardProvider>
    </GestureHandlerRootView>
  );
}

// Sentry.wrap is what attaches the routing instrumentation and app-start
// timing to the real root — expoRouterIntegration above only configures it.
export default Sentry.wrap(RootLayout);
