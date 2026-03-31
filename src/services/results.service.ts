import { useQuery } from '@tanstack/react-query';
import { mockBackend } from './mock-backend.service';

export function useResultsQuery(type: string) {
  return useQuery({
    queryKey: ['results', type],
    queryFn: () => mockBackend.getResults(type),
  });
}
