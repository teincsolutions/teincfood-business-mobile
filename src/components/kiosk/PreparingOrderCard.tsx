// @ts-nocheck
import { Card, Text, XStack, YStack, Separator } from 'tamagui';
import { Clock, CheckCircle, FileText, User, Printer } from '@tamagui/lucide-icons';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { formatPriceFromMinor } from '@teincfood/core';
import type { SellerOrder } from '@teincfood/core';

interface PreparingOrderCardProps {
  order: SellerOrder;
  onMarkReady: (orderId: string) => void;
  onViewDetails: (order: SellerOrder) => void;
  onPrint?: (orderId: string) => void;
}

export function PreparingOrderCard({ order, onMarkReady, onViewDetails, onPrint }: PreparingOrderCardProps) {
  const callout = (order as any).callout_number ?? order.order_number?.slice(-3) ?? "";
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
          <YStack>
            <Text fontSize="$6" fontWeight="bold">{order.order_number}</Text>
            {callout ? <Text fontSize="$2" color="$primary" fontWeight="700">Callout #{callout}</Text> : null}
          </YStack>
          <Badge backgroundColor="$info" size="$2">
            <Text color="white" fontSize="$1">PREPARING</Text>
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
          <XStack gap="$2" alignItems="center">
            <Text fontSize="$5" fontWeight="bold">{formatPriceFromMinor(order.total_minor, order.currency)}</Text>
            {onPrint && (
              <Button
                height={32}
                width={36}
                padding={0}
                variant="outline"
                borderColor="$borderColor"
                backgroundColor="$background"
                onPress={() => onPrint(order.id)}
              >
                <Printer size={14} color="$color" />
              </Button>
            )}
          </XStack>
          <Button
            height={36}
            paddingHorizontal="$3"
            backgroundColor="$primary"
            borderRadius="$3"
            onPress={() => onMarkReady(order.id)}
          >
            <Text color="white" fontSize="$3" fontWeight="700">Mark ready</Text>
          </Button>
        </XStack>
      </YStack>
    </Card>
  );
}
