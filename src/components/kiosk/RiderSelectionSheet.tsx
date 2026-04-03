// @ts-nocheck
import { Modal, FlatList } from 'react-native';
import { YStack, XStack, Text, Card } from 'tamagui';
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
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <YStack flex={1} justifyContent="flex-end" backgroundColor="rgba(0,0,0,0.4)">
        <YStack
          backgroundColor="$background"
          borderTopLeftRadius="$6"
          borderTopRightRadius="$6"
          padding="$5"
          maxHeight="70%"
        >
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
            renderItem={({ item: rider }) => (
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
                  {/* Avatar */}
                  <YStack
                    width={48}
                    height={48}
                    borderRadius="$full"
                    backgroundColor="$primary"
                    alignItems="center"
                    justifyContent="center"
                  >
                    <Text color="white" fontSize="$5" fontWeight="bold">
                      {rider.name.charAt(0)}
                    </Text>
                  </YStack>

                  {/* Rider Info */}
                  <YStack flex={1} gap="$1">
                    <XStack alignItems="center" gap="$2">
                      <Text fontSize="$4" fontWeight="bold">{rider.name}</Text>
                      <XStack alignItems="center" gap="$0.5">
                        <Star size={12} color="$color.starOrange" />
                        <Text fontSize="$2" color="$colorMuted">{rider.rating}</Text>
                      </XStack>
                    </XStack>

                    <XStack alignItems="center" gap="$2">
                      {getVehicleIcon(rider.vehicleType)}
                      <Text fontSize="$3" color="$colorSecondary">
                        {rider.vehicleType === 'motorcycle' ? 'Motorcycle' : rider.vehicleType === 'car' ? 'Car' : 'Bicycle'}
                        {rider.plateNumber ? ` • ${rider.plateNumber}` : ''}
                      </Text>
                    </XStack>

                    <XStack alignItems="center" gap="$1">
                      <Navigation size={12} color="$success" />
                      <Text fontSize="$2" color="$success" fontWeight="600">
                        {rider.distanceKm < 1 ? `${(rider.distanceKm * 1000).toFixed(0)}m away` : `${rider.distanceKm.toFixed(1)}km away`}
                      </Text>
                    </XStack>
                  </YStack>

                  {/* Phone */}
                  <Button
                    variant="outline"
                    icon={({size, color}) => <Phone size={size} color={color} />}
                  />
                </XStack>
              </Card>
            )}
            ListEmptyComponent={
              <YStack padding="$6" alignItems="center">
                <Text color="$colorMuted">No riders available</Text>
              </YStack>
            }
          />
        </YStack>
      </YStack>
    </Modal>
  );
}