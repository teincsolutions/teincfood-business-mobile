import { useMutation, useQueryClient } from "@tanstack/react-query";
import { INVITATION_KEYS, MEMBER_KEYS, extractApiErrorMessage } from "@teincfood/core";
import * as businessService from "@/services/business.service";
import { useBusinessStore } from "@/stores/business.store";

/**
 * Local invitation mutations (same names/shapes as core 0.9.1 will export —
 * swap the import source when the published core lands).
 * Screens must use these hooks, never import the service directly.
 */

export function useDeclineBusinessInvitationMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { code: string }) =>
      businessService.declineBusinessInvitation(data),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: INVITATION_KEYS.list() });
    },
    onError: (err) => {
      console.debug("[useDeclineBusinessInvitationMutation] failed", err);
    },
  });
}

export function useResendMemberInvitationMutation() {
  const queryClient = useQueryClient();
  const businessId = useBusinessStore((s) => s.activeBusiness?.id);
  return useMutation({
    mutationFn: (invitationId: string) =>
      businessService.resendBusinessMemberInvitation(businessId!, invitationId),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: MEMBER_KEYS.invitations(businessId ?? ""),
      });
    },
    onError: (err) => {
      console.debug("[useResendMemberInvitationMutation] failed", err);
    },
  });
}
