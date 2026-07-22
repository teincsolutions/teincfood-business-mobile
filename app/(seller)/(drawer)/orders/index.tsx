// @ts-nocheck
import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import {
  YStack,
  Text,
  Card,
  Button,
  XStack,
  Separator,
  Spinner,
  Sheet,
  ScrollView,
  Tooltip,
} from "tamagui";
import {
  FileText,
  Printer,
  X,
  Search,
  ExternalLink,
  Clock,
  Package,
} from "@tamagui/lucide-icons";
import { FlatList, Pressable, RefreshControl, TextInput, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
  useSellerOrdersQuery,
  useCancelOrderMutation,
  SELLER_KEYS,
} from "@/hooks/seller.hooks";
import { useOrderRealtimeUpdates } from "@/hooks/useOrderRealtimeUpdates";
import { useResponsive } from "@/utils/responsive";
import { useTheme } from "tamagui";
import { AppAlertDialog } from "@/components/ui/AlertDialog";
import { printService } from "@/services/print.service";
import type { SellerOrder } from "@/types/api";
import { formatPriceFromMinor } from "@/utils/currency";

const FILTER_CHIPS = [
  { key: "pending", label: "Pending", color: "$yellow9" },
  { key: "awaiting_payment", label: "Awaiting Payment", color: "$orange9" },
  { key: "accepted", label: "Accepted", color: "$orange9" },
  { key: "preparing", label: "Preparing", color: "$blue9" },
  { key: "ready", label: "Ready", color: "$green9" },
  { key: "waiting_pickup", label: "Waiting Pickup", color: "$blue9" },
  { key: "on_the_way", label: "In Transit", color: "$blue9" },
  { key: "arrived", label: "Arrived", color: "$green9" },
  { key: "delivered", label: "Delivered", color: "$gray9" },
  { key: "cancelled", label: "Cancelled", color: "$red9" },
];

const CHIP_COLORS = {
  pending: "$yellow9",
  awaiting_payment: "$orange9",
  accepted: "$orange9",
  preparing: "$blue9",
  ready: "$green9",
  waiting_pickup: "$blue9",
  on_the_way: "$blue9",
  arrived: "$green9",
  delivered: "$gray9",
  cancelled: "$red9",
};

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
const CANCELLABLE_STATUSES = [
  "pending",
  "awaiting_payment",
  "accepted",
  "preparing",
];

function actionLabel(status: string) {
  return status === "pending" ? "Reject" : "Cancel";
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
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [activeChips, setActiveChips] = useState<string[]>(
    isTablet
      ? [...DEFAULT_CHIPS]
      : ["pending", "awaiting_payment", "accepted", "preparing", "ready"],
  );
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [cancelTarget, setCancelTarget] = useState<{ id: string; status: string } | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const loadingMore = useRef(false);

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

  const filterParams = useMemo(() => {
    const params: { status?: string; q?: string } = {};
    const chips = activeChips;
    if (chips.length > 0 && chips.length < DEFAULT_CHIPS.length) {
      params.status = chips.join(",");
    }
    if (debouncedSearch) params.q = debouncedSearch;
    return params;
  }, [activeChips, debouncedSearch]);

  const {
    data,
    refetch,
    fetchNextPage,
    hasNextPage,
  } = useSellerOrdersQuery(true, filterParams);
  const cancelOrder = useCancelOrderMutation();

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
    setActiveChips((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    );
  };

  const handlePrint = useCallback(async (order: SellerOrder) => {
    try {
      await printService.printOrderReceipt(order.id);
    } catch {}
  }, []);

  // ── Phone: compact card ──
  const renderPhoneCard = ({ item }: { item: SellerOrder }) => (
    <Card
      padding="$4"
      bordered
      marginBottom="$3"
      pressStyle={{ scale: 0.98, opacity: 0.9 }}
    >
      <YStack gap="$2">
        <XStack justifyContent="space-between" alignItems="center">
          <Text fontSize="$5" fontWeight="bold">
            {item.order_number}
          </Text>
          <YStack
            px="$2"
            py="$1"
            borderRadius="$3"
            backgroundColor={CHIP_COLORS[item.status] || "$gray9"}
          >
            <Text fontSize="$2" color="white" fontWeight="600">
              {formatStatus(item.status)}
            </Text>
          </YStack>
        </XStack>
        <XStack justifyContent="space-between">
          <Text fontSize="$4">{item.customer_name || item.user?.full_name || "Customer"}</Text>
          <Text fontSize="$5" fontWeight="bold" color="$primary">
            {formatPriceFromMinor(item.total_minor, item.currency)}
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
          {CANCELLABLE_STATUSES.includes(item.status) && (
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

  // ── Tablet: table row ──
  const renderTabletRow = ({ item }: { item: SellerOrder }) => (
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
      <YStack width={colWidths.customer}>
        <Tooltip label={item.customer_name || item.user?.full_name || "—"}>
          <Tooltip.Trigger>
            <Text fontSize="$4" numberOfLines={1} ellipsis>
              {item.customer_name || item.user?.full_name || "—"}
            </Text>
          </Tooltip.Trigger>
        </Tooltip>
        <Text fontSize="$3" color="$colorMuted">
          {item.customer_phone || item.user?.phone || ""}
        </Text>
      </YStack>
      <YStack
        px="$3"
        py="$2"
        borderRadius="$3"
        backgroundColor={CHIP_COLORS[item.status] || "$gray9"}
        width={colWidths.status}
        alignItems="center"
      >
        <Text fontSize="$3" color="$color" fontWeight="600" textAlign="center">
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
        {CANCELLABLE_STATUSES.includes(item.status) && (
          <Button
            variant="dangerOutline"
            height={40}
            paddingHorizontal="$3"
            icon={<FileText size={16} />}
            onPress={() => setCancelTarget(item.id)}
          >
            {actionLabel(item.status)}
          </Button>
        )}
      </XStack>
    </XStack>
  );

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
      {/* Search + Filter chips */}
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
            borderColor={activeChips.length > 0 ? "$primary" : "$borderColor"}
            borderRadius="$3"
            backgroundColor={
              activeChips.length > 0 ? "$primary" : "$background"
            }
            onPress={() => setFilterSheetOpen(true)}
          >
            <Text
              fontFamily="$body"
              fontWeight="600"
              fontSize="$3"
              color={activeChips.length > 0 ? "$color" : "$color"}
            >
              Filters
            </Text>
          </Button>
        </XStack>

        {/* Filter chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <XStack gap="$2" paddingVertical="$1">
            {FILTER_CHIPS.map((chip) => {
              const active = activeChips.includes(chip.key);
              return (
                <Pressable key={chip.key} onPress={() => toggleChip(chip.key)}>
                  <YStack
                    px="$3"
                    py="$2"
                    borderRadius="$4"
                    borderWidth={1}
                    borderColor={active ? chip.color : "$borderColor"}
                    backgroundColor={active ? chip.color : "$background"}
                  >
                    <Text
                      fontSize="$3"
                      fontWeight="600"
                      color={active ? "$color" : "$color"}
                    >
                      {chip.label}
                    </Text>
                  </YStack>
                </Pressable>
              );
            })}
          </XStack>
        </ScrollView>
      </YStack>

      {/* Order list */}
      {isTablet ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={true}
          style={{ flex: 1 }}
        >
          <YStack width={tableTotal}>
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
                removeClippedSubviews
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
                    setSearchQuery("");
                    setDebouncedSearch("");
                    setActiveChips(
                      isTablet
                        ? [...DEFAULT_CHIPS]
                        : ["pending", "awaiting_payment", "accepted", "preparing", "ready"],
                    );
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
      <Sheet
        modal
        open={filterSheetOpen}
        onOpenChange={setFilterSheetOpen}
        snapPoints={[60]}
        dismissOnSnapToBottom
        zIndex={200_000}
      >
        <Sheet.Overlay
          animation="lazy"
          enterStyle={{ opacity: 0 }}
          exitStyle={{ opacity: 0 }}
          backgroundColor="rgba(0,0,0,0.5)"
        />
        <Sheet.Frame
          backgroundColor="$background"
          borderTopLeftRadius="$6"
          borderTopRightRadius="$6"
          padding="$4"
          paddingBottom={insets.bottom + 16}
        >
          <Sheet.Handle backgroundColor="$gray5" marginTop="$2" />
          <YStack gap="$4">
            <XStack justifyContent="space-between" alignItems="center">
              <Text fontSize="$5" fontWeight="bold">
                Filter Orders
              </Text>
              <Pressable onPress={() => setFilterSheetOpen(false)}>
                <X size={24} color="$color" />
              </Pressable>
            </XStack>
            <YStack gap="$3">
              <Text fontSize="$4" fontWeight="600" color="$colorMuted">
                Order Status
              </Text>
              {FILTER_CHIPS.map((chip) => {
                const active = activeChips.includes(chip.key);
                return (
                  <Pressable
                    key={chip.key}
                    onPress={() => toggleChip(chip.key)}
                  >
                    <XStack
                      p="$3"
                      borderWidth={1}
                      borderColor={active ? chip.color : "$borderColor"}
                      borderRadius="$3"
                      alignItems="center"
                      justifyContent="space-between"
                      backgroundColor={active ? chip.color : "$background"}
                    >
                      <Text fontWeight="500" color={"$color"}>
                        {chip.label}
                      </Text>
                    </XStack>
                  </Pressable>
                );
              })}
            </YStack>
            <XStack gap="$3" marginTop="$2">
              <Button
                flex={1}
                variant="outline"
                onPress={() => setActiveChips([])}
              >
                Clear All
              </Button>
              <Button flex={1} onPress={() => setFilterSheetOpen(false)}>
                Apply
              </Button>
            </XStack>
          </YStack>
        </Sheet.Frame>
      </Sheet>

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
