import "@testing-library/jest-native/extend-expect";

jest.mock("react-native-reanimated", () =>
  require("./jest/reanimatedMock.cjs")
);

jest.mock("nativewind", () => ({
  useColorScheme: () => ({
    colorScheme: "light",
    toggleColorScheme: jest.fn(),
    setColorScheme: jest.fn(),
  }),
}));

jest.mock("expo-font", () => ({
  ...jest.requireActual("expo-font"),
  isLoaded: jest.fn(() => true),
  loadAsync: jest.fn(() => Promise.resolve()),
}));

jest.mock("expo-splash-screen", () => ({
  preventAutoHideAsync: jest.fn(),
  hideAsync: jest.fn(),
}));

jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock")
);

jest.mock("react-native-keyboard-controller", () =>
  require("react-native-keyboard-controller/jest")
);

// The SDK ships ESM that jest-expo's transform doesn't cover, and a test run
// has no business starting a crash reporter anyway. Mocked rather than added
// to transformIgnorePatterns so the whole SDK isn't compiled on every run.
// wrap() is identity here, which keeps the real root layout under test.
jest.mock("@sentry/react-native", () => ({
  init: jest.fn(),
  wrap: (component) => component,
  captureException: jest.fn(),
  captureMessage: jest.fn(),
  reactNavigationIntegration: jest.fn(() => ({
    name: "ReactNavigation",
    registerNavigationContainer: jest.fn(),
  })),
}));
