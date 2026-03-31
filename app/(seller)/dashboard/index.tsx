// @ts-nocheck

import { useState } from 'react';
import { ScrollView, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import {
  YStack,
  XStack,
  Text,
  Card,
  Button,
  Separator,
  Switch,
  Avatar,
} from 'tamagui';
import {
  ShoppingBag,
  DollarSign,
  Clock,
  Star,
  TrendingUp,
  Bell,
  ChevronRight,
  Store,
  Package,
} from '@tamagui/lucide-icons';
import { useAuthStore } from '@/stores/auth.store';

/**
 * Seller Dashboard Screen
 * Shows business metrics, quick actions, and live order feed
 */
export default function SellerDashboard() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isStoreOpen, setIsStoreOpen] = useState(true);

  // Mock data - will be replaced with API calls
  const metrics = {
    todayOrders: 24,
    todayRevenue: 1250.00,
    pendingOrders: 5,
    averageRating: 4.8,
    activeOrders: 3,
  };

  const recentOrders = [
    { id: '1', orderNumber: '#ORD-001', status: 'pending', items: 3, total: 45.00 },
    { id: '2', orderNumber: '#ORD-002', status: 'preparing', items: 2, total: 32.50 },
    { id: '3', orderNumber: '#ORD-003', status: 'ready', items: 4, total: 67.00 },
  ];

  const onRefresh = async () => {
    setIsRefreshing(true);
    // Simulate API call
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return '#FFA500';
      case 'preparing': return '#3498db';
      case 'ready': return '#27ae60';
      default: return '#95a5a6';
    }
  };

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
      }
    >
      <YStack padding="$4" gap="$4" backgroundColor="$background">
        {/* Header */}
        <XStack justifyContent="space-between" alignItems="center">
          <YStack>
            <Text fontSize="$4" color="$colorMuted">
              Welcome back,
            </Text>
            <Text fontSize="$6" fontWeight="bold">
              {user?.businessName || user?.fullName || 'Seller'}
            </Text>
          </YStack>
          <XStack gap="$2" alignItems="center">
            <Text fontSize="$3">Store {isStoreOpen ? 'Open' : 'Closed'}</Text>
            <Switch
              checked={isStoreOpen}
              onCheckedChange={setIsStoreOpen}
              backgroundColor={isStoreOpen ? '$primary' : '$gray8'}
            >
              <Switch.Thumb animation="quick" backgroundColor="white" />
            </Switch>
            <Button
              size="$3"
              circular
              icon={<Bell size={20} />}
              onPress={() => router.push('/(seller)/notifications')}
            />
          </XStack>
        </XStack>

        {/* Metrics Cards */}
        <XStack gap="$3" flexWrap="wrap">
          <Card flex={1} minWidth="45%" padding="$4" bordered>
            <YStack gap="$2">
              <XStack gap="$2" alignItems="center">
                <ShoppingBag size={20} color="$primary" />
                <Text fontSize="$3" color="$colorMuted">Today's Orders</Text>
              </XStack>
              <Text fontSize="$7" fontWeight="bold">{metrics.todayOrders}</Text>
            </YStack>
          </Card>

          <Card flex={1} minWidth="45%" padding="$4" bordered>
            <YStack gap="$2">
              <XStack gap="$2" alignItems="center">
                <DollarSign size={20} color="#27ae60" />
                <Text fontSize="$3" color="$colorMuted">Today's Revenue</Text>
              </XStack>
              <Text fontSize="$7" fontWeight="bold">GHS {metrics.todayRevenue.toFixed(2)}</Text>
            </YStack>
          </Card>

          <Card flex={1} minWidth="45%" padding="$4" bordered>
            <YStack gap="$2">
              <XStack gap="$2" alignItems="center">
                <Clock size={20} color="#FFA500" />
                <Text fontSize="$3" color="$colorMuted">Pending Orders</Text>
              </XStack>
              <Text fontSize="$7" fontWeight="bold">{metrics.pendingOrders}</Text>
            </YStack>
          </Card>

          <Card flex={1} minWidth="45%" padding="$4" bordered>
            <YStack gap="$2">
              <XStack gap="$2" alignItems="center">
                <Star size={20} color="#f1c40f" />
                <Text fontSize="$3" color="$colorMuted">Avg Rating</Text>
              </XStack>
              <Text fontSize="$7" fontWeight="bold">{metrics.averageRating}</Text>
            </YStack>
          </Card>
        </XStack>

        {/* Quick Actions */}
        <Card padding="$4" bordered>
          <YStack gap="$3">
            <Text fontSize="$5" fontWeight="bold">Quick Actions</Text>
            <XStack gap="$3">
              <Button
                flex={1}
                onPress={() => router.push('/(seller)/orders/pending')}
              >
                <XStack gap="$2" alignItems="center">
                  <Clock size={18} color="white" />
                  <Text color="white" fontFamily="$body" fontWeight="bold">Pending ({metrics.pendingOrders})</Text>
                </XStack>
              </Button>
              <Button
                flex={1}
                onPress={() => router.push('/(seller)/orders/active')}
              >
                <XStack gap="$2" alignItems="center">
                  <Package size={18} color="white" />
                  <Text color="white" fontFamily="$body" fontWeight="bold">Active ({metrics.activeOrders})</Text>
                </XStack>
              </Button>
            </XStack>
            <Button
              variant="outline"
              onPress={() => router.push('/(seller)/analytics')}
            >
              <XStack gap="$2" alignItems="center">
                <TrendingUp size={18} color="$color" />
                <Text fontFamily="$body" fontWeight="bold">View Analytics</Text>
              </XStack>
            </Button>
          </YStack>
        </Card>

        {/* Live Order Feed */}
        <Card padding="$4" bordered>
          <YStack gap="$3">
            <XStack justifyContent="space-between" alignItems="center">
              <Text fontSize="$5" fontWeight="bold">Recent Orders</Text>
              <Button
                variant="outline"
                height={36}
                paddingHorizontal="$3"
                onPress={() => router.push('/(seller)/orders')}
              >
                View All
              </Button>
            </XStack>
            
            <Separator />

            {recentOrders.map((order, index) => (
              <YStack key={order.id} gap="$2">
                <XStack justifyContent="space-between" alignItems="center">
                  <YStack>
                    <Text fontWeight="bold">{order.orderNumber}</Text>
                    <Text fontSize="$3" color="$colorMuted">
                      {order.items} items • GHS {order.total.toFixed(2)}
                    </Text>
                  </YStack>
                  <XStack gap="$2" alignItems="center">
                    <YStack
                      backgroundColor={getStatusColor(order.status)}
                      paddingHorizontal="$2"
                      paddingVertical="$1"
                      borderRadius="$2"
                    >
                      <Text fontSize="$2" color="white" textTransform="capitalize">
                        {order.status}
                      </Text>
                    </YStack>
                    <ChevronRight size={16} color="$colorMuted" />
                  </XStack>
                </XStack>
                {index < recentOrders.length - 1 && <Separator />}
              </YStack>
            ))}
          </YStack>
        </Card>

        {/* Active Delivery Status */}
        {metrics.activeOrders > 0 && (
          <Card padding="$4" bordered backgroundColor="$primaryLight">
            <YStack gap="$2">
              <Text fontSize="$5" fontWeight="bold">Active Deliveries</Text>
              <Text color="$colorMuted">
                You have {metrics.activeOrders} orders being delivered
              </Text>
              <Button
                onPress={() => router.push('/(seller)/orders/active')}
              >
                Track Orders
              </Button>
            </YStack>
          </Card>
        )}
      </YStack>
    </ScrollView>
  );
}