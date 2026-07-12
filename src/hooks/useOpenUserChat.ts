import { useCallback } from 'react';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useActiveBusiness } from '@/hooks/useActiveBusiness';

export function useOpenUserChat() {
  const router = useRouter();
  const { activeBusiness, activeBusinessId, hasBusiness } = useActiveBusiness();

  const openChat = useCallback(
    (userId: string, displayName?: string, displayAvatar?: string, contactType?: string) => {
      const pushChat = (senderBusinessId?: string) => {
        router.push({
          pathname: '/(communication)/chat/direct',
          params: {
            userId,
            displayName: displayName || 'Contact',
            displayAvatar: displayAvatar || '',
            contactType: contactType || 'user',
            senderBusinessId: senderBusinessId || '',
          },
        });
      };

      if (!hasBusiness || !activeBusiness) {
        pushChat();
        return;
      }

      Alert.alert('Send message as', `${activeBusiness.name} (Business) or yourself (Personal)?`, [
        {
          text: `Business — ${activeBusiness.name}`,
          onPress: () => pushChat(activeBusinessId!),
        },
        {
          text: 'Personal / Direct',
          onPress: () => pushChat(),
        },
        { text: 'Cancel', style: 'cancel' },
      ]);
    },
    [router, hasBusiness, activeBusiness, activeBusinessId],
  );

  return openChat;
}
