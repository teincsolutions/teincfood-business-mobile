import { api } from './api';

export function useSearchCatalogQuery(query: string) {
  // Buyer-only feature
  return { data: null, isLoading: false };
}
