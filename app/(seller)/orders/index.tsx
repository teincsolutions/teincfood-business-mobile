// @ts-nocheck
import { YStack, Text, Card, Button, XStack, Separator } from 'tamagui';
import { Filter } from '@tamagui/lucide-icons';
import { ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * Seller Orders Screen
 */
export default function SellerOrders() {
  const insets = useSafeAreaInsets();
  const orders = [
    { id: '1', orderNumber: '#ORD-001', status: 'pending', items: 3, total: 85.00, customer: 'John Doe' },
    { id: '2', orderNumber: '#ORD-002', status: 'preparing', items: 2, total: 65.00, customer: 'Jane Smith' },
    { id: '3', orderNumber: '#ORD-003', status: 'ready', items: 4, total: 120.00, customer: 'Kwame Asante' },
    { id: '4', orderNumber: '#ORD-004', status: 'delivered', items: 1, total: 35.00, customer: 'Abena Mensah' },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '$yellow9';
      case 'preparing': return '$blue9';
      case 'ready': return '$green9';
      case 'delivered': return '$gray9';
      default: return '$gray9';
    }
  };

  return (
    <YStack flex={1} backgroundColor="$background">
      <XStack
        padding="$4"
        paddingTop={Math.max(insets.top + 12, 24)}
        justifyContent="space-between"
        alignItems="center"
      >
        <Text fontSize="$6" fontWeight="bold">Orders</Text>
        <XStack
          height={40}
          paddingHorizontal="$3"
          borderWidth={1}
          borderColor="$borderColor"
          borderRadius="$3"
          alignItems="center"
          gap="$2"
          pressStyle={{ opacity: 0.7 }}
        >
          <Filter size={16} color="$color" />
          <Text fontFamily="$body" fontWeight="600" fontSize="$3">Filter</Text>
        </XStack>
      </XStack>

      <ScrollView>
        <YStack padding="$4" gap="$3">
          {orders.map((order) => (
            <Card key={order.id} padding="$4" bordered>
              <YStack gap="$3">
                <XStack justifyContent="space-between" alignItems="center">
                  <Text fontWeight="bold">{order.orderNumber}</Text>
                  <YStack
                    paddingHorizontal="$2"
                    paddingVertical="$1"
                    borderRadius="$2"
                    backgroundColor={getStatusColor(order.status)}
                  >
                    <Text color="$background" fontSize="$2" textTransform="capitalize">{order.status}</Text>
                  </YStack>
                </XStack>
                <XStack justifyContent="space-between">
                  <Text color="$colorMuted">{order.customer}</Text>
                  <Text color="$colorMuted">{order.items} items</Text>
                </XStack>
                <Separator />
                <XStack justifyContent="space-between" alignItems="center">
                  <Text fontWeight="bold">GHS {order.total.toFixed(2)}</Text>
                  <Button variant="outline" width="auto" height={40} paddingHorizontal="$3">View Details</Button>
                </XStack>
              </YStack>
            </Card>
          ))}
        </YStack>
      </ScrollView>
    </YStack>
  );
}