// @ts-nocheck
import { useState, useMemo, useCallback, useEffect } from "react";
import {
  YStack,
  Text,
  Card,
  Button,
  XStack,
  Separator,
  Spinner,
} from "tamagui";
import { Filter, X, Check, Search } from "@tamagui/lucide-icons";
import {
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  TextInput,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  useSellerOrdersQuery,
  useAcceptOrderMutation,
  useRejectOrderMutation,
  useStartPreparingOrderMutation,
  useMarkOrderReadyMutation,
  SELLER_KEYS,
} from "@/hooks/seller.hooks";
import { useOrderRealtimeUpdates } from "@/hooks/useOrderRealtimeUpdates";
import { useResponsive } from "@/utils/responsive";
import { AppAlertDialog } from "@/components/ui/AlertDialog";
import type { SellerOrder } from "@/types/api";
import { SellerOrderCard } from "@/components/orders/SellerOrderCard";

const FILTER_OPTIONS = [
  "pending",
  "accepted",
  "preparing",
  "ready",
  "delivered",
];

export default function SellerOrders() {
  const insets = useSafeAreaInsets();
  const { isTablet, isLargeTablet } = useResponsive();
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  const { data, isLoading, refetch, isRefetching } = useSellerOrdersQuery();
  const acceptMutation = useAcceptOrderMutation();
  const rejectMutation = useRejectOrderMutation();
  const startPreparingMutation = useStartPreparingOrderMutation();
  const markReadyMutation = useMarkOrderReadyMutation();

  // Real-time order updates via WebSocket
  useOrderRealtimeUpdates(SELLER_KEYS.all);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogConfig, setDialogConfig] = useState<{
    title: string;
    description: string;
    isDestructive?: boolean;
    onConfirm: () => void;
  } | null>(null);

  const orders = data?.data || [];

  const filteredOrders = useMemo(() => {
    let result = orders;
    if (selectedFilters.length > 0) {
      result = result.filter((o) => selectedFilters.includes(o.status));
    }
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter(
        (o) =>
          o.order_number.toLowerCase().includes(q) ||
          o.user?.full_name?.toLowerCase().includes(q),
      );
    }
    return result;
  }, [orders, selectedFilters, searchQuery]);

  const pendingOrders = filteredOrders.filter((o) => o.status === "pending");
  const acceptedOrders = filteredOrders.filter((o) =>
    ["accepted", "preparing"].includes(o.status),
  );
  const doneOrders = filteredOrders.filter((o) =>
    ["ready", "delivered"].includes(o.status),
  );

  const toggleFilter = (status: string) => {
    setSelectedFilters((prev) =>
      prev.includes(status)
        ? prev.filter((f) => f !== status)
        : [...prev, status],
    );
  };

  const clearFilters = () => setSelectedFilters([]);

  const showDialog = (
    title: string,
    description: string,
    onConfirm: () => void,
    isDestructive = false,
  ) => {
    setDialogConfig({ title, description, onConfirm, isDestructive });
    setDialogOpen(true);
  };

  const renderOrderCard = useCallback(
    ({ item }: { item: SellerOrder }) => renderOrder(item),
    [renderOrder],
  );

  const renderOrder = useCallback(
    (order: SellerOrder) => (
      <SellerOrderCard
        key={order.id}
        item={order}
        onAccept={(id) => acceptMutation.mutate(id)}
        onReject={(id) => rejectMutation.mutate(id)}
        onPrepare={(id) => startPreparingMutation.mutate(id)}
        onMarkReady={(id) => markReadyMutation.mutate(id)}
        showDialog={showDialog}
      />
    ),
    [acceptMutation, rejectMutation, startPreparingMutation, markReadyMutation],
  );

  const renderColumn = (
    title: string,
    color: string,
    items: SellerOrder[],
    emptyText: string,
  ) => (
    <YStack flex={1} gap="$3">
      <XStack justifyContent="space-between" alignItems="center">
        <Text fontSize="$5" fontWeight="bold" color={color}>
          {title}
        </Text>
        <Text fontSize="$3" color="$colorMuted">
          {items.length}
        </Text>
      </XStack>
      {items.length === 0 ? (
        <Card
          padding="$5"
          alignItems="center"
          backgroundColor="$backgroundSoft"
        >
          <Text color="$colorMuted">{emptyText}</Text>
        </Card>
      ) : (
        items.map(renderOrder)
      )}
    </YStack>
  );

  if (isLoading) {
    return (
      <YStack
        flex={1}
        justifyContent="center"
        alignItems="center"
        backgroundColor="$background"
      >
        <Spinner size="large" color="$primary" />
      </YStack>
    );
  }

  return (
    <YStack flex={1} backgroundColor="$background">
      {/* Search + Filter Header */}
      <YStack paddingHorizontal="$4" paddingTop="$2" gap="$2">
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
            borderColor={selectedFilters.length > 0 ? "$blue9" : "$borderColor"}
            borderRadius="$3"
            backgroundColor={
              selectedFilters.length > 0 ? "$blue2" : "$background"
            }
            onPress={() => setFilterModalVisible(true)}
            icon={
              <Filter
                size={16}
                color={selectedFilters.length > 0 ? "$blue9" : "$color"}
              />
            }
          >
            <Text
              fontFamily="$body"
              fontWeight="600"
              fontSize="$3"
              color={selectedFilters.length > 0 ? "$blue9" : "$color"}
            >
              Filter
              {selectedFilters.length > 0 ? ` (${selectedFilters.length})` : ""}
            </Text>
          </Button>
        </XStack>
      </YStack>

      {isTablet ? (
        <XStack padding="$4" gap="$4" alignItems="flex-start" flex={1}>
          {renderColumn(
            "Pending",
            "$yellow9",
            pendingOrders,
            "No pending orders",
          )}

          {isLargeTablet ? (
            <>
              {renderColumn(
                "In Progress",
                "$blue9",
                acceptedOrders,
                "No orders in progress",
              )}
              {renderColumn(
                "Completed",
                "$green9",
                doneOrders,
                "No completed orders",
              )}
            </>
          ) : (
            <YStack flex={1} gap="$4">
              {renderColumn(
                "In Progress",
                "$blue9",
                acceptedOrders,
                "No orders in progress",
              )}
              {renderColumn(
                "Completed",
                "$green9",
                doneOrders,
                "No completed orders",
              )}
            </YStack>
          )}
        </XStack>
      ) : (
        <FlatList
          data={filteredOrders}
          keyExtractor={(item) => item.id}
          renderItem={renderOrderCard}
          contentContainerStyle={{ padding: 16, flexGrow: 1 }}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
          }
          ListEmptyComponent={
            <YStack
              flex={1}
              justifyContent="center"
              alignItems="center"
              padding="$6"
            >
              <Text color="$colorMuted" fontSize="$4" textAlign="center">
                {searchQuery || selectedFilters.length > 0
                  ? "No orders match your search or filters"
                  : "No orders yet"}
              </Text>
              {(searchQuery || selectedFilters.length > 0) && (
                <Button
                  variant="outline"
                  marginTop="$3"
                  onPress={() => {
                    setSearchQuery("");
                    clearFilters();
                  }}
                >
                  Clear All
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

      {/* Filter Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={filterModalVisible}
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <YStack flex={1} justifyContent="flex-end">
          <Pressable
            flex={1}
            backgroundColor="rgba(0,0,0,0.5)"
            onPress={() => setFilterModalVisible(false)}
          />
          <YStack
            backgroundColor="$background"
            borderTopLeftRadius="$6"
            borderTopRightRadius="$6"
            padding="$4"
            paddingBottom={insets.bottom + 16}
          >
            <XStack
              justifyContent="space-between"
              alignItems="center"
              marginBottom="$4"
            >
              <Text fontSize="$5" fontWeight="bold">
                Filter Orders
              </Text>
              <Pressable onPress={() => setFilterModalVisible(false)}>
                <X size={24} color="$color" />
              </Pressable>
            </XStack>

            <YStack gap="$3">
              <Text fontSize="$4" fontWeight="600" color="$colorMuted">
                Order Status
              </Text>
              {FILTER_OPTIONS.map((status) => (
                <Pressable key={status} onPress={() => toggleFilter(status)}>
                  <XStack
                    padding="$3"
                    borderWidth={1}
                    borderColor={
                      selectedFilters.includes(status)
                        ? "$blue9"
                        : "$borderColor"
                    }
                    borderRadius="$3"
                    alignItems="center"
                    justifyContent="space-between"
                    backgroundColor={
                      selectedFilters.includes(status)
                        ? "$blue2"
                        : "transparent"
                    }
                  >
                    <XStack alignItems="center" gap="$3">
                      <YStack
                        width={20}
                        height={20}
                        borderRadius="$2"
                        backgroundColor={
                          {
                            pending: "$yellow9",
                            accepted: "$orange9",
                            preparing: "$blue9",
                            ready: "$green9",
                            delivered: "$gray9",
                          }[status] || "$gray9"
                        }
                      />
                      <Text
                        textTransform="capitalize"
                        fontWeight="500"
                        color={
                          selectedFilters.includes(status) ? "$blue9" : "$color"
                        }
                      >
                        {status}
                      </Text>
                    </XStack>
                    {selectedFilters.includes(status) && (
                      <Check size={20} color="$blue9" />
                    )}
                  </XStack>
                </Pressable>
              ))}
            </YStack>

            <XStack gap="$3" marginTop="$4">
              <Button flex={1} variant="outline" onPress={clearFilters}>
                Clear All
              </Button>
              <Button flex={1} onPress={() => setFilterModalVisible(false)}>
                Apply Filters
              </Button>
            </XStack>
          </YStack>
        </YStack>
      </Modal>

      {/* Confirmation Dialog */}
      <AppAlertDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={dialogConfig?.title || ""}
        description={dialogConfig?.description || ""}
        confirmText="Confirm"
        isDestructive={dialogConfig?.isDestructive}
        onConfirm={() => {
          dialogConfig?.onConfirm();
          setDialogOpen(false);
        }}
      />
    </YStack>
  );
}
