import { AnnouncementModal } from '@/components/AnnouncementModal';
import FloatingThemeToggle from '@/components/FloatingThemeToggle';
import SplashScreen from '@/components/SplashScreen';
import { UpdateGate } from '@/components/UpdateGate';
import WelcomeCurtain from '@/components/WelcomeCurtain';
import { AppConfigProvider } from '@/hooks/AppConfigStore';
import { AppRevealProvider } from '@/hooks/AppReveal';
import { hasSeenWelcome, markWelcomeSeen } from '@/hooks/welcomeSeen';
import { Stack } from 'expo-router';
import * as SplashScreenExpo from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
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

// How long the welcome content lingers before it dissolves into the tabs.
const WELCOME_HOLD_MS = 2800;

export default function RootLayout() {
  const [appIsReady, setAppIsReady] = useState(false);
  const [phase, setPhase] = useState<Phase>('splash');
  // True once the one-time welcome has been seen before — later launches skip
  // the curtain (but still show the splash). A ref, not state: it's only read
  // in the splash's onFinish handler, never rendered, so it needn't re-render.
  const skipWelcomeRef = useRef(false);
  const { colorScheme } = useColorScheme();

  // Shared choreography: the curtain fades as the toggle docks into the corner.
  const curtainOpacity = useSharedValue(1);
  const dock = useSharedValue(0);

  useEffect(() => {
    let warmupTimer: ReturnType<typeof setTimeout>;
    let cancelled = false;
    async function prepare() {
      try {
        const seenWelcome = await hasSeenWelcome();
        if (!cancelled) skipWelcomeRef.current = seenWelcome;
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

  // Once the welcome content has settled, glide the toggle to the corner while the
  // curtain fades away to reveal the task sheet underneath.
  useEffect(() => {
    if (phase !== 'welcome') return;
    const timer = setTimeout(() => {
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
    }, WELCOME_HOLD_MS);
    return () => clearTimeout(timer);
    // dock/curtainOpacity are reanimated shared values with stable identity, so
    // including them keeps this effect running only when the phase changes.
  }, [phase, dock, curtainOpacity]);

  if (!appIsReady) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
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
                      contentStyle: {
                        backgroundColor: colorScheme === 'dark' ? '#0A0A0A' : '#FAF8F5',
                      },
                    }}
                  >
                    <Stack.Screen name="index" />
                    <Stack.Screen name="(tabs)" />
                  </Stack>
                  {phase === 'welcome' ? (
                    <WelcomeCurtain curtainOpacity={curtainOpacity} />
                  ) : null}
                  <FloatingThemeToggle dock={dock} />
                </View>
              </AppRevealProvider>
            )}
          </UpdateGate>
          {/* Only after the welcome flow (or splash, on repeat launches) —
              never over the splash/welcome screens. */}
          {phase === 'app' ? <AnnouncementModal /> : null}
        </AppConfigProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
