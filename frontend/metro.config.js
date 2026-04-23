const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('metro-config').MetroConfig}
 */
const config = {
  resolver: {
    // Explicitly ignore android and ios build directories to prevent
    // "Failed to start watch mode" errors on Windows during APK creation.
    blockList: [
      /.*\/android\/.*/,
      /.*\/ios\/.*/,
    ],
  },
  maxWorkers: 2,
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
