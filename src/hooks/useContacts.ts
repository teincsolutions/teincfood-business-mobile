import { useQuery } from '@tanstack/react-query';
import { getConversationService } from '@/utils/chat-service';

export function useContacts() {
  return useQuery({
    queryKey: ['contacts'],
    queryFn: () => getConversationService().getContacts(),
  });
}
