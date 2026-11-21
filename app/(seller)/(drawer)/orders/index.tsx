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
  Spinner,
} from "tamagui";
import {
  Banknote,
  Eye,
  FileText,
  Printer,
  Search,
  ExternalLink,
  Package,
  CalendarDays,
  Smartphone,
  Truck,
  User,
  XCircle,
} from "@tamagui/lucide-icons";
import {
  FlatList,
  RefreshControl,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect, useRouter } from "expo-router";
import {
  useSellerOrdersQuery,
  useCancelOrderMutation,
  useConfirmCashPaymentMutation,
} from "@/hooks/seller.hooks";
import { useHasCapability } from "@/hooks/useMyBusinessCapabilities";
import { useResponsive } from "@/utils/responsive";
import { useFilterStore } from "@/stores/filter.store";
import { AppAlertDialog } from "@/components/ui/AlertDialog";
import { FilterSheet } from "@/components/filters/FilterSheet";
import { MakeDeliverySheet } from "@/components/orders/MakeDeliverySheet";
import { CashPaymentSheet } from "@/components/pos";
import { printService } from "@/services/print.service";
import { toast } from "sonner-native";
import { CachedAvatarImage } from "@/components/ui/CachedAvatarImage";
import type { SellerOrder } from "@teincfood/core";
import {
  formatPriceFromMinor,
  formatDate,
  formatDateTime,
  resolveDateRange,
  isDeliveryOrder,
  isUnpaid,
} from "@teincfood/core";
import {
  getCustomerDisplay,
  isCancellable,
  cancelLabelFor,
} from "@teincfood/core";

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

// The orders table has a narrower status column than the POS table, so keep
// long backend statuses readable inside the pill.
function compactStatus(status: string) {
  if (status === "awaiting_payment") return "Awaiting Pay";
  if (status === "waiting_pickup") return "Waiting";
  if (status === "on_the_way") return "In Transit";
  return formatStatus(status);
}

// Match the POS "Today's Orders" table badge palette exactly.
function statusBg(status: string) {
  if (["pending", "awaiting_payment"].includes(status)) return "#f59e0b";
  if (status === "accepted") return "#3b82f6";
  if (status === "preparing") return "#8b5cf6";
  if (status === "ready") return "#10b981";
  if (status === "delivered") return "#22c55e";
  if (status === "cancelled") return "#ef4444";
  return "#9ca3af";
}

export default function SellerOrders() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isTablet, isLandscape, width } = useResponsive();
  const useOrdersTable = isTablet && isLandscape;

  // Use the POS "Today's Orders" table language (compact rows, muted header,
  // status pills, right-aligned total) across the full drawer content area.
  // The table is never narrower than the landscape tablet width minus the
  // 300dp drawer, and any extra width goes to Customer and Type/Pay so long
  // names, tellers and payment labels stay readable without clipping.
  const COL_ORDER = 86;
  const COL_CUSTOMER_MIN = 180;
  const COL_TYPE_PAYMENT_MIN = 100;
  const COL_STATUS = 72;
  const COL_TIME = 72;
  const COL_TOTAL = 92;
  const COL_ACTIONS = 176;
  const COL_GAP = 4;
  const COL_PADDING = 24;
  const tableMinTotal =
    COL_ORDER +
    COL_CUSTOMER_MIN +
    COL_TYPE_PAYMENT_MIN +
    COL_STATUS +
    COL_TIME +
    COL_TOTAL +
    COL_ACTIONS +
    COL_GAP * 6 +
    COL_PADDING;
  const availableTableWidth = Math.max(0, width - (isTablet ? 300 : 0));
  const tableWidth = Math.max(tableMinTotal, availableTableWidth);
  const extraTableWidth = tableWidth - tableMinTotal;
  const COL_CUSTOMER =
    COL_CUSTOMER_MIN + Math.floor(extraTableWidth * 0.55);
  const COL_TYPE_PAYMENT =
    COL_TYPE_PAYMENT_MIN + extraTableWidth - Math.floor(extraTableWidth * 0.55);

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
  const [cancelTarget, setCancelTarget] = useState<{
    id: string;
    status: string;
  } | null>(null);
  const [makeDeliveryTarget, setMakeDeliveryTarget] =
    useState<SellerOrder | null>(null);
  const [cashTarget, setCashTarget] = useState<SellerOrder | null>(null);
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
  }, [
    setSearchQuery,
    setActiveChips,
    setDatePreset,
    setDateFrom,
    setDateTo,
    setOrderType,
    setPaymentStatus,
  ]);

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
  }, [
    activeChips,
    debouncedSearch,
    orderType,
    paymentStatus,
    datePreset,
    dateFrom,
    dateTo,
  ]);

  const filtersActive =
    activeChips.length > 0 ||
    !!orderType ||
    !!paymentStatus ||
    !!debouncedSearch ||
    datePreset !== "all";

  const { data, refetch, fetchNextPage, hasNextPage } = useSellerOrdersQuery(
    true,
    filterParams,
  );
  const cancelOrder = useCancelOrderMutation();
  const confirmCashPayment = useConfirmCashPaymentMutation();
  const canReject = useHasCapability("orders_reject");

  // These callbacks must live after the query hook: referencing refetch /
  // hasNextPage in a dependency array before their `const` declarations throws
  // a temporal-dead-zone error on the first render.
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

  // New orders can arrive while this tab is mounted. A focus refetch makes the
  // first visit reliable even if the realtime/invalidation event was missed.
  useFocusEffect(
    useCallback(() => {
      void refetch();
    }, [refetch]),
  );

  const allOrders = data || [];

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
    const badge = STATUS_BADGE[item.status] ?? {
      bg: "$colorMuted",
      color: "white",
    };
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
              <Text
                fontSize="$2"
                color={badge.color}
                fontWeight="700"
                numberOfLines={1}
                textTransform="uppercase"
                letterSpacing={0.3}
              >
                {formatStatus(item.status)}
              </Text>
            </YStack>
          </XStack>
          <XStack justifyContent="space-between">
            <Text fontSize="$4">
              {
                getCustomerDisplay(
                  item as unknown as Parameters<typeof getCustomerDisplay>[0],
                ).name
              }
            </Text>
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
              variant="outline"
              width={40}
              height={40}
              padding={0}
              accessibilityLabel={`Print receipt for ${item.order_number}`}
              icon={<Printer size={14} />}
              onPress={() => handlePrint(item)}
            />
            {!isDeliveryOrder(
              item as unknown as Parameters<typeof isDeliveryOrder>[0],
            ) &&
              [
                "pending",
                "accepted",
                "preparing",
                "ready",
                "waiting_pickup",
              ].includes(item.status) && (
                <Button
                  flex={1}
                  variant="outline"
                  height={40}
                  onPress={() => setMakeDeliveryTarget(item)}
                >
                  Make Delivery
                </Button>
              )}
            {canReject && isCancellable(item.status) && (
              <Button
                variant="dangerOutline"
                height={40}
                icon={<FileText size={14} />}
                onPress={() =>
                  setCancelTarget({ id: item.id, status: item.status })
                }
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
    const c = getCustomerDisplay(
      item as unknown as Parameters<typeof getCustomerDisplay>[0],
    );
    const canMakeDelivery =
      !isDeliveryOrder(
        item as unknown as Parameters<typeof isDeliveryOrder>[0],
      ) &&
      ["pending", "accepted", "preparing", "ready", "waiting_pickup"].includes(
        item.status,
      );
    const paidButAwaiting =
      item.status === "awaiting_payment" && !isUnpaid(item);
    const showPaymentActions =
      item.status === "awaiting_payment" && isUnpaid(item);

    return (
      <XStack
        borderBottomWidth={1}
        borderBottomColor="$borderColor"
        paddingVertical="$2"
        paddingHorizontal="$3"
        alignItems="center"
        gap={COL_GAP}
      >
        <YStack width={COL_ORDER} minWidth={COL_ORDER} flexShrink={0}>
          <Text fontWeight="400" fontSize={10} numberOfLines={1}>
            {item.order_number}
          </Text>
          {item.callout_number != null ? (
            <Text fontSize={8} color="$colorMuted">
              #{item.callout_number}
            </Text>
          ) : null}
        </YStack>

        <XStack
          width={COL_CUSTOMER}
          minWidth={COL_CUSTOMER}
          flexShrink={0}
          gap="$2"
          alignItems="center"
        >
          {c.avatarUrl ? (
            <CachedAvatarImage src={c.avatarUrl} size={36} borderRadius={18} />
          ) : (
            <YStack
              width={36}
              height={36}
              borderRadius={18}
              backgroundColor={c.isWalkIn ? "$orange5" : "$backgroundStrong"}
              alignItems="center"
              justifyContent="center"
            >
              <User
                size={16}
                color={c.isWalkIn ? "$orange10" : "$colorMuted"}
              />
            </YStack>
          )}
          <YStack flex={1} minWidth={0} gap={0}>
            <Text
              fontSize={11}
              fontWeight="500"
              numberOfLines={1}
              minWidth={120}
            >
              {c.name || "—"}
            </Text>
            {c.isWalkIn && c.tellerName ? (
              <Text fontSize={9} color="$colorMuted" numberOfLines={1}>
                Teller: {c.tellerName}
              </Text>
            ) : item.delivery_id ? (
              <Text fontSize={9} color="$colorMuted" numberOfLines={1}>
                {item.rider?.name
                  ? `Rider: ${item.rider.name}`
                  : "Awaiting rider"}
              </Text>
            ) : null}
          </YStack>
        </XStack>

        <YStack
          width={COL_TYPE_PAYMENT}
          minWidth={COL_TYPE_PAYMENT}
          flexShrink={0}
          gap={0}
        >
          <Text fontSize={11} numberOfLines={1}>
            {formatStatus(item.order_type ?? "pos")}
          </Text>
          <Text fontSize={9} color="$colorMuted" numberOfLines={1}>
            {formatStatus(
              item.pos_payment_method ?? item.payment_mode ?? "cash",
            )}
          </Text>
          {isUnpaid(item) ? (
            <Text fontSize={8} fontWeight="700" color="$warning">
              UNPAID
            </Text>
          ) : null}
        </YStack>

        <YStack width={COL_STATUS} alignItems="center">
          <YStack
            backgroundColor={
              paidButAwaiting ? "#10b981" : statusBg(item.status)
            }
            paddingHorizontal={4}
            paddingVertical={1}
            borderRadius={3}
          >
            <Text
              fontSize={8}
              color="white"
              fontWeight="700"
              textTransform="uppercase"
              numberOfLines={1}
            >
              {paidButAwaiting ? "PAID" : compactStatus(item.status)}
            </Text>
          </YStack>
        </YStack>

        <Text
          fontSize={9}
          color="$colorMuted"
          width={COL_TIME}
          minWidth={COL_TIME}
          flexShrink={0}
          numberOfLines={1}
        >
          {formatDate(item.inserted_at)}
        </Text>

        <Text
          fontSize={11}
          fontWeight="700"
          color="$primary"
          width={COL_TOTAL}
          minWidth={COL_TOTAL}
          flexShrink={0}
          textAlign="right"
          numberOfLines={1}
        >
          {formatPriceFromMinor(item.total_minor, item.currency)}
        </Text>

        <XStack
          width={COL_ACTIONS}
          justifyContent="flex-end"
          gap="$1"
          alignItems="center"
        >
          <Button
            size="$2"
            variant="outline"
            height={32}
            width={32}
            padding={0}
            accessibilityLabel={`View order ${item.order_number}`}
            icon={<Eye size={14} />}
            onPress={() => router.push(`/(seller)/orders/${item.id}`)}
          />
          <Button
            size="$2"
            variant="outline"
            height={32}
            width={32}
            padding={0}
            accessibilityLabel={`Print receipt for ${item.order_number}`}
            icon={<Printer size={14} />}
            onPress={() => handlePrint(item)}
          />
          {canMakeDelivery ? (
            <Button
              size="$2"
              variant="outline"
              height={32}
              width={32}
              padding={0}
              accessibilityLabel={`Make delivery for ${item.order_number}`}
              icon={<Truck size={14} />}
              onPress={() => setMakeDeliveryTarget(item)}
            />
          ) : null}
          {showPaymentActions ? (
            <>
              <Button
                size="$2"
                variant="outline"
                height={32}
                width={32}
                padding={0}
                accessibilityLabel={`Pay ${item.order_number} with mobile money`}
                icon={<Smartphone size={14} />}
                onPress={() =>
                  router.push({
                    pathname: "/(seller)/orders/[id]",
                    params: { id: item.id, pay: "momo" },
                  })
                }
              />
              <Button
                size="$2"
                variant="outline"
                height={32}
                width={32}
                padding={0}
                accessibilityLabel={`Mark ${item.order_number} paid with cash`}
                icon={<Banknote size={14} />}
                onPress={() => setCashTarget(item)}
              />
            </>
          ) : null}
          {canReject && isCancellable(item.status) ? (
            <Button
              size="$2"
              variant="outline"
              height={32}
              width={32}
              padding={0}
              accessibilityLabel={`${actionLabel(item.status)} order ${item.order_number}`}
              icon={<XCircle size={14} />}
              chromeless
              onPress={() =>
                setCancelTarget({ id: item.id, status: item.status })
              }
            />
          ) : null}
        </XStack>
      </XStack>
    );
  };

  const tableHeader = (
    <XStack
      borderBottomWidth={2}
      borderBottomColor="$borderColor"
      paddingVertical="$2"
      paddingHorizontal="$3"
      backgroundColor="$backgroundSoft"
      gap={COL_GAP}
    >
      <Text
        fontWeight="bold"
        fontSize="$2"
        color="$colorMuted"
        width={COL_ORDER}
      >
        Order
      </Text>
      <Text
        fontWeight="bold"
        fontSize="$2"
        color="$colorMuted"
        width={COL_CUSTOMER}
      >
        Customer
      </Text>
      <Text
        fontWeight="bold"
        fontSize="$2"
        color="$colorMuted"
        width={COL_TYPE_PAYMENT}
      >
        Type / Pay
      </Text>
      <Text
        fontWeight="bold"
        fontSize="$2"
        color="$colorMuted"
        width={COL_STATUS}
      >
        Status
      </Text>
      <Text
        fontWeight="bold"
        fontSize="$2"
        color="$colorMuted"
        width={COL_TIME}
      >
        Placed
      </Text>
      <Text
        fontWeight="bold"
        fontSize="$2"
        color="$colorMuted"
        width={COL_TOTAL}
        textAlign="right"
      >
        Total
      </Text>
      <Text
        fontWeight="bold"
        fontSize="$2"
        color="$colorMuted"
        width={COL_ACTIONS}
        textAlign="right"
      >
        Actions
      </Text>
    </XStack>
  );

  const searchAndFilters = (
    <YStack padding="$3" gap="$2" paddingBottom="$2">
      <XStack gap="$2" alignItems="center">
        <XStack
          flex={1}
          alignItems="center"
          backgroundColor="$backgroundSoft"
          borderRadius="$3"
          paddingHorizontal="$3"
          borderWidth={1}
          borderColor="$borderColor"
        >
          <Search size={14} color="$colorMuted" />
          <TextInput
            style={{ flex: 1, paddingLeft: 8, fontSize: 13, color: "#000" }}
            onChangeText={setSearchQuery}
            value={searchQuery}
            placeholder="Search order or customer..."
            placeholderTextColor="#999"
          />
        </XStack>
        <Button
          height={36}
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
            fontSize="$2"
            color={filtersActive ? "white" : "$color"}
          >
            Filters{filtersActive ? " •" : ""}
          </Text>
        </Button>
      </XStack>
    </YStack>
  );

  const listBody = useOrdersTable ? (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={true}
      style={{ flex: 1 }}
      contentContainerStyle={{ flexGrow: 1 }}
      nestedScrollEnabled
      keyboardShouldPersistTaps="handled"
    >
      <YStack width={tableWidth} minWidth={tableWidth} flex={1}>
        {tableHeader}
        {allOrders.length === 0 ? (
          <YStack padding="$8" alignItems="center" gap="$3">
            <Package size={80} color="$gray200" />
            <Text
              fontSize="$5"
              fontWeight="600"
              color="$colorSecondary"
              textAlign="center"
            >
              {debouncedSearch
                ? "No orders match your search"
                : "No orders for the selected filters"}
            </Text>
            <Button
              variant="outline"
              height={44}
              onPress={filtersActive ? resetFilters : refetch}
            >
              {filtersActive ? "Reset Filters" : "Refresh"}
            </Button>
          </YStack>
        ) : (
          <FlatList
            data={allOrders}
            keyExtractor={(item) => item.id}
            renderItem={renderTabletRow}
            onEndReached={onEndReached}
            onEndReachedThreshold={0.5}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            contentContainerStyle={{
              paddingBottom: Math.max(insets.bottom + 20, 24),
            }}
            ListFooterComponent={
              hasNextPage ? (
                <YStack padding="$4" alignItems="center">
                  <Spinner size="small" color="$primary" />
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
  );

  return (
    <YStack flex={1} backgroundColor="$background">
      {searchAndFilters}
      {listBody}

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
        description={`Are you sure you want to ${actionLabel(cancelTarget?.status ?? "pending").toLowerCase()} this order? This cannot be undone.`}
        confirmText={`${actionLabel(cancelTarget?.status ?? "pending")} Order`}
        isDestructive
        onConfirm={() => {
          if (cancelTarget) {
            cancelOrder.mutate(cancelTarget.id);
            setCancelTarget(null);
          }
        }}
      />

      <CashPaymentSheet
        open={cashTarget !== null}
        onOpenChange={(open) => {
          if (!open) setCashTarget(null);
        }}
        totalMinor={cashTarget?.total_minor ?? 0}
        currency={
          (cashTarget as any)?.currency ??
          (cashTarget as any)?.currency_code ??
          "GHS"
        }
        isProcessing={confirmCashPayment.isPending}
        onConfirm={() => {
          if (!cashTarget) return;
          const order = cashTarget;
          confirmCashPayment.mutate(order.id, {
            onSuccess: () => {
              toast.success(`Cash recorded for ${order.order_number}`);
              setCashTarget(null);
              void refetch();
            },
            onError: (error: unknown) => {
              toast.error(
                error instanceof Error
                  ? error.message
                  : "Could not record cash",
              );
            },
          });
        }}
      />

      <MakeDeliverySheet
        open={makeDeliveryTarget !== null}
        onOpenChange={(open) => {
          if (!open) setMakeDeliveryTarget(null);
        }}
        order={makeDeliveryTarget}
        onDone={() => {
          void refetch();
          setMakeDeliveryTarget(null);
        }}
      />
    </YStack>
  );
}
