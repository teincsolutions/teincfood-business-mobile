// @ts-nocheck
import { useState } from "react";
import { ScrollView, Linking, RefreshControl } from "react-native";
import { YStack, XStack, Text, Card, Separator, Avatar, useMedia } from "tamagui";
import {
  MapPin,
  Navigation,
  Clock,
  Package,
  Phone,
  Bike,
  Truck,
  DollarSign,
} from "@tamagui/lucide-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import { BackButton, Button } from "@/components/ui";
import { useDeliveryDetailQuery } from "@teincfood/core";
import { formatPriceFromMinor } from "@teincfood/core";
import { DeliveryTimeline, getDeliveryStepIndex } from "@/components/tracking/DeliveryTimeline";

const DELIVERY_STATUS_COLORS = {
  assigned: "$orange9",
  picked_up: "$blue9",
  en_route: "$blue9",
  arrived: "$green9",
  delivered: "$gray9",
  failed: "$red9",
  returned_to_merchant: "$orange9",
  cancelled: "$red9",
};

const DEFAULT_REGION = {
  latitude: 5.6037,
  longitude: -0.187,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

export default function SellerDeliveryDetail({
  deliveryId: deliveryIdProp,
  embedded = false,
}: {
  deliveryId?: string;
  embedded?: boolean;
} = {}) {
  const router = useRouter();
  const media = useMedia();
  const params = useLocalSearchParams();
  const id = deliveryIdProp ?? (params.id as string);
  const insets = useSafeAreaInsets();

  const { data: response, isLoading, refetch, isRefetching } = useDeliveryDetailQuery(id as string);
  const delivery = response?.data ?? null;

  if (isLoading) {
    return (
      <YStack flex={1} backgroundColor="$background" justifyContent="center" alignItems="center" padding="$4">
        <Text fontSize="$5" color="$colorMuted">Loading delivery...</Text>
      </YStack>
    );
  }

  if (!delivery) {
    return (
      <YStack flex={1} backgroundColor="$background" justifyContent="center" alignItems="center" padding="$4">
        <Text fontSize="$5" color="$colorMuted">Delivery not found</Text>
        <Button marginTop="$4" onPress={() => router.back()}>Go Back</Button>
      </YStack>
    );
  }

  const hasCoords =
    typeof delivery.pickup?.lat === 'number' &&
    typeof delivery.dropoff?.lat === 'number';

  const mapRegion = hasCoords
    ? {
        latitude: (delivery.pickup.lat + delivery.dropoff.lat) / 2,
        longitude: (delivery.pickup.lng + delivery.dropoff.lng) / 2,
        latitudeDelta: Math.abs(delivery.pickup.lat - delivery.dropoff.lat) * 1.5 + 0.02,
        longitudeDelta: Math.abs(delivery.pickup.lng - delivery.dropoff.lng) * 1.5 + 0.02,
      }
    : DEFAULT_REGION;

  return (
    <YStack flex={1} paddingTop={embedded ? 0 : Math.max(insets.top + 8, 24)} paddingBottom={embedded ? 0 : insets.bottom + 16} backgroundColor="$background">
      {/* Header */}
      <XStack padding="$4" alignItems="center" gap="$3" borderBottomWidth={1} borderBottomColor="$borderColor">
        {embedded ? null : <BackButton />}
        <YStack flex={1}>
          <Text fontSize="$6" fontWeight="bold">Delivery</Text>
          <Text fontSize="$3" color="$colorMuted">{delivery.order_number || delivery.id}</Text>
        </YStack>
        <YStack
          paddingHorizontal="$3"
          paddingVertical="$1"
          borderRadius="$3"
          backgroundColor={DELIVERY_STATUS_COLORS[delivery.status] || "$gray9"}
        >
          <Text color="$background" fontSize="$3" fontWeight="600" textTransform="capitalize">
            {delivery.status?.replace(/_/g, " ")}
          </Text>
        </YStack>
      </XStack>

      <ScrollView
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} />}
      >
        <YStack padding="$4" gap="$4" {...(media.md || media.lg ? (embedded ? {} : { maxWidth: 600, alignSelf: "center", width: "100%" }) : {})}>
          {/* Map */}
          {hasCoords && (
            <Card padding="$0" bordered overflow="hidden" height={200}>
              <MapView
                style={{ flex: 1 }}
                provider={PROVIDER_GOOGLE}
                initialRegion={mapRegion}
                scrollEnabled={false}
                zoomEnabled={false}
              >
                <Marker
                  coordinate={{ latitude: delivery.pickup.lat, longitude: delivery.pickup.lng }}
                  title={delivery.pickup.name || "Pickup"}
                  pinColor="green"
                />
                <Marker
                  coordinate={{ latitude: delivery.dropoff.lat, longitude: delivery.dropoff.lng }}
                  title={delivery.dropoff.name || "Dropoff"}
                  pinColor="red"
                />
              </MapView>
            </Card>
          )}

          {/* Delivery Timeline */}
          <Card padding="$4" bordered>
            <YStack gap="$3">
              <Text fontSize="$4" fontWeight="bold">Progress</Text>
              <DeliveryTimeline currentStep={getDeliveryStepIndex(delivery.status)} status={delivery.status} />
            </YStack>
          </Card>

          {/* Pickup Location */}
          {delivery.pickup && (
            <Card padding="$4" bordered>
              <YStack gap="$2">
                <XStack alignItems="center" gap="$2">
                  <MapPin size={16} color="$green9" />
                  <Text fontSize="$4" fontWeight="bold">Pickup Location</Text>
                </XStack>
                <Text fontSize="$3" fontWeight="500">{delivery.pickup.name}</Text>
                <Text fontSize="$3" color="$colorMuted">{delivery.pickup.address}</Text>
                {delivery.pickup.phone && (
                  <Button variant="outline" size="$3" icon={<Phone size={14} />} width="50%" onPress={() => Linking.openURL(`tel:${delivery.pickup.phone}`)}>
                    Call Pickup
                  </Button>
                )}
              </YStack>
            </Card>
          )}

          {/* Dropoff Location */}
          {delivery.dropoff && (
            <Card padding="$4" bordered>
              <YStack gap="$2">
                <XStack alignItems="center" gap="$2">
                  <MapPin size={16} color="$red9" />
                  <Text fontSize="$4" fontWeight="bold">Dropoff Location</Text>
                </XStack>
                <Text fontSize="$3" fontWeight="500">{delivery.dropoff.name}</Text>
                <Text fontSize="$3" color="$colorMuted">{delivery.dropoff.address}</Text>
                {delivery.dropoff.notes && (
                  <Text fontSize="$3" color="$colorMuted">{delivery.dropoff.notes}</Text>
                )}
              </YStack>
            </Card>
          )}

          {/* Customer Info */}
          {delivery.customer && (
            <Card padding="$4" bordered>
              <YStack gap="$2">
                <Text fontSize="$4" fontWeight="bold">Customer</Text>
                <Separator />
                <Text fontSize="$4">{delivery.customer.name}</Text>
                {delivery.customer.phone && (
                  <Button variant="outline" size="$3" icon={<Phone size={14} />} width="50%" onPress={() => Linking.openURL(`tel:${delivery.customer.phone}`)}>
                    Call Customer
                  </Button>
                )}
              </YStack>
            </Card>
          )}

          {/* Order Items */}
          {delivery.items && delivery.items.length > 0 && (
            <Card padding="$4" bordered>
              <YStack gap="$3">
                <XStack alignItems="center" gap="$2">
                  <Package size={16} color="$colorMuted" />
                  <Text fontSize="$4" fontWeight="bold">Order Items</Text>
                </XStack>
                <Separator />
                {delivery.items.map((item, idx) => (
                  <XStack key={idx} justifyContent="space-between" alignItems="center">
                    <YStack flex={1}>
                      <Text fontSize="$4">{item.name}</Text>
                      <Text fontSize="$3" color="$colorMuted">Qty: {item.quantity}</Text>
                    </YStack>
                    <Text fontSize="$4" fontWeight="600">
                      {formatPriceFromMinor(item.price, delivery.currency)}
                    </Text>
                  </XStack>
                ))}
                <Separator />
                {delivery.order_total_minor != null && (
                  <XStack justifyContent="space-between">
                    <Text fontSize="$5" fontWeight="bold">Order Total</Text>
                    <Text fontSize="$5" fontWeight="bold">
                      {formatPriceFromMinor(delivery.order_total_minor, delivery.currency)}
                    </Text>
                  </XStack>
                )}
                {delivery.delivery_fee_minor != null && (
                  <XStack justifyContent="space-between">
                    <Text fontSize="$4" color="$colorMuted">Delivery Fee</Text>
                    <Text fontSize="$4" color="$colorMuted">
                      {formatPriceFromMinor(delivery.delivery_fee_minor, delivery.currency)}
                    </Text>
                  </XStack>
                )}
              </YStack>
            </Card>
          )}

          {/* Rider Info */}
          {delivery.status !== "assigned" && !["failed", "returned_to_merchant", "cancelled"].includes(delivery.status) && (
            <Card padding="$4" bordered backgroundColor="$blue2">
              <YStack gap="$2">
                <XStack alignItems="center" gap="$2">
                  <Bike size={16} color="$primary" />
                  <Text fontSize="$4" fontWeight="bold">Rider</Text>
                </XStack>
                <Text fontSize="$3">Rider is on the way</Text>
              </YStack>
            </Card>
          )}

          {/* View Order Button */}
          <Button
            variant="outline"
            icon={<Truck size={16} />}
            onPress={() => router.push(`/(seller)/orders/${delivery.order_id}`)}
          >
            View Full Order
          </Button>
        </YStack>
      </ScrollView>
    </YStack>
  );
}
