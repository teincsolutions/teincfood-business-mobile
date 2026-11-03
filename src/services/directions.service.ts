import { mmkvStorage } from '@/utils/storage';
import { getDistance, getPreciseDistance } from 'geolib';
import { api } from './api';

const DIR_CACHE_KEY = (orderId: string, leg?: string) =>
  `directions_polyline_${orderId}${leg ? `_${leg}` : ""}`;
const REFRESH_THRESHOLD_METERS = 50;
const AVG_SPEED_MPS = 5.56; // ~20 km/h in m/s

export interface DirectionResult {
  polyline: string | null;
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
}: {
  orderId: string;
  origin: { latitude: number; longitude: number };
  destination: { latitude: number; longitude: number };
  /** Distinguishes the rider→pickup and pickup→customer legs for one order. */
  leg?: string;
}): Promise<DirectionResult> {
  const cacheStr = mmkvStorage.getString(DIR_CACHE_KEY(orderId, leg));
  let cache: {
    origin: { latitude: number; longitude: number };
    destination: { latitude: number; longitude: number };
    polyline: string;
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
      durationSeconds: cache.durationSeconds ?? null,
      staticDurationSeconds: cache.staticDurationSeconds ?? null,
      fromCache: true,
    };
  }

  try {
    const res = await api.post<{ data: { polyline: string; duration_seconds: number; static_duration_seconds: number } }>(
      '/routes/directions',
      { origin, destination },
    );
    const { polyline, duration_seconds, static_duration_seconds } = res.data ?? {};
    if (polyline) {
      mmkvStorage.set(
        DIR_CACHE_KEY(orderId, leg),
        JSON.stringify({ origin, destination, polyline, durationSeconds: duration_seconds, staticDurationSeconds: static_duration_seconds }),
      );
      return { polyline, durationSeconds: duration_seconds ?? null, staticDurationSeconds: static_duration_seconds ?? null, fromCache: false };
    }
    return { polyline: null, durationSeconds: null, staticDurationSeconds: null, fromCache: false };
  } catch (error) {
    console.error('Failed to get directions:', error);
    return { polyline: null, durationSeconds: null, staticDurationSeconds: null, fromCache: false };
  }
}
