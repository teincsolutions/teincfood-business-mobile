export type NotificationType =
  | 'new_order'
  | 'review'
  | 'cancellation'
  | 'delivery_update'
  | 'promotion';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  senderName: string;
  senderAvatarUrl?: string;
  imageUrl?: string;
  isRead: boolean;
  createdAt: string;
}
