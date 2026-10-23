// @ts-nocheck

import { ScrollView, ActivityIndicator, Linking } from "react-native";
import { YStack, XStack, Text, Card, Separator } from "tamagui";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BackButton } from "@/components/ui";
import { useContent } from "@/hooks/useContent";
import type { PageSection } from "@/types/content.types";

/**
 * Renders a legal page (terms, privacy) straight from the CMS copy the
 * backend publishes for the app's audience.
 */
export default function LegalPageScreen({
  slug,
  fallbackTitle,
}: {
  slug: string;
  fallbackTitle: string;
}) {
  const insets = useSafeAreaInsets();
  const { data: page, isLoading } = useContent(slug, "en");

  const sections: PageSection[] = page?.sections ?? [];

  return (
    <YStack flex={1} backgroundColor="$background">
      <XStack
        paddingHorizontal="$4"
        paddingTop={Math.max(insets.top + 12, 24)}
        paddingBottom="$3"
        justifyContent="space-between"
        alignItems="center"
        backgroundColor="$background"
      >
        <BackButton />
        <Text fontSize="$6" fontWeight="800" fontFamily="$heading">
          {page?.title ?? fallbackTitle}
        </Text>
        <YStack width={50} />
      </XStack>

      <ScrollView showsVerticalScrollIndicator={false}>
        <YStack padding="$4" gap="$4" paddingBottom={insets.bottom + 20}>
          {isLoading ? (
            <YStack flex={1} alignItems="center" justifyContent="center" padding="$10">
              <ActivityIndicator size="large" />
            </YStack>
          ) : null}

          {!isLoading && sections.length === 0 ? (
            <Card padding="$4" bordered backgroundColor="$blue2">
              <Text color="$colorMuted">
                This page is not available right now. Please check your connection
                or try again later.
              </Text>
            </Card>
          ) : null}

          {sections.map((section, index) => (
            <Card key={index} padding="$4" bordered>
              <YStack gap="$3">
                <Text fontSize="$5" fontWeight="bold">
                  {section.heading}
                </Text>
                <Separator />
                <Text color="$colorMuted" lineHeight="$1">
                  {section.body}
                </Text>
              </YStack>
            </Card>
          ))}
        </YStack>
      </ScrollView>
    </YStack>
  );
}

/**
 * The support contact block, published through the CMS so admins can change
 * the details without shipping an app build.
 */
export function SupportContacts({
  support,
  onChat,
}: {
  support: {
    heading?: string;
    email?: string;
    phone?: string;
    hours?: string;
    chat?: boolean;
  } | null;
  onChat?: () => void;
}) {
  if (!support) return null;

  const phone = support.phone?.trim();
  const email = support.email?.trim();

  return (
    <Card padding="$4" bordered backgroundColor="$blue2">
      <YStack gap="$3">
        <Text fontSize="$5" fontWeight="bold">
          {support.heading ?? "Contact Support"}
        </Text>
        <Separator />
        {support.hours ? (
          <Text color="$colorMuted" fontSize="$3">
            {support.hours}
          </Text>
        ) : null}
        {email ? (
          <Text
            color="$primary"
            fontWeight="bold"
            fontSize="$3"
            onPress={() => Linking.openURL(`mailto:${email}`)}
          >
            {email}
          </Text>
        ) : null}
        {phone ? (
          <Text
            color="$primary"
            fontWeight="bold"
            fontSize="$3"
            onPress={() =>
              Linking.openURL(`tel:${phone.replace(/[^+\d]/g, "")}`)
            }
          >
            {phone}
          </Text>
        ) : null}
        {support.chat !== false && onChat ? (
          <Text
            color="$primary"
            fontWeight="bold"
            fontSize="$3"
            onPress={onChat}
          >
            Start a live chat
          </Text>
        ) : null}
      </YStack>
    </Card>
  );
}
