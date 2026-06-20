import { mmkvStorage } from '@/utils/storage';
import { getDistance } from 'geolib';
import { api } from './api';

const DIR_CACHE_KEY = (orderId: string) => `directions_polyline_${orderId}`;
const REFRESH_THRESHOLD_METERS = 50;

export async function getDirectionsPolyline({
  orderId,
  origin,
  destination,
}: {
  orderId: string;
  origin: { latitude: number; longitude: number };
  destination: { latitude: number; longitude: number };
}): Promise<{ polyline: string | null; fromCache: boolean }> {
  const cacheStr = mmkvStorage.getString(DIR_CACHE_KEY(orderId));
  let cache: {
    origin: { latitude: number; longitude: number };
    destination: { latitude: number; longitude: number };
    polyline: string;
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
    return { polyline: cache.polyline, fromCache: true };
  }

  try {
    const res = await api.post<{ data: { polyline: string } }>('/routes/directions', { origin, destination });
    const polyline = res.data?.polyline;
    if (polyline) {
      mmkvStorage.set(
        DIR_CACHE_KEY(orderId),
        JSON.stringify({ origin, destination, polyline }),
      );
      return { polyline, fromCache: false };
    }
    return { polyline: null, fromCache: false };
  } catch (error) {
    console.error('Failed to get directions:', error);
    return { polyline: null, fromCache: false };
  }
}
