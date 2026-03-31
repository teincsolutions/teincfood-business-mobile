import { useMutation } from '@tanstack/react-query';
import type { LiveActivityRegistrationRequest } from './backend-contracts.types';
import { mockBackend } from './mock-backend.service';

export function useRegisterIOSLiveActivityMutation() {
  return useMutation({
    mutationFn: ({ orderId, payload }: { orderId: string; payload: LiveActivityRegistrationRequest }) =>
      mockBackend.registerIOSLiveActivity(orderId, payload),
  });
}

export function useUnregisterIOSLiveActivityMutation() {
  return useMutation({
    mutationFn: ({ orderId, activityId }: { orderId: string; activityId: string }) =>
      mockBackend.unregisterIOSLiveActivity(orderId, activityId),
  });
}
