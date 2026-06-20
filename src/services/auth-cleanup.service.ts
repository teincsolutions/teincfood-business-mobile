import { useAuthStore } from '@/stores/auth.store';
import { chatService } from './chat.service';
import { phoenixSocket } from './phoenix-socket.service';

let subscribed = false;

export function subscribeAuthCleanup(): void {
  if (subscribed) return;
  subscribed = true;

  useAuthStore.subscribe((state, prev) => {
    const wasAuthenticated = Boolean(prev.user && prev.accessToken);
    const isNowAuthenticated = Boolean(state.user && state.accessToken);
    if (wasAuthenticated && !isNowAuthenticated) {
      chatService.disconnect();
      phoenixSocket.disconnect();
    }
  });
}
