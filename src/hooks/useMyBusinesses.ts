import { useQuery } from '@tanstack/react-query';
import * as businessService from '@/services/business.service';
import type { UserInvitation } from '@/services/business.service';

export interface MyBusinessEntry {
  type: 'owned' | 'member' | 'rider' | 'fleet_invitation' | 'member_invitation';
  id: string;
  business_id: string;
  name: string;
  business_number: string;
  logo_url: string | null;
  status: string;
  role: string | null;
  invitation_id: string | null;
  code?: string | null;
}

function mapInvitation(inv: UserInvitation): MyBusinessEntry | null {
  if (!inv || !inv.type) {
    console.debug('[useMyBusinesses] mapInvitation: invalid invitation', inv);
    return null;
  }

  switch (inv.type) {
    case 'business_owner':
      return {
        type: 'owned',
        id: inv.id,
        business_id: inv.business_id!,
        name: inv.business_name || 'Unknown Business',
        business_number: '',
        logo_url: null,
        status: inv.status,
        role: 'owner',
        invitation_id: null,
      };
    case 'business_member':
      if (inv.status === 'accepted' || inv.status === 'active') {
        return {
          type: 'member',
          id: inv.id,
          business_id: inv.business_id!,
          name: inv.business_name || 'Unknown Business',
          business_number: '',
          logo_url: null,
          status: 'active',
          role: inv.role || 'member',
          invitation_id: inv.id,
        };
      }
      return {
        type: 'member_invitation',
        id: inv.id,
        business_id: inv.business_id!,
        name: inv.business_name || 'Unknown Business',
        business_number: '',
        logo_url: null,
        status: 'pending',
        role: inv.role || 'member',
        invitation_id: inv.id,
        code: inv.code,
      };
    case 'rider_linked':
      return {
        type: 'rider',
        id: inv.id,
        business_id: inv.business_id!,
        name: inv.business_name || 'Unknown Business',
        business_number: '',
        logo_url: null,
        status: 'active',
        role: 'rider',
        invitation_id: inv.id,
      };
    case 'fleet_rider':
      if (inv.status === 'pending') {
        return {
          type: 'fleet_invitation',
          id: inv.id,
          business_id: inv.business_id!,
          name: inv.business_name || 'Unknown Business',
          business_number: '',
          logo_url: null,
          status: 'pending',
          role: null,
          invitation_id: inv.id,
          code: inv.code,
        };
      }
      return null;
    default:
      return null;
  }
}

export function useMyBusinesses() {
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['businesses', 'relationships'],
    queryFn: async () => {
      const res = await businessService.fetchUserInvitations();
      return (res.data || []).map(mapInvitation).filter(Boolean) as MyBusinessEntry[];
    },
    staleTime: 1000 * 60 * 5,
  });

  return {
    entries: data || [],
    isLoading,
    refetchAll: refetch,
  };
}
