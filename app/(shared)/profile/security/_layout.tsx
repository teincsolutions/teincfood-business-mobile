import { Stack } from 'expo-router';

export default function SecurityLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="change-email" />
      <Stack.Screen name="change-phone" />
      <Stack.Screen name="change-password" />
    </Stack>
  );
}
