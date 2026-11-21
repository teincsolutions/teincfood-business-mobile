import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { ensureDeviceLease } from '@teincfood/core';
import { useBusinessStore } from '@/stores/business.store';

export function useActiveBusiness() {
  const queryClient = useQueryClient();

  const businesses = useBusinessStore((s) => s.businesses);
  const activeBusiness = useBusinessStore((s) => s.activeBusiness);
  const setActiveBusiness = useBusinessStore((s) => s.setActiveBusiness);
  const hasMultiple = useBusinessStore((s) => s.hasMultipleBusinesses);

  const activeBusinessId = activeBusiness?.id ?? null;
  const hasBusiness = businesses.length > 0;

  const switchBusiness = useCallback(
    (businessId: string) => {
      const business = businesses.find((b) => b.id === businessId) ?? null;
      if (business) {
        setActiveBusiness(business as any);
        void ensureDeviceLease(businessId).catch((error) => {
          console.debug('[useActiveBusiness] device lease failed', businessId, error);
        });
        queryClient.invalidateQueries({ queryKey: ['seller'] });
        queryClient.invalidateQueries({ queryKey: ['fleet'] });
        queryClient.invalidateQueries({ queryKey: ['orders'] });
        queryClient.invalidateQueries({ queryKey: ['menu'] });
      }
    },
    [businesses, setActiveBusiness, queryClient],
  );

  return {
    activeBusiness,
    activeBusinessId,
    businesses,
    hasBusiness,
    hasMultiple: hasMultiple(),
    switchBusiness,
  };
}
