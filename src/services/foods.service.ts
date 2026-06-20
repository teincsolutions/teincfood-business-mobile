import { api } from './api';

export function useFoodByIdQuery(foodId: string) {
  // Buyer-only feature
  return { data: null, isLoading: false };
}
