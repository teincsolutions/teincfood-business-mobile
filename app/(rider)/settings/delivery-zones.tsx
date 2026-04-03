// @ts-nocheck
import {
  ScrollView,
  TouchableOpacity,
  FlatList,
  ListRenderItem,
  Platform,
} from "react-native";
import { YStack, XStack, Text, Card, Separator, Switch, Input } from "tamagui";
import {
  MapPin,
  Check,
  Save,
  Navigation,
  ArrowLeft,
  Search,
} from "@tamagui/lucide-icons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useState, useMemo, useCallback, useRef } from "react";
import MapView, { Marker, Circle, PROVIDER_GOOGLE } from "react-native-maps";
import { BackButton, Button } from "@/components/ui";
import {
  useDeliveryZonesQuery,
  useUpdateDeliveryZonesMutation,
  useToggleDeliveryZoneMutation,
} from "@/hooks/rider.hooks";
import type { DeliveryZone } from "@/models/rider.model";

/**
 * Rider Delivery Zones Screen
 */
export default function DeliveryZones() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState("");

  // TanStack Query hooks
  const { data: zones = [], isLoading } = useDeliveryZonesQuery();
  const updateZones = useUpdateDeliveryZonesMutation();
  const toggleZone = useToggleDeliveryZoneMutation();

  // Filter zones based on search query
  const filteredZones = useMemo(() => {
    if (!searchQuery.trim()) return zones;
    const query = searchQuery.toLowerCase();
    return zones.filter((zone) => zone.name.toLowerCase().includes(query));
  }, [zones, searchQuery]);

  const handleToggleZone = useCallback(
    (zoneId: string, currentEnabled: boolean) => {
      toggleZone.mutate({ zoneId, enabled: !currentEnabled });
    },
    [toggleZone],
  );

  const handleSave = () => {
    router.back();
  };

  const enabledZones = zones.filter((z) => z.enabled).length;

  const renderItem: ListRenderItem<DeliveryZone> = useCallback(
    ({ item: zone, index }) => (
      <YStack>
        <TouchableOpacity
          activeOpacity={0.5}
          onPress={() => handleToggleZone(zone.id, zone.enabled)}
        >
          <XStack
            padding="$3"
            borderRadius="$4"
            backgroundColor={zone.enabled ? "$green2" : "$gray2"}
            justifyContent="space-between"
            alignItems="center"
          >
            <XStack gap="$3" alignItems="center" flex={1}>
              <YStack
                width={40}
                height={40}
                borderRadius="$10"
                backgroundColor={zone.enabled ? "$green10" : "$gray800"}
                alignItems="center"
                justifyContent="center"
              >
                {zone.enabled ? (
                  <Check size={20} color="$color" />
                ) : (
                  <MapPin size={20} color="$color" />
                )}
              </YStack>
              <YStack flex={1}>
                <Text fontWeight="bold">{zone.name}</Text>
                <XStack gap="$2" alignItems="center">
                  <Text fontSize="$2" color="$colorMuted">
                    Radius: {zone.radius}
                  </Text>
                  <Text fontSize="$2" color="$colorMuted">
                    • {zone.deliveries} deliveries
                  </Text>
                </XStack>
              </YStack>
            </XStack>
            <Switch
              size="$6"
              checked={zone.enabled}
              onCheckedChange={() => handleToggleZone(zone.id, zone.enabled)}
              backgroundColor={zone.enabled ? "$color.green" : "$color.gray900"}
            >
              <Switch.Thumb backgroundColor="$white" />
            </Switch>
          </XStack>
        </TouchableOpacity>
        {index < filteredZones.length - 1 && <Separator marginTop="$2" />}
      </YStack>
    ),
    [filteredZones.length, handleToggleZone],
  );

  const keyExtractor = useCallback((item: DeliveryZone) => item.id, []);

  return (
    <YStack flex={1} backgroundColor="$background">
      {/* Header */}
      <XStack
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
        <Button
          variant="primary"
          height="$10"
          $lg={{ height: "$10" }}
          paddingHorizontal="$4"
          onPress={handleSave}
          loading={isLoading}
          icon={<Save size={18} color="white" />}
        >
          Save
        </Button>
      </XStack>

      <ScrollView showsVerticalScrollIndicator={false}>
        <YStack padding="$4" gap="$4" paddingBottom={insets.bottom + 20}>
          {/* Summary Card */}
          <Card padding="$4" bordered backgroundColor="$blue2">
            <YStack gap="$3" alignItems="center">
              <MapPin size={40} color="$primary" />
              <Text fontSize="$5" fontWeight="bold">
                Active Delivery Zones
              </Text>
              <Text fontSize="$7" fontWeight="800" color="$primary">
                {enabledZones} / {zones.length}
              </Text>
              <Text color="$colorMuted" fontSize="$3" textAlign="center">
                Enable the zones where you want to receive delivery requests
              </Text>
            </YStack>
          </Card>

          {/* Map with Delivery Zone Markers */}
          <Card padding="$4" bordered>
            <YStack gap="$3" alignItems="center">
              <Text fontSize="$5" fontWeight="bold">
                Coverage Map
              </Text>
              <YStack
                height={300}
                width="100%"
                borderRadius="$4"
                overflow="hidden"
              >
                <MapView
                  style={{ flex: 1 }}
                  provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
                  initialRegion={{
                    latitude: 5.6037,
                    longitude: -0.1870,
                    latitudeDelta: 0.5,
                    longitudeDelta: 0.5,
                  }}
                >
                  {zones.map((zone) => {
                    const radiusInMeters = parseInt(zone.radius) * 1000;
                    return (
                      <Marker
                        key={zone.id}
                        coordinate={{
                          latitude: zone.latitude,
                          longitude: zone.longitude,
                        }}
                        title={zone.name}
                        description={`${zone.radius} • ${zone.deliveries} deliveries`}
                        pinColor={zone.enabled ? '#22c55e' : '#9ca3af'}
                      />
                    );
                  })}
                  {zones.map((zone) => {
                    const radiusInMeters = parseInt(zone.radius) * 1000;
                    return (
                      <Circle
                        key={`circle-${zone.id}`}
                        center={{
                          latitude: zone.latitude,
                          longitude: zone.longitude,
                        }}
                        radius={radiusInMeters}
                        strokeColor={zone.enabled ? '#22c55e' : '#9ca3af'}
                        strokeWidth={2}
                        fillColor={
                          zone.enabled ? 'rgba(34, 197, 94, 0.15)' : 'rgba(156, 163, 175, 0.1)'
                        }
                      />
                    );
                  })}
                </MapView>
              </YStack>
              <XStack gap="$2" alignItems="center" flexWrap="wrap" justifyContent="center">
                <XStack gap="$1" alignItems="center">
                  <YStack
                    width={12}
                    height={12}
                    borderRadius="$10"
                    backgroundColor="$green500"
                  />
                  <Text fontSize="$2" color="$colorMuted">
                    Enabled
                  </Text>
                </XStack>
                <XStack gap="$1" alignItems="center">
                  <YStack
                    width={12}
                    height={12}
                    borderRadius="$10"
                    backgroundColor="$gray500"
                  />
                  <Text fontSize="$2" color="$colorMuted">
                    Disabled
                  </Text>
                </XStack>
              </XStack>
            </YStack>
          </Card>

          {/* Search Input */}
          <XStack position="relative" alignItems="center">
            <XStack position="absolute" left="$3" zIndex={1}>
              <Search size={20} color="$colorMuted" />
            </XStack>
            <Input
              flex={1}
              placeholder="Search zones..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              paddingLeft="$10"
            />
          </XStack>

          {/* Zone List */}
          <Card padding="$4" bordered>
            <YStack gap="$3">
              <XStack justifyContent="space-between" alignItems="center">
                <Text fontSize="$5" fontWeight="bold">
                  Available Zones
                </Text>
                <Text fontSize="$3" color="$colorMuted">
                  {filteredZones.length}{" "}
                  {filteredZones.length === 1 ? "zone" : "zones"}
                </Text>
              </XStack>
              <Separator />
              {filteredZones.length > 0 ? (
                <FlatList
                  data={filteredZones}
                  renderItem={renderItem}
                  keyExtractor={keyExtractor}
                  scrollEnabled={false}
                  showsVerticalScrollIndicator={false}
                  ItemSeparatorComponent={() => null}
                />
              ) : (
                <YStack padding="$4" alignItems="center">
                  <Search size={32} color="$colorMuted" />
                  <Text color="$colorMuted" marginTop="$2" textAlign="center">
                    No zones found matching "{searchQuery}"
                  </Text>
                </YStack>
              )}
            </YStack>
          </Card>

          {/* Tips Card */}
          <Card padding="$4" bordered backgroundColor="$yellow2">
            <YStack gap="$3">
              <Text fontSize="$5" fontWeight="bold">
                💡 Tips
              </Text>
              <Separator />
              <YStack gap="$2">
                <Text fontSize="$3">
                  • Enable zones with high delivery demand to maximize earnings
                </Text>
                <Text fontSize="$3">
                  • Consider your vehicle type when selecting zones
                </Text>
                <Text fontSize="$3">
                  • You can always adjust your zones later
                </Text>
              </YStack>
            </YStack>
          </Card>

          {/* Save Button */}
          <Button
            variant="primary"
            width="100%"
            icon={<Save size={18} />}
            onPress={handleSave}
          >
            Save Changes
          </Button>
        </YStack>
      </ScrollView>
    </YStack>
  );
}
