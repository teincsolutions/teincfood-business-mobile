// @ts-nocheck
import { useState, useCallback } from "react";
import { FlatList, RefreshControl } from "react-native";
import { YStack, XStack, Text, Card } from "tamagui";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Car,
  Plus,
  Search,
  User,
  ChevronRight,
} from "@tamagui/lucide-icons";
import { useFleetVehiclesQuery, useFleetRidersQuery } from "@/hooks/useFleet";
import { useRouter } from "expo-router";
import { Button, Input } from "@/components/ui";

export default function FleetVehiclesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data: vehiclesRes, refetch, isRefetching } = useFleetVehiclesQuery();
  const { data: ridersRes } = useFleetRidersQuery();
  const vehicles = vehiclesRes?.data ?? [];
  const riders = ridersRes?.data ?? [];
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "motorcycle" | "car" | "bicycle">("all");

  const filteredVehicles = vehicles.filter((vehicle) => {
    const matchesSearch =
      vehicle.plate_number.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === "all" || vehicle.type === filterType;
    return matchesSearch && matchesType;
  });

  const getAssignedRider = (riderId?: string) => {
    if (!riderId) return null;
    return riders.find((r) => r.id === riderId);
  };

  const typeFilters = ["all", "motorcycle", "car", "bicycle"] as const;

  const onRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const renderVehicle = ({ item: vehicle }) => {
    const assignedRider = getAssignedRider(vehicle.rider_id);
    return (
      <Card
        padding="$4"
        bordered
        marginBottom="$3"
        pressStyle={{ scale: 0.98, opacity: 0.9 }}
        onPress={() => router.push(`/(fleet)/vehicles/${vehicle.id}`)}
      >
        <XStack gap="$3" alignItems="center">
          <YStack
            width={56}
            height={56}
            borderRadius="$4"
            backgroundColor={vehicle.ownership === "fleet" ? "$primaryLight" : "$backgroundSoft"}
            alignItems="center"
            justifyContent="center"
          >
            <Car size={20} color={vehicle.ownership === "fleet" ? "$primary" : "$colorMuted"} />
          </YStack>

          <YStack flex={1} gap="$1">
            <XStack justifyContent="space-between" alignItems="center">
              <Text fontSize="$5" fontWeight="600" fontFamily="$heading">
                {vehicle.plate_number}
              </Text>
              <YStack
                paddingHorizontal="$2"
                paddingVertical="$1"
                borderRadius="$2"
                backgroundColor={Boolean(vehicle.rider_id) ? "$success" : "$backgroundSoft"}
              >
                <Text fontSize="$2" color={Boolean(vehicle.rider_id) ? "$white" : "$colorSecondary"} fontFamily="$body">
                  {vehicle.rider_id ? "Assigned" : "Unassigned"}
                </Text>
              </YStack>
            </XStack>

            <Text fontSize="$3" color="$colorSecondary" fontFamily="$body">
              {vehicle.type} {vehicle.ownership === "fleet" ? "(Fleet)" : "(Individual)"}
            </Text>

            {assignedRider && (
              <XStack gap="$2" alignItems="center" marginTop="$1">
                <User size={14} color="$colorMuted" />
                <Text fontSize="$2" color="$colorSecondary" fontFamily="$body">
                  Rider: {assignedRider.user?.full_name || assignedRider.rider_number}
                </Text>
              </XStack>
            )}
          </YStack>

          <ChevronRight size={20} color="$colorMuted" />
        </XStack>
      </Card>
    );
  };

  const ListHeaderComponent = () => (
    <YStack gap="$4" padding="$4" paddingBottom="$2">
      <YStack gap="$2">
        <Text fontSize="$8" fontWeight="bold" fontFamily="$heading" color="$color">
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
          <Button variant="outline" icon={Plus} onPress={() => router.push("/(fleet)/vehicles/add")}>
            Add Vehicle
          </Button>
        </XStack>

        <FlatList
          horizontal
          data={typeFilters}
          keyExtractor={(t) => t}
          renderItem={({ item: type }) => (
            <Button
              size="$2"
              variant={filterType === type ? "primary" : "outline"}
              onPress={() => setFilterType(type)}
              marginRight="$2"
            >
              {type === "all" ? "All" : type.charAt(0).toUpperCase() + type.slice(1)} {`(${type === "all" ? vehicles.length : vehicles.filter((v) => v.type === type).length || "0"})`}
            </Button>
          )}
          showsHorizontalScrollIndicator={false}
        />
      </YStack>
    </YStack>
  );

  const ListEmptyComponent = () => (
    <Card padding="$6" bordered margin="$4">
      <YStack alignItems="center" gap="$3">
        <Car size={48} color="$colorMuted" />
        <Text fontSize="$5" fontWeight="600" textAlign="center" fontFamily="$heading">
          {searchQuery || filterType !== "all" ? "No vehicles found" : "No vehicles yet"}
        </Text>
        <Text fontSize="$4" color="$colorSecondary" textAlign="center" fontFamily="$body">
          {searchQuery || filterType !== "all" ? "Try adjusting your search or filter" : "Add your first vehicle to get started"}
        </Text>
        {!searchQuery && filterType === "all" && (
          <Button onPress={() => router.push("/(fleet)/vehicles/add")}>Add Vehicle</Button>
        )}
      </YStack>
    </Card>
  );

  return (
    <FlatList
      data={filteredVehicles}
      keyExtractor={(item) => item.id}
      renderItem={renderVehicle}
      ListHeaderComponent={ListHeaderComponent}
      ListEmptyComponent={ListEmptyComponent}
      refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={onRefresh} />}
      contentContainerStyle={{
        paddingBottom: Math.max(insets.bottom + 20, 24),
      }}
      initialNumToRender={10}
      windowSize={5}
      maxToRenderPerBatch={10}
      removeClippedSubviews
    />
  );
}
