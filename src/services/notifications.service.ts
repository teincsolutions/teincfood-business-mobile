import { api } from './api';

export interface Notification {
  id: string;
  title: string;
  message: string;
  read: boolean;
  type: string;
  created_at: string;
}

interface BackendNotification {
  id: string;
  title: string;
  body: string;
  type: string;
  is_read: boolean;
  inserted_at: string;
}

function mapNotification(backend: BackendNotification): Notification {
  return {
    id: backend.id,
    title: backend.title,
    message: backend.body,
    type: backend.type,
    read: backend.is_read,
    created_at: backend.inserted_at,
  };
}

export const notificationsService = {
  async getNotifications(): Promise<Notification[]> {
    const response = await api.get<{ data: { notifications: BackendNotification[] } }>('/notifications');
    return response.data.notifications.map(mapNotification);
  },

  async markAsRead(id: string): Promise<{ success: boolean }> {
    await api.patch(`/notifications/${id}/read`);
    return { success: true };
  },

  async markAllAsRead(): Promise<{ success: boolean }> {
    await api.patch('/notifications/read-all');
    return { success: true };
  },

  async removeNotification(id: string): Promise<{ success: boolean }> {
    await api.delete(`/notifications/${id}`);
    return { success: true };
  },

  async clearAll(): Promise<{ success: boolean }> {
    await api.delete('/notifications');
    return { success: true };
  },
};
