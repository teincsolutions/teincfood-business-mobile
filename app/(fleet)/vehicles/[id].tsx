// @ts-nocheck
import { ScrollView } from "react-native";
import { YStack, XStack, Text, Card, Separator } from "tamagui";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  Car,
  Bike,
  User,
  Palette,
  Calendar,
  Hash,
  Shield,
  Wrench,
} from "@tamagui/lucide-icons";
import { useFleetStore } from "@/stores/fleet.store";
import { BackButton, Button } from "@/components/ui";

function VehicleIcon({ type, size = 28 }: { type: string; size?: number }) {
  if (type === "motorcycle" || type === "bicycle") {
    return <Bike size={size} color="$colorMuted" />;
  }
  return <Car size={size} color="$colorMuted" />;
}

export default function VehicleDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { getVehicleById, getRiderById, updateVehicle } = useFleetStore();

  const vehicle = getVehicleById(id);

  if (!vehicle) {
    return (
      <YStack flex={1} alignItems="center" justifyContent="center" gap="$3">
        <Car size={48} color="$colorMuted" />
        <Text fontSize="$5" fontWeight="600">
          Vehicle not found
        </Text>
        <Button variant="outline" onPress={() => router.back()}>
          Go Back
        </Button>
      </YStack>
    );
  }

  const assignedRider = vehicle.assignedRiderId
    ? getRiderById(vehicle.assignedRiderId)
    : null;

  const toggleActive = () => {
    updateVehicle(vehicle.id, { isActive: !vehicle.isActive });
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
        <XStack
          alignItems="center"
          gap="$3"
          paddingTop={Math.max(insets.top, 12)}
        >
          <BackButton />
          <Text fontSize="$6" fontWeight="800" fontFamily="$heading">
            Vehicle Details
          </Text>
        </XStack>

        {/* Hero card */}
        <Card padding="$5" bordered>
          <YStack alignItems="center" gap="$3">
            <YStack
              width={80}
              height={80}
              borderRadius="$5"
              backgroundColor={vehicle.isActive ? "$primaryLight" : "$backgroundSoft"}
              alignItems="center"
              justifyContent="center"
            >
              <VehicleIcon type={vehicle.vehicleType} size={36} />
            </YStack>

            <YStack alignItems="center" gap="$1">
              <Text fontSize="$7" fontWeight="bold" fontFamily="$heading">
                {vehicle.plateNumber}
              </Text>
              <YStack
                paddingHorizontal="$3"
                paddingVertical="$1"
                borderRadius="$3"
                backgroundColor={vehicle.isActive ? "$green2" : "$gray2"}
              >
                <Text
                  fontSize="$3"
                  color={vehicle.isActive ? "$green10" : "$gray10"}
                  fontFamily="$body"
                >
                  {vehicle.isActive ? "Active" : "Inactive"}
                </Text>
              </YStack>
            </YStack>

            {(vehicle.brand || vehicle.model) && (
              <Text fontSize="$5" color="$colorSecondary" fontFamily="$body">
                {[vehicle.brand, vehicle.model].filter(Boolean).join(" ")}
                {vehicle.year ? ` (${vehicle.year})` : ""}
              </Text>
            )}
          </YStack>
        </Card>

        {/* Specs */}
        <Card padding="$4" bordered>
          <YStack gap="$3">
            <Text fontSize="$5" fontWeight="600" fontFamily="$heading">
              Specifications
            </Text>
            <Separator />

            <XStack justifyContent="space-between" alignItems="center">
              <XStack gap="$2" alignItems="center">
                <Car size={16} color="$colorMuted" />
                <Text fontSize="$4" color="$colorSecondary" fontFamily="$body">
                  Type
                </Text>
              </XStack>
              <Text
                fontSize="$4"
                fontWeight="600"
                fontFamily="$heading"
                textTransform="capitalize"
              >
                {vehicle.vehicleType}
              </Text>
            </XStack>

            {vehicle.brand && (
              <>
                <Separator />
                <XStack justifyContent="space-between" alignItems="center">
                  <XStack gap="$2" alignItems="center">
                    <Hash size={16} color="$colorMuted" />
                    <Text fontSize="$4" color="$colorSecondary" fontFamily="$body">
                      Brand
                    </Text>
                  </XStack>
                  <Text fontSize="$4" fontWeight="600" fontFamily="$heading">
                    {vehicle.brand}
                  </Text>
                </XStack>
              </>
            )}

            {vehicle.model && (
              <>
                <Separator />
                <XStack justifyContent="space-between" alignItems="center">
                  <XStack gap="$2" alignItems="center">
                    <Hash size={16} color="$colorMuted" />
                    <Text fontSize="$4" color="$colorSecondary" fontFamily="$body">
                      Model
                    </Text>
                  </XStack>
                  <Text fontSize="$4" fontWeight="600" fontFamily="$heading">
                    {vehicle.model}
                  </Text>
                </XStack>
              </>
            )}

            {vehicle.year && (
              <>
                <Separator />
                <XStack justifyContent="space-between" alignItems="center">
                  <XStack gap="$2" alignItems="center">
                    <Calendar size={16} color="$colorMuted" />
                    <Text fontSize="$4" color="$colorSecondary" fontFamily="$body">
                      Year
                    </Text>
                  </XStack>
                  <Text fontSize="$4" fontWeight="600" fontFamily="$heading">
                    {vehicle.year}
                  </Text>
                </XStack>
              </>
            )}

            {vehicle.color && (
              <>
                <Separator />
                <XStack justifyContent="space-between" alignItems="center">
                  <XStack gap="$2" alignItems="center">
                    <Palette size={16} color="$colorMuted" />
                    <Text fontSize="$4" color="$colorSecondary" fontFamily="$body">
                      Color
                    </Text>
                  </XStack>
                  <Text fontSize="$4" fontWeight="600" fontFamily="$heading">
                    {vehicle.color}
                  </Text>
                </XStack>
              </>
            )}
          </YStack>
        </Card>

        {/* Assignment */}
        <Card padding="$4" bordered>
          <YStack gap="$3">
            <Text fontSize="$5" fontWeight="600" fontFamily="$heading">
              Assignment
            </Text>
            <Separator />

            {assignedRider ? (
              <XStack
                gap="$3"
                alignItems="center"
                justifyContent="space-between"
              >
                <XStack gap="$3" alignItems="center">
                  <YStack
                    width={40}
                    height={40}
                    borderRadius="$10"
                    backgroundColor="$gray3"
                    alignItems="center"
                    justifyContent="center"
                  >
                    <User size={20} color="$colorMuted" />
                  </YStack>
                  <YStack gap="$1">
                    <Text fontSize="$4" fontWeight="600" fontFamily="$heading">
                      {assignedRider.riderName}
                    </Text>
                    <Text fontSize="$3" color="$colorSecondary" fontFamily="$body">
                      {assignedRider.riderPhone}
                    </Text>
                  </YStack>
                </XStack>
                <Button
                  size="$2"
                  variant="outline"
                  onPress={() =>
                    router.push(`/(fleet)/riders/${assignedRider.id}`)
                  }
                >
                  View
                </Button>
              </XStack>
            ) : (
              <XStack gap="$3" alignItems="center">
                <User size={18} color="$colorMuted" />
                <Text fontSize="$4" color="$colorSecondary" fontFamily="$body">
                  Not assigned to any rider
                </Text>
              </XStack>
            )}
          </YStack>
        </Card>

        {/* Service dates */}
        {(vehicle.insuranceExpiryDate || vehicle.lastMaintenanceDate) && (
          <Card padding="$4" bordered>
            <YStack gap="$3">
              <Text fontSize="$5" fontWeight="600" fontFamily="$heading">
                Service & Insurance
              </Text>
              <Separator />

              {vehicle.insuranceExpiryDate && (
                <XStack justifyContent="space-between" alignItems="center">
                  <XStack gap="$2" alignItems="center">
                    <Shield size={16} color="$colorMuted" />
                    <Text fontSize="$4" color="$colorSecondary" fontFamily="$body">
                      Insurance expires
                    </Text>
                  </XStack>
                  <Text fontSize="$4" fontWeight="600" fontFamily="$heading">
                    {new Date(vehicle.insuranceExpiryDate).toLocaleDateString()}
                  </Text>
                </XStack>
              )}

              {vehicle.insuranceExpiryDate && vehicle.lastMaintenanceDate && (
                <Separator />
              )}

              {vehicle.lastMaintenanceDate && (
                <XStack justifyContent="space-between" alignItems="center">
                  <XStack gap="$2" alignItems="center">
                    <Wrench size={16} color="$colorMuted" />
                    <Text fontSize="$4" color="$colorSecondary" fontFamily="$body">
                      Last maintenance
                    </Text>
                  </XStack>
                  <Text fontSize="$4" fontWeight="600" fontFamily="$heading">
                    {new Date(vehicle.lastMaintenanceDate).toLocaleDateString()}
                  </Text>
                </XStack>
              )}
            </YStack>
          </Card>
        )}

        {/* Toggle active */}
        <Button
          variant={vehicle.isActive ? "outline" : "primary"}
          width="100%"
          onPress={toggleActive}
        >
          {vehicle.isActive ? "Mark as Inactive" : "Mark as Active"}
        </Button>
      </YStack>
    </ScrollView>
  );
}
