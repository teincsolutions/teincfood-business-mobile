// @ts-nocheck
import { useState, useEffect, useRef } from "react";
import { Linking, Platform, StyleSheet, View } from "react-native";
import { YStack, XStack, Text, Spinner, useTheme } from "tamagui";
import {
  MapPin,
  Navigation,
  Clock,
  Phone,
  MessageCircle,
  ExternalLink,
  LocateFixed,
  AlertCircle,
} from "@tamagui/lucide-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Location from "expo-location";
import MapView, {
  AnimatedRegion,
  Marker,
  MarkerAnimated,
  Polyline,
  PROVIDER_GOOGLE,
} from "react-native-maps";
import polyline from "@mapbox/polyline";
import { getDistance } from "geolib";
import { useRiderProfileQuery } from "@teincfood/core";
import {
  getDirectionsPolyline,
  estimateDurationSeconds,
} from "@/services/directions.service";
import { useRiderNavigationStore } from "@/stores/rider-navigation.store";
import { BackButton, Button } from "@/components/ui";

const ROUTE_REFRESH_MIN_METERS = 80;
const ROUTE_REFRESH_MIN_MS = 60_000;
const MAP_BOTTOM_PADDING = 310;

function isNum(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function formatDistance(meters: number | null) {
  if (meters == null) return "--";
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

export default function NavigationScreen() {
  const router = useRouter();
  const locationData = useRiderNavigationStore((state) => state.navigationTarget);
  const clearNavigationTarget = useRiderNavigationStore(
    (state) => state.clearNavigationTarget,
  );
  const insets = useSafeAreaInsets();
  const theme = useTheme();

  const mapRef = useRef<MapView>(null);
  const lastRouteOriginRef = useRef<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const lastRouteAtRef = useRef(0);

  const [watchedLocation, setWatchedLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [routeCoords, setRouteCoords] = useState<
    { latitude: number; longitude: number }[]
  >([]);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeError, setRouteError] = useState(false);
  const [etaSeconds, setEtaSeconds] = useState<number | null>(null);
  const [distanceMeters, setDistanceMeters] = useState<number | null>(null);
  const [staticDurationSeconds, setStaticDurationSeconds] = useState<
    number | null
  >(null);

  const { data: profileData } = useRiderProfileQuery();
  const profileLocation =
    isNum(profileData?.current_lat) && isNum(profileData?.current_lng)
      ? {
          latitude: profileData.current_lat,
          longitude: profileData.current_lng,
        }
      : null;
  const riderLocation = watchedLocation ?? profileLocation;

  const riderCoordinate = useRef(
    new AnimatedRegion({
      latitude: riderLocation?.latitude ?? 0,
      longitude: riderLocation?.longitude ?? 0,
      latitudeDelta: 0,
      longitudeDelta: 0,
    }),
  ).current;
  const riderInitialised = useRef(false);

  useEffect(() => {
    return () => {
      clearNavigationTarget();
    };
  }, [clearNavigationTarget]);

  // Follow the device's GPS so the route origin stays live while navigating.
  useEffect(() => {
    let cancelled = false;
    let subscription: Location.LocationSubscription | null = null;

    async function startWatching() {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted" || cancelled) return;

        subscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.Balanced,
            distanceInterval: 20,
            timeInterval: 5000,
          },
          (location) => {
            setWatchedLocation({
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
            });
          },
        );

        if (cancelled) {
          subscription.remove();
          subscription = null;
        }
      } catch {}
    }

    void startWatching();

    return () => {
      cancelled = true;
      subscription?.remove();
    };
  }, []);

  useEffect(() => {
    if (!riderLocation) return;
    if (!riderInitialised.current) {
      riderCoordinate.setValue({
        latitude: riderLocation.latitude,
        longitude: riderLocation.longitude,
        latitudeDelta: 0,
        longitudeDelta: 0,
      });
      riderInitialised.current = true;
      return;
    }
    riderCoordinate
      .timing({
        latitude: riderLocation.latitude,
        longitude: riderLocation.longitude,
        duration: 800,
        useNativeDriver: false,
      })
      .start();
  }, [riderLocation?.latitude, riderLocation?.longitude, riderCoordinate]);

  useEffect(() => {
    if (!locationData || !riderLocation) return;

    const now = Date.now();
    if (lastRouteOriginRef.current) {
      const moved = getDistance(lastRouteOriginRef.current, riderLocation);
      if (
        moved < ROUTE_REFRESH_MIN_METERS &&
        now - lastRouteAtRef.current < ROUTE_REFRESH_MIN_MS
      ) {
        return;
      }
    }

    lastRouteOriginRef.current = riderLocation;
    lastRouteAtRef.current = now;

    const origin = riderLocation;
    const destination = {
      latitude: locationData.latitude,
      longitude: locationData.longitude,
    };

    let cancelled = false;
    setRouteLoading(true);
    setRouteError(false);
    setEtaSeconds(estimateDurationSeconds(origin, destination));

    getDirectionsPolyline({
      orderId: `nav-${locationData.orderId ?? locationData.name}`,
      cacheKey: `nav:${destination.latitude.toFixed(5)},${destination.longitude.toFixed(5)}`,
      origin,
      destination,
    })
      .then(
        ({
          polyline: encoded,
          distanceMeters: routeDistance,
          durationSeconds,
          staticDurationSeconds: staticDuration,
        }) => {
          if (cancelled) return;

          const eta =
            durationSeconds ??
            staticDuration ??
            estimateDurationSeconds(origin, destination);
          setEtaSeconds(eta);
          setDistanceMeters(routeDistance ?? null);
          setStaticDurationSeconds(staticDuration ?? null);

          if (encoded) {
            const decoded = polyline
              .decode(encoded)
              .map(([latitude, longitude]) => ({ latitude, longitude }));
            setRouteCoords(decoded);

            setTimeout(() => {
              mapRef.current?.fitToCoordinates(
                [origin, destination, ...decoded],
                {
                  edgePadding: {
                    top: insets.top + 150,
                    right: 50,
                    bottom: MAP_BOTTOM_PADDING,
                    left: 50,
                  },
                  animated: true,
                },
              );
            }, 250);
          } else {
            setRouteError(true);
            setTimeout(() => {
              mapRef.current?.fitToCoordinates([origin, destination], {
                edgePadding: {
                  top: insets.top + 150,
                  right: 50,
                  bottom: MAP_BOTTOM_PADDING,
                  left: 50,
                },
                animated: true,
              });
            }, 250);
          }
        },
      )
      .finally(() => {
        if (!cancelled) setRouteLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [
    riderLocation?.latitude,
    riderLocation?.longitude,
    locationData?.latitude,
    locationData?.longitude,
    insets.top,
  ]);

  const handleBack = () => {
    clearNavigationTarget();
    router.back();
  };

  const handleCall = () => {
    if (!locationData?.phone) return;
    const url =
      Platform.OS === "ios"
        ? `telprompt:${locationData.phone}`
        : `tel:${locationData.phone}`;
    Linking.openURL(url);
  };

  const handleMessage = () => {
    if (!locationData?.userId || !locationData?.orderId) return;
    router.push({
      pathname: "/(communication)/chat/direct",
      params: {
        userId: locationData.userId,
        orderId: locationData.orderId,
      },
    });
  };

  const handleOpenMaps = () => {
    if (!locationData) return;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${locationData.latitude},${locationData.longitude}&travelmode=driving`;
    Linking.openURL(url);
  };

  const handleRecenter = () => {
    if (riderLocation) {
      mapRef.current?.animateToRegion(
        {
          latitude: riderLocation.latitude,
          longitude: riderLocation.longitude,
          latitudeDelta: 0.018,
          longitudeDelta: 0.018,
        },
        600,
      );
      return;
    }

    if (!locationData) return;
    mapRef.current?.animateToRegion(
      {
        latitude: locationData.latitude,
        longitude: locationData.longitude,
        latitudeDelta: 0.03,
        longitudeDelta: 0.03,
      },
      600,
    );
  };

  if (!locationData) {
    return (
      <YStack
        flex={1}
        backgroundColor="$background"
        justifyContent="center"
        alignItems="center"
        padding="$6"
        gap="$4"
      >
        <AlertCircle size={32} color="$colorMuted" />
        <Text fontSize="$5" fontWeight="700" color="$color" textAlign="center">
          No navigation destination
        </Text>
        <Text fontSize="$3" color="$colorSecondary" textAlign="center">
          Open a pickup or dropoff from a delivery to start navigation.
        </Text>
        <Button variant="outline" onPress={() => router.back()}>
          Go Back
        </Button>
      </YStack>
    );
  }

  const kindLabel = locationData.kind === "pickup" ? "Pickup" : "Dropoff";
  const etaLabel = etaSeconds
    ? `${Math.ceil(etaSeconds / 60)} min`
    : routeLoading
      ? "..."
      : "--";
  const trafficDelta =
    etaSeconds != null && staticDurationSeconds != null
      ? staticDurationSeconds - etaSeconds
      : null;
  const trafficLabel =
    trafficDelta == null
      ? "Live route"
      : trafficDelta > 120
        ? "Heavy traffic"
        : trafficDelta > 30
          ? "Moderate traffic"
          : "Light traffic";

  return (
    <View style={styles.screen}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFillObject}
        provider={PROVIDER_GOOGLE}
        initialRegion={{
          latitude: riderLocation?.latitude ?? locationData.latitude,
          longitude: riderLocation?.longitude ?? locationData.longitude,
          latitudeDelta: 0.03,
          longitudeDelta: 0.03,
        }}
        showsMyLocationButton={false}
        showsCompass
        showsScale
        scrollEnabled
        zoomEnabled
        rotateEnabled
        pitchEnabled
        toolbarEnabled={false}
        mapPadding={{
          top: insets.top + 84,
          bottom: MAP_BOTTOM_PADDING,
          left: 16,
          right: 16,
        }}
      >
        <Marker
          coordinate={{
            latitude: locationData.latitude,
            longitude: locationData.longitude,
          }}
          title={locationData.name}
          description={locationData.address}
          anchor={{ x: 0.5, y: 0.5 }}
        >
          <YStack
            backgroundColor="$primary"
            borderRadius="$full"
            padding="$2"
            borderWidth={3}
            borderColor="$background"
            alignItems="center"
            justifyContent="center"
          >
            <MapPin size={19} color="white" />
          </YStack>
        </Marker>

        {routeCoords.length > 0 ? (
          <Polyline
            coordinates={routeCoords}
            strokeColor={theme.background.val}
            strokeWidth={13}
            lineCap="round"
            lineJoin="round"
            zIndex={1}
          />
        ) : null}

        {routeCoords.length > 0 ? (
          <Polyline
            coordinates={routeCoords}
            strokeColor={theme.info.val}
            strokeWidth={7}
            lineCap="round"
            lineJoin="round"
            zIndex={2}
          />
        ) : null}

        {riderLocation ? (
          <MarkerAnimated
            coordinate={riderCoordinate}
            title="You"
            anchor={{ x: 0.5, y: 0.5 }}
            tracksViewChanges={false}
          >
            <YStack
              backgroundColor="$info"
              borderRadius="$full"
              padding="$2"
              borderWidth={3}
              borderColor="$background"
              alignItems="center"
              justifyContent="center"
            >
              <Navigation size={19} color="white" />
            </YStack>
          </MarkerAnimated>
        ) : null}
      </MapView>

      <XStack
        position="absolute"
        top={insets.top + 8}
        left="$4"
        right="$4"
        justifyContent="space-between"
        alignItems="center"
      >
        <BackButton onPress={handleBack} />

        <YStack
          backgroundColor="$background"
          paddingHorizontal="$4"
          paddingVertical="$2"
          borderRadius="$full"
          shadowColor="$shadowColorStrong"
          shadowOpacity={1}
          shadowRadius={8}
          shadowOffset={{ width: 0, height: 2 }}
          elevation={3}
        >
          <Text fontSize="$3" fontWeight="700" color="$color">
            To {kindLabel}
          </Text>
        </YStack>

        <Button
          circular
          width={40}
          height={40}
          backgroundColor="$background"
          pressStyle={{ backgroundColor: "$backgroundSoft" }}
          icon={<LocateFixed size={19} color="$color" />}
          onPress={handleRecenter}
        />
      </XStack>

      <YStack
        position="absolute"
        left="$4"
        right="$4"
        bottom={insets.bottom + 16}
        backgroundColor="$background"
        borderRadius="$6"
        padding="$4"
        gap="$3"
        shadowColor="$shadowColorStrong"
        shadowOpacity={1}
        shadowRadius={16}
        shadowOffset={{ width: 0, height: 4 }}
        elevation={8}
      >
        <XStack justifyContent="space-between" alignItems="flex-start" gap="$3">
          <YStack flex={1} gap="$1">
            <XStack gap="$2" alignItems="center">
              <YStack
                width={8}
                height={8}
                borderRadius="$full"
                backgroundColor={routeLoading ? "$warning" : "$success"}
              />
              <Text fontSize="$2" color="$colorSecondary">
                {routeLoading ? "Updating route..." : "Live route"}
              </Text>
            </XStack>
            <Text
              fontSize="$5"
              fontWeight="800"
              fontFamily="$heading"
              color="$color"
              numberOfLines={1}
            >
              {locationData.name}
            </Text>
            <Text fontSize="$3" color="$colorSecondary" numberOfLines={1}>
              {locationData.address}
            </Text>
            {locationData.kind === "dropoff" && locationData.customerName ? (
              <Text fontSize="$3" color="$colorSecondary" numberOfLines={1}>
                Customer: {locationData.customerName}
              </Text>
            ) : null}
          </YStack>

          <YStack alignItems="flex-end" gap="$1">
            <Text fontSize="$2" color="$colorSecondary">
              ETA
            </Text>
            <Text
              fontSize="$7"
              fontWeight="800"
              fontFamily="$heading"
              color="$primary"
            >
              {etaLabel}
            </Text>
          </YStack>
        </XStack>

        <XStack gap="$4" alignItems="center">
          <XStack gap="$1.5" alignItems="center">
            <Navigation size={15} color="$colorMuted" />
            <Text fontSize="$3" color="$colorSecondary">
              {formatDistance(distanceMeters)}
            </Text>
          </XStack>
          <XStack gap="$1.5" alignItems="center">
            <Clock size={15} color="$colorMuted" />
            <Text fontSize="$3" color="$colorSecondary">
              {trafficLabel}
            </Text>
          </XStack>
          {locationData.orderNumber ? (
            <YStack
              backgroundColor="$backgroundOrange"
              paddingHorizontal="$2"
              paddingVertical="$0.5"
              borderRadius="$full"
            >
              <Text fontSize="$1" fontWeight="700" color="$primary">
                {locationData.orderNumber}
              </Text>
            </YStack>
          ) : null}
        </XStack>

        {locationData.notes ? (
          <YStack
            backgroundColor="$backgroundOrange"
            padding="$2"
            borderRadius="$2"
          >
            <Text fontSize="$2" color="$colorSecondary">
              Note: {locationData.notes}
            </Text>
          </YStack>
        ) : null}

        {routeError ? (
          <XStack
            gap="$2"
            alignItems="center"
            backgroundColor="$backgroundOrange"
            padding="$2"
            borderRadius="$2"
          >
            <AlertCircle size={15} color="$primary" />
            <Text fontSize="$2" color="$colorSecondary" flex={1}>
              Route unavailable. Showing destination directly.
            </Text>
          </XStack>
        ) : null}

        {!riderLocation ? (
          <XStack
            gap="$2"
            alignItems="center"
            backgroundColor="$backgroundOrange"
            padding="$2"
            borderRadius="$2"
          >
            <AlertCircle size={15} color="$primary" />
            <Text fontSize="$2" color="$colorSecondary" flex={1}>
              Waiting for your location. Allow location access for live routing.
            </Text>
          </XStack>
        ) : null}

        <XStack gap="$2">
          <Button
            flex={1}
            variant="outline"
            height={44}
            icon={<Phone size={17} />}
            onPress={handleCall}
            disabled={!locationData.phone}
          >
            Call
          </Button>
          <Button
            flex={1}
            variant="outline"
            height={44}
            icon={<MessageCircle size={17} />}
            onPress={handleMessage}
            disabled={!locationData.userId || !locationData.orderId}
          >
            Message
          </Button>
          <Button
            flex={1}
            height={44}
            icon={<ExternalLink size={17} />}
            onPress={handleOpenMaps}
          >
            Maps
          </Button>
        </XStack>
      </YStack>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
});
