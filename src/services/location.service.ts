import { useMutation } from '@tanstack/react-query';
import { api } from './api';

export const locationService = {
  setUserLocation(payload: {
    latitude: number;
    longitude: number;
    city?: string;
    area?: string;
    countryCode?: string;
    placeId?: string;
  }) {
    return api.post('/locations', payload);
  },
};

export function useSetUserLocationMutation() {
  return useMutation({
    mutationFn: (payload: Parameters<typeof locationService.setUserLocation>[0]) =>
      locationService.setUserLocation(payload),
  });
}
