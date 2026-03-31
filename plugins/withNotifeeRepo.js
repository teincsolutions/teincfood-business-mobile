const { withProjectBuildGradle } = require('@expo/config-plugins');

module.exports = function withNotifeeRepo(config) {
  return withProjectBuildGradle(config, (config) => {
    if (config.modResults.contents.includes('notifee')) {
      return config;
    }

    config.modResults.contents = config.modResults.contents.replace(
      /allprojects\s*{\s*repositories\s*{/,
      `allprojects {
    repositories {
        maven { url("$rootDir/../node_modules/@notifee/react-native/android/libs") }`
    );

    return config;
  });
};