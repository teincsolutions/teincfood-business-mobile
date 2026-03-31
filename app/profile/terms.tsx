// @ts-nocheck
import { ScrollView } from 'react-native';
import { YStack, XStack, Text } from 'tamagui';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BackButton } from '@/components/ui';

export default function TermsScreen() {
  const insets = useSafeAreaInsets();

  return (
    <YStack flex={1} backgroundColor="$background" paddingTop={Math.max(insets.top, 50)}>
      <XStack alignItems="center" paddingHorizontal="$5" paddingBottom="$4" gap="$3">
        <BackButton />
        <Text fontSize="$6" fontWeight="800" fontFamily="$heading" color="$color">
          Terms of Service
        </Text>
      </XStack>

      <ScrollView bounces showsVerticalScrollIndicator={false}>
        <YStack padding="$5" gap="$4" paddingBottom="$10">
          <Text fontSize="$4" color="$colorSecondary" fontFamily="$body" lineHeight={24}>
            This is a legal placeholder for TeincFoods Terms of Service. The final version should cover
            account responsibilities, ordering and payment rules, delivery limitations, dispute handling,
            and platform acceptable use.
          </Text>

          <Text fontSize="$4" color="$colorSecondary" fontFamily="$body" lineHeight={24}>
            For marketplace operations, final terms should define seller/buyer obligations, cancellation
            policies, refunds, and regional compliance requirements.
          </Text>

          <Text fontSize="$4" color="$colorSecondary" fontFamily="$body" lineHeight={24}>
            Replace this text with approved legal content before production release.
          </Text>
        </YStack>
      </ScrollView>
    </YStack>
  );
}
