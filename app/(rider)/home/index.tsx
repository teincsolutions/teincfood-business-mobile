// @ts-nocheck
import { useState } from 'react';
import { ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { useRouter, useNavigation } from 'expo-router';
import {
  YStack,
  XStack,
  Text,
  Card,
  Separator,
  Switch,
  ScrollView as TamaguiScrollView,
} from 'tamagui';
import {
  DollarSign,
  Package,
  MapPin,
  Navigation,
  Clock,
  TrendingUp,
  Bell,
  ChevronRight,
  Menu,
} from '@tamagui/lucide-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '@/components/ui';
import { useAuthStore } from '@/stores/auth.store';

/**
 * Rider Home Screen
 * Shows online/offline toggle, earnings summary, and delivery dashboard
 */
export default function RiderHome() {
  const router = useRouter();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((state) => state.user);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isOnline, setIsOnline] = useState(user?.isOnline ?? false);

  // Mock data - will be replaced with API calls
  const metrics = {
    todayEarnings: 85.50,
    todayDeliveries: 12,
    activeDelivery: null as any,
    availableDeliveries: 3,
  };

  const activeDelivery = {
    id: '1',
    orderId: '#ORD-001',
    pickup: 'TeincFoods Restaurant',
    dropoff: '123 Main Street',
    status: 'picked_up',
    estimatedTime: '15 min',
  };

  const recentDeliveries = [
    { id: '1', orderId: '#ORD-001', earnings: 12.50, status: 'delivered' },
    { id: '2', orderId: '#ORD-002', earnings: 8.75, status: 'delivered' },
    { id: '3', orderId: '#ORD-003', earnings: 15.00, status: 'delivered' },
  ];

  const onRefresh = async () => {
    setIsRefreshing(true);
    // Simulate API call
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered': return '#27ae60';
      case 'picked_up': return '#3498db';
      case 'assigned': return '#FFA500';
      default: return '#95a5a6';
    }
  };

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
      }
     contentContainerStyle={{ backgroundColor: '$background' }}
    >
      <YStack
        paddingHorizontal="$4"
        paddingBottom="$4"
        paddingTop={insets.top + 12}
        gap="$4"
        backgroundColor="$background"
      >
        {/* Header */}
        <XStack justifyContent="space-between" alignItems="center">
          <XStack gap="$3" alignItems="center">
            <TouchableOpacity onPress={() => navigation.openDrawer()}>
              <Menu size={24} color="$color" />
            </TouchableOpacity>
            <YStack>
              <Text fontSize="$3" color="$colorSecondary" fontFamily="$body">
                Welcome back,
              </Text>
              <Text fontSize="$6" fontWeight="800" fontFamily="$heading">
                {user?.fullName || 'Rider'}
              </Text>
            </YStack>
          </XStack>
          <XStack gap="$3" alignItems="center">
            <XStack gap="$1" alignItems="center">
              <YStack
                width={10}
                height={10}
                borderRadius={5}
                backgroundColor={isOnline ? '#27ae60' : '#95a5a6'}
              />
              <Text fontSize="$3" fontFamily="$body" color="$colorSecondary">
                {isOnline ? 'Online' : 'Offline'}
              </Text>
            </XStack>
            <Switch
              size="$5"
              checked={isOnline}
              onCheckedChange={setIsOnline}
              backgroundColor={isOnline ? '#27ae60' : '$gray8'}
            >
              <Switch.Thumb animation="quick" backgroundColor="white" />
            </Switch>
            <TouchableOpacity
              onPress={() => router.push('/(shared)/notifications')}
            >
              <Bell size={22} />
            </TouchableOpacity>
          </XStack>
        </XStack>

        {/* Online Status Card */}
        {!isOnline && (
          <Card padding="$4" bordered backgroundColor="$backgroundSoft">
            <YStack gap="$3" alignItems="center">
              <Text fontSize="$5" fontWeight="800" fontFamily="$heading">
                You're Offline
              </Text>
              <Text color="$colorSecondary" textAlign="center" fontFamily="$body">
                Go online to start receiving delivery requests
              </Text>
              <Button
                variant="primary"
                height={48}
                onPress={() => setIsOnline(true)}
              >
                Go Online
              </Button>
            </YStack>
          </Card>
        )}

        {/* Earnings Summary */}
        <Card padding="$4" bordered>
          <YStack gap="$3">
            <Text fontSize="$5" fontWeight="bold">Today's Summary</Text>
            <XStack gap="$4">
              <YStack flex={1} alignItems="center" gap="$1">
                <DollarSign size={24} color="#27ae60" />
                <Text fontSize="$7" fontWeight="bold">
                  GHS {metrics.todayEarnings.toFixed(2)}
                </Text>
                <Text fontSize="$3" color="$colorMuted">Earnings</Text>
              </YStack>
              <Separator vertical />
              <YStack flex={1} alignItems="center" gap="$1">
                <Package size={24} color="$primary" />
                <Text fontSize="$7" fontWeight="bold">
                  {metrics.todayDeliveries}
                </Text>
                <Text fontSize="$3" color="$colorMuted">Deliveries</Text>
              </YStack>
            </XStack>
          </YStack>
        </Card>

        {/* Active Delivery */}
        {isOnline && activeDelivery && (
          <Card padding="$4" bordered backgroundColor="$primaryLight">
            <YStack gap="$3">
              <XStack justifyContent="space-between" alignItems="center">
                <Text fontSize="$5" fontWeight="bold">Active Delivery</Text>
                <YStack
                  backgroundColor={getStatusColor(activeDelivery.status)}
                  paddingHorizontal="$2"
                  paddingVertical="$1"
                  borderRadius="$2"
                >
                  <Text fontSize="$2" color="white" textTransform="capitalize">
                    {activeDelivery.status.replace('_', ' ')}
                  </Text>
                </YStack>
              </XStack>

              <YStack gap="$2">
                <XStack gap="$2" alignItems="center">
                  <MapPin size={16} color="$primary" />
                  <Text fontSize="$3">Pickup: {activeDelivery.pickup}</Text>
                </XStack>
                <XStack gap="$2" alignItems="center">
                  <Navigation size={16} color="#27ae60" />
                  <Text fontSize="$3">Dropoff: {activeDelivery.dropoff}</Text>
                </XStack>
                <XStack gap="$2" alignItems="center">
                  <Clock size={16} color="$colorMuted" />
                  <Text fontSize="$3">ETA: {activeDelivery.estimatedTime}</Text>
                </XStack>
              </YStack>

              <XStack gap="$3">
                <Button
                  flex={1}
                  variant="primary"
                  height={48}
                  onPress={() => router.push('/(rider)/deliveries')}
                >
                  Navigate
                </Button>
                <Button
                  flex={1}
                  variant="outline"
                  height={48}
                  onPress={() => router.push('/(rider)/deliveries')}
                >
                  View Details
                </Button>
              </XStack>
            </YStack>
          </Card>
        )}

        {/* Quick Actions */}
        {isOnline && !activeDelivery && (
          <Card padding="$4" bordered>
            <YStack gap="$3">
              <Text fontSize="$5" fontWeight="bold">Quick Actions</Text>
              <XStack gap="$3">
                <Button
                variant="primary"
                height={48}
                onPress={() => router.push('/(rider)/deliveries')}
              >
                Available ({metrics.availableDeliveries})
              </Button>
              <Button
                variant="outline"
                height={48}
                onPress={() => router.push('/(rider)/earnings')}
              >
                Earnings
              </Button>
              </XStack>
            </YStack>
          </Card>
        )}

        {/* Recent Deliveries */}
        <Card padding="$4" bordered>
          <YStack gap="$3">
            <XStack justifyContent="space-between" alignItems="center">
              <Text fontSize="$5" fontWeight="bold">Recent Deliveries</Text>
              <Button
                variant="ghost"
                height={36}
                width="auto"
                paddingHorizontal="$3"
                onPress={() => router.push('/(rider)/deliveries')}
              >
                View All
              </Button>
            </XStack>
            
            <Separator />

            {recentDeliveries.map((delivery, index) => (
              <YStack key={delivery.id} gap="$2">
                <XStack justifyContent="space-between" alignItems="center">
                  <YStack>
                    <Text fontWeight="bold">{delivery.orderId}</Text>
                    <Text fontSize="$3" color="$colorMuted">
                      Delivered
                    </Text>
                  </YStack>
                  <XStack gap="$2" alignItems="center">
                    <Text fontWeight="bold" color="#27ae60">
                      +GHS {delivery.earnings.toFixed(2)}
                    </Text>
                    <ChevronRight size={16} color="$colorMuted" />
                  </XStack>
                </XStack>
                {index < recentDeliveries.length - 1 && <Separator />}
              </YStack>
            ))}
          </YStack>
        </Card>

        {/* Map Preview Placeholder */}
        {isOnline && (
          <Card padding="$4" bordered>
            <YStack gap="$3" alignItems="center">
              <Text fontSize="$5" fontWeight="bold">Delivery Map</Text>
              <YStack
                height={200}
                width="100%"
                backgroundColor="$gray3"
                borderRadius="$4"
                alignItems="center"
                justifyContent="center"
              >
                <MapPin size={48} color="$colorMuted" />
                <Text color="$colorMuted" marginTop="$2">
                  Map view coming soon
                </Text>
              </YStack>
              <Button
                variant="outline"
                height={48}
                onPress={() => {}}
              >
                Open Full Map
              </Button>
            </YStack>
          </Card>
        )}
      </YStack>
    </ScrollView>
  );
}