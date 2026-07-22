// @ts-nocheck
import { useState, useMemo } from "react";
import { ScrollView, TouchableOpacity } from "react-native";
import { YStack, Text, Card, XStack, Separator, Spinner } from "tamagui";
import {
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Banknote,
  Smartphone,
  CreditCard,
  ChefHat,
  CalendarDays,
} from "@tamagui/lucide-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { formatPriceFromMinor } from "@/utils/currency";
import {
  useRevenueSummaryQuery,
  useSellerAnalyticsQuery,
} from "@/hooks/seller-analytics.hooks";
import { Badge } from "@/components/ui/Badge";

const PERIODS = [
  { key: "today", label: "Today" },
  { key: "this_week", label: "This Week" },
  { key: "this_month", label: "This Month" },
];

const METHOD_CONFIG = {
  cash: { icon: Banknote, label: "Cash", color: "$green9" },
  mobile_money: { icon: Smartphone, label: "Mobile Money", color: "$blue9" },
  card: { icon: CreditCard, label: "Card", color: "$purple9" },
  prepaid: { icon: CreditCard, label: "Online", color: "$orange9" },
  pay_on_delivery: { icon: Banknote, label: "Pay on Delivery", color: "$red9" },
};

function PeriodTab({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <YStack
        paddingHorizontal="$4"
        paddingVertical="$2"
        borderRadius="$4"
        backgroundColor={active ? "$primary" : "$backgroundSoft"}
      >
        <Text
          fontSize="$3"
          fontWeight="700"
          fontFamily="$body"
          color={active ? "white" : "$colorSecondary"}
        >
          {label}
        </Text>
      </YStack>
    </TouchableOpacity>
  );
}

function PaymentBar({ method, revenue_minor, count, percentage, totalColor }: {
  method: string;
  revenue_minor: number;
  count: number;
  percentage: number;
  totalColor: string;
}) {
  const config = METHOD_CONFIG[method] ?? { icon: DollarSign, label: method, color: "$gray9" };
  const Icon = config.icon;

  return (
    <YStack gap="$1.5">
      <XStack alignItems="center" gap="$2">
        <Icon size={16} color={config.color} />
        <Text fontSize="$3" fontWeight="600" fontFamily="$body" flex={1}>
          {config.label}
        </Text>
        <Text fontSize="$3" fontWeight="700" fontFamily="$body">
          {formatPriceFromMinor(revenue_minor)}
        </Text>
      </XStack>
      <XStack gap="$2" alignItems="center">
        <YStack flex={1} height={8} backgroundColor="$backgroundSoft" borderRadius="$full" overflow="hidden">
          <YStack
            width={`${percentage}%`}
            height="100%"
            backgroundColor={config.color}
            borderRadius="$full"
          />
        </YStack>
        <Text fontSize="$2" color="$colorSecondary" fontFamily="$body" minWidth={50} textAlign="right">
          {count} ({percentage}%)
        </Text>
      </XStack>
    </YStack>
  );
}

export default function SellerAnalytics() {
  const insets = useSafeAreaInsets();
  const [period, setPeriod] = useState("today");

  const { data: revenueData, isLoading: revenueLoading } = useRevenueSummaryQuery(period);
  const { data: analyticsData } = useSellerAnalyticsQuery(period);

  const summary = revenueData?.data;
  const paymentMethods = summary?.by_payment_method ?? [];
  const orderTypes = summary?.by_order_type ?? [];
  const days = summary?.by_day ?? [];
  const topItems = analyticsData?.data?.top_items ?? [];
  const maxDayRevenue = useMemo(
    () => Math.max(...days.map((d) => d.revenue_minor), 1),
    [days],
  );

  const formatPeriodLabel = (p: string) => {
    switch (p) {
      case "today": return "Today";
      case "this_week": return "This Week";
      case "this_month": return "This Month";
      default: return p;
    }
  };

  return (
    <YStack flex={1} backgroundColor="$background">
      <ScrollView showsVerticalScrollIndicator={false}>
        <YStack padding="$4" paddingBottom={insets.bottom + 24} gap="$4">
          {/* Header */}
          <Text fontSize="$6" fontWeight="700" fontFamily="$heading" color="$color">
            Analytics
          </Text>

          {/* Period Tabs */}
          <XStack gap="$2">
            {PERIODS.map((p) => (
              <PeriodTab
                key={p.key}
                label={p.label}
                active={period === p.key}
                onPress={() => setPeriod(p.key)}
              />
            ))}
          </XStack>

          {revenueLoading ? (
            <YStack padding="$8" alignItems="center">
              <Spinner size="large" color="$primary" />
            </YStack>
          ) : summary ? (
            <>
              {/* Revenue Summary Cards */}
              <XStack gap="$3">
                <Card flex={1} padding="$4" bordered>
                  <YStack gap="$2">
                    <XStack gap="$2" alignItems="center">
                      <DollarSign size={18} color="$green10" />
                      <Text fontSize="$3" color="$colorSecondary" fontFamily="$body">
                        Total Revenue
                      </Text>
                    </XStack>
                    <Text fontSize="$7" fontWeight="bold" fontFamily="$heading" color="$color">
                      {formatPriceFromMinor(summary.total_revenue_minor, summary.currency)}
                    </Text>
                  </YStack>
                </Card>
                <Card flex={1} padding="$4" bordered>
                  <YStack gap="$2">
                    <XStack gap="$2" alignItems="center">
                      <ShoppingBag size={18} color="$blue10" />
                      <Text fontSize="$3" color="$colorSecondary" fontFamily="$body">
                        Orders
                      </Text>
                    </XStack>
                    <Text fontSize="$7" fontWeight="bold" fontFamily="$heading" color="$color">
                      {summary.total_orders}
                    </Text>
                  </YStack>
                </Card>
              </XStack>

              <Card padding="$4" bordered>
                <YStack gap="$2">
                  <XStack gap="$2" alignItems="center">
                    <TrendingUp size={18} color="$yellow10" />
                    <Text fontSize="$4" color="$colorSecondary" fontFamily="$body">
                      Average Order Value
                    </Text>
                  </XStack>
                  <Text fontSize="$6" fontWeight="bold" fontFamily="$heading" color="$color">
                    {formatPriceFromMinor(summary.average_order_value_minor, summary.currency)}
                  </Text>
                </YStack>
              </Card>

              {/* Payment Method Breakdown */}
              {paymentMethods.length > 0 && (
                <Card padding="$4" bordered>
                  <YStack gap="$3">
                    <Text fontSize="$5" fontWeight="700" fontFamily="$heading" color="$color">
                      By Payment Method
                    </Text>
                    <Separator />
                    {paymentMethods.map((pm) => (
                      <PaymentBar
                        key={pm.method}
                        method={pm.method}
                        revenue_minor={pm.revenue_minor}
                        count={pm.count}
                        percentage={pm.percentage}
                      />
                    ))}
                  </YStack>
                </Card>
              )}

              {/* Revenue by Day */}
              {days.length > 0 && (
                <Card padding="$4" bordered>
                  <YStack gap="$3">
                    <Text fontSize="$5" fontWeight="700" fontFamily="$heading" color="$color">
                      Revenue by Day
                    </Text>
                    <Separator />
                    {days.map((d) => (
                      <YStack key={d.date} gap="$1">
                        <XStack justifyContent="space-between" alignItems="center">
                          <Text fontSize="$3" fontFamily="$body" color="$color">
                            {new Date(d.date + "T00:00:00").toLocaleDateString(undefined, {
                              weekday: "short",
                              month: "short",
                              day: "numeric",
                            })}
                          </Text>
                          <XStack gap="$2" alignItems="center">
                            <Text fontSize="$3" fontWeight="700" fontFamily="$body" color="$color">
                              {formatPriceFromMinor(d.revenue_minor, summary.currency)}
                            </Text>
                            <Text fontSize="$2" color="$colorSecondary" fontFamily="$body">
                              ({d.count})
                            </Text>
                          </XStack>
                        </XStack>
                        <YStack height={6} backgroundColor="$backgroundSoft" borderRadius="$full" overflow="hidden">
                          <YStack
                            width={`${(d.revenue_minor / maxDayRevenue) * 100}%`}
                            height="100%"
                            backgroundColor="$primary"
                            borderRadius="$full"
                          />
                        </YStack>
                      </YStack>
                    ))}
                  </YStack>
                </Card>
              )}

              {/* Order Type Breakdown */}
              {orderTypes.length > 0 && (
                <Card padding="$4" bordered>
                  <YStack gap="$3">
                    <Text fontSize="$5" fontWeight="700" fontFamily="$heading" color="$color">
                      By Order Type
                    </Text>
                    <Separator />
                    {orderTypes.map((ot) => (
                      <XStack key={ot.type} justifyContent="space-between" alignItems="center">
                        <XStack gap="$2" alignItems="center">
                          <ChefHat size={16} color="$colorSecondary" />
                          <Text fontSize="$4" fontFamily="$body" color="$color">
                            {ot.type.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                          </Text>
                        </XStack>
                        <XStack gap="$2" alignItems="center">
                          <Text fontSize="$4" fontWeight="700" fontFamily="$body" color="$color">
                            {formatPriceFromMinor(ot.revenue_minor, summary.currency)}
                          </Text>
                          <Badge backgroundColor="$backgroundSoft" size="$2">
                            <Text fontSize="$1" color="$colorSecondary" fontWeight="600">
                              {ot.count}
                            </Text>
                          </Badge>
                        </XStack>
                      </XStack>
                    ))}
                  </YStack>
                </Card>
              )}

              {/* Top Selling Items */}
              {topItems.length > 0 && (
                <Card padding="$4" bordered>
                  <YStack gap="$3">
                    <Text fontSize="$5" fontWeight="700" fontFamily="$heading" color="$color">
                      Top Selling Items
                    </Text>
                    <Separator />
                    {topItems.map((item, i) => (
                      <XStack key={i} justifyContent="space-between" alignItems="center">
                        <XStack gap="$2" alignItems="center">
                          <Text fontSize="$3" fontWeight="700" fontFamily="$body" color="$colorSecondary" minWidth={20}>
                            {i + 1}.
                          </Text>
                          <Text fontSize="$4" fontFamily="$body" color="$color">
                            {item.name}
                          </Text>
                        </XStack>
                        <XStack gap="$2" alignItems="center">
                          <Text fontSize="$4" fontWeight="700" fontFamily="$body" color="$color">
                            {item.quantity} sold
                          </Text>
                          <Text fontSize="$3" color="$colorSecondary" fontFamily="$body">
                            {formatPriceFromMinor(item.revenue_minor, summary.currency)}
                          </Text>
                        </XStack>
                      </XStack>
                    ))}
                  </YStack>
                </Card>
              )}
            </>
          ) : (
            <Card padding="$8" alignItems="center" justifyContent="center" bordered>
              <CalendarDays size={48} color="$gray200" />
              <Text fontSize="$4" color="$colorSecondary" fontFamily="$body" marginTop="$3" textAlign="center">
                No revenue data for {formatPeriodLabel(period)}
              </Text>
            </Card>
          )}
        </YStack>
      </ScrollView>
    </YStack>
  );
}
