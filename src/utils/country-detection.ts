import { NativeModules, Platform } from "react-native";
import { getCountryOption } from "@teincfood/core";

export const DEFAULT_COUNTRY_ISO = "GH";

function regionFromLocaleTag(tag: string | null | undefined): string | null {
  if (!tag) return null;
  const normalized = tag.replace(/_/g, "-");
  try {
    const region = new Intl.Locale(normalized).region;
    if (region) return region.toUpperCase();
  } catch {
    // Older Hermes builds may not expose Intl.Locale.
  }
  const parts = normalized.split("-");
  for (let index = parts.length - 1; index > 0; index -= 1) {
    if (/^[A-Za-z]{2}$/.test(parts[index])) {
      return parts[index].toUpperCase();
    }
  }
  return null;
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
 * Detects the device region without requesting location permission and without
 * adding a native dependency (so it can ship over OTA). Unsupported regions
 * fall back to Ghana, matching the product's primary market.
 */
export function detectCountryIso(
  fallback: string = DEFAULT_COUNTRY_ISO,
): string {
  for (const tag of deviceLocaleTags()) {
    const region = regionFromLocaleTag(tag);
    if (region && getCountryOption(region)) return region;
  }
  return fallback;
}
