import { MessageSquare, Send } from "@tamagui/lucide-icons";
import { useOpenUserChat } from "@/hooks/useOpenUserChat";
import { Button } from "../ui";

interface MessageButtonProps {
  userId: string;
  displayName?: string;
  displayAvatar?: string;
  size?: "small" | "medium";
  contactType?: string;
  flex?: number;
}

export function MessageButton({
  userId,
  displayName,
  displayAvatar,
  size = "medium",
  contactType,
  flex,
}: MessageButtonProps) {
  const openChat = useOpenUserChat();

  if (size === "small") {
    return (
      <Button
        icon={<Send size={16} />}
        circular
        width={36}
        height={36}
        onPress={() =>
          openChat(userId, displayName, displayAvatar, contactType)
        }
      />
    );
  }

  return (
    <Button
      variant="primary"
      icon={<MessageSquare />}
      flex={flex}
      onPress={() => openChat(userId, displayName, displayAvatar, contactType)}
    >
      Message
    </Button>
  );
}
