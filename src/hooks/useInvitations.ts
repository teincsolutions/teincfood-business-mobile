import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as fleetService from '@/services/fleet.service';
import * as businessService from '@/services/business.service';
import { toast } from 'sonner-native';
import { extractApiErrorMessage } from '@/utils/error';

const INVITATION_KEYS = {
  all: ['invitations'] as const,
  pending: () => [...INVITATION_KEYS.all, 'pending'] as const,
};

export function useAcceptFleetInvitationMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { code: string }) => fleetService.acceptFleetInvitation(data),
    onSuccess: () => {
      toast.success('You have joined the business!');
      queryClient.invalidateQueries({ queryKey: INVITATION_KEYS.all });
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
      queryClient.invalidateQueries({ queryKey: INVITATION_KEYS.all });
    },
    onError: (error) => {
      toast.error(extractApiErrorMessage(error));
    },
  });
}
