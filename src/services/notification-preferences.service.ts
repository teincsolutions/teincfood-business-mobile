import { api } from './api';

export interface NotificationPreferences {
  push_order_updates: boolean;
  push_promotions: boolean;
  email_newsletter: boolean;
}

export const notificationPreferencesService = {
  async getPreferences(): Promise<NotificationPreferences> {
    const res = await api.get<{ data: NotificationPreferences }>(
      '/users/me/notification-preferences',
    );
    return res.data;
  },

  async updatePreferences(
    prefs: Partial<NotificationPreferences>,
  ): Promise<NotificationPreferences> {
    const res = await api.put<{ data: NotificationPreferences }>(
      '/users/me/notification-preferences',
      { notification_preferences: prefs },
    );
    return res.data;
  },
};
