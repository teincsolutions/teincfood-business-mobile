import { api } from './api';

export function useHomeFeedQuery(category: string) {
  // Buyer-only feature
  return { data: null, isLoading: false };
}
