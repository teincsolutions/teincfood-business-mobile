// @ts-nocheck

import { ScrollView, ActivityIndicator } from "react-native";
import { YStack, XStack, Text, Card, Separator } from "tamagui";
import { Info } from "@tamagui/lucide-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BackButton } from "@/components/ui";
import { useContent } from "@/hooks/useContent";

export default function AboutScreen() {
  const insets = useSafeAreaInsets();
  const { data: page, isLoading } = useContent("about", "en");

  return (
    <YStack flex={1} backgroundColor="$background">
      <XStack
        paddingHorizontal="$4"
        paddingTop={insets.top + 12}
        paddingBottom="$3"
        justifyContent="space-between"
        alignItems="center"
        backgroundColor="$background"
      >
        <BackButton />
        <Text fontSize="$6" fontWeight="800" fontFamily="$heading">
          {page?.title ?? "About"}
        </Text>
        <YStack width={50} />
      </XStack>

      <ScrollView showsVerticalScrollIndicator={false}>
        <YStack padding="$4" gap="$4" paddingBottom={insets.bottom + 20}>
          {isLoading ? (
            <YStack flex={1} alignItems="center" justifyContent="center" padding="$10">
              <ActivityIndicator size="large" />
            </YStack>
          ) : (
            <>
              <Card padding="$4" bordered backgroundColor="$blue2">
                <XStack gap="$3" alignItems="center">
                  <Info size={24} color="$primary" />
                  <YStack flex={1}>
                    <Text fontSize="$5" fontWeight="bold">
                      {page?.title ?? "About"}
                    </Text>
                    <Text fontSize="$3" color="$colorMuted">
                      Teinc Food Business
                    </Text>
                  </YStack>
                </XStack>
              </Card>
              {page?.sections.map((section, i) => (
                <Card key={i} padding="$4" bordered>
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
              {!page && (
                <Text color="$colorMuted" padding="$4">
                  About content is not available. Please check your connection.
                </Text>
              )}
            </>
          )}
        </YStack>
      </ScrollView>
    </YStack>
  );
}
