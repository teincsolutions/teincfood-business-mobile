import { useQuery } from '@tanstack/react-query';
import { getConversationService } from '@/utils/chat-service';

export function useInboxConversations() {
  return useQuery({
    queryKey: ['inbox-conversations'],
    queryFn: () => getConversationService().getInboxConversations(),
  });
}
