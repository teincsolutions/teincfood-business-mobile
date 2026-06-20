import { api } from './api';

export function useResultsQuery(type: string) {
  // Buyer-only feature
  return { data: null, isLoading: false };
}
