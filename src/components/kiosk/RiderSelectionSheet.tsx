// @ts-nocheck
import { FlatList } from 'react-native';
import { YStack, XStack, Text, Card, Sheet, useMedia } from 'tamagui';
import { Star, Phone, Bike, Car, Navigation, X } from '@tamagui/lucide-icons';
import { Button } from '@/components/ui/Button';
import { useResponsive } from '@/utils/responsive';
import type { AvailableRider } from '@/services/kiosk.service';

interface RiderSelectionSheetProps {
  visible: boolean;
  onClose: () => void;
  riders: AvailableRider[];
  onSelectRider: (riderId: string) => void;
}

export function RiderSelectionSheet({
  visible,
  onClose,
  riders,
  onSelectRider,
}: RiderSelectionSheetProps) {
  const { isTablet } = useResponsive();
  const media = useMedia();

  const getVehicleIcon = (type: string) => {
    switch (type) {
      case 'motorcycle':
        return <Bike size={18} />;
      case 'car':
        return <Car size={18} />;
      default:
        return <Bike size={18} />;
    }
  };

  return (
    <Sheet modal open={visible} onOpenChange={(open) => !open && onClose()} snapPoints={[70]} dismissOnSnapToBottom zIndex={200_000}>
      <Sheet.Overlay animation="lazy" enterStyle={{ opacity: 0 }} exitStyle={{ opacity: 0 }} backgroundColor="rgba(0,0,0,0.5)" />
      <Sheet.Frame backgroundColor="$background" borderTopLeftRadius="$6" borderTopRightRadius="$6" padding="$5" {...(media.md || media.lg ? { maxWidth: 600, alignSelf: "center" } : {})}>
        <Sheet.Handle backgroundColor="$gray5" marginTop="$2" />
        <XStack justifyContent="space-between" alignItems="center" marginBottom="$4">
          <Text fontSize="$6" fontWeight="bold">Select a Rider</Text>
          <Button
            width="$8"
            height="$8"
            $lg={{ width:'$12', height: "$12" }}
            variant='ghost'
            rounded="$full"
            backgroundColor="$backgroundSoft"
            onPress={onClose}
            icon={<X size={isTablet ? 24 : 18} />}
          />
        </XStack>

        <FlatList
          data={riders ?? []}
          keyExtractor={(item) => item.id}
          renderItem={({ item: rider }) => {
            // The API returns the display name under `user.full_name` (plus a
            // flattened `name` on newer builds). Never assume either is
            // present — a missing name here used to crash the whole order
            // detail screen when the sheet rendered offscreen.
            const riderName =
              rider.name ??
              (rider as any).user?.full_name ??
              (rider as any).user?.name ??
              rider.rider_number ??
              "Rider";
            const vehicleType =
              rider.vehicle_type ?? (rider as any).vehicle?.type ?? "";
            const rating = rider.rating ?? (rider as any).average_rating ?? 0;
            const distance = rider.distance;

            return (
            <Card
              padding="$4"
              marginBottom="$3"
              bordered
              backgroundColor="$backgroundSoft"
              borderColor="$borderColor"
              pressStyle={{ opacity: 0.7 }}
              onPress={() => onSelectRider(rider.id)}
            >
              <XStack gap="$3" alignItems="center">
                <YStack
                  width={48}
                  height={48}
                  borderRadius="$full"
                  backgroundColor="$primary"
                  alignItems="center"
                  justifyContent="center"
                >
                  <Text color="white" fontSize="$5" fontWeight="bold">
                    {riderName.charAt(0).toUpperCase()}
                  </Text>
                </YStack>

                <YStack flex={1} gap="$1">
                  <XStack alignItems="center" gap="$2">
                    <Text fontSize="$4" fontWeight="bold" numberOfLines={1}>{riderName}</Text>
                    {rating > 0 ? (
                      <XStack alignItems="center" gap="$0.5">
                        <Star size={12} color="$yellow10" />
                        <Text fontSize="$2" color="$colorMuted">{rating}</Text>
                      </XStack>
                    ) : null}
                  </XStack>

                  <XStack alignItems="center" gap="$2">
                    {getVehicleIcon(vehicleType)}
                    <Text fontSize="$3" color="$colorSecondary">
                      {vehicleType === 'motorcycle' ? 'Motorcycle' : vehicleType === 'car' ? 'Car' : 'Bicycle'}
                    </Text>
                  </XStack>

                  <XStack alignItems="center" gap="$1">
                    <Navigation size={12} color="$success" />
                    <Text fontSize="$2" color="$success" fontWeight="600">
                      {distance != null && distance < 1
                        ? `${(distance * 1000).toFixed(0)}m away`
                        : distance != null
                          ? `${distance.toFixed(1)}km away`
                          : 'Unknown distance'}
                    </Text>
                  </XStack>
                </YStack>

                <Button
                  variant="outline"
                  icon={({size, color}) => <Phone size={size} color={color} />}
                />
              </XStack>
            </Card>
            );
          }}
          ListEmptyComponent={
            <YStack padding="$6" alignItems="center">
              <Text color="$colorMuted">No riders available</Text>
            </YStack>
          }
        />
      </Sheet.Frame>
    </Sheet>
  );
}