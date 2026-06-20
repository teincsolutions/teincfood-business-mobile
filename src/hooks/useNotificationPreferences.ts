import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  notificationPreferencesService,
  type NotificationPreferences,
} from '@/services/notification-preferences.service';
import { useAuthStore } from '@/stores/auth.store';

const NOTIFICATION_PREFS_QUERY_KEY = ['notification-preferences'];

export function useNotificationPreferencesQuery() {
  const isAuthenticated = useAuthStore(
    (state) => Boolean(state.user && state.accessToken),
  );

  return useQuery({
    queryKey: NOTIFICATION_PREFS_QUERY_KEY,
    queryFn: () => notificationPreferencesService.getPreferences(),
    enabled: isAuthenticated,
  });
}

export function useUpdateNotificationPreferencesMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (prefs: Partial<NotificationPreferences>) =>
      notificationPreferencesService.updatePreferences(prefs),
    onMutate: async (newPrefs) => {
      await queryClient.cancelQueries({
        queryKey: NOTIFICATION_PREFS_QUERY_KEY,
      });

      const previous = queryClient.getQueryData<NotificationPreferences>(
        NOTIFICATION_PREFS_QUERY_KEY,
      );

      if (previous) {
        queryClient.setQueryData<NotificationPreferences>(
          NOTIFICATION_PREFS_QUERY_KEY,
          { ...previous, ...newPrefs },
        );
      }

      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(
          NOTIFICATION_PREFS_QUERY_KEY,
          context.previous,
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({
        queryKey: NOTIFICATION_PREFS_QUERY_KEY,
      });
    },
  });
}
