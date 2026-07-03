import { Feather } from '@expo/vector-icons';
// oxlint-disable-next-line react-doctor/rn-no-non-native-navigator -- deliberate: the floating blurred tab bar and its rising entrance animation are built on the JS navigator; native-tabs cannot render this custom design.
import { BottomTabBar, BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { BlurView } from 'expo-blur';
import { Tabs } from 'expo-router';
import { useColorScheme } from 'nativewind';
import React, { useEffect } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import AtmosphericBackground from '@/components/ui/AtmosphericBackground';
import { strings } from '@/constants/strings';
import { useAppRevealed } from '@/hooks/AppReveal';
import { NoteProvider } from '@/hooks/NoteStore';
import { TabKey, TaskProvider, useTabAllComplete } from '@/hooks/TaskStore';

// How far below its resting spot the bar starts (its height + bottom offset,
// i.e. fully off-screen) and how it rises once the startup reveal completes.
const BAR_RISE_DISTANCE = 130;
const BAR_RISE_DELAY_MS = 200;
const BAR_RISE_DURATION_MS = 700;

// Wraps the stock tab bar so it can slide up from below the screen edge once
// per app launch. All existing styling (blur, floating position, per-tab
// variants) lives on the inner BottomTabBar untouched.
function RisingTabBar(props: BottomTabBarProps) {
  const revealed = useAppRevealed();
  // Starts settled when mounted after the reveal (e.g. fast refresh) so the
  // rise only ever plays on a real cold launch.
  const progress = useSharedValue(revealed ? 1 : 0);

  useEffect(() => {
    if (revealed) {
      progress.value = withDelay(
        BAR_RISE_DELAY_MS,
        withTiming(1, { duration: BAR_RISE_DURATION_MS, easing: Easing.out(Easing.cubic) })
      );
    }
  }, [revealed, progress]);

  const riseStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    transform: [{ translateY: (1 - progress.value) * BAR_RISE_DISTANCE }],
  }));

  return (
    <Animated.View style={riseStyle} pointerEvents="box-none">
      <BottomTabBar {...props} />
    </Animated.View>
  );
}

// Reflects a tab's task state: empty square until every task in the tab is
// checked off, then a ticked square.
function TaskTabIcon({ tab, color, size }: { tab: TabKey; color: string; size: number }) {
  const allComplete = useTabAllComplete(tab);
  return <Feather name={allComplete ? 'check-square' : 'square'} size={size} color={color} />;
}

export default function TabsLayout() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const { width: SCREEN_WIDTH } = useWindowDimensions();

  const baseTabBarStyle = {
    position: 'absolute' as const,
    marginHorizontal: SCREEN_WIDTH * 0.04,
    bottom: 38,
    backgroundColor: isDark ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.56)',
    borderTopWidth: 0,
    borderWidth: 1,
    borderColor: isDark ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.72)',
    borderRadius: 38,
    height: 72,
    paddingBottom: 10,
    paddingTop: 8,
    shadowColor: '#000',
    shadowOpacity: isDark ? 0.18 : 0.1,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 10 },
    elevation: 14,
  };
  const notesTabBarStyle = {
    ...baseTabBarStyle,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderColor: 'rgba(255,255,255,0.18)',
    shadowOpacity: 0.18,
  };

  return (
    <TaskProvider>
      <NoteProvider>
        <View style={{ flex: 1 }}>
          {/* Persistent atmospheric layer — rendered once, behind the navigator, so
            it stays continuous across tab switches instead of remounting per screen. */}
          <View
            style={StyleSheet.absoluteFill}
            className="bg-surface-page dark:bg-surface-dark-page"
          >
            <AtmosphericBackground />
          </View>
          <Tabs
            tabBar={(props) => <RisingTabBar {...props} />}
            screenOptions={{
              headerShown: false,
              sceneStyle: { backgroundColor: 'transparent' },
              tabBarActiveTintColor: isDark ? '#9DB89A' : '#7A9B76',
              tabBarInactiveTintColor: isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.35)',
              tabBarStyle: baseTabBarStyle,
              tabBarBackground: () => (
                <BlurView
                  experimentalBlurMethod="dimezisBlurView"
                  intensity={isDark ? 28 : 42}
                  tint={isDark ? 'dark' : 'light'}
                  style={[StyleSheet.absoluteFill, { borderRadius: 38, overflow: 'hidden' }]}
                />
              ),
              tabBarLabelStyle: {
                fontSize: 12,
              },
            }}
          >
            <Tabs.Screen
              name="today"
              options={{
                title: strings.tabs.today,
                tabBarIcon: ({ color, size }) => (
                  <TaskTabIcon tab="today" color={color} size={size} />
                ),
              }}
            />
            <Tabs.Screen
              name="upcoming"
              options={{
                title: strings.tabs.upcoming,
                tabBarIcon: ({ color, size }) => (
                  <TaskTabIcon tab="upcoming" color={color} size={size} />
                ),
              }}
            />
            <Tabs.Screen
              name="someday"
              options={{
                title: strings.tabs.someday,
                tabBarIcon: ({ color, size }) => (
                  <TaskTabIcon tab="someday" color={color} size={size} />
                ),
              }}
            />
            <Tabs.Screen
              name="lists"
              options={{
                title: strings.tabs.lists,
                tabBarActiveTintColor: '#DDE4DF',
                tabBarInactiveTintColor: 'rgba(255,255,255,0.65)',
                tabBarStyle: notesTabBarStyle,
                tabBarIcon: ({ color, size }) => (
                  <Feather name="feather" size={size} color={color} />
                ),
              }}
            />
          </Tabs>
        </View>
      </NoteProvider>
    </TaskProvider>
  );
}
