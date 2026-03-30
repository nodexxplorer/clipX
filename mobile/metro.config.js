const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Fix tslib ESM/CJS mismatch for web bundling (Apollo Client v4 issue)
config.resolver.unstable_enablePackageExports = false;

module.exports = config;
