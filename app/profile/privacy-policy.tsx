// @ts-nocheck
import { ScrollView } from 'react-native';
import { YStack, XStack, Text } from 'tamagui';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BackButton } from '@/components/ui';

export default function PrivacyPolicyScreen() {
  const insets = useSafeAreaInsets();

  return (
    <YStack flex={1} backgroundColor="$background" paddingTop={Math.max(insets.top, 50)}>
      <XStack alignItems="center" paddingHorizontal="$5" paddingBottom="$4" gap="$3">
        <BackButton />
        <Text fontSize="$6" fontWeight="800" fontFamily="$heading" color="$color">
          Privacy Policy
        </Text>
      </XStack>

      <ScrollView bounces showsVerticalScrollIndicator={false}>
        <YStack padding="$5" gap="$4" paddingBottom="$10">
          <Text fontSize="$4" color="$colorSecondary" fontFamily="$body" lineHeight={24}>
            This is a legal placeholder for TeincFoods Privacy Policy. The final backend-integrated version
            should define exactly what personal data we collect, why we process it, retention timelines,
            and user controls for data export and deletion.
          </Text>

          <Text fontSize="$4" color="$colorSecondary" fontFamily="$body" lineHeight={24}>
            Current app behavior includes account identity fields, location context for region-aware catalog
            and pricing, order activity events, and device tokens for notification delivery.
          </Text>

          <Text fontSize="$4" color="$colorSecondary" fontFamily="$body" lineHeight={24}>
            Before production launch, replace this content with approved legal copy and version metadata.
          </Text>
        </YStack>
      </ScrollView>
    </YStack>
  );
}
