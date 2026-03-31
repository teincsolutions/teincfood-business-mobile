// @ts-nocheck
import { YStack, Text, Card, XStack, Separator } from 'tamagui';
import { TrendingUp, DollarSign, ShoppingBag, Star, Clock } from '@tamagui/lucide-icons';
import { ScrollView } from 'react-native';

/**
 * Seller Analytics Screen
 */
export default function SellerAnalytics() {
  const metrics = {
    totalRevenue: 12500.00,
    totalOrders: 156,
    averageOrderValue: 80.13,
    averageRating: 4.8,
    peakHour: '12:00 PM - 2:00 PM',
  };

  const recentPerformance = [
    { period: 'Today', revenue: 850.00, orders: 12 },
    { period: 'This Week', revenue: 4200.00, orders: 58 },
    { period: 'This Month', revenue: 12500.00, orders: 156 },
  ];

  return (
    <YStack flex={1} backgroundColor="$background">
      <ScrollView>
        <YStack padding="$4" gap="$4">
          <Text fontSize="$6" fontWeight="bold">Analytics</Text>

          {/* Key Metrics */}
          <XStack gap="$3" flexWrap="wrap">
            <Card flex={1} minWidth="45%" padding="$4" bordered>
              <YStack gap="$2">
                <XStack gap="$2" alignItems="center">
                  <DollarSign size={20} color="$green10" />
                  <Text fontSize="$3" color="$colorMuted">Total Revenue</Text>
                </XStack>
                <Text fontSize="$7" fontWeight="bold">GHS {metrics.totalRevenue.toFixed(2)}</Text>
              </YStack>
            </Card>

            <Card flex={1} minWidth="45%" padding="$4" bordered>
              <YStack gap="$2">
                <XStack gap="$2" alignItems="center">
                  <ShoppingBag size={20} color="$blue10" />
                  <Text fontSize="$3" color="$colorMuted">Total Orders</Text>
                </XStack>
                <Text fontSize="$7" fontWeight="bold">{metrics.totalOrders}</Text>
              </YStack>
            </Card>

            <Card flex={1} minWidth="45%" padding="$4" bordered>
              <YStack gap="$2">
                <XStack gap="$2" alignItems="center">
                  <TrendingUp size={20} color="$yellow10" />
                  <Text fontSize="$3" color="$colorMuted">Avg Order Value</Text>
                </XStack>
                <Text fontSize="$7" fontWeight="bold">GHS {metrics.averageOrderValue.toFixed(2)}</Text>
              </YStack>
            </Card>

            <Card flex={1} minWidth="45%" padding="$4" bordered>
              <YStack gap="$2">
                <XStack gap="$2" alignItems="center">
                  <Star size={20} color="$yellow10" />
                  <Text fontSize="$3" color="$colorMuted">Avg Rating</Text>
                </XStack>
                <Text fontSize="$7" fontWeight="bold">{metrics.averageRating}</Text>
              </YStack>
            </Card>
          </XStack>

          {/* Peak Hours */}
          <Card padding="$4" bordered>
            <YStack gap="$3">
              <XStack gap="$2" alignItems="center">
                <Clock size={20} color="$primary" />
                <Text fontSize="$5" fontWeight="bold">Peak Hours</Text>
              </XStack>
              <Text fontSize="$4">{metrics.peakHour}</Text>
            </YStack>
          </Card>

          {/* Performance Summary */}
          <Card padding="$4" bordered>
            <YStack gap="$3">
              <Text fontSize="$5" fontWeight="bold">Performance Summary</Text>
              <Separator />
              {recentPerformance.map((item, index) => (
                <XStack key={index} justifyContent="space-between" alignItems="center">
                  <Text color="$colorMuted">{item.period}</Text>
                  <YStack alignItems="flex-end">
                    <Text fontWeight="bold">GHS {item.revenue.toFixed(2)}</Text>
                    <Text fontSize="$2" color="$colorMuted">{item.orders} orders</Text>
                  </YStack>
                </XStack>
              ))}
            </YStack>
          </Card>

          {/* Top Selling Items */}
          <Card padding="$4" bordered>
            <YStack gap="$3">
              <Text fontSize="$5" fontWeight="bold">Top Selling Items</Text>
              <Separator />
              <XStack justifyContent="space-between">
                <Text>1. Jollof Rice</Text>
                <Text fontWeight="bold">45 sold</Text>
              </XStack>
              <XStack justifyContent="space-between">
                <Text>2. Banku & Tilapia</Text>
                <Text fontWeight="bold">32 sold</Text>
              </XStack>
              <XStack justifyContent="space-between">
                <Text>3. Grilled Chicken</Text>
                <Text fontWeight="bold">28 sold</Text>
              </XStack>
            </YStack>
          </Card>
        </YStack>
      </ScrollView>
    </YStack>
  );
}