import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as fleetService from '@/services/fleet.service';
import * as businessService from '@/services/business.service';
import { toast } from 'sonner-native';
import { extractApiErrorMessage } from '@/utils/error';

const INVITATION_KEYS = {
  all: ['invitations'] as const,
  list: () => [...INVITATION_KEYS.all, 'list'] as const,
};

export function useUserInvitationsQuery() {
  return useQuery({
    queryKey: INVITATION_KEYS.list(),
    queryFn: () => businessService.fetchUserInvitations(),
    staleTime: 15000,
  });
}

export function useLeaveBusinessMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (invitationId: string) => businessService.leaveBusiness(invitationId),
    onSuccess: () => {
      toast.success('Left the business');
      queryClient.invalidateQueries({ queryKey: INVITATION_KEYS.list() });
    },
    onError: (error) => {
      toast.error(extractApiErrorMessage(error));
    },
  });
}

export function useAcceptFleetInvitationMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { code: string }) => fleetService.acceptFleetInvitation(data),
    onSuccess: () => {
      toast.success('You have joined the business!');
      queryClient.invalidateQueries({ queryKey: INVITATION_KEYS.list() });
    },
    onError: (error) => {
      toast.error(extractApiErrorMessage(error));
    },
  });
}

export function useAcceptBusinessInvitationMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { code: string }) => businessService.acceptBusinessInvitation(data),
    onSuccess: () => {
      toast.success('Invitation accepted!');
      queryClient.invalidateQueries({ queryKey: INVITATION_KEYS.list() });
    },
    onError: (error) => {
      toast.error(extractApiErrorMessage(error));
    },
  });
}
