// @ts-nocheck
import {
  YStack,
  XStack,
  Text,
  Card,
  Separator,
  Spinner,
} from "tamagui";
import {
  Car,
  Bike,
  User,
  Palette,
  Calendar,
  Hash,
  Shield,
  X,
} from "@tamagui/lucide-icons";
import { useRouter } from "expo-router";
import {
  useFleetVehiclesQuery,
  type FleetVehicle,
} from "@teincfood/core";
import { BackButton, Button } from "@/components/ui";
import { ResponsiveScreen } from "@/components/layout";

interface VehicleDetailViewProps {
  vehicleId?: string;
  initialVehicle?: FleetVehicle | null;
  /** Hide the back button and add a close button (right-hand pane). */
  embedded?: boolean;
  onClose?: () => void;
  onBack?: () => void;
}

function VehicleIcon({ type, size = 28 }: { type: string; size?: number }) {
  if (type === "motorcycle" || type === "bicycle") {
    return <Bike size={size} color="$colorMuted" />;
  }
  return <Car size={size} color="$colorMuted" />;
}

function SpecRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value?: string | number | null;
}) {
  if (value === undefined || value === null || value === "") return null;

  return (
    <>
      <Separator />
      <XStack justifyContent="space-between" alignItems="center" gap="$3">
        <XStack gap="$2" alignItems="center" flexShrink={1}>
          {icon}
          <Text fontSize="$4" color="$colorSecondary" fontFamily="$body">
            {label}
          </Text>
        </XStack>
        <Text
          fontSize="$4"
          fontWeight="600"
          fontFamily="$heading"
          textAlign="right"
          flexShrink={1}
        >
          {value}
        </Text>
      </XStack>
    </>
  );
}

export function VehicleDetailView({
  vehicleId,
  initialVehicle,
  embedded = false,
  onClose,
  onBack,
}: VehicleDetailViewProps) {
  const router = useRouter();
  const { data, isLoading } = useFleetVehiclesQuery(Boolean(vehicleId));
  const vehicles: FleetVehicle[] = data?.data ?? [];
  const vehicle: FleetVehicle | null =
    initialVehicle ?? vehicles.find((item) => item.id === vehicleId) ?? null;

  if (!vehicle) {
    return (
      <ResponsiveScreen preset="detail">
        <YStack flex={1} alignItems="center" justifyContent="center" gap="$3">
          {isLoading ? (
            <>
              <Spinner size="large" color="$primary" />
              <Text fontSize="$4" color="$colorSecondary" fontFamily="$body">
                Loading vehicle...
              </Text>
            </>
          ) : (
            <>
              <Car size={48} color="$colorMuted" />
              <Text fontSize="$5" fontWeight="600" fontFamily="$heading">
                Vehicle not found
              </Text>
              <Text
                fontSize="$4"
                color="$colorSecondary"
                fontFamily="$body"
                textAlign="center"
              >
                This vehicle may have been removed from the fleet.
              </Text>
              {!embedded && <BackButton onPress={onBack} />}
            </>
          )}
        </YStack>
      </ResponsiveScreen>
    );
  }

  const details = [vehicle.brand, vehicle.model].filter(Boolean).join(" ");
  const ownership =
    vehicle.ownership === "fleet" ? "Fleet owned" : "Rider owned";
  const inserted = vehicle.inserted_at
    ? new Date(vehicle.inserted_at).toLocaleDateString()
    : null;

  return (
    <ResponsiveScreen preset="detail">
      <XStack alignItems="center" gap="$3">
        {embedded ? (
          <Button
            circular
            size="$3"
            variant="outline"
            icon={<X size={18} />}
            onPress={onClose}
          />
        ) : (
          <BackButton onPress={onBack} />
        )}
        <Text fontSize="$6" fontWeight="800" fontFamily="$heading" flex={1}>
          Vehicle details
        </Text>
      </XStack>

      <Card padding="$5" bordered>
        <YStack alignItems="center" gap="$3">
          <YStack
            width={80}
            height={80}
            borderRadius="$5"
            backgroundColor={
              vehicle.rider_id ? "$primaryLight" : "$backgroundSoft"
            }
            alignItems="center"
            justifyContent="center"
          >
            <VehicleIcon type={vehicle.type} size={36} />
          </YStack>

          <YStack alignItems="center" gap="$2">
            <Text
              fontSize="$7"
              fontWeight="bold"
              fontFamily="$heading"
              textAlign="center"
            >
              {vehicle.plate_number}
            </Text>
            <YStack
              paddingHorizontal="$3"
              paddingVertical="$1"
              borderRadius="$3"
              backgroundColor={vehicle.rider_id ? "$green2" : "$gray2"}
            >
              <Text
                fontSize="$3"
                color={vehicle.rider_id ? "$green10" : "$gray10"}
                fontFamily="$body"
              >
                {vehicle.rider_id ? "Assigned" : "Unassigned"}
              </Text>
            </YStack>
            {details ? (
              <Text fontSize="$4" color="$colorSecondary" fontFamily="$body">
                {details}
                {vehicle.year ? ` (${vehicle.year})` : ""}
              </Text>
            ) : null}
          </YStack>
        </YStack>
      </Card>

      <Card padding="$4" bordered>
        <YStack gap="$3">
          <Text fontSize="$5" fontWeight="600" fontFamily="$heading">
            Specifications
          </Text>

          <SpecRow
            icon={<Car size={16} color="$colorMuted" />}
            label="Type"
            value={vehicle.type}
          />
          <SpecRow
            icon={<Hash size={16} color="$colorMuted" />}
            label="Brand"
            value={vehicle.brand}
          />
          <SpecRow
            icon={<Hash size={16} color="$colorMuted" />}
            label="Model"
            value={vehicle.model}
          />
          <SpecRow
            icon={<Calendar size={16} color="$colorMuted" />}
            label="Year"
            value={vehicle.year}
          />
          <SpecRow
            icon={<Palette size={16} color="$colorMuted" />}
            label="Colour"
            value={vehicle.color}
          />
          <SpecRow
            icon={<Shield size={16} color="$colorMuted" />}
            label="Ownership"
            value={ownership}
          />
          <SpecRow
            icon={<Calendar size={16} color="$colorMuted" />}
            label="Added"
            value={inserted}
          />
        </YStack>
      </Card>

      <Card padding="$4" bordered>
        <YStack gap="$3">
          <Text fontSize="$5" fontWeight="600" fontFamily="$heading">
            Assignment
          </Text>
          <Separator />

          {vehicle.rider_id ? (
            <XStack gap="$3" alignItems="center" justifyContent="space-between">
              <XStack gap="$3" alignItems="center" flexShrink={1}>
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
                <YStack gap="$1" flexShrink={1}>
                  <Text fontSize="$4" fontWeight="600" fontFamily="$heading">
                    {vehicle.rider_name || vehicle.rider_number || "Rider"}
                  </Text>
                  {vehicle.rider_number ? (
                    <Text
                      fontSize="$3"
                      color="$colorSecondary"
                      fontFamily="$body"
                    >
                      {vehicle.rider_number}
                    </Text>
                  ) : null}
                </YStack>
              </XStack>
              <Button
                size="$2"
                variant="outline"
                onPress={() =>
                  router.push(`/(fleet)/riders/${vehicle.rider_id}`)
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
    </ResponsiveScreen>
  );
}
