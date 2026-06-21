import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { useMutation } from '@tanstack/react-query';
import { api } from './api';

WebBrowser.maybeCompleteAuthSession();

export interface RegisterRequest {
  email: string;
  password: string;
  full_name: string;
  phone?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface OTPRequest {
  phone: string;
  purpose?: "login" | "register";
}

export interface OTPVerifyRequest {
  phone: string;
  code: string;
  type?: "login" | "register";
}

export interface RegisterResponse {
  status: string;
  message: string;
  user: {
    id: string;
    email: string;
    full_name: string;
    roles: string[];
  };
}

interface RefreshResponse {
  access_token: string;
  refresh_token: string;
}

export interface AuthApiResponse {
  access_token: string;
  refresh_token: string;
  user: Record<string, any>;
}

export const authService = {
  register(payload: RegisterRequest): Promise<AuthApiResponse> {
    return api.post<AuthApiResponse>('/auth/register', { user: payload });
  },

  verifyEmailOtp(userId: string, code: string): Promise<AuthApiResponse> {
    return api.post<AuthApiResponse>('/auth/verify-email/otp', {
      user_id: userId,
      code,
    });
  },

  resendEmailOtp(email: string): Promise<{ status: string; message: string }> {
    return api.post<{ status: string; message: string }>('/auth/verify-email/resend', { email });
  },

  login(payload: LoginRequest): Promise<AuthApiResponse> {
    return api.post<AuthApiResponse>('/auth/login', {
      email: payload.email,
      password: payload.password,
    });
  },

  sendOTP(phone: string, purpose?: "login" | "register"): Promise<{ status: string; message: string }> {
    return api.post<{ status: string; message: string }>('/auth/otp/send', { phone, purpose });
  },

  requestOtp(phone: string, purpose?: "login" | "register"): Promise<{ status: string; message: string }> {
    return api.post<{ status: string; message: string }>('/auth/otp/send', { phone, purpose });
  },

  verifyOTP(payload: OTPVerifyRequest): Promise<AuthApiResponse> {
    return api.post<AuthApiResponse>('/auth/otp/verify', {
      phone: payload.phone,
      code: payload.code,
      type: payload.type || "login",
    });
  },

  loginWithOIDC(provider: 'google' | 'apple' | 'facebook', idToken: string): Promise<AuthApiResponse> {
    return api.post<AuthApiResponse>('/auth/oidc', {
      provider,
      id_token: idToken,
    });
  },

  refresh(refreshToken: string): Promise<RefreshResponse> {
    return api.post<RefreshResponse>('/auth/refresh', {
      refresh_token: refreshToken,
    });
  },

  forgotPassword(email: string): Promise<{ status: string; message: string }> {
    return api.post<{ status: string; message: string }>('/auth/forgot-password', { email });
  },

  resetPassword(token: string, password: string): Promise<{ status: string; message: string }> {
    return api.post<{ status: string; message: string }>('/auth/reset-password', {
      token,
      password,
    });
  },

  verifyEmail(token: string): Promise<{ status: string; message: string }> {
    return api.post<{ status: string; message: string }>('/auth/verify-email', { token });
  },

  async loginWithGoogle(): Promise<AuthApiResponse> {
    const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
    const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;

    if (!iosClientId && !webClientId) {
      throw new Error('Google Sign-In client IDs not configured');
    }

    GoogleSignin.configure({
      ...(iosClientId ? { iosClientId } : {}),
      ...(webClientId ? { webClientId } : {}),
      scopes: ['openid', 'profile', 'email'],
    });

    await GoogleSignin.hasPlayServices();
    const result = await GoogleSignin.signIn();

    if (result.type === 'cancelled') {
      throw new Error('Google sign-in was cancelled');
    }

    if (!result.data?.idToken) {
      throw new Error('No ID token from Google');
    }

    return this.loginWithOIDC('google', result.data.idToken);
  },

  async loginWithFacebook(): Promise<AuthApiResponse> {
    const clientId = process.env.EXPO_PUBLIC_FACEBOOK_APP_ID ?? '';
    const redirectUri = AuthSession.makeRedirectUri({
      scheme: 'teincfood.business',
      path: 'auth',
    });

    if (!clientId) {
      throw new Error('Facebook App ID not configured');
    }

    const request = new AuthSession.AuthRequest({
      clientId,
      redirectUri,
      scopes: ['public_profile', 'email'],
      responseType: AuthSession.ResponseType.Token,
      usePKCE: false,
    });

    const result = await request.promptAsync({
      authorizationEndpoint: 'https://www.facebook.com/v22.0/dialog/oauth',
    });

    if (result.type === 'success' && result.params.access_token) {
      return this.loginWithOIDC('facebook', result.params.access_token);
    }

    throw new Error(result.type === 'cancel' ? 'Facebook sign-in was cancelled' : 'Facebook sign-in failed');
  },

  async loginWithApple(): Promise<AuthApiResponse> {
    const { signInAsync, AppleAuthenticationScope } = await import('expo-apple-authentication');

    const credential = await signInAsync({
      requestedScopes: [
        AppleAuthenticationScope.FULL_NAME,
        AppleAuthenticationScope.EMAIL,
      ],
    });

    return this.loginWithOIDC('apple', credential.identityToken ?? '');
  },

  logout(): Promise<void> {
    return Promise.resolve();
  },
};

export function useEmailPasswordLoginMutation() {
  return useMutation({
    mutationFn: (payload: LoginRequest) => authService.login(payload),
  });
}

export function useSignupMutation() {
  return useMutation({
    mutationFn: (payload: RegisterRequest) => authService.register(payload),
  });
}
