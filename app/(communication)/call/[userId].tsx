// @ts-nocheck
import { useLocalSearchParams } from 'expo-router';
import { YStack, Text } from 'tamagui';

export default function CallScreen() {
  const { userId } = useLocalSearchParams();

  return (
    <YStack flex={1} backgroundColor="$background" padding="$5" justifyContent="center" alignItems="center">
      <Text fontSize="$8" fontWeight="bold" fontFamily="$heading" color="$color">
        Call Focus
      </Text>
      <Text color="$colorSecondary" fontFamily="$body" marginTop="$2">
        Calling User: {userId}
      </Text>
    </YStack>
  );
}
