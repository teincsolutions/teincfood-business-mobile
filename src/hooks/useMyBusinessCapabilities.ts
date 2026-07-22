import { useQuery } from '@tanstack/react-query';
import * as businessService from '@/services/business.service';
import { useActiveBusiness } from './useActiveBusiness';

const MEMBERSHIP_KEYS = {
  all: ['my-membership'] as const,
  byBusiness: (id: string) => [...MEMBERSHIP_KEYS.all, id] as const,
};

export function useMyBusinessCapabilities() {
  const { activeBusinessId } = useActiveBusiness();

  return useQuery({
    queryKey: MEMBERSHIP_KEYS.byBusiness(activeBusinessId ?? ''),
    queryFn: () => businessService.fetchMyBusinessMembership(activeBusinessId!),
    enabled: !!activeBusinessId,
    staleTime: Infinity,
    select: (data) => ({
      role: data.data.role,
      source: data.data.source,
      capabilities: data.data.capabilities,
      status: data.data.status,
    }),
  });
}

export function useHasCapability(capability: string) {
  const { data: membership } = useMyBusinessCapabilities();
  return membership?.capabilities.includes(capability) ?? false;
}
