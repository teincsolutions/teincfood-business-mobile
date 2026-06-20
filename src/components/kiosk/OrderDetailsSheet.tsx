// @ts-nocheck
import { Modal } from 'react-native';
import { YStack, XStack, Text, Card, Separator } from 'tamagui';
import {
  Clock,
  X,
  CheckCircle,
  Utensils,
  Truck,
  FileText,
} from '@tamagui/lucide-icons';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useResponsive } from '@/utils/responsive';
import { formatPrice } from '@/utils/currency';
import type { KioskOrder } from '@/models/kiosk.model';

interface OrderDetailsSheetProps {
  visible: boolean;
  onClose: () => void;
  order: KioskOrder | null;
  getTimeSince: (dateString: string) => number;
}

export function OrderDetailsSheet({
  visible,
  onClose,
  order,
  getTimeSince,
}: OrderDetailsSheetProps) {
  const { isTablet } = useResponsive();

  if (!order) return null;

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

  const getStatusBadge = () => {
    switch (order.status) {
      case 'pending':
        return (
          <Badge backgroundColor="$orangeLight" size="$3">
            <Text color="$primary" fontWeight="bold">PENDING</Text>
          </Badge>
        );
      case 'preparing':
        return (
          <Badge backgroundColor="$blue2" size="$3">
            <Text color="$info" fontWeight="bold">PREPARING</Text>
          </Badge>
        );
      case 'ready':
        return (
          <Badge backgroundColor="$green2" size="$3">
            <Text color="$success" fontWeight="bold">READY</Text>
          </Badge>
        );
      default:
        return null;
    }
  };

  const getStatusIcon = () => {
    switch (order.status) {
      case 'pending':
        return <Clock size={24} color="$primary" />;
      case 'preparing':
        return <Utensils size={24} color="$info" />;
      case 'ready':
        return <Truck size={24} color="$success" />;
      default:
        return <Clock size={24} color="$primary" />;
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <YStack flex={1} justifyContent="flex-end" backgroundColor="rgba(0,0,0,0.4)">
        <YStack
          backgroundColor="$background"
          borderTopLeftRadius="$6"
          borderTopRightRadius="$6"
          padding="$5"
          maxHeight="80%"
        >
          {/* Header */}
          <XStack justifyContent="space-between" alignItems="center" marginBottom="$4">
            <XStack gap="$3" alignItems="center">
              {getStatusIcon()}
              <YStack>
                <Text fontSize="$6" fontWeight="bold">{order.orderNumber}</Text>
                {getStatusBadge()}
              </YStack>
            </XStack>
            <Button
              width="$8"
              height="$8"
              $lg={{ width:'$12', height: "$12" }}
              variant='ghost'
              rounded="$full"
              backgroundColor="$backgroundSoft"
              onPress={onClose}
              icon={<X size={isTablet ? 24 : 18} />}
            />
          </XStack>

          <Separator marginBottom="$4" />

          {/* Special Instructions */}
          {order.specialInstructions && (
            <YStack gap="$2" marginBottom="$4">
              <Text fontSize="$4" fontWeight="bold" color="$colorSecondary">Special Instructions</Text>
              <XStack gap="$2" alignItems="flex-start">
                <FileText size={16} color="$info" />
                <Text fontSize="$4" color="$info" flex={1}>
                  {order.specialInstructions}
                </Text>
              </XStack>
            </YStack>
          )}

          {/* Order Time */}
          <YStack gap="$2" marginBottom="$4">
            <Text fontSize="$4" fontWeight="bold" color="$colorSecondary">Order Time</Text>
            <XStack gap="$2" alignItems="center">
              <Clock size={16} color="$colorMuted" />
              <Text fontSize="$4">{getTimeSince(order.createdAt)} minutes ago</Text>
            </XStack>
          </YStack>


          {/* ETA (if preparing) */}
          {order.status === 'preparing' && (
            <YStack gap="$2" marginBottom="$4">
              <Text fontSize="$4" fontWeight="bold" color="$colorSecondary">Estimated Time</Text>
              <XStack gap="$2" alignItems="center">
                <Clock size={16} color="$info" />
                <Text fontSize="$4" color="$info" fontWeight="bold">{order.estimatedTime} minutes</Text>
              </XStack>
            </YStack>
          )}

          <Separator marginBottom="$4" />

          {/* Order Items */}
          <YStack gap="$2" marginBottom="$4">
            <Text fontSize="$4" fontWeight="bold" color="$colorSecondary">Order Items</Text>
            <YStack gap="$2">
              {order.items.map((item, index) => (
                <XStack key={index} justifyContent="space-between" alignItems="center">
                  <XStack gap="$2" alignItems="center">
                    <Text fontSize="$4" fontWeight="bold">{item.quantity}x</Text>
                    <Text fontSize="$4">{item.name}</Text>
                  </XStack>
                  <Text fontSize="$4" color="$colorMuted">
                    {formatPrice(item.price * item.quantity, order.currency)}
                  </Text>
                </XStack>
              ))}
            </YStack>
          </YStack>

          <Separator marginBottom="$4" />

          {/* Total */}
          <XStack justifyContent="space-between" alignItems="center" marginBottom="$4">
            <Text fontSize="$5" fontWeight="bold">Total</Text>
            <Text fontSize="$6" fontWeight="bold" color="$primary">
              {formatPrice(order.total, order.currency)}
            </Text>
          </XStack>

          {/* Close Button */}
          <Button
            flex={1}
            variant="outlined"
            onPress={onClose}
          >
            <Text fontWeight="bold">Close</Text>
          </Button>
        </YStack>
      </YStack>
    </Modal>
  );
}