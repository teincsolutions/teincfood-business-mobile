import { Button } from 'tamagui';
import { MessageSquare, Send } from '@tamagui/lucide-icons';
import { useOpenUserChat } from '@/hooks/useOpenUserChat';

interface MessageButtonProps {
  userId: string;
  displayName?: string;
  displayAvatar?: string;
  size?: 'small' | 'medium';
  contactType?: string;
}

export function MessageButton({ userId, displayName, displayAvatar, size = 'medium', contactType }: MessageButtonProps) {
  const openChat = useOpenUserChat();

  if (size === 'small') {
    return (
      <Button
        icon={<Send size={16} />}
        circular
        width={36}
        height={36}
        onPress={() => openChat(userId, displayName, displayAvatar, contactType)}
      />
    );
  }

  return (
    <Button
      icon={<MessageSquare size={20} />}
      onPress={() => openChat(userId, displayName, displayAvatar, contactType)}
    >
      Message
    </Button>
  );
}
