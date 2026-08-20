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
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { Easing, runOnJS, useSharedValue, withTiming } from 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import '../global.css';

SplashScreenExpo.preventAutoHideAsync();

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

export default function RootLayout() {
  const [appIsReady, setAppIsReady] = useState(false);
  const [phase, setPhase] = useState<Phase>('splash');

  const skipWelcomeRef = useRef(false);
  const { colorScheme } = useColorScheme();

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
                      <FloatingThemeToggle
                        dock={dock}
                        introDelay={phase === 'welcome' ? PRIVACY_ENTER_AT : undefined}
                      />
                      {phase === 'app' ? <InfoButton /> : null}
                    </View>
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
