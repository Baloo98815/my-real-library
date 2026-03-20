const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Permet à Metro de traiter les fichiers .wasm (nécessaire pour expo-sqlite sur web)
config.resolver.assetExts.push('wasm');

// Assure que .ts et .tsx sont bien résolus
config.resolver.sourceExts = [
  ...config.resolver.sourceExts,
  'ts',
  'tsx',
];

module.exports = config;
