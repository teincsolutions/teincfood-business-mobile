// @ts-nocheck
import { Marker } from "react-native-maps";
import { YStack, Text } from "tamagui";
import { ChefHat, MapPin, Navigation } from "@tamagui/lucide-icons";

interface DeliveryMarkerProps {
  coordinate: { latitude: number; longitude: number };
  title?: string;
  description?: string;
  highlighted?: boolean;
}

function MarkerLabel({
  label,
  color,
}: {
  label: string;
  color: string;
}) {
  return (
    <YStack
      backgroundColor="$background"
      paddingHorizontal="$2"
      paddingVertical="$0.5"
      borderRadius="$full"
      marginTop="$1"
      borderWidth={1}
      borderColor={color}
    >
      <Text fontSize="$1" fontWeight="800" color={color}>
        {label}
      </Text>
    </YStack>
  );
}

export function PickupMapMarker({
  coordinate,
  title = "Pickup",
  description,
  highlighted = false,
}: DeliveryMarkerProps) {
  return (
    <Marker
      coordinate={coordinate}
      title={title}
      description={description}
      anchor={{ x: 0.5, y: 0.68 }}
      tracksViewChanges={false}
    >
      <YStack alignItems="center">
        <YStack
          width={40}
          height={40}
          borderRadius="$full"
          backgroundColor="$success"
          borderWidth={highlighted ? 4 : 3}
          borderColor="$background"
          alignItems="center"
          justifyContent="center"
        >
          <ChefHat size={18} color="white" />
        </YStack>
        <MarkerLabel label="PICKUP" color="$success" />
      </YStack>
    </Marker>
  );
}

export function DropoffMapMarker({
  coordinate,
  title = "Dropoff",
  description,
  highlighted = false,
}: DeliveryMarkerProps) {
  return (
    <Marker
      coordinate={coordinate}
      title={title}
      description={description}
      anchor={{ x: 0.5, y: 0.68 }}
      tracksViewChanges={false}
    >
      <YStack alignItems="center">
        <YStack
          width={40}
          height={40}
          borderRadius="$full"
          backgroundColor="$primary"
          borderWidth={highlighted ? 4 : 3}
          borderColor="$background"
          alignItems="center"
          justifyContent="center"
        >
          <MapPin size={18} color="white" />
        </YStack>
        <MarkerLabel label="DROPOFF" color="$primary" />
      </YStack>
    </Marker>
  );
}

export function RiderMarkerContent() {
  return (
    <YStack alignItems="center">
      <YStack
        width={40}
        height={40}
        borderRadius="$full"
        backgroundColor="$info"
        borderWidth={3}
        borderColor="$background"
        alignItems="center"
        justifyContent="center"
      >
        <Navigation size={18} color="white" />
      </YStack>
      <MarkerLabel label="YOU" color="$info" />
    </YStack>
  );
}
