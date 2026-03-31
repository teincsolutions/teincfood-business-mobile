// @ts-nocheck
import { YStack, Text, Card, Button, XStack, Separator } from 'tamagui';
import { Truck, MapPin, Clock, CheckCircle, Filter } from '@tamagui/lucide-icons';
import { ScrollView } from 'react-native';

/**
 * Rider Deliveries Screen
 */
export default function RiderDeliveries() {
  const deliveries = [
    { id: '1', orderId: '#ORD-001', pickup: 'TeincFoods Restaurant', dropoff: '123 Main Street', status: 'picked_up', earnings: 12.50 },
    { id: '2', orderId: '#ORD-002', pickup: 'TeincFoods Restaurant', dropoff: '456 Oak Avenue', status: 'delivering', earnings: 15.00 },
    { id: '3', orderId: '#ORD-003', pickup: 'TeincFoods Restaurant', dropoff: '789 Pine Road', status: 'delivered', earnings: 10.00 },
    { id: '4', orderId: '#ORD-004', pickup: 'TeincFoods Restaurant', dropoff: '321 Elm Street', status: 'delivered', earnings: 18.75 },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'picked_up': return '$blue9';
      case 'delivering': return '$yellow9';
      case 'delivered': return '$green9';
      default: return '$gray9';
    }
  };

  return (
    <YStack flex={1} backgroundColor="$background">
      <XStack padding="$4" justifyContent="space-between" alignItems="center">
        <Text fontSize="$6" fontWeight="bold">Deliveries</Text>
        <Button size="$3" icon={<Filter size={18} />}>Filter</Button>
      </XStack>

      <ScrollView>
        <YStack padding="$4" gap="$3">
          {deliveries.map((delivery) => (
            <Card key={delivery.id} padding="$4" bordered>
              <YStack gap="$3">
                <XStack justifyContent="space-between" alignItems="center">
                  <Text fontWeight="bold">{delivery.orderId}</Text>
                  <YStack
                    paddingHorizontal="$2"
                    paddingVertical="$1"
                    borderRadius="$2"
                    backgroundColor={getStatusColor(delivery.status)}
                  >
                    <Text color="$background" fontSize="$2" textTransform="capitalize">
                      {delivery.status.replace('_', ' ')}
                    </Text>
                  </YStack>
                </XStack>

                <YStack gap="$2">
                  <XStack gap="$2" alignItems="center">
                    <MapPin size={14} color="$primary" />
                    <Text fontSize="$3">Pickup: {delivery.pickup}</Text>
                  </XStack>
                  <XStack gap="$2" alignItems="center">
                    <Truck size={14} color="$green10" />
                    <Text fontSize="$3">Dropoff: {delivery.dropoff}</Text>
                  </XStack>
                </YStack>

                <Separator />

                <XStack justifyContent="space-between" alignItems="center">
                  <Text fontWeight="bold" color="$green10">
                    +GHS {delivery.earnings.toFixed(2)}
                  </Text>
                  <Button size="$3">View Details</Button>
                </XStack>
              </YStack>
            </Card>
          ))}
        </YStack>
      </ScrollView>
    </YStack>
  );
}