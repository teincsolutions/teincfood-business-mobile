// @ts-nocheck
import { useState } from "react";
import { ScrollView } from "react-native";
import {
  YStack,
  XStack,
  Text,
  Card,
  Separator,
} from "tamagui";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  DollarSign,
  TrendingUp,
  Calendar,
  Download,
  Clock,
} from "@tamagui/lucide-icons";
import { useRouter } from "expo-router";
import { Button } from "@/components/ui";

export default function RiderEarningsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [selectedPeriod, setSelectedPeriod] = useState<"today" | "week" | "month">("today");

  const earningsData = {
    today: { amount: 45.5, deliveries: 8 },
    week: { amount: 320.0, deliveries: 52 },
    month: { amount: 1250.0, deliveries: 198 },
  };

  const currentData = earningsData[selectedPeriod];

  const recentEarnings = [
    { id: "1", orderId: "ORD-12345", amount: 8.5, time: "2 hours ago", status: "completed" },
    { id: "2", orderId: "ORD-12344", amount: 12.0, time: "4 hours ago", status: "completed" },
    { id: "3", orderId: "ORD-12343", amount: 6.5, time: "6 hours ago", status: "completed" },
    { id: "4", orderId: "ORD-12342", amount: 15.0, time: "8 hours ago", status: "completed" },
    { id: "5", orderId: "ORD-12341", amount: 9.0, time: "10 hours ago", status: "completed" },
  ];

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
          <Text fontSize="$8" fontWeight="bold" fontFamily="$heading" color="$color">
            Earnings
          </Text>
          <Text fontSize="$4" color="$colorSecondary" fontFamily="$body">
            Track your delivery earnings
          </Text>
        </YStack>

        {/* Period Selector */}
        <XStack gap="$2">
          <Button
            flex={1}
            size="$3"
            variant={selectedPeriod === "today" ? "solid" : "outlined"}
            onPress={() => setSelectedPeriod("today")}
          >
            Today
          </Button>
          <Button
            flex={1}
            size="$3"
            variant={selectedPeriod === "week" ? "solid" : "outlined"}
            onPress={() => setSelectedPeriod("week")}
          >
            This Week
          </Button>
          <Button
            flex={1}
            size="$3"
            variant={selectedPeriod === "month" ? "solid" : "outlined"}
            onPress={() => setSelectedPeriod("month")}
          >
            This Month
          </Button>
        </XStack>

        {/* Earnings Summary */}
        <Card padding="$5" bordered backgroundColor="$green2">
          <YStack gap="$4" alignItems="center">
            <YStack
              width={64}
              height={64}
              borderRadius="$6"
              backgroundColor="$green10"
              alignItems="center"
              justifyContent="center"
            >
              <DollarSign size={32} color="white" />
            </YStack>
            <YStack alignItems="center">
              <Text fontSize="$3" color="$colorSecondary" fontFamily="$body">
                Total Earnings
              </Text>
              <Text fontSize="$10" fontWeight="bold" color="$green10" fontFamily="$heading">
                GHS {currentData.amount.toFixed(2)}
              </Text>
            </YStack>
            <XStack gap="$6">
              <YStack alignItems="center">
                <Text fontSize="$6" fontWeight="600" fontFamily="$heading">
                  {currentData.deliveries}
                </Text>
                <Text fontSize="$3" color="$colorSecondary" fontFamily="$body">
                  Deliveries
                </Text>
              </YStack>
              <YStack alignItems="center">
                <Text fontSize="$6" fontWeight="600" fontFamily="$heading">
                  {currentData.deliveries > 0
                    ? (currentData.amount / currentData.deliveries).toFixed(2)
                    : "0.00"}
                </Text>
                <Text fontSize="$3" color="$colorSecondary" fontFamily="$body">
                  Avg per delivery
                </Text>
              </YStack>
            </XStack>
          </YStack>
        </Card>

        {/* Payout Status */}
        <Card padding="$4" bordered>
          <YStack gap="$3">
            <XStack justifyContent="space-between" alignItems="center">
              <Text fontSize="$5" fontWeight="600" fontFamily="$heading" color="$color">
                Pending Payout
              </Text>
              <Text fontSize="$5" fontWeight="600" color="$orange10" fontFamily="$heading">
                GHS {currentData.amount.toFixed(2)}
              </Text>
            </XStack>
            <Separator />
            <XStack justifyContent="space-between" alignItems="center">
              <Text fontSize="$4" color="$colorSecondary" fontFamily="$body">
                Next Payout
              </Text>
              <Text fontSize="$4" fontWeight="600" fontFamily="$heading">
                Tomorrow, 6:00 PM
              </Text>
            </XStack>
          </YStack>
        </Card>

        {/* Quick Stats */}
        <XStack gap="$3">
          <Card flex={1} padding="$4" bordered>
            <YStack gap="$2" alignItems="center">
              <YStack
                width={40}
                height={40}
                borderRadius="$3"
                backgroundColor="$blue2"
                alignItems="center"
                justifyContent="center"
              >
                <TrendingUp size={20} color="$blue10" />
              </YStack>
              <Text fontSize="$5" fontWeight="600" fontFamily="$heading">
                +12%
              </Text>
              <Text fontSize="$3" color="$colorSecondary" fontFamily="$body">
                vs last week
              </Text>
            </YStack>
          </Card>

          <Card flex={1} padding="$4" bordered>
            <YStack gap="$2" alignItems="center">
              <YStack
                width={40}
                height={40}
                borderRadius="$3"
                backgroundColor="$yellow2"
                alignItems="center"
                justifyContent="center"
              >
                <Clock size={20} color="$yellow10" />
              </YStack>
              <Text fontSize="$5" fontWeight="600" fontFamily="$heading">
                2.5h
              </Text>
              <Text fontSize="$3" color="$colorSecondary" fontFamily="$body">
                Avg delivery time
              </Text>
            </YStack>
          </Card>
        </XStack>

        {/* Recent Earnings */}
        <YStack gap="$3">
          <XStack justifyContent="space-between" alignItems="center">
            <Text fontSize="$6" fontWeight="600" fontFamily="$heading" color="$color">
              Recent Earnings
            </Text>
            <Button variant="ghost" size="$2">
              View All
            </Button>
          </XStack>

          {recentEarnings.map((earning) => (
            <Card key={earning.id} padding="$3" bordered>
              <XStack justifyContent="space-between" alignItems="center">
                <XStack gap="$3" alignItems="center">
                  <YStack
                    width={40}
                    height={40}
                    borderRadius="$10"
                    backgroundColor="$green2"
                    alignItems="center"
                    justifyContent="center"
                  >
                    <DollarSign size={20} color="$green10" />
                  </YStack>
                  <YStack>
                    <Text fontSize="$4" fontWeight="500" fontFamily="$heading">
                      {earning.orderId}
                    </Text>
                    <Text fontSize="$3" color="$colorSecondary" fontFamily="$body">
                      {earning.time}
                    </Text>
                  </YStack>
                </XStack>
                <YStack alignItems="flex-end">
                  <Text fontSize="$4" fontWeight="600" color="$green10" fontFamily="$heading">
                    + GHS {earning.amount.toFixed(2)}
                  </Text>
                  <YStack
                    paddingHorizontal="$2"
                    paddingVertical="$1"
                    borderRadius="$2"
                    backgroundColor="$green2"
                  >
                    <Text fontSize="$2" color="$green10" fontFamily="$body">
                      Completed
                    </Text>
                  </YStack>
                </YStack>
              </XStack>
            </Card>
          ))}
        </YStack>

        {/* Export Button */}
        <Button icon={Download} variant="outlined">
          Export Earnings Report
        </Button>
      </YStack>
    </ScrollView>
  );
}