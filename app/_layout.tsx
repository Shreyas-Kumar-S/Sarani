import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Stack } from 'expo-router';
import * as SplashScreenExpo from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'nativewind';
import { Easing, runOnJS, useSharedValue, withTiming } from 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import SplashScreen from '@/components/SplashScreen';
import WelcomeCurtain from '@/components/WelcomeCurtain';
import FloatingThemeToggle from '@/components/FloatingThemeToggle';
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
    async function prepare() {
      try {
        await new Promise((resolve) => setTimeout(resolve, 100));
      } catch (e) {
        console.warn('Error loading resources:', e);
      } finally {
        setAppIsReady(true);
        await SplashScreenExpo.hideAsync();
      }
    }
    prepare();
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  if (!appIsReady) return null;

  return (
    <SafeAreaProvider>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      {phase === 'splash' ? (
        <SplashScreen onFinish={() => setPhase('welcome')} />
      ) : (
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
      )}
    </SafeAreaProvider>
  );
}
