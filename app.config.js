const googleServicesFilePlistPath =
  process.env.GOOGLE_SERVICE_PLIST_PATH || "./config/GoogleService-Info.plist";
const googleServicesJson =
  process.env.GOOGLE_SERVICE_JSON_PATH || "./config/google-services.json";

module.exports = {
  expo: {
    name: "TF Business",
    slug: "teinc-food-business",
    owner: "teincsolutions",
    version: "1.0.0",
    runtimeVersion: {
      policy: "appVersion",
    },
    orientation: "default",
    icon: "./assets/icon.png",
    userInterfaceStyle: "automatic",
    scheme: "teincfood.business",
    updates: {
      url: "https://u.expo.dev/afa9b762-7069-493e-9a0d-de02c757e3bc",
      enabled: true,
      // Branch pinned at build time (see eas.json profile env). Without this
      // the binary listens on the default channel and `eas update --channel
      // <name>` never reaches it.
      channel: process.env.EXPO_PUBLIC_UPDATE_CHANNEL || "production",
      // Manual dialog flow in useOTAUpdate owns the UX; only auto-recover.
      checkAutomatically: "ON_ERROR_RECOVERY",
      fallbackToCacheTimeout: 0,
    },
    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#FFFFFF",
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.teincfood.business",
      // Universal links: https://teincfood.com/invite?code= opens the app
      // when installed (association file served by the site). The old host
      // stays listed so existing shared links keep working.
      associatedDomains: [
        "applinks:teincfood.com",
        "applinks:food.teincsolutions.com",
      ],
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
        LSApplicationQueriesSchemes: ["tel"],
        NSBonjourServices: ["_teincnode._tcp", "_expo._tcp"],
        NSLocalNetworkUsageDescription:
          "$(PRODUCT_NAME) uses your local network to connect POS terminals to the Local Node for offline ordering.",
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
        backgroundColor: "#FFFFFF",
        foregroundImage: "./assets/android-icon-foreground.png",
        backgroundImage: "./assets/android-icon-background.png",
        monochromeImage: "./assets/android-icon-monochrome.png",
      },
      package: "com.teincfood.business",
      predictiveBackGestureEnabled: false,
      // App Links: https://teincfood.com/invite?code= opens the app when
      // installed (assetlinks served by the site). Business-only paths never
      // overlap the buyer app's root/order/biz paths.
      intentFilters: [
        {
          action: "VIEW",
          autoVerify: true,
          data: [
            {
              scheme: "https",
              host: "teincfood.com",
              pathPrefix: "/invite",
            },
            {
              scheme: "https",
              host: "teincfood.com",
              pathPrefix: "/business",
            },
            {
              scheme: "https",
              host: "teincfood.com",
              pathPrefix: "/reset-password",
            },
            // Legacy links keep working after the domain move.
            {
              scheme: "https",
              host: "food.teincsolutions.com",
              pathPrefix: "/invite",
            },
          ],
          category: ["BROWSABLE", "DEFAULT"],
        },
      ],
      notification: {
        icon: "@drawable/ic_notification",
        color: "#ff7622",
      },
      permissions: [
        "android.permission.CAMERA",
        "android.permission.READ_EXTERNAL_STORAGE",
        "android.permission.WRITE_EXTERNAL_STORAGE",
        "android.permission.ACCESS_FINE_LOCATION",
        "android.permission.ACCESS_COARSE_LOCATION",
        "android.permission.ACCESS_NETWORK_STATE",
        "android.permission.ACCESS_WIFI_STATE",
        "android.permission.CHANGE_WIFI_MULTICAST_STATE",
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
      "expo-updates",
      "expo-sharing",
      ["@teincfood/rn-notifications", {}],
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
        "expo-camera",
        {
          cameraPermission:
            "$(PRODUCT_NAME) needs access to your camera to scan business QR codes.",
        },
      ],
      [
        "expo-document-picker",
        {
          iCloudContainerEnvironment: "Production",
        },
      ],
      ["expo-apple-authentication"],
      "./plugins/withModularHeaders",
      "./plugins/withAndroidNotificationIcons",
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
