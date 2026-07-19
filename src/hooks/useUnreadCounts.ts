import { useMemo } from 'react';
import { useContacts } from '@/hooks/useContacts';
import { useActiveBusiness } from '@/hooks/useActiveBusiness';
import { useUnreadCount } from '@teincfood/rn-notifications';

export function useUnreadCounts() {
  const { activeBusinessId } = useActiveBusiness();

  const { contacts: bizContacts } = useContacts(
    'business',
    activeBusinessId ?? undefined,
  );
  const { contacts: personalContacts } = useContacts('buyer');
  const { data: notificationUnread } = useUnreadCount();

  return useMemo(() => {
    const businessUnread =
      bizContacts?.reduce((sum, c) => sum + (c.unread_count || 0), 0) ?? 0;
    const personalUnread =
      personalContacts?.reduce((sum, c) => sum + (c.unread_count || 0), 0) ?? 0;
    return {
      businessUnread,
      personalUnread,
      total: businessUnread + personalUnread,
      notificationUnread,
    };
  }, [bizContacts, personalContacts, notificationUnread]);
}
