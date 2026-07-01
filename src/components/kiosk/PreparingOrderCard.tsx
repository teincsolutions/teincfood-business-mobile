// @ts-nocheck
import { Card, Text, XStack, YStack, Separator } from 'tamagui';
import { Clock, CheckCircle, FileText, User } from '@tamagui/lucide-icons';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { formatPriceFromMinor } from '@/utils/currency';
import type { SellerOrder } from '@/types/api';

interface PreparingOrderCardProps {
  order: SellerOrder;
  onMarkReady: (orderId: string) => void;
  onViewDetails: (order: SellerOrder) => void;
}

export function PreparingOrderCard({ order, onMarkReady, onViewDetails }: PreparingOrderCardProps) {
  return (
    <Card
      padding="$4"
      bordered
      backgroundColor="$blue2"
      borderColor="$info"
      borderWidth={1}
      onPress={() => onViewDetails(order)}
      pressStyle={{ opacity: 0.8 }}
      cursor="pointer"
    >
      <YStack gap="$3">
        <XStack justifyContent="space-between" alignItems="center">
          <Text fontSize="$6" fontWeight="bold">{order.order_number}</Text>
          <Badge backgroundColor="$info" size="$2">
            <Text color="white" fontSize="$1">PREPARING</Text>
          </Badge>
        </XStack>

        {order.user?.full_name && (
          <XStack gap="$1" alignItems="center">
            <User size={14} color="$colorMuted" />
            <Text fontSize="$3" color="$colorMuted">
              {order.user.full_name}
            </Text>
          </XStack>
        )}

        {order.notes && (
          <XStack gap="$2" alignItems="flex-start">
            <FileText size={14} color="$info" />
            <Text fontSize="$2" color="$info" flex={1}>
              {order.notes}
            </Text>
          </XStack>
        )}

        <YStack gap="$1">
          {order.items.map((item, index) => (
            <XStack key={item.id} justifyContent="space-between">
              <Text fontSize="$3">{item.quantity}x {item.menu_item?.name}</Text>
              <Text fontSize="$3" color="$colorMuted">{formatPriceFromMinor(item.subtotal, order.currency)}</Text>
            </XStack>
          ))}
        </YStack>

        <Separator />

        <XStack justifyContent="space-between" alignItems="center">
          <Text fontSize="$5" fontWeight="bold">{formatPriceFromMinor(order.total_minor, order.currency)}</Text>
          <Button
            height="$12"
            $lg={{ height: "$12" }}
            backgroundColor="$success"
            onPress={() => onMarkReady(order.id)}
            icon={<CheckCircle size={18} color="white" />}
          >
            <Text color="white" fontWeight="bold">MARK READY</Text>
          </Button>
        </XStack>
      </YStack>
    </Card>
  );
}
