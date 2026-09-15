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
  const callout = (order as any).callout_number ?? order.order_number?.slice(-3) ?? "";

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
          <YStack>
            <Text fontSize="$6" fontWeight="bold">{order.order_number}</Text>
            {callout ? <Text fontSize="$2" color="$primary" fontWeight="700">Callout #{callout}</Text> : null}
          </YStack>
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
          {order.items.map((item, index) => {
            const variantName = (item as any).variant_name || (item as any).selected_variant?.name;
            const addons = (item as any).addons || (item as any).selected_addons || [];
            return (
              <YStack key={item.id} gap="$1">
                <XStack justifyContent="space-between">
                  <Text fontSize="$3" flex={1} numberOfLines={2}>{item.quantity}x {item.menu_item?.name} {variantName ? `· ${variantName}` : ""}</Text>
                  <Text fontSize="$3" color="$colorMuted">{formatPriceFromMinor(item.subtotal, order.currency)}</Text>
                </XStack>
                {addons.length > 0 && <Text fontSize="$2" color="$colorMuted" paddingLeft="$2">+ {addons.map((a: any) => a.name).join(", ")}</Text>}
              </YStack>
            );
          })}
        </YStack>

        <Separator />

        <XStack justifyContent="space-between" alignItems="center">
          <Text fontSize="$5" fontWeight="bold">{formatPriceFromMinor(order.total_minor, order.currency)}</Text>
          {isDelivery ? (
            hasDelivery && !order.merchant_handover_confirmed_at ? (
              <Button
                height={36}
                paddingHorizontal="$3"
                backgroundColor="$primary"
                borderRadius="$3"
                onPress={() => onHandover(order.delivery_id!)}
              >
                <Text color="white" fontSize="$3" fontWeight="700">Handover to rider</Text>
              </Button>
            ) : (
              <Button
                height={36}
                paddingHorizontal="$3"
                backgroundColor="$primary"
                borderRadius="$3"
                onPress={() => onAssignRider(order.id)}
              >
                <Text color="white" fontSize="$3" fontWeight="700">Assign rider</Text>
              </Button>
            )
          ) : onCompletePickup ? (
            <Button
              height={36}
              paddingHorizontal="$3"
              backgroundColor="$primary"
              borderRadius="$3"
              onPress={() => onCompletePickup(order.id)}
            >
              <Text color="white" fontSize="$3" fontWeight="700">{order.order_type === "dine_in" ? "Complete" : "Picked up"}</Text>
            </Button>
          ) : null}
        </XStack>
      </YStack>
    </Card>
  );
}
