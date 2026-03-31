// @ts-nocheck
import { Stack } from 'expo-router';

export default function CommunicationLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="chat/[userId]" />
      <Stack.Screen name="call/[userId]" />
    </Stack>
  );
}
