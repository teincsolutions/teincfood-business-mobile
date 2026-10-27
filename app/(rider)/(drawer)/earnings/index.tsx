// @ts-nocheck
import { useState } from "react";
import { FlatList } from "react-native";
import { YStack, XStack, Text, Card } from "tamagui";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  DollarSign,
  Download,
  CircleDashed,
  ArrowDownLeft,
  ArrowUpRight,
} from "@tamagui/lucide-icons";
import { useRouter } from "expo-router";
import { Button } from "@/components/ui";
import {
  useRiderEarningsSummaryQuery,
  useRiderWalletHistoryQuery,
} from "@teincfood/core";
import { formatPriceFromMinor } from "@teincfood/core";

const PERIODS = [
  { key: "today" as const, label: "Today" },
  { key: "this_week" as const, label: "Week" },
  { key: "this_month" as const, label: "Month" },
];

export default function RiderEarningsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [period, setPeriod] = useState<"today" | "this_week" | "this_month">(
    "today",
  );

  const { data: earningsSummary } = useRiderEarningsSummaryQuery(period);
  const { data: transactionsData = [] } = useRiderWalletHistoryQuery();

  const summary = earningsSummary?.data;
  const totalEarningsMinor = summary?.total_earnings_minor ?? 0;
  const totalPeriodDeliveries = summary?.total_deliveries ?? 0;
  const avgPerDelivery =
    totalPeriodDeliveries > 0 ? totalEarningsMinor / totalPeriodDeliveries : 0;

  const periodLabel = PERIODS.find((p) => p.key === period)?.label ?? "Today";

  const renderTransaction = ({ item: transaction }) => {
    const isCredit = transaction.type === "credit";

    return (
      <Card key={transaction.id} padding="$3" bordered marginBottom="$3">
        <XStack justifyContent="space-between" alignItems="center">
          <XStack gap="$3" width={"75%"} alignItems="center">
            <YStack
              width={40}
              height={40}
              borderRadius="$10"
              backgroundColor="$green2"
              alignItems="center"
              justifyContent="center"
            >
              {isCredit ? (
                <ArrowDownLeft size={16} color="$green10" />
              ) : (
                <ArrowUpRight size={16} color="$red10" />
              )}
            </YStack>
            <YStack maxWidth={"80%"}>
              <Text
                numberOfLines={3}
                fontSize="$4"
                fontWeight="500"
                fontFamily="$heading"
              >
                {transaction.description}
              </Text>
              <Text fontSize="$3" color="$colorSecondary" fontFamily="$body">
                {transaction.inserted_at
                  ? new Date(transaction.inserted_at).toLocaleDateString()
                  : ""}
              </Text>
            </YStack>
          </XStack>
          <YStack width={"25%"} alignItems="flex-end">
            <Text
              fontSize="$4"
              fontWeight="600"
              color="$green10"
              fontFamily="$heading"
            >
              {`${transaction.type === "debit" ? "-" : "+"} ${transaction.amount_minor != null ? formatPriceFromMinor(transaction.amount_minor) : ""}`}
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
  };

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
        {PERIODS.map((p) => (
          <Button
            key={p.key}
            size="$2"
            variant={period === p.key ? "primary" : "outline"}
            onPress={() => setPeriod(p.key)}
            flex={1}
          >
            {p.label}
          </Button>
        ))}
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
            <DollarSign size={32} color="$white" />
          </YStack>
          <YStack alignItems="center">
            <Text fontSize="$3" color="$colorSecondary" fontFamily="$body">
              {periodLabel}
            </Text>
            <Text
              fontSize="$10"
              fontWeight="bold"
              color="$green10"
              fontFamily="$heading"
            >
              {formatPriceFromMinor(totalEarningsMinor)}
            </Text>
          </YStack>
          <XStack gap="$6">
            <YStack alignItems="center">
              <Text fontSize="$6" fontWeight="600" fontFamily="$heading">
                {totalPeriodDeliveries}
              </Text>
              <Text fontSize="$3" color="$colorSecondary" fontFamily="$body">
                Deliveries
              </Text>
            </YStack>
            <YStack alignItems="center">
              <Text fontSize="$6" fontWeight="600" fontFamily="$heading">
                {avgPerDelivery > 0
                  ? formatPriceFromMinor(Math.round(avgPerDelivery))
                  : "---"}
              </Text>
              <Text fontSize="$3" color="$colorSecondary" fontFamily="$body">
                Avg / delivery
              </Text>
            </YStack>
          </XStack>
        </YStack>
      </Card>

      <XStack justifyContent="space-between" alignItems="center">
        <Text
          fontSize="$6"
          fontWeight="600"
          fontFamily="$heading"
          color="$color"
        >
          Recent Transactions
        </Text>
      </XStack>
    </YStack>
  );

  const ListEmptyComponent = () => (
    <YStack padding="$10" alignItems="center" gap="$3">
      <CircleDashed size={64} color="$gray200" />
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
    <YStack flex={1} backgroundColor="$background" alignItems="center">
      <FlatList
        data={transactionsData}
        keyExtractor={(item) => item.id}
        renderItem={renderTransaction}
        ListHeaderComponent={ListHeaderComponent}
        ListEmptyComponent={ListEmptyComponent}
        ListFooterComponent={ListFooterComponent}
        style={{ width: "100%", maxWidth: 960 }}
        contentContainerStyle={{
          width: "100%",
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
