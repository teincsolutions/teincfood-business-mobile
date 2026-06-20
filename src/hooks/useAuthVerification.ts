import { useMutation } from '@tanstack/react-query';
import { authService } from '@/services/auth.service';
import type { OTPVerifyRequest } from '@/services/auth.service';

export function useVerifyEmailOtpMutation() {
  return useMutation({
    mutationFn: ({ userId, code }: { userId: string; code: string }) =>
      authService.verifyEmailOtp(userId, code),
  });
}

export function useResendEmailOtpMutation() {
  return useMutation({
    mutationFn: (email: string) => authService.resendEmailOtp(email),
  });
}

export function useRequestOtpMutation() {
  return useMutation({
    mutationFn: ({ phone, purpose }: { phone: string; purpose?: 'login' | 'register' }) =>
      authService.requestOtp(phone, purpose),
  });
}

export function useVerifyOtpMutation() {
  return useMutation({
    mutationFn: (payload: OTPVerifyRequest) => authService.verifyOTP(payload),
  });
}
