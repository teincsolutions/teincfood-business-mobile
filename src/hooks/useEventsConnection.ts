import { useEffect } from 'react';
import { eventsService } from '@/services/events.service';
import { useAuthStore } from '@/stores/auth.store';

/**
 * Global events connection hook — call once in _layout.tsx.
 * Connects when authenticated, disconnects when not.
 * Individual screens should NOT call eventsService.connect() directly.
 */
export function useEventsConnection() {
  const userId = useAuthStore((state) => state.user?.id);
  const isAuthenticated = useAuthStore((state) => Boolean(state.user && state.accessToken));

  useEffect(() => {
    if (!isAuthenticated || !userId) return;

    console.log('[EventsConnection] Connecting global events channel');
    const disconnect = eventsService.connect(userId);

    return () => {
      console.log('[EventsConnection] Disconnecting global events channel');
      disconnect();
    };
  }, [isAuthenticated, userId]);
}
