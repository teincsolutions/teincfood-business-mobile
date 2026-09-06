// @ts-nocheck
import { FlatList } from "react-native";
import { YStack, XStack, Text, Card, Separator, Avatar } from "tamagui";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  DollarSign,
  Users,
  ChevronRight,
  Download,
  CircleDashed,
} from "@tamagui/lucide-icons";
import { useRouter } from "expo-router";
import { Button } from "@/components/ui";
import {
  useFleetDashboardQuery,
  useFleetRidersQuery,
} from "@/hooks/useFleet";
import { formatPriceFromMinor } from "@teincfood/core";

export default function FleetEarningsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { data: dashboardData } = useFleetDashboardQuery();
  const { data: ridersData = [] } = useFleetRidersQuery();

  const todayEarningsMinor = dashboardData?.today_earnings_minor ?? 0;
  const todayDeliveries = dashboardData?.today_deliveries ?? 0;
  const totalRiders = dashboardData?.total_riders ?? 0;

  const topRiders = [...ridersData]
    .sort((a, b) => (b.total_earnings_minor ?? 0) - (a.total_earnings_minor ?? 0))
    .slice(0, 5);

  const renderRiderItem = ({ item: rider, index }) => (
    <Card key={rider.id} padding="$3" bordered marginBottom="$3">
      <XStack gap="$3" alignItems="center">
        <YStack
          width={32}
          height={32}
          borderRadius="$10"
          backgroundColor={index < 3 ? "$primary" : "$colorMuted"}
          alignItems="center"
          justifyContent="center"
        >
          <Text color="white" fontWeight="bold" fontSize="$3">
            {index + 1}
          </Text>
        </YStack>
        <Avatar circular size="$4">
          <Avatar.Fallback backgroundColor="$colorMuted">
            <Text color="white" fontWeight="bold">
              {rider.rider_name?.charAt(0) || "R"}
            </Text>
          </Avatar.Fallback>
        </Avatar>
        <YStack flex={1}>
          <Text fontSize="$4" fontWeight="600" fontFamily="$heading">
            {rider.rider_name || rider.rider_number || `Rider #${rider.id?.slice(0, 8)}`}
          </Text>
          <Text fontSize="$3" color="$colorSecondary" fontFamily="$body">
            {(rider.total_deliveries ?? 0)} deliveries
          </Text>
        </YStack>
        <YStack alignItems="flex-end">
          <Text fontSize="$4" fontWeight="600" color="$success" fontFamily="$heading">
            {formatPriceFromMinor(rider.total_earnings_minor ?? 0)}
          </Text>
        </YStack>
      </XStack>
    </Card>
  );

  const ListHeaderComponent = () => (
    <YStack padding="$4" gap="$4">
      <YStack gap="$2">
        <Text fontSize="$8" fontWeight="bold" fontFamily="$heading" color="$color">
          Earnings
        </Text>
        <Text fontSize="$4" color="$colorSecondary" fontFamily="$body">
          Track your fleet's earnings and performance
        </Text>
      </YStack>

      <Card padding="$5" bordered backgroundColor="$primaryLight">
        <YStack gap="$4" alignItems="center">
          <YStack
            width={64}
            height={64}
            borderRadius="$6"
            backgroundColor="$primary"
            alignItems="center"
            justifyContent="center"
          >
            <DollarSign size={32} color="white" />
          </YStack>
          <YStack alignItems="center">
            <Text fontSize="$3" color="$colorSecondary" fontFamily="$body">
              Today's Earnings
            </Text>
            <Text fontSize="$10" fontWeight="bold" color="$primary" fontFamily="$heading">
              {formatPriceFromMinor(todayEarningsMinor)}
            </Text>
          </YStack>
          <XStack gap="$6">
            <YStack alignItems="center">
              <Text fontSize="$6" fontWeight="600" fontFamily="$heading">
                {todayDeliveries}
              </Text>
              <Text fontSize="$3" color="$colorSecondary" fontFamily="$body">
                Deliveries
              </Text>
            </YStack>
            <YStack alignItems="center">
              <Text fontSize="$6" fontWeight="600" fontFamily="$heading">
                {totalRiders}
              </Text>
              <Text fontSize="$3" color="$colorSecondary" fontFamily="$body">
                Active Riders
              </Text>
            </YStack>
            <YStack alignItems="center">
              <Text fontSize="$6" fontWeight="600" fontFamily="$heading">
                {totalRiders > 0
                  ? formatPriceFromMinor(Math.round(todayEarningsMinor / totalRiders))
                  : "---"}
              </Text>
              <Text fontSize="$3" color="$colorSecondary" fontFamily="$body">
                Avg / rider
              </Text>
            </YStack>
          </XStack>
        </YStack>
      </Card>

      <XStack justifyContent="space-between" alignItems="center">
        <Text fontSize="$6" fontWeight="600" fontFamily="$heading" color="$color">
          Top Riders
        </Text>
        <Button
          variant="ghost"
          size="$2"
          icon={ChevronRight}
          onPress={() => router.push("/(fleet)/riders")}
        >
          View All
        </Button>
      </XStack>
    </YStack>
  );

  const ListEmptyComponent = () => (
    <YStack padding="$10" alignItems="center" gap="$3">
      <CircleDashed size={64} color="$gray200" />
      <Text fontSize="$5" fontWeight="700" fontFamily="$heading" color="$color">
        No rider earnings yet
      </Text>
      <Text fontSize="$3" color="$colorSecondary" fontFamily="$body" textAlign="center">
        Rider earnings from completed deliveries will appear here.
      </Text>
    </YStack>
  );

  return (
    <YStack flex={1} backgroundColor="$background" paddingTop={insets.top}>
      <FlatList
        data={topRiders}
        keyExtractor={(item) => item.id}
        renderItem={renderRiderItem}
        ListHeaderComponent={ListHeaderComponent}
        ListEmptyComponent={ListEmptyComponent}
        contentContainerStyle={{
          paddingBottom: Math.max(insets.bottom + 20, 24),
        }}
        initialNumToRender={10}
        windowSize={5}
        maxToRenderPerBatch={10}
        removeClippedSubviews
      />
    </YStack>
  );
}
