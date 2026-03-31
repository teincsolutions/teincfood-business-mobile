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
} from 'tamagui';
import {
  Bell,
  ShoppingBag,
  DollarSign,
  Truck,
  MessageCircle,
  ChevronRight,
} from '@tamagui/lucide-icons';
import { useAuthStore } from '@/stores/auth.store';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * Notifications Screen
 * Shows notifications for both sellers and riders
 */
export default function NotificationsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((state) => state.user);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Mock notifications - will be replaced with API calls
  const notifications = [
    {
      id: '1',
      type: 'order',
      title: 'New Order Received',
      message: 'Order #ORD-001 has been placed. 3 items for GHS 45.00',
      time: '2 min ago',
      read: false,
      icon: ShoppingBag,
    },
    {
      id: '2',
      type: 'delivery',
      title: 'Delivery Completed',
      message: 'Order #ORD-002 has been delivered successfully',
      time: '15 min ago',
      read: true,
      icon: Truck,
    },
    {
      id: '3',
      type: 'payment',
      title: 'Payout Processed',
      message: 'Your weekly payout of GHS 250.00 has been sent to your account',
      time: '1 hour ago',
      read: true,
      icon: DollarSign,
    },
    {
      id: '4',
      type: 'message',
      title: 'New Message',
      message: 'You have a new message from customer regarding Order #ORD-003',
      time: '2 hours ago',
      read: false,
      icon: MessageCircle,
    },
  ];

  const onRefresh = async () => {
    setIsRefreshing(true);
    // Simulate API call
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const getIconColor = (type: string) => {
    switch (type) {
      case 'order': return '$primary';
      case 'delivery': return '#27ae60';
      case 'payment': return '#f1c40f';
      case 'message': return '#3498db';
      default: return '$colorMuted';
    }
  };

  return (
    <YStack flex={1} backgroundColor="$background">
      {/* Header */}
      <XStack
        padding="$4"
        paddingTop={Math.max(insets.top + 12, 24)}
        justifyContent="space-between"
        alignItems="center"
        backgroundColor="$background"
        borderBottomWidth={1}
        borderBottomColor="$borderColor"
      >
        <Text fontSize="$7" fontWeight="bold">Notifications</Text>
        <Button variant="outline" width="auto" height={40} paddingHorizontal="$3">
          Mark All Read
        </Button>
      </XStack>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />
        }
      >
        <YStack padding="$4" gap="$3">
          {notifications.length === 0 ? (
            <YStack padding="$8" alignItems="center" gap="$4">
              <Bell size={48} color="$colorMuted" />
              <Text fontSize="$5" color="$colorMuted">No notifications yet</Text>
            </YStack>
          ) : (
            notifications.map((notification, index) => (
              <Card
                key={notification.id}
                padding="$4"
                bordered
                backgroundColor={notification.read ? '$background' : '$primaryLight'}
                pressStyle={{ scale: 0.98, opacity: 0.9 }}
              >
                <XStack gap="$3" alignItems="flex-start">
                  <YStack
                    width={44}
                    height={44}
                    backgroundColor={notification.read ? '$gray5' : '$primary'}
                    borderRadius="$3"
                    alignItems="center"
                    justifyContent="center"
                  >
                    <notification.icon
                      size={22}
                      color={notification.read ? '$colorMuted' : 'white'}
                    />
                  </YStack>
                  <YStack flex={1} gap="$1">
                    <XStack justifyContent="space-between" alignItems="center">
                      <Text fontWeight={notification.read ? 'normal' : 'bold'}>
                        {notification.title}
                      </Text>
                      {!notification.read && (
                        <YStack
                          width={8}
                          height={8}
                          backgroundColor="$primary"
                          borderRadius="$10"
                        />
                      )}
                    </XStack>
                    <Text fontSize="$3" color="$colorMuted">
                      {notification.message}
                    </Text>
                    <Text fontSize="$2" color="$colorMuted" marginTop="$1">
                      {notification.time}
                    </Text>
                  </YStack>
                </XStack>
              </Card>
            ))
          )}
        </YStack>
      </ScrollView>
    </YStack>
  );
}