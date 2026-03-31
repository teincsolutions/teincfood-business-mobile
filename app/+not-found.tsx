// @ts-nocheck
import { Stack } from 'expo-router';
import { YStack, Text } from 'tamagui';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Not Found' }} />
      <YStack flex={1} alignItems="center" justifyContent="center" backgroundColor="$background">
        <Text fontSize="$8" fontWeight="bold" color="$color">
          404
        </Text>
        <Text fontSize="$5" color="$colorSecondary" marginTop="$3">
          This screen doesn't exist.
        </Text>
      </YStack>
    </>
  );
}
