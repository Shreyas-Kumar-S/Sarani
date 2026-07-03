import FloatingThemeToggle from '@/components/FloatingThemeToggle';
import SplashScreen from '@/components/SplashScreen';
import WelcomeCurtain from '@/components/WelcomeCurtain';
import { AppRevealProvider } from '@/hooks/AppReveal';
import { Stack } from 'expo-router';
import * as SplashScreenExpo from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'nativewind';
import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Easing, runOnJS, useSharedValue, withTiming } from 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import '../global.css';

SplashScreenExpo.preventAutoHideAsync();

// Startup flow: splash logo → welcome curtain → task sheet.
type Phase = 'splash' | 'welcome' | 'app';

// How long the welcome content lingers before it dissolves into the tabs.
const WELCOME_HOLD_MS = 2800;

export default function RootLayout() {
  const [appIsReady, setAppIsReady] = useState(false);
  const [phase, setPhase] = useState<Phase>('splash');
  const { colorScheme } = useColorScheme();

  // Shared choreography: the curtain fades as the toggle docks into the corner.
  const curtainOpacity = useSharedValue(1);
  const dock = useSharedValue(0);

  useEffect(() => {
    let warmupTimer: ReturnType<typeof setTimeout>;
    async function prepare() {
      try {
        await new Promise((resolve) => {
          warmupTimer = setTimeout(resolve, 100);
        });
      } catch (e) {
        console.warn('Error loading resources:', e);
      } finally {
        setAppIsReady(true);
        await SplashScreenExpo.hideAsync();
      }
    }
    prepare();
    return () => clearTimeout(warmupTimer);
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
          if (finished) runOnJS(setPhase)('app');
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
        <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
        {phase === 'splash' ? (
          <SplashScreen onFinish={() => setPhase('welcome')} />
        ) : (
          <AppRevealProvider revealed={phase === 'app'}>
            <View style={{ flex: 1 }}>
              <Stack
                screenOptions={{
                  headerShown: false,
                  contentStyle: {
                    backgroundColor: colorScheme === 'dark' ? '#141414' : '#FAF8F5',
                  },
                }}
              >
                <Stack.Screen name="index" />
                <Stack.Screen name="(tabs)" />
              </Stack>
              {phase === 'welcome' ? <WelcomeCurtain curtainOpacity={curtainOpacity} /> : null}
              <FloatingThemeToggle dock={dock} />
            </View>
          </AppRevealProvider>
        )}
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
