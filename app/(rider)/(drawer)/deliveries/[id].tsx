// @ts-nocheck
import { ScrollView, TouchableOpacity } from 'react-native';
import { YStack, XStack, Text, Card, Button, Separator, Avatar } from 'tamagui';
import { MapPin, Navigation, Clock, Package, Phone, MessageCircle, User, DollarSign, Truck } from '@tamagui/lucide-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDeliveryDetailQuery, useUpdateDeliveryStatusMutation } from '@/hooks/rider.hooks';
import type { RiderDeliveryDetail } from '@/models/rider.model';

/**
 * Rider Delivery Details Screen
 */
export default function RiderDeliveryDetails() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const insets = useSafeAreaInsets();

  // TanStack Query hooks
  const { data: delivery, isLoading } = useDeliveryDetailQuery(id as string);
  const updateStatus = useUpdateDeliveryStatusMutation();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'assigned': return '#FFA500';
      case 'picked_up': return '#3498db';
      case 'delivering': return '#f39c12';
      case 'delivered': return '#27ae60';
      default: return '#95a5a6';
    }
  };

  const handleStatusUpdate = (newStatus: RiderDeliveryDetail['status']) => {
    if (id) {
      updateStatus.mutate({ deliveryId: id as string, status: newStatus });
    }
  };

  if (!delivery) {
    return (
      <YStack flex={1} backgroundColor="$background" justifyContent="center" alignItems="center">
        <Text>Loading...</Text>
      </YStack>
    );
  }

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
        <TouchableOpacity onPress={() => router.back()}>
          <Text fontSize="$4" color="$primary">← Back</Text>
        </TouchableOpacity>
        <Text fontSize="$6" fontWeight="800" fontFamily="$heading">
          Delivery Details
        </Text>
        <YStack
          backgroundColor={getStatusColor(delivery.status)}
          paddingHorizontal="$3"
          paddingVertical="$1"
          borderRadius="$10"
        >
          <Text color="white" fontSize="$2" textTransform="capitalize">
            {delivery.status.replace('_', ' ')}
          </Text>
        </YStack>
      </XStack>

      <ScrollView showsVerticalScrollIndicator={false}>
        <YStack padding="$4" gap="$4" paddingBottom={insets.bottom + 20}>
          {/* Order Info */}
          <Card padding="$4" bordered>
            <YStack gap="$3">
              <XStack justifyContent="space-between" alignItems="center">
                <Text fontSize="$5" fontWeight="bold">{delivery.orderId}</Text>
                <XStack gap="$2" alignItems="center">
                  <Truck size={16} color="$colorMuted" />
                  <Text fontSize="$3" color="$colorMuted">{delivery.distance}</Text>
                </XStack>
              </XStack>
              <Separator />
              <XStack gap="$3" alignItems="center">
                <Clock size={16} color="$colorMuted" />
                <Text fontSize="$3">ETA: {delivery.estimatedTime}</Text>
                <Text flex={1} textAlign="right" fontSize="$5" fontWeight="bold" color="#27ae60">
                  +GHS {delivery.earnings.toFixed(2)}
                </Text>
              </XStack>
            </YStack>
          </Card>

          {/* Customer Info */}
          <Card padding="$4" bordered>
            <YStack gap="$3">
              <Text fontSize="$5" fontWeight="bold">Customer</Text>
              <Separator />
              <XStack gap="$3" alignItems="center">
                <Avatar circular size="$5">
                  <Avatar.Fallback backgroundColor="$primary">
                    <User size={20} color="white" />
                  </Avatar.Fallback>
                </Avatar>
                <YStack flex={1}>
                  <Text fontWeight="bold">{delivery.customer.name}</Text>
                  <Text fontSize="$3" color="$colorMuted">{delivery.customer.phone}</Text>
                </YStack>
              </XStack>
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
                  onPress={() => router.push(`/(communication)/chat/${delivery.customer.phone}`)}
                >
                  Message
                </Button>
              </XStack>
            </YStack>
          </Card>

          {/* Pickup Location */}
          <Card padding="$4" bordered>
            <YStack gap="$3">
              <XStack gap="$2" alignItems="center">
                <MapPin size={20} color="$primary" />
                <Text fontSize="$5" fontWeight="bold">Pickup Location</Text>
              </XStack>
              <Separator />
              <YStack gap="$2">
                <Text fontWeight="bold">{delivery.pickup.name}</Text>
                <Text color="$colorMuted">{delivery.pickup.address}</Text>
                <Text color="$colorMuted" fontSize="$3">{delivery.pickup.phone}</Text>
              </YStack>
              <Button
                variant="outline"
                icon={<Navigation size={18} />}
                onPress={() => {}}
              >
                Navigate to Pickup
              </Button>
            </YStack>
          </Card>

          {/* Dropoff Location */}
          <Card padding="$4" bordered backgroundColor="$blue2">
            <YStack gap="$3">
              <XStack gap="$2" alignItems="center">
                <Navigation size={20} color="#27ae60" />
                <Text fontSize="$5" fontWeight="bold">Dropoff Location</Text>
              </XStack>
              <Separator />
              <YStack gap="$2">
                <Text fontWeight="bold">{delivery.dropoff.name}</Text>
                <Text color="$colorMuted">{delivery.dropoff.address}</Text>
                {delivery.dropoff.notes && (
                  <YStack backgroundColor="$yellow2" padding="$2" borderRadius="$2">
                    <Text fontSize="$3" color="$orange10">Note: {delivery.dropoff.notes}</Text>
                  </YStack>
                )}
              </YStack>
              <Button
                backgroundColor="$primary"
                icon={<Navigation size={18} />}
                onPress={() => {}}
              >
                Navigate to Dropoff
              </Button>
            </YStack>
          </Card>

          {/* Order Items */}
          <Card padding="$4" bordered>
            <YStack gap="$3">
              <XStack gap="$2" alignItems="center">
                <Package size={20} color="$colorMuted" />
                <Text fontSize="$5" fontWeight="bold">Order Items</Text>
              </XStack>
              <Separator />
              {delivery.items.map((item, index) => (
                <XStack key={index} justifyContent="space-between" alignItems="center">
                  <YStack>
                    <Text fontWeight="bold">{item.name}</Text>
                    <Text fontSize="$2" color="$colorMuted">Qty: {item.quantity}</Text>
                  </YStack>
                  <Text fontWeight="bold">GHS {(item.price * item.quantity).toFixed(2)}</Text>
                </XStack>
              ))}
              <Separator />
              <XStack justifyContent="space-between">
                <Text color="$colorMuted">Order Total</Text>
                <Text>GHS {delivery.orderTotal.toFixed(2)}</Text>
              </XStack>
              <XStack justifyContent="space-between">
                <Text color="$colorMuted">Delivery Fee</Text>
                <Text>GHS {delivery.deliveryFee.toFixed(2)}</Text>
              </XStack>
              <XStack justifyContent="space-between">
                <Text fontWeight="bold" color="#27ae60">Your Earnings</Text>
                <Text fontWeight="bold" color="#27ae60">GHS {delivery.earnings.toFixed(2)}</Text>
              </XStack>
            </YStack>
          </Card>

          {/* Delivery Timeline */}
          <Card padding="$4" bordered>
            <YStack gap="$3">
              <Text fontSize="$5" fontWeight="bold">Delivery Timeline</Text>
              <Separator />
              <XStack gap="$3" alignItems="center">
                <YStack
                  width={12}
                  height={12}
                  borderRadius="$10"
                  backgroundColor="#27ae60"
                />
                <YStack flex={1}>
                  <Text fontWeight="bold">Order Accepted</Text>
                  <Text fontSize="$2" color="$colorMuted">{delivery.acceptedAt}</Text>
                </YStack>
              </XStack>
              <XStack gap="$3" alignItems="center">
                <YStack
                  width={12}
                  height={12}
                  borderRadius="$10"
                  backgroundColor={delivery.pickedUpAt ? '#3498db' : '$gray8'}
                />
                <YStack flex={1}>
                  <Text fontWeight="bold">Picked Up</Text>
                  <Text fontSize="$2" color="$colorMuted">
                    {delivery.pickedUpAt || 'Pending'}
                  </Text>
                </YStack>
              </XStack>
              <XStack gap="$3" alignItems="center">
                <YStack
                  width={12}
                  height={12}
                  borderRadius="$10"
                  backgroundColor={delivery.deliveredAt ? '#27ae60' : '$gray8'}
                />
                <YStack flex={1}>
                  <Text fontWeight="bold">Delivered</Text>
                  <Text fontSize="$2" color="$colorMuted">
                    {delivery.deliveredAt || 'Pending'}
                  </Text>
                </YStack>
              </XStack>
            </YStack>
          </Card>

          {/* Action Buttons */}
          <YStack gap="$3">
            {delivery.status === 'assigned' && (
              <Button
                size="$5"
                backgroundColor="$primary"
                onPress={() => handleStatusUpdate('picked_up')}
              >
                Confirm Pickup
              </Button>
            )}
            {delivery.status === 'picked_up' && (
              <Button
                size="$5"
                backgroundColor="#f39c12"
                onPress={() => handleStatusUpdate('delivering')}
              >
                Start Delivery
              </Button>
            )}
            {delivery.status === 'delivering' && (
              <Button
                size="$5"
                backgroundColor="#27ae60"
                onPress={() => handleStatusUpdate('delivered')}
              >
                Complete Delivery
              </Button>
            )}
            {delivery.status === 'delivered' && (
              <Card padding="$4" bordered backgroundColor="$green2">
                <YStack alignItems="center" gap="$2">
                  <Text fontSize="$6">✓</Text>
                  <Text fontSize="$5" fontWeight="bold" color="#27ae60">
                    Delivery Completed!
                  </Text>
                  <Text color="$colorMuted">
                    You earned GHS {delivery.earnings.toFixed(2)}
                  </Text>
                </YStack>
              </Card>
            )}
          </YStack>
        </YStack>
      </ScrollView>
    </YStack>
  );
}