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
import { useRouter, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MapView, { Marker, PROVIDER_GOOGLE, Polyline } from "react-native-maps";
import polyline from "@mapbox/polyline";
import { useRiderProfileQuery } from "@/hooks/useRider";
import { useRiderLocationTracking } from "@/hooks/useRiderLocationTracking";
import { getDirectionsPolyline, estimateDurationSeconds } from "@/services/directions.service";
import { useResponsive } from "@/utils/responsive";

interface LocationData {
  name: string;
  address: string;
  phone?: string;
  lat: number;
  lng: number;
  notes?: string;
}

export default function NavigationScreen() {
  const router = useRouter();
  const { location: locationParam } = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const { isTablet } = useResponsive();
  const mapRef = useRef<MapView>(null);
  const [routeCoords, setRouteCoords] = useState([]);
  const [etaSeconds, setEtaSeconds] = useState(null);

  const { data: profileData } = useRiderProfileQuery();

  const isOnline = profileData?.status === 'available';
  const riderId = profileData?.id;

  // Live GPS tracking
  useRiderLocationTracking({ riderId, enabled: isOnline });

  const locationData: LocationData | null = locationParam
    ? JSON.parse(decodeURIComponent(locationParam as string))
    : null;

  const riderLat = profileData?.current_lat ?? null;
  const riderLng = profileData?.current_lng ?? null;
  const hasRiderPos = riderLat != null && riderLng != null;

  // Fetch route from rider to destination
  useEffect(() => {
    if (!hasRiderPos || !locationData) return;

    const origin = { latitude: riderLat, longitude: riderLng };
    const destination = { latitude: locationData.lat, longitude: locationData.lng };

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
      }
    });
  }, [riderLat, riderLng, locationData?.lat, locationData?.lng]);

  const handleCall = () => {
    const phoneNumber = locationData?.phone;
    if (!phoneNumber) return;
    const url = Platform.OS === "ios" ? `telprompt:${phoneNumber}` : `tel:${phoneNumber}`;
    Linking.openURL(url);
  };

  const handleMessage = () => {
    const phoneNumber = locationData?.phone;
    if (!phoneNumber) return;
    router.push(`/(communication)/chat/${phoneNumber}`);
  };

  const handleOpenMaps = () => {
    if (!locationData) return;
    const { lat, lng, name } = locationData;
    const encodedName = encodeURIComponent(name);
    const url = Platform.OS === "ios"
      ? `http://maps.apple.com/?daddr=${lat},${lng}&q=${encodedName}`
      : `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&destination_place_id=${encodedName}`;
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
          latitude: locationData.lat,
          longitude: locationData.lng,
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
          coordinate={{ latitude: locationData.lat, longitude: locationData.lng }}
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
