import Constants from "expo-constants";

/**
 * Application-wide constants.
 */

/** Base URL for the API — will be swapped per environment */
export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:4000/api/v1";

/** WebSocket URL for Phoenix Channels */
export const WS_BASE_URL =
  process.env.EXPO_PUBLIC_WS_URL ?? "ws://localhost:4000";

/** Entitlement HMAC secret — verifies the cached subscription envelope.
 * Must match backend ENTITLEMENT_HMAC_SECRET. */
export const ENTITLEMENT_HMAC_SECRET =
  process.env.EXPO_PUBLIC_ENTITLEMENT_SECRET ?? null;

/** App metadata */
export const APP_NAME = "Teinc Food Business";
export const APP_VERSION = "1.0.0";

/** Async storage keys */
export const STORAGE_KEYS = {
  AUTH_TOKEN: "auth_token",
  REFRESH_TOKEN: "refresh_token",
  USER_PROFILE: "user_profile",
  HAS_SEEN_ONBOARDING: "has_seen_onboarding",
  THEME_PREFERENCE: "theme_preference",
  BUSINESS_DATA: "business_data",
  FLEET_DATA: "fleet_data",
  LOCAL_NODE_DATA: "local_node_data",
  PRINTER_SETTINGS: "printer_settings",
} as const;

/** Chat storage keys */
export const CHAT_STORAGE_KEYS = {
  MESSAGES: "chat_messages",
  OUTBOX: "chat_outbox",
} as const;

/** Chat configuration */
export const CHAT_CONFIG = {
  HEARTBEAT_INTERVAL_MS: 15_000,
  HEARTBEAT_TIMEOUT_MS: 10_000,
  RECONNECT_BASE_DELAY_MS: 1_000,
  RECONNECT_MAX_DELAY_MS: 30_000,
  RECONNECT_MAX_ATTEMPTS: 10,
  TYPING_TIMEOUT_MS: 3_000,
  MESSAGE_PAGE_SIZE: 50,
} as const;

/** OTP configuration */
export const OTP_LENGTH = 4;
export const OTP_RESEND_DELAY_SECONDS = 60;

/** Pagination defaults */
export const DEFAULT_PAGE_SIZE = 20;

/**
 * Max time the Sync Engine waits for a cloud command before treating the cloud
 * as unreachable and falling back to the Local Node or the offline outbox.
 * Keeps the terminal responsive (fast) even when the internet is slow.
 */
export const CLOUD_COMMAND_TIMEOUT_MS = 2_500;

// Access the version safely using optional chaining
export const appVersion = Constants.expoConfig?.version;
