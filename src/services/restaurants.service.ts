import { api } from './api';

export function useRestaurantStorefrontQuery(restaurantId: string, query: string) {
  // Buyer-only feature
  return { data: null, isLoading: false };
}
