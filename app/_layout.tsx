import React from 'react';
import { Stack } from 'expo-router';
import * as SplashScreenExpo from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'nativewind';
import { useEffect, useState } from 'react';
import SplashScreen from '../components/SplashScreen';
import '../global.css';

// Prevent auto-hiding the native splash screen
SplashScreenExpo.preventAutoHideAsync();

export default function RootLayout() {
  const [appIsReady, setAppIsReady] = useState(false);
  const [showCustomSplash, setShowCustomSplash] = useState(true);
  const { colorScheme } = useColorScheme();

  useEffect(() => {
    async function prepare() {
      try {
        // Load any resources here (fonts, data, etc.)
        // Example: await Font.loadAsync({...});

        // Simulate minimal loading time
        await new Promise((resolve) => setTimeout(resolve, 100));
      } catch (e) {
        console.warn('Error loading resources:', e);
      } finally {
        setAppIsReady(true);
        // Hide the native splash screen once resources are loaded
        await SplashScreenExpo.hideAsync();
      }
    }

    prepare();
  }, []);

  const handleSplashFinish = () => {
    setShowCustomSplash(false);
  };

  // Keep native splash visible while loading resources
  if (!appIsReady) {
    return null;
  }

  // Show custom animated splash screen
  if (showCustomSplash) {
    return <SplashScreen onFinish={handleSplashFinish} />;
  }

  // Main app with navigation
  return (
    <>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
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
    </>
  );
}
