import { useColorScheme } from 'nativewind';
import { Text, TouchableOpacity, View } from 'react-native';

export default function Index() {
  const { colorScheme, toggleColorScheme } = useColorScheme();

  return (
    <View className="flex-1 items-center justify-center bg-surface-page dark:bg-surface-dark-page px-6">
      {/* Welcome Header */}
      <View className="items-center mb-8">
        <Text className="text-4xl font-bold text-ink-primary dark:text-ink-dark-primary mb-2">
          Welcome to Serein
        </Text>
        <Text className="text-sm text-ink-tertiary dark:text-ink-dark-tertiary uppercase tracking-wider">
          Move Gently Forward
        </Text>
      </View>

      {/* Description */}
      <Text className="text-base text-ink-secondary dark:text-ink-dark-secondary text-center mb-12 max-w-md leading-6">
        Your app is ready! The splash screen animation should have played beautifully. Now you can
        start building your features.
      </Text>

      {/* Theme Toggle Button */}
      <TouchableOpacity
        onPress={toggleColorScheme}
        className="bg-primary px-8 py-4 rounded-md active:opacity-80"
      >
        <Text className="text-ink-onPrimary font-semibold text-base">
          Switch to {colorScheme === 'dark' ? 'Light' : 'Dark'} Mode
        </Text>
      </TouchableOpacity>

      {/* Current Theme Indicator */}
      <View className="mt-8 px-4 py-2 rounded-full bg-surface-secondary dark:bg-surface-dark-secondary">
        <Text className="text-xs text-ink-tertiary dark:text-ink-dark-tertiary">
          Current theme: {colorScheme === 'dark' ? '🌙 Dark' : '☀️ Light'}
        </Text>
      </View>
    </View>
  );
}
