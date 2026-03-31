import { useQuery } from '@tanstack/react-query';
import { mockBackend } from './mock-backend.service';

export function useFoodByIdQuery(foodId: string) {
  return useQuery({
    queryKey: ['food-by-id', foodId],
    queryFn: () => mockBackend.getFoodById(foodId),
    enabled: Boolean(foodId),
  });
}
