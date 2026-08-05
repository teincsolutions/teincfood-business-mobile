import { useQuery } from '@tanstack/react-query';
import * as rolesService from '@/services/roles.service';
import type { RolesResponse } from '@/services/roles.service';
import { useReferenceData } from '@/reference/hooks';
import { useBusinessStore } from '@/stores/business.store';

const ROLES_KEYS = {
  all: ['business-roles'] as const,
  forBusiness: (businessId?: string) =>
    [...ROLES_KEYS.all, businessId] as const,
};

export function useBusinessRolesQuery(enabled = true) {
  const businessId = useBusinessStore((s) => s.activeBusiness?.id);
  const cached = useReferenceData<RolesResponse>("roles");

  return useQuery({
    queryKey: ROLES_KEYS.forBusiness(businessId),
    queryFn: () => rolesService.fetchBusinessRoles(),
    staleTime: Infinity,
    enabled,
    placeholderData: cached.data?.payload,
  });
}
