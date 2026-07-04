import { useQueries } from '@tanstack/react-query';
import * as businessService from '@/services/business.service';
import { useUserInvitationsQuery } from '@/hooks/useInvitations';
import type { BusinessMembership } from '@/types/api';
import type { Business } from '@/types/api';

export interface MyBusinessEntry {
  type: 'owned' | 'member';
  id: string;
  business_id: string;
  name: string;
  business_number: string;
  logo_url: string | null;
  status: string;
  role: string | null;
  invitation_id: string | null;
}

export function useMyBusinesses() {
  const queries = useQueries({
    queries: [
      {
        queryKey: ['businesses', 'mine'],
        queryFn: async () => {
          const res = await businessService.fetchMyBusinesses();
          return res.data || [];
        },
        staleTime: 1000 * 60 * 5,
      },
      {
        queryKey: ['businesses', 'memberships'],
        queryFn: async () => {
          const res = await businessService.fetchMyMemberships();
          return res.data || [];
        },
        staleTime: 1000 * 60 * 5,
      },
    ],
  });

  const { data: invitations } = useUserInvitationsQuery();

  const [ownedRes, membershipsRes] = queries;
  const owned = (ownedRes.data || []) as Business[];
  const memberships = ((membershipsRes.data || []) as BusinessMembership[]).filter(
    (m) => m.source !== 'owner',
  );

  const joinedInvitations = (invitations?.data || []).filter(
    (inv: { status: string }) => inv.status === 'accepted' || inv.status === 'active',
  );

  const entries: MyBusinessEntry[] = [
    ...owned.map((b) => ({
      type: 'owned' as const,
      id: `owned_${b.id}`,
      business_id: b.id,
      name: b.name,
      business_number: b.business_number,
      logo_url: b.logo_url,
      status: b.status,
      role: 'owner' as const,
      invitation_id: null,
    })),
    ...memberships.map((m) => {
      const inv = joinedInvitations.find(
        (i: { business_id?: string | null; type?: string }) => i.business_id === m.business.id && i.type === 'business_member',
      );
      return {
        type: 'member' as const,
        id: `member_${m.business.id}`,
        business_id: m.business.id,
        name: m.business.name,
        business_number: m.business.business_number,
        logo_url: m.business.logo_url,
        status: m.status,
        role: m.role,
        invitation_id: inv?.id || null,
      };
    }),
  ];

  const isLoading = queries.some((q) => q.isLoading);

  return {
    entries,
    isLoading,
    owned,
    memberships,
    refetchAll: () => queries.forEach((q) => q.refetch()),
  };
}
