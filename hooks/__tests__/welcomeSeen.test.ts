import AsyncStorage from '@react-native-async-storage/async-storage';
import { hasSeenWelcome, markWelcomeSeen } from '../welcomeSeen';

beforeEach(async () => {
  await AsyncStorage.clear();
});

describe('welcomeSeen', () => {
  it('is false before the welcome has been seen', async () => {
    expect(await hasSeenWelcome()).toBe(false);
  });

  it('is true after the welcome is marked seen', async () => {
    await markWelcomeSeen();
    expect(await hasSeenWelcome()).toBe(true);
  });

  it('treats a corrupt/missing flag as not seen', async () => {
    await AsyncStorage.setItem('serein.hasSeenWelcome.v1', 'nonsense');
    expect(await hasSeenWelcome()).toBe(false);
  });
});
