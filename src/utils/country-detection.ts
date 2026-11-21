import { NativeModules, Platform } from "react-native";
import { getCountryOption } from "@teincfood/core";

export const DEFAULT_COUNTRY_ISO = "GH";

type CountryDetectionSource = "device" | "fallback";
type CountrySelectionSource = CountryDetectionSource | "manual";

export interface CountrySelection {
  iso: string;
  source: CountrySelectionSource;
}

/**
 * Locale is a weak "where is this device?" signal because tablets are often
 * shipped with `en-US` regardless of their actual market. Only trust it for
 * the business app's primary African markets; timezone remains authoritative
 * for every region it maps (including US/CA/EU).
 */
const LOCALE_TRUSTED_COUNTRY_ISOS = new Set(["GH", "NG", "KE", "ZA", "CI", "RW"]);

/**
 * Region inferred from the device timezone. Timezone is a much better signal
 * than locale for "where is this device?" — a phone in Ghana is frequently set
 * to English (United States), so checking locale first would select US even
 * though the user is in Ghana.
 */
const TIMEZONE_COUNTRY: Record<string, string> = {
  // Ghana
  "Africa/Accra": "GH",
  // Nigeria
  "Africa/Lagos": "NG",
  // Kenya
  "Africa/Nairobi": "KE",
  // South Africa
  "Africa/Johannesburg": "ZA",
  // United States
  "America/New_York": "US",
  "America/Chicago": "US",
  "America/Denver": "US",
  "America/Phoenix": "US",
  "America/Los_Angeles": "US",
  "America/Anchorage": "US",
  "America/Detroit": "US",
  "America/Indiana/Indianapolis": "US",
  "America/Boise": "US",
  "America/Juneau": "US",
  "America/Sitka": "US",
  "Pacific/Honolulu": "US",
  // Canada
  "America/Toronto": "CA",
  "America/Vancouver": "CA",
  "America/Edmonton": "CA",
  "America/Winnipeg": "CA",
  "America/Halifax": "CA",
  "America/St_Johns": "CA",
  "America/Regina": "CA",
  "America/Moncton": "CA",
  "America/Glace_Bay": "CA",
  "America/Goose_Bay": "CA",
  "America/Whitehorse": "CA",
  "America/Yellowknife": "CA",
  "America/Iqaluit": "CA",
  // United Kingdom
  "Europe/London": "GB",
  // India
  "Asia/Kolkata": "IN",
  "Asia/Calcutta": "IN",
  // Germany
  "Europe/Berlin": "DE",
  "Europe/Busingen": "DE",
  // France
  "Europe/Paris": "FR",
  // Italy
  "Europe/Rome": "IT",
  // Spain
  "Europe/Madrid": "ES",
  "Atlantic/Canary": "ES",
  // United Arab Emirates
  "Asia/Dubai": "AE",
  // Saudi Arabia
  "Asia/Riyadh": "SA",
};

function countryFromTimezone(): string | null {
  try {
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (!timeZone) return null;
    const iso = TIMEZONE_COUNTRY[timeZone];
    if (iso && getCountryOption(iso)) return iso;
  } catch {
    // Intl is best-effort on older Hermes builds.
  }
  return null;
}

function regionsFromLocaleTag(tag: string | null | undefined): string[] {
  if (!tag) return [];

  const normalized = tag.replace(/_/g, "-");
  const regions = new Set<string>();

  try {
    const region = new Intl.Locale(normalized).region;
    if (region) regions.add(region.toUpperCase());
  } catch {
    // Older Hermes builds may not expose Intl.Locale.
  }

  // Strip Unicode extensions before scanning so `en-US-u-hc-h12` does not
  // mistake the `h12`/`hc` subtags for a region.
  const base = normalized.split("-u-")[0].split("-x-")[0];
  const parts = base.split("-");
  for (let index = parts.length - 1; index > 0; index -= 1) {
    if (/^[A-Za-z]{2}$/.test(parts[index])) {
      regions.add(parts[index].toUpperCase());
    }
  }

  return [...regions];
}

function deviceLocaleTags(): string[] {
  const tags: string[] = [];
  try {
    if (Platform.OS === "ios") {
      const settings = NativeModules.SettingsManager?.settings;
      if (Array.isArray(settings?.AppleLanguages)) {
        tags.push(...settings.AppleLanguages.filter(Boolean));
      }
      if (settings?.AppleLocale) tags.push(settings.AppleLocale);
    } else {
      const i18n = NativeModules.I18nManager;
      const identifier =
        i18n?.localeIdentifier ?? i18n?.getConstants?.()?.localeIdentifier;
      if (identifier) tags.push(identifier);
    }
  } catch {
    // Native locale access is best-effort; Intl below is the fallback.
  }

  try {
    tags.push(Intl.DateTimeFormat().resolvedOptions().locale);
  } catch {}
  return tags;
}

/**
 * Best synchronous guess at the device's country: timezone first, then a
 * deliberately narrow locale list. Unsupported regions fall back to Ghana,
 * matching the product's primary market.
 */
export function detectCountrySelection(
  fallback: string = DEFAULT_COUNTRY_ISO,
): CountrySelection {
  const timezoneCountry = countryFromTimezone();
  if (timezoneCountry) return { iso: timezoneCountry, source: "device" };

  for (const tag of deviceLocaleTags()) {
    for (const region of regionsFromLocaleTag(tag)) {
      if (
        LOCALE_TRUSTED_COUNTRY_ISOS.has(region) &&
        getCountryOption(region)
      ) {
        return { iso: region, source: "device" };
      }
    }
  }
  return { iso: fallback, source: "fallback" };
}

export function detectCountryIso(
  fallback: string = DEFAULT_COUNTRY_ISO,
): string {
  return detectCountrySelection(fallback).iso;
}

/**
 * Returns the persisted country only when it was explicitly chosen or
 * device-detected by a recent build. Legacy `locale` values (older builds
 * trusted `en-US` blindly) and missing sources must not override the Ghana
 * default forever.
 */
export function persistedCountryIso(
  location:
    | { countryCode?: string; countrySource?: string }
    | null
    | undefined,
): string | null {
  if (!location?.countrySource || location.countrySource === "locale") {
    return null;
  }
  const iso = location.countryCode?.trim().toUpperCase();
  if (!iso || !getCountryOption(iso)) return null;
  return iso;
}

export function getInitialCountrySelection(
  location:
    | { countryCode?: string; countrySource?: string }
    | null
    | undefined,
): CountrySelection {
  const persisted = persistedCountryIso(location);
  if (persisted) {
    return {
      iso: persisted,
      source: location?.countrySource === "manual" ? "manual" : "device",
    };
  }
  return detectCountrySelection();
}

export function getInitialCountryIso(
  location:
    | { countryCode?: string; countrySource?: string }
    | null
    | undefined,
): string {
  return getInitialCountrySelection(location).iso;
}
