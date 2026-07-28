const { withDangerousMod } = require("@expo/config-plugins");
const path = require("path");
const fs = require("fs");

const ICON_MAPS = [
  {
    srcDir: "assets/android/notification-icon",
    fileName: "ic_notification.png",
  },
  {
    srcDir: "assets/android/status-bar-icon",
    fileName: "ic_status_bar.png",
  },
];

module.exports = function withAndroidNotificationIcons(config) {
  return withDangerousMod(config, [
    "android",
    (config) => {
      const projectRoot = config.modRequest.projectRoot;
      const resDir = path.join(
        config.modRequest.platformProjectRoot,
        "app/src/main/res"
      );

      if (!fs.existsSync(resDir)) {
        return config;
      }

      for (const icon of ICON_MAPS) {
        const srcBase = path.join(projectRoot, icon.srcDir);
        if (!fs.existsSync(srcBase)) continue;

        const densityDirs = fs.readdirSync(srcBase);
        for (const dir of densityDirs) {
          const srcFile = path.join(srcBase, dir, icon.fileName);
          if (!fs.existsSync(srcFile)) continue;

          const destDir = path.join(resDir, dir);
          if (!fs.existsSync(destDir)) {
            fs.mkdirSync(destDir, { recursive: true });
          }

          fs.copyFileSync(srcFile, path.join(destDir, icon.fileName));
        }
      }

      return config;
    },
  ]);
};
