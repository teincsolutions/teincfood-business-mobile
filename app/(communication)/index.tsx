// @ts-nocheck
import { useState, useCallback, useEffect } from "react";
import { useRouter } from "expo-router";
import { FlatList, TouchableOpacity, TextInput } from "react-native";
import {
  YStack,
  XStack,
  Text,
  Avatar,
  Separator,
  Card,
  Tabs,
  SizableText,
} from "tamagui";
import { Badge } from "@/components/ui";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Search, MessageSquare, Building2, User } from "@tamagui/lucide-icons";
import { BackButton } from "@/components/ui";
import { useContacts } from "@/hooks/useContacts";
import { useActiveBusiness } from "@/hooks/useActiveBusiness";
import { formatTime } from "@teincfood/chat-client";

type TabKey = "business" | "personal";

export default function InboxScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { activeBusinessId, hasBusiness } = useActiveBusiness();

  const canShowBusinessTab = hasBusiness && activeBusinessId;
  const [tab, setTab] = useState<TabKey>(
    canShowBusinessTab ? "business" : "personal",
  );
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!canShowBusinessTab && tab === "business") {
      setTab("personal");
    }
  }, [canShowBusinessTab, tab]);

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

  const handleContactPress = useCallback(
    (contact: {
      id: string;
      full_name?: string;
      avatar_url?: string;
      contact_type?: string;
    }) => {
      const params: Record<string, string> = {
        userId: contact.id,
        displayName: contact.full_name || "Contact",
        displayAvatar: contact.avatar_url || "",
        contactType: contact.contact_type || "user",
      };
      // Business tab clicks create business-scoped conversations
      if (tab === "business" && activeBusinessId) {
        params.senderBusinessId = activeBusinessId;
      }
      router.push({
        pathname: "/(communication)/chat/direct",
        params,
      });
    },
    [router, tab, activeBusinessId],
  );

  const renderContact = useCallback(
    ({ item: contact }: { item: any }) => (
      <XStack>
        <YStack flex={1}>
          <TouchableOpacity
            onPress={() => handleContactPress(contact)}
            activeOpacity={0.7}
          >
            <XStack p="$4" gap="$3" alignItems="center">
              <YStack position="relative">
                <Avatar circular size={54}>
                  <Avatar.Image src={contact.avatar_url ?? undefined} />
                  <Avatar.Fallback
                    bg="$backgroundStrong"
                    justifyContent="center"
                    alignItems="center"
                  >
                    <Text color="$color" fontWeight="bold" fontSize="$6">
                      {contact.full_name?.charAt(0) || "?"}
                    </Text>
                  </Avatar.Fallback>
                </Avatar>
                {tab === "business" && (
                  <YStack
                    position="absolute"
                    bottom={-2}
                    right={-2}
                    backgroundColor="$primary"
                    borderRadius="$12"
                    width={18}
                    height={18}
                    alignItems="center"
                    justifyContent="center"
                  >
                    <Building2 size={10} color="$white" />
                  </YStack>
                )}
              </YStack>

              <YStack flex={1} gap="$1">
                <XStack justifyContent="space-between" alignItems="center">
                  <Text
                    fontSize="$4"
                    fontWeight="700"
                    fontFamily="$heading"
                    color="$color"
                    flex={1}
                    numberOfLines={1}
                  >
                    {contact.full_name}
                    {contact.is_self ? " (Me)" : ""}
                  </Text>
                  <XStack gap="$1.5" alignItems="center">
                    {tab === "business" && (
                      <>
                        <Building2 size={12} color="$primary" />
                        <Text
                          fontSize="$1"
                          color="$primary"
                          fontFamily="$body"
                          fontWeight="600"
                        >
                          Business
                        </Text>
                      </>
                    )}
                    <Text
                      fontSize="$2"
                      color="$colorSecondary"
                      fontFamily="$body"
                    >
                      {contact.last_message?.sent_at
                        ? formatTime(contact.last_message.sent_at)
                        : ""}
                    </Text>
                  </XStack>
                </XStack>
                <XStack justifyContent="space-between" alignItems="center">
                  <Text
                    fontSize="$3"
                    color={
                      contact.unread_count > 0 ? "$color" : "$colorSecondary"
                    }
                    fontWeight={contact.unread_count > 0 ? "700" : "400"}
                    fontFamily="$body"
                    numberOfLines={1}
                    flex={1}
                  >
                    {contact.last_message?.text
                      ? contact.last_message.text.slice(0, 80) + "..."
                      : "Tap to start chatting"}
                  </Text>
                  {contact.unread_count > 0 && (
                    <Badge size="$2" backgroundColor="$primary">
                      <Text color="$white" fontSize="$1" fontWeight="700">
                        {contact.unread_count > 99
                          ? "99+"
                          : contact.unread_count}
                      </Text>
                    </Badge>
                  )}
                </XStack>
              </YStack>
            </XStack>
          </TouchableOpacity>
          <Separator borderColor="$borderColor" />
        </YStack>
      </XStack>
    ),
    [handleContactPress, tab],
  );

  const renderEmpty = () => (
    <YStack justify="center" items="center" py="$8" gap="$2">
      <MessageSquare size={56} color="$colorMuted" />
      <Text
        fontSize="$5"
        fontWeight="700"
        fontFamily="$heading"
        color="$color"
        mt="$2"
      >
        {tab === "business" ? "No business contacts" : "No contacts yet"}
      </Text>
      <Text
        fontSize="$3"
        color="$colorSecondary"
        fontFamily="$body"
        textAlign="center"
        px="$4"
      >
        {tab === "business"
          ? "People who message this business will appear here."
          : "People you interact with will appear here."}
      </Text>
    </YStack>
  );

  const renderFooter = () => (
    <Card
      bg="$primaryMuted"
      p="$4"
      br="$5"
      mx="$5"
      mb={Math.max(insets.bottom + 16, 24)}
      mt="$2"
      borderWidth={1}
      borderColor="$primary"
      pressStyle={{ opacity: 0.8 }}
      onPress={() => router.push("/(communication)/chat/support")}
    >
      <XStack gap="$3" ai="center">
        <YStack bg="$white" p="$2" br="$3">
          <MessageSquare size={20} color="$primary" />
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
          <Text fontSize="$2" color="$colorSecondary" fontFamily="$body">
            Need help? Talk to our team.
          </Text>
        </YStack>
        <Text
          fontSize="$3"
          fontWeight="600"
          color="$primary"
          fontFamily="$body"
        >
          Chat
        </Text>
      </XStack>
    </Card>
  );

  return (
    <YStack flex={1} bg="$background" pt={Math.max(insets.top, 50)}>
      {/* Header */}
      <XStack ai="center" px="$5" pb="$3" gap="$3">
        <BackButton />
        <Text
          fontSize="$6"
          fontWeight="800"
          fontFamily="$heading"
          color="$color"
          flex={1}
        >
          Messages
        </Text>
      </XStack>

      {/* Tabs — Tamagui component */}
      <XStack px="$5" pb="$3">
        <Tabs
          value={tab}
          onValueChange={(v) => setTab(v as TabKey)}
          orientation="horizontal"
          flexDirection="column"
          width="100%"
          br="$4"
        >
          <Tabs.List aria-label="Message tabs" gap="$2">
            {canShowBusinessTab && (
              <Tabs.Tab
                flex={1}
                value="business"
                activeStyle={{ bg: "$primary" }}
              >
                <XStack ai="center" jc="center" gap="$2">
                  <Building2
                    size={16}
                    color={tab === "business" ? "$color" : "$colorSecondary"}
                  />
                  <SizableText
                    fontFamily="$body"
                    textAlign="center"
                    color={tab === "business" ? "$color" : "$colorSecondary"}
                    size="$3"
                  >
                    Business
                  </SizableText>
                </XStack>
              </Tabs.Tab>
            )}
            <Tabs.Tab
              flex={1}
              value="personal"
              activeStyle={{ bg: "$primary" }}
            >
              <XStack ai="center" jc="center" gap="$2">
                <User
                  size={16}
                  color={tab === "personal" ? "$color" : "$colorSecondary"}
                />
                <SizableText
                  fontFamily="$body"
                  textAlign="center"
                  color={tab === "personal" ? "$color" : "$colorSecondary"}
                  size="$3"
                >
                  Personal
                </SizableText>
              </XStack>
            </Tabs.Tab>
          </Tabs.List>
        </Tabs>
      </XStack>

      {/* Search */}
      <XStack gap="$2" px="$5" alignItems="center">
        <XStack
          flex={1}
          alignItems="center"
          backgroundColor="$backgroundSoft"
          borderRadius="$3"
          paddingHorizontal="$3"
          borderWidth={1}
          borderColor="$borderColor"
          height={40}
        >
          <Search size={16} color="$colorMuted" />
          <TextInput
            style={{ flex: 1, paddingLeft: 8, fontSize: 14, color: "#000" }}
            onChangeText={setSearch}
            value={search}
            placeholder="Search contacts..."
            placeholderTextColor="#999"
          />
        </XStack>
      </XStack>

      {/* Contact List */}
      <FlatList
        data={contacts}
        keyExtractor={(item: any) => item.id}
        renderItem={renderContact}
        contentContainerStyle={{ paddingHorizontal: 20 }}
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={renderFooter}
        initialNumToRender={10}
        windowSize={5}
        maxToRenderPerBatch={10}
        removeClippedSubviews
      />
    </YStack>
  );
}
