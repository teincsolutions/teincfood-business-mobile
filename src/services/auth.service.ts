import { useMutation } from '@tanstack/react-query';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import type { OTPVerifyRequest, AuthResponse } from '@/models/user.model';
import type { LoginRequest, SignupRequest } from './backend-contracts.types';
import { MOCK_CURRENT_USER } from '@/mocks/users.mock';
import { mockBackend } from './mock-backend.service';

// Configure WebBrowser for OAuth redirect handling
WebBrowser.maybeCompleteAuthSession();

/**
 * Auth Service
 * Handles authentication flows including Phone OTP, Email/Password, and OAuth (Google, Apple, Facebook).
 * Google Sign-In uses expo-auth-session for proper OAuth 2.0 implementation compatible with Expo 55.
 */

const SIMULATED_DELAY = 1000;

// Google OAuth Configuration
// For production, you should obtain these from Google Cloud Console
const GOOGLE_CLIENT_IDS = {
  // These should be replaced with your actual OAuth client IDs
  // from Google Cloud Console
  web: 'YOUR_GOOGLE_WEB_CLIENT_ID.apps.googleusercontent.com',
  ios: 'YOUR_GOOGLE_IOS_CLIENT_ID.apps.googleusercontent.com',
  android: 'YOUR_GOOGLE_ANDROID_CLIENT_ID.apps.googleusercontent.com',
};

// Discovery document for Google OAuth 2.0
const discovery = {
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenEndpoint: 'https://oauth2.googleapis.com/token',
  revocationEndpoint: 'https://oauth2.googleapis.com/revoke',
};

export const authService = {
  /**
   * Mock OTP Request
   */
  async requestOtp(phone: string): Promise<{ sessionId: string; message: string }> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          sessionId: 'mock_session_id',
          message: `Code sent to ${phone}`,
        });
      }, SIMULATED_DELAY);
    });
  },

  /**
   * Mock OTP Verification
   */
  async verifyOtp(data: OTPVerifyRequest): Promise<AuthResponse> {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (data.code === '1234') { // Hardcoded successful OTP testing sequence
          resolve({
            accessToken: 'mock_access_token_abc123',
            refreshToken: 'mock_refresh_token_xyz789',
            // Update the phone number of the mock user to the one they entered
            user: { ...MOCK_CURRENT_USER, phone: data.phone },
          });
        } else {
          reject({ status: 400, message: 'Invalid OTP code' });
        }
      }, SIMULATED_DELAY);
    });
  },

  /**
   * Google Sign-In using expo-auth-session (OAuth 2.0)
   * Opens Google login in browser, user authenticates, and we receive tokens.
   */
  async loginWithGoogle(): Promise<AuthResponse> {
    try {
      // Create the auth request with Google OAuth
      const request = new AuthSession.AuthRequest({
        clientId: AuthSession.makeRedirectUri({ scheme: 'teincfoods', path: 'auth' }),
        scopes: ['openid', 'profile', 'email'],
        redirectUri: AuthSession.makeRedirectUri({ scheme: 'teincfoods', path: 'auth' }),
        responseType: AuthSession.ResponseType.Token,
        usePKCE: false,
      });

      // Prompt the user to authenticate with Google
      const result = await request.promptAsync(discovery);

      if (result.type === 'success') {
        // Extract the access token from the response
        const { access_token } = result.params;

        if (!access_token) {
          throw new Error('No access token received from Google');
        }

        // Fetch user profile from Google
        const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
          headers: { Authorization: `Bearer ${access_token}` },
        });

        if (!userInfoResponse.ok) {
          throw new Error('Failed to fetch user info from Google');
        }

        const googleUser = await userInfoResponse.json();

        // Map Google user data to our AuthResponse format
        return {
          accessToken: access_token,
          refreshToken: '', // Google OAuth tokens don't have refresh tokens in implicit flow
          user: {
            id: googleUser.id,
            fullName: googleUser.name || `${googleUser.given_name} ${googleUser.family_name}`.trim(),
            email: googleUser.email,
            phone: '',
            username: googleUser.email?.split('@')[0] || `google_${googleUser.id}`,
            role: 'seller', // Default to seller for business app
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        };
      } else if (result.type === 'cancel') {
        throw new Error('Google sign-in was cancelled');
      } else {
        throw new Error('Google sign-in failed');
      }
    } catch (error: any) {
      // Re-throw with a clear error message
      if (error.message?.includes('cancelled') || error.message?.includes('cancel')) {
        throw new Error('Google sign-in was cancelled');
      }
      throw new Error(error.message || 'Failed to sign in with Google');
    }
  },

  /**
   * OIDC / Social Login dispatcher
   * Routes to the appropriate provider implementation
   */
  async loginWithOIDC(provider: string): Promise<AuthResponse> {
    switch (provider.toLowerCase()) {
      case 'google':
        return this.loginWithGoogle();
      case 'apple':
      case 'facebook':
        // For Apple and Facebook, you would implement similar methods
        // using expo-apple-authentication or Facebook SDK
        // For now, return mock data for these providers
        return new Promise((resolve) => {
          setTimeout(() => {
            resolve({
              accessToken: `mock_oidc_token_${provider}_abc123`,
              refreshToken: `mock_oidc_refresh_${provider}_xyz789`,
              user: MOCK_CURRENT_USER,
            });
          }, SIMULATED_DELAY);
        });
      default:
        throw new Error(`Unsupported OAuth provider: ${provider}`);
    }
  }
};

export function useSignupMutation() {
  return useMutation({
    mutationFn: (payload: SignupRequest) => mockBackend.signupWithEmailPassword(payload),
  });
}

export function useEmailPasswordLoginMutation() {
  return useMutation({
    mutationFn: (payload: LoginRequest) => mockBackend.loginWithEmailPassword(payload),
  });
}

export function useRefreshSessionMutation() {
  return useMutation({
    mutationFn: (refreshToken: string) => mockBackend.refreshSession(refreshToken),
  });
}

export function useLogoutMutation() {
  return useMutation({
    mutationFn: () => mockBackend.logoutSession(),
  });
}
