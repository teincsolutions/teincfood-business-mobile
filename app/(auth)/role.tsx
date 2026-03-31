// @ts-nocheck
import { useState } from "react";
import { useRouter, useLocalSearchParams } from "expo-router";
import { YStack, XStack, Text, Card } from "tamagui";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button, BackButton } from "@/components/ui";
import { Store, Truck, ChevronRight } from "@tamagui/lucide-icons";

export default function RoleScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { from } = useLocalSearchParams<{ from?: string }>();
  const [selectedRole, setSelectedRole] = useState<"seller" | "rider" | null>(null);

  const handleLogin = () => {
    if (!selectedRole) return;
    router.push({ pathname: "/(auth)/login", params: { role: selectedRole } });
  };

  const handleSignup = () => {
    if (!selectedRole) return;
    router.push({ pathname: "/(auth)/signup", params: { role: selectedRole } });
  };

  return (
    <YStack
      flex={1}
      bg="$background"
      px="$5"
      paddingTop={Math.max(insets.top + 12, 28)}
      paddingBottom={Math.max(insets.bottom + 20, 28)}
      gap="$6"
    >
      {/* Back button — only shown when navigated from login/signup */}
      {from && (
        <YStack>
          <BackButton />
        </YStack>
      )}

      <YStack gap="$2">
        <Text
          fontSize="$9"
          fontWeight="800"
          fontFamily="$heading"
          color="$color"
        >
          Choose Your Role
        </Text>
        <Text fontSize="$4" color="$colorSecondary" fontFamily="$body">
          Select how you want to use TeincFoodBusiness
        </Text>
      </YStack>

      <YStack gap="$4">
        {/* Seller Card */}
        <Card
          bordered
          padding="$5"
          pressStyle={{ scale: 0.98, opacity: 0.9 }}
          onPress={() => setSelectedRole("seller")}
          backgroundColor={selectedRole === "seller" ? "$primaryLight" : "$background"}
          borderColor={selectedRole === "seller" ? "$primary" : "$borderColor"}
        >
          <XStack gap="$4" alignItems="center">
            <YStack
              width={60}
              height={60}
              backgroundColor={selectedRole === "seller" ? "$primary" : "$gray5"}
              borderRadius="$4"
              alignItems="center"
              justifyContent="center"
            >
              <Store size={28} color={selectedRole === "seller" ? "white" : "$colorMuted"} />
            </YStack>
            <YStack flex={1} gap="$1">
              <Text fontSize="$6" fontWeight="bold">I'm a Seller</Text>
              <Text fontSize="$3" color="$colorMuted">
                Restaurant or business owner managing orders and menu
              </Text>
            </YStack>
            <ChevronRight size={20} color="$colorMuted" />
          </XStack>
        </Card>

        {/* Rider Card */}
        <Card
          bordered
          padding="$5"
          pressStyle={{ scale: 0.98, opacity: 0.9 }}
          onPress={() => setSelectedRole("rider")}
          backgroundColor={selectedRole === "rider" ? "$primaryLight" : "$background"}
          borderColor={selectedRole === "rider" ? "$primary" : "$borderColor"}
        >
          <XStack gap="$4" alignItems="center">
            <YStack
              width={60}
              height={60}
              backgroundColor={selectedRole === "rider" ? "$primary" : "$gray5"}
              borderRadius="$4"
              alignItems="center"
              justifyContent="center"
            >
              <Truck size={28} color={selectedRole === "rider" ? "white" : "$colorMuted"} />
            </YStack>
            <YStack flex={1} gap="$1">
              <Text fontSize="$6" fontWeight="bold">I'm a Rider</Text>
              <Text fontSize="$3" color="$colorMuted">
                Delivery agent picking up and delivering orders
              </Text>
            </YStack>
            <ChevronRight size={20} color="$colorMuted" />
          </XStack>
        </Card>
      </YStack>

      <YStack mt="auto" gap="$3">
        <Button
          variant="primary"
          onPress={handleLogin}
          disabled={!selectedRole}
          opacity={selectedRole ? 1 : 0.5}
        >
          LOG IN
        </Button>
        <Button
          variant="outline"
          onPress={handleSignup}
          disabled={!selectedRole}
          opacity={selectedRole ? 1 : 0.5}
        >
          CREATE ACCOUNT
        </Button>
      </YStack>
    </YStack>
  );
}
