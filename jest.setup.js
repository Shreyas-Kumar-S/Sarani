import "@testing-library/jest-native/extend-expect";

// ✅ Mock react-native-reanimated (THIS is enough)
jest.mock("react-native-reanimated", () => {
  const Reanimated = require("react-native-reanimated/mock");
  Reanimated.default.call = () => {};
  return Reanimated;
});

// ✅ Mock NativeWind
jest.mock("nativewind", () => ({
  useColorScheme: () => ({
    colorScheme: "light",
    toggleColorScheme: jest.fn(),
    setColorScheme: jest.fn(),
  }),
}));

// ✅ Mock expo-font as already-loaded so @expo/vector-icons doesn't setState
// asynchronously after render (act() warnings in tests)
jest.mock("expo-font", () => ({
  ...jest.requireActual("expo-font"),
  isLoaded: jest.fn(() => true),
  loadAsync: jest.fn(() => Promise.resolve()),
}));

// ✅ Mock expo-splash-screen
jest.mock("expo-splash-screen", () => ({
  preventAutoHideAsync: jest.fn(),
  hideAsync: jest.fn(),
}));

// ✅ Mock AsyncStorage with the library's official in-memory jest mock
jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock")
);
