// @ts-nocheck
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { Card, Image, Text, XStack, YStack } from 'tamagui';
import { Clock, Package, Star, Trash2, FileText } from '@tamagui/lucide-icons';
import { Button } from '@/components/ui';
import { formatCurrency } from '@/utils/formatCurrency';
import type { Order } from '@/types/order.model';
import { RatingModal } from './RatingModal';
import { OrderDetailModal } from './OrderDetailModal';
import { useCartStore } from '@/stores/cart.store';
import { useRemoveOrderMutation } from '@/services/orders.service';
import { useCachedImageUrl } from '@/hooks/useCachedImage';

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  pending: { label: 'Pending', color: '$gray400' },
  confirmed: { label: 'Confirmed', color: '$blue' },
  preparing: { label: 'Preparing', color: '$starOrange' },
  on_the_way: { label: 'On The Way', color: '$primary' },
  delivered: { label: 'Delivered', color: '$green' },
  cancelled: { label: 'Cancelled', color: '$red' },
};

interface OrderHistoryCardProps {
  order: Order;
}

export function OrderHistoryCard({ order }: OrderHistoryCardProps) {
  const router = useRouter();
  const [showRating, setShowRating] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const { mutate: removeOrder } = useRemoveOrderMutation();

  const isActive = !['delivered', 'cancelled'].includes(order.status);
  const statusInfo = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;
  const firstItem = order.items[0];
  const firstImageUri =
    useCachedImageUrl(firstItem?.food?.imageUrl) ||
    'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=200';

  return (
    <>
      <Card 
        elevate 
        width="100%" 
        backgroundColor="$backgroundStrong" 
        borderRadius="$5"
        marginBottom="$3"
        padding="$4"
        animation="bouncy"
        pressStyle={{ scale: 0.99 }}
      >
        {/* Header Row: Order # + Status */}
        <XStack justifyContent="space-between" alignItems="center" marginBottom="$3">
          <Text fontSize="$4" fontWeight="700" fontFamily="$heading" color="$color">
            {order.orderNumber}
          </Text>
          <XStack gap="$3" alignItems="center">
            <XStack 
              backgroundColor={isActive ? '$orangeMuted' : '$backgroundSoft'} 
              paddingHorizontal="$3" 
              paddingVertical="$1" 
              borderRadius="$full"
            >
              <Text 
                fontSize="$2" 
                fontWeight="700" 
                fontFamily="$body" 
                color={statusInfo.color}
              >
                {statusInfo.label}
              </Text>
            </XStack>
            {!isActive && (
              <Button size="$2" circular variant="ghost" padding={0} onPress={() => removeOrder(order.id)}>
                <Trash2 size={16} color="$red" />
              </Button>
            )}
          </XStack>
        </XStack>

        {/* Item Preview */}
        <XStack gap="$3" alignItems="center" marginBottom="$3">
          <Image 
            source={{ uri: firstImageUri }}
            width={56}
            height={56}
            borderRadius="$3"
            objectFit="cover"
          />
          <YStack flex={1}>
            <Text fontSize="$4" fontWeight="600" fontFamily="$body" color="$color" numberOfLines={1}>
              {firstItem?.food?.name}
              {order.items.length > 1 ? ` +${order.items.length - 1} more` : ''}
            </Text>
            <XStack alignItems="center" gap="$1" marginTop="$1">
              <Clock size={14} color="$colorSecondary" />
              <Text fontSize="$3" color="$colorSecondary" fontFamily="$body">
                {order.estimatedDeliveryTime || 'Completed'}
              </Text>
            </XStack>
          </YStack>
          <Text fontSize="$5" fontWeight="800" fontFamily="$body" color="$primary">
            {formatCurrency(order.total)}
          </Text>
        </XStack>

        {/* Action */}
        {isActive ? (
          <YStack gap="$2">
            <Button 
              variant="primary" 
              height={44}
              onPress={() => router.push(`/track/${order.id}`)}
            >
              TRACK ORDER
            </Button>
            <Button 
              variant="ghost" 
              height={36}
              icon={<FileText size={14} color="$colorSecondary" />}
              onPress={() => setShowDetails(true)}
            >
              <Text fontSize="$3" color="$colorSecondary">View Receipt</Text>
            </Button>
          </YStack>
        ) : (
          <XStack gap="$2">
            <Button 
              flex={1}
              variant="primary" 
              height={44}
              icon={<Package size={16} color="white" />}
              onPress={() => {
                order.items.forEach(item => {
                  useCartStore.getState().addItem(item.food, item.quantity);
                });
                router.push('/cart');
              }}
            >
              Reorder
            </Button>
            <Button 
              variant="outline" 
              height={44}
              circular
              icon={<FileText size={16} color="$primary" />}
              onPress={() => setShowDetails(true)}
            />
            {order.status === 'delivered' && (
              <Button 
                variant="outline" 
                height={44}
                circular
                icon={<Star size={16} color="$primary" />}
                onPress={() => setShowRating(true)}
              />
            )}
          </XStack>
        )}
      </Card>
      
      <OrderDetailModal 
        open={showDetails} 
        onOpenChange={setShowDetails} 
        order={order} 
      />
      
      <RatingModal 
        open={showRating} 
        onOpenChange={setShowRating} 
        orderId={order.id} 
      />
    </>
  );
}
