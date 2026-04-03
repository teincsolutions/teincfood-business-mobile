// @ts-nocheck
import { TouchableOpacity } from 'react-native';
import { YStack, Text, Card, XStack, Separator } from 'tamagui';
import { Truck, MapPin, Filter, ChevronRight } from '@tamagui/lucide-icons';
import { ScrollView } from 'react-native';
import { useNavigation, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '@/components/ui';
import { useRiderDeliveriesQuery } from '@/hooks/rider.hooks';

/**
 * Rider Deliveries Screen
 */
export default function RiderDeliveries() {
  const navigation = useNavigation();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  // TanStack Query hooks
  const { data: deliveries = [], isLoading } = useRiderDeliveriesQuery();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'picked_up': return '#3498db';
      case 'delivering': return '#f39c12';
      case 'delivered': return '$success';
      default: return '#95a5a6';
    }
  };

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
        <XStack gap="$3" alignItems="center">
          <TouchableOpacity onPress={() => navigation.openDrawer()}>
            <Text fontSize={22}>☰</Text>
          </TouchableOpacity>
          <Text fontSize="$7" fontWeight="800" fontFamily="$heading" color="$color">
            Deliveries
          </Text>
        </XStack>
        <Button
          variant="outline"
          height={40}
          width="auto"
          paddingHorizontal="$3"
          onPress={() => {
            // Show filter options
            alert('Filter options:\n• All Deliveries\n• Active Only\n• Completed Only\n• Today Only');
          }}
        >
          <XStack gap="$1" alignItems="center">
            <Filter size={15} />
            <Text fontSize="$3" fontFamily="$body" fontWeight="600">Filter</Text>
          </XStack>
        </Button>
      </XStack>

      <ScrollView showsVerticalScrollIndicator={false}>
        <YStack paddingHorizontal="$4" paddingBottom={insets.bottom + 16} gap="$3">
          {deliveries.map((delivery) => (
            <Card key={delivery.id} padding="$4" bordered>
              <YStack gap="$3">
                <XStack justifyContent="space-between" alignItems="center">
                  <Text fontSize="$5" fontWeight="800" fontFamily="$heading">
                    {delivery.orderId}
                  </Text>
                  <YStack
                    paddingHorizontal="$3"
                    paddingVertical="$1"
                    borderRadius="$10"
                    backgroundColor={getStatusColor(delivery.status)}
                  >
                    <Text color="white" fontSize="$2" fontFamily="$body" textTransform="capitalize">
                      {delivery.status.replace('_', ' ')}
                    </Text>
                  </YStack>
                </XStack>

                <YStack gap="$2">
                  <XStack gap="$2" alignItems="center">
                    <MapPin size={14} color="$primary" />
                    <Text fontSize="$3" fontFamily="$body" color="$color">
                      Pickup: {delivery.pickup}
                    </Text>
                  </XStack>
                  <XStack gap="$2" alignItems="center">
                    <Truck size={14} color="$success" />
                    <Text fontSize="$3" fontFamily="$body" color="$color">
                      Dropoff: {delivery.dropoff}
                    </Text>
                  </XStack>
                </YStack>

                <Separator />

                <XStack justifyContent="space-between" alignItems="center">
                  <Text fontSize="$5" fontWeight="800" fontFamily="$heading" color="$success">
                    +{delivery.currency} {delivery.earnings.toFixed(2)}
                  </Text>
                  <Button
                    variant="ghost"
                    width="auto"
                    paddingHorizontal="$3"
                    onPress={() => router.push(`/(rider)/deliveries/${delivery.id}`)}
                  >
                    <XStack gap="$1" alignItems="center">
                      <Text fontSize="$3" fontFamily="$body" fontWeight="600" color="$primary">
                        View Details
                      </Text>
                      <ChevronRight size={14} color="$primary" />
                    </XStack>
                  </Button>
                </XStack>
              </YStack>
            </Card>
          ))}
        </YStack>
      </ScrollView>
    </YStack>
  );
}