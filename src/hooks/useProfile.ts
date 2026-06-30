import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { profileService } from '@/services/profile.service';
import { useAuthStore } from '@/stores/auth.store';
import type { User } from '@/types/user.model';

/** Map snake_case API profile to camelCase User store fields */
function apiProfileToUser(api: Record<string, any>): Partial<User> {
  return {
    full_name: api.full_name ?? '',
    email: api.email ?? '',
    phone: api.phone ?? '',
    avatar_url: api.avatar_url ?? undefined,
    email_verified_at: api.email_verified_at ?? null,
    phone_verified_at: api.phone_verified_at ?? null,
  };
}

export function useProfileQuery() {
  const setUser = useAuthStore((state) => state.setUser);
  const user = useAuthStore((state) => state.user);

  const query = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const response = await profileService.getProfile();
      return response.data as Record<string, any>;
    },
    enabled: !!user,
    refetchOnWindowFocus: true,
  });

  useEffect(() => {
    if (query.data && user) {
      setUser({ ...user, ...apiProfileToUser(query.data) });
    }
  }, [query.data]);

  return query;
}

export function useUpdateProfileMutation() {
  const queryClient = useQueryClient();
  const setUser = useAuthStore((state) => state.setUser);
  const user = useAuthStore((state) => state.user);

  return useMutation({
    mutationFn: (payload: { full_name?: string; phone?: string; avatar_url?: string }) =>
      profileService.updateProfile(payload),
    onSuccess: (response) => {
      if (user && response.data) {
        setUser({ ...user, ...apiProfileToUser(response.data) });
      }
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
}

export function useChangePasswordMutation() {
  return useMutation({
    mutationFn: ({ currentPassword, newPassword }: { currentPassword: string; newPassword: string }) =>
      profileService.changePassword(currentPassword, newPassword),
  });
}

export function useRequestEmailChangeMutation() {
  return useMutation({
    mutationFn: (email: string) => profileService.updateEmail(email),
  });
}

export function useVerifyEmailChangeMutation() {
  const setUser = useAuthStore((state) => state.setUser);
  const user = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (code: string) => profileService.verifyEmailChange(code),
    onSuccess: (response) => {
      if (user && response.data?.email) {
        setUser({ ...user, email: response.data.email });
      }
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
}

export function useRequestPhoneChangeMutation() {
  return useMutation({
    mutationFn: (phone: string) => profileService.updatePhone(phone),
  });
}

export function useVerifyPhoneChangeMutation() {
  const setUser = useAuthStore((state) => state.setUser);
  const user = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (code: string) => profileService.verifyPhoneChange(code),
    onSuccess: (response) => {
      if (user && response.data?.phone) {
        setUser({ ...user, phone: response.data.phone });
      }
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
}

export function useSetPasswordMutation() {
  return useMutation({
    mutationFn: ({ password, passwordConfirmation }: { password: string; passwordConfirmation: string }) => {
      return profileService.setPassword(password);
    },
  });
}
