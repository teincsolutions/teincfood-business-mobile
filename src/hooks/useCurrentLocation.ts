import { useState, useCallback } from 'react';
import * as Location from 'expo-location';
import { Alert } from 'react-native';
import type { PlaceDetails } from '@/services/places.service';
import { placesService } from '@/services/places.service';

interface UseCurrentLocationReturn {
  isLocating: boolean;
  error: string | null;
  getCurrentLocation: () => Promise<PlaceDetails | null>;
  clearError: () => void;
}

export function useCurrentLocation(): UseCurrentLocationReturn {
  const [isLocating, setIsLocating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => setError(null), []);

  const getCurrentLocation = useCallback(async (): Promise<PlaceDetails | null> => {
    try {
      setIsLocating(true);
      setError(null);

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Location Permission Needed',
          'Please allow location access so we can show nearby restaurants and delivery options.',
        );
        throw new Error('LOCATION_PERMISSION_DENIED');
      }

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const { latitude, longitude } = loc.coords;

      const geocode = await placesService.reverseGeocode(latitude, longitude);

      if (geocode && geocode.formattedAddress) {
        const placeId = `gps_${Date.now()}`;
        const place: PlaceDetails = {
          placeId: geocode.placeId || placeId,
          formattedAddress: geocode.formattedAddress,
          street: geocode.name || geocode.formattedAddress,
          city: geocode.city || "",
          region: geocode.region || "",
          postalCode: "",
          country: geocode.country || "",
          countryCode: geocode.countryCode,
          latitude: geocode.latitude,
          longitude: geocode.longitude,
        };
        return place;
      }

      const fallbackPlaceId = `gps_${Date.now()}`;
      const fallback: PlaceDetails = {
        placeId: fallbackPlaceId,
        formattedAddress: `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`,
        street: '',
        city: '',
        region: '',
        postalCode: '',
        country: '',
        countryCode: undefined,
        latitude,
        longitude,
      };
      return fallback;
    } catch (err) {
      if (err instanceof Error && err.message === 'LOCATION_PERMISSION_DENIED') {
        Alert.alert(
          'Location Permission Needed',
          'Please allow location access so we can show nearby restaurants and delivery options.',
        );
      }
      setError('Could not detect your location. Please search manually.');
      return null;
    } finally {
      setIsLocating(false);
    }
  }, []);

  return { isLocating, error, getCurrentLocation, clearError };
}
