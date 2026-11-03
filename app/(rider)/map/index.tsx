// @ts-nocheck
import { useState, useEffect, useRef } from "react";
import { TouchableOpacity, StyleSheet, View } from "react-native";
import { YStack, XStack, Text } from "tamagui";
import { ArrowLeft, Truck } from "@tamagui/lucide-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MapView, { Marker, PROVIDER_GOOGLE, Polyline } from "react-native-maps";
import * as Location from "expo-location";
import polyline from "@mapbox/polyline";
import {
  useRiderProfileQuery,
  useRiderDeliveriesQuery,
} from "@teincfood/core";
import { getDirectionsPolyline } from "@/services/directions.service";
import { phoenixSocket } from "@teincfood/core";
import { useRiderNavigationStore } from "@/stores/rider-navigation.store";

const DEFAULT_DELTA = 0.02;
const ACTIVE_STATUSES = ["assigned", "picked_up", "en_route", "arrived"];

export default function RiderMap() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const mapTarget = useRiderNavigationStore((state) => state.mapTarget);
  const clearMapTarget = useRiderNavigationStore(
    (state) => state.clearMapTarget,
  );
  const mapRef = useRef<MapView>(null);
  const [routeTarget, setRouteTarget] = useState(mapTarget);
  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [pickupRouteCoords, setPickupRouteCoords] = useState([]);
  const [dropoffRouteCoords, setDropoffRouteCoords] = useState([]);
  const [riderLocation, setRiderLocation] = useState(null);
  const [initialRegion, setInitialRegion] = useState(null);

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
    }

    centerOnLocation();
  }, [profileData?.current_lat, profileData?.current_lng]);

  // Consume the shared map target once, then keep it locally so clearing the
  // store does not erase the route the rider is currently looking at.
  useEffect(() => {
    if (mapTarget) {
      setRouteTarget(mapTarget);
      clearMapTarget();
    }
  }, [mapTarget, clearMapTarget]);

  // Build a virtual delivery from the shared map target (set before navigating).
  const routeParamsDelivery = routeTarget
    ? {
        id: `route-${routeTarget.orderId || "custom"}`,
        order_id: routeTarget.orderId || "custom",
        order_number: routeTarget.orderNumber || "Delivery",
        pickup_lat: routeTarget.pickup.latitude,
        pickup_lng: routeTarget.pickup.longitude,
        dropoff_lat: routeTarget.dropoff.latitude,
        dropoff_lng: routeTarget.dropoff.longitude,
        status: routeTarget.status || "assigned",
        eta_minutes: null,
        pickup_name: routeTarget.pickup.name || "Pickup",
        pickup:
          routeTarget.pickup.address ||
          routeTarget.pickup.name ||
          "Pickup location",
        dropoff:
          routeTarget.dropoff.address ||
          routeTarget.dropoff.name ||
          "Dropoff location",
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
    if (routeParamsDelivery) {
      setSelectedDelivery(routeParamsDelivery);
      return;
    }
    if (activeDelivery && !selectedDelivery) {
      setSelectedDelivery(activeDelivery);
    }
  }, [activeDelivery?.id, routeTarget]);

  // Draw the two legs separately so the rider can see:
  //   blue  — rider → restaurant/bus pickup
  //   orange — restaurant/bus → customer dropoff
  useEffect(() => {
    if (!selectedDelivery) {
      setPickupRouteCoords([]);
      setDropoffRouteCoords([]);
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
            bottom: 90,
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
  }, [selectedDelivery, riderLat, riderLng]);

  const handleMarkerPress = (delivery) => {
    if (delivery?.id && !String(delivery.id).startsWith("route-")) {
      router.push(`/(rider)/deliveries/${delivery.id}`);
      return;
    }
    setSelectedDelivery(delivery);
  };

  const handleBack = () => {
    setRouteTarget(null);
    setSelectedDelivery(null);
    router.back();
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
          mapPadding={{ top: 60, bottom: 96, left: 16, right: 16 }}
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
            onPress={() => handleMarkerPress(delivery)}
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
            onPress={() => handleMarkerPress(delivery)}
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
        <TouchableOpacity onPress={handleBack}>
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

    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
});
