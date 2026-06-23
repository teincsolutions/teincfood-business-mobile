import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as businessService from '@/services/business.service';
import { useBusinessStore } from '@/stores/business.store';
import { toast } from 'sonner-native';
import { extractApiErrorMessage } from '@/utils/error';

const MEMBER_KEYS = {
  all: ['business-members'] as const,
  list: (businessId: string) => [...MEMBER_KEYS.all, businessId] as const,
};

export function useBusinessMembersQuery() {
  const activeBusinessId = useBusinessStore((s) => s.activeBusiness?.id);

  return useQuery({
    queryKey: MEMBER_KEYS.list(activeBusinessId ?? ''),
    queryFn: () => businessService.fetchBusinessMembers(activeBusinessId!),
    enabled: Boolean(activeBusinessId),
  });
}

export function useInviteMemberMutation() {
  const queryClient = useQueryClient();
  const activeBusinessId = useBusinessStore((s) => s.activeBusiness?.id);

  return useMutation({
    mutationFn: (data: { email?: string; phone?: string; role?: string }) =>
      businessService.inviteBusinessMember(activeBusinessId!, data),

    onSuccess: () => {
      toast.success('Invitation sent!');
      queryClient.invalidateQueries({ queryKey: MEMBER_KEYS.list(activeBusinessId ?? '') });
    },

    onError: (error) => {
      toast.error(extractApiErrorMessage(error));
    },
  });
}

export function useRemoveMemberMutation() {
  const queryClient = useQueryClient();
  const activeBusinessId = useBusinessStore((s) => s.activeBusiness?.id);

  return useMutation({
    mutationFn: (userId: string) =>
      businessService.removeBusinessMember(activeBusinessId!, userId),

    onSuccess: () => {
      toast.success('Member removed');
      queryClient.invalidateQueries({ queryKey: MEMBER_KEYS.list(activeBusinessId ?? '') });
    },

    onError: (error) => {
      toast.error(extractApiErrorMessage(error));
    },
  });
}
