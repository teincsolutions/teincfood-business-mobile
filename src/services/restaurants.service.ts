import { useQuery } from '@tanstack/react-query';
import { mockBackend } from './mock-backend.service';

export function useRestaurantStorefrontQuery(restaurantId: string, query: string) {
  return useQuery({
    queryKey: ['restaurant-storefront', restaurantId, query],
    queryFn: () => mockBackend.getRestaurantStorefront(restaurantId, query),
    enabled: Boolean(restaurantId),
  });
}
