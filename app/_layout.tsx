import { AnnouncementModal } from '@/components/AnnouncementModal';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import FloatingThemeToggle from '@/components/FloatingThemeToggle';
import InfoButton from '@/components/InfoButton';
import SplashScreen from '@/components/SplashScreen';
import { UpdateGate } from '@/components/UpdateGate';
import WelcomeCurtain, { PRIVACY_ENTER_AT } from '@/components/WelcomeCurtain';
import { AppConfigProvider } from '@/hooks/AppConfigStore';
import { AppRevealProvider } from '@/hooks/AppReveal';
import { hasSeenWelcome, markWelcomeSeen } from '@/hooks/welcomeSeen';
import { Stack } from 'expo-router';
import * as SplashScreenExpo from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import { useColorScheme } from 'nativewind';
import React, { useEffect, useRef, useState } from 'react';
import { LogBox, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Easing, runOnJS, useSharedValue, withTiming } from 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import '../global.css';

SplashScreenExpo.preventAutoHideAsync();

LogBox.ignoreLogs(['SafeAreaView has been deprecated']);

// Startup flow: splash logo → welcome curtain → task sheet.
type Phase = 'splash' | 'welcome' | 'app';

// Dev toggle: true shows the welcome curtain (title/tagline/description →
// privacy promise) on every launch, ignoring the "seen once" flag — handy
// while iterating on its copy or timing. Set back to false for the real
// one-time behaviour before shipping.
const ALWAYS_SHOW_WELCOME = true;

export default function RootLayout() {
  const [appIsReady, setAppIsReady] = useState(false);
  const [phase, setPhase] = useState<Phase>('splash');
  // True once the one-time welcome has been seen before — later launches skip
  // the curtain (but still show the splash). A ref, not state: it's only read
  // in the splash's onFinish handler, never rendered, so it needn't re-render.
  const skipWelcomeRef = useRef(false);
  const { colorScheme } = useColorScheme();

  // The Android Activity's own window background sits beneath every screen —
  // contentStyle only colours the Screen wrapper drawn on top of it. If a
  // card/modal transition ever has a frame where neither screen has painted
  // yet, this deeper layer (default white) shows through as a brief flash.
  // Keeping it in sync with the current theme removes that flash regardless
  // of which screens are transitioning.
  useEffect(() => {
    SystemUI.setBackgroundColorAsync(colorScheme === 'dark' ? '#000000' : '#FBFAF8');
  }, [colorScheme]);

  // Shared choreography: the curtain fades as the toggle docks into the corner.
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

  // Called by WelcomeCurtain once its own sequence (welcome content, then the
  // privacy line) has fully played out: glide the toggle to the corner while
  // the curtain fades away to reveal the task sheet underneath.
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
      <SafeAreaProvider>
        <ErrorBoundary>
          <AppConfigProvider>
            <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
            <UpdateGate>
              {phase === 'splash' ? (
                <SplashScreen
                  onFinish={() => {
                    if (skipWelcomeRef.current) {
                      // Repeat launch: dock the toggle instantly and go straight
                      // to the app, skipping the one-time welcome curtain.
                      dock.value = 1;
                      setPhase('app');
                    } else {
                      setPhase('welcome');
                    }
                  }}
                />
              ) : (
                <AppRevealProvider revealed={phase === 'app'}>
                  <View style={{ flex: 1 }}>
                    <Stack
                      screenOptions={{
                        headerShown: false,
                        // Must match the surface-page token every screen's own root
                        // View paints (not surface-primary/nav) — react-native-screens
                        // uses this as the native container's base layer, visible for
                        // a frame at the sliding screen's edge during push/modal
                        // transitions. A mismatch here (previously #0A0A0A vs the
                        // actual #000000 page background in dark mode) showed up as a
                        // colour flash/jitter when the About modal opened or closed.
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
                          // A card, not a modal: `presentation: 'modal'` on Android
                          // keeps the previous tab mounted and visible *behind*, then
                          // cross-fades the modal in at partial opacity — so mid-
                          // transition you saw the tab underneath (e.g. "Someday" /
                          // "This weekend") bleeding through Origins, which read as a
                          // flicker/jitter. A card fully covers/detaches the screen
                          // behind, so nothing shows through; `slide_from_bottom`
                          // keeps the same upward modal-style motion. contentStyle
                          // pins its background to the page colour the tabs paint so
                          // there's no shade change either.
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
                    <FloatingThemeToggle
                      dock={dock}
                      introDelay={phase === 'welcome' ? PRIVACY_ENTER_AT : undefined}
                    />
                    {phase === 'app' ? <InfoButton /> : null}
                  </View>
                </AppRevealProvider>
              )}
            </UpdateGate>
            {/* Only after the welcome flow (or splash, on repeat launches) —
                never over the splash/welcome screens. */}
            {phase === 'app' ? <AnnouncementModal /> : null}
          </AppConfigProvider>
        </ErrorBoundary>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
