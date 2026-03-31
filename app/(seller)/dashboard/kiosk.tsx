// @ts-nocheck
import { useState, useEffect, useRef } from 'react';
import { ScrollView, RefreshControl, Alert, Vibration } from 'react-native';
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
import { Badge } from '@/components/ui/Badge';
import {
  ShoppingBag,
  Clock,
  CheckCircle,
  XCircle,
  DollarSign,
  CreditCard,
  Banknote,
  Volume2,
  VolumeX,
  Sun,
  Moon,
  RefreshCw,
  Plus,
  Minus,
  Utensils,
} from '@tamagui/lucide-icons';
import { useAuthStore } from '@/stores/auth.store';
import * as Haptics from 'expo-haptics';

/**
 * Kiosk Mode Screen
 * POS-style interface for handling orders in busy restaurant environments
 */
export default function KioskMode() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Mock order queue data
  const [pendingOrders, setPendingOrders] = useState([
    {
      id: '1',
      orderNumber: '#ORD-001',
      items: [
        { name: 'Jollof Rice', quantity: 2, price: 25.00 },
        { name: 'Grilled Chicken', quantity: 1, price: 35.00 },
      ],
      total: 85.00,
      customerName: 'John Doe',
      paymentStatus: 'paid',
      paymentMethod: 'mobile_money',
      createdAt: new Date(Date.now() - 300000).toISOString(),
      estimatedTime: 15,
    },
    {
      id: '2',
      orderNumber: '#ORD-002',
      items: [
        { name: 'Banku & Tilapia', quantity: 1, price: 45.00 },
        { name: 'Kelewele', quantity: 2, price: 10.00 },
      ],
      total: 65.00,
      customerName: 'Jane Smith',
      paymentStatus: 'unpaid',
      paymentMethod: 'cash',
      createdAt: new Date(Date.now() - 180000).toISOString(),
      estimatedTime: 20,
    },
    {
      id: '3',
      orderNumber: '#ORD-003',
      items: [
        { name: 'Waakye', quantity: 3, price: 20.00 },
        { name: 'Fried Plantain', quantity: 2, price: 8.00 },
      ],
      total: 76.00,
      customerName: 'Kwame Asante',
      paymentStatus: 'paid',
      paymentMethod: 'card',
      createdAt: new Date(Date.now() - 60000).toISOString(),
      estimatedTime: 12,
    },
  ]);

  const [activeOrders, setActiveOrders] = useState([
    {
      id: '4',
      orderNumber: '#ORD-004',
      items: [
        { name: 'Fufu & Light Soup', quantity: 2, price: 30.00 },
      ],
      total: 60.00,
      customerName: 'Abena Mensah',
      paymentStatus: 'paid',
      paymentMethod: 'mobile_money',
      status: 'preparing',
      startedAt: new Date(Date.now() - 600000).toISOString(),
      estimatedTime: 5,
    },
    {
      id: '5',
      orderNumber: '#ORD-005',
      items: [
        { name: 'Rice & Stew', quantity: 1, price: 22.00 },
        { name: 'Fried Fish', quantity: 1, price: 25.00 },
      ],
      total: 47.00,
      customerName: 'Kofi Adom',
      paymentStatus: 'paid',
      paymentMethod: 'cash',
      status: 'preparing',
      startedAt: new Date(Date.now() - 480000).toISOString(),
      estimatedTime: 8,
    },
  ]);

  // Auto-refresh effect
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      handleRefresh();
    }, 5000);
    return () => clearInterval(interval);
  }, [autoRefresh]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // Simulate API call
    setTimeout(() => {
      setIsRefreshing(false);
    }, 500);
  };

  const playSound = (type: 'success' | 'alert' | 'error') => {
    if (!soundEnabled) return;
    // Sound would be played here using expo-av
    console.log(`Playing ${type} sound`);
  };

  const triggerHaptic = (style: 'light' | 'medium' | 'heavy') => {
    Haptics.impactAsync(
      style === 'light'
        ? Haptics.ImpactFeedbackStyle.Light
        : style === 'medium'
        ? Haptics.ImpactFeedbackStyle.Medium
        : Haptics.ImpactFeedbackStyle.Heavy
    );
  };

  const handleAcceptOrder = (orderId: string) => {
    triggerHaptic('medium');
    playSound('success');
    
    const order = pendingOrders.find((o) => o.id === orderId);
    if (!order) return;

    setPendingOrders((prev) => prev.filter((o) => o.id !== orderId));
    setActiveOrders((prev) => [
      ...prev,
      { ...order, status: 'preparing', startedAt: new Date().toISOString() },
    ]);

    Alert.alert('Order Accepted', `${order.orderNumber} is now being prepared.`);
  };

  const handleRejectOrder = (orderId: string) => {
    triggerHaptic('heavy');
    playSound('error');

    Alert.alert(
      'Reject Order',
      'Are you sure you want to reject this order?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: () => {
            setPendingOrders((prev) => prev.filter((o) => o.id !== orderId));
          },
        },
      ]
    );
  };

  const handleMarkReady = (orderId: string) => {
    triggerHaptic('medium');
    playSound('success');

    setActiveOrders((prev) => prev.filter((o) => o.id !== orderId));
    Alert.alert('Order Ready', 'Order is now ready for pickup!');
  };

  const getTimeSince = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    return diffMins;
  };

  const getPaymentIcon = (method: string) => {
    switch (method) {
      case 'mobile_money':
        return <DollarSign size={16} />;
      case 'card':
        return <CreditCard size={16} />;
      case 'cash':
        return <Banknote size={16} />;
      default:
        return <DollarSign size={16} />;
    }
  };

  return (
    <YStack flex={1} backgroundColor={darkMode ? '$gray1' : '$background'}>
      {/* Header Controls */}
      <XStack
        padding="$4"
        backgroundColor={darkMode ? '$gray2' : '$primary'}
        justifyContent="space-between"
        alignItems="center"
      >
        <YStack>
          <Text color="$background" fontSize="$6" fontWeight="bold">
            Kiosk Mode
          </Text>
          <Text color="$background" opacity={0.8} fontSize="$3">
            {pendingOrders.length} pending • {activeOrders.length} preparing
          </Text>
        </YStack>

        <XStack gap="$3" alignItems="center">
          {/* Sound Toggle */}
          <Button
            size="$3"
            circular
            backgroundColor="$whiteAlpha"
            onPress={() => setSoundEnabled(!soundEnabled)}
            icon={soundEnabled ? <Volume2 size={18} color="$background" /> : <VolumeX size={18} color="$background" />}
          />

          {/* Dark Mode Toggle */}
          <Button
            size="$3"
            circular
            backgroundColor="$whiteAlpha"
            onPress={() => setDarkMode(!darkMode)}
            icon={darkMode ? <Sun size={18} color="$background" /> : <Moon size={18} color="$background" />}
          />

          {/* Auto Refresh Toggle */}
          <XStack gap="$2" alignItems="center">
            <Text color="$background" fontSize="$2">Auto</Text>
            <Switch
              size="$2"
              checked={autoRefresh}
              onCheckedChange={setAutoRefresh}
              backgroundColor={autoRefresh ? '$green10' : '$gray8'}
            >
              <Switch.Thumb backgroundColor="$background" />
            </Switch>
          </XStack>

          {/* Manual Refresh */}
          <Button
            size="$3"
            circular
            backgroundColor="$whiteAlpha"
            onPress={handleRefresh}
            disabled={isRefreshing}
            icon={<RefreshCw size={18} color="$background" />}
          />
        </XStack>
      </XStack>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
      >
        <XStack padding="$4" gap="$4" flexWrap="wrap">
          {/* Pending Orders Column */}
          <YStack flex={1} minWidth={300} gap="$3">
            <XStack justifyContent="space-between" alignItems="center">
              <Text fontSize="$5" fontWeight="bold">
                Pending Orders
              </Text>
              <Badge backgroundColor="$yellow9" size="$3">
                <Text color="$background">{pendingOrders.length}</Text>
              </Badge>
            </XStack>

            {pendingOrders.length === 0 ? (
              <Card padding="$6" alignItems="center" backgroundColor={darkMode ? '$gray2' : '$gray1'}>
                <CheckCircle size={48} color="$green10" />
                <Text marginTop="$2" color="$colorMuted">
                  No pending orders
                </Text>
              </Card>
            ) : (
              pendingOrders.map((order) => (
                <Card
                  key={order.id}
                  padding="$4"
                  bordered
                  backgroundColor={darkMode ? '$gray2' : '$yellow2'}
                  borderColor="$yellow8"
                >
                  <YStack gap="$3">
                    {/* Order Header */}
                    <XStack justifyContent="space-between" alignItems="center">
                      <Text fontSize="$6" fontWeight="bold">
                        {order.orderNumber}
                      </Text>
                      <XStack gap="$2" alignItems="center">
                        <Clock size={14} color="$colorMuted" />
                        <Text fontSize="$2" color="$colorMuted">
                          {getTimeSince(order.createdAt)}m ago
                        </Text>
                      </XStack>
                    </XStack>

                    {/* Customer & Payment */}
                    <XStack justifyContent="space-between" alignItems="center">
                      <Text fontSize="$3">{order.customerName}</Text>
                      <XStack gap="$2" alignItems="center">
                        {getPaymentIcon(order.paymentMethod)}
                        <Badge
                          backgroundColor={order.paymentStatus === 'paid' ? '$green9' : '$red9'}
                          size="$2"
                        >
                          <Text color="$background" fontSize="$1">
                            {order.paymentStatus === 'paid' ? 'PAID' : 'UNPAID'}
                          </Text>
                        </Badge>
                      </XStack>
                    </XStack>

                    {/* Order Items */}
                    <YStack gap="$1">
                      {order.items.map((item, index) => (
                        <XStack key={index} justifyContent="space-between">
                          <Text fontSize="$3">
                            {item.quantity}x {item.name}
                          </Text>
                          <Text fontSize="$3" color="$colorMuted">
                            GHS {(item.price * item.quantity).toFixed(2)}
                          </Text>
                        </XStack>
                      ))}
                    </YStack>

                    <Separator />

                    {/* Total & Actions */}
                    <XStack justifyContent="space-between" alignItems="center">
                      <Text fontSize="$5" fontWeight="bold">
                        GHS {order.total.toFixed(2)}
                      </Text>
                      <XStack gap="$2">
                        <Button
                          size="$4"
                          backgroundColor="$red10"
                          onPress={() => handleRejectOrder(order.id)}
                          icon={<XCircle size={18} color="$background" />}
                        >
                          <Text color="$background" fontWeight="bold">
                            REJECT
                          </Text>
                        </Button>
                        <Button
                          size="$4"
                          backgroundColor="$green10"
                          onPress={() => handleAcceptOrder(order.id)}
                          icon={<CheckCircle size={18} color="$background" />}
                        >
                          <Text color="$background" fontWeight="bold">
                            ACCEPT
                          </Text>
                        </Button>
                      </XStack>
                    </XStack>
                  </YStack>
                </Card>
              ))
            )}
          </YStack>

          {/* Active Orders Column */}
          <YStack flex={1} minWidth={300} gap="$3">
            <XStack justifyContent="space-between" alignItems="center">
              <Text fontSize="$5" fontWeight="bold">
                Preparing
              </Text>
              <Badge backgroundColor="$blue9" size="$3">
                <Text color="$background">{activeOrders.length}</Text>
              </Badge>
            </XStack>

            {activeOrders.length === 0 ? (
              <Card padding="$6" alignItems="center" backgroundColor={darkMode ? '$gray2' : '$gray1'}>
                <Utensils size={48} color="$colorMuted" />
                <Text marginTop="$2" color="$colorMuted">
                  No orders being prepared
                </Text>
              </Card>
            ) : (
              activeOrders.map((order) => (
                <Card
                  key={order.id}
                  padding="$4"
                  bordered
                  backgroundColor={darkMode ? '$gray2' : '$blue2'}
                  borderColor="$blue8"
                >
                  <YStack gap="$3">
                    {/* Order Header */}
                    <XStack justifyContent="space-between" alignItems="center">
                      <Text fontSize="$6" fontWeight="bold">
                        {order.orderNumber}
                      </Text>
                      <Badge backgroundColor="$blue10" size="$2">
                        <Text color="$background" fontSize="$1">
                          PREPARING
                        </Text>
                      </Badge>
                    </XStack>

                    {/* Customer */}
                    <Text fontSize="$3">{order.customerName}</Text>

                    {/* Order Items */}
                    <YStack gap="$1">
                      {order.items.map((item, index) => (
                        <XStack key={index} justifyContent="space-between">
                          <Text fontSize="$3">
                            {item.quantity}x {item.name}
                          </Text>
                          <Text fontSize="$3" color="$colorMuted">
                            GHS {(item.price * item.quantity).toFixed(2)}
                          </Text>
                        </XStack>
                      ))}
                    </YStack>

                    {/* Estimated Time */}
                    <XStack gap="$2" alignItems="center">
                      <Clock size={14} color="$blue10" />
                      <Text fontSize="$3" color="$blue10" fontWeight="bold">
                        ETA: {order.estimatedTime} min
                      </Text>
                    </XStack>

                    <Separator />

                    {/* Total & Actions */}
                    <XStack justifyContent="space-between" alignItems="center">
                      <Text fontSize="$5" fontWeight="bold">
                        GHS {order.total.toFixed(2)}
                      </Text>
                      <Button
                        size="$4"
                        backgroundColor="$green10"
                        onPress={() => handleMarkReady(order.id)}
                        icon={<CheckCircle size={18} color="$background" />}
                      >
                        <Text color="$background" fontWeight="bold">
                          MARK READY
                        </Text>
                      </Button>
                    </XStack>
                  </YStack>
                </Card>
              ))
            )}
          </YStack>
        </XStack>

        {/* Quick Stats */}
        <XStack padding="$4" gap="$3">
          <Card flex={1} padding="$4" backgroundColor={darkMode ? '$gray2' : '$green2'}>
            <YStack alignItems="center" gap="$1">
              <Text fontSize="$7" fontWeight="bold" color="$green10">
                {pendingOrders.length + activeOrders.length}
              </Text>
              <Text fontSize="$3" color="$colorMuted">
                Total Active
              </Text>
            </YStack>
          </Card>

          <Card flex={1} padding="$4" backgroundColor={darkMode ? '$gray2' : '$blue2'}>
            <YStack alignItems="center" gap="$1">
              <Text fontSize="$7" fontWeight="bold" color="$blue10">
                {activeOrders.reduce((sum, o) => sum + o.estimatedTime, 0)}m
              </Text>
              <Text fontSize="$3" color="$colorMuted">
                Total ETA
              </Text>
            </YStack>
          </Card>

          <Card flex={1} padding="$4" backgroundColor={darkMode ? '$gray2' : '$yellow2'}>
            <YStack alignItems="center" gap="$1">
              <Text fontSize="$7" fontWeight="bold" color="$yellow10">
                GHS {[...pendingOrders, ...activeOrders].reduce((sum, o) => sum + o.total, 0).toFixed(0)}
              </Text>
              <Text fontSize="$3" color="$colorMuted">
                Total Value
              </Text>
            </YStack>
          </Card>
        </XStack>

        {/* Exit Kiosk Mode */}
        <YStack padding="$4" paddingBottom="$8">
          <Button
            size="$5"
            backgroundColor="$gray8"
            onPress={() => router.back()}
          >
            Exit Kiosk Mode
          </Button>
        </YStack>
      </ScrollView>
    </YStack>
  );
}