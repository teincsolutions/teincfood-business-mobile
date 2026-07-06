// @ts-nocheck
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
import * as Clipboard from 'expo-clipboard';
import { BackButton } from '@/components/ui';
import { useAuthStore } from '@/stores/auth.store';
import { useChat } from '@/hooks/useChat';
import type { Message as StoredMessage, MessageStatus as ChatMessageStatus, ConnectionState } from '@teincfood/chat-client';
import { formatTime, formatDateSeparator, shouldShowDateSeparator } from '@teincfood/chat-client';

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

function MessageStatusIcon({ status }: { status: ChatMessageStatus }) {
  switch (status) {
    case 'sending':
      return <Clock size={12} color="#8696a0" />;
    case 'queued':
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
  const [retryTargetId, setRetryTargetId] = useState<string | null>(null);
  const currentUserId = useAuthStore((state) => state.user?.id || '');

  const {
    chatTopic,
    user,
    initialMessages,
    storedMessages,
    sendMessage,
    setTyping,
    isTyping,
    isReady,
    client,
    connectionState,
    loadOlderMessages,
    loadingOlder,
    markRead,
  } = useChat({ conversationId });

  const scrollOffsetRef = useRef(0);
  const loadingOlderRef = useRef(false);
  const hasMoreRef = useRef(true);

  useEffect(() => {
    if (isReady) {
      markRead();
    }
  }, [isReady, markRead]);

  const isSupport = propDisplayName === 'TeincFood Support';
  const displayName = propDisplayName || user?.fullName || 'Chat';
  const displayPhone = phoneNumber || user?.phone;

  // ---------------------------------------------------------------------------
  // Merge stored + REST messages into displayed messages
  // ---------------------------------------------------------------------------

  const messages = useMemo(() => {
    const map = new Map<string, StoredMessage>();

    if (initialMessages) {
      for (const rest of initialMessages) {
        const key = rest.id;
        map.set(key, {
          id: rest.id,
          localId: rest.id,
          conversationId: rest.conversation_id,
          senderId: rest.sender_id,
          text: rest.text,
          status: (rest.status as ChatMessageStatus) ?? 'delivered',
          channel: rest.channel ?? 'app',
          sentAt: rest.sent_at,
        });
      }
    }

    for (const msg of storedMessages) {
      const serverKey = msg.id && msg.id !== msg.localId ? msg.id : null;
      if (serverKey && map.has(serverKey)) continue;

      const key = msg.localId;
      const existing = map.get(key);
      if (existing) {
        map.set(key, { ...existing, status: existing.status === 'queued' ? 'queued' : (msg.status === 'queued' ? 'queued' : existing.status) });
      } else {
        map.set(key, msg);
      }
    }

    const sorted = Array.from(map.values()).sort(
      (a, b) => new Date(a.sentAt).getTime() - new Date(b.sentAt).getTime(),
    );

    const withSeparators: Array<{ type: 'message'; msg: StoredMessage } | { type: 'separator'; date: string }> = [];
    let prevDate: string | undefined;
    for (const msg of sorted) {
      if (shouldShowDateSeparator(msg.sentAt, prevDate)) {
        withSeparators.push({ type: 'separator', date: formatDateSeparator(msg.sentAt) });
      }
      withSeparators.push({ type: 'message', msg });
      prevDate = msg.sentAt;
    }

    return withSeparators;
  }, [storedMessages, initialMessages]);

  const prevCountRef = useRef(0);
  useEffect(() => {
    if (messages.length > prevCountRef.current && messages.length - prevCountRef.current < 5 && !loadingOlderRef.current) {
      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
    }
    prevCountRef.current = messages.length;
  }, [messages.length]);

  // ---------------------------------------------------------------------------
  // Send
  // ---------------------------------------------------------------------------

  const handleSend = async () => {
    if (!message.trim()) return;
    const outgoingText = message.trim();
    setMessage('');

    setRetryTargetId(null);

    if (!isReady) {
      await sendMessage(outgoingText);
      return;
    }

    await sendMessage(outgoingText);
  };

  // ---------------------------------------------------------------------------
  // Retry failed/queued message
  // ---------------------------------------------------------------------------

  const handleRetryMessage = async (localId: string) => {
    const msg = storedMessages.find((m: StoredMessage) => m.localId === localId);
    if (!msg || !chatTopic) return;
    await sendMessage(msg.text);
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
    client.store.clear(conversationId);
    setMenuOpen(false);
  };

  const handleViewContact = () => {
    setMenuOpen(false);
    Alert.alert(
      'Contact',
      `${displayName || 'User'}\n${displayPhone || 'Phone not available'}`,
    );
  };

  const canSend = Boolean(message.trim() && chatTopic);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  const isConnected = connectionState === 'connected';
  const connFailed = connectionState === 'failed';
  const showRetryBanner = connectionState === 'reconnecting' || connFailed;

  const handleRetryConnection = () => {
    client.retryConnection();
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
              source={{ uri: displayAvatar || user?.avatarUrl }}
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
                    {connFailed ? 'Connection failed' : connectionState === 'reconnecting' ? 'Reconnecting...' : isConnected ? 'Online' : 'Offline'}
                  </Text>
                </XStack>
              )}
            </YStack>
          </XStack>

          <XStack gap="$1">
            <Button
              circular
              variant="ghost"
              icon={<Phone size={20} color="$color" />}
              onPress={handleCall}
            />
            <Button
              circular
              variant="ghost"
              icon={<MoreVertical size={20} color="$color" />}
              onPress={() => setMenuOpen(true)}
            />
          </XStack>
        </XStack>

        {/* Retry banner */}
        {showRetryBanner && (
          <XStack
            backgroundColor={connFailed ? '#fef2f2' : '#fffbeb'}
            padding="$3"
            alignItems="center"
            justifyContent="center"
            gap="$2"
          >
            <Text fontSize="$2" color={connFailed ? '#ef4444' : '#f59e0b'} fontFamily="$body">
              {connFailed
                ? 'Connection lost. Messages are saved locally.'
                : 'Reconnecting...'}
            </Text>
            {connFailed && (
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
            )}
          </XStack>
        )}

        {/* Messages */}
        <ScrollView
          ref={scrollViewRef}
          flex={1}
          contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
          onContentSizeChange={() => {
            if (!loadingOlderRef.current) {
              scrollViewRef.current?.scrollToEnd({ animated: false });
            }
          }}
          onScroll={(e) => {
            const offsetY = e.nativeEvent.contentOffset.y;
            if (offsetY > scrollOffsetRef.current) {
              scrollOffsetRef.current = offsetY;
            }
            if (offsetY < 50 && hasMoreRef.current && !loadingOlderRef.current && isReady) {
              loadingOlderRef.current = true;
              loadOlderMessages().then((older) => {
                if (older.length > 0) {
                  scrollOffsetRef.current += older.length;
                } else {
                  hasMoreRef.current = false;
                }
              }).finally(() => { loadingOlderRef.current = false; });
            }
          }}
          scrollEventThrottle={100}
        >
          {messages.length === 0 && (
            <YStack alignItems="center" paddingVertical="$8" gap="$2">
              <Text ta="center" fontSize="$3" color="$colorSecondary" fontFamily="$body">
                {isSupport
                  ? 'Hi! How can we help you today?\nSend a message to start chatting with our support team.'
                  : 'Start a conversation'}
              </Text>
            </YStack>
          )}

          {messages.map((item) => {
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
            const isMe = msg.senderId === currentUserId;
            const isFailed = msg.status === 'failed';
            const isQueued = msg.status === 'queued';

            return (
              <TouchableOpacity
                key={msg.localId}
                onPress={() => {
                  if (isFailed || isQueued) {
                    setRetryTargetId(msg.localId);
                  }
                }}
                onLongPress={() => {
                  Clipboard.setStringAsync(msg.text);
                }}
                delayLongPress={400}
                activeOpacity={isFailed || isQueued ? 0.6 : 1}
              >
                <YStack
                  alignSelf={isMe ? 'flex-end' : 'flex-start'}
                  maxWidth="82%"
                  marginBottom="$2"
                >
                  <YStack
                    backgroundColor={
                      isMe ? (msg.status === 'failed' || msg.status === 'queued' ? '#e8e8e8' : '#dcf8c6') : '#f0f0f0'
                    }
                    paddingHorizontal="$3"
                    paddingVertical="$2"
                    borderRadius="$3"
                    borderBottomRightRadius={isMe ? 2 : '$3'}
                    borderBottomLeftRadius={isMe ? '$3' : 2}
                  >
                    <Text fontSize="$4" fontFamily="$body" color={isMe ? '#111' : '#111'}>
                      {decodeEntities(msg.text)}
                    </Text>
                    <XStack gap={3} alignItems="center" justifyContent="flex-end" marginTop={2}>
                      <Text fontSize={10} color="#667781" fontFamily="$body">
                        {formatTime(msg.sentAt)}
                      </Text>
                      {isMe && <MessageStatusIcon status={msg.status} />}
                      {msg.channel === 'whatsapp' && (
                        <Text fontSize={10} color="#667781" fontFamily="$body">
                          WhatsApp
                        </Text>
                      )}
                    </XStack>
                  </YStack>

                  {(isFailed || isQueued) && retryTargetId === msg.localId && (
                    <TouchableOpacity
                      onPress={() => handleRetryMessage(msg.localId)}
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

          {/* Typing indicator */}
          {isTyping && !isSupport && (
            <YStack alignSelf="flex-start" maxWidth="60%" marginBottom="$2">
              <YStack
                backgroundColor="#f0f0f0"
                paddingHorizontal="$3"
                paddingVertical="$1"
                borderRadius="$3"
                borderBottomLeftRadius={2}
              >
                <TypingDots />
              </YStack>
            </YStack>
          )}
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
                  setTyping(val.length > 0);
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
            <YStack px="$5" py="$4">
              <Text fontSize="$5" fontWeight="800" fontFamily="$heading" color="$color">
                Conversation Actions
              </Text>
            </YStack>
            <YStack px="$5" pb="$6">
              <XStack py="$4" ai="center" jc="space-between" onPress={handleCall}>
                <Text fontSize="$4" fontFamily="$body" color="$color">
                  Call {displayName || 'Contact'}
                </Text>
                <Phone size={18} color="$primary" />
              </XStack>
              <Separator borderColor="$borderColor" />
              <XStack py="$4" ai="center" jc="space-between" onPress={handleViewContact}>
                <Text fontSize="$4" fontFamily="$body" color="$color">
                  View contact
                </Text>
              </XStack>
              <Separator borderColor="$borderColor" />
              <XStack py="$4" ai="center" jc="space-between" onPress={handleClearConversation}>
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
