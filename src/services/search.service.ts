import { useQuery } from '@tanstack/react-query';
import { mockBackend } from './mock-backend.service';

export function useSearchCatalogQuery(query: string) {
  return useQuery({
    queryKey: ['search-catalog', query],
    queryFn: () => mockBackend.searchCatalog(query),
    enabled: query.trim().length > 0,
  });
}
