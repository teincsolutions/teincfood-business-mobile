// @ts-nocheck
import { useState, useEffect, useRef } from "react";
import {
  TouchableOpacity,
  StyleSheet,
  View,
  useWindowDimensions,
} from "react-native";
import { YStack, XStack, Text, Card, Button, Separator, Sheet } from "tamagui";
import {
  MapPin,
  Navigation,
  Clock,
  Phone,
  MessageCircle,
  ArrowLeft,
  Truck,
  Package,
} from "@tamagui/lucide-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MapView, { Marker, PROVIDER_GOOGLE, Polyline } from "react-native-maps";
import * as Location from "expo-location";
import polyline from "@mapbox/polyline";
import {
  useRiderProfileQuery,
  useRiderDeliveriesQuery,
} from "@teincfood/core";
import {
  getDirectionsPolyline,
  estimateDurationSeconds,
} from "@/services/directions.service";
import { phoenixSocket } from "@teincfood/core";

const DEFAULT_DELTA = 0.02;
const ACTIVE_STATUSES = ["assigned", "picked_up", "en_route", "arrived"];

export default function RiderMap() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { height: screenHeight } = useWindowDimensions();
  const params = useLocalSearchParams<{
    pickupLat?: string;
    pickupLng?: string;
    dropoffLat?: string;
    dropoffLng?: string;
    orderId?: string;
    orderNumber?: string;
    pickupAddress?: string;
    dropoffAddress?: string;
  }>();
  const mapRef = useRef<MapView>(null);
  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [pickupRouteCoords, setPickupRouteCoords] = useState([]);
  const [dropoffRouteCoords, setDropoffRouteCoords] = useState([]);
  const [pickupEtaSeconds, setPickupEtaSeconds] = useState(null);
  const [dropoffEtaSeconds, setDropoffEtaSeconds] = useState(null);
  const [riderLocation, setRiderLocation] = useState(null);
  const [initialRegion, setInitialRegion] = useState(null);
  const [locationLoading, setLocationLoading] = useState(true);

  const { data: profileData } = useRiderProfileQuery();
  const { data: deliveries = [] } = useRiderDeliveriesQuery();

  const riderId = profileData?.id;

  // Listen for location updates on the WebSocket channel
  useEffect(() => {
    if (!riderId) return;

    const topic = `location:rider:${riderId}`;

    phoenixSocket.connect().catch(() => {});

    const unsub = phoenixSocket.onFrame(
      topic,
      ([_joinRef, _ref, _topic, event, payload]) => {
        if (event === "location") {
          const { lat, lng } = payload;
          setRiderLocation({ latitude: lat, longitude: lng });
        }
      },
    );

    return () => {
      unsub();
    };
  }, [riderId]);

  // Center on rider's current location when map opens
  useEffect(() => {
    async function centerOnLocation() {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === "granted") {
          const loc = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          const { latitude, longitude } = loc.coords;
          const region = {
            latitude,
            longitude,
            latitudeDelta: DEFAULT_DELTA,
            longitudeDelta: DEFAULT_DELTA,
          };
          setInitialRegion(region);
          mapRef.current?.animateToRegion(region, 1000);
          setLocationLoading(false);
          return;
        }
      } catch {}

      if (profileData?.current_lat && profileData?.current_lng) {
        setInitialRegion({
          latitude: profileData.current_lat,
          longitude: profileData.current_lng,
          latitudeDelta: DEFAULT_DELTA,
          longitudeDelta: DEFAULT_DELTA,
        });
      }
      setLocationLoading(false);
    }

    centerOnLocation();
  }, [profileData?.current_lat, profileData?.current_lng]);

  // Build a virtual delivery from route params (navigated from deliveries screen)
  const routeParamsDelivery =
    params.pickupLat &&
    params.pickupLng &&
    params.dropoffLat &&
    params.dropoffLng
      ? {
          id: `route-${params.orderId || "custom"}`,
          order_id: params.orderId || "custom",
          order_number: params.orderNumber || "Delivery",
          pickup_lat: parseFloat(params.pickupLat),
          pickup_lng: parseFloat(params.pickupLng),
          dropoff_lat: parseFloat(params.dropoffLat),
          dropoff_lng: parseFloat(params.dropoffLng),
          status: "assigned",
          eta_minutes: null,
          pickup_name: params.pickupAddress || "Pickup",
          pickup: params.pickupAddress || "Pickup location",
          dropoff: params.dropoffAddress || "Dropoff location",
          currency: "GHS",
          earnings: 0,
        }
      : null;

  // Active deliveries with coordinates (for markers)
  const activeDeliveries = deliveries.filter(
    (d) => d.pickup_lat && d.pickup_lng && d.dropoff_lat && d.dropoff_lng,
  );

  // Include the route-param delivery if present
  const allRouteDeliveries = routeParamsDelivery
    ? [routeParamsDelivery, ...activeDeliveries]
    : activeDeliveries;

  // Auto-select — prefer route params delivery, else active delivery
  const activeDelivery =
    routeParamsDelivery ||
    activeDeliveries.find((d) => ACTIVE_STATUSES.includes(d.status));

  const riderLat = riderLocation?.latitude ?? profileData?.current_lat ?? null;
  const riderLng = riderLocation?.longitude ?? profileData?.current_lng ?? null;

  useEffect(() => {
    if (activeDelivery && !selectedDelivery) {
      setSelectedDelivery(activeDelivery);
    }
  }, [activeDelivery?.id]);

  // Draw the two legs separately so the rider can see:
  //   blue  — rider → restaurant/bus pickup
  //   orange — restaurant/bus → customer dropoff
  useEffect(() => {
    if (!selectedDelivery) {
      setPickupRouteCoords([]);
      setDropoffRouteCoords([]);
      setPickupEtaSeconds(null);
      setDropoffEtaSeconds(null);
      return;
    }

    const pickup = {
      latitude: selectedDelivery.pickup_lat,
      longitude: selectedDelivery.pickup_lng,
    };
    const dropoff = {
      latitude: selectedDelivery.dropoff_lat,
      longitude: selectedDelivery.dropoff_lng,
    };

    let cancelled = false;
    const hasRiderLocation = riderLat != null && riderLng != null;
    const rider = hasRiderLocation
      ? { latitude: riderLat, longitude: riderLng }
      : null;

    async function loadRoutes() {
      const [dropoffResult, pickupResult] = await Promise.all([
        getDirectionsPolyline({
          orderId: selectedDelivery.order_id,
          origin: pickup,
          destination: dropoff,
          leg: "dropoff",
        }),
        rider
          ? getDirectionsPolyline({
              orderId: selectedDelivery.order_id,
              origin: rider,
              destination: pickup,
              leg: "pickup",
            })
          : Promise.resolve(null),
      ]);

      if (cancelled) return;

      const decode = (encoded: string | null) =>
        encoded
          ? polyline
              .decode(encoded)
              .map(([lat, lng]) => ({ latitude: lat, longitude: lng }))
          : [];

      const dropoffCoords = decode(dropoffResult?.polyline ?? null);
      const pickupCoords = decode(pickupResult?.polyline ?? null);

      setDropoffRouteCoords(dropoffCoords);
      setPickupRouteCoords(pickupCoords);
      setDropoffEtaSeconds(
        dropoffResult?.durationSeconds ??
          dropoffResult?.staticDurationSeconds ??
          estimateDurationSeconds(pickup, dropoff),
      );
      setPickupEtaSeconds(
        rider
          ? (pickupResult?.durationSeconds ??
              pickupResult?.staticDurationSeconds ??
              estimateDurationSeconds(rider, pickup))
          : null,
      );

      const coordsToFit = [
        pickup,
        dropoff,
        ...(rider ? [rider] : []),
        ...pickupCoords,
        ...dropoffCoords,
      ];

      setTimeout(() => {
        mapRef.current?.fitToCoordinates(coordsToFit, {
          edgePadding: {
            top: 110,
            right: 60,
            bottom: Math.min(screenHeight * 0.45, 420) + 40,
            left: 60,
          },
          animated: true,
        });
      }, 250);
    }

    void loadRoutes();
    return () => {
      cancelled = true;
    };
  }, [selectedDelivery, riderLat, riderLng, screenHeight]);

  const getStatusColor = (status) => {
    switch (status) {
      case "picked_up":
        return "#3498db";
      case "assigned":
        return "#FFA500";
      case "en_route":
        return "#f39c12";
      case "arrived":
        return "#2ecc71";
      default:
        return "#95a5a6";
    }
  };

  const renderRiderMarker = () => {
    const lat = riderLocation?.latitude ?? profileData?.current_lat ?? null;
    const lng = riderLocation?.longitude ?? profileData?.current_lng ?? null;
    if (lat == null || lng == null) return null;

    const vehicleType = profileData?.vehicle_type;
    const vehicleColor =
      vehicleType === "motorcycle"
        ? "#f39c12"
        : vehicleType === "bicycle"
          ? "#2ecc71"
          : vehicleType === "car"
            ? "#3498db"
            : "#95a5a6";

    return (
      <Marker
        coordinate={{ latitude: lat, longitude: lng }}
        title="You"
        anchor={{ x: 0.5, y: 0.5 }}
      >
        <YStack
          width={40}
          height={40}
          borderRadius={20}
          backgroundColor={vehicleColor}
          alignItems="center"
          justifyContent="center"
          borderWidth={3}
          borderColor="white"
        >
          <Truck size={20} color="white" />
        </YStack>
      </Marker>
    );
  };

  return (
    <View style={styles.screen}>
      {/* Full-screen Map */}
      {initialRegion ? (
        <MapView
          ref={mapRef}
          style={StyleSheet.absoluteFillObject}
          provider={PROVIDER_GOOGLE}
          initialRegion={initialRegion}
          showsUserLocation
          showsMyLocationButton
          showsCompass
          mapPadding={{
            top: 60,
            bottom: selectedDelivery
              ? Math.min(screenHeight * 0.45, 420) + 16
              : 96,
            left: 16,
            right: 16,
          }}
        >
        {/* Pickup Markers (green) */}
        {allRouteDeliveries.map((delivery) => (
          <Marker
            key={`pickup-${delivery.id}`}
            coordinate={{
              latitude: delivery.pickup_lat,
              longitude: delivery.pickup_lng,
            }}
            title={`Pickup: ${delivery.order_number || "Delivery"}`}
            description={delivery.pickup || "Pickup location"}
            pinColor="#2ecc71"
            onPress={() => setSelectedDelivery(delivery)}
          />
        ))}

        {/* Dropoff Markers (red) */}
        {allRouteDeliveries.map((delivery) => (
          <Marker
            key={`dropoff-${delivery.id}`}
            coordinate={{
              latitude: delivery.dropoff_lat,
              longitude: delivery.dropoff_lng,
            }}
            title={`Dropoff: ${delivery.order_number || "Delivery"}`}
            description={delivery.dropoff || "Dropoff location"}
            pinColor="#e74c3c"
            onPress={() => setSelectedDelivery(delivery)}
          />
        ))}

        {/* Two thick route legs — pickup leg in blue, customer leg in orange. */}
        {pickupRouteCoords.length > 0 && (
          <Polyline
            coordinates={pickupRouteCoords}
            strokeColor="#2563EB"
            strokeWidth={8}
            lineCap="round"
            lineJoin="round"
            zIndex={2}
          />
        )}
        {dropoffRouteCoords.length > 0 && (
          <Polyline
            coordinates={dropoffRouteCoords}
            strokeColor="#F97316"
            strokeWidth={8}
            lineCap="round"
            lineJoin="round"
            zIndex={1}
          />
        )}

        {/* Rider vehicle marker */}
        {renderRiderMarker()}
      </MapView>
      ) : (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center' }]}>
          <Text>Loading map...</Text>
        </View>
      )}

      {/* Top Header Overlay */}
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
        <TouchableOpacity onPress={() => router.back()}>
          <YStack backgroundColor="$background" padding="$3" borderRadius="$10">
            <ArrowLeft size={20} color="$color" />
          </YStack>
        </TouchableOpacity>

        <YStack
          backgroundColor="$background"
          paddingHorizontal="$4"
          paddingVertical="$2"
          borderRadius="$10"
        >
          <Text fontWeight="bold" fontFamily="$heading">
            Live Map
          </Text>
        </YStack>

        <YStack width={44} />
      </XStack>

      {/* Route legend */}
      <XStack
        position="absolute"
        top={insets.top + 62}
        alignSelf="center"
        gap="$3"
        backgroundColor="$background"
        paddingHorizontal="$3"
        paddingVertical="$2"
        borderRadius="$10"
        opacity={0.96}
      >
        <XStack gap="$1.5" alignItems="center">
          <YStack width={18} height={5} borderRadius={3} backgroundColor="#2563EB" />
          <Text fontSize="$1" fontFamily="$body" color="$color">
            To pickup
          </Text>
        </XStack>
        <XStack gap="$1.5" alignItems="center">
          <YStack width={18} height={5} borderRadius={3} backgroundColor="#F97316" />
          <Text fontSize="$1" fontFamily="$body" color="$color">
            To customer
          </Text>
        </XStack>
      </XStack>

      {/* Tamagui bottom sheet with delivery details */}
      {selectedDelivery ? (
        <Sheet
          modal
          open
          onOpenChange={(open) => {
            if (!open) setSelectedDelivery(null);
          }}
          snapPoints={[55, 85]}
          dismissOnSnapToBottom
          position={0}
          zIndex={100_000}
        >
          <Sheet.Overlay
            animation="lazy"
            enterStyle={{ opacity: 0 }}
            exitStyle={{ opacity: 0 }}
            backgroundColor="rgba(0,0,0,0.35)"
          />
          <Sheet.Frame
            backgroundColor="$background"
            borderTopLeftRadius="$6"
            borderTopRightRadius="$6"
            padding="$5"
            maxHeight="90%"
          >
            <Sheet.Handle backgroundColor="$gray5" marginTop="$1" />
            <Sheet.ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 24) }}
            >
              <YStack gap="$4" pt="$3">
                {/* Header: order number + status */}
                <XStack justifyContent="space-between" alignItems="center">
                  <Text fontSize="$6" fontWeight="800" fontFamily="$heading">
                    {selectedDelivery.order_number}
                  </Text>
                  <YStack
                    backgroundColor={getStatusColor(selectedDelivery.status)}
                    paddingHorizontal="$3"
                    paddingVertical="$1"
                    borderRadius="$10"
                  >
                    <Text color="white" fontSize="$2" textTransform="capitalize">
                      {selectedDelivery.status.replace("_", " ")}
                    </Text>
                  </YStack>
                </XStack>

                <Separator />

                {/* Pickup */}
                <XStack gap="$3" alignItems="flex-start">
                  <MapPin size={18} color="$success" style={{ marginTop: 2 }} />
                  <YStack flex={1}>
                    <Text fontSize="$2" color="$colorSecondary" fontFamily="$body">
                      Pickup
                    </Text>
                    <Text fontSize="$4" fontWeight="600" fontFamily="$body">
                      {selectedDelivery.pickup_name ||
                        selectedDelivery.pickup ||
                        "Pickup"}
                    </Text>
                    {selectedDelivery.pickup_name &&
                    selectedDelivery.pickup &&
                    selectedDelivery.pickup !== selectedDelivery.pickup_name ? (
                      <Text
                        fontSize="$3"
                        color="$colorSecondary"
                        fontFamily="$body"
                      >
                        {selectedDelivery.pickup}
                      </Text>
                    ) : null}
                  </YStack>
                </XStack>

                {/* Dropoff */}
                <XStack gap="$3" alignItems="flex-start">
                  <Navigation size={18} color="$danger" style={{ marginTop: 2 }} />
                  <YStack flex={1}>
                    <Text fontSize="$2" color="$colorSecondary" fontFamily="$body">
                      Dropoff
                    </Text>
                    <Text fontSize="$4" fontWeight="600" fontFamily="$body">
                      {selectedDelivery.dropoff || "Dropoff location"}
                    </Text>
                  </YStack>
                </XStack>

                {/* Items count */}
                {selectedDelivery.items && selectedDelivery.items.length > 0 ? (
                  <XStack gap="$3" alignItems="center">
                    <Package size={18} color="$colorMuted" />
                    <Text fontSize="$4" fontFamily="$body">
                      {selectedDelivery.items.length} item
                      {selectedDelivery.items.length > 1 ? "s" : ""}
                    </Text>
                  </XStack>
                ) : null}

                {/* Separate ETAs for each route leg */}
                <XStack gap="$3" alignItems="center">
                  <YStack width={18} height={5} borderRadius={3} backgroundColor="#2563EB" />
                  <Clock size={16} color="$colorMuted" />
                  <Text fontSize="$4" fontFamily="$body">
                    To pickup:{" "}
                    {pickupEtaSeconds
                      ? `${Math.ceil(pickupEtaSeconds / 60)} min`
                      : "Locating..."}
                  </Text>
                </XStack>
                <XStack gap="$3" alignItems="center">
                  <YStack width={18} height={5} borderRadius={3} backgroundColor="#F97316" />
                  <Clock size={16} color="$colorMuted" />
                  <Text fontSize="$4" fontFamily="$body">
                    To customer:{" "}
                    {dropoffEtaSeconds
                      ? `${Math.ceil(dropoffEtaSeconds / 60)} min`
                      : selectedDelivery.eta_minutes
                        ? `${selectedDelivery.eta_minutes} min`
                        : "Calculating..."}
                  </Text>
                </XStack>

                <Separator />

                {/* Action buttons */}
                <XStack gap="$3">
                  <Button
                    circular
                    width={48}
                    height={48}
                    variant="outline"
                    icon={<Phone size={20} />}
                    onPress={() => {}}
                  />
                  <Button
                    circular
                    width={48}
                    height={48}
                    variant="outline"
                    icon={<MessageCircle size={20} />}
                    onPress={() => {}}
                  />
                  <Button
                    flex={1}
                    height={48}
                    backgroundColor="$primary"
                    onPress={() =>
                      router.push(`/(rider)/deliveries/${selectedDelivery.id}`)
                    }
                  >
                    Details
                  </Button>
                </XStack>

                {/* Close button */}
                <Button variant="ghost" onPress={() => setSelectedDelivery(null)}>
                  Close
                </Button>
              </YStack>
            </Sheet.ScrollView>
          </Sheet.Frame>
        </Sheet>
      ) : (
        /* Quick Actions (when no delivery selected) */
        <YStack
          position="absolute"
          bottom={insets.bottom + 20}
          left="$4"
          right="$4"
          gap="$3"
        >
          <Card padding="$4" bordered backgroundColor="$background">
            <YStack gap="$3">
              <Text fontSize="$5" fontWeight="bold" fontFamily="$heading">
                {allRouteDeliveries.length > 0
                  ? `Tap a marker to see delivery details`
                  : "No active deliveries"}
              </Text>
              <XStack gap="$3">
                <Button
                  flex={1}
                  variant="outline"
                  onPress={() => router.push("/(rider)/deliveries")}
                >
                  View All Deliveries
                </Button>
                <Button
                  flex={1}
                  backgroundColor="$primary"
                  onPress={() => router.back()}
                >
                  Back to Home
                </Button>
              </XStack>
            </YStack>
          </Card>
        </YStack>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
});
