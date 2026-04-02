// @ts-nocheck
import { useState } from "react";
import { ScrollView } from "react-native";
import {
  YStack,
  XStack,
  Text,
  Card,
  Avatar,
  Separator,
} from "tamagui";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Car,
  Plus,
  Search,
  User,
  MoreVertical,
  ChevronRight,
  Truck,
  Bike,
} from "@tamagui/lucide-icons";
import { useFleetStore } from "@/stores/fleet.store";
import { useRouter } from "expo-router";
import { Button, Input } from "@/components/ui";

export default function FleetVehiclesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { vehicles, riders } = useFleetStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "motorcycle" | "car" | "bicycle" | "van">("all");

  const filteredVehicles = vehicles.filter((vehicle) => {
    const matchesSearch =
      vehicle.plateNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vehicle.model?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vehicle.brand?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType =
      filterType === "all" || vehicle.vehicleType === filterType;

    return matchesSearch && matchesType;
  });

  const getVehicleIcon = (type: string) => {
    switch (type) {
      case "motorcycle":
        return <Bike size={20} color="$colorMuted" />;
      case "car":
      case "van":
      case "truck":
        return <Car size={20} color="$colorMuted" />;
      default:
        return <Car size={20} color="$colorMuted" />;
    }
  };

  const getAssignedRider = (riderId?: string) => {
    if (!riderId) return null;
    return riders.find((r) => r.id === riderId);
  };

  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{
        paddingBottom: Math.max(insets.bottom + 20, 24),
      }}
    >
      <YStack padding="$4" gap="$4">
        {/* Header */}
        <YStack gap="$2">
          <Text fontSize="$8" fontWeight="bold" fontFamily="$heading" color="$color">
            Vehicles
          </Text>
          <Text fontSize="$4" color="$colorSecondary" fontFamily="$body">
            Manage your fleet vehicles
          </Text>
        </YStack>

        {/* Search and Filter */}
        <YStack gap="$3">
          <XStack gap="$3" alignItems="center">
            <YStack flex={1} position="relative">
              <Input
                placeholder="Search vehicles..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                paddingLeft="$4"
              />
              <YStack position="absolute" left="$3" top="$3">
                <Search size={20} color="$colorMuted" />
              </YStack>
            </YStack>
            <Button
              icon={Plus}
              onPress={() => router.push("/(fleet)/vehicles/add")}
            >
              Add Vehicle
            </Button>
          </XStack>

          {/* Type Filter */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <XStack gap="$2">
              <Button
                size="$2"
                variant={filterType === "all" ? "solid" : "outlined"}
                onPress={() => setFilterType("all")}
              >
                All ({vehicles.length})
              </Button>
              <Button
                size="$2"
                variant={filterType === "motorcycle" ? "solid" : "outlined"}
                onPress={() => setFilterType("motorcycle")}
              >
                Motorcycle ({vehicles.filter((v) => v.vehicleType === "motorcycle").length})
              </Button>
              <Button
                size="$2"
                variant={filterType === "car" ? "solid" : "outlined"}
                onPress={() => setFilterType("car")}
              >
                Car ({vehicles.filter((v) => v.vehicleType === "car").length})
              </Button>
              <Button
                size="$2"
                variant={filterType === "van" ? "solid" : "outlined"}
                onPress={() => setFilterType("van")}
              >
                Van ({vehicles.filter((v) => v.vehicleType === "van").length})
              </Button>
              <Button
                size="$2"
                variant={filterType === "bicycle" ? "solid" : "outlined"}
                onPress={() => setFilterType("bicycle")}
              >
                Bicycle ({vehicles.filter((v) => v.vehicleType === "bicycle").length})
              </Button>
            </XStack>
          </ScrollView>
        </YStack>

        {/* Vehicles List */}
        <YStack gap="$3">
          {filteredVehicles.map((vehicle) => {
            const assignedRider = getAssignedRider(vehicle.assignedRiderId);
            return (
              <Card
                key={vehicle.id}
                padding="$4"
                bordered
                pressStyle={{ scale: 0.98, opacity: 0.9 }}
                onPress={() => router.push(`/(fleet)/vehicles/${vehicle.id}`)}
              >
                <XStack gap="$3" alignItems="center">
                  <YStack
                    width={56}
                    height={56}
                    borderRadius="$4"
                    backgroundColor={vehicle.isActive ? "$blue2" : "$gray2"}
                    alignItems="center"
                    justifyContent="center"
                  >
                    {getVehicleIcon(vehicle.vehicleType)}
                  </YStack>

                  <YStack flex={1} gap="$1">
                    <XStack justifyContent="space-between" alignItems="center">
                      <Text fontSize="$5" fontWeight="600" fontFamily="$heading">
                        {vehicle.plateNumber}
                      </Text>
                      <YStack
                        paddingHorizontal="$2"
                        paddingVertical="$1"
                        borderRadius="$2"
                        backgroundColor={vehicle.isActive ? "$green2" : "$gray2"}
                      >
                        <Text
                          fontSize="$2"
                          color={vehicle.isActive ? "$green10" : "$gray10"}
                          fontFamily="$body"
                        >
                          {vehicle.isActive ? "Active" : "Inactive"}
                        </Text>
                      </YStack>
                    </XStack>

                    <Text fontSize="$3" color="$colorSecondary" fontFamily="$body">
                      {vehicle.brand} {vehicle.model} {vehicle.year && `(${vehicle.year})`}
                    </Text>

                    <XStack gap="$3" alignItems="center">
                      <Text fontSize="$2" color="$colorMuted" textTransform="capitalize" fontFamily="$body">
                        {vehicle.vehicleType}
                      </Text>
                      {vehicle.color && (
                        <>
                          <Text fontSize="$2" color="$colorMuted" fontFamily="$body">
                            •
                          </Text>
                          <Text fontSize="$2" color="$colorMuted" fontFamily="$body">
                            {vehicle.color}
                          </Text>
                        </>
                      )}
                    </XStack>

                    {assignedRider && (
                      <XStack gap="$2" alignItems="center" marginTop="$1">
                        <User size={14} color="$colorMuted" />
                        <Text fontSize="$2" color="$colorSecondary" fontFamily="$body">
                          Assigned to: {assignedRider.riderName}
                        </Text>
                      </XStack>
                    )}

                    {!vehicle.assignedRiderId && vehicle.isActive && (
                      <XStack gap="$2" alignItems="center" marginTop="$1">
                        <Text fontSize="$2" color="$orange10" fontFamily="$body">
                          Not assigned to any rider
                        </Text>
                      </XStack>
                    )}
                  </YStack>

                  <ChevronRight size={20} color="$colorMuted" />
                </XStack>
              </Card>
            );
          })}

          {filteredVehicles.length === 0 && (
            <Card padding="$6" bordered>
              <YStack alignItems="center" gap="$3">
                <Car size={48} color="$colorMuted" />
                <Text fontSize="$5" fontWeight="600" textAlign="center" fontFamily="$heading">
                  {searchQuery || filterType !== "all"
                    ? "No vehicles found"
                    : "No vehicles yet"}
                </Text>
                <Text fontSize="$4" color="$colorSecondary" textAlign="center" fontFamily="$body">
                  {searchQuery || filterType !== "all"
                    ? "Try adjusting your search or filter"
                    : "Add your first vehicle to get started"}
                </Text>
                {!searchQuery && filterType === "all" && (
                  <Button onPress={() => router.push("/(fleet)/vehicles/add")}>
                    Add Vehicle
                  </Button>
                )}
              </YStack>
            </Card>
          )}
        </YStack>
      </YStack>
    </ScrollView>
  );
}