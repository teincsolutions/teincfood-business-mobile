import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  notificationsService,
  type Notification,
} from "@/services/notifications.service";
import { eventsService } from "@/services/events.service";
import { useAuthStore } from "@/stores/auth.store";

const NOTIFICATIONS_QUERY_KEY = ["notifications"];

export { type Notification } from "@/services/notifications.service";

export function useNotificationsQuery() {
  return useQuery({
    queryKey: NOTIFICATIONS_QUERY_KEY,
    queryFn: async () => {
      return notificationsService.getNotifications() ?? [];
    },
    enabled: useAuthStore((state) => Boolean(state.user && state.accessToken)),
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });
}

export function useMarkNotificationReadMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      return notificationsService.markAsRead(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY });
    },
  });
}

export function useMarkAllNotificationsReadMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      return notificationsService.markAllAsRead();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY });
    },
  });
}

export function useRemoveNotificationMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      return notificationsService.removeNotification(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY });
    },
  });
}

export function useDismissNotificationActionMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      return notificationsService.dismissAction(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY });
    },
  });
}

export function useClearNotificationsMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      return notificationsService.clearAll();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY });
    },
  });
}

export function useNotificationsStream(enabled = true) {
  const queryClient = useQueryClient();
  const userId = useAuthStore((state) => state.user?.id);
  const isAuthenticated = useAuthStore((state) =>
    Boolean(state.user && state.accessToken),
  );

  useEffect(() => {
    if (!enabled || !isAuthenticated || !userId) {
      return;
    }

    const disconnect = eventsService.connect(userId);

    const unsubscribe = eventsService.on("notification_created", () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY });
    });

    return () => {
      unsubscribe();
      disconnect();
    };
  }, [enabled, isAuthenticated, userId, queryClient]);
}
