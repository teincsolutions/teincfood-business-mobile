// @ts-nocheck
import { useMemo } from 'react';
import { ScrollView } from 'react-native';
import { YStack, XStack, Text } from 'tamagui';
import { Package } from '@tamagui/lucide-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { OrderHistoryCard } from '@/components/orders/OrderHistoryCard';
import { useOrdersQuery } from '@/services/orders.service';
import { OrderCardSkeleton } from '@/components/ui';

export default function OrdersScreen() {
  const insets = useSafeAreaInsets();
  const { data: ordersData = [], isLoading } = useOrdersQuery();
  const orders = ordersData;

  const activeOrders = useMemo(() => orders.filter(o => !['delivered', 'cancelled'].includes(o.status)), [orders]);
  const completedOrders = useMemo(() => orders.filter(o => ['delivered', 'cancelled'].includes(o.status)), [orders]);

  const hasOrders = activeOrders.length > 0 || completedOrders.length > 0;

  if (isLoading) {
    return (
      <YStack flex={1} backgroundColor="$background">
        <ScrollView bounces showsVerticalScrollIndicator={false}>
          <YStack padding="$5" paddingTop={Math.max(insets.top, 50)} paddingBottom="$10" gap="$6">
            <Text fontSize="$8" fontWeight="800" fontFamily="$heading" color="$color">My Orders</Text>
            <YStack gap="$3">
              {[1, 2, 3].map((key) => (
                <OrderCardSkeleton key={key} />
              ))}
            </YStack>
          </YStack>
        </ScrollView>
      </YStack>
    );
  }

  if (!hasOrders) {
    return (
      <YStack flex={1} backgroundColor="$background" paddingTop={Math.max(insets.top, 50)}>
        <YStack paddingHorizontal="$5" paddingBottom="$4">
          <Text fontSize="$8" fontWeight="800" fontFamily="$heading" color="$color">My Orders</Text>
        </YStack>
        <YStack flex={1} justifyContent="center" alignItems="center" padding="$10">
          <Package size={80} color="$gray200" />
          <Text fontSize="$6" fontWeight="700" fontFamily="$heading" marginTop="$4" color="$color">No orders yet</Text>
          <Text fontSize="$4" color="$colorSecondary" fontFamily="$body" marginTop="$2" textAlign="center">
            When you place your first order, it will appear here.
          </Text>
        </YStack>
      </YStack>
    );
  }

  return (
    <YStack flex={1} backgroundColor="$background">
      <ScrollView  bounces showsVerticalScrollIndicator={false}>
        <YStack padding="$5" paddingTop={Math.max(insets.top, 50)} paddingBottom="$10" gap="$6">

          {/* Page Title */}
          <Text fontSize="$8" fontWeight="800" fontFamily="$heading" color="$color">
            My Orders
          </Text>

          {/* Active Orders */}
          {activeOrders.length > 0 && (
            <YStack gap="$3">
              <Text fontSize="$5" fontWeight="700" fontFamily="$heading" color="$color">
                Active Orders
              </Text>
              {activeOrders.map((order) => (
                <OrderHistoryCard key={order.id} order={order} />
              ))}
            </YStack>
          )}

          {/* Completed Orders */}
          {completedOrders.length > 0 && (
            <YStack gap="$3">
              <Text fontSize="$5" fontWeight="700" fontFamily="$heading" color="$color">
                Past Orders
              </Text>
              {completedOrders.map((order) => (
                <OrderHistoryCard key={order.id} order={order} />
              ))}
            </YStack>
          )}

        </YStack>
      </ScrollView>
    </YStack>
  );
}
