import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { zustandStorage } from '@/utils/storage';

export type NotificationType = 'order' | 'delivery' | 'delivered' | 'promo' | 'system';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  time: string; // ISO string for sorting, though human-readable in mocks
  type: NotificationType;
  read: boolean;
}

interface NotificationState {
  notifications: AppNotification[];
  
  // Actions
  addNotification: (notif: AppNotification) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
}

const INITIAL_MOCK_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'n1',
    title: 'Order Confirmed!',
    message: 'Your order #ORD-2461 has been confirmed by the restaurant.',
    time: new Date(Date.now() - 120000).toISOString(), // 2 min ago
    type: 'order',
    read: false,
  },
  {
    id: 'n2',
    title: 'Rider on the way',
    message: 'Robert Fox is heading to your location with your food.',
    time: new Date(Date.now() - 900000).toISOString(), // 15 min ago
    type: 'delivery',
    read: false,
  },
  {
    id: 'n3',
    title: 'Order Delivered',
    message: 'Your order #ORD-2460 has been delivered. Enjoy your meal!',
    time: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
    type: 'delivered',
    read: true,
  },
  {
    id: 'n4',
    title: 'Special Offer 🎉',
    message: 'Get 20% off on your next order! Use code TEINC20.',
    time: new Date(Date.now() - 10800000).toISOString(), // 3 hours ago
    type: 'promo',
    read: true,
  },
];

export const useNotificationStore = create<NotificationState>()(
  persist(
    (set) => ({
      notifications: INITIAL_MOCK_NOTIFICATIONS,

      addNotification: (notif) => {
        set((state) => ({
          notifications: [notif, ...state.notifications],
        }));
      },

      markAsRead: (id) => {
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n
          ),
        }));
      },

      markAllAsRead: () => {
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, read: true })),
        }));
      },

      removeNotification: (id) => {
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id),
        }));
      },

      clearAll: () => {
        set({ notifications: [] });
      },
    }),
    {
      name: 'teincfoods-notifications',
      storage: createJSONStorage(() => zustandStorage),
    }
  )
);
