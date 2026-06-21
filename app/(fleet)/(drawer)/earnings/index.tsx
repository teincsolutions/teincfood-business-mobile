// @ts-nocheck
import { useState } from "react";
import { ScrollView } from "react-native";
import { YStack, XStack, Text, Card, Separator, Avatar } from "tamagui";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  DollarSign,
  TrendingUp,
  Calendar,
  Users,
  ChevronRight,
  Download,
} from "@tamagui/lucide-icons";
import { useFleetStore } from "@/stores/fleet.store";
import { useRouter } from "expo-router";
import { Button } from "@/components/ui";
import { formatPrice } from "@/utils/currency";

export default function FleetEarningsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { dashboard, riders } = useFleetStore();
  const [selectedPeriod, setSelectedPeriod] = useState<
    "today" | "week" | "month"
  >("today");

  const getEarningsByPeriod = () => {
    switch (selectedPeriod) {
      case "today":
        return dashboard?.todayEarnings || 0;
      case "week":
        return dashboard?.weekEarnings || 0;
      case "month":
        return dashboard?.monthEarnings || 0;
      default:
        return 0;
    }
  };

  const getRidersByPeriod = () => {
    switch (selectedPeriod) {
      case "today":
        return riders.filter((r) => r.status === "active").length;
      case "week":
        return riders.length;
      case "month":
        return riders.length;
      default:
        return 0;
    }
  };

  const topRiders = [...riders]
    .sort((a, b) => b.totalEarnings - a.totalEarnings)
    .slice(0, 5);

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{
        paddingBottom: Math.max(insets.bottom + 20, 24),
      }}
    >
      <YStack padding="$4" gap="$4">
        {/* Header */}
        <YStack gap="$2">
          <Text
            fontSize="$8"
            fontWeight="bold"
            fontFamily="$heading"
            color="$color"
          >
            Earnings
          </Text>
          <Text fontSize="$4" color="$colorSecondary" fontFamily="$body">
            Track your fleet's earnings and performance
          </Text>
        </YStack>

        {/* Period Selector */}
        <XStack gap="$2">
          <Button
            flex={1}
            size="$3"
            variant={selectedPeriod === "today" ? "primary" : "outline"}
            onPress={() => setSelectedPeriod("today")}
          >
            Today
          </Button>
          <Button
            flex={1}
            size="$3"
            variant={selectedPeriod === "week" ? "primary" : "outline"}
            onPress={() => setSelectedPeriod("week")}
          >
            This Week
          </Button>
          <Button
            flex={1}
            size="$3"
            variant={selectedPeriod === "month" ? "primary" : "outline"}
            onPress={() => setSelectedPeriod("month")}
          >
            This Month
          </Button>
        </XStack>

        {/* Earnings Summary */}
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
                Total Earnings
              </Text>
              <Text
                fontSize="$10"
                fontWeight="bold"
                color="$primary"
                fontFamily="$heading"
              >
                {formatPrice(getEarningsByPeriod())}
              </Text>
            </YStack>
            <XStack gap="$6">
              <YStack alignItems="center">
                <Text fontSize="$6" fontWeight="600" fontFamily="$heading">
                  {getRidersByPeriod()}
                </Text>
                <Text fontSize="$3" color="$colorSecondary" fontFamily="$body">
                  Active Riders
                </Text>
              </YStack>
              <YStack alignItems="center">
                <Text fontSize="$6" fontWeight="600" fontFamily="$heading">
                  {getRidersByPeriod() > 0
                    ? (getEarningsByPeriod() / getRidersByPeriod()).toFixed(2)
                    : "0.00"}
                </Text>
                <Text fontSize="$3" color="$colorSecondary" fontFamily="$body">
                  Avg per rider
                </Text>
              </YStack>
            </XStack>
          </YStack>
        </Card>

        {/* Fleet Commission */}
        <Card padding="$4" bordered>
          <YStack gap="$3">
            <XStack justifyContent="space-between" alignItems="center">
              <Text
                fontSize="$5"
                fontWeight="600"
                fontFamily="$heading"
                color="$color"
              >
                Fleet Commission
              </Text>
              <Text
                fontSize="$5"
                fontWeight="600"
                color="$success"
                fontFamily="$heading"
              >
                {formatPrice(getEarningsByPeriod() * 0.15)}
              </Text>
            </XStack>
            <Separator />
            <XStack justifyContent="space-between" alignItems="center">
              <Text fontSize="$4" color="$colorSecondary" fontFamily="$body">
                Rider Payouts
              </Text>
              <Text fontSize="$4" fontWeight="600" fontFamily="$heading">
                {formatPrice(getEarningsByPeriod() * 0.85)}
              </Text>
            </XStack>
          </YStack>
        </Card>

        {/* Top Riders */}
        <YStack gap="$3">
          <XStack justifyContent="space-between" alignItems="center">
            <Text
              fontSize="$6"
              fontWeight="600"
              fontFamily="$heading"
              color="$color"
            >
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

          {topRiders.map((rider, index) => (
            <Card key={rider.id} padding="$3" bordered>
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
                  <Avatar.Image src={rider.riderAvatarUrl} />
                  <Avatar.Fallback backgroundColor="$colorMuted">
                    <Text color="white" fontWeight="bold">
                      {rider.riderName?.charAt(0) || "R"}
                    </Text>
                  </Avatar.Fallback>
                </Avatar>
                <YStack flex={1}>
                  <Text fontSize="$4" fontWeight="600" fontFamily="$heading">
                    {rider.riderName}
                  </Text>
                  <Text
                    fontSize="$3"
                    color="$colorSecondary"
                    fontFamily="$body"
                  >
                    {rider.totalDeliveries} deliveries
                  </Text>
                </YStack>
                <YStack alignItems="flex-end">
                  <Text
                    fontSize="$4"
                    fontWeight="600"
                    color="$success"
                    fontFamily="$heading"
                  >
                    {formatPrice(rider.totalEarnings)}
                  </Text>
                  <Text fontSize="$2" color="$colorMuted" fontFamily="$body">
                    Rating: {rider.rating.toFixed(1)}
                  </Text>
                </YStack>
              </XStack>
            </Card>
          ))}

          {topRiders.length === 0 && (
            <Card padding="$4" bordered>
              <YStack alignItems="center" gap="$3">
                <Users size={48} color="$colorMuted" />
                <Text
                  fontSize="$4"
                  color="$colorSecondary"
                  textAlign="center"
                  fontFamily="$body"
                >
                  No rider earnings yet
                </Text>
              </YStack>
            </Card>
          )}
        </YStack>

        {/* Earnings Breakdown */}
        <YStack gap="$3">
          <Text
            fontSize="$6"
            fontWeight="600"
            fontFamily="$heading"
            color="$color"
          >
            Earnings Breakdown
          </Text>
          <Card padding="$4" bordered>
            <YStack gap="$3">
              <XStack justifyContent="space-between">
                <Text fontSize="$4" color="$colorSecondary" fontFamily="$body">
                  Gross Earnings
                </Text>
                <Text fontSize="$4" fontWeight="600" fontFamily="$heading">
                  {formatPrice(getEarningsByPeriod())}
                </Text>
              </XStack>
              <Separator />
              <XStack justifyContent="space-between">
                <Text fontSize="$4" color="$colorSecondary" fontFamily="$body">
                  Fleet Commission (15%)
                </Text>
                <Text
                  fontSize="$4"
                  fontWeight="600"
                  color="$success"
                  fontFamily="$heading"
                >
                  + {formatPrice(getEarningsByPeriod() * 0.15)}
                </Text>
              </XStack>
              <Separator />
              <XStack justifyContent="space-between">
                <Text fontSize="$4" color="$colorSecondary" fontFamily="$body">
                  Rider Payouts (85%)
                </Text>
                <Text fontSize="$4" fontWeight="600" fontFamily="$heading">
                  {formatPrice(getEarningsByPeriod() * 0.85)}
                </Text>
              </XStack>
            </YStack>
          </Card>
        </YStack>

        {/* Export Button */}
        <Button icon={Download} variant="outline">
          Export Report
        </Button>
      </YStack>
    </ScrollView>
  );
}
