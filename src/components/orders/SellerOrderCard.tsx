// @ts-nocheck
import {
  Card,
  YStack,
  XStack,
  Text,
  Separator,
} from "tamagui";
import { Button } from "@/components/ui";
import { Clock, MapPin, Phone, User, ChefHat } from "@tamagui/lucide-icons";
import { useRouter } from "expo-router";
import { formatPriceFromMinor } from "@/utils/currency";
import type { SellerOrder } from "@/types/api";

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  pending:    { label: "New",        color: "$yellow11", bg: "$yellow3" },
  accepted:   { label: "Accepted",   color: "$orange11", bg: "$orange3" },
  preparing:  { label: "Preparing",  color: "$blue11",   bg: "$blue3" },
  ready:      { label: "Ready",      color: "$green11",  bg: "$green3" },
  delivered:  { label: "Delivered",  color: "$gray11",   bg: "$gray3" },
  cancelled:  { label: "Cancelled",  color: "$red11",    bg: "$red3" },
};

function getTimeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

interface SellerOrderCardProps {
  item: SellerOrder;
  onAccept?: (id: string) => void;
  onReject?: (id: string) => void;
  onPrepare?: (id: string) => void;
  onMarkReady?: (id: string) => void;
  showDialog?: (title: string, description: string, onConfirm: () => void, isDestructive?: boolean) => void;
}

function StatusBadge({ status }: { status: { label: string; color: string; bg: string } }) {
  return (
    <XStack
      paddingHorizontal="$2"
      paddingVertical="$1"
      borderRadius="$2"
      backgroundColor={status.bg}
    >
      <Text fontSize="$2" fontWeight="700" color={status.color}>
        {status.label}
      </Text>
    </XStack>
  );
}

export function SellerOrderCard({
  item,
  onAccept,
  onReject,
  onPrepare,
  onMarkReady,
  showDialog,
}: SellerOrderCardProps) {
  const router = useRouter();
  const status = STATUS_CONFIG[item.status] || STATUS_CONFIG.pending;

  return (
    <Card
      padding="$4"
      bordered
      marginBottom="$3"
      pressStyle={{ scale: 0.98, opacity: 0.95 }}
      onPress={() => router.push(`/(seller)/orders/${item.id}`)}
    >
      <YStack gap="$3">
        {/* Header */}
        <XStack justifyContent="space-between" alignItems="center">
          <XStack gap="$2" alignItems="center" flex={1} minWidth={0}>
            <Text fontWeight="bold" fontSize="$5" fontFamily="$heading" numberOfLines={1}>
              {item.order_number}
            </Text>
            <StatusBadge status={status} />
          </XStack>
          <XStack gap="$1" alignItems="center" flexShrink={0}>
            <Clock size={12} color="$colorMuted" />
            <Text fontSize="$2" color="$colorMuted">
              {getTimeAgo(item.inserted_at)}
            </Text>
          </XStack>
        </XStack>

        {/* Customer */}
        <XStack gap="$2" alignItems="center">
          <User size={14} color="$colorMuted" />
          <Text fontSize="$3" fontWeight="600" color="$color" flex={1} numberOfLines={1}>
            {item.user?.full_name}
          </Text>
          {item.user?.phone && (
            <XStack gap="$1" alignItems="center" flexShrink={0}>
              <Phone size={12} color="$colorMuted" />
              <Text fontSize="$2" color="$colorMuted">
                {item.user.phone}
              </Text>
            </XStack>
          )}
        </XStack>

        {/* Items */}
        <YStack gap="$1" backgroundColor="$backgroundSoft" padding="$3" borderRadius="$3">
          {item.items.slice(0, 4).map((it, i) => (
            <XStack key={it.id} justifyContent="space-between" alignItems="center">
              <XStack gap="$2" alignItems="center" flex={1} minWidth={0}>
                <Text fontSize="$3" color="$color" numberOfLines={1}>
                  {it.quantity}x
                </Text>
                <Text fontSize="$3" color="$color" numberOfLines={1} flex={1}>
                  {it.menu_item?.name}
                </Text>
              </XStack>
              <Text fontSize="$3" fontWeight="600" color="$colorMuted" flexShrink={0}>
                {formatPriceFromMinor(it.subtotal, item.currency)}
              </Text>
            </XStack>
          ))}
          {item.items.length > 4 && (
            <Text fontSize="$2" color="$colorMuted">
              +{item.items.length - 4} more items
            </Text>
          )}
        </YStack>

        {/* Delivery / Notes */}
        <XStack gap="$2" alignItems="center" flexWrap="wrap">
          {item.delivery_address ? (
            <XStack gap="$1" alignItems="center" flex={1} minWidth={0}>
              <MapPin size={12} color="$colorMuted" />
              <Text fontSize="$2" color="$colorMuted" numberOfLines={1} flex={1}>
                {item.delivery_address.full_address || `${item.delivery_address.street}, ${item.delivery_address.city}`}
              </Text>
            </XStack>
          ) : (
            <XStack gap="$1" alignItems="center">
              <ChefHat size={12} color="$colorMuted" />
              <Text fontSize="$2" color="$colorMuted">Pickup</Text>
            </XStack>
          )}
        </XStack>

        <Separator />

        {/* Footer */}
        <YStack gap="$2">
          <XStack gap="$2" alignItems="baseline">
            <Text fontWeight="bold" fontSize="$6" fontFamily="$heading" color="$primary">
              {formatPriceFromMinor(item.total_minor, item.currency)}
            </Text>
            <Text fontSize="$2" color="$colorMuted" textTransform="capitalize" numberOfLines={1}>
              {item.payment_mode?.replace("_", " ")}
            </Text>
            {item.is_paid && (
              <Text fontSize="$2" color="$green10" fontWeight="600">
                Paid
              </Text>
            )}
          </XStack>

          <XStack gap="$2" alignItems="center" flexWrap="wrap">
            {item.status === "pending" && (
              <>
                <Button
                  variant="info"
                  onPress={() =>
                    showDialog?.(
                      "Accept Order",
                      `Accept ${item.order_number}?`,
                      () => onAccept?.(item.id),
                    )
                  }
                >
                  Accept
                </Button>
                <Button
                  variant="dangerOutline"
                  onPress={() =>
                    showDialog?.(
                      "Reject Order",
                      `Reject ${item.order_number}?`,
                      () => onReject?.(item.id),
                      true,
                    )
                  }
                >
                  Reject
                </Button>
              </>
            )}
            {item.status === "accepted" && (
              <Button
                variant="info"
                onPress={() =>
                  showDialog?.(
                    "Start Preparing",
                    `Start preparing ${item.order_number}?`,
                    () => onPrepare?.(item.id),
                  )
                }
              >
                Prepare
              </Button>
            )}
            {item.status === "preparing" && (
              <Button
                variant="success"
                onPress={() =>
                  showDialog?.(
                    "Mark Ready",
                    `Mark ${item.order_number} as ready?`,
                    () => onMarkReady?.(item.id),
                  )
                }
              >
                Ready
              </Button>
            )}
          </XStack>
        </YStack>
      </YStack>
    </Card>
  );
}
