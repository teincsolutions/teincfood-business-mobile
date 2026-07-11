import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  Alert,
  Linking,
  TouchableOpacity,
  Animated,
} from 'react-native';
import {
  YStack,
  XStack,
  Text,
  Image,
  Button,
  useTheme,
  Sheet,
  Separator,
} from 'tamagui';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Send,
  Phone,
  MoreVertical,
  Check,
  CheckCheck,
  Clock,
  AlertCircle,
} from '@tamagui/lucide-icons';
import { setStringAsync } from 'expo-clipboard';
import { BackButton } from '@/components/ui';
import { useAuthStore } from '@/stores/auth.store';
import { useChat } from '@/hooks/useChat';
import { getChatClient } from '@/utils/chat-service';
import type { Message, MessageStatus } from '@teincfood/chat-client';
import {
  formatTime,
  formatDateSeparator,
  shouldShowDateSeparator,
} from '@teincfood/chat-client';

// ─── HTML entity decoding ──────────────────────────────────────────────────

const ENTITY_MAP: Record<string, string> = {
  '&#39;': "'",
  '&#x27;': "'",
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#x2F;': '/',
  '&#x60;': '`',
  '&#x3D;': '=',
};

function decodeEntities(text: string): string {
  let result = text;
  for (const [entity, char] of Object.entries(ENTITY_MAP)) {
    result = result.split(entity).join(char);
  }
  result = result.replace(/&#(\d+);/g, (_match, num) => String.fromCharCode(parseInt(num, 10)));
  return result;
}

// ---------------------------------------------------------------------------
// Status icon component (WhatsApp-style)
// ---------------------------------------------------------------------------

type ConnectionStatus = 'connected' | 'disconnected' | 'reconnecting'

function MessageStatusIcon({ status }: { status: MessageStatus }) {
  switch (status) {
    case 'sending':
    case 'failed':
      return <Clock size={12} color="#8696a0" />;
    case 'sent':
      return <Check size={12} color="#8696a0" />;
    case 'delivered':
      return <CheckCheck size={12} color="#8696a0" />;
    case 'read':
      return <CheckCheck size={12} color="#53bdeb" />;
    case 'failed':
      return <AlertCircle size={12} color="#ef4444" />;
    default:
      return null;
  }
}

// ---------------------------------------------------------------------------
// Typing indicator
// ---------------------------------------------------------------------------

function TypingDots() {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const anim = (dot: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, { toValue: 1, duration: 400, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0, duration: 400, useNativeDriver: true }),
        ]),
      );

    anim(dot1, 0).start();
    anim(dot2, 200).start();
    anim(dot3, 400).start();
  }, [dot1, dot2, dot3]);

  const dotStyle = (dot: Animated.Value) => ({
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#8696a0',
    opacity: dot.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] }),
    transform: [{ scale: dot.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1.2] }) }],
  });

  return (
    <XStack gap={4} alignItems="center" paddingHorizontal={4} paddingVertical={6}>
      <Animated.View style={dotStyle(dot1)} />
      <Animated.View style={dotStyle(dot2)} />
      <Animated.View style={dotStyle(dot3)} />
    </XStack>
  );
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface ChatConversationScreenProps {
  conversationId: string;
  displayName?: string;
  displayAvatar?: string;
  phoneNumber?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ContactChatScreen({
  conversationId,
  displayName: propDisplayName,
  displayAvatar,
  phoneNumber,
}: ChatConversationScreenProps) {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const scrollViewRef = useRef<ScrollView>(null);
  const [message, setMessage] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [connectionState, setConnectionState] = useState<ConnectionStatus>('disconnected');
  const [retryTargetId, setRetryTargetId] = useState<string | null>(null);
  const currentUserId = useAuthStore((state) => state.user?.id || '');
  const currentUser = useAuthStore((state) => state.user);

  const client = getChatClient();
  const { messages, send, loadMore, sendTyping, markRead } = useChat(conversationId);

  useEffect(() => {
    const unsub = client.on('connection:status', (status) => {
      setConnectionState(status);
    });
    return unsub;
  }, [client]);

  const prevCountRef = useRef(0);
  useEffect(() => {
    if (messages.length > prevCountRef.current && messages.length - prevCountRef.current < 5) {
      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
    }
    prevCountRef.current = messages.length;
  }, [messages.length]);

  useEffect(() => {
    if (connectionState === 'connected') {
      markRead();
    }
  }, [connectionState, markRead]);

  const isSupport = propDisplayName === 'TeincFood Support';
  const displayName = propDisplayName || currentUser?.full_name || 'Chat';
  const displayPhone = phoneNumber || currentUser?.phone;

  // ---------------------------------------------------------------------------
  // Merge + add date separators
  // ---------------------------------------------------------------------------

  const displayMessages = useMemo(() => {
    const withSeparators: Array<{ type: 'message'; msg: Message } | { type: 'separator'; date: string }> = [];
    let prevDate: string | undefined;
    for (const msg of messages) {
      if (shouldShowDateSeparator(msg.sent_at, prevDate ?? null)) {
        withSeparators.push({ type: 'separator', date: formatDateSeparator(msg.sent_at) });
      }
      withSeparators.push({ type: 'message', msg });
      prevDate = msg.sent_at;
    }
    return withSeparators;
  }, [messages]);

  const hasMoreRef = useRef(true);
  const loadingRef = useRef(false);

  // ---------------------------------------------------------------------------
  // Send
  // ---------------------------------------------------------------------------

  const handleSend = async () => {
    if (!message.trim()) return;
    const outgoingText = message.trim();
    setMessage('');
    setRetryTargetId(null);
    send(outgoingText);
  };

  // ---------------------------------------------------------------------------
  // Retry failed/queued message
  // ---------------------------------------------------------------------------

  const handleRetryMessage = async (localId: string | null) => {
    if (!localId) return;
    const msg = messages.find((m: Message) => m.id === localId);
    if (!msg) return;
    send(msg.content);
  };

  const handleCall = async () => {
    const phone = displayPhone?.trim();
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
    client.store.removeConversation(conversationId);
    setMenuOpen(false);
  };

  const handleViewContact = () => {
    setMenuOpen(false);
    Alert.alert(
      'Contact',
      `${displayName || 'User'}\n${displayPhone || 'Phone not available'}`,
    );
  };

  const canSend = Boolean(message.trim());
  const isConnected = connectionState === 'connected';
  const connFailed = connectionState === 'disconnected';

  const handleRetryConnection = () => {
    client.start(client['tokens'] as any).catch(() => {});
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <YStack flex={1} backgroundColor="$background">
        {/* Header */}
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
              source={{ uri: (displayAvatar || currentUser?.avatar_url) ?? undefined }}
              width={40}
              height={40}
              borderRadius="$full"
            />
            <YStack>
              <Text fontSize="$4" fontWeight="700" fontFamily="$heading" color="$color">
                {displayName}
              </Text>
              {isSupport && (
                <XStack alignItems="center" gap="$1">
                  <YStack
                    width={8}
                    height={8}
                    borderRadius={4}
                    backgroundColor={connFailed ? '#ef4444' : isConnected ? '#25D366' : '#f59e0b'}
                  />
                  <Text fontSize="$2" color="$colorSecondary" fontFamily="$body">
                    {connFailed ? 'Connection failed' : isConnected ? 'Online' : 'Connecting...'}
                  </Text>
                </XStack>
              )}
            </YStack>
          </XStack>

          <XStack gap="$1">
            <Button
              circular
              icon={<Phone size={20} color="$color" />}
              onPress={handleCall}
            />
            <Button
              circular
              icon={<MoreVertical size={20} color="$color" />}
              onPress={() => setMenuOpen(true)}
            />
          </XStack>
        </XStack>

        {/* Retry banner */}
        {connFailed && (
          <XStack
            backgroundColor="#fef2f2"
            padding="$3"
            alignItems="center"
            justifyContent="center"
            gap="$2"
          >
            <Text fontSize="$2" color="#ef4444" fontFamily="$body">
              Connection lost. Messages are saved locally.
            </Text>
            <Button
              size="$2"
              backgroundColor="#ef4444"
              color="white"
              onPress={handleRetryConnection}
              paddingHorizontal="$3"
              borderRadius="$3"
            >
              Retry
            </Button>
          </XStack>
        )}

        {/* Messages */}
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={{ flexGrow: 1, padding: 16, paddingBottom: 24 }}
          onContentSizeChange={() => {
            scrollViewRef.current?.scrollToEnd({ animated: false });
          }}
          onScroll={(e) => {
            const offsetY = e.nativeEvent.contentOffset.y;
            if (offsetY < 50 && hasMoreRef.current && !loadingRef.current) {
              loadingRef.current = true;
              loadMore().finally(() => {
                loadingRef.current = false;
              });
            }
          }}
          scrollEventThrottle={100}
        >
          {displayMessages.length === 0 && (
            <YStack alignItems="center" paddingVertical="$8" gap="$2">
              <Text ta="center" fontSize="$3" color="$colorSecondary" fontFamily="$body">
                {isSupport
                  ? 'Hi! How can we help you today?\nSend a message to start chatting with our support team.'
                  : 'Start a conversation'}
              </Text>
            </YStack>
          )}

          {displayMessages.map((item) => {
            if (item.type === 'separator') {
              return (
                <YStack key={item.date} alignItems="center" marginVertical="$3">
                  <YStack
                    backgroundColor="$backgroundSoft"
                    paddingHorizontal="$3"
                    paddingVertical="$1"
                    borderRadius="$4"
                  >
                    <Text fontSize="$2" color="$colorSecondary" fontFamily="$body">
                      {item.date}
                    </Text>
                  </YStack>
                </YStack>
              );
            }

            const msg = item.msg;
            const isMe = msg.sender_id === currentUserId;
            const isFailed = msg.status === 'failed';

            return (
              <TouchableOpacity
                key={msg.id}
                onPress={() => {
                  if (isFailed) {
                    setRetryTargetId(msg.id);
                  }
                }}
                onLongPress={() => {
                  setStringAsync(msg.content);
                }}
                delayLongPress={400}
                activeOpacity={isFailed ? 0.6 : 1}
              >
                <YStack
                  alignSelf={isMe ? 'flex-end' : 'flex-start'}
                  maxWidth="82%"
                  marginBottom="$2"
                >
                  <YStack
                    backgroundColor={
                      isMe ? (isFailed ? '#e8e8e8' : '#dcf8c6') : '#f0f0f0'
                    }
                    paddingHorizontal="$3"
                    paddingVertical="$2"
                    borderRadius="$3"
                    borderBottomRightRadius={isMe ? 2 : '$3'}
                    borderBottomLeftRadius={isMe ? '$3' : 2}
                  >
                    <Text fontSize="$4" fontFamily="$body" color={isMe ? '#111' : '#111'}>
                      {decodeEntities(msg.content)}
                    </Text>
                    <XStack gap={3} alignItems="center" justifyContent="flex-end" marginTop={2}>
                      <Text fontSize={10} color="#667781" fontFamily="$body">
                        {formatTime(msg.sent_at)}
                      </Text>
                      {isMe && <MessageStatusIcon status={msg.status} />}
                      {msg.channel === 'whatsapp' && (
                        <Text fontSize={10} color="#667781" fontFamily="$body">
                          WhatsApp
                        </Text>
                      )}
                    </XStack>
                  </YStack>

                  {isFailed && retryTargetId === msg.id && (
                    <TouchableOpacity
                      onPress={() => handleRetryMessage(msg.id)}
                      style={{ marginTop: 4 }}
                    >
                      <Text fontSize={12} color="#ef4444" fontFamily="$body" textAlign="right">
                        Tap to retry
                      </Text>
                    </TouchableOpacity>
                  )}
                </YStack>
              </TouchableOpacity>
            );
          })}

          {/* Typing indicator — placeholder; app doesn't receive remote typing yet */}
        </ScrollView>

        {/* Input bar */}
        <YStack
          paddingHorizontal="$3"
          paddingTop="$2"
          paddingBottom={Math.max(insets.bottom, 16)}
          backgroundColor="$background"
          borderTopWidth={1}
          borderTopColor="$borderColor"
        >
          <XStack gap="$2" alignItems="flex-end">
            <XStack
              flex={1}
              backgroundColor="$backgroundSoft"
              borderRadius="$5"
              paddingHorizontal="$3"
              minHeight={44}
              alignItems="flex-start"
              paddingVertical="$2"
            >
              <TextInput
                placeholder="Type a message..."
                value={message}
                onChangeText={(val) => {
                  setMessage(val);
                  sendTyping();
                }}
                multiline
                blurOnSubmit={false}
                scrollEnabled={false}
                textAlignVertical="top"
                returnKeyType="default"
                placeholderTextColor={theme.colorPlaceholder?.val as string}
                style={{
                  flex: 1,
                  color: theme.color?.val as string,
                  fontSize: 15,
                  fontFamily: 'Sen_400Regular',
                  minHeight: 24,
                  paddingTop: 8,
                  paddingBottom: 8,
                  maxHeight: 100,
                }}
              />
            </XStack>
            <Button
              circular
              width={44}
              height={44}
              backgroundColor={canSend ? '#25D366' : '$colorDisabled'}
              borderWidth={0}
              pressStyle={{ backgroundColor: '#20bd5a' }}
              icon={
                <Send
                  size={20}
                  color={(theme.white?.val as string) || '#FFFFFF'}
                />
              }
              onPress={handleSend}
              disabled={!canSend}
            />
          </XStack>
        </YStack>

        {/* Menu sheet */}
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
            <YStack paddingHorizontal="$5" paddingVertical="$4">
              <Text fontSize="$5" fontWeight="800" fontFamily="$heading" color="$color">
                Conversation Actions
              </Text>
            </YStack>
            <YStack paddingHorizontal="$5" paddingBottom="$6">
              <XStack paddingVertical="$4" alignItems="center" justifyContent="space-between" onPress={handleCall}>
                <Text fontSize="$4" fontFamily="$body" color="$color">
                  Call {displayName || 'Contact'}
                </Text>
                <Phone size={18} color="$primary" />
              </XStack>
              <Separator borderColor="$borderColor" />
              <XStack paddingVertical="$4" alignItems="center" justifyContent="space-between" onPress={handleViewContact}>
                <Text fontSize="$4" fontFamily="$body" color="$color">
                  View contact
                </Text>
              </XStack>
              <Separator borderColor="$borderColor" />
              <XStack paddingVertical="$4" alignItems="center" justifyContent="space-between" onPress={handleClearConversation}>
                <Text fontSize="$4" fontFamily="$body" color="$error">
                  Clear conversation
                </Text>
              </XStack>
            </YStack>
          </Sheet.Frame>
        </Sheet>
      </YStack>
    </KeyboardAvoidingView>
  );
}
