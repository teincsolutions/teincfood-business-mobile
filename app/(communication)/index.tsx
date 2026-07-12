// @ts-nocheck
import { useState, useCallback, useRef } from "react";
import { useRouter } from "expo-router";
import { FlatList, TouchableOpacity } from "react-native";
import { YStack, XStack, Text, Avatar, Separator, Card } from "tamagui";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Search, MessageSquare, Building2, User, Ban, Trash2 } from "@tamagui/lucide-icons";
import { BackButton, Button, Input } from "@/components/ui";
import { useContacts } from "@/hooks/useContacts";
import { useActiveBusiness } from "@/hooks/useActiveBusiness";
import { formatTime } from "@teincfood/chat-client";
import { getChatClient } from "@/utils/chat-service";

type TabKey = "business" | "personal";

export default function InboxScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<TabKey>("business");
  const [search, setSearch] = useState("");
  const { activeBusinessId, activeBusiness, hasBusiness } = useActiveBusiness();

  const { contacts: bizContactsData } = useContacts(
    "business",
    activeBusinessId ?? undefined,
    search || undefined,
  );
  const { contacts: personalContactsData } = useContacts(
    "buyer",
    undefined,
    search || undefined,
  );

  const bizContacts = bizContactsData || [];
  const personalContacts = personalContactsData || [];

  const contacts = tab === "business" ? bizContacts : personalContacts;

  const handleSupportChat = () => {
    router.push("/(communication)/chat/support");
  };

  const handleContactPress = useCallback(
    (contact: {
      id: string;
      full_name?: string;
      avatar_url?: string;
      contact_type?: string;
    }) => {
      router.push({
        pathname: "/(communication)/chat/direct",
        params: {
          userId: contact.id,
          displayName: contact.full_name || "Contact",
          displayAvatar: contact.avatar_url || "",
          contactType: contact.contact_type || "user",
        },
      });
    },
    [router],
  );

  const handleBlockContact = useCallback(async (contactId: string) => {
    try {
      const client = getChatClient();
      await client.contacts.blockContact(contactId);
    } catch (e) {
      console.debug("[Inbox] Block failed:", e);
    }
  }, []);

  const handleDeleteContact = useCallback(async (contactId: string) => {
    try {
      const client = getChatClient();
      await client.contacts.deleteContact(contactId);
    } catch (e) {
      console.debug("[Inbox] Delete failed:", e);
    }
  }, []);

  const renderContact = useCallback(
    ({ item: contact, index }: { item: any; index: number }) => (
      <YStack key={contact.id}>
        <TouchableOpacity
          onPress={() => handleContactPress(contact)}
          onLongPress={() => {
            // TODO: Show bottom sheet with block/delete options
          }}
          activeOpacity={0.7}
        >
          <XStack padding="$4" gap="$3" alignItems="center">
            <YStack position="relative">
              <Avatar circular size={54}>
                <Avatar.Image src={contact.avatar_url ?? undefined} />
                <Avatar.Fallback
                  backgroundColor="$color.gray50"
                  justifyContent="center"
                  alignItems="center"
                >
                  <Text color="$color" fontWeight="bold" fontSize="$6">
                    {contact.full_name?.charAt(0) || "?"}
                  </Text>
                </Avatar.Fallback>
              </Avatar>
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
                  borderColor="$background"
                />
              )}
            </YStack>

            <YStack flex={1} gap="$1">
              <XStack justifyContent="space-between" alignItems="center">
                <Text fontSize="$4" fontWeight="700" fontFamily="$heading" color="$color" flex={1} numberOfLines={1}>
                  {contact.full_name}{contact.is_self ? " (Me)" : ""}
                </Text>
                <Text fontSize="$2" color="$colorSecondary" fontFamily="$body">
                  {contact.last_message?.sent_at
                    ? formatTime(contact.last_message.sent_at)
                    : ""}
                </Text>
              </XStack>
              <XStack justifyContent="space-between" alignItems="center">
                <Text
                  fontSize="$3"
                  color={contact.unread_count > 0 ? "$color" : "$colorSecondary"}
                  fontWeight={contact.unread_count > 0 ? "700" : "400"}
                  fontFamily="$body"
                  numberOfLines={1}
                  flex={1}
                >
                  {contact.last_message?.text
                    ? contact.last_message.text.length > 80
                      ? contact.last_message.text.slice(0, 80) + "..."
                      : contact.last_message.text
                    : "Tap to start chatting"}
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
                    <Text fontSize={10} fontWeight="800" color="white">
                      {contact.unread_count > 99 ? "99+" : contact.unread_count}
                    </Text>
                  </YStack>
                )}
              </XStack>
            </YStack>
          </XStack>
        </TouchableOpacity>
        <Separator borderColor="$gray100" />
      </YStack>
    ),
    [handleContactPress],
  );

  const renderEmpty = () => (
    <YStack justifyContent="center" alignItems="center" paddingVertical="$8" gap="$2">
      <MessageSquare size={56} color="$gray200" />
      <Text fontSize="$5" fontWeight="700" fontFamily="$heading" color="$color" marginTop="$2">
        {tab === "business" ? "No business contacts" : "No contacts yet"}
      </Text>
      <Text fontSize="$3" color="$colorSecondary" fontFamily="$body" textAlign="center" paddingHorizontal="$4">
        {tab === "business"
          ? "People who message this business will appear here."
          : "People you interact with will appear here."}
      </Text>
    </YStack>
  );

  const canShowBusinessTab = hasBusiness && activeBusinessId;

  return (
    <YStack flex={1} backgroundColor="$background" paddingTop={Math.max(insets.top, 50)}>
      {/* Header */}
      <XStack alignItems="center" paddingHorizontal="$5" paddingBottom="$3" gap="$3">
        <BackButton />
        <Text fontSize="$6" fontWeight="800" fontFamily="$heading" color="$color" flex={1}>
          Messages
        </Text>
      </XStack>

      {/* Tabs */}
      <XStack paddingHorizontal="$5" paddingBottom="$3" gap="$3">
        <TouchableOpacity
          onPress={() => setTab("business")}
          style={{ flex: canShowBusinessTab ? 1 : 0 }}
          disabled={!canShowBusinessTab}
        >
          <XStack
            alignItems="center"
            justifyContent="center"
            gap="$2"
            paddingVertical="$2"
            paddingHorizontal={canShowBusinessTab ? "$4" : "0"}
            borderRadius="$3"
            backgroundColor={tab === "business" ? "$primary" : "transparent"}
            opacity={canShowBusinessTab ? 1 : 0.4}
          >
            <Building2 size={18} color={tab === "business" ? "white" : "$colorSecondary"} />
            <Text
              fontSize="$3"
              fontWeight="600"
              color={tab === "business" ? "white" : "$colorSecondary"}
            >
              Business
            </Text>
          </XStack>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setTab("personal")}
          style={{ flex: 1 }}
        >
          <XStack
            alignItems="center"
            justifyContent="center"
            gap="$2"
            paddingVertical="$2"
            paddingHorizontal="$4"
            borderRadius="$3"
            backgroundColor={tab === "personal" ? "$primary" : "transparent"}
          >
            <User size={18} color={tab === "personal" ? "white" : "$colorSecondary"} />
            <Text
              fontSize="$3"
              fontWeight="600"
              color={tab === "personal" ? "white" : "$colorSecondary"}
            >
              Personal
            </Text>
          </XStack>
        </TouchableOpacity>
      </XStack>

      {/* Search */}
      <XStack
        alignItems="center"
        backgroundColor="$backgroundSoft"
        borderRadius="$4"
        paddingHorizontal="$4"
        height={44}
        marginHorizontal="$5"
        marginBottom="$3"
      >
        <Search size={18} color="$colorSecondary" />
        <Input
          flex={1}
          placeholder="Search contacts..."
          backgroundColor="transparent"
          borderWidth={0}
          height={44}
          paddingHorizontal="$2"
          fontSize="$3"
          value={search}
          onChangeText={setSearch}
        />
      </XStack>

      {/* Contact List */}
      <FlatList
        data={contacts}
        keyExtractor={(item: any) => item.id}
        renderItem={renderContact}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={{ paddingHorizontal: 0 }}
        initialNumToRender={10}
        windowSize={5}
        maxToRenderPerBatch={10}
        removeClippedSubviews
      />

      {/* Support Section */}
      <Card
        backgroundColor="$orangeMuted"
        padding="$4"
        borderRadius="$5"
        margin="$5"
        marginBottom={Math.max(insets.bottom + 16, 24)}
        borderWidth={1}
        borderColor="$orange"
        pressStyle={{ opacity: 0.8 }}
        onPress={handleSupportChat}
      >
        <XStack gap="$3" alignItems="center">
          <YStack backgroundColor="$white" padding="$2" borderRadius="$3">
            <MessageSquare size={20} color="$primary" />
          </YStack>
          <YStack flex={1}>
            <Text fontSize="$4" fontWeight="700" fontFamily="$heading" color="$color">
              24/7 Support
            </Text>
            <Text fontSize="$2" color="$colorSecondary" fontFamily="$body">
              Need help? Talk to our team.
            </Text>
          </YStack>
          <Text fontSize="$3" fontWeight="600" color="$primary" fontFamily="$body">
            Chat
          </Text>
        </XStack>
      </Card>
    </YStack>
  );
}
