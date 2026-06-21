// @ts-nocheck
import { useState } from 'react';
import { TouchableOpacity } from 'react-native';
import { YStack, XStack, Text, Card, Button, Separator } from 'tamagui';
import { MapPin, Navigation, Clock, Package, Phone, MessageCircle } from '@tamagui/lucide-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRiderDeliveriesQuery } from '@/hooks/useRider';

export default function RiderMap() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [selectedDelivery, setSelectedDelivery] = useState(null);

  const { data: deliveries = [] } = useRiderDeliveriesQuery();

  const getStatusColor = (status) => {
    switch (status) {
      case 'picked_up': return '#3498db';
      case 'assigned': return '#FFA500';
      case 'delivering': return '#f39c12';
      default: return '#95a5a6';
    }
  };

  return (
    <YStack flex={1} backgroundColor="$background">
      {/* Map Placeholder */}
      <YStack
        flex={1}
        backgroundColor="$gray3"
        alignItems="center"
        justifyContent="center"
        position="relative"
      >
        <MapPin size={64} color="$colorMuted" />
        <Text color="$colorMuted" marginTop="$4" fontSize="$5" fontWeight="bold">
          Map View
        </Text>
        <Text color="$colorMuted" fontSize="$3">
          Integration with maps API coming soon
        </Text>

        {/* Delivery Markers Simulation */}
        {deliveries.map((delivery, index) => (
          <TouchableOpacity
            key={delivery.id}
            onPress={() => setSelectedDelivery(delivery)}
            style={{
              position: 'absolute',
              top: 100 + (index * 80),
              left: 50 + (index * 120),
            }}
          >
            <YStack
              backgroundColor={getStatusColor(delivery.status)}
              padding="$2"
              borderRadius="$10"
              alignItems="center"
            >
              <MapPin size={24} color="white" />
            </YStack>
          </TouchableOpacity>
        ))}
      </YStack>

      {/* Header */}
      <XStack
        position="absolute"
        top={insets.top}
        left={0}
        right={0}
        paddingHorizontal="$4"
        paddingVertical="$3"
        justifyContent="space-between"
        alignItems="center"
      >
        <TouchableOpacity onPress={() => router.back()}>
          <YStack backgroundColor="$background" padding="$3" borderRadius="$10">
            <Text fontWeight="bold">← Back</Text>
          </YStack>
        </TouchableOpacity>
        <YStack backgroundColor="$background" padding="$3" borderRadius="$10">
          <Text fontWeight="bold">Map View</Text>
        </YStack>
        <YStack backgroundColor="$background" padding="$3" borderRadius="$10">
          <Text fontWeight="bold" color="$primary">
            {deliveries.length} Active
          </Text>
        </YStack>
      </XStack>

      {/* Selected Delivery Card */}
      {selectedDelivery ? (
        <YStack
          position="absolute"
          bottom={insets.bottom + 20}
          left="$4"
          right="$4"
        >
          <Card padding="$4" bordered backgroundColor="$background">
            <YStack gap="$3">
              <XStack justifyContent="space-between" alignItems="center">
                <Text fontSize="$5" fontWeight="bold">{selectedDelivery.orderId}</Text>
                <YStack
                  backgroundColor={getStatusColor(selectedDelivery.status)}
                  paddingHorizontal="$3"
                  paddingVertical="$1"
                  borderRadius="$10"
                >
                  <Text color="white" fontSize="$2" textTransform="capitalize">
                    {selectedDelivery.status.replace('_', ' ')}
                  </Text>
                </YStack>
              </XStack>

              <Separator />

              <YStack gap="$2">
                <XStack gap="$2" alignItems="center">
                  <MapPin size={16} color="$primary" />
                  <YStack flex={1}>
                    <Text fontSize="$2" color="$colorMuted">Pickup</Text>
                    <Text fontSize="$3">{selectedDelivery.pickup}</Text>
                  </YStack>
                </XStack>

                <XStack gap="$2" alignItems="center">
                  <Navigation size={16} color="$success" />
                  <YStack flex={1}>
                    <Text fontSize="$2" color="$colorMuted">Dropoff</Text>
                    <Text fontSize="$3">{selectedDelivery.dropoff}</Text>
                  </YStack>
                </XStack>
              </YStack>

              <XStack gap="$3" alignItems="center">
                <Clock size={16} color="$colorMuted" />
                <Text fontSize="$3">ETA: {selectedDelivery.estimatedTime}</Text>
                <Text flex={1} textAlign="right" fontSize="$5" fontWeight="bold" color="$success">
                  +GHS {selectedDelivery.earnings?.toFixed(2) ?? '0.00'}
                </Text>
              </XStack>

              <Separator />

              <XStack gap="$3">
                <Button
                  flex={1}
                  variant="outline"
                  icon={<Phone size={18} />}
                  onPress={() => {}}
                >
                  Call
                </Button>
                <Button
                  flex={1}
                  variant="outline"
                  icon={<MessageCircle size={18} />}
                  onPress={() => {}}
                >
                  Message
                </Button>
                <Button
                  flex={1}
                  backgroundColor="$primary"
                  onPress={() => router.push(`/(rider)/deliveries/${selectedDelivery.id}`)}
                >
                  Details
                </Button>
              </XStack>

              <Button
                variant="ghost"
                size="$3"
                onPress={() => setSelectedDelivery(null)}
              >
                Close
              </Button>
            </YStack>
          </Card>
        </YStack>
      ) : null}

      {/* Quick Actions */}
      {!selectedDelivery ? (
        <YStack
          position="absolute"
          bottom={insets.bottom + 20}
          left="$4"
          right="$4"
          gap="$3"
        >
          <Card padding="$4" bordered backgroundColor="$background">
            <YStack gap="$3">
              <Text fontSize="$5" fontWeight="bold">Quick Actions</Text>
              <XStack gap="$3">
                <Button
                  flex={1}
                  variant="outline"
                  onPress={() => router.push('/(rider)/deliveries')}
                >
                  View All Deliveries
                </Button>
                <Button
                  flex={1}
                  backgroundColor="$primary"
                  onPress={() => router.back()}
                >
                  Back to Home
                </Button>
              </XStack>
            </YStack>
          </Card>
        </YStack>
      ) : null}
    </YStack>
  );
}
