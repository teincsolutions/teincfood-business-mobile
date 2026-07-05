// @ts-nocheck
import { useRef, useState, useEffect, useCallback } from "react";
import { ScrollView, TouchableOpacity, Linking, Platform, StyleSheet, View, useWindowDimensions } from "react-native";
import { YStack, XStack, Text, Card, Separator, Avatar, Sheet } from "tamagui";
import {
  MapPin,
  Navigation,
  Clock,
  Package,
  Phone,
  MessageCircle,
  User,
  DollarSign,
  Truck,
  ChefHat,
  Check,
  LocateFixed,
} from "@tamagui/lucide-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from "react-native-maps";
import polyline from "@mapbox/polyline";
import {
  useDeliveryDetailQuery,
  useUpdateDeliveryStatusMutation,
} from "@/hooks/useRider";
import type { RiderDeliveryDetail } from "@/types/api/rider.api";
import { BackButton, Button } from "@/components/ui";
import { formatPrice, DEFAULT_CURRENCY } from "@/utils/currency";
import { useRiderDeliveryRealtimeUpdates } from "@/hooks/useRiderDeliveryRealtimeUpdates";
import { DeliveryTimeline, getDeliveryStepIndex } from "@/components/tracking/DeliveryTimeline";
import { extractApiErrorMessage } from "@/utils/error";
import { getDirectionsPolyline, estimateDurationSeconds } from "@/services/directions.service";
import { toast } from "sonner-native";

const MAP_HEIGHT = 280;
const DEFAULT_REGION = {
  latitude: 5.6037,
  longitude: -0.187,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

function isNum(v: unknown): v is number {
  return typeof v === 'number' && Number.isFinite(v);
}

export default function RiderDeliveryDetails() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const { height: screenHeight } = useWindowDimensions();

  useRiderDeliveryRealtimeUpdates();

  const { data: response, isLoading } = useDeliveryDetailQuery(id as string);
  const delivery = response?.data ?? null;
  const updateStatus = useUpdateDeliveryStatusMutation();

  // Map
  const mapRef = useRef<MapView>(null);
  const [routeCoords, setRouteCoords] = useState<{ latitude: number; longitude: number }[]>([]);
  const [routeEtaSeconds, setRouteEtaSeconds] = useState<number | null>(null);
  const [issueSheetOpen, setIssueSheetOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<string | null>(null);

  // Pickup and dropoff coords
  const pickupPos = {
    lat: isNum(delivery?.pickup?.lat) ? delivery!.pickup!.lat : (isNum(delivery?.pickup_lat) ? delivery!.pickup_lat : null),
    lng: isNum(delivery?.pickup?.lng) ? delivery!.pickup!.lng : (isNum(delivery?.pickup_lng) ? delivery!.pickup_lng : null),
  };
  const dropoffPos = {
    lat: isNum(delivery?.dropoff?.lat) ? delivery!.dropoff!.lat : (isNum(delivery?.dropoff_lat) ? delivery!.dropoff_lat : null),
    lng: isNum(delivery?.dropoff?.lng) ? delivery!.dropoff!.lng : (isNum(delivery?.dropoff_lng) ? delivery!.dropoff_lng : null),
  };
  const hasPickup = isNum(pickupPos.lat) && isNum(pickupPos.lng);
  const hasDropoff = isNum(dropoffPos.lat) && isNum(dropoffPos.lng);

  // Fit map to markers when delivery loads
  const prevHasCoords = useRef(false);
  useEffect(() => {
    const hasCoords = hasPickup || hasDropoff;
    if (hasCoords && hasCoords !== prevHasCoords.current) {
      prevHasCoords.current = hasCoords;
      const coords: { latitude: number; longitude: number }[] = [];
      if (hasPickup) coords.push({ latitude: pickupPos.lat!, longitude: pickupPos.lng! });
      if (hasDropoff) coords.push({ latitude: dropoffPos.lat!, longitude: dropoffPos.lng! });
      if (coords.length > 0) {
        setTimeout(() => {
          mapRef.current?.fitToCoordinates(coords, {
            edgePadding: { top: 40, bottom: 40, left: 40, right: 40 },
            animated: true,
          });
        }, 300);
      }
    }
  }, [hasPickup, hasDropoff]);

  // Fetch route polyline
  useEffect(() => {
    if (!hasPickup || !hasDropoff) {
      setRouteCoords([]);
      return;
    }

    const origin = { latitude: pickupPos.lat!, longitude: pickupPos.lng! };
    const destination = { latitude: dropoffPos.lat!, longitude: dropoffPos.lng! };

    const immediateEta = estimateDurationSeconds(origin, destination);
    setRouteEtaSeconds(immediateEta);

    getDirectionsPolyline({
      orderId: delivery!.order_id,
      origin,
      destination,
    }).then(({ polyline: encoded, durationSeconds, staticDurationSeconds }) => {
      const eta = durationSeconds ?? staticDurationSeconds ?? immediateEta;
      setRouteEtaSeconds(eta);

      if (encoded) {
        const decoded = polyline.decode(encoded);
        const coords = decoded.map(([lat, lng]: [number, number]) => ({
          latitude: lat,
          longitude: lng,
        }));
        setRouteCoords(coords);
      }
    });
  }, [id, hasPickup, hasDropoff]);

  const fitMapMarkers = useCallback(() => {
    const coords: { latitude: number; longitude: number }[] = [];
    if (hasPickup) coords.push({ latitude: pickupPos.lat!, longitude: pickupPos.lng! });
    if (hasDropoff) coords.push({ latitude: dropoffPos.lat!, longitude: dropoffPos.lng! });
    if (coords.length > 0) {
      mapRef.current?.fitToCoordinates(coords, {
        edgePadding: { top: 40, bottom: 40, left: 40, right: 40 },
        animated: true,
      });
    }
  }, [hasPickup, hasDropoff, pickupPos, dropoffPos]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "assigned": return "#FFA500";
      case "picked_up": return "#3498db";
      case "en_route": return "#f39c12";
      case "arrived": return "#2ecc71";
      case "delivered": return "$success";
      default: return "#95a5a6";
    }
  };

  const handleStatusUpdate = (newStatus: string) => {
    if (id) {
      updateStatus.mutate(
        { deliveryId: id as string, action: newStatus },
        {
          onSuccess: () => {
            if (newStatus === "confirm-pickup") {
              toast.success("Pickup confirmed! Awaiting merchant handover.");
            } else if (newStatus === "in-transit") {
              toast.success("En route to dropoff!");
            } else if (newStatus === "arrived") {
              toast.success("Arrived at dropoff!");
            } else if (newStatus === "delivered") {
              toast.success("Delivery completed!");
            } else if (newStatus === "failed") {
              toast.success("Delivery marked as failed.");
            } else if (newStatus === "returned") {
              toast.success("Delivery returned to merchant.");
            }
          },
          onError: (error) => {
            console.debug("[handleStatusUpdate] error", { deliveryId: id, action: newStatus, error });
            toast.error(extractApiErrorMessage(error));
          },
        },
      );
    }
  };

  const handleCall = (phoneNumber: string) => {
    const url = Platform.OS === "ios" ? `telprompt:${phoneNumber}` : `tel:${phoneNumber}`;
    Linking.openURL(url);
  };

  if (isLoading || !delivery) {
    return (
      <YStack flex={1} backgroundColor="$background" justifyContent="center" alignItems="center">
        <Text>Loading...</Text>
      </YStack>
    );
  }

  return (
    <View style={styles.screen}>
      {/* Map Header */}
      <View style={{ height: MAP_HEIGHT + insets.top }}>
        <MapView
          ref={mapRef}
          style={StyleSheet.absoluteFillObject}
          provider={PROVIDER_GOOGLE}
          initialRegion={DEFAULT_REGION}
          mapPadding={{ top: insets.top + 60, bottom: 16, left: 16, right: 16 }}
          scrollEnabled={false}
          zoomEnabled={false}
        >
          {hasPickup && (
            <Marker
              coordinate={{ latitude: pickupPos.lat!, longitude: pickupPos.lng! }}
              title={`Pickup: ${delivery.pickup?.name || "Restaurant"}`}
              description={delivery.pickup?.address || ""}
            >
              <YStack bg="$success" borderRadius="$full" p="$2" borderWidth={2} borderColor="white" alignItems="center" justifyContent="center">
                <ChefHat size={18} color="white" />
              </YStack>
            </Marker>
          )}

          {hasDropoff && (
            <Marker
              coordinate={{ latitude: dropoffPos.lat!, longitude: dropoffPos.lng! }}
              title={`Dropoff: ${delivery.dropoff?.name || "Customer"}`}
              description={delivery.dropoff?.address || ""}
            >
              <YStack bg="$primary" borderRadius="$full" p="$2" borderWidth={2} borderColor="white" alignItems="center" justifyContent="center">
                <MapPin size={18} color="white" />
              </YStack>
            </Marker>
          )}

          {routeCoords.length > 0 && (
            <Polyline
              coordinates={routeCoords}
              strokeColor="#3498db"
              strokeWidth={4}
              lineDashPattern={[1]}
            />
          )}
        </MapView>
      </View>

      {/* Header overlay */}
      <XStack
        position="absolute"
        top={insets.top}
        left={0}
        right={0}
        paddingHorizontal="$4"
        paddingVertical="$3"
        justifyContent="space-between"
        alignItems="center"
      >
        <BackButton />

        <XStack gap="$2" alignItems="center">
          <YStack
            backgroundColor={getStatusColor(delivery.status)}
            paddingHorizontal="$3"
            paddingVertical="$1"
            borderRadius="$10"
          >
            <Text color="white" fontSize="$2" textTransform="capitalize">
              {delivery.status.replace("_", " ")}
            </Text>
          </YStack>
        </XStack>

        <TouchableOpacity onPress={fitMapMarkers}>
          <YStack backgroundColor="$background" padding="$2" borderRadius="$10" borderWidth={1} borderColor="$borderColor">
            <LocateFixed size={20} color="$color" />
          </YStack>
        </TouchableOpacity>
      </XStack>

      {/* Scrollable content below map */}
      <ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
      >
        <YStack padding="$4" gap="$4">
          {/* Order Info */}
          <Card padding="$4" bordered>
            <YStack gap="$3">
              <XStack justifyContent="space-between" alignItems="center">
                <Text fontSize="$5" fontWeight="bold">
                  {delivery.order_number}
                </Text>
                <XStack gap="$2" alignItems="center">
                  <Clock size={16} color="$colorMuted" />
                  <Text fontSize="$3" color="$colorMuted">
                    {routeEtaSeconds
                      ? `${Math.ceil(routeEtaSeconds / 60)} min`
                      : delivery.eta_minutes
                        ? `${delivery.eta_minutes} min`
                        : "--"}
                  </Text>
                </XStack>
              </XStack>
              <Separator />
              <XStack gap="$3" alignItems="center">
                <DollarSign size={16} color="$colorMuted" />
                <Text fontSize="$5" fontWeight="bold" color="$success">
                  +{formatPrice(
                    (delivery.delivery_fee_minor ?? 0) / 100,
                    delivery.currency || DEFAULT_CURRENCY,
                  )}
                </Text>
              </XStack>
            </YStack>
          </Card>

          {/* Customer Info */}
          <Card padding="$4" bordered>
            <YStack gap="$3">
              <Text fontSize="$5" fontWeight="bold">Customer</Text>
              <Separator />
              <XStack gap="$3" alignItems="center">
                <Avatar circular size="$10">
                  <Avatar.Fallback items="center" justify="center" backgroundColor="$primary">
                    <User size="$6" color="white" />
                  </Avatar.Fallback>
                </Avatar>
                <YStack flex={1}>
                  <Text fontWeight="bold">{delivery.customer?.name}</Text>
                  <Text fontSize="$3" color="$colorMuted">
                    {delivery.customer?.phone}
                  </Text>
                </YStack>
              </XStack>
              <XStack gap="$3">
                <Button
                  flex={1}
                  variant="outline"
                  icon={<Phone size={18} />}
                  onPress={() => delivery.customer?.phone && handleCall(delivery.customer.phone)}
                >
                  Call
                </Button>
                <Button
                  flex={1}
                  variant="outline"
                  icon={<MessageCircle size={18} />}
                  onPress={() => {
                    const uid = delivery.customer?.user_id;
                    if (uid) {
                      router.push({ pathname: '/(communication)/chat/order', params: { userId: uid, orderId: delivery.order_id } });
                    }
                  }}
                >
                  Message
                </Button>
              </XStack>
            </YStack>
          </Card>

          {/* Pickup Location */}
          <Card padding="$4" bordered>
            <YStack gap="$3">
              <XStack gap="$2" alignItems="center">
                <ChefHat size={20} color="$success" />
                <Text fontSize="$5" fontWeight="bold">Pickup Location</Text>
              </XStack>
              <Separator />
              <YStack gap="$2">
                <Text fontWeight="bold">{delivery.pickup?.name}</Text>
                <Text color="$colorMuted">{delivery.pickup?.address}</Text>
                {delivery.pickup?.phone && (
                  <Text color="$colorMuted" fontSize="$3">{delivery.pickup.phone}</Text>
                )}
              </YStack>
              {hasPickup && (
                <Button
                  variant="outline"
                  icon={<Navigation size={18} />}
                  onPress={() => {
                    const data = {
                      name: delivery.pickup?.name,
                      address: delivery.pickup?.address,
                      phone: delivery.pickup?.phone,
                      lat: delivery.pickup?.lat,
                      lng: delivery.pickup?.lng,
                      userId: delivery.customer?.user_id,
                      orderId: delivery.order_id,
                    };
                    router.push(`/(rider)/navigate/${encodeURIComponent(JSON.stringify(data))}`);
                  }}
                  width="100%"
                >
                  Navigate to Pickup
                </Button>
              )}
            </YStack>
          </Card>

          {/* Dropoff Location */}
          <Card padding="$4" bordered backgroundColor="$blue2">
            <YStack gap="$3">
              <XStack gap="$2" alignItems="center">
                <MapPin size={20} color="$primary" />
                <Text fontSize="$5" fontWeight="bold">Dropoff Location</Text>
              </XStack>
              <Separator />
              <YStack gap="$2">
                <Text fontWeight="bold">{delivery.dropoff?.name}</Text>
                <Text color="$colorMuted">{delivery.dropoff?.address}</Text>
                {delivery.dropoff?.notes && (
                  <YStack backgroundColor="$yellow2" padding="$2" borderRadius="$2">
                    <Text fontSize="$3" color="$orange10">
                      Note: {delivery.dropoff.notes}
                    </Text>
                  </YStack>
                )}
              </YStack>
              {hasDropoff && (
                <Button
                  backgroundColor="$primary"
                  width="100%"
                  icon={<Navigation size={18} />}
                  onPress={() => {
                    const data = {
                      name: delivery.dropoff?.name,
                      address: delivery.dropoff?.address,
                      phone: delivery.dropoff?.phone,
                      lat: delivery.dropoff?.lat,
                      lng: delivery.dropoff?.lng,
                      notes: delivery.dropoff?.notes,
                      userId: delivery.customer?.user_id,
                      orderId: delivery.order_id,
                    };
                    router.push(`/(rider)/navigate/${encodeURIComponent(JSON.stringify(data))}`);
                  }}
                >
                  Navigate to Dropoff
                </Button>
              )}
            </YStack>
          </Card>

          {/* Order Items */}
          <Card padding="$4" bordered>
            <YStack gap="$3">
              <XStack gap="$2" alignItems="center">
                <Package size={20} color="$colorMuted" />
                <Text fontSize="$5" fontWeight="bold">Order Items</Text>
              </XStack>
              <Separator />
              {delivery.items?.map((item, index) => (
                <XStack key={index} justifyContent="space-between" alignItems="center">
                  <YStack>
                    <Text fontWeight="bold">{item.name}</Text>
                    <Text fontSize="$2" color="$colorMuted">Qty: {item.quantity}</Text>
                  </YStack>
                  <Text fontWeight="bold">
                    {formatPrice((item.price * item.quantity) / 100, delivery.currency || DEFAULT_CURRENCY)}
                  </Text>
                </XStack>
              ))}
              <Separator />
              <XStack justifyContent="space-between">
                <Text color="$colorMuted">Order Total</Text>
                <Text>
                  {formatPrice((delivery.order_total_minor ?? 0) / 100, delivery.currency || DEFAULT_CURRENCY)}
                </Text>
              </XStack>
              <XStack justifyContent="space-between">
                <Text color="$colorMuted">Delivery Fee</Text>
                <Text>
                  {formatPrice((delivery.delivery_fee_minor ?? 0) / 100, delivery.currency || DEFAULT_CURRENCY)}
                </Text>
              </XStack>
              <XStack justifyContent="space-between">
                <Text fontWeight="bold" color="$success">Your Earnings</Text>
                <Text fontWeight="bold" color="$success">
                  {formatPrice((delivery.delivery_fee_minor ?? 0) / 100, delivery.currency || DEFAULT_CURRENCY)}
                </Text>
              </XStack>
            </YStack>
          </Card>

          {/* Delivery Timeline */}
          <Card padding="$4" bordered>
            <DeliveryTimeline
              currentStep={getDeliveryStepIndex(delivery.status)}
              status={delivery.status}
            />
          </Card>

          {/* Action Buttons */}
          <YStack gap="$3">
            {delivery.status === "assigned" &&
              (delivery.rider_pickup_confirmed_at ? (
                <Button
                  size="$5"
                  backgroundColor="$yellow10"
                  disabled
                  icon={<Check size={18} />}
                >
                  Awaiting merchant handover
                </Button>
              ) : (
                <Button
                  size="$5"
                  backgroundColor="$primary"
                  onPress={() => handleStatusUpdate("confirm-pickup")}
                  disabled={updateStatus.isPending}
                >
                  {updateStatus.isPending ? "Confirming..." : "Confirm Pickup"}
                </Button>
              ))}
            {delivery.status === "picked_up" && (
              <Button
                size="$5"
                width="100%"
                backgroundColor="#f39c12"
                onPress={() => handleStatusUpdate("in-transit")}
              >
                Start Delivery
              </Button>
            )}
            {delivery.status === "en_route" && (
              <Button
                size="$5"
                backgroundColor="#3498db"
                onPress={() => handleStatusUpdate("arrived")}
              >
                Arrived at Dropoff
              </Button>
            )}
            {delivery.status === "arrived" && (
              <Button
                size="$5"
                backgroundColor="$success"
                onPress={() => setConfirmAction("delivered")}
              >
                Complete Delivery
              </Button>
            )}
            {delivery.status === "delivered" && (
              <Card padding="$4" bordered backgroundColor="$green2">
                <YStack alignItems="center" gap="$2">
                  <Text fontSize="$6">✓</Text>
                  <Text fontSize="$5" fontWeight="bold" color="$success">
                    Delivery Completed!
                  </Text>
                  <Text color="$colorMuted">
                    You earned {formatPrice(
                      (delivery.delivery_fee_minor ?? 0) / 100,
                      delivery.currency || DEFAULT_CURRENCY,
                    )}
                  </Text>
                </YStack>
              </Card>
            )}
            {["picked_up", "en_route", "arrived"].includes(delivery.status) && (
              <Button
                size="$5"
                variant="outline"
                borderColor="$red10"
                color="$red10"
                onPress={() => setIssueSheetOpen(true)}
              >
                Report Issue
              </Button>
            )}
          </YStack>
        </YStack>
      </ScrollView>

      {/* Confirm Complete Delivery */}
      <Sheet
        modal
        open={confirmAction === "delivered"}
        onOpenChange={(open) => { if (!open) setConfirmAction(null); }}
        snapPoints={[35]}
        dismissOnSnapToBottom
        zIndex={200_000}
      >
        <Sheet.Overlay animation="lazy" enterStyle={{ opacity: 0 }} exitStyle={{ opacity: 0 }} backgroundColor="rgba(0,0,0,0.5)" />
        <Sheet.Frame backgroundColor="$background" borderTopLeftRadius="$6" borderTopRightRadius="$6" padding="$6">
          <Sheet.Handle backgroundColor="$gray5" marginTop="$2" />
          <YStack gap="$4" alignItems="center" paddingTop="$4">
            <Text fontSize="$6" fontWeight="bold">Complete Delivery?</Text>
            <Text fontSize="$4" color="$colorMuted" textAlign="center">
              Confirm that you have handed the order to the customer.
            </Text>
            <XStack gap="$3" width="100%">
              <Button flex={1} variant="outline" onPress={() => setConfirmAction(null)}>Cancel</Button>
              <Button flex={1} backgroundColor="$success" onPress={() => { setConfirmAction(null); handleStatusUpdate("delivered"); }}>Confirm</Button>
            </XStack>
          </YStack>
        </Sheet.Frame>
      </Sheet>

      {/* Report Issue Sheet */}
      <Sheet
        modal
        open={issueSheetOpen}
        onOpenChange={setIssueSheetOpen}
        snapPoints={[40]}
        dismissOnSnapToBottom
        zIndex={200_000}
      >
        <Sheet.Overlay animation="lazy" enterStyle={{ opacity: 0 }} exitStyle={{ opacity: 0 }} backgroundColor="rgba(0,0,0,0.5)" />
        <Sheet.Frame backgroundColor="$background" borderTopLeftRadius="$6" borderTopRightRadius="$6" padding="$6">
          <Sheet.Handle backgroundColor="$gray5" marginTop="$2" />
          <YStack gap="$4" paddingTop="$4">
            <Text fontSize="$6" fontWeight="bold">Report Issue</Text>
            <Button size="$5" backgroundColor="$red10" onPress={() => { setIssueSheetOpen(false); setConfirmAction("failed"); }}>
              Customer Not Found — Mark Failed
            </Button>
            <Button size="$5" backgroundColor="$orange10" onPress={() => { setIssueSheetOpen(false); setConfirmAction("returned"); }}>
              Return to Merchant
            </Button>
            <Button size="$5" variant="outline" onPress={() => setIssueSheetOpen(false)}>Cancel</Button>
          </YStack>
        </Sheet.Frame>
      </Sheet>

      {/* Confirm Failed/Returned */}
      <Sheet
        modal
        open={confirmAction === "failed" || confirmAction === "returned"}
        onOpenChange={(open) => { if (!open) setConfirmAction(null); }}
        snapPoints={[35]}
        dismissOnSnapToBottom
        zIndex={200_000}
      >
        <Sheet.Overlay animation="lazy" enterStyle={{ opacity: 0 }} exitStyle={{ opacity: 0 }} backgroundColor="rgba(0,0,0,0.5)" />
        <Sheet.Frame backgroundColor="$background" borderTopLeftRadius="$6" borderTopRightRadius="$6" padding="$6">
          <Sheet.Handle backgroundColor="$gray5" marginTop="$2" />
          <YStack gap="$4" alignItems="center" paddingTop="$4">
            <Text fontSize="$6" fontWeight="bold">
              {confirmAction === "failed" ? "Mark as Failed?" : "Return to Merchant?"}
            </Text>
            <Text fontSize="$4" color="$colorMuted" textAlign="center">
              {confirmAction === "failed"
                ? "This will end the delivery and mark it as failed."
                : "This will end the delivery and return the order to the merchant."}
            </Text>
            <XStack gap="$3" width="100%">
              <Button flex={1} variant="outline" onPress={() => setConfirmAction(null)}>Cancel</Button>
              <Button flex={1} backgroundColor="$red10" onPress={() => { const action = confirmAction; setConfirmAction(null); handleStatusUpdate(action!); }}>Confirm</Button>
            </XStack>
          </YStack>
        </Sheet.Frame>
      </Sheet>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#FFFFFF" },
});
