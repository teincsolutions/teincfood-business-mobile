// @ts-nocheck
import { useEffect, useState } from "react";
import { FlatList, RefreshControl } from "react-native";
import { YStack, XStack, Text, Card } from "tamagui";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Car, Plus, Search, User, ChevronRight } from "@tamagui/lucide-icons";
import { useFleetVehiclesQuery, useFleetRidersQuery } from "@teincfood/core";
import { useRouter } from "expo-router";
import { Button, Input } from "@/components/ui";
import { MasterDetail, useResponsiveLayout } from "@/components/layout";
import { VehicleDetailView } from "@/components/fleet/VehicleDetailView";

export default function FleetVehiclesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  // Drawer content is single-pane at every size; details push normally.
  const isTwoPane = false;
  const { data: vehiclesRes, refetch, isRefetching } = useFleetVehiclesQuery();
  const { data: ridersRes } = useFleetRidersQuery();
  const vehicles = vehiclesRes?.data ?? [];
  const riders = ridersRes?.data ?? [];
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<
    "all" | "motorcycle" | "car" | "bicycle"
  >("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const filteredVehicles = vehicles.filter((vehicle) => {
    const matchesSearch = vehicle.plate_number
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesType = filterType === "all" || vehicle.type === filterType;
    return matchesSearch && matchesType;
  });

  const selectedVehicle =
    vehicles.find((vehicle) => vehicle.id === selectedId) ?? null;

  useEffect(() => {
    if (!isTwoPane) {
      setSelectedId(null);
      return;
    }
    if (!selectedId && filteredVehicles.length > 0) {
      setSelectedId(filteredVehicles[0].id);
    }
  }, [isTwoPane, filteredVehicles, selectedId]);

  const getAssignedRider = (riderId?: string | null) => {
    if (!riderId) return null;
    return riders.find((rider) => rider.id === riderId);
  };

  const openVehicle = (vehicleId: string) => {
    if (isTwoPane) {
      setSelectedId(vehicleId);
    } else {
      router.push(`/(fleet)/vehicles/${vehicleId}`);
    }
  };

  const typeFilters = ["all", "motorcycle", "car", "bicycle"] as const;

  const renderVehicle = ({ item: vehicle }) => {
    const assignedRider = getAssignedRider(vehicle.rider_id);
    const isSelected = isTwoPane && selectedId === vehicle.id;

    return (
      <Card
        padding="$4"
        bordered
        marginBottom="$3"
        borderColor={isSelected ? "$primary" : undefined}
        backgroundColor={isSelected ? "$backgroundSoft" : undefined}
        pressStyle={{ scale: 0.98, opacity: 0.9 }}
        onPress={() => openVehicle(vehicle.id)}
      >
        <XStack gap="$3" alignItems="center">
          <YStack
            width={56}
            height={56}
            borderRadius="$4"
            backgroundColor={
              vehicle.ownership === "fleet"
                ? "$primaryLight"
                : "$backgroundSoft"
            }
            alignItems="center"
            justifyContent="center"
            flexShrink={0}
          >
            <Car
              size={20}
              color={
                vehicle.ownership === "fleet" ? "$primary" : "$colorMuted"
              }
            />
          </YStack>

          <YStack flex={1} gap="$1" minWidth={0}>
            <XStack
              justifyContent="space-between"
              alignItems="center"
              gap="$2"
            >
              <Text
                fontSize="$5"
                fontWeight="600"
                fontFamily="$heading"
                flexShrink={1}
                numberOfLines={1}
              >
                {vehicle.plate_number}
              </Text>
              <YStack
                paddingHorizontal="$2"
                paddingVertical="$1"
                borderRadius="$2"
                backgroundColor={
                  vehicle.rider_id ? "$success" : "$backgroundSoft"
                }
              >
                <Text
                  fontSize="$2"
                  color={vehicle.rider_id ? "$white" : "$colorSecondary"}
                  fontFamily="$body"
                >
                  {vehicle.rider_id ? "Assigned" : "Unassigned"}
                </Text>
              </YStack>
            </XStack>

            <Text
              fontSize="$3"
              color="$colorSecondary"
              fontFamily="$body"
              numberOfLines={1}
            >
              {vehicle.type}{" "}
              {vehicle.ownership === "fleet" ? "(Fleet)" : "(Individual)"}
            </Text>

            {assignedRider && (
              <XStack gap="$2" alignItems="center" marginTop="$1">
                <User size={14} color="$colorMuted" />
                <Text
                  fontSize="$2"
                  color="$colorSecondary"
                  fontFamily="$body"
                  numberOfLines={1}
                >
                  Rider:{" "}
                  {assignedRider.user?.full_name ||
                    assignedRider.rider_number}
                </Text>
              </XStack>
            )}
          </YStack>

          <ChevronRight size={20} color="$colorMuted" />
        </XStack>
      </Card>
    );
  };

  const header = (
    <YStack gap="$4" paddingTop="$4" paddingBottom="$2">
      <YStack gap="$2">
        <Text
          fontSize="$8"
          fontWeight="bold"
          fontFamily="$heading"
          color="$color"
        >
          Vehicles
        </Text>
        <Text fontSize="$4" color="$colorSecondary" fontFamily="$body">
          Manage your fleet vehicles
        </Text>
      </YStack>

      <YStack gap="$3">
        <XStack gap="$3" alignItems="center">
          <YStack flex={1} position="relative">
            <Input
              placeholder="Search vehicles..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              paddingStart="$8"
            />
            <YStack position="absolute" left="$3" top="$5">
              <Search size={20} color="$colorMuted" />
            </YStack>
          </YStack>
          <Button
            variant="outline"
            icon={Plus}
            onPress={() => router.push("/(fleet)/vehicles/add")}
          >
            Add Vehicle
          </Button>
        </XStack>

        <XStack gap="$2" flexWrap="wrap">
          {typeFilters.map((type) => (
            <Button
              key={type}
              size="$2"
              variant={filterType === type ? "primary" : "outline"}
              onPress={() => setFilterType(type)}
            >
              {type === "all"
                ? "All"
                : type.charAt(0).toUpperCase() + type.slice(1)}{" "}
              {`(${
                type === "all"
                  ? vehicles.length
                  : vehicles.filter((v) => v.type === type).length || "0"
              })`}
            </Button>
          ))}
        </XStack>
      </YStack>
    </YStack>
  );

  const list = (
    <FlatList
      data={filteredVehicles}
      keyExtractor={(item) => item.id}
      renderItem={renderVehicle}
      ListHeaderComponent={isTwoPane ? undefined : header}
      ListEmptyComponent={
        <Card bordered padding="$6">
          <YStack alignItems="center" gap="$3">
            <Car size={48} color="$colorMuted" />
            <Text
              fontSize="$5"
              fontWeight="600"
              textAlign="center"
              fontFamily="$heading"
            >
              {searchQuery || filterType !== "all"
                ? "No vehicles found"
                : "No vehicles yet"}
            </Text>
            <Text
              fontSize="$4"
              color="$colorSecondary"
              textAlign="center"
              fontFamily="$body"
            >
              {searchQuery || filterType !== "all"
                ? "Try adjusting your search or filter"
                : "Add your first vehicle to get started"}
            </Text>
            {!searchQuery && filterType === "all" && (
              <Button
                variant="primary"
                maxWidth={360}
                alignSelf="center"
                onPress={() => router.push("/(fleet)/vehicles/add")}
              >
                Add Vehicle
              </Button>
            )}
          </YStack>
        </Card>
      }
      refreshControl={
        <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
      }
      contentContainerStyle={{
        paddingHorizontal: isTwoPane ? 12 : 16,
        paddingBottom: Math.max(insets.bottom + 20, 24),
      }}
      initialNumToRender={10}
      windowSize={5}
      maxToRenderPerBatch={10}
      removeClippedSubviews
    />
  );

  if (!isTwoPane) {
    return (
      <YStack flex={1} backgroundColor="$background">
        <YStack flex={1} width="100%" maxWidth={960} alignSelf="center">
          {list}
        </YStack>
      </YStack>
    );
  }

  return (
    <YStack flex={1} backgroundColor="$background">
      <YStack
        width="100%"
        maxWidth={1060}
        alignSelf="center"
        paddingHorizontal="$4"
      >
        {header}
      </YStack>
      <MasterDetail
        master={list}
        detail={
          selectedVehicle ? (
            <VehicleDetailView
              vehicleId={selectedVehicle.id}
              initialVehicle={selectedVehicle}
              embedded
              onClose={() => setSelectedId(null)}
            />
          ) : null
        }
        empty={
          <YStack
            flex={1}
            alignItems="center"
            justifyContent="center"
            gap="$3"
            padding="$6"
          >
            <Car size={56} color="$colorMuted" />
            <Text fontSize="$5" fontWeight="600" fontFamily="$heading">
              Select a vehicle
            </Text>
            <Text
              fontSize="$4"
              color="$colorSecondary"
              fontFamily="$body"
              textAlign="center"
            >
              Choose a vehicle from the list to see its details.
            </Text>
          </YStack>
        }
      />
    </YStack>
  );
}
