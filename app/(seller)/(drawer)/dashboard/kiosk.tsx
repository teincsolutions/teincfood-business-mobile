// @ts-nocheck
import { useState } from 'react';
import { ScrollView, Modal, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import {
  YStack,
  XStack,
  Text,
  Card,
  Button,
  Separator,
  Switch,
  useTheme,
} from 'tamagui';
import { Badge } from '@/components/ui/Badge';
import { AppAlertDialog } from '@/components/ui/AlertDialog';
import {
  Clock,
  CheckCircle,
  XCircle,
  DollarSign,
  CreditCard,
  Banknote,
  Volume2,
  VolumeX,
  RefreshCw,
  Utensils,
  LogOut,
  Truck,
  Star,
  Phone,
  Bike,
  Car,
  Navigation,
  X,
} from '@tamagui/lucide-icons';
import { useAuthStore } from '@/stores/auth.store';
import { useKioskStore } from '@/stores/kiosk.store';
import * as Haptics from 'expo-haptics';
import type { KioskOrder } from '@/services/mock-data.service';
import type { AvailableRider } from '@/services/kiosk.service';
import {
  useKioskOrdersQuery,
  useAcceptKioskOrderMutation,
  useRejectKioskOrderMutation,
  useMarkKioskOrderReadyMutation,
  useAssignRiderMutation,
  useAvailableRidersQuery,
} from '@/hooks/kiosk.hooks';

interface DialogState {
  open: boolean;
  title: string;
  description: string;
  confirmText: string;
  cancelText: string;
  onConfirm: () => void;
  icon?: any;
  isDestructive: boolean;
}

const defaultDialogState: DialogState = {
  open: false,
  title: '',
  description: '',
  confirmText: 'OK',
  cancelText: 'Cancel',
  onConfirm: () => {},
  icon: undefined,
  isDestructive: false,
};

/**
 * Kiosk Mode Screen
 * POS-style interface for handling orders in busy restaurant environments
 */
export default function KioskMode() {
  const router = useRouter();
  const theme = useTheme();
  const user = useAuthStore((state) => state.user);

  // UI preferences
  const soundEnabled = useKioskStore((state) => state.soundEnabled);
  const autoRefresh = useKioskStore((state) => state.autoRefresh);
  const toggleSound = useKioskStore((state) => state.toggleSound);
  const toggleAutoRefresh = useKioskStore((state) => state.toggleAutoRefresh);

  // Dialog state
  const [dialog, setDialog] = useState<DialogState>(defaultDialogState);

  // Rider selection sheet
  const [showRiderSheet, setShowRiderSheet] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  // TanStack Query
  const { data, isRefetching, refetch } = useKioskOrdersQuery(autoRefresh);
  const acceptOrder = useAcceptKioskOrderMutation();
  const rejectOrder = useRejectKioskOrderMutation();
  const markReady = useMarkKioskOrderReadyMutation();
  const assignRider = useAssignRiderMutation();
  const { data: riders } = useAvailableRidersQuery(showRiderSheet);

  const pendingOrders = data?.pendingOrders ?? [];
  const preparingOrders = data?.preparingOrders ?? [];
  const readyOrders = data?.readyOrders ?? [];

  const playSound = (type: 'success' | 'alert' | 'error') => {
    if (!soundEnabled) return;
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

    acceptOrder.mutate(orderId);

    setDialog({
      open: true,
      title: 'Order Accepted',
      description: `${order.orderNumber} is now being prepared.`,
      confirmText: 'OK',
      cancelText: 'Cancel',
      onConfirm: () => setDialog(defaultDialogState),
      icon: CheckCircle,
      isDestructive: false,
    });
  };

  const handleRejectOrder = (orderId: string) => {
    triggerHaptic('heavy');
    playSound('error');

    const order = pendingOrders.find((o) => o.id === orderId);
    if (!order) return;

    setDialog({
      open: true,
      title: 'Reject Order',
      description: 'Are you sure you want to reject this order?',
      confirmText: 'Reject',
      cancelText: 'Cancel',
      onConfirm: () => {
        rejectOrder.mutate(orderId);
        setDialog(defaultDialogState);
      },
      icon: XCircle,
      isDestructive: true,
    });
  };

  const handleMarkReady = (orderId: string) => {
    triggerHaptic('medium');

    const order = preparingOrders.find((o) => o.id === orderId);
    if (!order) return;

    setDialog({
      open: true,
      title: 'Mark as Ready',
      description: `Is ${order.orderNumber} ready for pickup?`,
      confirmText: 'Mark Ready',
      cancelText: 'Cancel',
      onConfirm: () => {
        markReady.mutate(orderId);
        setDialog(defaultDialogState);
      },
      icon: CheckCircle,
      isDestructive: false,
    });
  };

  const handleOpenRiderSheet = (orderId: string) => {
    setSelectedOrderId(orderId);
    setShowRiderSheet(true);
  };

  const handleAssignRider = (riderId: string) => {
    if (!selectedOrderId) return;

    triggerHaptic('medium');
    playSound('success');

    const rider = riders?.find((r) => r.id === riderId);
    assignRider.mutate({ orderId: selectedOrderId, riderId });

    setShowRiderSheet(false);
    setSelectedOrderId(null);

    setDialog({
      open: true,
      title: 'Order Assigned',
      description: `Order assigned to ${rider?.name ?? 'rider'}. They will pick it up shortly.`,
      confirmText: 'OK',
      cancelText: 'Cancel',
      onConfirm: () => setDialog(defaultDialogState),
      icon: Truck,
      isDestructive: false,
    });
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

  const getVehicleIcon = (type: string) => {
    switch (type) {
      case 'motorcycle':
        return <Bike size={18} />;
      case 'car':
        return <Car size={18} />;
      default:
        return <Bike size={18} />;
    }
  };

  const totalActive = pendingOrders.length + preparingOrders.length + readyOrders.length;

  return (
    <YStack flex={1} backgroundColor="$background">
      {/* Header Controls */}
      <XStack
        padding="$4"
        backgroundColor="$primary"
        justifyContent="space-between"
        alignItems="center"
      >
        <YStack>
          <Text color="$background" fontSize="$6" fontWeight="bold">
            Kiosk Mode
          </Text>
          <Text color="$background" opacity={0.8} fontSize="$3">
            {pendingOrders.length} pending • {preparingOrders.length} preparing • {readyOrders.length} ready
          </Text>
        </YStack>

        <XStack gap="$3" alignItems="center">
          <Button
            size="$3"
            circular
            backgroundColor="$whiteAlpha"
            onPress={toggleSound}
            icon={soundEnabled ? <Volume2 size={18} color="$background" /> : <VolumeX size={18} color="$background" />}
          />

          <XStack gap="$2" alignItems="center">
            <Text color="$background" fontSize="$2">Auto</Text>
            <Switch
              size="$2"
              checked={autoRefresh}
              onCheckedChange={toggleAutoRefresh}
              backgroundColor={autoRefresh ? '$green10' : '$gray8'}
            >
              <Switch.Thumb backgroundColor="$background" />
            </Switch>
          </XStack>

          <Button
            size="$3"
            circular
            backgroundColor="$whiteAlpha"
            onPress={() => refetch()}
            disabled={isRefetching}
            icon={<RefreshCw size={18} color="$background" />}
          />
        </XStack>
      </XStack>

      <ScrollView showsVerticalScrollIndicator={false}>
        <XStack
          padding="$4"
          gap="$4"
          flexWrap="wrap"
          $gtSm={{ flexDirection: 'row' }}
          $sm={{ flexDirection: 'column' }}
        >
          {/* ─── Pending Orders ─── */}
          <YStack flex={1} minWidth={280} $gtSm={{ flex: 1 }} $sm={{ flex: 'none' }} gap="$3">
            <XStack justifyContent="space-between" alignItems="center">
              <XStack gap="$2" alignItems="center">
                <Clock size={18} color="$primary" />
                <Text fontSize="$5" fontWeight="bold">Pending Orders</Text>
              </XStack>
              <Badge backgroundColor="$orangeLight" size="$3">
                <Text color="$primary" fontWeight="bold">{pendingOrders.length}</Text>
              </Badge>
            </XStack>

            {pendingOrders.length === 0 ? (
              <Card padding="$6" alignItems="center" backgroundColor="$backgroundSoft">
                <CheckCircle size={48} color="$success" />
                <Text marginTop="$2" color="$colorMuted">No pending orders</Text>
              </Card>
            ) : (
              pendingOrders.map((order) => (
                <Card
                  key={order.id}
                  padding="$4"
                  bordered
                  backgroundColor="$orangeLight"
                  borderColor="$primary"
                  borderWidth={1}
                >
                  <YStack gap="$3">
                    <XStack justifyContent="space-between" alignItems="center">
                      <Text fontSize="$6" fontWeight="bold">{order.orderNumber}</Text>
                      <XStack gap="$2" alignItems="center">
                        <Clock size={14} color="$colorMuted" />
                        <Text fontSize="$2" color="$colorMuted">{getTimeSince(order.createdAt)}m ago</Text>
                      </XStack>
                    </XStack>

                    <XStack justifyContent="space-between" alignItems="center">
                      <Text fontSize="$3">{order.customerName}</Text>
                      <XStack gap="$2" alignItems="center">
                        {getPaymentIcon(order.paymentMethod)}
                        <Badge
                          backgroundColor={order.paymentStatus === 'paid' ? '$success' : '$error'}
                          size="$2"
                        >
                          <Text color="white" fontSize="$1">
                            {order.paymentStatus === 'paid' ? 'PAID' : 'UNPAID'}
                          </Text>
                        </Badge>
                      </XStack>
                    </XStack>

                    <YStack gap="$1">
                      {order.items.map((item, index) => (
                        <XStack key={index} justifyContent="space-between">
                          <Text fontSize="$3">{item.quantity}x {item.name}</Text>
                          <Text fontSize="$3" color="$colorMuted">GHS {(item.price * item.quantity).toFixed(2)}</Text>
                        </XStack>
                      ))}
                    </YStack>

                    <Separator />

                    <XStack justifyContent="space-between" alignItems="center">
                      <Text fontSize="$5" fontWeight="bold">GHS {order.total.toFixed(2)}</Text>
                      <XStack gap="$2">
                        <Button
                          height={48}
                          backgroundColor="$error"
                          onPress={() => handleRejectOrder(order.id)}
                          icon={<XCircle size={18} color="white" />}
                        >
                          <Text color="white" fontWeight="bold">REJECT</Text>
                        </Button>
                        <Button
                          height={48}
                          backgroundColor="$success"
                          onPress={() => handleAcceptOrder(order.id)}
                          icon={<CheckCircle size={18} color="white" />}
                        >
                          <Text color="white" fontWeight="bold">ACCEPT</Text>
                        </Button>
                      </XStack>
                    </XStack>
                  </YStack>
                </Card>
              ))
            )}
          </YStack>

          {/* ─── Preparing Orders ─── */}
          <YStack flex={1} minWidth={280} $gtSm={{ flex: 1 }} $sm={{ flex: 'none' }} gap="$3">
            <XStack justifyContent="space-between" alignItems="center">
              <XStack gap="$2" alignItems="center">
                <Utensils size={18} color="$info" />
                <Text fontSize="$5" fontWeight="bold">Preparing</Text>
              </XStack>
              <Badge backgroundColor="$blue2" size="$3">
                <Text color="$info" fontWeight="bold">{preparingOrders.length}</Text>
              </Badge>
            </XStack>

            {preparingOrders.length === 0 ? (
              <Card padding="$6" alignItems="center" backgroundColor="$backgroundSoft">
                <Utensils size={48} color="$colorMuted" />
                <Text marginTop="$2" color="$colorMuted">No orders being prepared</Text>
              </Card>
            ) : (
              preparingOrders.map((order) => (
                <Card
                  key={order.id}
                  padding="$4"
                  bordered
                  backgroundColor="$blue2"
                  borderColor="$info"
                  borderWidth={1}
                >
                  <YStack gap="$3">
                    <XStack justifyContent="space-between" alignItems="center">
                      <Text fontSize="$6" fontWeight="bold">{order.orderNumber}</Text>
                      <Badge backgroundColor="$info" size="$2">
                        <Text color="white" fontSize="$1">PREPARING</Text>
                      </Badge>
                    </XStack>

                    <Text fontSize="$3">{order.customerName}</Text>

                    <YStack gap="$1">
                      {order.items.map((item, index) => (
                        <XStack key={index} justifyContent="space-between">
                          <Text fontSize="$3">{item.quantity}x {item.name}</Text>
                          <Text fontSize="$3" color="$colorMuted">GHS {(item.price * item.quantity).toFixed(2)}</Text>
                        </XStack>
                      ))}
                    </YStack>

                    <XStack gap="$2" alignItems="center">
                      <Clock size={14} color="$info" />
                      <Text fontSize="$3" color="$info" fontWeight="bold">ETA: {order.estimatedTime} min</Text>
                    </XStack>

                    <Separator />

                    <XStack justifyContent="space-between" alignItems="center">
                      <Text fontSize="$5" fontWeight="bold">GHS {order.total.toFixed(2)}</Text>
                      <Button
                        height={48}
                        backgroundColor="$success"
                        onPress={() => handleMarkReady(order.id)}
                        icon={<CheckCircle size={18} color="white" />}
                      >
                        <Text color="white" fontWeight="bold">MARK READY</Text>
                      </Button>
                    </XStack>
                  </YStack>
                </Card>
              ))
            )}
          </YStack>

          {/* ─── Ready for Pickup ─── */}
          <YStack flex={1} minWidth={280} $gtSm={{ flex: 1 }} $sm={{ flex: 'none' }} gap="$3">
            <XStack justifyContent="space-between" alignItems="center">
              <XStack gap="$2" alignItems="center">
                <Truck size={18} color="$success" />
                <Text fontSize="$5" fontWeight="bold">Ready for Pickup</Text>
              </XStack>
              <Badge backgroundColor="$green2" size="$3">
                <Text color="$success" fontWeight="bold">{readyOrders.length}</Text>
              </Badge>
            </XStack>

            {readyOrders.length === 0 ? (
              <Card padding="$6" alignItems="center" backgroundColor="$backgroundSoft">
                <Truck size={48} color="$colorMuted" />
                <Text marginTop="$2" color="$colorMuted">No orders ready</Text>
              </Card>
            ) : (
              readyOrders.map((order) => (
                <Card
                  key={order.id}
                  padding="$4"
                  bordered
                  backgroundColor="$green2"
                  borderColor="$success"
                  borderWidth={1}
                >
                  <YStack gap="$3">
                    <XStack justifyContent="space-between" alignItems="center">
                      <Text fontSize="$6" fontWeight="bold">{order.orderNumber}</Text>
                      <Badge backgroundColor="$success" size="$2">
                        <Text color="white" fontSize="$1">READY</Text>
                      </Badge>
                    </XStack>

                    <Text fontSize="$3">{order.customerName}</Text>

                    <YStack gap="$1">
                      {order.items.map((item, index) => (
                        <XStack key={index} justifyContent="space-between">
                          <Text fontSize="$3">{item.quantity}x {item.name}</Text>
                          <Text fontSize="$3" color="$colorMuted">GHS {(item.price * item.quantity).toFixed(2)}</Text>
                        </XStack>
                      ))}
                    </YStack>

                    <Separator />

                    <XStack justifyContent="space-between" alignItems="center">
                      <Text fontSize="$5" fontWeight="bold">GHS {order.total.toFixed(2)}</Text>
                      <Button
                        height={48}
                        backgroundColor="$primary"
                        onPress={() => handleOpenRiderSheet(order.id)}
                        icon={<Truck size={18} color="white" />}
                      >
                        <Text color="white" fontWeight="bold">ASSIGN RIDER</Text>
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
          <Card flex={1} padding="$4" backgroundColor="$backgroundSoft">
            <YStack alignItems="center" gap="$1">
              <Text fontSize="$7" fontWeight="bold" color="$primary">{totalActive}</Text>
              <Text fontSize="$3" color="$colorMuted">Total Active</Text>
            </YStack>
          </Card>

          <Card flex={1} padding="$4" backgroundColor="$backgroundSoft">
            <YStack alignItems="center" gap="$1">
              <Text fontSize="$7" fontWeight="bold" color="$info">
                {preparingOrders.reduce((sum, o) => sum + o.estimatedTime, 0)}m
              </Text>
              <Text fontSize="$3" color="$colorMuted">Total ETA</Text>
            </YStack>
          </Card>

          <Card flex={1} padding="$4" backgroundColor="$backgroundSoft">
            <YStack alignItems="center" gap="$1">
              <Text fontSize="$7" fontWeight="bold" color="$star">
                GHS {[...pendingOrders, ...preparingOrders, ...readyOrders].reduce((sum, o) => sum + o.total, 0).toFixed(0)}
              </Text>
              <Text fontSize="$3" color="$colorMuted">Total Value</Text>
            </YStack>
          </Card>
        </XStack>

        {/* Exit Kiosk Mode */}
        <YStack padding="$4" paddingBottom="$8">
          <Button variant="outlined" onPress={() => router.back()}>
            <XStack gap="$2" alignItems="center">
              <LogOut size={18} />
              <Text fontFamily="$body" fontWeight="700" color="$color">Exit Kiosk Mode</Text>
            </XStack>
          </Button>
        </YStack>
      </ScrollView>

      {/* Rider Selection Sheet */}
      <Modal
        visible={showRiderSheet}
        animationType="slide"
        transparent
        onRequestClose={() => setShowRiderSheet(false)}
      >
        <YStack flex={1} justifyContent="flex-end" backgroundColor="rgba(0,0,0,0.4)">
          <YStack
            backgroundColor="$background"
            borderTopLeftRadius="$6"
            borderTopRightRadius="$6"
            padding="$5"
            maxHeight="70%"
          >
            <XStack justifyContent="space-between" alignItems="center" marginBottom="$4">
              <Text fontSize="$6" fontWeight="bold">Select a Rider</Text>
              <Button
                size="$3"
                circular
                backgroundColor="$backgroundSoft"
                onPress={() => setShowRiderSheet(false)}
                icon={<X size={18} />}
              />
            </XStack>

            <FlatList
              data={riders ?? []}
              keyExtractor={(item) => item.id}
              renderItem={({ item: rider }) => (
                <Card
                  padding="$4"
                  marginBottom="$3"
                  bordered
                  backgroundColor="$backgroundSoft"
                  borderColor="$borderColor"
                  pressStyle={{ opacity: 0.7 }}
                  onPress={() => handleAssignRider(rider.id)}
                >
                  <XStack gap="$3" alignItems="center">
                    {/* Avatar */}
                    <YStack
                      width={48}
                      height={48}
                      borderRadius="$full"
                      backgroundColor="$primary"
                      alignItems="center"
                      justifyContent="center"
                    >
                      <Text color="white" fontSize="$5" fontWeight="bold">
                        {rider.name.charAt(0)}
                      </Text>
                    </YStack>

                    {/* Rider Info */}
                    <YStack flex={1} gap="$1">
                      <XStack alignItems="center" gap="$2">
                        <Text fontSize="$4" fontWeight="bold">{rider.name}</Text>
                        <XStack alignItems="center" gap="$0.5">
                          <Star size={12} color="$star" fill="$star" />
                          <Text fontSize="$2" color="$colorMuted">{rider.rating}</Text>
                        </XStack>
                      </XStack>

                      <XStack alignItems="center" gap="$2">
                        {getVehicleIcon(rider.vehicleType)}
                        <Text fontSize="$3" color="$colorSecondary">
                          {rider.vehicleType === 'motorcycle' ? 'Motorcycle' : rider.vehicleType === 'car' ? 'Car' : 'Bicycle'}
                          {rider.plateNumber ? ` • ${rider.plateNumber}` : ''}
                        </Text>
                      </XStack>

                      <XStack alignItems="center" gap="$1">
                        <Navigation size={12} color="$success" />
                        <Text fontSize="$2" color="$success" fontWeight="600">
                          {rider.distanceKm < 1 ? `${(rider.distanceKm * 1000).toFixed(0)}m away` : `${rider.distanceKm.toFixed(1)}km away`}
                        </Text>
                      </XStack>
                    </YStack>

                    {/* Phone */}
                    <Button
                      size="$3"
                      circular
                      backgroundColor="$backgroundSoft"
                      icon={<Phone size={16} color="$colorMuted" />}
                    />
                  </XStack>
                </Card>
              )}
              ListEmptyComponent={
                <YStack padding="$6" alignItems="center">
                  <Text color="$colorMuted">No riders available</Text>
                </YStack>
              }
            />
          </YStack>
        </YStack>
      </Modal>

      {/* Alert Dialog */}
      <AppAlertDialog
        open={dialog.open}
        onOpenChange={(open) => {
          if (!open) setDialog(defaultDialogState);
        }}
        title={dialog.title}
        description={dialog.description}
        confirmText={dialog.confirmText}
        cancelText={dialog.cancelText}
        onConfirm={dialog.onConfirm}
        onCancel={() => setDialog(defaultDialogState)}
        icon={dialog.icon}
        isDestructive={dialog.isDestructive}
      />
    </YStack>
  );
}