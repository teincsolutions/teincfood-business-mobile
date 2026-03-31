import { useMutation } from '@tanstack/react-query';
import type { PushTokenRegistrationRequest } from './backend-contracts.types';
import { mockBackend } from './mock-backend.service';

export function useRegisterPushTokenMutation() {
  return useMutation({
    mutationFn: (payload: PushTokenRegistrationRequest) => mockBackend.registerPushToken(payload),
  });
}

export function useUnregisterPushTokenMutation() {
  return useMutation({
    mutationFn: (tokenId: string) => mockBackend.unregisterPushToken(tokenId),
  });
}
