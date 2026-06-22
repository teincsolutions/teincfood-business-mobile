// @ts-nocheck
import { FlatList } from "react-native";
import { YStack, XStack, Text, Card, Separator } from "tamagui";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { DollarSign, Download, CircleDashed } from "@tamagui/lucide-icons";
import { useRouter } from "expo-router";
import { Button } from "@/components/ui";
import {
  useRiderMetricsQuery,
  useWalletHistoryQuery,
} from "@/hooks/useRider";
import { formatPriceFromMinor } from "@/utils/currency";

export default function RiderEarningsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { data: metricsData } = useRiderMetricsQuery();
  const { data: transactionsData = [] } = useWalletHistoryQuery();

  const todayEarningsMinor = metricsData?.today_earnings_minor ?? 0;
  const todayDeliveries = metricsData?.today_deliveries ?? 0;
  const totalDeliveries = metricsData?.total_deliveries ?? 0;
  const avgPerDelivery = todayDeliveries > 0 ? todayEarningsMinor / todayDeliveries : 0;

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
          Your today's delivery earnings
        </Text>
      </YStack>

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
              Today's Earnings
            </Text>
            <Text
              fontSize="$10"
              fontWeight="bold"
              color="$green10"
              fontFamily="$heading"
            >
              {formatPriceFromMinor(todayEarningsMinor)}
            </Text>
          </YStack>
          <XStack gap="$6">
            <YStack alignItems="center">
              <Text fontSize="$6" fontWeight="600" fontFamily="$heading">
                {todayDeliveries}
              </Text>
              <Text fontSize="$3" color="$colorSecondary" fontFamily="$body">
                Today
              </Text>
            </YStack>
            <YStack alignItems="center">
              <Text fontSize="$6" fontWeight="600" fontFamily="$heading">
                {totalDeliveries}
              </Text>
              <Text fontSize="$3" color="$colorSecondary" fontFamily="$body">
                Total
              </Text>
            </YStack>
            <YStack alignItems="center">
              <Text fontSize="$6" fontWeight="600" fontFamily="$heading">
                {avgPerDelivery > 0 ? formatPriceFromMinor(Math.round(avgPerDelivery)) : "---"}
              </Text>
              <Text fontSize="$3" color="$colorSecondary" fontFamily="$body">
                Avg / delivery
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
              {formatPriceFromMinor(todayEarningsMinor)}
            </Text>
          </XStack>
          <Separator />
          <XStack justifyContent="space-between" alignItems="center">
            <Text fontSize="$4" color="$colorSecondary" fontFamily="$body">
              Status
            </Text>
            <Text fontSize="$4" fontWeight="600" fontFamily="$heading">
              {metricsData?.status === "available" ? "Available" : metricsData?.status ?? "---"}
            </Text>
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
