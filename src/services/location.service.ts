import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { SetLocationRequest } from './backend-contracts.types';
import { mockBackend } from './mock-backend.service';

export function useSetUserLocationMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: SetLocationRequest) => mockBackend.setUserLocation(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bootstrap'] });
      queryClient.invalidateQueries({ queryKey: ['home-feed'] });
      queryClient.invalidateQueries({ queryKey: ['results'] });
      queryClient.invalidateQueries({ queryKey: ['search-catalog'] });
      queryClient.invalidateQueries({ queryKey: ['restaurant-storefront'] });
    },
  });
}
