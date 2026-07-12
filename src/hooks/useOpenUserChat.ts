import { useCallback } from 'react';
import { useRouter } from 'expo-router';

export function useOpenUserChat() {
  const router = useRouter();

  const openChat = useCallback(
    (userId: string, displayName?: string, displayAvatar?: string, contactType?: string) => {
      router.push({
        pathname: '/(communication)/chat/direct',
        params: {
          userId,
          displayName: displayName || 'Contact',
          displayAvatar: displayAvatar || '',
          contactType: contactType || 'user',
        },
      });
    },
    [router],
  );

  return openChat;
}
