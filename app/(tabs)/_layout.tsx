import { Tabs } from 'expo-router';
import { useColorScheme } from 'nativewind';
import { Feather } from '@expo/vector-icons';

export default function TabsLayout() {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: isDark ? '#9DB89A' : '#7A9B76',
        tabBarInactiveTintColor: isDark ? 'rgba(255,255,255,0.45)' : 'rgba(0,0,0,0.35)',
        tabBarStyle: {
          backgroundColor: isDark ? 'hsla(0, 0%, 10%, 1)' : 'hsla(35, 28%, 97%, 1)',
          borderTopColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)',
          borderTopWidth: 1,
          height: 72,
          paddingBottom: 10,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          letterSpacing: 0.2,
        },
      }}
    >
      <Tabs.Screen
        name="today"
        options={{
          title: 'Today',
          tabBarIcon: ({ color, size }) => <Feather name="sun" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="upcoming"
        options={{
          title: 'Upcoming',
          tabBarIcon: ({ color, size }) => <Feather name="calendar" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="someday"
        options={{
          title: 'Someday',
          tabBarIcon: ({ color, size }) => <Feather name="check-square" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="lists"
        options={{
          title: 'Lists',
          tabBarIcon: ({ color, size }) => <Feather name="list" size={size} color={color} />,
        }}
      />
    </Tabs>
  );
}
