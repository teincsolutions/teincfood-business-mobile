import { api } from './api';

export interface ForgotPasswordRequest {
  email: string;
}

export interface ForgotPasswordResponse {
  success: boolean;
  message: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

export interface ResetPasswordResponse {
  success: boolean;
  message: string;
}

export async function requestPasswordReset(request: ForgotPasswordRequest): Promise<ForgotPasswordResponse> {
  return api.post('/auth/forgot-password', request);
}

export async function resetPassword(request: ResetPasswordRequest): Promise<ResetPasswordResponse> {
  return api.post('/auth/reset-password', request);
}
