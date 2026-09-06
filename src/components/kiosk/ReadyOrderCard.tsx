// @ts-nocheck
import { Card, Text, XStack, YStack, Separator } from 'tamagui';
import { Truck, FileText, User } from '@tamagui/lucide-icons';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { formatPriceFromMinor } from '@teincfood/core';
import type { SellerOrder } from "@teincfood/core";
import { isDeliveryOrder } from "@teincfood/core";

interface ReadyOrderCardProps {
  order: SellerOrder;
  onAssignRider: (orderId: string) => void;
  onHandover: (deliveryId: string) => void;
  onViewDetails: (order: SellerOrder) => void;
  onCompletePickup?: (orderId: string) => void;
}

export function ReadyOrderCard({ order, onAssignRider, onHandover, onViewDetails, onCompletePickup }: ReadyOrderCardProps) {
  const isDelivery = isDeliveryOrder(order);
  const hasDelivery = !!order.delivery_id;

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
          <Text fontSize="$6" fontWeight="bold">{order.order_number}</Text>
          <Badge backgroundColor="$success" size="$2">
            <Text color="white" fontSize="$1">READY</Text>
          </Badge>
        </XStack>

        {(order.customer_name || order.user?.full_name) && (
          <XStack gap="$1" alignItems="center">
            <User size={14} color="$colorMuted" />
            <Text fontSize="$3" color="$colorMuted">
              {order.customer_name || order.user.full_name}
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
          {isDelivery ? (
            hasDelivery && !order.merchant_handover_confirmed_at ? (
              <Button
                height="$12"
                $lg={{ height: "$12" }}
                backgroundColor="$success"
                onPress={() => onHandover(order.delivery_id!)}
                icon={<Truck size={18} color="white" />}
              >
                <Text color="white" fontWeight="bold">HANDOVER TO RIDER</Text>
              </Button>
            ) : (
              <Button
                height="$12"
                $lg={{ height: "$12" }}
                backgroundColor="$primary"
                onPress={() => onAssignRider(order.id)}
                icon={<Truck size={18} color="white" />}
              >
                <Text color="white" fontWeight="bold">ASSIGN RIDER</Text>
              </Button>
            )
          ) : onCompletePickup ? (
            <Button
              height="$12"
              $lg={{ height: "$12" }}
              backgroundColor="$success"
              onPress={() => onCompletePickup(order.id)}
            >
              <Text color="white" fontWeight="bold">{order.order_type === "dine_in" ? "COMPLETE" : "PICKED UP"}</Text>
            </Button>
          ) : null}
        </XStack>
      </YStack>
    </Card>
  );
}
