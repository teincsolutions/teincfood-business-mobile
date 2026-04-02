// @ts-nocheck
import { useState } from 'react';
import { ScrollView, Modal, FlatList } from 'react-native';
import { useRouter } from 'expo-router';
import {
  YStack,
  XStack,
  Text,
  Card,
  Separator,
  Switch,
  useTheme,
} from 'tamagui';
import { Badge } from '@/components/ui/Badge';
import { AppAlertDialog } from '@/components/ui/AlertDialog';
import { PendingOrderCard, PreparingOrderCard, ReadyOrderCard, RiderSelectionSheet } from '@/components/kiosk';
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
import { useResponsive } from '@/utils/responsive';
import { Button } from '@/components/ui';

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
  const { isLargeTablet, isTablet } = useResponsive();

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
    const order = pendingOrders.find((o) => o.id === orderId);
    if (!order) return;

    setDialog({
      open: true,
      title: 'Accept Order',
      description: `Are you sure you want to accept ${order.orderNumber}?`,
      confirmText: 'Accept',
      cancelText: 'Cancel',
      onConfirm: () => {
        triggerHaptic('medium');
        playSound('success');
        acceptOrder.mutate(orderId);
        setDialog(defaultDialogState);
      },
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

    const rider = riders?.find((r) => r.id === riderId);

    setDialog({
      open: true,
      title: 'Assign Rider',
      description: `Are you sure you want to assign this order to ${rider?.name ?? 'rider'}?`,
      confirmText: 'Assign',
      cancelText: 'Cancel',
      onConfirm: () => {
        triggerHaptic('medium');
        playSound('success');
        assignRider.mutate({ orderId: selectedOrderId, riderId });
        setShowRiderSheet(false);
        setSelectedOrderId(null);
        setDialog(defaultDialogState);
      },
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
        {isTablet ? (
          <XStack padding="$4" gap="$4" alignItems="flex-start">
            {/* Column 1: Pending — always isolated on tablet */}
            <YStack flex={1} minWidth={280} gap="$3">
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
                  <PendingOrderCard
                    key={order.id}
                    order={order}
                    onAccept={handleAcceptOrder}
                    onReject={handleRejectOrder}
                    getTimeSince={getTimeSince}
                  />
                ))
              )}
            </YStack>

            {isLargeTablet ? (
              // 3-column: Preparing and Ready each get their own flex column
              <>
                <YStack flex={1} minWidth={280} gap="$3">
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
                      <PreparingOrderCard
                        key={order.id}
                        order={order}
                        onMarkReady={handleMarkReady}
                      />
                    ))
                  )}
                </YStack>

                <YStack flex={1} minWidth={280} gap="$3">
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
                      <ReadyOrderCard
                        key={order.id}
                        order={order}
                        onAssignRider={handleOpenRiderSheet}
                      />
                    ))
                  )}
                </YStack>
              </>
            ) : (
              // 2-column: Preparing + Ready stacked in column 2
              <YStack flex={1} minWidth={280} gap="$4">
                <YStack gap="$3">
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
                      <PreparingOrderCard
                        key={order.id}
                        order={order}
                        onMarkReady={handleMarkReady}
                      />
                    ))
                  )}
                </YStack>

                <YStack gap="$3">
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
                      <ReadyOrderCard
                        key={order.id}
                        order={order}
                        onAssignRider={handleOpenRiderSheet}
                      />
                    ))
                  )}
                </YStack>
              </YStack>
            )}
          </XStack>
        ) : (
          // Phone: 1-column (all stacked)
          <YStack padding="$4" gap="$4">
            {/* Pending */}
            <YStack gap="$3">
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
                  <PendingOrderCard
                    key={order.id}
                    order={order}
                    onAccept={handleAcceptOrder}
                    onReject={handleRejectOrder}
                    getTimeSince={getTimeSince}
                  />
                ))
              )}
            </YStack>

            {/* Preparing */}
            <YStack gap="$3">
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
                  <PreparingOrderCard
                    key={order.id}
                    order={order}
                    onMarkReady={handleMarkReady}
                  />
                ))
              )}
            </YStack>

            {/* Ready */}
            <YStack gap="$3">
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
                  <ReadyOrderCard
                    key={order.id}
                    order={order}
                    onAssignRider={handleOpenRiderSheet}
                  />
                ))
              )}
            </YStack>
          </YStack>
        )}

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
              <Text fontSize="$7" fontWeight="bold" color="$color.starOrange">
                GHS {[...pendingOrders, ...preparingOrders, ...readyOrders].reduce((sum, o) => sum + o.total, 0).toFixed(0)}
              </Text>
              <Text fontSize="$3" color="$colorMuted">Total Value</Text>
            </YStack>
          </Card>
        </XStack>

      </ScrollView>

      {/* Footer - Exit Kiosk Mode */}
      <XStack
        padding="$4"
        paddingBottom="$8"
        backgroundColor="$background"
        borderTopWidth={1}
        borderTopColor="$borderColor"
        justifyContent="center"
      >
        <Button
          flex={1}
          variant="outlined"
          onPress={() => router.back()}
        >
          <XStack gap="$2" alignItems="center">
            <LogOut size={18} />
            <Text fontFamily="$body" fontWeight="700" color="$color">Exit Kiosk Mode</Text>
          </XStack>
        </Button>
      </XStack>

      {/* Rider Selection Sheet */}
      <RiderSelectionSheet
        visible={showRiderSheet}
        onClose={() => setShowRiderSheet(false)}
        riders={riders ?? []}
        onSelectRider={handleAssignRider}
      />

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