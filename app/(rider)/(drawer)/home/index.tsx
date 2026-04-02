// @ts-nocheck
import { useState, useEffect } from "react";
import { ScrollView } from "react-native";
import {
  YStack,
  XStack,
  Text,
  Card,
  Switch,
  Separator,
} from "tamagui";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  MapPin,
  DollarSign,
  Package,
  Clock,
  Navigation,
  Power,
} from "@tamagui/lucide-icons";
import { useAuthStore } from "@/stores/auth.store";
import { useRouter } from "expo-router";
import { Button } from "@/components/ui";

export default function RiderHomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((state) => state.user);
  const [isOnline, setIsOnline] = useState(user?.isOnline || false);
  const [todayEarnings, setTodayEarnings] = useState(45.5);
  const [todayDeliveries, setTodayDeliveries] = useState(8);
  const [activeDelivery, setActiveDelivery] = useState(null);

  const handleToggleOnline = (value: boolean) => {
    setIsOnline(value);
    // In real app, update user status via API
    useAuthStore.getState().updateUser({ isOnline: value });
  };

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{
        paddingBottom: Math.max(insets.bottom + 20, 24),
      }}
    >
      <YStack padding="$4" gap="$4">
        {/* Online/Offline Toggle */}
        <Card padding="$4" bordered backgroundColor={isOnline ? "$green2" : "$gray2"}>
          <XStack justifyContent="space-between" alignItems="center">
            <XStack gap="$3" alignItems="center">
              <YStack
                width={48}
                height={48}
                borderRadius="$10"
                backgroundColor={isOnline ? "$green10" : "$gray10"}
                alignItems="center"
                justifyContent="center"
              >
                <Power size={24} color="white" />
              </YStack>
              <YStack>
                <Text fontSize="$5" fontWeight="600" fontFamily="$heading" color="$color">
                  {isOnline ? "You're Online" : "You're Offline"}
                </Text>
                <Text fontSize="$3" color="$colorSecondary" fontFamily="$body">
                  {isOnline
                    ? "Ready to accept deliveries"
                    : "Go online to start receiving orders"}
                </Text>
              </YStack>
            </XStack>
            <Switch
              size="$4"
              checked={isOnline}
              onCheckedChange={handleToggleOnline}
              backgroundColor={isOnline ? "$green10" : "$gray8"}
            >
              <Switch.Thumb animation="bouncy" />
            </Switch>
          </XStack>
        </Card>

        {/* Today's Stats */}
        <XStack gap="$3">
          <Card flex={1} padding="$4" bordered>
            <YStack gap="$2" alignItems="center">
              <YStack
                width={48}
                height={48}
                borderRadius="$4"
                backgroundColor="$green2"
                alignItems="center"
                justifyContent="center"
              >
                <DollarSign size={24} color="$green10" />
              </YStack>
              <YStack alignItems="center">
                <Text fontSize="$6" fontWeight="bold" fontFamily="$heading">
                  GHS {todayEarnings.toFixed(2)}
                </Text>
                <Text fontSize="$3" color="$colorSecondary" fontFamily="$body">
                  Today's Earnings
                </Text>
              </YStack>
            </YStack>
          </Card>

          <Card flex={1} padding="$4" bordered>
            <YStack gap="$2" alignItems="center">
              <YStack
                width={48}
                height={48}
                borderRadius="$4"
                backgroundColor="$blue2"
                alignItems="center"
                justifyContent="center"
              >
                <Package size={24} color="$blue10" />
              </YStack>
              <YStack alignItems="center">
                <Text fontSize="$6" fontWeight="bold" fontFamily="$heading">
                  {todayDeliveries}
                </Text>
                <Text fontSize="$3" color="$colorSecondary" fontFamily="$body">
                  Deliveries
                </Text>
              </YStack>
            </YStack>
          </Card>
        </XStack>

        {/* Map Placeholder */}
        <Card padding="$4" bordered height={200}>
          <YStack flex={1} justifyContent="center" alignItems="center" gap="$3">
            <MapPin size={48} color="$colorMuted" />
            <Text fontSize="$4" color="$colorSecondary" textAlign="center" fontFamily="$body">
              Live Map
            </Text>
            <Text fontSize="$3" color="$colorMuted" textAlign="center" fontFamily="$body">
              Your current location and nearby delivery requests will appear here
            </Text>
          </YStack>
        </Card>

        {/* Active Delivery */}
        {activeDelivery ? (
          <Card padding="$4" bordered backgroundColor="$blue2">
            <YStack gap="$3">
              <XStack justifyContent="space-between" alignItems="center">
                <Text fontSize="$5" fontWeight="600" fontFamily="$heading" color="$color">
                  Active Delivery
                </Text>
                <YStack
                  paddingHorizontal="$2"
                  paddingVertical="$1"
                  borderRadius="$2"
                  backgroundColor="$blue10"
                >
                  <Text fontSize="$2" color="white" fontFamily="$body">
                    In Progress
                  </Text>
                </YStack>
              </XStack>
              <Separator />
              <Button
                icon={Navigation}
                onPress={() => router.push("/(rider)/(drawer)/deliveries/active")}
              >
                View Delivery Details
              </Button>
            </YStack>
          </Card>
        ) : (
          <Card padding="$4" bordered>
            <YStack alignItems="center" gap="$3" padding="$4">
              <Package size={48} color="$colorMuted" />
              <Text fontSize="$5" fontWeight="600" textAlign="center" fontFamily="$heading">
                No Active Delivery
              </Text>
              <Text fontSize="$4" color="$colorSecondary" textAlign="center" fontFamily="$body">
                {isOnline
                  ? "Waiting for new delivery requests..."
                  : "Go online to start receiving deliveries"}
              </Text>
              {isOnline && (
                <Button
                  variant="outlined"
                  onPress={() => router.push("/(rider)/(drawer)/deliveries/available")}
                >
                  View Available Deliveries
                </Button>
              )}
            </YStack>
          </Card>
        )}

        {/* Quick Actions */}
        <YStack gap="$3">
          <Text fontSize="$5" fontWeight="600" fontFamily="$heading" color="$color">
            Quick Actions
          </Text>
          <XStack gap="$3">
            <Button
              flex={1}
              variant="outlined"
              icon={Package}
              onPress={() => router.push("/(rider)/(drawer)/deliveries")}
            >
              Deliveries
            </Button>
            <Button
              flex={1}
              variant="outlined"
              icon={DollarSign}
              onPress={() => router.push("/(rider)/(drawer)/earnings")}
            >
              Earnings
            </Button>
          </XStack>
        </YStack>

        {/* Recent Activity */}
        <YStack gap="$3">
          <Text fontSize="$5" fontWeight="600" fontFamily="$heading" color="$color">
            Recent Activity
          </Text>
          <Card padding="$4" bordered>
            <YStack gap="$3">
              <XStack justifyContent="space-between" alignItems="center">
                <XStack gap="$2" alignItems="center">
                  <YStack
                    width={40}
                    height={40}
                    borderRadius="$10"
                    backgroundColor="$green2"
                    alignItems="center"
                    justifyContent="center"
                  >
                    <Package size={20} color="$green10" />
                  </YStack>
                  <YStack>
                    <Text fontSize="$4" fontWeight="500" fontFamily="$heading">
                      Delivery Completed
                    </Text>
                    <Text fontSize="$3" color="$colorSecondary" fontFamily="$body">
                      Order #12345
                    </Text>
                  </YStack>
                </XStack>
                <YStack alignItems="flex-end">
                  <Text fontSize="$4" fontWeight="600" color="$green10" fontFamily="$heading">
                    + GHS 8.50
                  </Text>
                  <Text fontSize="$2" color="$colorMuted" fontFamily="$body">
                    2 hours ago
                  </Text>
                </YStack>
              </XStack>
              <Separator />
              <XStack justifyContent="space-between" alignItems="center">
                <XStack gap="$2" alignItems="center">
                  <YStack
                    width={40}
                    height={40}
                    borderRadius="$10"
                    backgroundColor="$blue2"
                    alignItems="center"
                    justifyContent="center"
                  >
                    <Package size={20} color="$blue10" />
                  </YStack>
                  <YStack>
                    <Text fontSize="$4" fontWeight="500" fontFamily="$heading">
                      Delivery Completed
                    </Text>
                    <Text fontSize="$3" color="$colorSecondary" fontFamily="$body">
                      Order #12344
                    </Text>
                  </YStack>
                </XStack>
                <YStack alignItems="flex-end">
                  <Text fontSize="$4" fontWeight="600" color="$green10" fontFamily="$heading">
                    + GHS 12.00
                  </Text>
                  <Text fontSize="$2" color="$colorMuted" fontFamily="$body">
                    4 hours ago
                  </Text>
                </YStack>
              </XStack>
            </YStack>
          </Card>
        </YStack>
      </YStack>
    </ScrollView>
  );
}