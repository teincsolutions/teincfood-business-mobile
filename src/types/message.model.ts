export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderAvatarUrl?: string;
  content: string;
  isRead: boolean;
  sentAt: string;
}

export interface Conversation {
  id: string;
  participantId: string;
  participantName: string;
  participantAvatarUrl?: string;
  isOnline: boolean;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
}
