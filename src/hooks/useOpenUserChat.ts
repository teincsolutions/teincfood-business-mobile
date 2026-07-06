import { useCallback } from 'react';
import { useRouter } from 'expo-router';

export function useOpenUserChat() {
  const router = useRouter();

  const openChat = useCallback(
    (userId: string, displayName?: string, displayAvatar?: string) => {
      router.push({
        pathname: '/(communication)/chat/direct',
        params: {
          userId,
          displayName: displayName || 'Contact',
          displayAvatar: displayAvatar || '',
        },
      });
    },
    [router],
  );

  return openChat;
}
