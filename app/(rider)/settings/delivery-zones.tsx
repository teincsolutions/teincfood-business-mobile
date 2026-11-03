// @ts-nocheck
import { useCallback, useEffect, useRef, useState } from "react";
import {
  FlatList,
  RefreshControl,
  TouchableOpacity,
  useWindowDimensions,
} from "react-native";
import {
  YStack,
  XStack,
  Text,
  Avatar,
  Separator,
  Spinner,
  useTheme,
} from "tamagui";
import {
  Building,
  ChevronRight,
  MapPin,
  RefreshCw,
} from "@tamagui/lucide-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MapView, { Circle, Marker, PROVIDER_GOOGLE } from "react-native-maps";
import { BackButton, Button } from "@/components/ui";
import { CachedAvatarImage } from "@/components/ui/CachedAvatarImage";
import { RiderMarkerContent } from "@/components/rider/DeliveryMarkers";
import { useRiderDeliveryZonesQuery } from "@/hooks/useRiderDeliveryZones";
import { useRiderProfileQuery } from "@teincfood/core";
import type { RiderDeliveryZone } from "@/services/rider-zones.service";

function getZoneCoordinate(zone: RiderDeliveryZone) {
  const latitude = zone.latitude ?? zone.address?.latitude ?? null;
  const longitude = zone.longitude ?? zone.address?.longitude ?? null;
  if (latitude == null || longitude == null) return null;
  return { latitude, longitude };
}

function formatZoneAddress(zone: RiderDeliveryZone) {
  if (!zone.address) return "Address not set";
  return [zone.address.address_line, zone.address.city]
    .filter(Boolean)
    .join(", ");
}

export default function DeliveryZones() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { height: screenHeight } = useWindowDimensions();
  const theme = useTheme();
  const mapRef = useRef<MapView>(null);
  const [selectedZoneId, setSelectedZoneId] = useState<string | null>(null);

  const { data: zones = [], isLoading, isError, isRefetching, refetch } =
    useRiderDeliveryZonesQuery();
  const { data: profile } = useRiderProfileQuery();

  const riderLocation =
    profile?.current_lat != null && profile?.current_lng != null
      ? {
          latitude: profile.current_lat,
          longitude: profile.current_lng,
        }
      : null;

  const selectedZone =
    zones.find((zone) => zone.id === selectedZoneId) ?? zones[0] ?? null;

  useEffect(() => {
    if (!selectedZoneId && zones.length > 0) {
      setSelectedZoneId(zones[0].id);
    }
  }, [selectedZoneId, zones]);

  useEffect(() => {
    if (!mapRef.current) return;

    const coordinates = zones
      .map(getZoneCoordinate)
      .filter(Boolean) as { latitude: number; longitude: number }[];

    if (riderLocation) coordinates.push(riderLocation);
    if (coordinates.length === 0) return;

    const timer = setTimeout(() => {
      mapRef.current?.fitToCoordinates(coordinates, {
        edgePadding: { top: 70, right: 50, bottom: 70, left: 50 },
        animated: true,
      });
    }, 300);

    return () => clearTimeout(timer);
  }, [zones, riderLocation?.latitude, riderLocation?.longitude]);

  const focusZone = useCallback((zone: RiderDeliveryZone) => {
    const coordinate = getZoneCoordinate(zone);
    if (!coordinate || !mapRef.current) return;

    setSelectedZoneId(zone.id);
    const delta = Math.max((zone.max_delivery_radius_km * 2.6) / 111, 0.02);
    mapRef.current.animateToRegion(
      {
        ...coordinate,
        latitudeDelta: delta,
        longitudeDelta: delta,
      },
      600,
    );
  }, []);

  const mapHeight = Math.min(screenHeight * 0.42, 360);

  const header = (
    <YStack gap="$4" paddingBottom="$4">
      <YStack gap="$2">
        <Text fontSize="$6" fontWeight="800" fontFamily="$heading" color="$color">
          Your delivery coverage
        </Text>
        <Text fontSize="$3" color="$colorSecondary">
          These are the businesses you have joined. Each circle shows the area
          their deliveries can reach.
        </Text>
      </YStack>

      <YStack
        height={mapHeight}
        width="100%"
        borderRadius="$5"
        overflow="hidden"
        backgroundColor="$backgroundSoft"
      >
        <MapView
          ref={mapRef}
          style={{ flex: 1 }}
          provider={PROVIDER_GOOGLE}
          showsMyLocationButton={false}
          showsCompass
          toolbarEnabled={false}
          initialRegion={{
            latitude: riderLocation?.latitude ?? 5.6037,
            longitude: riderLocation?.longitude ?? -0.187,
            latitudeDelta: 0.18,
            longitudeDelta: 0.18,
          }}
          mapPadding={{ top: 50, bottom: 50, left: 16, right: 16 }}
        >
          {zones.map((zone) => {
            const coordinate = getZoneCoordinate(zone);
            if (!coordinate) return null;
            const isSelected = selectedZone?.id === zone.id;
            const radiusMeters = zone.max_delivery_radius_km * 1000;

            return (
              <Circle
                key={`radius-${zone.id}`}
                center={coordinate}
                radius={radiusMeters}
                strokeColor={
                  isSelected ? theme.primary.val : theme.info.val
                }
                strokeWidth={isSelected ? 2.5 : 1.5}
                fillColor={
                  isSelected ? theme.primaryMuted.val : theme.infoMuted.val
                }
              />
            );
          })}

          {zones.map((zone) => {
            const coordinate = getZoneCoordinate(zone);
            if (!coordinate) return null;
            const isSelected = selectedZone?.id === zone.id;

            return (
              <Marker
                key={zone.id}
                coordinate={coordinate}
                title={zone.name}
                description={`${zone.max_delivery_radius_km} km delivery radius`}
                anchor={{ x: 0.5, y: 0.68 }}
                tracksViewChanges={false}
                onPress={() => focusZone(zone)}
              >
                <YStack alignItems="center">
                  <YStack
                    width={38}
                    height={38}
                    borderRadius="$full"
                    backgroundColor={isSelected ? "$primary" : "$info"}
                    borderWidth={3}
                    borderColor="$background"
                    alignItems="center"
                    justifyContent="center"
                  >
                    <Building size={17} color="white" />
                  </YStack>
                  <YStack
                    backgroundColor="$background"
                    paddingHorizontal="$2"
                    paddingVertical="$0.5"
                    borderRadius="$full"
                    marginTop="$1"
                    borderWidth={1}
                    borderColor={isSelected ? "$primary" : "$info"}
                  >
                    <Text
                      fontSize="$1"
                      fontWeight="800"
                      color={isSelected ? "$primary" : "$info"}
                      numberOfLines={1}
                      maxWidth={110}
                    >
                      {zone.name}
                    </Text>
                  </YStack>
                </YStack>
              </Marker>
            );
          })}

          {riderLocation ? (
            <Marker
              coordinate={riderLocation}
              title="You"
              anchor={{ x: 0.5, y: 0.68 }}
              tracksViewChanges={false}
            >
              <RiderMarkerContent />
            </Marker>
          ) : null}
        </MapView>

        {selectedZone ? (
          <YStack
            position="absolute"
            top="$3"
            left="$3"
            right="$3"
            backgroundColor="$background"
            paddingHorizontal="$3"
            paddingVertical="$2"
            borderRadius="$3"
            shadowColor="$shadowColorStrong"
            shadowOpacity={1}
            shadowRadius={8}
            shadowOffset={{ width: 0, height: 2 }}
            elevation={3}
          >
            <XStack gap="$2" alignItems="center">
              <MapPin size={15} color="$primary" />
              <Text
                fontSize="$3"
                fontWeight="700"
                color="$color"
                flex={1}
                numberOfLines={1}
              >
                {selectedZone.name}
              </Text>
              <Text fontSize="$2" color="$colorSecondary">
                {selectedZone.max_delivery_radius_km} km
              </Text>
            </XStack>
            <Text fontSize="$2" color="$colorSecondary" numberOfLines={1}>
              {formatZoneAddress(selectedZone)}
            </Text>
          </YStack>
        ) : null}
      </YStack>

      <XStack gap="$4" alignItems="center" flexWrap="wrap">
        <XStack gap="$2" alignItems="center">
          <YStack
            width={10}
            height={10}
            borderRadius="$full"
            backgroundColor="$primary"
          />
          <Text fontSize="$2" color="$colorSecondary">
            Selected business
          </Text>
        </XStack>
        <XStack gap="$2" alignItems="center">
          <YStack
            width={10}
            height={10}
            borderRadius="$full"
            backgroundColor="$info"
          />
          <Text fontSize="$2" color="$colorSecondary">
            Other joined businesses
          </Text>
        </XStack>
        <XStack gap="$2" alignItems="center">
          <YStack
            width={10}
            height={10}
            borderRadius="$full"
            backgroundColor="$success"
          />
          <Text fontSize="$2" color="$colorSecondary">
            You
          </Text>
        </XStack>
      </XStack>

      <Separator />

      <XStack justifyContent="space-between" alignItems="center">
        <YStack gap="$1">
          <Text fontSize="$5" fontWeight="700" color="$color">
            Your businesses
          </Text>
          <Text fontSize="$3" color="$colorSecondary">
            {zones.length} {zones.length === 1 ? "business" : "businesses"} ·{" "}
            {zones.filter((zone) => zone.delivery_enabled).length} accepting
            deliveries
          </Text>
        </YStack>
        <Button
          variant="ghost"
          width={40}
          height={40}
          circular
          icon={<RefreshCw size={17} color="$color" />}
          onPress={() => refetch()}
        />
      </XStack>
    </YStack>
  );

  return (
    <YStack flex={1} backgroundColor="$background" alignItems="center">
      <XStack
        width="100%"
        maxWidth={960}
        paddingHorizontal="$4"
        paddingTop={insets.top + 12}
        paddingBottom="$3"
        justifyContent="space-between"
        alignItems="center"
        backgroundColor="$background"
      >
        <BackButton />
        <Text fontSize="$6" fontWeight="800" fontFamily="$heading">
          Delivery Zones
        </Text>
        <YStack width={40} />
      </XStack>

      {isLoading ? (
        <YStack flex={1} justifyContent="center" alignItems="center" gap="$3">
          <Spinner size="large" color="$primary" />
          <Text color="$colorSecondary">Loading your delivery coverage...</Text>
        </YStack>
      ) : isError ? (
        <YStack
          flex={1}
          justifyContent="center"
          alignItems="center"
          gap="$3"
          padding="$6"
        >
          <MapPin size={40} color="$colorMuted" />
          <Text fontSize="$5" fontWeight="700" color="$color" textAlign="center">
            Could not load delivery zones
          </Text>
          <Text fontSize="$3" color="$colorSecondary" textAlign="center">
            Check your connection and try again.
          </Text>
          <Button
            variant="outline"
            icon={<RefreshCw size={16} />}
            onPress={() => refetch()}
          >
            Try Again
          </Button>
        </YStack>
      ) : (
        <FlatList
          data={zones}
          keyExtractor={(item) => item.id}
          style={{ width: "100%", maxWidth: 960 }}
          contentContainerStyle={{
            width: "100%",
            paddingHorizontal: 16,
            paddingBottom: insets.bottom + 24,
          }}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={header}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={() => refetch()}
              tintColor={theme.primary.val}
            />
          }
          ListEmptyComponent={
            <YStack
              alignItems="center"
              justifyContent="center"
              padding="$6"
              gap="$3"
            >
              <Building size={48} color="$colorMuted" />
              <Text fontSize="$5" fontWeight="700" color="$color" textAlign="center">
                You have not joined a business yet
              </Text>
              <Text fontSize="$3" color="$colorSecondary" textAlign="center">
                Join a business to see its delivery radius and get delivery
                requests in that area.
              </Text>
              <Button
                variant="primary"
                onPress={() => router.push("/(rider)/businesses")}
              >
                Browse Businesses
              </Button>
            </YStack>
          }
          ItemSeparatorComponent={() => <Separator />}
          renderItem={({ item: zone }) => {
            const isSelected = selectedZone?.id === zone.id;
            const coordinate = getZoneCoordinate(zone);

            return (
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => focusZone(zone)}
                disabled={!coordinate}
              >
                <XStack
                  gap="$3"
                  paddingVertical="$3"
                  paddingHorizontal="$2"
                  alignItems="center"
                  backgroundColor={
                    isSelected ? "$backgroundOrange" : "transparent"
                  }
                  borderRadius="$3"
                  opacity={coordinate ? 1 : 0.55}
                >
                  <Avatar circular size="$11">
                    <CachedAvatarImage src={zone.logo_url} />
                    <Avatar.Fallback
                      alignItems="center"
                      justifyContent="center"
                      backgroundColor="$backgroundSoft"
                    >
                      <Building size={20} color="$primary" />
                    </Avatar.Fallback>
                  </Avatar>

                  <YStack flex={1} gap="$1">
                    <XStack gap="$2" alignItems="center">
                      <Text
                        fontSize="$4"
                        fontWeight="700"
                        color="$color"
                        flex={1}
                        numberOfLines={1}
                      >
                        {zone.name}
                      </Text>
                      <YStack
                        backgroundColor={
                          zone.delivery_enabled
                            ? "$backgroundOrange"
                            : "$backgroundSoft"
                        }
                        paddingHorizontal="$2"
                        paddingVertical="$0.5"
                        borderRadius="$full"
                      >
                        <Text
                          fontSize="$1"
                          fontWeight="700"
                          color={
                            zone.delivery_enabled
                              ? "$primary"
                              : "$colorSecondary"
                          }
                        >
                          {zone.delivery_enabled ? "DELIVERING" : "PAUSED"}
                        </Text>
                      </YStack>
                    </XStack>

                    <Text
                      fontSize="$2"
                      color="$colorSecondary"
                      numberOfLines={1}
                    >
                      {formatZoneAddress(zone)}
                    </Text>

                    <XStack gap="$3" alignItems="center" flexWrap="wrap">
                      <XStack gap="$1" alignItems="center">
                        <MapPin size={13} color="$primary" />
                        <Text fontSize="$2" color="$colorSecondary">
                          {zone.max_delivery_radius_km} km radius
                          {zone.radius_is_default ? " (default)" : ""}
                        </Text>
                      </XStack>
                      <Text fontSize="$2" color="$colorMuted">
                        #{zone.business_number}
                      </Text>
                    </XStack>
                  </YStack>

                  <ChevronRight size={18} color="$colorMuted" />
                </XStack>
              </TouchableOpacity>
            );
          }}
          initialNumToRender={8}
          windowSize={5}
          maxToRenderPerBatch={8}
          removeClippedSubviews
        />
      )}
    </YStack>
  );
}
