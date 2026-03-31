// @ts-nocheck
import { Stack } from 'expo-router';

/**
 * Shared Screens Layout
 * Contains notifications, chat, and call screens accessible by both sellers and riders
 */
export default function SharedLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="notifications/index" />
      <Stack.Screen name="chat/index" />
      <Stack.Screen name="chat/[id]" />
      <Stack.Screen name="call/[id]" />
    </Stack>
  );
}