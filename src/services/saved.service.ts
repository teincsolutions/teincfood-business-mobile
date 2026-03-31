import { useQuery } from '@tanstack/react-query';
import { mockBackend } from './mock-backend.service';

export function useSavedCatalogQuery(savedFoodIds: string[], savedRestaurantIds: string[]) {
  return useQuery({
    queryKey: ['saved-catalog', savedFoodIds, savedRestaurantIds],
    queryFn: () => mockBackend.getSavedCatalog(savedFoodIds, savedRestaurantIds),
  });
}
