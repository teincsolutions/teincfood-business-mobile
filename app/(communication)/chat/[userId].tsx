// @ts-nocheck
import { useCallback, useState, useRef, useEffect } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ScrollView, KeyboardAvoidingView, Platform, TextInput, Alert, Linking } from 'react-native';
import { YStack, XStack, Text, Image, Button, useTheme, Sheet, Separator } from 'tamagui';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Send, Phone, MoreVertical } from '@tamagui/lucide-icons';
import { BackButton } from '@/components/ui';
import { useAuthStore } from '@/stores/auth.store';
import { useChatParticipantQuery, useChatSocket } from '@/services/messages.service';

export default function ChatScreen() {
  const { userId } = useLocalSearchParams();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const scrollViewRef = useRef(null);
  const normalizedUserId = Array.isArray(userId) ? userId[0] : userId;
  const currentUserId = useAuthStore((state) => state.user?.id || 'me');
  const { data: user } = useChatParticipantQuery(normalizedUserId || '');
  
  const [message, setMessage] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [messages, setMessages] = useState([
    { id: '1', text: 'Hello! Your order is being prepared and will be sent out shortly.', sender: 'them', time: '10:00 AM' },
    { id: '2', text: 'Great, thank you! Please let me know when the rider is on the way.', sender: 'me', time: '10:05 AM' },
    { id: '3', text: "Of course! I'll update the status in the app as well.", sender: 'them', time: '10:06 AM' },
  ]);

  const onChatEvent = useCallback(
    (event) => {
      if (event.type !== 'chat.message') return;
      const payload = event.payload || {};
      const isMe = payload.senderId === currentUserId;
      const time = new Date(event.occurredAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setMessages((prev) => [
        ...prev,
        {
          id: payload.messageId || event.eventId,
          text: payload.text || '',
          sender: isMe ? 'me' : 'them',
          time,
        },
      ]);
      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
    },
    [currentUserId]
  );
  const { sendMessage, markAsRead } = useChatSocket(normalizedUserId || '', onChatEvent);

  // Mark messages as read when chat opens
  useEffect(() => {
    if (normalizedUserId && messages.length > 0) {
      // Mark the last message as read to clear unread count
      const lastMessage = messages[messages.length - 1];
      if (lastMessage) {
        markAsRead(lastMessage.id);
      }
    }
  }, [normalizedUserId, messages, markAsRead]);

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
    setMessages([]);
    setMenuOpen(false);
  };

  const handleViewContact = () => {
    setMenuOpen(false);
    Alert.alert('Contact', `${user?.fullName || 'User'}\n${user?.phone || 'Phone not available'}`);
  };

  const handleSend = () => {
    if (!message.trim()) return;
    sendMessage(message);
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
              source={{ uri: user?.avatarUrl }} 
              width={40} 
              height={40} 
              borderRadius="$full" 
            />
            <YStack>
              <Text fontSize="$4" fontWeight="700" fontFamily="$heading" color="$color">
                {user?.fullName}
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

          {messages.map((msg) => {
            const isMe = msg.sender === 'me';
            return (
              <YStack 
                key={msg.id} 
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
                  {msg.time}
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
              <XStack py="$4" ai="center" jc="space-between" onPress={handleCall}>
                <Text fontSize="$4" fontFamily="$body" color="$color">Call {user?.fullName || 'Contact'}</Text>
                <Phone size={18} color="$primary" />
              </XStack>
              <Separator borderColor="$borderColor" />
              <XStack py="$4" ai="center" jc="space-between" onPress={handleViewContact}>
                <Text fontSize="$4" fontFamily="$body" color="$color">View contact</Text>
              </XStack>
              <Separator borderColor="$borderColor" />
              <XStack py="$4" ai="center" jc="space-between" onPress={handleClearConversation}>
                <Text fontSize="$4" fontFamily="$body" color="$error">Clear conversation</Text>
              </XStack>
            </YStack>
          </Sheet.Frame>
        </Sheet>

      </YStack>
    </KeyboardAvoidingView>
  );
}
