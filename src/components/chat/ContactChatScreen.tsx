// @ts-nocheck
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  Alert,
  Linking,
  TouchableOpacity,
  Animated,
} from "react-native";
import {
  YStack,
  XStack,
  Text,
  Avatar,
  Button,
  useTheme,
  Sheet,
  Separator,
} from "tamagui";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Send,
  Phone,
  MoreVertical,
  Check,
  CheckCheck,
  Clock,
  AlertCircle,
  Building2,
} from "@tamagui/lucide-icons";
import { setStringAsync } from "expo-clipboard";
import { BackButton } from "@/components/ui";
import { useAuthStore } from "@/stores/auth.store";
import { useChat } from "@/hooks/useChat";
import { getChatClient } from "@/utils/chat-service";
import type { Message, MessageStatus, MarkdownToken } from "@teincfood/chat-client";
import {
  formatTime,
  formatDateSeparator,
  shouldShowDateSeparator,
  parseMarkdown,
} from "@teincfood/chat-client";

// ─── HTML entity decoding ──────────────────────────────────────────────────

const ENTITY_MAP: Record<string, string> = {
  "&#39;": "'",
  "&#x27;": "'",
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#x2F;": "/",
  "&#x60;": "`",
  "&#x3D;": "=",
};

function decodeEntities(text: string): string {
  let result = text;
  for (const [entity, char] of Object.entries(ENTITY_MAP)) {
    result = result.split(entity).join(char);
  }
  result = result.replace(/&#(\d+);/g, (_match, num) =>
    String.fromCharCode(parseInt(num, 10)),
  );
  return result;
}

// ─── WhatsApp-style markdown renderer ───────────────────────────────────────

const codeFontFamily = Platform.OS === "ios" ? "Menlo" : "monospace";

function renderMarkdown(tokens: MarkdownToken[]) {
  return tokens.map((token, i) => {
    switch (token.type) {
      case "bold":
        return (
          <Text key={i} fontWeight="700">
            {token.text}
          </Text>
        );
      case "italic":
        return (
          <Text key={i} fontStyle="italic">
            {token.text}
          </Text>
        );
      case "boldItalic":
        return (
          <Text key={i} fontWeight="700" fontStyle="italic">
            {token.text}
          </Text>
        );
      case "strikethrough":
        return (
          <Text key={i} textDecorationLine="line-through">
            {token.text}
          </Text>
        );
      case "code":
        return (
          <Text key={i} fontFamily={codeFontFamily}>
            {token.text}
          </Text>
        );
      default:
        return token.text;
    }
  });
}

// ---------------------------------------------------------------------------
// Status icon component (WhatsApp-style)
// ---------------------------------------------------------------------------

type ConnectionStatus = "connected" | "disconnected" | "reconnecting";

function MessageStatusIcon({ status }: { status: MessageStatus }) {
  switch (status) {
    case "sending":
      return <Clock size={12} color="$colorMuted" />;
    case "sent":
      return <Check size={12} color="$colorMuted" />;
    case "delivered":
      return <CheckCheck size={12} color="$colorMuted" />;
    case "read":
      return <CheckCheck size={12} color="$info" />;
    case "failed":
      return <AlertCircle size={12} color="$error" />;
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
  const theme = useTheme();

  useEffect(() => {
    const anim = (dot: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(dot, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
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
    backgroundColor: (theme.colorMuted?.val as string) || "#A0A5BA",
    opacity: dot.interpolate({ inputRange: [0, 1], outputRange: [0.3, 1] }),
    transform: [
      {
        scale: dot.interpolate({ inputRange: [0, 1], outputRange: [0.8, 1.2] }),
      },
    ],
  });

  return (
    <XStack
      gap={4}
      alignItems="center"
      paddingHorizontal={4}
      paddingVertical={6}
    >
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
  isBusiness?: boolean;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ContactChatScreen({
  conversationId,
  displayName: propDisplayName,
  displayAvatar,
  phoneNumber,
  isBusiness = false,
}: ChatConversationScreenProps) {
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const scrollViewRef = useRef<ScrollView>(null);
  const [message, setMessage] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [connectionState, setConnectionState] =
    useState<ConnectionStatus>("disconnected");
  const [retryTargetId, setRetryTargetId] = useState<string | null>(null);
  const [retryClientId, setRetryClientId] = useState<string | null>(null);
  const currentUserId = useAuthStore((state) => state.user?.id || "");

  const client = getChatClient();
  const { messages, send, loadMore, sendTyping, markRead } =
    useChat(conversationId);

  useEffect(() => {
    // Sync initial state (connection may have been established before mount)
    setConnectionState(client.isConnected() ? "connected" : "disconnected");
    const unsub = client.on("connection:status", (status) => {
      setConnectionState(status);
    });
    return unsub;
  }, [client]);

  const prevCountRef = useRef(0);
  useEffect(() => {
    if (
      messages.length > prevCountRef.current &&
      messages.length - prevCountRef.current < 5
    ) {
      setTimeout(
        () => scrollViewRef.current?.scrollToEnd({ animated: true }),
        100,
      );
    }
    prevCountRef.current = messages.length;
  }, [messages.length]);

  useEffect(() => {
    if (connectionState === "connected") {
      markRead();
      // Auto-retry any messages that were marked "failed" while disconnected
      client.resendFailedMessages();
    }
  }, [connectionState, markRead, client]);

  const isSupport = propDisplayName === "TeincFood Support";
  const displayName = propDisplayName;
  const displayPhone = phoneNumber;

  // ---------------------------------------------------------------------------
  // Merge + add date separators
  // ---------------------------------------------------------------------------

  const displayMessages = useMemo(() => {
    const withSeparators: Array<
      { type: "message"; msg: Message } | { type: "separator"; date: string }
    > = [];
    let prevDate: string | undefined;
    for (const msg of messages) {
      if (shouldShowDateSeparator(msg.sent_at, prevDate ?? null)) {
        withSeparators.push({
          type: "separator",
          date: formatDateSeparator(msg.sent_at),
        });
      }
      withSeparators.push({ type: "message", msg });
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
    setMessage("");
    setRetryTargetId(null);
    setRetryClientId(null);
    send(outgoingText);
  };

  // ---------------------------------------------------------------------------
  // Retry failed/queued message
  // ---------------------------------------------------------------------------

  const handleRetryMessage = async (
    localId: string | null,
    clientId?: string | null,
  ) => {
    const msg = clientId
      ? messages.find((m: Message) => (m as any)._clientId === clientId)
      : messages.find((m: Message) => m.id === localId);
    if (!msg) return;
    if (clientId) {
      client.removePendingMessage(clientId);
    } else if (localId) {
      const found = messages.find(
        (m: Message) => m.id === localId && (m as any)._clientId,
      );
      if (found) client.removePendingMessage((found as any)._clientId);
    }
    setRetryTargetId(null);
    setRetryClientId(null);
    send(msg.content);
  };

  const handleCall = async () => {
    const phone = displayPhone?.trim();
    if (!phone) {
      Alert.alert(
        "Call unavailable",
        "No phone number is available for this contact.",
      );
      return;
    }
    const url = `tel:${phone.replace(/\s+/g, "")}`;
    const canOpen = await Linking.canOpenURL(url);
    if (!canOpen) {
      Alert.alert(
        "Call unavailable",
        "This device cannot place calls right now.",
      );
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
      "Contact",
      `${displayName || "User"}\n${displayPhone || "Phone not available"}`,
    );
  };

  const canSend = Boolean(message.trim());
  const isConnected = connectionState === "connected";
  const connFailed = connectionState === "disconnected";

  const handleRetryConnection = () => {
    const tokens = client.getTokens();
    if (tokens) {
      client.start(tokens).catch(() => {});
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
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
            <Avatar circular>
              <Avatar.Image src={displayAvatar ?? undefined} />
              <Avatar.Fallback
                justify="center"
                alignItems="center"
                backgroundColor="$color.gray50"
              >
                <Text color="$color" fontWeight="bold" fontSize="$6">
                  {displayName?.charAt(0) || "?"}
                </Text>
              </Avatar.Fallback>
            </Avatar>
            <YStack>
              <Text
                fontSize="$4"
                fontWeight="700"
                fontFamily="$heading"
                color="$color"
              >
                {displayName}
              </Text>
              {isBusiness && (
                <XStack alignItems="center" gap="$1">
                  <Building2 size={12} color="$primary" />
                  <Text
                    fontSize="$1"
                    fontWeight="600"
                    color="$primary"
                    fontFamily="$body"
                  >
                    Business
                  </Text>
                </XStack>
              )}
              {isSupport && (
                <XStack alignItems="center" gap="$1">
                  <YStack
                    width={8}
                    height={8}
                    borderRadius={4}
                    backgroundColor={isConnected ? "$success" : "$warning"}
                  />
                  <Text
                    fontSize="$2"
                    color="$colorSecondary"
                    fontFamily="$body"
                  >
                    {isConnected ? "Online" : "Connecting..."}
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
        {connectionState === "reconnecting" && (
          <XStack
            backgroundColor="$yellowLight"
            padding="$3"
            alignItems="center"
            justifyContent="center"
          >
            <Text fontSize="$2" color="$yellowDark" fontFamily="$body">
              Connecting...
            </Text>
          </XStack>
        )}

        {connectionState === "disconnected" && (
          <XStack
            backgroundColor="$yellowLight"
            padding="$3"
            alignItems="center"
            justifyContent="center"
          >
            <Text fontSize="$2" color="$yellowDark" fontFamily="$body">
              Connecting...
            </Text>
            <Button
              size="$2"
              backgroundColor="$yellowDark"
              color="$white"
              onPress={handleRetryConnection}
              paddingHorizontal="$3"
              borderRadius="$3"
              marginLeft="$2"
            >
              Retry
            </Button>
          </XStack>
        )}

        {/* Messages */}
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={{
            flexGrow: 1,
            padding: 16,
            paddingBottom: 24,
          }}
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
              <Text
                ta="center"
                fontSize="$3"
                color="$colorSecondary"
                fontFamily="$body"
              >
                {isSupport
                  ? "Hi! How can we help you today?\nSend a message to start chatting with our support team."
                  : "Start a conversation"}
              </Text>
            </YStack>
          )}

          {displayMessages.map((item) => {
            if (item.type === "separator") {
              return (
                <YStack key={item.date} alignItems="center" marginVertical="$3">
                  <YStack
                    backgroundColor="$backgroundSoft"
                    paddingHorizontal="$3"
                    paddingVertical="$1"
                    borderRadius="$4"
                  >
                    <Text
                      fontSize="$2"
                      color="$colorSecondary"
                      fontFamily="$body"
                    >
                      {item.date}
                    </Text>
                  </YStack>
                </YStack>
              );
            }

            const msg = item.msg;
            const isMe = msg.sender_id === currentUserId;
            const isFailed = msg.status === "failed";

            return (
              <TouchableOpacity
                key={msg.id ?? (msg as any)._clientId}
                onPress={() => {
                  if (isFailed) {
                    const cid = (msg as any)._clientId;
                    setRetryTargetId(cid ? null : msg.id);
                    setRetryClientId(cid ?? null);
                  }
                }}
                onLongPress={() => {
                  setStringAsync(msg.content);
                }}
                delayLongPress={400}
                activeOpacity={isFailed ? 0.6 : 1}
              >
                <YStack
                  alignSelf={isMe ? "flex-end" : "flex-start"}
                  maxWidth="82%"
                  marginBottom="$2"
                >
                  <YStack
                    backgroundColor={
                      isMe
                        ? isFailed
                          ? "$gray200"
                          : "$greenLight"
                        : "$gray100"
                    }
                    paddingHorizontal="$3"
                    paddingVertical="$2"
                    borderRadius="$3"
                    borderBottomRightRadius={isMe ? 2 : "$3"}
                    borderBottomLeftRadius={isMe ? "$3" : 2}
                  >
                    {isBusiness && !isMe && msg.sender_name && (
                      <Text
                        fontSize="$2"
                        fontWeight="700"
                        color="$primary"
                        fontFamily="$body"
                        marginBottom="$1"
                      >
                        {msg.sender_name}
                      </Text>
                    )}
                    <Text fontSize="$4" fontFamily="$body" color="$color">
                      {renderMarkdown(parseMarkdown(decodeEntities(msg.content)))}
                    </Text>
                    <XStack
                      gap={3}
                      alignItems="center"
                      justifyContent="flex-end"
                      marginTop={2}
                    >
                      <Text
                        fontSize={10}
                        color="$colorMuted"
                        fontFamily="$body"
                      >
                        {formatTime(msg.sent_at)}
                      </Text>
                      {isMe && <MessageStatusIcon status={msg.status} />}
                      {msg.channel === "whatsapp" && (
                        <Text
                          fontSize={10}
                          color="$colorMuted"
                          fontFamily="$body"
                        >
                          WhatsApp
                        </Text>
                      )}
                    </XStack>
                  </YStack>

                  {isFailed &&
                    (retryTargetId === msg.id ||
                      retryClientId === (msg as any)._clientId) && (
                      <TouchableOpacity
                        onPress={() => {
                          const cid = (msg as any)._clientId;
                          handleRetryMessage(msg.id, cid ?? null);
                        }}
                        style={{ marginTop: 4 }}
                      >
                        <Text
                          fontSize={12}
                          color="$error"
                          fontFamily="$body"
                          textAlign="right"
                        >
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
                  fontFamily: "Sen_400Regular",
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
              backgroundColor={canSend ? "$green" : "$colorDisabled"}
              borderWidth={0}
              pressStyle={{ backgroundColor: "$greenDark" }}
              icon={<Send size={20} color="$white" />}
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
          <Sheet.Frame
            backgroundColor="$background"
            borderTopLeftRadius="$8"
            borderTopRightRadius="$8"
          >
            <Sheet.Handle backgroundColor="$gray200" marginTop="$2" />
            <YStack paddingHorizontal="$5" paddingVertical="$4">
              <Text
                fontSize="$5"
                fontWeight="800"
                fontFamily="$heading"
                color="$color"
              >
                Conversation Actions
              </Text>
            </YStack>
            <YStack paddingHorizontal="$5" paddingBottom="$6">
              <XStack
                paddingVertical="$4"
                alignItems="center"
                justifyContent="space-between"
                onPress={handleCall}
              >
                <Text fontSize="$4" fontFamily="$body" color="$color">
                  Call {displayName || "Contact"}
                </Text>
                <Phone size={18} color="$primary" />
              </XStack>
              <Separator borderColor="$borderColor" />
              <XStack
                paddingVertical="$4"
                alignItems="center"
                justifyContent="space-between"
                onPress={handleViewContact}
              >
                <Text fontSize="$4" fontFamily="$body" color="$color">
                  View contact
                </Text>
              </XStack>
              <Separator borderColor="$borderColor" />
              <XStack
                paddingVertical="$4"
                alignItems="center"
                justifyContent="space-between"
                onPress={handleClearConversation}
              >
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
