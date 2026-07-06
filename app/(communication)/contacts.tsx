// @ts-nocheck
import { useRouter } from "expo-router";
import { ScrollView, TouchableOpacity, RefreshControl } from "react-native";
import { YStack, XStack, Text, Image, Separator } from "tamagui";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Users, ChevronRight } from "@tamagui/lucide-icons";
import { BackButton } from "@/components/ui";
import { useContacts } from "@/hooks/useContacts";

export default function ContactsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data: contacts, isLoading, refetch } = useContacts();

  const handleContactPress = (contactId: string, fullName: string) => {
    router.push({
      pathname: '/(communication)/chat/direct',
      params: { userId: contactId, displayName: fullName },
    });
  };

  return (
    <YStack
      flex={1}
      backgroundColor="$background"
      paddingTop={Math.max(insets.top, 50)}
    >
      <XStack
        alignItems="center"
        paddingHorizontal="$5"
        paddingBottom="$4"
        gap="$3"
      >
        <BackButton />
        <Text fontSize="$6" fontWeight="800" fontFamily="$heading" color="$color">
          Contacts
        </Text>
      </XStack>

      <ScrollView
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refetch} />
        }
        bounces
        showsVerticalScrollIndicator={false}
      >
        <YStack padding="$5" gap="$4">
          {(!contacts || contacts.length === 0) ? (
            <YStack justifyContent="center" alignItems="center" paddingVertical="$8" gap="$2">
              <Users size={56} color="$gray200" />
              <Text fontSize="$5" fontWeight="700" fontFamily="$heading" color="$color" marginTop="$2">
                No contacts yet
              </Text>
              <Text fontSize="$3" color="$colorSecondary" fontFamily="$body" textAlign="center">
                Contacts from your orders and conversations will appear here.
              </Text>
            </YStack>
          ) : (
            <YStack backgroundColor="$white" borderRadius="$5" overflow="hidden">
              {contacts.map((contact, idx) => (
                <YStack key={contact.id}>
                  <TouchableOpacity
                    onPress={() => handleContactPress(contact.id, contact.fullName)}
                    activeOpacity={0.7}
                  >
                    <XStack padding="$4" gap="$3" alignItems="center">
                      <Image
                        source={{ uri: contact.avatarUrl }}
                        width={54}
                        height={54}
                        borderRadius="$full"
                      />
                      <YStack flex={1} gap="$1">
                        <Text fontSize="$4" fontWeight="700" fontFamily="$heading" color="$color">
                          {contact.fullName}
                        </Text>
                        {contact.phone && (
                          <Text fontSize="$3" color="$colorSecondary" fontFamily="$body">
                            {contact.phone}
                          </Text>
                        )}
                      </YStack>
                      <ChevronRight size={20} color="$gray200" />
                    </XStack>
                  </TouchableOpacity>
                  {idx < contacts.length - 1 && (
                    <Separator borderColor="$gray100" />
                  )}
                </YStack>
              ))}
            </YStack>
          )}
        </YStack>
      </ScrollView>
    </YStack>
  );
}
