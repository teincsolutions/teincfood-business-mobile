// @ts-nocheck
import { Card, Text, XStack, YStack, Separator } from 'tamagui';
import { Truck, FileText } from '@tamagui/lucide-icons';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import type { KioskOrder } from '@/services/mock-data.service';

interface ReadyOrderCardProps {
  order: KioskOrder;
  onAssignRider: (orderId: string) => void;
  onViewDetails: (order: KioskOrder) => void;
}

export function ReadyOrderCard({ order, onAssignRider, onViewDetails }: ReadyOrderCardProps) {
  return (
    <Card
      padding="$4"
      bordered
      backgroundColor="$green2"
      borderColor="$success"
      borderWidth={1}
      onPress={() => onViewDetails(order)}
      pressStyle={{ opacity: 0.8 }}
      cursor="pointer"
    >
      <YStack gap="$3">
        <XStack justifyContent="space-between" alignItems="center">
          <Text fontSize="$6" fontWeight="bold">{order.orderNumber}</Text>
          <Badge backgroundColor="$success" size="$2">
            <Text color="white" fontSize="$1">READY</Text>
          </Badge>
        </XStack>

        {order.specialInstructions && (
          <XStack gap="$2" alignItems="flex-start">
            <FileText size={14} color="$info" />
            <Text fontSize="$2" color="$info" flex={1}>
              {order.specialInstructions}
            </Text>
          </XStack>
        )}

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
            height="$12"
            $lg={{ height: "$12" }}
            backgroundColor="$primary"
            onPress={() => onAssignRider(order.id)}
            icon={<Truck size={18} color="white" />}
          >
            <Text color="white" fontWeight="bold">ASSIGN RIDER</Text>
          </Button>
        </XStack>
      </YStack>
    </Card>
  );
}