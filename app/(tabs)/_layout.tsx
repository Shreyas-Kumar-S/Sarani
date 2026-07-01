import { Feather } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { Tabs } from 'expo-router';
import { useColorScheme } from 'nativewind';
import React from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import AtmosphericBackground from '@/components/ui/AtmosphericBackground';
import { strings } from '@/constants/strings';
import { TabKey, TaskProvider, useTabAllComplete } from '@/hooks/TaskStore';

// Reflects a tab's task state: empty square until every task in the tab is
// checked off, then a ticked square.
function TaskTabIcon({ tab, color, size }: { tab: TabKey; color: string; size: number }) {
  const allComplete = useTabAllComplete(tab);
  return <Feather name={allComplete ? 'check-square' : 'square'} size={size} color={color} />;
}

export default function TabsLayout() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const SCREEN_WIDTH = Dimensions.get('window').width;

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
      <View style={{ flex: 1 }}>
        {/* Persistent atmospheric layer — rendered once, behind the navigator, so
            it stays continuous across tab switches instead of remounting per screen. */}
        <View style={StyleSheet.absoluteFill} className="bg-surface-page dark:bg-surface-dark-page">
          <AtmosphericBackground />
        </View>
        <Tabs
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
                <Feather name="clipboard" size={size} color={color} />
              ),
            }}
          />
        </Tabs>
      </View>
    </TaskProvider>
  );
}
