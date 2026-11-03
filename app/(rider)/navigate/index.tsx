// @ts-nocheck
import { useState, useEffect, useRef } from "react";
import { TouchableOpacity, Linking, Platform } from "react-native";
import { YStack, XStack, Text, Card, Button, Separator, Avatar } from "tamagui";
import {
  MapPin,
  Navigation,
  Clock,
  Package,
  Phone,
  MessageCircle,
  User,
  ArrowLeft,
  ExternalLink,
  Truck,
} from "@tamagui/lucide-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MapView, { Marker, PROVIDER_GOOGLE, Polyline } from "react-native-maps";
import polyline from "@mapbox/polyline";
import { useRiderProfileQuery } from "@teincfood/core";
import { getDirectionsPolyline, estimateDurationSeconds } from "@/services/directions.service";
import { useResponsive } from "@/utils/responsive";
import { useRiderNavigationStore } from "@/stores/rider-navigation.store";

export default function NavigationScreen() {
  const router = useRouter();
  const locationData = useRiderNavigationStore((state) => state.navigationTarget);
  const clearNavigationTarget = useRiderNavigationStore(
    (state) => state.clearNavigationTarget,
  );
  const insets = useSafeAreaInsets();
  const { isTablet } = useResponsive();
  const mapRef = useRef<MapView>(null);
  const [routeCoords, setRouteCoords] = useState([]);
  const [etaSeconds, setEtaSeconds] = useState(null);

  const { data: profileData } = useRiderProfileQuery();

  useEffect(() => {
    return () => {
      clearNavigationTarget();
    };
  }, [clearNavigationTarget]);

  const riderLat = profileData?.current_lat ?? null;
  const riderLng = profileData?.current_lng ?? null;
  const hasRiderPos = riderLat != null && riderLng != null;

  // Fetch route from rider to destination
  useEffect(() => {
    if (!hasRiderPos || !locationData) return;

    const origin = { latitude: riderLat, longitude: riderLng };
    const destination = { latitude: locationData.latitude, longitude: locationData.longitude };

    // Set immediate offline ETA estimate
    setEtaSeconds(estimateDurationSeconds(origin, destination));

    getDirectionsPolyline({
      orderId: `nav-${Date.now()}`,
      origin,
      destination,
    }).then(({ polyline: encoded, durationSeconds, staticDurationSeconds }) => {
      const eta = durationSeconds ?? staticDurationSeconds ?? estimateDurationSeconds(origin, destination);
      setEtaSeconds(eta);

      if (encoded) {
        const decoded = polyline.decode(encoded);
        const coords = decoded.map(([lat, lng]) => ({ latitude: lat, longitude: lng }));
        setRouteCoords(coords);

        // Fit map to show full route
        setTimeout(() => {
          if (mapRef.current) {
            mapRef.current.fitToCoordinates(
              [origin, destination, ...coords],
              { edgePadding: { top: 120, right: 50, bottom: 250, left: 50 }, animated: true },
            );
          }
        }, 300);
      } else {
        // No route data — fit to just origin + destination
        setTimeout(() => {
          mapRef.current?.fitToCoordinates(
            [origin, destination],
            { edgePadding: { top: 120, right: 50, bottom: 250, left: 50 }, animated: true },
          );
        }, 300);
      }
    });
  }, [riderLat, riderLng, locationData?.latitude, locationData?.longitude]);

  const handleCall = () => {
    const phoneNumber = locationData?.phone;
    if (!phoneNumber) return;
    const url = Platform.OS === "ios" ? `telprompt:${phoneNumber}` : `tel:${phoneNumber}`;
    Linking.openURL(url);
  };

  const handleMessage = () => {
    const { userId, orderId } = locationData || {};
    if (userId && orderId) {
      router.push({ pathname: '/(communication)/chat/direct', params: { userId, orderId } });
    }
  };

  const handleOpenMaps = () => {
    if (!locationData) return;
    const { latitude, longitude } = locationData;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&travelmode=driving`;
    Linking.openURL(url);
  };

  if (!locationData) {
    return (
      <YStack flex={1} backgroundColor="$background" justifyContent="center" alignItems="center">
        <Text>No location data provided</Text>
        <Button marginTop="$4" onPress={() => router.back()}>Go Back</Button>
      </YStack>
    );
  }

  return (
    <YStack flex={1} backgroundColor="$background">
      {/* Map View */}
      <MapView
        ref={mapRef}
        style={{ flex: 1 }}
        provider={PROVIDER_GOOGLE}
        initialRegion={{
          latitude: locationData.latitude,
          longitude: locationData.longitude,
          latitudeDelta: 0.03,
          longitudeDelta: 0.03,
        }}
        showsUserLocation
        showsMyLocationButton
        showsCompass
        mapPadding={{ top: 120, bottom: 220, left: 16, right: 16 }}
      >
        {/* Destination marker */}
        <Marker
          coordinate={{ latitude: locationData.latitude, longitude: locationData.longitude }}
          title={locationData.name}
          description={locationData.address}
          pinColor="#e74c3c"
        />

        {/* Route polyline */}
        {routeCoords.length > 0 && (
          <Polyline coordinates={routeCoords} strokeColor="#3498db" strokeWidth={4} />
        )}

        {/* Rider vehicle marker */}
        {(() => {
          const lat = riderLat;
          const lng = riderLng;
          if (lat == null || lng == null) return null;

          const vehicleType = profileData?.vehicle_type;
          const vehicleColor = vehicleType === 'motorcycle' ? '#f39c12' :
            vehicleType === 'bicycle' ? '#2ecc71' :
            vehicleType === 'car' ? '#3498db' : '#95a5a6';

          return (
            <Marker
              coordinate={{ latitude: lat, longitude: lng }}
              title="You"
              anchor={{ x: 0.5, y: 0.5 }}
            >
              <YStack
                width={40} height={40} borderRadius={20}
                backgroundColor={vehicleColor}
                alignItems="center" justifyContent="center"
                borderWidth={3} borderColor="white"
              >
                <Truck size={20} color="white" />
              </YStack>
            </Marker>
          );
        })()}
      </MapView>

      {/* Header */}
      <XStack
        position="absolute"
        top={insets.top + 12}
        left="$4"
        right="$4"
        justifyContent="space-between"
        alignItems="center"
      >
        <TouchableOpacity onPress={() => router.back()}>
          <YStack backgroundColor="$background" padding="$3" borderRadius="$10" borderWidth={1} borderColor="$borderColor">
            <ArrowLeft size={20} color="$color" />
          </YStack>
        </TouchableOpacity>

        <YStack backgroundColor="$background" paddingHorizontal="$4" paddingVertical="$2" borderRadius="$10" borderWidth={1} borderColor="$borderColor">
          <Text fontWeight="bold" fontSize="$4">Navigation</Text>
        </YStack>

        <TouchableOpacity onPress={handleOpenMaps}>
          <YStack backgroundColor="$primary" padding="$3" borderRadius="$10">
            <ExternalLink size={20} color="white" />
          </YStack>
        </TouchableOpacity>
      </XStack>

      {/* Destination Info */}
      <YStack
        position="absolute"
        top={insets.top + 80}
        left="$4"
        right="$4"
        backgroundColor="$background"
        padding="$4"
        borderRadius="$4"
        borderWidth={1}
        borderColor="$borderColor"
      >
        <XStack gap="$3" alignItems="center">
          <YStack backgroundColor="$primary" padding="$2" borderRadius="$10">
            <Navigation size={20} color="white" />
          </YStack>
          <YStack flex={1}>
            <Text fontSize="$3" color="$colorSecondary">Destination</Text>
            <Text fontSize="$4" fontWeight="bold">{locationData.name}</Text>
            <Text fontSize="$3" color="$colorSecondary">{locationData.address}</Text>
          </YStack>
          <TouchableOpacity onPress={handleOpenMaps}>
            <YStack backgroundColor="$blue10" padding="$2" borderRadius="$2">
              <ExternalLink size={20} color="white" />
            </YStack>
          </TouchableOpacity>
        </XStack>

        {etaSeconds ? (
          <XStack marginTop="$2" gap="$2" alignItems="center">
            <Clock size={14} color="$colorMuted" />
            <Text fontSize="$3" color="$colorSecondary">
              ETA: {Math.ceil(etaSeconds / 60)} min
            </Text>
          </XStack>
        ) : null}

        {locationData.notes ? (
          <YStack marginTop="$2" backgroundColor="$yellow2" padding="$2" borderRadius="$2">
            <Text fontSize="$3" color="$orange10">Note: {locationData.notes}</Text>
          </YStack>
        ) : null}
      </YStack>

      {/* Bottom actions */}
      <YStack
        backgroundColor="$background"
        borderTopWidth={1}
        borderTopColor="$borderColor"
        paddingBottom={insets.bottom}
      >
        <XStack padding="$4" gap="$3">
          <Button flex={1} variant="outline" icon={<Phone size={18} />} onPress={handleCall}>
            Call
          </Button>
          <Button flex={1} variant="outline" icon={<MessageCircle size={18} />} onPress={handleMessage}>
            Message
          </Button>
          {isTablet && (
            <Button flex={1} backgroundColor="$primary" icon={<Navigation size={18} />} onPress={handleOpenMaps}>
              Open Maps
            </Button>
          )}
        </XStack>
      </YStack>
    </YStack>
  );
}
