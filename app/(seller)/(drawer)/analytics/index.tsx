// @ts-nocheck
import { YStack, Text, Card, XStack, Separator } from 'tamagui';
import { TrendingUp, DollarSign, ShoppingBag, Star, Clock } from '@tamagui/lucide-icons';
import { ScrollView } from 'react-native';
import { formatPrice } from '@/utils/currency';
import { useSellerAnalyticsQuery } from '@/hooks/seller-analytics.hooks';

/**
 * Seller Analytics Screen
 */
export default function SellerAnalytics() {
  const { data } = useSellerAnalyticsQuery();

  const metrics = data?.metrics ?? {
    totalRevenue: 0,
    totalOrders: 0,
    averageOrderValue: 0,
    averageRating: 0,
    peakHour: 'N/A',
  };

  const recentPerformance = data?.recentPerformance ?? [];
  const topSellingItems = data?.topSellingItems ?? [];

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
                <Text fontSize="$7" fontWeight="bold">{formatPrice(metrics.totalRevenue)}</Text>
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
                <Text fontSize="$7" fontWeight="bold">{formatPrice(metrics.averageOrderValue)}</Text>
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
                    <Text fontWeight="bold">{formatPrice(item.revenue)}</Text>
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
              {topSellingItems.map((item, index) => (
                <XStack key={index} justifyContent="space-between">
                  <Text>{index + 1}. {item.name}</Text>
                  <Text fontWeight="bold">{item.sold} sold</Text>
                </XStack>
              ))}
            </YStack>
          </Card>
        </YStack>
      </ScrollView>
    </YStack>
  );
}