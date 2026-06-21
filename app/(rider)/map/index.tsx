// @ts-nocheck
import { useState, useEffect, useRef, useCallback } from "react";
import {
  TouchableOpacity,
  StyleSheet,
  View,
  useWindowDimensions,
} from "react-native";
import { YStack, XStack, Text, Card, Button, Separator } from "tamagui";
import {
  MapPin,
  Navigation,
  Clock,
  Phone,
  MessageCircle,
  ArrowLeft,
  Truck,
} from "@tamagui/lucide-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MapView, { Marker, PROVIDER_GOOGLE, Polyline } from "react-native-maps";
import * as Location from "expo-location";
import polyline from "@mapbox/polyline";
import BottomSheet, { BottomSheetScrollView } from "@gorhom/bottom-sheet";
import {
  useRiderProfileQuery,
  useRiderDeliveriesQuery,
} from "@/hooks/useRider";
import {
  getDirectionsPolyline,
  estimateDurationSeconds,
} from "@/services/directions.service";
import { phoenixSocket } from "@/services/phoenix-socket.service";

const ACCRA_REGION = {
  latitude: 5.6037,
  longitude: -0.187,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

const ACTIVE_STATUSES = ["assigned", "picked_up", "en_route", "arrived"];

export default function RiderMap() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { height: screenHeight } = useWindowDimensions();
  const SNAP_POINTS = ["20%", "50%", "80%"];
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
  const sheetRef = useRef<BottomSheet>(null);
  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [routeCoords, setRouteCoords] = useState([]);
  const [routeEtaSeconds, setRouteEtaSeconds] = useState(null);
  const [riderLocation, setRiderLocation] = useState(null);
  const [initialRegion, setInitialRegion] = useState(ACCRA_REGION);
  const [mapBottomPad, setMapBottomPad] = useState(screenHeight * 0.2);

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
            latitudeDelta: 0.02,
            longitudeDelta: 0.02,
          };
          setInitialRegion(region);
          mapRef.current?.animateToRegion(region, 1000);
          return;
        }
      } catch {}

      if (profileData?.current_lat && profileData?.current_lng) {
        setInitialRegion({
          latitude: profileData.current_lat,
          longitude: profileData.current_lng,
          ...ACCRA_REGION,
        });
      }
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

  useEffect(() => {
    if (activeDelivery && !selectedDelivery) {
      setSelectedDelivery(activeDelivery);
    }
  }, [activeDelivery?.id]);

  // Fetch route polyline when selected delivery changes
  useEffect(() => {
    if (!selectedDelivery) {
      setRouteCoords([]);
      return;
    }

    const origin = {
      latitude: selectedDelivery.pickup_lat,
      longitude: selectedDelivery.pickup_lng,
    };
    const destination = {
      latitude: selectedDelivery.dropoff_lat,
      longitude: selectedDelivery.dropoff_lng,
    };

    // Set immediate offline ETA estimate
    const immediateEta = estimateDurationSeconds(origin, destination);
    setRouteEtaSeconds(immediateEta);

    getDirectionsPolyline({
      orderId: selectedDelivery.order_id,
      origin,
      destination,
    }).then(({ polyline: encoded, durationSeconds, staticDurationSeconds }) => {
      const eta =
        durationSeconds ??
        staticDurationSeconds ??
        estimateDurationSeconds(origin, destination);
      setRouteEtaSeconds(eta);

      if (encoded) {
        const decoded = polyline.decode(encoded);
        const coords = decoded.map(([lat, lng]) => ({
          latitude: lat,
          longitude: lng,
        }));
        setRouteCoords(coords);

        setTimeout(() => {
          if (mapRef.current) {
            mapRef.current.fitToCoordinates([origin, destination, ...coords], {
              edgePadding: {
                top: 100,
                right: 50,
                bottom: mapBottomPad + 40,
                left: 50,
              },
              animated: true,
            });
          }
        }, 300);
      }
    });
  }, [selectedDelivery]);

  // Dynamic map padding when sheet changes
  const handleSheetChange = useCallback(
    (index: number) => {
      const pad = screenHeight * (parseFloat(SNAP_POINTS[index]) / 100);
      setMapBottomPad(pad);
    },
    [screenHeight, SNAP_POINTS],
  );

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
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFillObject}
        provider={PROVIDER_GOOGLE}
        initialRegion={initialRegion}
        showsUserLocation
        showsMyLocationButton
        showsCompass
        mapPadding={{ top: 60, bottom: mapBottomPad + 16, left: 16, right: 16 }}
      >
        {/* Pickup Markers (green) */}
        {allRouteDeliveries.map((delivery) => (
          <Marker
            key={`pickup-${delivery.id}`}
            coordinate={{
              latitude: delivery.pickup_lat,
              longitude: delivery.pickup_lng,
            }}
            title={`Pickup: ${delivery.order_id}`}
            description={delivery.pickup || "Pickup location"}
            pinColor="#2ecc71"
            onPress={() => {
              setSelectedDelivery(delivery);
              sheetRef.current?.snapToIndex(0);
            }}
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
            title={`Dropoff: ${delivery.order_id}`}
            description={delivery.dropoff || "Dropoff location"}
            pinColor="#e74c3c"
            onPress={() => {
              setSelectedDelivery(delivery);
              sheetRef.current?.snapToIndex(0);
            }}
          />
        ))}

        {/* Route Polyline */}
        {routeCoords.length > 0 && (
          <Polyline
            coordinates={routeCoords}
            strokeColor="#3498db"
            strokeWidth={4}
            lineDashPattern={[1]}
          />
        )}

        {/* Rider vehicle marker */}
        {renderRiderMarker()}
      </MapView>

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

      {/* Bottom Sheet with delivery details */}
      {selectedDelivery ? (
        <BottomSheet
          ref={sheetRef}
          snapPoints={SNAP_POINTS}
          index={0}
          onChange={handleSheetChange}
          backgroundStyle={styles.sheetBg}
          handleIndicatorStyle={styles.sheetHandle}
          enableContentPanningGesture
          enableHandlePanningGesture
        >
          <BottomSheetScrollView
            contentContainerStyle={{
              paddingHorizontal: 20,
              paddingBottom: Math.max(insets.bottom, 24),
            }}
            showsVerticalScrollIndicator={false}
          >
            <YStack gap="$4" pt="$2">
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
                  <Text
                    fontSize="$2"
                    color="$colorSecondary"
                    fontFamily="$body"
                  >
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
                <Navigation
                  size={18}
                  color="$danger"
                  style={{ marginTop: 2 }}
                />
                <YStack flex={1}>
                  <Text
                    fontSize="$2"
                    color="$colorSecondary"
                    fontFamily="$body"
                  >
                    Dropoff
                  </Text>
                  <Text fontSize="$4" fontFamily="$body">
                    {selectedDelivery.dropoff || "Dropoff location"}
                  </Text>
                </YStack>
              </XStack>

              {/* ETA */}
              <XStack gap="$3" alignItems="center">
                <Clock size={18} color="$colorMuted" />
                <Text fontSize="$4" fontFamily="$body">
                  ETA:{" "}
                  {routeEtaSeconds
                    ? `${Math.ceil(routeEtaSeconds / 60)} min`
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
          </BottomSheetScrollView>
        </BottomSheet>
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
  sheetBg: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    shadowColor: "rgba(0,0,0,0.12)",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 8,
  },
  sheetHandle: {
    backgroundColor: "#D1D3D9",
    width: 32,
    height: 4,
    borderRadius: 2,
  },
});
