const googleServicesFilePlistPath =
  process.env.GOOGLE_SERVICE_PLIST_PATH || "./config/GoogleService-Info.plist";
const googleServicesJson =
  process.env.GOOGLE_SERVICE_JSON_PATH || "./config/google-services.json";

module.exports = {
  expo: {
    name: "TeincFoodBusiness",
    slug: "teinc-food-business",
    owner: "teincsolutions",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "automatic",
    scheme: "teincfood.business",
    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#FF7622",
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.teincfood.business",
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
        LSApplicationQueriesSchemes: ["tel"],
        NSCameraUsageDescription:
          "$(PRODUCT_NAME) needs access to your camera to take profile pictures and upload documents.",
        NSPhotoLibraryUsageDescription:
          "$(PRODUCT_NAME) needs access to your photos to upload profile pictures and documents.",
        NSLocationWhenInUseUsageDescription:
          "$(PRODUCT_NAME) uses your location to manage deliveries and track your position.",
        NSLocationAlwaysAndWhenInUseUsageDescription:
          "$(PRODUCT_NAME) uses your location to track deliveries in real-time and update your availability.",
        UIBackgroundModes: ["fetch", "remote-notification", "location"],
        UISupportedInterfaceOrientations: [
          "UIInterfaceOrientationPortrait",
          "UIInterfaceOrientationPortraitUpsideDown",
        ],
        UISupportedInterfaceOrientationsIpad: [
          "UIInterfaceOrientationPortrait",
          "UIInterfaceOrientationPortraitUpsideDown",
          "UIInterfaceOrientationLandscapeLeft",
          "UIInterfaceOrientationLandscapeRight",
        ],
      },
      googleServicesFile: googleServicesFilePlistPath,
    },
    android: {
      allowBackup: false,
      adaptiveIcon: {
        backgroundColor: "#FF7622",
        foregroundImage: "./assets/android-icon-foreground.png",
        backgroundImage: "./assets/android-icon-background.png",
        monochromeImage: "./assets/android-icon-monochrome.png",
      },
      package: "com.teincfood.business",
      predictiveBackGestureEnabled: false,
      permissions: [
        "android.permission.CAMERA",
        "android.permission.READ_EXTERNAL_STORAGE",
        "android.permission.WRITE_EXTERNAL_STORAGE",
        "android.permission.ACCESS_FINE_LOCATION",
        "android.permission.ACCESS_COARSE_LOCATION",
        "android.permission.POST_NOTIFICATIONS",
        "android.permission.WAKE_LOCK",
        "android.permission.RECEIVE_BOOT_COMPLETED",
        "com.google.android.gms.permission.ACTIVITY_RECOGNITION",
        "android.permission.ACCESS_BACKGROUND_LOCATION",
        "android.permission.FOREGROUND_SERVICE",
        "android.permission.FOREGROUND_SERVICE_LOCATION",
        "android.permission.RECORD_AUDIO",
      ],
      googleServicesFile: googleServicesJson,
    },
    web: {
      favicon: "./assets/favicon.png",
      bundler: "metro",
    },
    plugins: [
      "expo-router",
      "expo-font",
      "./plugins/withNotifeeRepo.js",
      [
        "expo-location",
        {
          locationWhenInUsePermission:
            "$(PRODUCT_NAME) uses your location to manage deliveries and track your position.",
          locationAlwaysAndWhenInUsePermission:
            "$(PRODUCT_NAME) uses your location to track deliveries in real-time and update your availability.",
          isAndroidBackgroundLocationEnabled: true,
          isAndroidForegroundServiceEnabled: true,
        },
      ],
      [
        "react-native-maps",
        {
          iosGoogleMapsApiKey: "AIzaSyAynV0Kj00Mp3JkTH9ro5qk7jBW-dkDxeI",
          androidGoogleMapsApiKey: "AIzaSyBxq-rNf_MsiWif5znkJ3jSmNpe_AYM_Jw",
        },
      ],
      ["expo-live-activity", { enablePushNotifications: true }],
      [
        "expo-image-picker",
        {
          photosPermission:
            "$(PRODUCT_NAME) needs access to your photos to upload profile pictures and documents.",
          cameraPermission:
            "$(PRODUCT_NAME) needs access to your camera to take profile pictures and upload documents.",
        },
      ],
      [
        "expo-notifications",
        {
          sounds: ["./assets/notification_sound.wav"],
        },
      ],
      ["@react-native-firebase/app"],
      [
        "@react-native-firebase/messaging",
        {
          ios: {
            useFrameworks: "static",
          },
        },
      ],
      ["expo-apple-authentication"],
      "./plugins/withModularHeaders",
      "./plugins/withAndroidManifestReplace",
      [
        "expo-build-properties",
        {
          ios: {
            useFrameworks: "static",
          },
          android: {
            compileSdkVersion: 36,
            targetSdkVersion: 36,
            minSdkVersion: 24,
            enableProguardInReleaseBuilds: true,
            enableShrinkResourcesInReleaseBuilds: true,
            enableMinifyInReleaseBuilds: true,
          },
        },
      ],
      [
        "expo-dev-client",
        {
          launchMode: "most-recent",
        },
      ],
      [
        "@react-native-google-signin/google-signin",
        {
          iosUrlScheme:
            "com.googleusercontent.apps.924722353782-nmk7tji33t5cijds311m8vkvm4dfnc4i",
        },
      ],
      "expo-web-browser",
    ],
    experiments: {
      typedRoutes: true,
    },
    extra: {
      router: {},
      eas: {
        build: {
          experimental: {
            ios: {
              appExtensions: [
                {
                  targetName: "LiveActivity",
                  bundleIdentifier: "com.teincfood.business.LiveActivity",
                  entitlements: {},
                },
              ],
            },
          },
        },
        projectId: "afa9b762-7069-493e-9a0d-de02c757e3bc",
      },
    },
  },
};
