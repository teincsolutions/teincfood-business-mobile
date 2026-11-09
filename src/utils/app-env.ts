/**
 * Build-time environment classification for Expo/EAS releases.
 *
 * `EXPO_PUBLIC_APP_ENV` comes from `.env`, `.env.production` or the EAS
 * profile. Anything without an explicit non-production label is treated as
 * production so a missing variable never exposes internal tools.
 */
const rawEnv = (process.env.EXPO_PUBLIC_APP_ENV ?? "").trim().toLowerCase();

export const APP_ENV =
  rawEnv === "development" ||
  rawEnv === "testing" ||
  rawEnv === "staging" ||
  rawEnv === "production"
    ? rawEnv
    : "production";

/**
 * Diagnostics are available in development/testing/staging. A production
 * build can opt in explicitly with `EXPO_PUBLIC_ENABLE_DIAGNOSTICS=true`.
 */
const diagnosticsOverride = process.env.EXPO_PUBLIC_ENABLE_DIAGNOSTICS;

export const DIAGNOSTICS_ENABLED =
  diagnosticsOverride === "true" ||
  (diagnosticsOverride !== "false" && APP_ENV !== "production");
