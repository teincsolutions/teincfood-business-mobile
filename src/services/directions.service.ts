import { accountStorage } from '@/utils/storage';
import { getDistance } from 'geolib';
import { api } from './api';

const DIR_CACHE_KEY = (orderId: string, leg?: string) =>
  `directions_polyline_${orderId}${leg ? `_${leg}` : ""}`;

const REFRESH_THRESHOLD_METERS = 50;
const AVG_SPEED_MPS = 5.56; // ~20 km/h in m/s

export interface DirectionResult {
  polyline: string | null;
  distanceMeters: number | null;
  durationSeconds: number | null;
  staticDurationSeconds: number | null;
  fromCache: boolean;
}

/**
 * Estimate ETA offline using straight-line distance and average speed.
 * Used as fallback when the Routes API is unavailable.
 */
export function estimateDurationSeconds(
  origin: { latitude: number; longitude: number },
  destination: { latitude: number; longitude: number },
): number {
  const distMeters = getDistance(origin, destination);
  return Math.ceil(distMeters / AVG_SPEED_MPS);
}

export async function getDirectionsPolyline({
  orderId,
  origin,
  destination,
  leg,
  cacheKey,
}: {
  orderId: string;
  origin: { latitude: number; longitude: number };
  destination: { latitude: number; longitude: number };
  /** Distinguishes the rider→pickup and pickup→customer legs for one order. */
  leg?: string;
  /** Stable key for ad-hoc routes such as turn-by-turn navigation. */
  cacheKey?: string;
}): Promise<DirectionResult> {
  const resolvedCacheKey = cacheKey ?? orderId;
  const cacheStr = accountStorage.getString(DIR_CACHE_KEY(resolvedCacheKey, leg));
  let cache: {
    origin: { latitude: number; longitude: number };
    destination: { latitude: number; longitude: number };
    polyline: string;
    distanceMeters?: number;
    durationSeconds?: number;
    staticDurationSeconds?: number;
  } | null = null;
  if (cacheStr) {
    try {
      cache = JSON.parse(cacheStr);
    } catch {}
  }

  if (
    cache &&
    getDistance(origin, cache.origin) <= REFRESH_THRESHOLD_METERS &&
    cache.destination.latitude === destination.latitude &&
    cache.destination.longitude === destination.longitude
  ) {
    return {
      polyline: cache.polyline,
      distanceMeters: cache.distanceMeters ?? null,
      durationSeconds: cache.durationSeconds ?? null,
      staticDurationSeconds: cache.staticDurationSeconds ?? null,
      fromCache: true,
    };
  }

  try {
    const res = await api.post<{
      data: {
        polyline: string;
        distance_meters: number;
        duration_seconds: number;
        static_duration_seconds: number;
        is_from_cache?: boolean;
      };
    }>('/routes/directions', { origin, destination });
    const {
      polyline,
      distance_meters,
      duration_seconds,
      static_duration_seconds,
    } = res.data ?? {};
    if (polyline) {
      accountStorage.set(
        DIR_CACHE_KEY(resolvedCacheKey, leg),
        JSON.stringify({
          origin,
          destination,
          polyline,
          distanceMeters: distance_meters,
          durationSeconds: duration_seconds,
          staticDurationSeconds: static_duration_seconds,
        }),
      );
      return {
        polyline,
        distanceMeters: distance_meters ?? null,
        durationSeconds: duration_seconds ?? null,
        staticDurationSeconds: static_duration_seconds ?? null,
        fromCache: false,
      };
    }
    return {
      polyline: null,
      distanceMeters: null,
      durationSeconds: null,
      staticDurationSeconds: null,
      fromCache: false,
    };
  } catch (error) {
    console.error('Failed to get directions:', error);
    return {
      polyline: null,
      distanceMeters: null,
      durationSeconds: null,
      staticDurationSeconds: null,
      fromCache: false,
    };
  }
}
