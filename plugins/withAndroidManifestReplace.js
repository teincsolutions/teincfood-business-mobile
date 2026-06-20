const { withAndroidManifest } = require("@expo/config-plugins");

const CONFLICTING_META = [
  "com.google.firebase.messaging.default_notification_color",
  "com.google.firebase.messaging.default_notification_icon",
];

module.exports = function withAndroidManifestReplace(config) {
  return withAndroidManifest(config, (config) => {
    const application = config.modResults.manifest.application?.[0];
    if (!application) return config;

    (application["meta-data"] || []).forEach((item) => {
      const name = item.$?.["android:name"];
      if (name && CONFLICTING_META.includes(name) && item.$) {
        item.$["tools:replace"] = "android:resource";
      }
    });

    return config;
  });
};
