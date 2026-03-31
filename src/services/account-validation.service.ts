/**
 * Account Validation Service
 * Provides username uniqueness validation and forgot/reset password flow
 */

import { mockBackend } from './mock-backend.service';

export interface UsernameValidationRequest {
  username: string;
}

export interface UsernameValidationResponse {
  available: boolean;
  message: string;
  suggestions?: string[];
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ForgotPasswordResponse {
  success: boolean;
  message: string;
  resetToken?: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

export interface ResetPasswordResponse {
  success: boolean;
  message: string;
}

// Mock usernames that are taken
const TAKEN_USERNAMES = ['admin', 'user', 'test', 'teinc', 'eric', 'john', 'jane'];

export async function validateUsername(
  request: UsernameValidationRequest
): Promise<UsernameValidationResponse> {
  const { username } = request;
  
  // Basic validation
  if (username.length < 3) {
    return {
      available: false,
      message: 'Username must be at least 3 characters',
    };
  }
  
  if (username.length > 20) {
    return {
      available: false,
      message: 'Username must be 20 characters or less',
    };
  }
  
  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    return {
      available: false,
      message: 'Username can only contain letters, numbers, and underscores',
    };
  }
  
  // Check if taken
  const isTaken = TAKEN_USERNAMES.includes(username.toLowerCase());
  
  if (isTaken) {
    const suggestions = [
      `${username}_`,
      `${username}1`,
      `${username}2024`,
      `the_${username}`,
    ];
    
    return {
      available: false,
      message: 'Username is already taken',
      suggestions,
    };
  }
  
  return {
    available: true,
    message: 'Username is available',
  };
}

export async function requestPasswordReset(
  request: ForgotPasswordRequest
): Promise<ForgotPasswordResponse> {
  const { email } = request;
  
  // Basic email validation
  if (!email || !email.includes('@')) {
    return {
      success: false,
      message: 'Please enter a valid email address',
    };
  }
  
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 1000));
  
  // Mock success
  return {
    success: true,
    message: 'Password reset link sent to your email',
    resetToken: `reset_${Date.now()}`,
  };
}

export async function resetPassword(
  request: ResetPasswordRequest
): Promise<ResetPasswordResponse> {
  const { token, newPassword } = request;
  
  // Basic validation
  if (!token) {
    return {
      success: false,
      message: 'Invalid reset token',
    };
  }
  
  if (newPassword.length < 8) {
    return {
      success: false,
      message: 'Password must be at least 8 characters',
    };
  }
  
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 1000));
  
  // Mock success
  return {
    success: true,
    message: 'Password reset successful',
  };
}