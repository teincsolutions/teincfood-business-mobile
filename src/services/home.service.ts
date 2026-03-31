import { useQuery } from '@tanstack/react-query';
import { mockBackend } from './mock-backend.service';

export function useHomeFeedQuery(category: string) {
  return useQuery({
    queryKey: ['home-feed', category],
    queryFn: () => mockBackend.getHomeFeed(category),
  });
}
