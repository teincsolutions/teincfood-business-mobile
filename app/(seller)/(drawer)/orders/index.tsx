// @ts-nocheck
// @ts-nocheck
import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import {
  YStack,
  Text,
  Card,
  Button,
  XStack,
  Separator,
  ScrollView,
  Tooltip,
} from "tamagui";
import {
  FileText,
  Printer,
  Search,
  ExternalLink,
  Clock,
  Package,
  CalendarDays,
} from "@tamagui/lucide-icons";
import { FlatList, RefreshControl, TextInput, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  useSellerOrdersQuery,
  useCancelOrderMutation,
  SELLER_KEYS,
} from "@/hooks/seller.hooks";
import { useOrderRealtimeUpdates } from "@teincfood/core";
import { useHasCapability } from "@/hooks/useMyBusinessCapabilities";
import { useResponsive } from "@/utils/responsive";
import { useTheme } from "tamagui";
import { useFilterStore } from "@/stores/filter.store";
import { AppAlertDialog } from "@/components/ui/AlertDialog";
import { FilterSheet } from "@/components/filters/FilterSheet";
import { printService } from "@/services/print.service";
import type { SellerOrder } from "@teincfood/core";
import {
  formatPriceFromMinor,
  formatDateTime,
  resolveDateRange,
} from "@teincfood/core";
import { getCustomerDisplay, isCancellable, cancelLabelFor, CANCELLABLE_STATUSES } from "@teincfood/core";

const ORDER_TYPE_FILTERS = [
  { key: "", label: "All types" },
  { key: "takeout", label: "Takeout" },
  { key: "delivery", label: "Delivery" },
  { key: "dine_in", label: "Dine-in" },
];

const PAYMENT_FILTERS = [
  { key: "", label: "All" },
  { key: "paid", label: "Paid" },
  { key: "unpaid", label: "Unpaid" },
];

const FILTER_CHIPS = [
  { key: "pending", label: "Pending", color: "$warning" },
  { key: "awaiting_payment", label: "Awaiting Payment", color: "$primary" },
  { key: "accepted", label: "Accepted", color: "$primary" },
  { key: "preparing", label: "Preparing", color: "$info" },
  { key: "ready", label: "Ready", color: "$success" },
  { key: "waiting_pickup", label: "Waiting Pickup", color: "$info" },
  { key: "on_the_way", label: "In Transit", color: "$info" },
  { key: "arrived", label: "Arrived", color: "$success" },
  { key: "delivered", label: "Delivered", color: "$colorMuted" },
  { key: "cancelled", label: "Cancelled", color: "$error" },
];

const STATUS_BADGE: Record<string, { bg: string; color: string }> = {
  pending: { bg: "$warning", color: "$color" },
  awaiting_payment: { bg: "$primary", color: "white" },
  accepted: { bg: "$primary", color: "white" },
  preparing: { bg: "$info", color: "white" },
  ready: { bg: "$success", color: "white" },
  waiting_pickup: { bg: "$info", color: "white" },
  on_the_way: { bg: "$info", color: "white" },
  arrived: { bg: "$success", color: "white" },
  delivered: { bg: "$colorMuted", color: "white" },
  cancelled: { bg: "$error", color: "white" },
};
const CHIP_COLORS: Record<string, string> = Object.fromEntries(
  Object.entries(STATUS_BADGE).map(([k, v]) => [k, v.bg]),
) as Record<string, string>;

const ORDER_STATUS_OPTIONS = FILTER_CHIPS.map((c) => ({
  key: c.key,
  label: c.label,
  color: CHIP_COLORS[c.key],
}));

const DEFAULT_CHIPS = [
  "pending",
  "awaiting_payment",
  "accepted",
  "preparing",
  "ready",
  "waiting_pickup",
  "on_the_way",
  "arrived",
  "delivered",
];

function actionLabel(status: string) {
  return cancelLabelFor(status);
}

function formatStatus(status: string) {
  return status.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
}

function timeSince(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  return `${hrs}h ${mins % 60}m`;
}

export default function SellerOrders() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useResponsive();
  const theme = useTheme();
  const isTablet = width >= 768;

  const COL_ITEMS = 45;
  const COL_TIME = 70;
  const COL_ACTIONS = 270;
  const FIXED_TOTAL = COL_ITEMS + COL_TIME + COL_ACTIONS;

  const [containerWidth, setContainerWidth] = useState(0);
  const searchQuery = useFilterStore((s) => s.ordersSearchQuery);
  const setSearchQuery = useFilterStore((s) => s.setOrdersSearchQuery);
  const activeChips = useFilterStore((s) => s.ordersActiveChips);
  const setActiveChips = useFilterStore((s) => s.setOrdersActiveChips);
  const datePreset = useFilterStore((s) => s.ordersDatePreset);
  const setDatePreset = useFilterStore((s) => s.setOrdersDatePreset);
  const dateFrom = useFilterStore((s) => s.ordersDateFrom);
  const setDateFrom = useFilterStore((s) => s.setOrdersDateFrom);
  const dateTo = useFilterStore((s) => s.ordersDateTo);
  const setDateTo = useFilterStore((s) => s.setOrdersDateTo);
  const orderType = useFilterStore((s) => s.ordersOrderType);
  const setOrderType = useFilterStore((s) => s.setOrdersOrderType);
  const paymentStatus = useFilterStore((s) => s.ordersPaymentStatus);
  const setPaymentStatus = useFilterStore((s) => s.setOrdersPaymentStatus);
  const filterHydrated = useFilterStore((s) => s.isHydrated);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasInitFilter = useRef(false);
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [cancelTarget, setCancelTarget] = useState<{ id: string; status: string } | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const loadingMore = useRef(false);

  const resetFilters = useCallback(() => {
    setSearchQuery("");
    setDebouncedSearch("");
    setActiveChips([]);
    setDatePreset("all");
    setDateFrom("");
    setDateTo("");
    setOrderType("");
    setPaymentStatus("");
  }, [setSearchQuery, setActiveChips, setDatePreset, setDateFrom, setDateTo, setOrderType, setPaymentStatus]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  const onEndReached = useCallback(() => {
    if (hasNextPage && !loadingMore.current) {
      loadingMore.current = true;
      fetchNextPage().finally(() => {
        loadingMore.current = false;
      });
    }
  }, [hasNextPage, fetchNextPage]);

  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
    }, 400);
    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
    };
  }, [searchQuery]);

  // Restore persisted search once hydration completes. No default status
  // filters: the list starts unfiltered (all orders) on every install.
  useEffect(() => {
    if (!filterHydrated) return;
    if (hasInitFilter.current) return;
    hasInitFilter.current = true;
    if (searchQuery) {
      setDebouncedSearch(searchQuery);
    }
  }, [filterHydrated]);

  const filterParams = useMemo(() => {
    const params: {
      status?: string;
      q?: string;
      order_type?: string;
      is_paid?: string;
      date_from?: string;
      date_to?: string;
    } = {};
    if (activeChips.length > 0 && activeChips.length < DEFAULT_CHIPS.length) {
      params.status = activeChips.join(",");
    }
    if (debouncedSearch) params.q = debouncedSearch;
    if (orderType) params.order_type = orderType;
    if (paymentStatus) params.is_paid = paymentStatus;
    const range = resolveDateRange(datePreset, dateFrom, dateTo);
    if (range.date_from) params.date_from = range.date_from;
    if (range.date_to) params.date_to = range.date_to;
    return params;
  }, [activeChips, debouncedSearch, orderType, paymentStatus, datePreset, dateFrom, dateTo]);

  const filtersActive =
    activeChips.length > 0 ||
    !!orderType ||
    !!paymentStatus ||
    !!debouncedSearch ||
    datePreset !== "all";

  const {
    data,
    refetch,
    fetchNextPage,
    hasNextPage,
  } = useSellerOrdersQuery(true, filterParams);
  const cancelOrder = useCancelOrderMutation();
  const canReject = useHasCapability('orders_reject');

  useOrderRealtimeUpdates(SELLER_KEYS.all);

  const allOrders = data || [];

  const availWidth = containerWidth || width;
  const remaining = Math.max(300, availWidth - FIXED_TOTAL - 48);
  const colWidths = {
    order: Math.max(100, Math.round(remaining * 0.25)),
    customer: Math.max(108, Math.round(remaining * 0.28)),
    status: Math.max(80, Math.round(remaining * 0.18)),
    total: Math.max(100, Math.round(remaining * 0.25)),
    items: COL_ITEMS,
    time: COL_TIME,
    actions: COL_ACTIONS,
  };
  const tableTotal = Object.values(colWidths).reduce((a, b) => a + b, 0) + 48;

  const toggleChip = (key: string) => {
    useFilterStore.setState((state) => ({
      ordersActiveChips: state.ordersActiveChips.includes(key)
        ? state.ordersActiveChips.filter((k) => k !== key)
        : [...state.ordersActiveChips, key],
    }));
  };

  const handlePrint = useCallback(async (order: SellerOrder) => {
    try {
      await printService.printOrderReceipt(order.id);
    } catch {}
  }, []);

  // ── Phone: compact card ──
  const renderPhoneCard = ({ item }: { item: SellerOrder }) => {
    const badge = STATUS_BADGE[item.status] ?? { bg: "$colorMuted", color: "white" };
    return (
    <Card
      padding="$4"
      bordered
      marginBottom="$3"
      pressStyle={{ scale: 0.98, opacity: 0.9 }}
    >
      <YStack gap="$2">
        <XStack justifyContent="space-between" alignItems="center" gap="$2">
          <Text fontSize="$5" fontWeight="bold" flex={1} numberOfLines={1}>
            {item.order_number}
          </Text>
          <YStack
            px="$2.5"
            py="$1"
            borderRadius="$full"
            backgroundColor={badge.bg}
            flexShrink={0}
            maxWidth="55%"
          >
            <Text fontSize="$2" color={badge.color} fontWeight="700" numberOfLines={1} textTransform="uppercase" letterSpacing={0.3}>
              {formatStatus(item.status)}
            </Text>
          </YStack>
        </XStack>
        <XStack justifyContent="space-between">
          <Text fontSize="$4">{getCustomerDisplay(item as unknown as Parameters<typeof getCustomerDisplay>[0]).name}</Text>
          <Text fontSize="$5" fontWeight="bold" color="$primary">
            {formatPriceFromMinor(item.total_minor, item.currency)}
          </Text>
        </XStack>
        <XStack gap="$2" alignItems="center">
          <CalendarDays size={14} color="$colorMuted" />
          <Text fontSize="$3" color="$colorMuted">
            {formatDateTime(item.inserted_at)}
          </Text>
        </XStack>
        <Separator />
        <XStack gap="$3">
          <Button
            flex={1}
            variant="outline"
            height={40}
            icon={<ExternalLink size={14} />}
            onPress={() => router.push(`/(seller)/orders/${item.id}`)}
          >
            View
          </Button>
          <Button
            flex={1}
            variant="outline"
            height={40}
            icon={<Printer size={14} />}
            onPress={() => handlePrint(item)}
          />
          {canReject && isCancellable(item.status) && (
            <Button
              variant="dangerOutline"
              height={40}
              icon={<FileText size={14} />}
              onPress={() => setCancelTarget({ id: item.id, status: item.status })}
            >
              {actionLabel(item.status)}
            </Button>
          )}
        </XStack>
      </YStack>
    </Card>
     );
  };

  // ── Tablet: table row ──
  const renderTabletRow = ({ item }: { item: SellerOrder }) => {
    const badge = STATUS_BADGE[item.status] ?? { bg: "$colorMuted", color: "white" };
    return (
    <XStack
      borderBottomWidth={1}
      borderBottomColor="$borderColor"
      paddingVertical="$4"
      paddingHorizontal="$4"
      alignItems="center"
    >
      <Text
        fontWeight="bold"
        fontSize="$5"
        width={colWidths.order}
        numberOfLines={1}
      >
        {item.order_number}
      </Text>
      {(() => {
        const c = getCustomerDisplay(item as unknown as Parameters<typeof getCustomerDisplay>[0]);
        return (
          <YStack width={colWidths.customer}>
            <Tooltip label={c.name}>
              <Tooltip.Trigger>
                <Text fontSize="$4" numberOfLines={1} ellipsis>
                  {c.name}
                </Text>
              </Tooltip.Trigger>
            </Tooltip>
            <Text fontSize="$3" color="$colorMuted">
              {c.phone || ""}
            </Text>
            {c.isWalkIn && c.tellerName ? (
              <Text fontSize="$2" color="$colorMuted">
                Teller: {c.tellerName}
              </Text>
            ) : null}
          </YStack>
        );
      })()}
      <YStack
        px="$3"
        py="$1.5"
        borderRadius="$full"
        backgroundColor={badge.bg}
        width={colWidths.status}
        alignItems="center"
      >
        <Text fontSize="$3" color={badge.color} fontWeight="700" textAlign="center" numberOfLines={1}>
          {formatStatus(item.status)}
        </Text>
      </YStack>
      <XStack
        width={COL_ITEMS}
        gap="$2"
        alignItems="center"
        justifyContent="center"
      >
        <Package size={18} color="$colorMuted" />
        <Text fontSize="$4">{item.items?.length || 0}</Text>
      </XStack>
      <Text
        fontSize="$5"
        fontWeight="bold"
        color="$primary"
        width={colWidths.total}
        textAlign="center"
      >
        {formatPriceFromMinor(item.total_minor, item.currency)}
      </Text>
      <XStack
        width={COL_TIME}
        gap="$2"
        alignItems="center"
        justifyContent="center"
      >
        <Clock size={16} color="$colorMuted" />
        <Text fontSize="$4" color="$colorMuted">
          {timeSince(item.inserted_at)}
        </Text>
      </XStack>
      <XStack gap="$3" width={COL_ACTIONS} justifyContent="flex-end">
        <Button
          variant="outline"
          height={40}
          paddingHorizontal="$3"
          icon={<ExternalLink size={16} />}
          onPress={() => router.push(`/(seller)/orders/${item.id}`)}
        >
          View
        </Button>
        <Button
          variant="outline"
          height={40}
          paddingHorizontal="$3"
          icon={<Printer size={16} />}
          onPress={() => handlePrint(item)}
        />
        {canReject && isCancellable(item.status) && (
          <Button
            variant="dangerOutline"
            height={40}
            paddingHorizontal="$3"
            icon={<FileText size={16} />}
            onPress={() => setCancelTarget({ id: item.id, status: item.status })}
          >
            {actionLabel(item.status)}
          </Button>
        )}
      </XStack>
    </XStack>
    );
  };

  const tableHeader = (
    <XStack
      borderBottomWidth={2}
      borderBottomColor="$borderColor"
      paddingVertical="$3"
      paddingHorizontal="$4"
      backgroundColor="$backgroundSoft"
    >
      <Text
        fontWeight="bold"
        fontSize="$4"
        color="$colorMuted"
        width={colWidths.order}
      >
        Order #
      </Text>
      <Text
        fontWeight="bold"
        fontSize="$4"
        color="$colorMuted"
        width={colWidths.customer}
      >
        Customer
      </Text>
      <Text
        fontWeight="bold"
        fontSize="$4"
        color="$colorMuted"
        width={colWidths.status}
        textAlign="center"
      >
        Status
      </Text>
      <Text
        fontWeight="bold"
        fontSize="$4"
        color="$colorMuted"
        width={COL_ITEMS}
        textAlign="center"
      >
        Items
      </Text>
      <Text
        fontWeight="bold"
        fontSize="$4"
        color="$colorMuted"
        width={colWidths.total}
        textAlign="center"
      >
        Total
      </Text>
      <Text
        fontWeight="bold"
        fontSize="$4"
        color="$colorMuted"
        width={COL_TIME}
        textAlign="center"
      >
        Time
      </Text>
      <Text
        fontWeight="bold"
        fontSize="$4"
        color="$colorMuted"
        width={COL_ACTIONS}
        textAlign="right"
      >
        Actions
      </Text>
    </XStack>
  );

  return (
    <YStack
      flex={1}
      backgroundColor="$background"
      onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
    >
      {/* Search + Filters */}
      <YStack padding="$4" gap="$3" paddingBottom="$2">
        <XStack gap="$2" alignItems="center">
          <XStack
            flex={1}
            alignItems="center"
            backgroundColor="$backgroundSoft"
            borderRadius="$3"
            paddingHorizontal="$3"
            borderWidth={1}
            borderColor="$borderColor"
            height={40}
          >
            <Search size={16} color="$colorMuted" />
            <TextInput
              style={{ flex: 1, paddingLeft: 8, fontSize: 14, color: "#000" }}
              onChangeText={setSearchQuery}
              value={searchQuery}
              placeholder="Search order or customer..."
              placeholderTextColor="#999"
            />
          </XStack>
          <Button
            height={40}
            paddingHorizontal="$3"
            borderWidth={1}
            borderColor={filtersActive ? "$primary" : "$borderColor"}
            borderRadius="$3"
            backgroundColor={filtersActive ? "$primary" : "$background"}
            onPress={() => setFilterSheetOpen(true)}
          >
            <Text
              fontFamily="$body"
              fontWeight="600"
              fontSize="$3"
              color={filtersActive ? "white" : "$color"}
            >
              Filters{filtersActive ? " •" : ""}
            </Text>
          </Button>
        </XStack>
      </YStack>

      {/* Order list */}
      {isTablet ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={true}
          style={{ flex: 1 }}
          contentContainerStyle={{ flexGrow: 1 }}
          nestedScrollEnabled
          keyboardShouldPersistTaps="handled"
        >
          <YStack width={tableTotal} flex={1}>
            {tableHeader}
            {allOrders.length === 0 ? (
              <YStack padding="$8" alignItems="center">
                <Text color="$colorMuted" fontSize="$4" textAlign="center">
                  {debouncedSearch
                    ? "No orders match your search"
                    : "No orders for the selected filters"}
                </Text>
              </YStack>
            ) : (
              <FlatList
                data={allOrders}
                keyExtractor={(item) => item.id}
                renderItem={renderTabletRow}
                onEndReached={onEndReached}
                onEndReachedThreshold={0.5}
                refreshControl={
                  <RefreshControl
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                  />
                }
                contentContainerStyle={{
                  paddingBottom: Math.max(insets.bottom + 20, 24),
                }}
                ListFooterComponent={
                  hasNextPage ? (
                    <YStack padding="$4" alignItems="center">
                      <ActivityIndicator />
                    </YStack>
                  ) : null
                }
                initialNumToRender={20}
                windowSize={10}
                maxToRenderPerBatch={15}
                removeClippedSubviews={false}
                nestedScrollEnabled
                keyboardShouldPersistTaps="handled"
              />
            )}
          </YStack>
        </ScrollView>
      ) : (
        <FlatList
          data={allOrders}
          keyExtractor={(item) => item.id}
          renderItem={renderPhoneCard}
          onEndReached={onEndReached}
          onEndReachedThreshold={0.5}
          contentContainerStyle={{
            padding: 16,
            paddingTop: 0,
            paddingBottom: Math.max(insets.bottom + 20, 24),
          }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListFooterComponent={
            hasNextPage ? (
              <YStack padding="$4" alignItems="center">
                <ActivityIndicator />
              </YStack>
            ) : null
          }
          ListEmptyComponent={
            <YStack padding="$8" alignItems="center" gap="$3">
              <Text color="$colorMuted" fontSize="$5" textAlign="center">
                {debouncedSearch
                  ? "No orders match your search"
                  : "No orders for the selected filters"}
              </Text>
              {(debouncedSearch || activeChips.length > 0) && (
                <Button
                  variant="outline"
                  marginTop="$3"
                  onPress={() => {
                    resetFilters();
                  }}
                >
                  Reset Filters
                </Button>
              )}
            </YStack>
          }
          initialNumToRender={10}
          windowSize={5}
          maxToRenderPerBatch={10}
          removeClippedSubviews
        />
      )}

      {/* Filter Sheet */}
      <FilterSheet
        open={filterSheetOpen}
        onOpenChange={setFilterSheetOpen}
        title="Filter Orders"
        statusOptions={ORDER_STATUS_OPTIONS}
        activeStatus={activeChips}
        onToggleStatus={toggleChip}
        datePreset={datePreset}
        onDatePresetChange={setDatePreset}
        dateFrom={dateFrom}
        dateTo={dateTo}
        onDateFromChange={setDateFrom}
        onDateToChange={setDateTo}
        orderType={orderType}
        orderTypeOptions={ORDER_TYPE_FILTERS}
        onOrderTypeChange={setOrderType}
        paymentStatus={paymentStatus}
        paymentOptions={PAYMENT_FILTERS}
        onPaymentStatusChange={setPaymentStatus}
        onClear={resetFilters}
      />

      {/* Cancel Confirmation */}
      <AppAlertDialog
        open={cancelTarget !== null}
        onOpenChange={() => setCancelTarget(null)}
        title={`${actionLabel(cancelTarget?.status ?? "pending")} Order`}
        description={`Are you sure you want to ${(actionLabel(cancelTarget?.status ?? "pending")).toLowerCase()} this order? This cannot be undone.`}
        confirmText={`${actionLabel(cancelTarget?.status ?? "pending")} Order`}
        isDestructive
        onConfirm={() => {
          if (cancelTarget) {
            cancelOrder.mutate(cancelTarget.id);
            setCancelTarget(null);
          }
        }}
      />
    </YStack>
  );
}
