// Learn more https://docs.expo.io/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Allow bundling of self-signed TLS certificate assets used by the Local Node
// LAN layer (react-native-tcp-socket requires certs to be require()'d).
config.resolver.assetExts.push('pem', 'p12');

module.exports = config;
