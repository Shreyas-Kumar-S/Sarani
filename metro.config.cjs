const { getSentryExpoConfig } = require('@sentry/react-native/metro');
const { withNativeWind } = require('nativewind/metro');

// getSentryExpoConfig, not withSentryConfig. Both stamp the debug ID that ties
// a shipped bundle to its uploaded source map, but withSentryConfig is the bare
// React Native path: it installs a custom serializer that wraps whatever
// serializer is already configured and expects it to hand back { code, map }.
// Expo's default serializer doesn't, so the wrapper read code as undefined and
// the eager bundle died on `code.match` during EAS builds. The Expo entry point
// avoids the wrapping entirely, registering the debug ID through Expo's own
// unstable_beforeAssetSerializationPlugins hook. It calls expo/metro-config's
// getDefaultConfig internally, so it replaces that call rather than sitting on
// top of it.
const config = getSentryExpoConfig(__dirname);

// Add SVG support
config.transformer = {
  ...config.transformer,
  babelTransformerPath: require.resolve('react-native-svg-transformer'),
};

config.resolver = {
  ...config.resolver,
  assetExts: config.resolver.assetExts.filter((ext) => ext !== 'svg'),
  sourceExts: [...config.resolver.sourceExts, 'svg'],
};

// NativeWind goes last so its transformer chains onto the SVG one above rather
// than replacing it. Sentry's React-component annotation stays off (the
// default): that path installs a babel transformer of its own, which would
// displace react-native-svg-transformer — and component names only matter for
// Session Replay, which this app doesn't use.
module.exports = withNativeWind(config, { input: './global.css' });
