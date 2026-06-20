import { useCallback, useState } from 'react';
import { useRouter } from 'expo-router';
import { useMutation } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth.store';
import { useLocationStore } from '@/stores/location.store';
import { useOnboardingStore } from '@/stores/onboarding.store';
import type { AuthResponse } from '@/models/user.model';
import { authService, LoginRequest, RegisterRequest, RegisterResponse } from '@/services/auth.service';

export interface AuthError {
  code?: string;
  message: string;
}

function extractErrorMessage(error: unknown): string {
  if (typeof error === 'string') return error;

  if (error && typeof error === 'object') {
    const err = error as Record<string, unknown>;

    const errorObj = err.error as Record<string, unknown> | undefined;
    if (errorObj?.message) {
      return String(errorObj.message);
    }

    const response = err.response as Record<string, unknown> | undefined;
    if (response?.data) {
      const data = response.data as Record<string, unknown>;
      const errorData = data.error as Record<string, unknown> | undefined;
      if (errorData?.message) {
        return String(errorData.message);
      }
      if (data.message) {
        return String(data.message);
      }
    }

    if (err.message) {
      return String(err.message);
    }
  }

  return 'An unexpected error occurred';
}

export function useAuth() {
  const router = useRouter();

  const user = useAuthStore((state) => state.user);
  const accessToken = useAuthStore((state) => state.accessToken);
  const refreshToken = useAuthStore((state) => state.refreshToken);
  const isHydrated = useAuthStore((state) => state.isHydrated);
  const setAuthAction = useAuthStore((state) => state.setAuth);
  const clearAuthAction = useAuthStore((state) => state.clearAuth);

  const hasLocation = useLocationStore((state) => state.hasLocation());
  const hasSeenOnboarding = useOnboardingStore((state) => state.hasSeenOnboarding);

  const [loginError, setLoginError] = useState<string | null>(null);
  const [signupError, setSignupError] = useState<string | null>(null);

  const signupMutation = useMutation<AuthResponse | RegisterResponse, Error, RegisterRequest>({
    mutationFn: authService.register,
    onError: (error: Error) => {
      setSignupError(extractErrorMessage(error));
    },
  });

  const loginMutation = useMutation<AuthResponse, Error, LoginRequest>({
    mutationFn: authService.login,
    onError: (error: Error) => {
      setLoginError(extractErrorMessage(error));
    },
  });

  const logoutMutation = useMutation<void, Error, void>({
    mutationFn: authService.logout,
  });

  const refreshSessionMutation = useMutation({
    mutationFn: (token: string) => authService.refresh(token),
  });

  const isAuthenticated = Boolean(user && accessToken);
  const isLoading = signupMutation.isPending || loginMutation.isPending || logoutMutation.isPending;

  const navigatePostAuth = useCallback(() => {
    if (hasLocation) {
      router.replace('/(auth)/role');
    } else {
      router.replace('/(auth)/onboarding?requireLocation=1');
    }
  }, [hasLocation, router]);

  const login = useCallback(async (email: string, password: string) => {
    setLoginError(null);

    if (!hasLocation) {
      router.replace(
        hasSeenOnboarding
          ? '/(auth)/onboarding?requireLocation=1'
          : '/(auth)/onboarding'
      );
      throw new Error('Location is required');
    }

    const response = await loginMutation.mutateAsync({
      email: email.trim(),
      password,
    });

    setAuthAction(
      response.user,
      response.accessToken,
      response.refreshToken
    );

    navigatePostAuth();
  }, [hasLocation, hasSeenOnboarding, loginMutation, setAuthAction, router, navigatePostAuth]);

  const signup = useCallback(async (data: {
    fullName: string;
    email: string;
    phone: string;
    password: string;
  }) => {
    setSignupError(null);

    if (!hasLocation) {
      router.replace(
        hasSeenOnboarding
          ? '/(auth)/onboarding?requireLocation=1'
          : '/(auth)/onboarding'
      );
      throw new Error('Location is required');
    }

    const response = await signupMutation.mutateAsync({
      email: data.email.trim(),
      password: data.password,
      full_name: data.fullName.trim(),
      phone: data.phone.trim(),
    });

    if ('accessToken' in response && response.accessToken) {
      setAuthAction(
        response.user as AuthResponse['user'],
        response.accessToken,
        response.refreshToken
      );
      navigatePostAuth();
    }

    return response;
  }, [hasLocation, hasSeenOnboarding, signupMutation, setAuthAction, router, navigatePostAuth]);

  const clearErrors = useCallback(() => {
    setLoginError(null);
    setSignupError(null);
  }, []);

  const requestOtpFn = useCallback(async (phone: string, purpose?: "login" | "register") => {
    return authService.requestOtp(phone, purpose || "login");
  }, []);

  const verifyOtpFn = useCallback(async (phone: string, code: string, type?: "login" | "register") => {
    const response = await authService.verifyOTP({ phone, code, type: type || "login" });
    setAuthAction(
      response.user,
      response.accessToken,
      response.refreshToken
    );
    navigatePostAuth();
  }, [setAuthAction, navigatePostAuth]);

  const loginWithOAuth = useCallback(async (provider: 'google' | 'apple') => {
    if (!hasLocation) {
      router.replace(
        hasSeenOnboarding
          ? '/(auth)/onboarding?requireLocation=1'
          : '/(auth)/onboarding'
      );
      throw new Error('Location is required');
    }

    const response = provider === 'google'
      ? await authService.loginWithGoogle()
      : await authService.loginWithApple();

    setAuthAction(
      response.user,
      response.accessToken,
      response.refreshToken
    );
    navigatePostAuth();
  }, [hasLocation, hasSeenOnboarding, setAuthAction, router, navigatePostAuth]);

  const logout = useCallback(async () => {
    await logoutMutation.mutateAsync();
    clearAuthAction();
    router.replace('/(auth)/login');
  }, [logoutMutation, clearAuthAction, router]);

  const refreshSessionFn = useCallback(async () => {
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }
    const response = await refreshSessionMutation.mutateAsync(refreshToken) as { access_token: string; refresh_token: string };
    useAuthStore.getState().setTokens(
      response.access_token,
      response.refresh_token
    );
  }, [refreshToken, refreshSessionMutation]);

  return {
    user,
    accessToken,
    refreshToken,
    isAuthenticated,
    isHydrated,
    isLoading,
    hasLocation,
    loginError,
    signupError,
    clearErrors,
    login,
    signup,
    signupMutation,
    loginMutation,
    requestOtp: requestOtpFn,
    verifyOtp: verifyOtpFn,
    loginWithOAuth,
    logout,
    refreshSession: refreshSessionFn,
  };
}
