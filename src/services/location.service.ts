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
