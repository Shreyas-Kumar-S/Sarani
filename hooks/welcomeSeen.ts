import AsyncStorage from '@react-native-async-storage/async-storage';

// Persists whether the one-time welcome curtain has been shown, so it only
// greets a user on their first launch.
const KEY = 'sarani.hasSeenWelcome.v1';

export async function hasSeenWelcome(): Promise<boolean> {
  return (await AsyncStorage.getItem(KEY)) === 'true';
}

export async function markWelcomeSeen(): Promise<void> {
  await AsyncStorage.setItem(KEY, 'true');
}
