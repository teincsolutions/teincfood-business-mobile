// @ts-nocheck
import { useState, useMemo, useCallback } from "react";
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
import {
  FlatList,
  Pressable,
  RefreshControl,
  TextInput,
} from "react-native";
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
  { key: "accepted", label: "In Progress", color: "$blue9", statuses: ["accepted", "preparing"] },
  { key: "ready", label: "Ready", color: "$green9" },
  { key: "on_the_way", label: "In Transit", color: "$blue9" },
  { key: "delivered", label: "Delivered", color: "$gray9" },
  { key: "cancelled", label: "Cancelled", color: "$red9" },
];

const CHIP_COLORS = {
  pending: "$yellow9",
  accepted: "$orange9",
  preparing: "$blue9",
  ready: "$green9",
  on_the_way: "$blue9",
  delivered: "$gray9",
  cancelled: "$red9",
};

const DEFAULT_CHIPS = ["pending", "accepted", "ready", "on_the_way"];
const CANCELLABLE_STATUSES = ["pending", "accepted", "preparing"];

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

function chipStatuses(chipKey: string): string[] {
  const chip = FILTER_CHIPS.find((c) => c.key === chipKey);
  return chip?.statuses || [chipKey];
}

export default function SellerOrders() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useResponsive();
  const theme = useTheme();
  const isTablet = width >= 768;

  // Dynamic column widths based on screen width
  const colWidths = {
    order: Math.max(110, width * 0.13),
    customer: Math.max(140, width * 0.16),
    status: Math.max(100, width * 0.1),
    items: 60,
    total: Math.max(100, width * 0.11),
    time: 65,
    actions: Math.max(220, width * 0.2),
  };

  const [searchQuery, setSearchQuery] = useState("");
  const [activeChips, setActiveChips] = useState<string[]>(
    isTablet ? [...DEFAULT_CHIPS] : ["pending", "accepted", "ready"],
  );
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [cancelTarget, setCancelTarget] = useState<string | null>(null);

  const { data, isLoading, refetch, isRefetching } = useSellerOrdersQuery();
  const cancelOrder = useCancelOrderMutation();

  useOrderRealtimeUpdates(SELLER_KEYS.all);

  const allOrders = data?.data || [];

  const filteredOrders = useMemo(() => {
    const statuses = activeChips.flatMap(chipStatuses);
    let result = allOrders.filter((o) => statuses.includes(o.status));
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter(
        (o) =>
          o.order_number.toLowerCase().includes(q) ||
          o.user?.full_name?.toLowerCase().includes(q),
      );
    }
    return result;
  }, [allOrders, activeChips, searchQuery]);

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
    <Card padding="$4" bordered marginBottom="$3" pressStyle={{ scale: 0.98, opacity: 0.9 }}>
      <YStack gap="$2">
        <XStack justifyContent="space-between" alignItems="center">
          <Text fontSize="$5" fontWeight="bold">{item.order_number}</Text>
          <YStack px="$2" py="$1" borderRadius="$3" backgroundColor={CHIP_COLORS[item.status] || "$gray9"}>
            <Text fontSize="$2" color="white" fontWeight="600">{formatStatus(item.status)}</Text>
          </YStack>
        </XStack>
        <XStack justifyContent="space-between">
          <Text fontSize="$4">{item.user?.full_name || "Customer"}</Text>
          <Text fontSize="$5" fontWeight="bold" color="$primary">
            {formatPriceFromMinor(item.total_minor, item.currency)}
          </Text>
        </XStack>
        <Separator />
        <XStack gap="$3">
          <Button flex={1} size="$3" variant="outline" icon={<ExternalLink size={14} />} onPress={() => router.push(`/(seller)/orders/${item.id}`)}>View</Button>
          <Button flex={1} size="$3" variant="outline" icon={<Printer size={14} />} onPress={() => handlePrint(item)}>Print</Button>
          {CANCELLABLE_STATUSES.includes(item.status) && (
            <Button size="$3" variant="dangerOutline" icon={<FileText size={14} />} onPress={() => setCancelTarget(item.id)}>Cancel</Button>
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
      <Text fontWeight="bold" width={colWidths.order} fontSize="$5">{item.order_number}</Text>
      <YStack width={colWidths.customer}>
        <Text fontSize="$4" numberOfLines={1}>{item.user?.full_name || "—"}</Text>
        <Text fontSize="$3" color="$colorMuted">{item.user?.phone || ""}</Text>
      </YStack>
      <YStack px="$3" py="$2" borderRadius="$3" backgroundColor={CHIP_COLORS[item.status] || "$gray9"} width={colWidths.status}>
        <Text fontSize="$3" color="$color" fontWeight="600" textAlign="center">{formatStatus(item.status)}</Text>
      </YStack>
      <XStack width={colWidths.items} gap="$2" alignItems="center">
        <Package size={18} color="$colorMuted" />
        <Text fontSize="$4">{item.items?.length || 0}</Text>
      </XStack>
      <Text fontSize="$5" fontWeight="bold" color="$primary" width={colWidths.total}>
        {formatPriceFromMinor(item.total_minor, item.currency)}
      </Text>
      <XStack width={colWidths.time} gap="$2" alignItems="center">
        <Clock size={16} color="$colorMuted" />
        <Text fontSize="$4" color="$colorMuted">{timeSince(item.inserted_at)}</Text>
      </XStack>
      <XStack gap="$3" width={colWidths.actions} justifyContent="flex-end">
        <Button size="$4" variant="outline" icon={<ExternalLink size={16} />} onPress={() => router.push(`/(seller)/orders/${item.id}`)}>View</Button>
        <Button size="$4" variant="outline" icon={<Printer size={16} />} onPress={() => handlePrint(item)}>Print</Button>
        {CANCELLABLE_STATUSES.includes(item.status) && (
          <Button size="$4" variant="dangerOutline" icon={<FileText size={16} />} onPress={() => setCancelTarget(item.id)}>Cancel</Button>
        )}
      </XStack>
    </XStack>
  );

  if (isLoading) {
    return (
      <YStack flex={1} justifyContent="center" alignItems="center" backgroundColor="$background">
        <Spinner size="large" color="$primary" />
      </YStack>
    );
  }

  // ── Tablet: full table layout ──
  const tableTotalWidth = Object.values(colWidths).reduce((a, b) => a + b, 0) + 48;
  const needsHScroll = tableTotalWidth > width;

  const tableHeader = (
    <XStack
      borderBottomWidth={2}
      borderBottomColor="$borderColor"
      paddingVertical="$2"
      paddingHorizontal="$3"
      backgroundColor="$backgroundSoft"
    >
      <Text fontWeight="bold" width={colWidths.order} fontSize="$3" color="$colorMuted">Order #</Text>
      <Text fontWeight="bold" width={colWidths.customer} fontSize="$3" color="$colorMuted">Customer</Text>
      <Text fontWeight="bold" width={colWidths.status} fontSize="$3" color="$colorMuted">Status</Text>
      <Text fontWeight="bold" width={colWidths.items} fontSize="$3" color="$colorMuted">Items</Text>
      <Text fontWeight="bold" width={colWidths.total} fontSize="$3" color="$colorMuted">Total</Text>
      <Text fontWeight="bold" width={colWidths.time} fontSize="$3" color="$colorMuted">Time</Text>
      <Text fontWeight="bold" width={colWidths.actions} fontSize="$3" color="$colorMuted" textAlign="right">Actions</Text>
    </XStack>
  );

  const table = (
    <YStack flex={1}>
      {tableHeader}
      {filteredOrders.length === 0 ? (
        <YStack padding="$8" alignItems="center">
          <Text color="$colorMuted" fontSize="$4" textAlign="center">
            {searchQuery ? "No orders match your search" : "No orders for the selected filters"}
          </Text>
        </YStack>
      ) : (
        <FlatList
          data={filteredOrders}
          keyExtractor={(item) => item.id}
          renderItem={renderTabletRow}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
          contentContainerStyle={{ paddingBottom: Math.max(insets.bottom + 20, 24) }}
          initialNumToRender={20}
          windowSize={10}
          maxToRenderPerBatch={15}
          removeClippedSubviews
        />
      )}
    </YStack>
  );

  return (
    <YStack flex={1} backgroundColor="$background">
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
            backgroundColor={activeChips.length > 0 ? "$primary" : "$background"}
            onPress={() => setFilterSheetOpen(true)}
          >
            <Text fontFamily="$body" fontWeight="600" fontSize="$3" color={activeChips.length > 0 ? "$color" : "$color"}>
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
                  <YStack px="$3" py="$2" borderRadius="$4" borderWidth={1}
                    borderColor={active ? chip.color : "$borderColor"}
                    backgroundColor={active ? chip.color : "$background"}
                  >
                    <Text fontSize="$3" fontWeight="600" color={active ? "$color" : "$color"}>{chip.label}</Text>
                  </YStack>
                </Pressable>
              );
            })}
          </XStack>
        </ScrollView>
      </YStack>

      {/* Order list */}
      {isTablet ? (
        needsHScroll ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={true} style={{ flex: 1 }}>
            <YStack width={tableTotalWidth} flex={1}>
              {tableHeader}
              <FlatList
                data={filteredOrders}
                keyExtractor={(item) => item.id}
                renderItem={(props) => (
                  <XStack width={tableTotalWidth}>
                    {renderTabletRow(props)}
                  </XStack>
                )}
                refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
                contentContainerStyle={{ paddingBottom: Math.max(insets.bottom + 20, 24) }}
                initialNumToRender={20}
                windowSize={10}
                maxToRenderPerBatch={15}
                removeClippedSubviews
                ListEmptyComponent={
                  <YStack padding="$8" alignItems="center">
                    <Text color="$colorMuted" fontSize="$4" textAlign="center">
                      {searchQuery ? "No orders match your search" : "No orders for the selected filters"}
                    </Text>
                  </YStack>
                }
              />
            </YStack>
          </ScrollView>
        ) : (
          <YStack flex={1}>
            {tableHeader}
            <FlatList
              data={filteredOrders}
              keyExtractor={(item) => item.id}
              renderItem={renderTabletRow}
              refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
              contentContainerStyle={{ paddingBottom: Math.max(insets.bottom + 20, 24) }}
              initialNumToRender={20}
              windowSize={10}
              maxToRenderPerBatch={15}
              removeClippedSubviews
              ListEmptyComponent={
                <YStack padding="$8" alignItems="center">
                  <Text color="$colorMuted" fontSize="$4" textAlign="center">
                    {searchQuery ? "No orders match your search" : "No orders for the selected filters"}
                  </Text>
                </YStack>
              }
            />
          </YStack>
        )
      ) : (
        <FlatList
          data={filteredOrders}
          keyExtractor={(item) => item.id}
          renderItem={renderPhoneCard}
          contentContainerStyle={{ padding: 16, paddingTop: 0, paddingBottom: Math.max(insets.bottom + 20, 24) }}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
          ListEmptyComponent={
            <YStack padding="$8" alignItems="center" gap="$3">
              <Text color="$colorMuted" fontSize="$5" textAlign="center">
                {searchQuery ? "No orders match your search" : "No orders for the selected filters"}
              </Text>
              {(searchQuery || activeChips.length > 0) && (
                <Button variant="outline" marginTop="$3" onPress={() => { setSearchQuery(""); setActiveChips(isTablet ? [...DEFAULT_CHIPS] : ["pending", "accepted", "ready"]); }}>
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
      <Sheet modal open={filterSheetOpen} onOpenChange={setFilterSheetOpen} snapPoints={[60]} dismissOnSnapToBottom zIndex={200_000}>
        <Sheet.Overlay animation="lazy" enterStyle={{ opacity: 0 }} exitStyle={{ opacity: 0 }} backgroundColor="rgba(0,0,0,0.5)" />
        <Sheet.Frame backgroundColor="$background" borderTopLeftRadius="$6" borderTopRightRadius="$6" padding="$4" paddingBottom={insets.bottom + 16}>
          <Sheet.Handle backgroundColor="$gray5" marginTop="$2" />
          <YStack gap="$4">
            <XStack justifyContent="space-between" alignItems="center">
              <Text fontSize="$5" fontWeight="bold">Filter Orders</Text>
              <Pressable onPress={() => setFilterSheetOpen(false)}><X size={24} color="$color" /></Pressable>
            </XStack>
            <YStack gap="$3">
              <Text fontSize="$4" fontWeight="600" color="$colorMuted">Order Status</Text>
              {FILTER_CHIPS.map((chip) => {
                const active = activeChips.includes(chip.key);
                return (
                  <Pressable key={chip.key} onPress={() => toggleChip(chip.key)}>
                    <XStack p="$3" borderWidth={1} borderColor={active ? chip.color : "$borderColor"} borderRadius="$3" alignItems="center" justifyContent="space-between" backgroundColor={active ? chip.color : "$background"}>
                      <Text fontWeight="500" color={"$color"}>{chip.label}</Text>
                    </XStack>
                  </Pressable>
                );
              })}
            </YStack>
            <XStack gap="$3" marginTop="$2">
              <Button flex={1} variant="outline" onPress={() => setActiveChips([])}>Clear All</Button>
              <Button flex={1} onPress={() => setFilterSheetOpen(false)}>Apply</Button>
            </XStack>
          </YStack>
        </Sheet.Frame>
      </Sheet>

      {/* Cancel Confirmation */}
      <AppAlertDialog
        open={cancelTarget !== null}
        onOpenChange={() => setCancelTarget(null)}
        title="Cancel Order"
        description="Are you sure you want to cancel this order? This cannot be undone."
        confirmText="Cancel Order"
        isDestructive
        onConfirm={() => { if (cancelTarget) { cancelOrder.mutate(cancelTarget); setCancelTarget(null); } }}
      />
    </YStack>
  );
}
