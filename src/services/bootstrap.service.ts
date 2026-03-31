import { useQuery } from '@tanstack/react-query';
import { mockBackend } from './mock-backend.service';

const BOOTSTRAP_QUERY_KEY = ['bootstrap'];

export function useBootstrapQuery() {
  return useQuery({
    queryKey: BOOTSTRAP_QUERY_KEY,
    queryFn: () => mockBackend.getBootstrap(),
  });
}
