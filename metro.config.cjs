const { getDefaultConfig } = require('expo/metro-config');
const { withSentryConfig } = require('@sentry/react-native/metro');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

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

// Sentry goes on last so its serializer stamps the debug ID that ties a
// shipped bundle to its uploaded source map. Its React-component annotation
// is left off (the default): that path installs its own babel transformer,
// which would displace react-native-svg-transformer above — and component
// names only matter for Session Replay, which this app doesn't use.
module.exports = withSentryConfig(withNativeWind(config, { input: './global.css' }));