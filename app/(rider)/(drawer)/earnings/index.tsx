// @ts-nocheck
import { useState } from "react";
import { FlatList } from "react-native";
import { YStack, XStack, Text, Card, Separator } from "tamagui";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { DollarSign, TrendingUp, Download, Clock } from "@tamagui/lucide-icons";
import { useRouter } from "expo-router";
import { Button } from "@/components/ui";
import {
  useRiderEarningsQuery,
  useEarningsBreakdownQuery,
  useWalletHistoryQuery,
} from "@/hooks/useRider";

export default function RiderEarningsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [selectedPeriod, setSelectedPeriod] = useState<
    "today" | "week" | "month"
  >("today");

  const { data: earningsData } = useRiderEarningsQuery();
  const { data: breakdownData } = useEarningsBreakdownQuery();
  const { data: transactionsData = [] } = useWalletHistoryQuery();

  const earnings = {
    totalEarnings: earningsData?.total_earned_minor ?? 0,
    totalDeliveries: earningsData?.pagination?.total_entries ?? 0,
    currency: earningsData?.currency ?? "GHS",
    period: {
      today: earningsData?.period?.today ?? 0,
      week: earningsData?.period?.week ?? 0,
      month: earningsData?.period?.month ?? 0,
    },
  };

  const breakdown = {
    baseEarnings: breakdownData?.baseEarnings ?? 0,
    tips: breakdownData?.tips ?? 0,
    bonuses: breakdownData?.bonuses ?? 0,
    deductions: breakdownData?.deductions ?? 0,
  };

  const currentEarnings =
    selectedPeriod === "today"
      ? earnings.period.today
      : selectedPeriod === "week"
        ? earnings.period.week
        : earnings.period.month;

  const currentDeliveries = earnings.totalDeliveries;
  const avgPerDelivery =
    currentDeliveries > 0 ? currentEarnings / currentDeliveries : 0;

  const renderTransaction = ({ item: transaction }) => (
    <Card key={transaction.id} padding="$3" bordered marginBottom="$3">
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
              {transaction.description ||
                `Order #${transaction.id?.slice(0, 8)}`}
            </Text>
            <Text fontSize="$3" color="$colorSecondary" fontFamily="$body">
              {transaction.inserted_at
                ? new Date(transaction.inserted_at).toLocaleDateString()
                : ""}
            </Text>
          </YStack>
        </XStack>
        <YStack alignItems="flex-end">
          <Text
            fontSize="$4"
            fontWeight="600"
            color="$green10"
            fontFamily="$heading"
          >
            {`${transaction.type === "debit" ? "-" : "+"} ${earnings.currency} ${((transaction.amount_minor ?? 0) / 100).toFixed(2)}`}
          </Text>
          <YStack
            paddingHorizontal="$2"
            paddingVertical="$1"
            borderRadius="$2"
            backgroundColor="$green2"
          >
            <Text fontSize="$2" color="$green10" fontFamily="$body">
              {transaction.type}
            </Text>
          </YStack>
        </YStack>
      </XStack>
    </Card>
  );

  const ListHeaderComponent = () => (
    <YStack gap="$4" padding="$4" paddingBottom="$2">
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
          Track your delivery earnings
        </Text>
      </YStack>

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
            <Text
              fontSize="$10"
              fontWeight="bold"
              color="$green10"
              fontFamily="$heading"
            >
              {earnings.currency} {currentEarnings.toFixed(2)}
            </Text>
          </YStack>
          <XStack gap="$6">
            <YStack alignItems="center">
              <Text fontSize="$6" fontWeight="600" fontFamily="$heading">
                {currentDeliveries}
              </Text>
              <Text fontSize="$3" color="$colorSecondary" fontFamily="$body">
                Deliveries
              </Text>
            </YStack>
            <YStack alignItems="center">
              <Text fontSize="$6" fontWeight="600" fontFamily="$heading">
                {avgPerDelivery.toFixed(2)}
              </Text>
              <Text fontSize="$3" color="$colorSecondary" fontFamily="$body">
                Avg per delivery
              </Text>
            </YStack>
          </XStack>
        </YStack>
      </Card>

      <Card padding="$4" bordered>
        <YStack gap="$3">
          <XStack justifyContent="space-between" alignItems="center">
            <Text
              fontSize="$5"
              fontWeight="600"
              fontFamily="$heading"
              color="$color"
            >
              Pending Payout
            </Text>
            <Text
              fontSize="$5"
              fontWeight="600"
              color="$orange10"
              fontFamily="$heading"
            >
              {earnings.currency} {currentEarnings.toFixed(2)}
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

      <XStack justifyContent="space-between" alignItems="center">
        <Text
          fontSize="$6"
          fontWeight="600"
          fontFamily="$heading"
          color="$color"
        >
          Recent Earnings
        </Text>
      </XStack>
    </YStack>
  );

  const ListEmptyComponent = () => (
    <YStack padding="$10" alignItems="center" gap="$3">
      <DollarSign size={64} color="$gray200" />
      <Text fontSize="$5" fontWeight="700" fontFamily="$heading" color="$color">
        No earnings yet
      </Text>
      <Text
        fontSize="$3"
        color="$colorSecondary"
        fontFamily="$body"
        textAlign="center"
      >
        Your completed deliveries and earnings will appear here.
      </Text>
    </YStack>
  );

  const ListFooterComponent = () => (
    <YStack padding="$4" paddingTop="$2">
      <Button icon={Download} variant="outline">
        Export Earnings Report
      </Button>
    </YStack>
  );

  return (
    <YStack flex={1} backgroundColor="$background" paddingTop={insets.top}>
      <FlatList
        data={transactionsData}
        keyExtractor={(item) => item.id}
        renderItem={renderTransaction}
        ListHeaderComponent={ListHeaderComponent}
        ListEmptyComponent={ListEmptyComponent}
        ListFooterComponent={ListFooterComponent}
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
