// @ts-nocheck
import { useState, useEffect, useRef, useCallback } from 'react';
import { TouchableOpacity } from 'react-native';
import { YStack, XStack, Text, Card, Button, Separator } from 'tamagui';
import {
  MapPin,
  Navigation,
  Clock,
  Package,
  Phone,
  MessageCircle,
  ArrowLeft,
  Crosshair,
} from '@tamagui/lucide-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MapView, { Marker, PROVIDER_GOOGLE, Polyline } from 'react-native-maps';
import * as Location from 'expo-location';
import polyline from '@mapbox/polyline';
import { useRiderProfileQuery, useRiderDeliveriesQuery } from '@/hooks/useRider';
import { useRiderLocationTracking } from '@/hooks/useRiderLocationTracking';
import { getDirectionsPolyline } from '@/services/directions.service';
import { phoenixSocket } from '@/services/phoenix-socket.service';

const ACCRA_REGION = {
  latitude: 5.6037,
  longitude: -0.187,
  latitudeDelta: 0.05,
  longitudeDelta: 0.05,
};

const ACTIVE_STATUSES = ['assigned', 'picked_up', 'en_route', 'arrived'];

export default function RiderMap() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    pickupLat?: string;
    pickupLng?: string;
    dropoffLat?: string;
    dropoffLng?: string;
    orderId?: string;
    orderNumber?: string;
  }>();
  const mapRef = useRef<MapView>(null);
  const [selectedDelivery, setSelectedDelivery] = useState(null);
  const [routeCoords, setRouteCoords] = useState([]);
  const [riderLocation, setRiderLocation] = useState(null);
  const [initialRegion, setInitialRegion] = useState(ACCRA_REGION);

  const { data: profileData } = useRiderProfileQuery();
  const { data: deliveries = [] } = useRiderDeliveriesQuery();

  const isOnline = profileData?.status === 'available';
  const riderId = profileData?.id;

  // Live GPS tracking
  useRiderLocationTracking({ riderId, enabled: isOnline });

  // Listen for location updates on the WebSocket channel
  useEffect(() => {
    if (!riderId) return;

    const topic = `location:rider:${riderId}`;

    phoenixSocket.connect().catch(() => {});

    const unsub = phoenixSocket.onFrame(topic, ([_joinRef, _ref, _topic, event, payload]) => {
      if (event === 'location') {
        const { lat, lng } = payload;
        setRiderLocation({ latitude: lat, longitude: lng });
      }
    });

    return () => {
      unsub();
    };
  }, [riderId]);

  // Center on rider's current location when map opens
  useEffect(() => {
    async function centerOnLocation() {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          const { latitude, longitude } = loc.coords;
          const region = { latitude, longitude, latitudeDelta: 0.02, longitudeDelta: 0.02 };
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
  const routeParamsDelivery = params.pickupLat && params.pickupLng && params.dropoffLat && params.dropoffLng
    ? {
        id: `route-${params.orderId || 'custom'}`,
        order_id: params.orderId || 'custom',
        order_number: params.orderNumber || 'Delivery',
        pickup_lat: parseFloat(params.pickupLat),
        pickup_lng: parseFloat(params.pickupLng),
        dropoff_lat: parseFloat(params.dropoffLat),
        dropoff_lng: parseFloat(params.dropoffLng),
        status: 'assigned',
        eta_minutes: null,
        pickup: 'Pickup location',
        dropoff: 'Dropoff location',
        currency: 'GHS',
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
  const activeDelivery = routeParamsDelivery || activeDeliveries.find((d) => ACTIVE_STATUSES.includes(d.status));

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

    getDirectionsPolyline({
      orderId: selectedDelivery.order_id,
      origin,
      destination,
    }).then(({ polyline: encoded }) => {
      if (encoded) {
        const decoded = polyline.decode(encoded);
        const coords = decoded.map(([lat, lng]) => ({ latitude: lat, longitude: lng }));
        setRouteCoords(coords);
      }
    });

    // Fit map to show the full route
    if (mapRef.current) {
      mapRef.current.fitToCoordinates(
        [origin, destination],
        { edgePadding: { top: 100, right: 50, bottom: 250, left: 50 }, animated: true },
      );
    }
  }, [selectedDelivery]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'picked_up': return '#3498db';
      case 'assigned': return '#FFA500';
      case 'en_route': return '#f39c12';
      case 'arrived': return '#2ecc71';
      default: return '#95a5a6';
    }
  };

  const fitMarkers = useCallback(() => {
    if (!mapRef.current || allRouteDeliveries.length === 0) return;

    const coords = allRouteDeliveries.flatMap((d) => [
      { latitude: d.pickup_lat, longitude: d.pickup_lng },
      { latitude: d.dropoff_lat, longitude: d.dropoff_lng },
    ]);

    if (riderLocation) {
      coords.push(riderLocation);
    }

    mapRef.current.fitToCoordinates(coords, {
      edgePadding: { top: 100, right: 50, bottom: 200, left: 50 },
      animated: true,
    });
  }, [allRouteDeliveries, riderLocation]);

  return (
    <YStack flex={1} backgroundColor="$background">
      {/* Full-screen Map */}
      <MapView
        ref={mapRef}
        style={{ flex: 1 }}
        provider={PROVIDER_GOOGLE}
        initialRegion={initialRegion}
        showsUserLocation
        showsMyLocationButton
        showsCompass
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
            description={delivery.pickup || 'Pickup location'}
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
            title={`Dropoff: ${delivery.order_id}`}
            description={delivery.dropoff || 'Dropoff location'}
            pinColor="#e74c3c"
            onPress={() => setSelectedDelivery(delivery)}
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

        <YStack backgroundColor="$background" paddingHorizontal="$4" paddingVertical="$2" borderRadius="$10">
          <Text fontWeight="bold" fontFamily="$heading">Live Map</Text>
        </YStack>

        <YStack width={44} />
      </XStack>

      {/* Recenter button — above bottom card */}
      <YStack
        position="absolute"
        bottom={selectedDelivery ? 280 : 180}
        right="$4"
        zIndex={100}
      >
        <TouchableOpacity onPress={fitMarkers}>
          <YStack
            backgroundColor="$background"
            padding="$3"
            borderRadius="$10"
            shadowColor="#000"
            shadowOffset={{ width: 0, height: 2 }}
            shadowOpacity={0.15}
            shadowRadius={4}
            elevation={4}
          >
            <Crosshair size={22} color="$primary" />
          </YStack>
        </TouchableOpacity>
      </YStack>

      {/* Selected Delivery Card */}
      {selectedDelivery ? (
        <YStack
          position="absolute"
          bottom={insets.bottom + 20}
          left="$4"
          right="$4"
        >
          <Card padding="$4" bordered backgroundColor="$background">
            <YStack gap="$3">
              <XStack justifyContent="space-between" alignItems="center">
                <Text fontSize="$5" fontWeight="bold" fontFamily="$heading">
                  {selectedDelivery.order_number}
                </Text>
                <YStack
                  backgroundColor={getStatusColor(selectedDelivery.status)}
                  paddingHorizontal="$3"
                  paddingVertical="$1"
                  borderRadius="$10"
                >
                  <Text color="white" fontSize="$2" textTransform="capitalize">
                    {selectedDelivery.status.replace('_', ' ')}
                  </Text>
                </YStack>
              </XStack>

              <Separator />

              <YStack gap="$2">
                <XStack gap="$2" alignItems="center">
                  <MapPin size={16} color="$success" />
                  <YStack flex={1}>
                    <Text fontSize="$2" color="$colorSecondary" fontFamily="$body">Pickup</Text>
                    <Text fontSize="$3" fontFamily="$body">
                      {selectedDelivery.pickup || 'Pickup location'}
                    </Text>
                  </YStack>
                </XStack>

                <XStack gap="$2" alignItems="center">
                  <Navigation size={16} color="$danger" />
                  <YStack flex={1}>
                    <Text fontSize="$2" color="$colorSecondary" fontFamily="$body">Dropoff</Text>
                    <Text fontSize="$3" fontFamily="$body">
                      {selectedDelivery.dropoff || 'Dropoff location'}
                    </Text>
                  </YStack>
                </XStack>
              </YStack>

              <XStack gap="$3" alignItems="center">
                <Clock size={16} color="$colorMuted" />
                <Text fontSize="$3" fontFamily="$body">
                  ETA: {selectedDelivery.eta_minutes ? `${selectedDelivery.eta_minutes} min` : 'Calculating...'}
                </Text>
              </XStack>

              <Separator />

              <XStack gap="$3">
                <Button
                  flex={1}
                  variant="outline"
                  icon={<Phone size={18} />}
                  onPress={() => {}}
                >
                  Call
                </Button>
                <Button
                  flex={1}
                  variant="outline"
                  icon={<MessageCircle size={18} />}
                  onPress={() => {}}
                >
                  Message
                </Button>
                <Button
                  flex={1}
                  backgroundColor="$primary"
                  onPress={() => router.push(`/(rider)/deliveries/${selectedDelivery.id}`)}
                >
                  Details
                </Button>
              </XStack>

              <Button
                variant="ghost"
                size="$3"
                onPress={() => setSelectedDelivery(null)}
              >
                Close
              </Button>
            </YStack>
          </Card>
        </YStack>
      ) : null}

      {/* Quick Actions (when no delivery selected) */}
      {!selectedDelivery ? (
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
                  : 'No active deliveries'}
              </Text>
              <XStack gap="$3">
                <Button
                  flex={1}
                  variant="outline"
                  onPress={() => router.push('/(rider)/deliveries')}
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
      ) : null}
    </YStack>
  );
}
