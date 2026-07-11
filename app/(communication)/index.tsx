// @ts-nocheck
import { useRouter } from "expo-router";
import { ScrollView, TouchableOpacity } from "react-native";
import { YStack, XStack, Text, Image, Separator } from "tamagui";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Search, MessageSquare } from "@tamagui/lucide-icons";
import { BackButton, Button, Input } from "@/components/ui";
import { useContacts } from "@/hooks/useContacts";
import { formatTime } from "@teincfood/chat-client";

export default function InboxScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { contacts: contactsData } = useContacts();
  const contacts = contactsData || [];

  const handleSupportChat = () => {
    router.push(`/(communication)/chat/support`);
  };

  const handleContactPress = (contact: { id: string; full_name?: string; avatar_url?: string; contact_type?: string }) => {
    router.push({
      pathname: '/(communication)/chat/direct',
      params: { userId: contact.id, displayName: contact.full_name || 'Contact', displayAvatar: contact.avatar_url, contactType: contact.contact_type || 'user' },
    });
  };

  return (
    <YStack
      flex={1}
      backgroundColor="$background"
      paddingTop={Math.max(insets.top, 50)}
    >
      {/* Header */}
      <XStack
        alignItems="center"
        paddingHorizontal="$5"
        paddingBottom="$4"
        gap="$3"
      >
        <BackButton />
        <Text
          fontSize="$6"
          fontWeight="800"
          fontFamily="$heading"
          color="$color"
        >
          Messages
        </Text>
      </XStack>

      <ScrollView bounces showsVerticalScrollIndicator={false}>
        <YStack padding="$5" gap="$5">
          {/* Search Bar */}
          <XStack
            alignItems="center"
            backgroundColor="$backgroundSoft"
            borderRadius="$4"
            paddingHorizontal="$4"
            height={50}
          >
            <Search size={20} color="$colorSecondary" />
            <Input
              flex={1}
              placeholder="Search messages..."
              backgroundColor="transparent"
              borderWidth={0}
              height={50}
              paddingHorizontal="$2"
            />
          </XStack>

          {/* Contact List — WhatsApp-style */}
          {contacts.length > 0 ? (
            <YStack
              backgroundColor="$white"
              borderRadius="$5"
              overflow="hidden"
            >
              {contacts.map((contact, idx) => (
                <YStack key={contact.id}>
                  <TouchableOpacity
                    onPress={() => handleContactPress(contact)}
                    activeOpacity={0.7}
                  >
                    <XStack padding="$4" gap="$3" alignItems="center">
                      <YStack position="relative">
                        <Image
                          source={{ uri: contact.avatar_url }}
                          width={54}
                          height={54}
                          borderRadius="$full"
                        />
                        {contact.unread_count > 0 && (
                          <YStack
                            position="absolute"
                            top={0}
                            right={0}
                            width={14}
                            height={14}
                            borderRadius="$full"
                            backgroundColor="$primary"
                            borderWidth={2}
                            borderColor="white"
                          />
                        )}
                      </YStack>

                      <YStack flex={1} gap="$1">
                        <XStack
                          justifyContent="space-between"
                          alignItems="center"
                        >
                          <Text
                            fontSize="$4"
                            fontWeight="700"
                            fontFamily="$heading"
                            color="$color"
                          >
                            {contact.full_name}
                          </Text>
                          <Text
                            fontSize="$2"
                            color="$colorSecondary"
                            fontFamily="$body"
                          >
                            {contact.last_message?.sent_at ? formatTime(contact.last_message.sent_at) : ''}
                          </Text>
                        </XStack>
                        <XStack
                          justifyContent="space-between"
                          alignItems="center"
                        >
                          <Text
                            fontSize="$3"
                            color={
                              contact.unread_count > 0
                                ? "$color"
                                : "$colorSecondary"
                            }
                            fontWeight={contact.unread_count > 0 ? "700" : "400"}
                            fontFamily="$body"
                            numberOfLines={1}
                            flex={1}
                          >
                            {contact.last_message?.text
                              ? (contact.last_message.text.length > 80
                                  ? contact.last_message.text.slice(0, 80) + '...'
                                  : contact.last_message.text)
                              : 'Tap to start chatting'}
                          </Text>
                          {contact.unread_count > 0 && (
                            <YStack
                              backgroundColor="$primary"
                              minWidth={20}
                              height={20}
                              borderRadius="$full"
                              justifyContent="center"
                              alignItems="center"
                              paddingHorizontal="$1"
                              marginLeft="$2"
                            >
                              <Text
                                fontSize={10}
                                fontWeight="800"
                                color="white"
                              >
                                {contact.unread_count}
                              </Text>
                            </YStack>
                          )}
                        </XStack>
                      </YStack>
                    </XStack>
                  </TouchableOpacity>
                  {idx < contacts.length - 1 && (
                    <Separator borderColor="$gray100" />
                  )}
                </YStack>
              ))}
            </YStack>
          ) : (
            <YStack
              justifyContent="center"
              alignItems="center"
              paddingVertical="$8"
              gap="$2"
            >
              <MessageSquare size={56} color="$gray200" />
              <Text
                fontSize="$5"
                fontWeight="700"
                fontFamily="$heading"
                color="$color"
                marginTop="$2"
              >
                No contacts yet
              </Text>
              <Text
                fontSize="$3"
                color="$colorSecondary"
                fontFamily="$body"
                textAlign="center"
              >
                People you interact with will appear here.
              </Text>
            </YStack>
          )}

          {/* Support Section — always visible */}
          <YStack
            backgroundColor="$orangeMuted"
            padding="$5"
            borderRadius="$5"
            gap="$3"
            borderWidth={1}
            borderColor="$orange"
            marginTop="$2"
          >
            <XStack gap="$3" alignItems="center">
              <YStack backgroundColor="$white" padding="$2" borderRadius="$3">
                <MessageSquare size={24} color="$primary" />
              </YStack>
              <YStack flex={1}>
                <Text
                  fontSize="$4"
                  fontWeight="700"
                  fontFamily="$heading"
                  color="$color"
                >
                  24/7 Support
                </Text>
                <Text fontSize="$3" color="$colorSecondary" fontFamily="$body">
                  Need help? Talk to our team.
                </Text>
              </YStack>
              <Button
                variant="primary"
                size="$3"
                paddingHorizontal="$4"
                onPress={handleSupportChat}
              >
                Chat
              </Button>
            </XStack>
          </YStack>
        </YStack>
      </ScrollView>
    </YStack>
  );
}
