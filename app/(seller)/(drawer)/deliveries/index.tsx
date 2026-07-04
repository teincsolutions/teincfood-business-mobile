// @ts-nocheck
import { useState, useMemo, useCallback } from "react";
import { FlatList, RefreshControl } from "react-native";
import { YStack, XStack, Text, Card, Avatar, Separator, Badge } from "tamagui";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Truck,
  MapPin,
  Phone,
  Clock,
  Bike,
  ChevronRight,
  Search,
  Navigation2,
} from "@tamagui/lucide-icons";
import { Button, Input } from "@/components/ui";
import { useSellerOrdersQuery } from "@/hooks/seller.hooks";
import { useOrderRealtimeUpdates } from "@/hooks/useOrderRealtimeUpdates";
import { SELLER_KEYS } from "@/hooks/seller.hooks";
import { RiderSelectionSheet } from "@/components/kiosk/RiderSelectionSheet";
import { useAvailableRidersQuery, useAssignRiderMutation } from "@/hooks/kiosk.hooks";
import { formatPriceFromMinor } from "@/utils/currency";

const DELIVERY_STATUSES = ["ready", "on_the_way", "delivered", "cancelled"];

const STATUS_COLORS = {
  ready: "$green9",
  on_the_way: "$blue9",
  delivered: "$gray9",
  cancelled: "$red9",
};

const DELIVERY_STATUS_COLORS = {
  assigned: "$orange9",
  picked_up: "$blue9",
  en_route: "$blue9",
  arrived: "$green9",
  delivered: "$gray9",
  failed: "$red9",
  returned_to_merchant: "$orange9",
};

export default function SellerDeliveries() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState("");
  const [showRiderSheet, setShowRiderSheet] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  const { data, isLoading, refetch, isRefetching } = useSellerOrdersQuery();
  const { data: riders } = useAvailableRidersQuery(showRiderSheet);
  const assignRider = useAssignRiderMutation();

  useOrderRealtimeUpdates(SELLER_KEYS.all);

  const allOrders = data ?? [];

  // Orders that need delivery (have delivery_address) and are in delivery-relevant statuses
  const deliveryOrders = useMemo(() => {
    let orders = allOrders.filter(
      (o) =>
        o.delivery_address &&
        DELIVERY_STATUSES.includes(o.status),
    );
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      orders = orders.filter(
        (o) =>
          o.order_number.toLowerCase().includes(q) ||
          o.user?.full_name?.toLowerCase().includes(q),
      );
    }
    return orders;
  }, [allOrders, searchQuery]);

  const readyForRider = deliveryOrders.filter((o) => o.status === "ready");
  const inTransit = deliveryOrders.filter((o) => o.status === "on_the_way");
  const completed = deliveryOrders.filter((o) => o.status === "delivered" || o.status === "cancelled");

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

  const renderDelivery = ({ item: order }) => (
    <Card
      padding="$4"
      bordered
      marginBottom="$3"
      pressStyle={{ scale: 0.98, opacity: 0.9 }}
      onPress={() => {
        if (order.delivery_id) {
          router.push(`/(seller)/deliveries/${order.delivery_id}`);
        } else {
          router.push(`/(seller)/orders/${order.id}`);
        }
      }}
    >
      <YStack gap="$3">
        <XStack justifyContent="space-between" alignItems="center">
          <XStack gap="$2" alignItems="center">
            <Truck size={18} color="$colorMuted" />
            <Text fontSize="$5" fontWeight="bold">{order.order_number}</Text>
          </XStack>
          <XStack gap="$2" alignItems="center">
            {order.delivery_status && (
              <YStack
                paddingHorizontal="$2"
                paddingVertical="$1"
                borderRadius="$3"
                backgroundColor={DELIVERY_STATUS_COLORS[order.delivery_status] || "$gray9"}
              >
                <Text fontSize="$2" color="white" fontWeight="600">
                  {order.delivery_status.replace(/_/g, " ")}
                </Text>
              </YStack>
            )}
            <YStack
              paddingHorizontal="$2"
              paddingVertical="$1"
              borderRadius="$3"
              backgroundColor={STATUS_COLORS[order.status] || "$gray9"}
            >
              <Text fontSize="$2" color="white" fontWeight="600" textTransform="capitalize">
                {order.status.replace(/_/g, " ")}
              </Text>
            </YStack>
          </XStack>
        </XStack>

        <XStack gap="$3" alignItems="center">
          <Avatar circular size="$3">
            <Avatar.Fallback backgroundColor="$gray800">
              <Text color="white" fontSize="$2" fontWeight="bold">
                {(order.user?.full_name || "?").charAt(0)}
              </Text>
            </Avatar.Fallback>
          </Avatar>
          <YStack flex={1}>
            <Text fontSize="$3" fontWeight="500">{order.user?.full_name || "Customer"}</Text>
            <Text fontSize="$2" color="$colorMuted">{order.user?.phone || ""}</Text>
          </YStack>
          <Text fontSize="$4" fontWeight="bold">
            {formatPriceFromMinor(order.total_minor, order.currency)}
          </Text>
        </XStack>

        {order.delivery_address && (
          <XStack gap="$2" alignItems="flex-start">
            <MapPin size={14} color="$colorMuted" style={{ marginTop: 2 }} />
            <Text fontSize="$3" color="$colorMuted" flex={1} numberOfLines={2}>
              {order.delivery_address.full_address ||
                `${order.delivery_address.street || ""}, ${order.delivery_address.city || ""}`}
            </Text>
          </XStack>
        )}

        <Separator />

        {order.status === "ready" ? (
          <Button
            backgroundColor="$primary"
            icon={<Bike size={18} />}
            onPress={() => handleOpenRiderSheet(order.id)}
          >
            Assign Rider
          </Button>
        ) : order.status === "on_the_way" && order.delivery_id ? (
          <Button
            variant="outline"
            icon={<Navigation2 size={16} />}
            onPress={() => router.push(`/(seller)/deliveries/${order.delivery_id}`)}
          >
            Track Delivery
          </Button>
        ) : order.status === "delivered" || order.status === "cancelled" ? (
          <Button
            variant="outline"
            onPress={() => router.push(`/(seller)/orders/${order.id}`)}
          >
            View Order
          </Button>
        ) : null}
      </YStack>
    </Card>
  );

  return (
    <YStack flex={1} backgroundColor="$background">
      <YStack padding="$4" gap="$3">
        <Text fontSize="$7" fontWeight="bold" fontFamily="$heading">Deliveries</Text>

        <XStack gap="$3" alignItems="center">
          <YStack flex={1}>
            <Input
              placeholder="Search deliveries..."
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </YStack>
        </XStack>

        {/* Section tabs */}
        <XStack gap="$3">
          {[
            { key: "ready", label: `Ready (${readyForRider.length})` },
            { key: "in_transit", label: `In Transit (${inTransit.length})` },
            { key: "completed", label: `Completed (${completed.length})` },
          ].map((tab) => (
            <Text key={tab.key} fontSize="$3" color="$colorMuted">{tab.label}</Text>
          ))}
        </XStack>
      </YStack>

      <FlatList
        data={deliveryOrders}
        keyExtractor={(item) => item.id}
        renderItem={renderDelivery}
        contentContainerStyle={{
          padding: 16,
          paddingBottom: Math.max(insets.bottom + 20, 24),
        }}
        refreshControl={
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
        }
        ListEmptyComponent={
          <YStack alignItems="center" padding="$8" gap="$3">
            <Truck size={48} color="$colorMuted" />
            <Text fontSize="$5" color="$colorMuted" textAlign="center">
              No delivery orders found
            </Text>
          </YStack>
        }
      />

      <RiderSelectionSheet
        visible={showRiderSheet}
        onClose={() => { setShowRiderSheet(false); setSelectedOrderId(null); }}
        riders={riders ?? []}
        onSelectRider={handleAssignRider}
      />
    </YStack>
  );
}
