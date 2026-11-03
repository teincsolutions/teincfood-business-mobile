// @ts-nocheck
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from "react";
import { YStack, XStack, Text, useTheme } from "tamagui";
import { Building, MapPin } from "@tamagui/lucide-icons";
import MapView, { Circle, Marker, PROVIDER_GOOGLE } from "react-native-maps";
import { RiderMarkerContent } from "@/components/rider/DeliveryMarkers";
import type { RiderDeliveryZone } from "@/services/rider-zones.service";
import {
  formatRiderZoneAddress,
  getRiderZoneCoordinate,
  type RiderZoneCoordinate,
} from "@/utils/rider-zones";

export interface RiderCoverageMapHandle {
  focusZone: (zone: RiderDeliveryZone) => void;
  fitAll: () => void;
}

interface RiderCoverageMapProps {
  zones: RiderDeliveryZone[];
  riderLocation?: RiderZoneCoordinate | null;
  height?: number;
  selectedZoneId?: string | null;
  onZonePress?: (zone: RiderDeliveryZone) => void;
  interactive?: boolean;
  showOverlay?: boolean;
}

export const RiderCoverageMap = forwardRef<
  RiderCoverageMapHandle,
  RiderCoverageMapProps
>(function RiderCoverageMap(
  {
    zones,
    riderLocation,
    height = 240,
    selectedZoneId,
    onZonePress,
    interactive = true,
    showOverlay = true,
  },
  ref,
) {
  const theme = useTheme();
  const mapRef = useRef<MapView>(null);
  const [internalSelectedId, setInternalSelectedId] = useState<string | null>(
    null,
  );

  const activeSelectedId =
    selectedZoneId !== undefined ? selectedZoneId : internalSelectedId;
  const selectedZone =
    zones.find((zone) => zone.id === activeSelectedId) ?? zones[0] ?? null;

  const fitAll = useCallback(() => {
    if (!mapRef.current) return;

    const coordinates = zones
      .map(getRiderZoneCoordinate)
      .filter(Boolean) as RiderZoneCoordinate[];

    if (riderLocation) coordinates.push(riderLocation);
    if (coordinates.length === 0) return;

    mapRef.current.fitToCoordinates(coordinates, {
      edgePadding: { top: 70, right: 50, bottom: 70, left: 50 },
      animated: true,
    });
  }, [zones, riderLocation?.latitude, riderLocation?.longitude]);

  const focusZone = useCallback((zone: RiderDeliveryZone) => {
    const coordinate = getRiderZoneCoordinate(zone);
    if (!coordinate || !mapRef.current) return;

    setInternalSelectedId(zone.id);
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

  useImperativeHandle(ref, () => ({ focusZone, fitAll }), [fitAll, focusZone]);

  useEffect(() => {
    const timer = setTimeout(fitAll, 300);
    return () => clearTimeout(timer);
  }, [fitAll]);

  const handleZonePress = useCallback(
    (zone: RiderDeliveryZone) => {
      focusZone(zone);
      onZonePress?.(zone);
    },
    [focusZone, onZonePress],
  );

  return (
    <YStack
      height={height}
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
        showsCompass={interactive}
        toolbarEnabled={false}
        scrollEnabled={interactive}
        zoomEnabled={interactive}
        rotateEnabled={interactive}
        pitchEnabled={interactive}
        initialRegion={{
          latitude: riderLocation?.latitude ?? 5.6037,
          longitude: riderLocation?.longitude ?? -0.187,
          latitudeDelta: 0.18,
          longitudeDelta: 0.18,
        }}
        mapPadding={{ top: 50, bottom: 50, left: 16, right: 16 }}
      >
        {zones.map((zone) => {
          const coordinate = getRiderZoneCoordinate(zone);
          if (!coordinate) return null;
          const isSelected = selectedZone?.id === zone.id;

          return (
            <Circle
              key={`radius-${zone.id}`}
              center={coordinate}
              radius={zone.max_delivery_radius_km * 1000}
              strokeColor={isSelected ? theme.primary.val : theme.info.val}
              strokeWidth={isSelected ? 2.5 : 1.5}
              fillColor={
                isSelected ? theme.primaryMuted.val : theme.infoMuted.val
              }
            />
          );
        })}

        {zones.map((zone) => {
          const coordinate = getRiderZoneCoordinate(zone);
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
              onPress={() => handleZonePress(zone)}
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

      {showOverlay && selectedZone ? (
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
            {formatRiderZoneAddress(selectedZone)}
          </Text>
        </YStack>
      ) : null}
    </YStack>
  );
});
