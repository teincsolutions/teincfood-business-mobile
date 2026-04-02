// @ts-nocheck
import { Card, Text, XStack, YStack, Separator } from 'tamagui';
import { Clock, CheckCircle, Utensils } from '@tamagui/lucide-icons';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import type { KioskOrder } from '@/services/mock-data.service';

interface PreparingOrderCardProps {
  order: KioskOrder;
  onMarkReady: (orderId: string) => void;
}

export function PreparingOrderCard({ order, onMarkReady }: PreparingOrderCardProps) {
  return (
    <Card
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