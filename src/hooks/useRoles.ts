import { useQuery } from '@tanstack/react-query';
import * as rolesService from '@/services/roles.service';

const ROLES_KEYS = {
  all: ['business-roles'] as const,
};

export function useBusinessRolesQuery(enabled = true) {
  return useQuery({
    queryKey: ROLES_KEYS.all,
    queryFn: () => rolesService.fetchBusinessRoles(),
    staleTime: Infinity,
    enabled,
  });
}
