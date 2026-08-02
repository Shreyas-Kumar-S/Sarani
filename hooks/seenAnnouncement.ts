import AsyncStorage from '@react-native-async-storage/async-storage';
const KEY = 'sarani.seenAnnouncements.v1';

export async function isSeen(id: string): Promise<boolean> {
  const raw = await AsyncStorage.getItem(KEY);
  return raw ? (JSON.parse(raw) as string[]).includes(id) : false;
}
export async function markSeen(id: string): Promise<void> {
  const raw = await AsyncStorage.getItem(KEY);
  const seen = raw ? (JSON.parse(raw) as string[]) : [];
  if (!seen.includes(id)) await AsyncStorage.setItem(KEY, JSON.stringify([...seen, id]));
}
