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
import type { StoredMessage, ChatMessageStatus, ConnectionState } from '@teincfood/chat-client';

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
  // Also handle numeric HTML entities like &#39; (already in map) 
  // and any remaining &#NNN; patterns
  result = result.replace(/&#(\d+);/g, (_match, num) => String.fromCharCode(parseInt(num, 10)));
  return result;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

function formatDateSeparator(iso: string): string {
  try {
    const d = new Date(iso);
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);

    if (d.toDateString() === now.toDateString()) return 'Today';
    if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return d.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });
  } catch {
    return '';
  }
}

function shouldShowDateSeparator(current: string, previous?: string): boolean {
  if (!previous) return true;
  try {
    return new Date(current).toDateString() !== new Date(previous).toDateString();
  } catch {
    return true;
  }
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

function statusLabel(status: ChatMessageStatus): string {
  switch (status) {
    case 'sending': return 'Sending';
    case 'queued': return 'Queued';
    case 'sent': return 'Sent';
    case 'delivered': return 'Delivered';
    case 'read': return 'Read';
    case 'failed': return 'Failed';
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
  userId: string;
  orderId?: string;
  isDirect?: boolean;
  topic?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ChatConversationScreen({
  userId,
  orderId,
  isDirect = false,
  topic: customTopic,
}: ChatConversationScreenProps) {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const scrollViewRef = useRef<ScrollView>(null);
  const [message, setMessage] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const currentUserId = useAuthStore((state) => state.user?.id || '');
  const isSupport = userId === 'support';

  const {
    isSupportChat,
    isOrderPairChat,
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
    activeConversationId,
  } = useChat(isSupport ? { userId: 'support' } : customTopic ? { userId: currentUserId, topic: customTopic } : { userId: currentUserId, otherUserId: userId, orderId, isDirect });

  const scrollOffsetRef = useRef(0);
  const loadingOlderRef = useRef(false);
  const hasMoreRef = useRef(true);

  const displayName = isSupportChat ? 'TeincFood Support' : user?.fullName || 'Chat';
  const displayPhone = user?.phone;

  // ---------------------------------------------------------------------------
  // Merge stored + REST messages into displayed messages
  // ---------------------------------------------------------------------------

  const messages = useMemo(() => {
    // Deduplicate by id (keep the entry with higher sortKey / newer status)
    const seen = new Map<string, StoredMessage>();
    for (const msg of storedMessages) {
      const key = msg.id || msg.localId;
      const existing = seen.get(key);
      if (!existing || (msg.sortKey ?? 0) > (existing.sortKey ?? 0)) {
        seen.set(key, msg);
      }
    }

    const sorted = Array.from(seen.values()).sort((a, b) => {
      // Primary sort by sentAt timestamp (handles REST-loaded older messages correctly)
      const ta = new Date(a.sentAt).getTime();
      const tb = new Date(b.sentAt).getTime();
      if (ta !== tb) return ta - tb;
      // Tiebreaker by sortKey (preserves insertion order for same-timestamp messages)
      return (a.sortKey ?? 0) - (b.sortKey ?? 0);
    });

    // Inject date separators
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
  }, [storedMessages]);

  // Auto-scroll to bottom when new messages arrive (not on pagination load)
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

    if (!isReady) {
      console.log('[Chat] Channel not ready (isReady=' + isReady + '), queuing message');
      await sendMessage(outgoingText);
      return;
    }

    console.log('[Chat] Sending message:', outgoingText, 'isReady=' + isReady);
    const sent = await sendMessage(outgoingText);
    console.log('[Chat] Send result:', sent ? 'sent' : 'queued for retry');
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
    if (activeConversationId) {
      client.store.clear(activeConversationId);
    }
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
              source={{ uri: user?.avatarUrl }}
              width={40}
              height={40}
              borderRadius="$full"
            />
            <YStack>
              <Text fontSize="$4" fontWeight="700" fontFamily="$heading" color="$color">
                {displayName}
              </Text>
              <XStack alignItems="center" gap="$1">
                {isSupportChat ? (
                  <>
                    <YStack
                      width={8}
                      height={8}
                      borderRadius={4}
                      backgroundColor={connFailed ? '#ef4444' : isConnected ? '#25D366' : '#f59e0b'}
                    />
                    <Text fontSize="$2" color="$colorSecondary" fontFamily="$body">
                      {connFailed ? 'Connection failed' : connectionState === 'reconnecting' ? 'Reconnecting...' : isConnected ? 'Online' : 'Offline'}
                    </Text>
                  </>
                ) : null}
              </XStack>
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
              const cid = activeConversationId;
              if (!cid) { loadingOlderRef.current = false; return; }

              client.rest.fetchMessages(cid, Math.round(scrollOffsetRef.current)).then((older) => {
                if (older.length > 0) {
                  scrollOffsetRef.current += older.length;
                  // Screen re-renders from useChat's storedMessages after history loads
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
                {isSupportChat
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
                  toast.success('Copied to clipboard');
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

                  {/* Retry hint */}
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
          {isTyping && !isSupportChat && (
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
