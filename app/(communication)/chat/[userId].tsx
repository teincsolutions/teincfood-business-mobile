// @ts-nocheck
import { useCallback, useState, useRef, useEffect } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ScrollView, KeyboardAvoidingView, Platform, TextInput, Alert, Linking } from 'react-native';
import { YStack, XStack, Text, Image, Button, useTheme, Sheet, Separator } from 'tamagui';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Send, Phone, MoreVertical } from '@tamagui/lucide-icons';
import { BackButton } from '@/components/ui';
import { AppAlertDialog } from '@/components/ui/AlertDialog';
import { useAuthStore } from '@/stores/auth.store';
import { useChatStore } from '@/stores/chat.store';
import { useChatParticipantQuery, useChatSocket } from '@/services/messages.service';
import { useChat } from '@/hooks/useChat';
import type { StoredMessage } from '@/types/chat';

export default function ChatScreen() {
  const { userId } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const scrollViewRef = useRef(null);
  const normalizedUserId = Array.isArray(userId) ? userId[0] : userId;
  const currentUserId = useAuthStore((state) => state.user?.id || 'me');
  const isSupportChat = normalizedUserId === 'support';
  const [message, setMessage] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);

  // Always call hooks at top level (unconditional)
  const { data: user } = useChatParticipantQuery(normalizedUserId || '');

  const onChatEvent = useCallback(
    (event: any) => {
      const payload = event.payload || event;
      const text = payload.text || payload.content || '';
      const senderId = payload.senderId || payload.sender_id || '';
      const msgId = payload.messageId || payload.id || `msg_${Date.now()}`;
      const insertedAt = payload.insertedAt || payload.inserted_at || new Date().toISOString();
      const isMe = senderId === currentUserId;

      const conversationId = payload.conversationId || payload.conversation_id || normalizedUserId;
      if (!conversationId) return;

      useChatStore.getState().upsertMessage(conversationId, {
        id: msgId,
        localId: `local_${msgId}`,
        conversationId,
        senderId,
        text,
        status: isMe ? 'sent' : 'received',
        channel: 'websocket',
        sentAt: insertedAt,
      });

      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
    },
    [currentUserId, normalizedUserId]
  );

  // Support chat uses the full useChat hook
  const supportChat = useChat({
    userId: 'support',
    onChatEvent,
  });

  // Non-support chats use raw socket
  const { sendMessage: rawSendMessage, joinError } = useChatSocket(normalizedUserId || '', onChatEvent);
  const [chatError, setChatError] = useState<string | null>(null);

  // Show error dialog when chat join fails and navigate back
  useEffect(() => {
    if (joinError) {
      setChatError(joinError);
    }
  }, [joinError]);

  const sendMessage = isSupportChat ? supportChat.sendMessage : rawSendMessage;

  // Store messages for current conversation
  const messagesMap = useChatStore((state) => state.messages);
  const storedMessages = normalizedUserId ? (messagesMap[normalizedUserId] ?? []) : [];

  // For support chat, also use supportChat's stored messages when available
  const displayMessages = isSupportChat && supportChat.storedMessages.length > 0
    ? supportChat.storedMessages
    : storedMessages;

  const handleCall = async () => {
    const phone = user?.phone?.trim();
    if (!phone) {
      Alert.alert('Call unavailable', 'No phone number is available for this contact.');
      return;
    }
    const url = `tel:${phone.replace(/\s+/g, '')}`;
    const canOpen = await Linking.canOpenURL(url);
    if (!canOpen) {
      Alert.alert('Call unavailable', 'This device cannot place calls right now.');
      return;
    }
    await Linking.openURL(url);
  };

  const handleClearConversation = () => {
    if (normalizedUserId) {
      useChatStore.getState().clearConversation(normalizedUserId);
    }
    setMenuOpen(false);
  };

  const handleViewContact = () => {
    setMenuOpen(false);
    Alert.alert('Contact', `${user?.full_name || 'User'}\n${user?.phone || 'Phone not available'}`);
  };

  const handleSend = () => {
    if (!message.trim()) return;
    sendMessage(message);

    if (normalizedUserId) {
      useChatStore.getState().upsertMessage(normalizedUserId, {
        id: `msg_${Date.now()}`,
        localId: `local_${Date.now()}`,
        conversationId: normalizedUserId,
        senderId: currentUserId,
        text: message.trim(),
        status: 'sending',
        channel: 'websocket',
        sentAt: new Date().toISOString(),
      });
    }

    setMessage('');
  };
  const canSend = Boolean(message.trim());

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1 }} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <YStack flex={1} backgroundColor="$background">
        
        {/* Chat Header */}
        <XStack 
          paddingTop={Math.max(insets.top, 50)} 
          paddingBottom="$3" 
          paddingHorizontal="$4" 
          backgroundColor="$background" 
          alignItems="center" 
          gap="$3"
          borderBottomWidth={1}
          borderBottomColor="$borderColor"
        >
          <BackButton />
          <XStack flex={1} gap="$3" alignItems="center">
            <Image 
              source={{ uri: user?.avatar_url }} 
              width={40} 
              height={40} 
              borderRadius="$full" 
            />
            <YStack>
              <Text fontSize="$4" fontWeight="700" fontFamily="$heading" color="$color">
                {user?.full_name || (isSupportChat ? 'Support' : 'Chat')}
              </Text>
              <XStack alignItems="center" gap="$1">
                <YStack width={8} height={8} borderRadius={4} backgroundColor="$green" />
                <Text fontSize="$2" color="$colorSecondary" fontFamily="$body">Online</Text>
              </XStack>
            </YStack>
          </XStack>
          
          <XStack gap="$1">
            <Button circular variant="ghost" icon={<Phone size={20} color="$color" />} onPress={handleCall} />
            <Button circular variant="ghost" icon={<MoreVertical size={20} color="$color" />} onPress={() => setMenuOpen(true)} />
          </XStack>
        </XStack>

        {/* Message List */}
        <ScrollView 
          ref={scrollViewRef}
          flex={1} 
          contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
          onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
        >
          <Text ta="center" fontSize="$2" color="$colorSecondary" fontFamily="$body" mb="$5">
            TODAY
          </Text>

          {displayMessages.map((msg) => {
            const isMe = msg.senderId === currentUserId;
            return (
              <YStack 
                key={msg.id || msg.localId} 
                alignSelf={isMe ? 'flex-end' : 'flex-start'} 
                maxWidth="80%" 
                marginBottom="$4"
              >
                <YStack 
                  backgroundColor={isMe ? '$primary' : '$backgroundSoft'} 
                  paddingHorizontal="$4" 
                  paddingVertical="$3" 
                  borderRadius="$4"
                  borderTopRightRadius={isMe ? 0 : "$4"}
                  borderTopLeftRadius={isMe ? "$4" : 0}
                >
                  <Text 
                    color={isMe ? '$white' : '$color'} 
                    fontSize="$4" 
                    fontFamily="$body"
                  >
                    {msg.text}
                  </Text>
                </YStack>
                <Text 
                  fontSize="$1" 
                  color="$colorSecondary" 
                  fontFamily="$body" 
                  marginTop="$1"
                  alignSelf={isMe ? 'flex-end' : 'flex-start'}
                >
                  {msg.sentAt ? new Date(msg.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                </Text>
              </YStack>
            );
          })}
        </ScrollView>

        {/* Input Bar */}
        <YStack 
          paddingHorizontal="$4" 
          paddingTop="$3" 
          paddingBottom={Math.max(insets.bottom, 20)}
          backgroundColor="$background"
          borderTopWidth={1}
          borderTopColor="$borderColor"
        >
          <XStack gap="$3" alignItems="center">
            <XStack flex={1} backgroundColor="$backgroundSoft" borderRadius="$full" paddingHorizontal="$4" height={44} alignItems="center">
              <TextInput 
                placeholder="Type a message..." 
                value={message}
                onChangeText={setMessage}
                placeholderTextColor={theme.colorPlaceholder.val as string}
                style={{ flex: 1, color: theme.color.val as string, fontSize: 14, fontFamily: 'Sen_400Regular' }}
              />
            </XStack>
            <Button 
              circular 
              width={44} 
              height={44} 
              backgroundColor={canSend ? '$primary' : '$colorDisabled'}
              borderWidth={1}
              borderColor={canSend ? '$primary' : '$borderColor'}
              pressStyle={{ backgroundColor: '$primaryDark' }}
              icon={<Send size={20} color="$white" />} 
              onPress={handleSend}
              disabled={!canSend}
            />
          </XStack>
        </YStack>

        <Sheet
          modal
          open={menuOpen}
          onOpenChange={setMenuOpen}
          snapPoints={[30]}
          dismissOnSnapToBottom
          zIndex={100_000}
        >
          <Sheet.Overlay
            animation="lazy"
            enterStyle={{ opacity: 0 }}
            exitStyle={{ opacity: 0 }}
            backgroundColor="rgba(0,0,0,0.5)"
          />
          <Sheet.Frame backgroundColor="$background" borderTopLeftRadius="$8" borderTopRightRadius="$8">
            <Sheet.Handle backgroundColor="$gray200" marginTop="$2" />
            <YStack px="$5" py="$4">
              <Text fontSize="$5" fontWeight="800" fontFamily="$heading" color="$color">
                Conversation Actions
              </Text>
            </YStack>
            <YStack px="$5" pb="$6">
              <XStack py="$4" items="center" jc="space-between" onPress={handleCall}>
                <Text fontSize="$4" fontFamily="$body" color="$color">Call {user?.full_name || 'Contact'}</Text>
                <Phone size={18} color="$primary" />
              </XStack>
              <Separator borderColor="$borderColor" />
              <XStack py="$4" items="center" jc="space-between" onPress={handleViewContact}>
                <Text fontSize="$4" fontFamily="$body" color="$color">View contact</Text>
              </XStack>
              <Separator borderColor="$borderColor" />
              <XStack py="$4" items="center" jc="space-between" onPress={handleClearConversation}>
                <Text fontSize="$4" fontFamily="$body" color="$error">Clear conversation</Text>
              </XStack>
            </YStack>
          </Sheet.Frame>
        </Sheet>

        {/* Chat join error dialog */}
        <AppAlertDialog
          open={!!chatError}
          onOpenChange={(open) => {
            if (!open) {
              setChatError(null);
              router.back();
            }
          }}
          title="Chat unavailable"
          description={chatError || 'You can only chat with users on an active order.'}
          confirmText="GO BACK"
          onConfirm={() => {
            setChatError(null);
            router.back();
          }}
        />

      </YStack>
    </KeyboardAvoidingView>
  );
}
