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
  Avatar,
} from "tamagui";
import {
  Truck,
  MapPin,
  Bike,
  X,
  Search,
  ExternalLink,
  Navigation2,
} from "@tamagui/lucide-icons";
import {
  FlatList,
  Pressable,
  RefreshControl,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, useRouter } from "expo-router";
import { useBusinessDeliveriesQuery } from "@/hooks/delivery.hooks";
import { useOrderRealtimeUpdates } from "@/hooks/useOrderRealtimeUpdates";
import { SELLER_KEYS } from "@/hooks/seller.hooks";
import { useResponsive } from "@/utils/responsive";
import { useFilterStore } from "@/stores/filter.store";
import { RiderSelectionSheet } from "@/components/kiosk/RiderSelectionSheet";
import {
  useAvailableRidersQuery,
  useAssignRiderMutation,
} from "@/hooks/kiosk.hooks";
import { useConfirmHandoverMutation } from "@/hooks/seller.hooks";
import { AppAlertDialog } from "@/components/ui/AlertDialog";
import { formatPriceFromMinor } from "@/utils/currency";

const DELIVERY_FILTERS = [
  { key: "all", label: "All", color: "$gray9" },
  {
    key: "assigned,picked_up,en_route,arrived",
    label: "Active",
    color: "$color.blue",
  },
  { key: "delivered", label: "Delivered", color: "$color.gray600" },
  { key: "failed,returned_to_merchant", label: "Failed", color: "$color.red" },
];

const STATUS_COLORS = {
  assigned: "$color.orange",
  picked_up: "$color.blue",
  en_route: "$color.blue",
  arrived: "$color.green",
  delivered: "$color.gray600",
  failed: "$color.red",
  returned_to_merchant: "$color.orange",
};

function timeSince(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  return `${hrs}h ${mins % 60}m`;
}

export default function SellerDeliveries() {
  const insets = useSafeAreaInsets();
  const { width } = useResponsive();
  const isTablet = width >= 768;

  const COL_ACTIONS = 120;

  const [containerWidth, setContainerWidth] = useState(0);
  const searchQuery = useFilterStore((s) => s.deliveriesSearchQuery);
  const setSearchQuery = useFilterStore((s) => s.setDeliveriesSearchQuery);
  const activeFilter = useFilterStore((s) => s.deliveriesActiveFilter);
  const setActiveFilter = useFilterStore((s) => s.setDeliveriesActiveFilter);
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasInitFilter = useRef(false);
  const [showRiderSheet, setShowRiderSheet] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [handoverTarget, setHandoverTarget] = useState<string | null>(null);
  const [changeRiderTarget, setChangeRiderTarget] = useState<string | null>(
    null,
  );
  const [refreshing, setRefreshing] = useState(false);
  const loadingMore = useRef(false);

  const backendFilters = {
    status: activeFilter !== "all" ? activeFilter : undefined,
    search: debouncedSearch || undefined,
  };

  const {
    data: deliveries,
    isLoading,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useBusinessDeliveriesQuery(true, backendFilters);

  const { data: riders } = useAvailableRidersQuery(showRiderSheet);
  const assignRider = useAssignRiderMutation();
  const confirmHandover = useConfirmHandoverMutation();

  useOrderRealtimeUpdates(SELLER_KEYS.all);

  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => {
      setDebouncedSearch(searchQuery.trim());
    }, 400);
    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
    };
  }, [searchQuery]);

  useEffect(() => {
    if (hasInitFilter.current) return;
    hasInitFilter.current = true;
    if (searchQuery) {
      setDebouncedSearch(searchQuery);
    }
  }, []);

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

  const handleOpenRiderSheet = (orderId: string) => {
    setSelectedOrderId(orderId);
    setShowRiderSheet(true);
  };

  const handleAssignRider = (riderId: string) => {
    if (!selectedOrderId) return;
    assignRider.mutate({ orderId: selectedOrderId, riderId });
    setShowRiderSheet(false);
    setSelectedOrderId(null);
  };

  const allDeliveries = deliveries || [];

  const availWidth = containerWidth || width;
  const remaining = Math.max(280, availWidth - COL_ACTIONS - 48);
  const colWidths = {
    order: Math.max(140, Math.round(remaining * 0.2)),
    customer: Math.max(108, Math.round(remaining * 0.18)),
    status: Math.max(100, Math.round(remaining * 0.15)),
    rider: Math.max(160, Math.round(remaining * 0.25)),
    address: Math.max(160, Math.round(remaining * 0.23)),
  };
  const tableTotal =
    Object.values(colWidths).reduce((a, b) => a + b, 0) + COL_ACTIONS + 48;

  // ── Phone: compact card ──
  const renderPhoneCard = ({ item: d }: { item: any }) => {
    const order = d.order || {};
    const rider = d.rider;

    return (
      <Card
        padding="$4"
        bordered
        marginBottom="$3"
        pressStyle={{ scale: 0.98, opacity: 0.9 }}
        onPress={() => router.push(`/(seller)/deliveries/${d.id}`)}
      >
        <YStack gap="$3">
          <XStack justifyContent="space-between" alignItems="center">
            <XStack gap="$2" alignItems="center">
              <Truck size={18} color="$colorMuted" />
              <Text fontSize="$5" fontWeight="bold">
                {order.order_number}
              </Text>
            </XStack>
            <YStack
              paddingHorizontal="$2"
              paddingVertical="$1"
              borderRadius="$2"
              backgroundColor={STATUS_COLORS[d.status]}
            >
              <Text fontSize="$3" color={"$white"} fontFamily="$body">
                {d.status
                  ? d.status
                      .replace(/_/g, " ")
                      .replace(/\b\w/g, (l) => l.toUpperCase())
                  : "—"}
              </Text>
            </YStack>
          </XStack>

          <XStack justifyContent="space-between" alignItems="center">
            <YStack flex={1}>
              <Text fontSize="$4" fontWeight="500">
                {order.customer_name || order.user?.full_name || "Customer"}
              </Text>
              <Text fontSize="$3" color="$colorMuted">
                {order.customer_phone || order.user?.phone || ""}
              </Text>
            </YStack>
            <Text fontSize="$5" fontWeight="bold" color="$primary">
              {formatPriceFromMinor(order.total_minor, order.currency)}
            </Text>
          </XStack>

          {rider ? (
            <XStack gap="$2" alignItems="center">
              <Avatar circular size="$3">
                <Avatar.Fallback backgroundColor="$gray800">
                  <Text color="white" fontSize="$2" fontWeight="bold">
                    {(rider.name || "R").charAt(0)}
                  </Text>
                </Avatar.Fallback>
              </Avatar>
              <Text fontSize="$3" color="$colorMuted">
                {rider.name || rider.rider_number || "Rider"}
              </Text>
            </XStack>
          ) : null}

          {order.delivery_address && (
            <XStack gap="$2" alignItems="flex-start">
              <MapPin size={14} color="$colorMuted" style={{ marginTop: 2 }} />
              <Text
                fontSize="$3"
                color="$colorMuted"
                flex={1}
                numberOfLines={2}
              >
                {order.delivery_address.full_address ||
                  `${order.delivery_address.street || ""} ${order.delivery_address.city || ""}`}
              </Text>
            </XStack>
          )}

          <Separator />

          {d.status === "assigned" ? (
            rider ? (
              <XStack gap="$3">
                <Button
                  flex={1}
                  backgroundColor="$primary"
                  height={40}
                  icon={<Bike size={16} />}
                  onPress={() =>
                    setHandoverTarget(
                      d.merchant_handover_confirmed_at ? d.id : d.id,
                    )
                  }
                >
                  Handover
                </Button>
                <Button
                  flex={1}
                  variant="outline"
                  height={40}
                  icon={<Bike size={16} />}
                  onPress={() => setChangeRiderTarget(order.id)}
                >
                  Change Rider
                </Button>
              </XStack>
            ) : (
              <Button
                backgroundColor="$primary"
                height={40}
                icon={<Bike size={16} />}
                onPress={() => handleOpenRiderSheet(order.id)}
              >
                Assign Rider
              </Button>
            )
          ) : d.status === "picked_up" || d.status === "en_route" ? (
            <Button
              variant="outline"
              height={40}
              icon={<Navigation2 size={16} />}
              onPress={() => router.push(`/(seller)/deliveries/${d.id}`)}
            >
              Track Delivery
            </Button>
          ) : d.status === "delivered" ||
            d.status === "failed" ||
            d.status === "returned_to_merchant" ? (
            <Button
              variant="outline"
              height={40}
              icon={<ExternalLink size={16} />}
              onPress={() => router.push(`/(seller)/deliveries/${d.id}`)}
            >
              View Details
            </Button>
          ) : null}
        </YStack>
      </Card>
    );
  };

  // ── Tablet: table row ──
  const renderTabletRow = ({ item: d }: { item: any }) => {
    const order = d.order || {};
    const rider = d.rider;

    return (
      <XStack
        borderBottomWidth={1}
        borderBottomColor="$borderColor"
        paddingVertical="$3"
        paddingHorizontal="$4"
        alignItems="center"
      >
        <XStack width={colWidths.order} gap="$1" alignItems="center">
          <Truck size={14} color="$colorMuted" />
          <Text fontWeight="bold" fontSize="$4" numberOfLines={1}>
            {order.order_number}
          </Text>
        </XStack>

        <YStack width={colWidths.customer}>
          <Tooltip label={order.customer_name || order.user?.full_name || "—"}>
            <Tooltip.Trigger>
              <Text fontSize="$4" numberOfLines={1} ellipsis>
                {order.customer_name || order.user?.full_name || "—"}
              </Text>
            </Tooltip.Trigger>
          </Tooltip>
          <Text fontSize="$3" color="$colorMuted">
            {order.customer_phone || order.user?.phone || ""}
          </Text>
        </YStack>

        <XStack
          width={colWidths.status}
          alignItems="center"
          justifyContent="center"
        >
          <YStack
            paddingHorizontal="$2"
            paddingVertical="$1"
            borderRadius="$2"
            backgroundColor={STATUS_COLORS[d.status]}
          >
            <Text fontSize="$3" color={"$white"} fontFamily="$body">
              {d.status
                ? d.status
                    .replace(/_/g, " ")
                    .replace(/\b\w/g, (l) => l.toUpperCase())
                : "—"}
            </Text>
          </YStack>
        </XStack>

        <XStack width={colWidths.rider} gap="$2" alignItems="center">
          {rider ? (
            <>
              <Avatar circular size={"$5"}>
                <Avatar.Image source={{ uri: rider.avatar_url }} />
                <Avatar.Fallback>
                  <Text fontSize="$3" numberOfLines={1} ellipsis>
                    {(rider.name || "R").charAt(0)}
                  </Text>
                </Avatar.Fallback>
              </Avatar>
              <YStack>
                <Text fontSize="$3" numberOfLines={1} ellipsis>
                  {rider.name || rider.rider_number || "Rider"}
                </Text>
              </YStack>
            </>
          ) : (
            <Text fontSize="$3" color="$colorMuted">
              —
            </Text>
          )}
        </XStack>

        <XStack width={colWidths.address} gap="$2" alignItems="flex-start">
          <MapPin size={14} color="$colorMuted" style={{ marginTop: 2 }} />
          <Text fontSize="$3" color="$colorMuted" numberOfLines={1} ellipsis>
            {order.delivery_address?.full_address ||
              `${order.delivery_address?.street || ""} ${order.delivery_address?.city || ""}` ||
              "—"}
          </Text>
        </XStack>

        <XStack
          gap="$2"
          width={COL_ACTIONS}
          justifyContent="flex-end"
          alignItems="center"
        >
          {d.status === "assigned" ? (
            rider ? (
              <>
                <Button
                  size="$3"
                  backgroundColor="$primary"
                  paddingHorizontal="$3"
                  height={36}
                  icon={<Bike size={14} />}
                  onPress={() => setHandoverTarget(d.id)}
                >
                  Handover
                </Button>
                <Button
                  size="$3"
                  variant="outline"
                  paddingHorizontal="$3"
                  height={36}
                  onPress={() => setChangeRiderTarget(order.id)}
                >
                  Change
                </Button>
              </>
            ) : (
              <Button
                size="$3"
                backgroundColor="$primary"
                paddingHorizontal="$3"
                height={36}
                icon={<Bike size={14} />}
                onPress={() => handleOpenRiderSheet(order.id)}
              >
                Assign
              </Button>
            )
          ) : d.status === "picked_up" || d.status === "en_route" ? (
            <Button
              size="$3"
              variant="outline"
              paddingHorizontal="$3"
              height={36}
              icon={<Navigation2 size={14} />}
              onPress={() => router.push(`/(seller)/deliveries/${d.id}`)}
            >
              Track
            </Button>
          ) : (
            <Button
              size="$3"
              variant="outline"
              paddingHorizontal="$3"
              height={36}
              icon={<ExternalLink size={14} />}
              onPress={() => router.push(`/(seller)/deliveries/${d.id}`)}
            >
              View
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
        width={colWidths.rider}
      >
        Rider
      </Text>
      <Text
        fontWeight="bold"
        fontSize="$4"
        color="$colorMuted"
        width={colWidths.address}
      >
        Address
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
              placeholder="Search deliveries..."
              placeholderTextColor="#999"
            />
          </XStack>
        </XStack>

        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <XStack gap="$2" paddingVertical="$1">
            {DELIVERY_FILTERS.map((f) => {
              const active = activeFilter === f.key;
              return (
                <Pressable key={f.key} onPress={() => setActiveFilter(f.key)}>
                  <YStack
                    px="$3"
                    py="$2"
                    borderRadius="$4"
                    borderWidth={1}
                    borderColor={active ? f.color : "$borderColor"}
                    backgroundColor={active ? f.color : "$background"}
                  >
                    <Text
                      fontSize="$3"
                      fontWeight="600"
                      color={active ? "$color" : "$color"}
                    >
                      {f.label}
                    </Text>
                  </YStack>
                </Pressable>
              );
            })}
          </XStack>
        </ScrollView>
      </YStack>

      {isTablet ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator
          style={{ flex: 1 }}
        >
          <YStack width={tableTotal}>
            {tableHeader}
            {allDeliveries.length === 0 ? (
              <YStack padding="$8" alignItems="center">
                <Text color="$colorMuted" fontSize="$4" textAlign="center">
                  {debouncedSearch
                    ? "No deliveries match your search"
                    : "No deliveries for the selected filter"}
                </Text>
              </YStack>
            ) : (
              <FlatList
                data={allDeliveries}
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
          data={allDeliveries}
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
              <Truck size={48} color="$colorMuted" />
              <Text color="$colorMuted" fontSize="$5" textAlign="center">
                {debouncedSearch
                  ? "No deliveries match your search"
                  : "No deliveries for the selected filter"}
              </Text>
              {(debouncedSearch || activeFilter !== "all") && (
                <Button
                  variant="outline"
                  marginTop="$3"
                  onPress={() => {
                    setSearchQuery("");
                    setDebouncedSearch("");
                    setActiveFilter("all");
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

      <RiderSelectionSheet
        visible={showRiderSheet}
        onClose={() => {
          setShowRiderSheet(false);
          setSelectedOrderId(null);
        }}
        riders={riders ?? []}
        onSelectRider={handleAssignRider}
      />

      <AppAlertDialog
        open={handoverTarget !== null}
        onOpenChange={() => setHandoverTarget(null)}
        title="Confirm Handover"
        description="Hand over this order to the rider?"
        confirmText="Handover"
        onConfirm={() => {
          if (handoverTarget) {
            confirmHandover.mutate(handoverTarget);
            setHandoverTarget(null);
          }
        }}
      />

      <AppAlertDialog
        open={changeRiderTarget !== null}
        onOpenChange={() => setChangeRiderTarget(null)}
        title="Change Rider"
        description="The current rider will be replaced and notified. Are you sure?"
        confirmText="Change Rider"
        isDestructive
        onConfirm={() => {
          if (changeRiderTarget) {
            setSelectedOrderId(changeRiderTarget);
            setChangeRiderTarget(null);
            setShowRiderSheet(true);
          }
        }}
      />
    </YStack>
  );
}
