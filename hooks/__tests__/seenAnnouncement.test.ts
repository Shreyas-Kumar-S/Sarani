import AsyncStorage from '@react-native-async-storage/async-storage';
import { isSeen, markSeen } from '../seenAnnouncement';

beforeEach(async () => {
  await AsyncStorage.clear();
});

it('records and reports seen ids', async () => {
  expect(await isSeen('a')).toBe(false);
  await markSeen('a');
  expect(await isSeen('a')).toBe(true);
});
