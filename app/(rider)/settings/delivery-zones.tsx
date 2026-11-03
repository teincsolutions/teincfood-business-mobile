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
import { BackButton, Button } from "@/components/ui";
import { CachedAvatarImage } from "@/components/ui/CachedAvatarImage";
import {
  RiderCoverageMap,
  type RiderCoverageMapHandle,
} from "@/components/rider/RiderCoverageMap";
import { useRiderDeliveryZonesQuery } from "@/hooks/useRiderDeliveryZones";
import { useRiderProfileQuery } from "@teincfood/core";
import type { RiderDeliveryZone } from "@/services/rider-zones.service";
import {
  formatRiderZoneAddress,
  getRiderZoneCoordinate,
} from "@/utils/rider-zones";

export default function DeliveryZones() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { height: screenHeight } = useWindowDimensions();
  const theme = useTheme();
  const coverageMapRef = useRef<RiderCoverageMapHandle>(null);
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

  const focusZone = useCallback((zone: RiderDeliveryZone) => {
    setSelectedZoneId(zone.id);
    coverageMapRef.current?.focusZone(zone);
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

      <RiderCoverageMap
        ref={coverageMapRef}
        zones={zones}
        riderLocation={riderLocation}
        height={mapHeight}
        selectedZoneId={selectedZone?.id ?? null}
        onZonePress={(zone) => setSelectedZoneId(zone.id)}
      />

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
            const coordinate = getRiderZoneCoordinate(zone);

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
                      {formatRiderZoneAddress(zone)}
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
