// @ts-nocheck
import { useState, useMemo } from "react";
import { ScrollView, TouchableOpacity } from "react-native";
import {
  YStack,
  Text,
  Card,
  XStack,
  Separator,
  Spinner,
  Sheet,
  useMedia,
} from "tamagui";
import {
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Banknote,
  Smartphone,
  CreditCard,
  ChefHat,
  CalendarDays,
  Lock,
  Crown,
  Store,
  Clock,
} from "@tamagui/lucide-icons";
import { useEntitlements } from "@/hooks/useEntitlements";
import { useHasCapability } from "@/hooks/useMyBusinessCapabilities";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { formatPriceFromMinor } from "@teincfood/core";
import {
  useRevenueSummaryQuery,
  useSellerAnalyticsQuery,
} from "@teincfood/core";
import type { AnalyticsPeriod, AnalyticsRange } from "@teincfood/core";
import { Badge } from "@/components/ui/Badge";
import { Button, TamaguiDateInput } from "@/components/ui";

const PERIODS = [
  { key: "today", label: "Today" },
  { key: "this_week", label: "This Week" },
  { key: "this_month", label: "This Month" },
  { key: "this_year", label: "This Year" },
] as const;

const todayIso = () => new Date().toISOString().slice(0, 10);
const monthStartIso = () => `${todayIso().slice(0, 7)}-01`;

const METHOD_CONFIG = {
  cash: { icon: Banknote, label: "Cash", color: "$green9" },
  mobile_money: { icon: Smartphone, label: "Mobile Money", color: "$blue9" },
  card: { icon: CreditCard, label: "Card", color: "$purple9" },
  prepaid: { icon: CreditCard, label: "Online prepaid", color: "$orange9" },
  online_prepaid: { icon: CreditCard, label: "Online prepaid", color: "$orange9" },
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

function LockedReportCard({
  title,
  showUpgrade,
  onUpgrade,
}: {
  title: string;
  showUpgrade: boolean;
  onUpgrade: () => void;
}) {
  return (
    <Card padding="$4" bordered>
      <YStack gap="$2" alignItems="center">
        <Lock size={24} color="$colorSecondary" />
        <Text fontSize="$4" fontWeight="700" fontFamily="$heading" color="$color">
          {title}
        </Text>
        <Text fontSize="$3" color="$colorSecondary" fontFamily="$body" textAlign="center">
          This report is not included in your current plan. Upgrade to unlock it.
        </Text>
        {showUpgrade ? (
          <Button size="$3" onPress={onUpgrade}>
            View plans
          </Button>
        ) : (
          <Text fontSize="$2" color="$colorSecondary" fontFamily="$body">
            Ask your owner or manager to upgrade.
          </Text>
        )}
      </YStack>
    </Card>
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
  const media = useMedia();
  const router = useRouter();
  const { data: features, evaluation } = useEntitlements();
  const canManageBilling = useHasCapability("finance_billing_manage");
  const baseAnalytics = new Set([
    "analytics.overview",
    "analytics.sales_trends",
    "analytics.channel_split",
  ]);
  const unlocked = (feature: string) => {
    if (!features || features[feature] !== true) return false;
    return baseAnalytics.has(feature) || evaluation.entitled;
  };
  const [period, setPeriod] = useState<AnalyticsPeriod>("today");
  const [customOpen, setCustomOpen] = useState(false);
  const [customFrom, setCustomFrom] = useState(monthStartIso);
  const [customTo, setCustomTo] = useState(todayIso);
  const [appliedRange, setAppliedRange] = useState<AnalyticsRange | undefined>();
  const customInvalid =
    !customFrom || !customTo || customFrom > customTo;
  const range = period === "custom" ? appliedRange : undefined;

  const { data: revenueData, isLoading: revenueLoading } =
    useRevenueSummaryQuery(period, true, range);
  const { data: analyticsData } = useSellerAnalyticsQuery(
    period,
    true,
    range,
  );

  const summary = revenueData?.data;
  const paymentMethods = summary?.by_payment_method ?? [];
  const orderTypes = summary?.by_order_type ?? [];
  const days = summary?.by_day ?? [];
  const channels = analyticsData?.data?.by_channel ?? [];
  const tellers = analyticsData?.data?.by_teller ?? [];
  const hours = analyticsData?.data?.by_hour ?? [];
  const topItems = analyticsData?.data?.top_items ?? [];
  const trendRows = useMemo(() => {
    if (period !== "this_year") {
      return days.map((d) => ({
        key: d.date,
        label: new Date(d.date + "T00:00:00").toLocaleDateString(undefined, {
          weekday: "short",
          month: "short",
          day: "numeric",
        }),
        revenue_minor: d.revenue_minor,
        count: d.count,
      }));
    }

    const months = new Map<string, { revenue_minor: number; count: number }>();
    for (const day of days) {
      const month = (day.date ?? "").slice(0, 7);
      if (!month) continue;
      const row = months.get(month) ?? { revenue_minor: 0, count: 0 };
      row.revenue_minor += day.revenue_minor ?? 0;
      row.count += day.count ?? 0;
      months.set(month, row);
    }
    return [...months.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, row]) => ({
        key: month,
        label: new Date(`${month}-01T00:00:00`).toLocaleDateString(undefined, {
          month: "short",
          year: "numeric",
        }),
        ...row,
      }));
  }, [days, period]);
  const maxDayRevenue = useMemo(
    () => Math.max(...trendRows.map((d) => d.revenue_minor), 1),
    [trendRows],
  );

  const formatPeriodLabel = (p: AnalyticsPeriod) => {
    switch (p) {
      case "today": return "Today";
      case "this_week": return "This Week";
      case "this_month": return "This Month";
      case "this_year": return "This Year";
      case "custom":
        return appliedRange
          ? `${appliedRange.date_from} – ${appliedRange.date_to}`
          : "Custom";
      default: return p;
    }
  };

  const openCustom = () => {
    if (!appliedRange) {
      setCustomFrom(monthStartIso());
      setCustomTo(todayIso());
    }
    setCustomOpen(true);
  };

  const applyCustom = () => {
    if (customInvalid) return;
    setAppliedRange({ date_from: customFrom, date_to: customTo });
    setPeriod("custom");
    setCustomOpen(false);
  };

  return (
    <YStack flex={1} backgroundColor="$background">
      <ScrollView showsVerticalScrollIndicator={false}>
        <YStack padding="$4" paddingBottom={insets.bottom + 24} gap="$4" {...(media.md || media.lg ? { maxWidth: 600, alignSelf: "center", width: "100%" } : {})}>
          {/* Header */}
          <Text fontSize="$6" fontWeight="700" fontFamily="$heading" color="$color">
            Analytics
          </Text>

          {/* Period Tabs */}
          <XStack gap="$2" flexWrap="wrap">
            {PERIODS.map((p) => (
              <PeriodTab
                key={p.key}
                label={p.label}
                active={period === p.key}
                onPress={() => {
                  setPeriod(p.key);
                  setCustomOpen(false);
                }}
              />
            ))}
            <PeriodTab
              label="Custom"
              active={period === "custom"}
              onPress={openCustom}
            />
          </XStack>

          {period === "custom" && appliedRange && (
            <Text fontSize="$2" color="$colorSecondary" fontFamily="$body">
              Showing {formatPeriodLabel("custom")}
            </Text>
          )}

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
              {!unlocked("analytics.payment_methods") ? (
                <LockedReportCard
                  title="Payment methods"
                  showUpgrade={canManageBilling}
                  onUpgrade={() => router.push("/(shared)/wallet/plans")}
                />
              ) : paymentMethods.length > 0 && (
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
              {unlocked("analytics.sales_trends") && trendRows.length > 0 && (
                <Card padding="$4" bordered>
                  <YStack gap="$3">
                    <Text fontSize="$5" fontWeight="700" fontFamily="$heading" color="$color">
                      Revenue by {period === "this_year" ? "Month" : "Day"}
                    </Text>
                    <Separator />
                    <ScrollView
                      nestedScrollEnabled
                      showsVerticalScrollIndicator
                      style={{ maxHeight: 320 }}
                    >
                      <YStack gap="$3" paddingRight="$1">
                        {trendRows.map((d) => (
                          <YStack key={d.key} gap="$1">
                            <XStack justifyContent="space-between" alignItems="center">
                              <Text fontSize="$3" fontFamily="$body" color="$color">
                                {d.label}
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
                    </ScrollView>
                  </YStack>
                </Card>
              )}

              {/* Order Type Breakdown */}
              {!unlocked("analytics.order_types") ? (
                <LockedReportCard
                  title="Order types"
                  showUpgrade={canManageBilling}
                  onUpgrade={() => router.push("/(shared)/wallet/plans")}
                />
              ) : orderTypes.length > 0 && (
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

              {/* Online vs Local */}
              {unlocked("analytics.channel_split") && channels.length > 0 && (
                <Card padding="$4" bordered>
                  <YStack gap="$3">
                    <XStack gap="$2" alignItems="center">
                      <Store size={18} color="$colorSecondary" />
                      <Text fontSize="$5" fontWeight="700" fontFamily="$heading" color="$color">
                        Online vs Local
                      </Text>
                    </XStack>
                    <Text fontSize="$2" color="$colorSecondary" fontFamily="$body">
                      Compare online orders with sales made at your counter.
                    </Text>
                    <Separator />
                    {channels.map((channel) => (
                      <XStack key={channel.channel} gap="$2" alignItems="center">
                        <Text fontSize="$3" fontFamily="$body" color="$color" flex={1}>
                          {channel.channel === "local" ? "Local (counter)" : "Online"}
                        </Text>
                        <Text fontSize="$3" fontWeight="700" fontFamily="$body" color="$color">
                          {formatPriceFromMinor(channel.revenue_minor, summary.currency)}
                        </Text>
                        <Text fontSize="$2" color="$colorSecondary" fontFamily="$body">
                          {channel.count} ({channel.percentage}%)
                        </Text>
                      </XStack>
                    ))}
                  </YStack>
                </Card>
              )}

              {/* Teller performance */}
              {!unlocked("analytics.teller_performance") ? (
                <LockedReportCard
                  title="Teller performance"
                  showUpgrade={canManageBilling}
                  onUpgrade={() => router.push("/(shared)/wallet/plans")}
                />
              ) : tellers.length > 0 ? (
                <Card padding="$4" bordered>
                  <YStack gap="$3">
                    <Text fontSize="$5" fontWeight="700" fontFamily="$heading" color="$color">
                      Teller Performance
                    </Text>
                    <Separator />
                    {tellers.map((teller) => (
                      <XStack key={teller.user_id} justifyContent="space-between" alignItems="center">
                        <Text fontSize="$4" fontFamily="$body" color="$color" flex={1}>
                          {teller.name}
                        </Text>
                        <XStack gap="$2" alignItems="center">
                          <Text fontSize="$4" fontWeight="700" fontFamily="$body" color="$color">
                            {formatPriceFromMinor(teller.revenue_minor, summary.currency)}
                          </Text>
                          <Badge backgroundColor="$backgroundSoft" size="$2">
                            <Text fontSize="$1" color="$colorSecondary" fontWeight="600">
                              {teller.count}
                            </Text>
                          </Badge>
                        </XStack>
                      </XStack>
                    ))}
                  </YStack>
                </Card>
              ) : null}

              {/* Hourly heatmap */}
              {!unlocked("analytics.hourly_heatmap") ? (
                <LockedReportCard
                  title="Hourly heatmap"
                  showUpgrade={canManageBilling}
                  onUpgrade={() => router.push("/(shared)/wallet/plans")}
                />
              ) : hours.length > 0 ? (
                <Card padding="$4" bordered>
                  <YStack gap="$3">
                    <XStack gap="$2" alignItems="center">
                      <Clock size={18} color="$colorSecondary" />
                      <Text fontSize="$5" fontWeight="700" fontFamily="$heading" color="$color">
                        Hourly Heatmap
                      </Text>
                    </XStack>
                    <Separator />
                    {hours.map((hour) => (
                      <XStack key={hour.hour} gap="$2" alignItems="center">
                        <Text fontSize="$2" color="$colorSecondary" fontFamily="$body" width={48}>
                          {String(hour.hour).padStart(2, "0")}:00
                        </Text>
                        <YStack flex={1} height={6} backgroundColor="$backgroundSoft" borderRadius="$full" overflow="hidden">
                          <YStack
                            width={`${Math.max(3, (hour.revenue_minor / Math.max(...hours.map((h) => h.revenue_minor), 1)) * 100)}%`}
                            height="100%"
                            backgroundColor="$primary"
                            borderRadius="$full"
                          />
                        </YStack>
                        <Text fontSize="$2" color="$colorSecondary" fontFamily="$body" width={44} textAlign="right">
                          {hour.count}
                        </Text>
                      </XStack>
                    ))}
                  </YStack>
                </Card>
              ) : null}

              {/* Top Selling Items */}
              {unlocked("analytics.sales_trends") && topItems.length > 0 && (
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

      <Sheet
        modal
        open={customOpen}
        onOpenChange={setCustomOpen}
        snapPointsMode="percent"
        snapPoints={[52]}
        position={0}
        dismissOnSnapToBottom
        dismissOnOverlayPress
        zIndex={100_000}
      >
        <Sheet.Overlay
          animation="lazy"
          enterStyle={{ opacity: 0 }}
          exitStyle={{ opacity: 0 }}
          backgroundColor="rgba(15, 23, 42, 0.28)"
        />
        <Sheet.Frame
          backgroundColor="$background"
          borderTopLeftRadius="$8"
          borderTopRightRadius="$8"
        >
          <Sheet.Handle backgroundColor="$gray5" marginTop="$2" />
          <YStack
            paddingHorizontal="$5"
            paddingTop="$3"
            paddingBottom={Math.max(insets.bottom, 16)}
            gap="$4"
          >
            <XStack alignItems="center" gap="$2">
              <CalendarDays size={20} color="$primary" />
              <Text fontSize="$6" fontWeight="800" fontFamily="$heading">
                Custom range
              </Text>
            </XStack>

            <YStack gap="$3">
              <YStack gap="$1">
                <Text fontSize="$2" color="$colorMuted" fontFamily="$body">
                  From
                </Text>
                <TamaguiDateInput
                  value={
                    customFrom
                      ? new Date(`${customFrom}T00:00:00`)
                      : undefined
                  }
                  onChange={(date) =>
                    setCustomFrom(date.toISOString().split("T")[0])
                  }
                  placeholder="Start date"
                />
              </YStack>
              <YStack gap="$1">
                <Text fontSize="$2" color="$colorMuted" fontFamily="$body">
                  To
                </Text>
                <TamaguiDateInput
                  value={
                    customTo ? new Date(`${customTo}T00:00:00`) : undefined
                  }
                  onChange={(date) =>
                    setCustomTo(date.toISOString().split("T")[0])
                  }
                  placeholder="End date"
                />
              </YStack>
            </YStack>

            {customInvalid && (
              <Text fontSize="$2" color="$red10" fontFamily="$body">
                Choose a valid start and end date.
              </Text>
            )}

            <XStack gap="$2">
              <Button
                flex={1}
                variant="outline"
                onPress={() => setCustomOpen(false)}
              >
                Cancel
              </Button>
              <Button
                flex={1}
                variant="primary"
                disabled={customInvalid}
                onPress={applyCustom}
              >
                Apply range
              </Button>
            </XStack>
          </YStack>
        </Sheet.Frame>
      </Sheet>
    </YStack>
  );
}
