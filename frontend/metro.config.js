const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

const defaultConfig = getDefaultConfig(__dirname);

const config = {
  ...defaultConfig,
  resolver: {
    ...defaultConfig.resolver,
    alias: {
      ...defaultConfig.resolver.alias,
    },
  },
  transformer: {
    ...defaultConfig.transformer,
  },
  serializer: {
    ...defaultConfig.serializer,
  },
};

module.exports = mergeConfig(defaultConfig, config);
