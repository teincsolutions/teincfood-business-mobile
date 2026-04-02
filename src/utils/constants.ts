/**
 * Application-wide constants.
 */

/** Base URL for the API — will be swapped per environment */
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000/api';

/** App metadata */
export const APP_NAME = 'TeincFoods';
export const APP_VERSION = '1.0.0';

/** Async storage keys */
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  REFRESH_TOKEN: 'refresh_token',
  USER_PROFILE: 'user_profile',
  HAS_SEEN_ONBOARDING: 'has_seen_onboarding',
  THEME_PREFERENCE: 'theme_preference',
  BUSINESS_DATA: 'business_data',
  FLEET_DATA: 'fleet_data',
} as const;

/** OTP configuration */
export const OTP_LENGTH = 4;
export const OTP_RESEND_DELAY_SECONDS = 60;

/** Pagination defaults */
export const DEFAULT_PAGE_SIZE = 20;
