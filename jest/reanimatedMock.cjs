/**
 * Self-contained mock for react-native-reanimated.
 *
 * Reanimated ships its own mock at `react-native-reanimated/mock`, but as of
 * Reanimated 4 (Expo SDK 56) that file imports enums from `./index`, and that
 * import pulls in the real initializers -> react-native-worklets ->
 * NativeWorklets, whose constructor throws when there is no native runtime.
 * So the shipped mock can no longer be loaded in a plain jest environment.
 *
 * This mirrors the shipped mock's *semantics* for the APIs this app actually
 * uses, without importing the real package. Notably `withTiming`/`withSpring`
 * invoke their completion callback synchronously — same as upstream — which is
 * what lets tests observe post-animation state (e.g. the splash calling
 * onFinish) without fake timers.
 */
const { Animated: AnimatedRN, Image, Text, View } = require('react-native');

const NOOP = () => {};
const NOOP_FACTORY = () => NOOP;
const ID = (t) => t;
const CALL = (callback) => callback();

// Entering/exiting animation builders are chainable (FadeInDown.duration(220)),
// so every configurator has to return the builder itself.
class BaseAnimationMock {
  duration() {
    return this;
  }
  delay() {
    return this;
  }
  springify() {
    return this;
  }
  easing() {
    return this;
  }
  withCallback() {
    return this;
  }
  withInitialValues() {
    return this;
  }
  randomDelay() {
    return this;
  }
  reduceMotion() {
    return this;
  }
  getDuration() {
    return 300;
  }
  build() {
    return () => ({ initialValues: {}, animations: {} });
  }
}

const useSharedValue = (init) => {
  const target = { value: init };
  return new Proxy(target, {
    get(t, prop) {
      if (prop === 'value') return t.value;
      if (prop === 'get') return () => t.value;
      if (prop === 'set') {
        return (next) => {
          t.value = typeof next === 'function' ? next(t.value) : next;
        };
      }
      return undefined;
    },
    set(t, prop, next) {
      if (prop === 'value') {
        t.value = next;
        return true;
      }
      return false;
    },
  });
};

const Easing = {
  linear: ID,
  ease: ID,
  quad: ID,
  cubic: ID,
  poly: ID,
  sin: ID,
  circle: ID,
  exp: ID,
  elastic: ID,
  back: ID,
  bounce: ID,
  bezier: () => ({ factory: ID }),
  bezierFn: ID,
  steps: ID,
  in: ID,
  out: ID,
  inOut: ID,
};

const Animated = {
  View,
  Text,
  Image,
  ScrollView: AnimatedRN.ScrollView,
  FlatList: AnimatedRN.FlatList,
  createAnimatedComponent: ID,
  addWhitelistedUIProps: NOOP,
  addWhitelistedNativeProps: NOOP,
};

module.exports = {
  __esModule: true,
  default: Animated,

  // core
  runOnJS: ID,
  runOnUI: ID,
  makeMutable: ID,
  createSerializable: ID,
  cancelAnimation: NOOP,

  // hooks
  useSharedValue,
  useAnimatedStyle: CALL,
  useAnimatedProps: CALL,
  useDerivedValue: (processor) => {
    const result = processor();
    return { value: result, get: () => result };
  },
  useAnimatedReaction: NOOP,
  useAnimatedRef: () => ({ current: null }),
  // Not used by this app directly, but react-native-gesture-handler's
  // GestureDetector reaches for both internally.
  useEvent: () => NOOP,
  useHandler: () => ({ context: {}, doDependenciesDiffer: false, useWeb: false }),
  useAnimatedScrollHandler: NOOP_FACTORY,
  useScrollOffset: () => ({ value: 0 }),
  useScrollViewOffset: () => ({ value: 0 }),

  // animations — callbacks fire immediately, matching upstream's mock
  withTiming: (toValue, _config, callback) => {
    callback?.(true);
    return toValue;
  },
  withSpring: (toValue, _config, callback) => {
    callback?.(true);
    return toValue;
  },
  withDelay: (_delayMs, nextAnimation) => nextAnimation,
  withRepeat: ID,
  withSequence: () => 0,

  // interpolation
  interpolate: NOOP,
  interpolateColor: NOOP,
  clamp: NOOP,
  Extrapolation: { IDENTITY: 'identity', CLAMP: 'clamp', EXTEND: 'extend' },
  Extrapolate: { IDENTITY: 'identity', CLAMP: 'clamp', EXTEND: 'extend' },

  Easing,

  // layout animations
  BaseAnimationBuilder: new BaseAnimationMock(),
  Keyframe: BaseAnimationMock,
  FadeIn: new BaseAnimationMock(),
  FadeInDown: new BaseAnimationMock(),
  FadeInUp: new BaseAnimationMock(),
  FadeInLeft: new BaseAnimationMock(),
  FadeInRight: new BaseAnimationMock(),
  FadeOut: new BaseAnimationMock(),
  FadeOutDown: new BaseAnimationMock(),
  FadeOutUp: new BaseAnimationMock(),
  LinearTransition: new BaseAnimationMock(),
  Layout: new BaseAnimationMock(),

  ReduceMotion: { System: 'system', Always: 'always', Never: 'never' },
};
