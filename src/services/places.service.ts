import { accountStorage, clearAccountStoragePrefix } from '@/utils/storage';
import { api } from './api';

export interface PlaceSuggestion {
  placeId: string;
  description: string;
  mainText: string;
  secondaryText: string;
}

export interface PlaceDetails {
  placeId: string;
  formattedAddress: string;
  street: string;
  city: string;
  region: string;
  postalCode: string;
  country: string;
  countryCode?: string;
  latitude: number;
  longitude: number;
}

const PLACES_CACHE_KEYS = {
  SUGGESTIONS: 'places_suggestions_',
  DETAILS: 'places_details_v1_',
};

const SUGGESTIONS_TTL = 30 * 24 * 60 * 60 * 1000;
const DETAILS_TTL = 90 * 24 * 60 * 60 * 1000;

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

function isExpired(timestamp: number, ttl: number): boolean {
  return Date.now() - timestamp > ttl;
}

function getFromCache<T>(key: string): T | null {
  const json = accountStorage.getString(key);
  if (!json) return null;
  try {
    const entry: CacheEntry<T> = JSON.parse(json);
    const ttl = key.startsWith(PLACES_CACHE_KEYS.SUGGESTIONS) ? SUGGESTIONS_TTL : DETAILS_TTL;
    if (isExpired(entry.timestamp, ttl)) {
      accountStorage.delete(key);
      return null;
    }
    return entry.data;
  } catch {
    return null;
  }
}

function setToCache<T>(key: string, data: T): void {
  const entry: CacheEntry<T> = { data, timestamp: Date.now() };
  accountStorage.set(key, JSON.stringify(entry));
}

function normalizePlaceId(placeRef: string): string {
  if (!placeRef) return '';
  return placeRef.startsWith('places/') ? placeRef.replace(/^places\//, '') : placeRef;
}

const COUNTRY_CODES: Record<string, string> = {
  'ghana': 'GH',
  'nigeria': 'NG',
  'kenya': 'KE',
  'south africa': 'ZA',
  'united states': 'US',
  'united kingdom': 'GB',
  'canada': 'CA',
  'australia': 'AU',
  'germany': 'DE',
  'france': 'FR',
  'netherlands': 'NL',
  'spain': 'ES',
  'italy': 'IT',
  'portugal': 'PT',
  'brazil': 'BR',
  'india': 'IN',
  'china': 'CN',
  'japan': 'JP',
  'uganda': 'UG',
  'tanzania': 'TZ',
  'rwanda': 'RW',
  'ethiopia': 'ET',
  "côte d'ivoire": 'CI',
  'ivory coast': 'CI',
  'senegal': 'SN',
  'mali': 'ML',
  'cameroon': 'CM',
};

function resolveCountryCode(apiCountryCode: string | undefined, countryName: string): string | undefined {
  if (apiCountryCode) return apiCountryCode.toUpperCase();
  return COUNTRY_CODES[countryName.trim().toLowerCase()] || undefined;
}

function parseAddressParts(formattedAddress: string) {
  const parts = formattedAddress.split(',').map(s => s.trim()).filter(Boolean);
  const len = parts.length;
  return {
    street: len > 3 ? parts.slice(0, len - 3).join(', ') : len > 0 ? parts[0] : '',
    city: len > 2 ? parts[len - 3] : len > 1 ? parts[0] : '',
    region: len > 2 ? parts[len - 2] : '',
    country: len > 0 ? parts[len - 1] : '',
  };
}

export interface ReverseGeocodeResult {
  placeId: string;
  formattedAddress: string;
  name: string;
  city: string;
  region: string;
  country: string;
  countryCode?: string;
  latitude: number;
  longitude: number;
}

export const placesService = {
  async searchPlaces(query: string, lat?: number, lng?: number): Promise<PlaceSuggestion[]> {
    if (!query || query.length < 1) return [];

    const cacheKey = `${PLACES_CACHE_KEYS.SUGGESTIONS}${query.toLowerCase()}`;
    const cached = getFromCache<PlaceSuggestion[]>(cacheKey);
    if (cached) return cached;

    try {
      const params: Record<string, string> = { input: query };
      if (lat !== undefined) params.latitude = String(lat);
      if (lng !== undefined) params.longitude = String(lng);

      const res = await api.get<{ data: any[] }>('/places/autocomplete', { params });
      const suggestions: PlaceSuggestion[] = (res.data || []).map((item: any) => ({
        placeId: item.place_id,
        description: item.formatted_address || '',
        mainText: item.primary_text || '',
        secondaryText: item.secondary_text || '',
      }));

      setToCache(cacheKey, suggestions);
      return suggestions;
    } catch {
      return [];
    }
  },

  async getPlaceDetails(placeId: string): Promise<PlaceDetails | null> {
    const normalizedPlaceId = normalizePlaceId(placeId);
    const cacheKey = `${PLACES_CACHE_KEYS.DETAILS}${normalizedPlaceId}`;
    const cached = getFromCache<PlaceDetails>(cacheKey);
    if (cached) return cached;

    try {
      const res = await api.get<{ data: any }>('/places/details', {
        params: { place_id: normalizedPlaceId },
      });

      const detail = res.data;
      if (!detail) return null;

      const latitude = Number(detail.latitude) || 0;
      const longitude = Number(detail.longitude) || 0;
      const formattedAddress = detail.formatted_address || '';
      const parsed = parseAddressParts(formattedAddress);

      const details: PlaceDetails = {
        placeId: detail.place_id || normalizedPlaceId,
        formattedAddress,
        street: parsed.street,
        city: parsed.city,
        region: parsed.region,
        postalCode: '',
        country: parsed.country,
        countryCode: resolveCountryCode(detail.country_code, parsed.country),
        latitude,
        longitude,
      };

      setToCache(cacheKey, details);
      return details;
    } catch {
      return null;
    }
  },

  async reverseGeocode(lat: number, lng: number): Promise<ReverseGeocodeResult | null> {
    try {
      const res = await api.get<any>('/places/reverse-geocode', {
        params: { latitude: String(lat), longitude: String(lng) },
      });

      const result = res?.data ?? res;
      if (!result) return null;

      const formattedAddress = result.full_address || result.formatted_address || '';
      const street = result.street || result.name || '';
      const city = result.city || '';
      const region = result.region || '';
      const country = result.country || '';
      const countryCode = result.country_code || result.countryCode || undefined;
      const latitude = Number(result.latitude) || 0;
      const longitude = Number(result.longitude) || 0;

      return {
        placeId: result.place_id || result.placeId || '',
        formattedAddress,
        name: street || formattedAddress,
        city,
        region,
        country,
        countryCode,
        latitude,
        longitude,
      };
    } catch {
      return null;
    }
  },

  clearCache(): void {
    clearAccountStoragePrefix('places_');
  },
};
