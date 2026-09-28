// @ts-nocheck
/**
 * Native 80mm receipt renderer.
 *
 * Replaces the previous react-native-webview preview: with the New
 * Architecture, Fabric preallocates WebView views on a non-UI thread and the
 * WebView constructor throws "Calling View methods on another thread than the
 * UI thread" in dev builds. Rendering the receipt with Tamagui avoids WebView
 * entirely while showing the same content as the printed HTML/ESC-POS receipt.
 */
import { ScrollView } from "react-native";
import { YStack, XStack, Text, Separator } from "tamagui";
import { formatPriceFromMinor } from "@teincfood/core";
import type { SellerOrder } from "@teincfood/core";

const RECEIPT_WIDTH = 304;

function fmtDate(iso?: string | null) {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return String(iso);
  }
}

function orderTypeText(order: SellerOrder) {
  const t = (order.order_type || "").replace(/_/g, " ");
  if (!t) return "—";
  return t.replace(/\b\w/g, (c) => c.toUpperCase());
}

function paymentText(order: SellerOrder) {
  const method = order.pos_payment_method || order.payment_mode || "";
  const label = method ? method.replace(/_/g, " ").toUpperCase() : "";
  if (order.is_paid) return `PAID${label ? ` — ${label}` : ""}`;
  return label ? `UNPAID — ${label}` : "UNPAID";
}

function Line({
  label,
  value,
  bold,
  muted,
}: {
  label: string;
  value: string;
  bold?: boolean;
  muted?: boolean;
}) {
  return (
    <XStack justifyContent="space-between" gap="$2">
      <Text
        flex={1}
        fontSize={bold ? 14 : 12}
        fontWeight={bold ? "700" : "400"}
        color={muted ? "$colorMuted" : "$color"}
      >
        {label}
      </Text>
      <Text
        fontSize={bold ? 14 : 12}
        fontWeight={bold ? "700" : "400"}
        color={muted ? "$colorMuted" : "$color"}
      >
        {value}
      </Text>
    </XStack>
  );
}

export function ReceiptView({ order }: { order: SellerOrder | null | undefined }) {
  if (!order) {
    return (
      <YStack flex={1} alignItems="center" justifyContent="center" padding="$4">
        <Text fontSize="$4" color="$colorMuted" textAlign="center">
          Receipt unavailable
        </Text>
      </YStack>
    );
  }

  const items = order.items || [];
  const taxLines = (order.tax_lines || []) as SellerOrder["tax_lines"];
  const currency = order.currency || order.currency_code;
  const money = (minor?: number | null) =>
    formatPriceFromMinor(minor ?? 0, currency as string);
  const business = order.business;
  const customer = order.customer_name || order.user?.full_name;

  return (
    <ScrollView
      style={{ flex: 1, width: "100%" }}
      contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
      showsVerticalScrollIndicator={false}
    >
      <YStack gap="$2">
        {/* Header */}
        <YStack alignItems="center" gap="$1">
          <Text fontSize={16} fontWeight="800" textAlign="center">
            {business?.name || "Teinc Food"}
          </Text>
          {business?.phone ? (
            <Text fontSize={11} color="$colorMuted">
              Tel: {business.phone}
            </Text>
          ) : null}
        </YStack>

        <Separator borderColor="$color" borderWidth={1} />

        {/* Order info */}
        <YStack gap="$1">
          <Line label="Order" value={order.order_number || ""} />
          <Line label="Date" value={fmtDate(order.inserted_at)} />
          <Line label="Type" value={orderTypeText(order)} />
          {customer ? <Line label="Customer" value={customer} /> : null}
        </YStack>

        {/* Callout number */}
        {order.callout_number != null ? (
          <YStack alignItems="center" gap="$1" paddingVertical="$2">
            <Text fontSize={32} fontWeight="800" letterSpacing={4}>
              {String(order.callout_number).padStart(3, "0")}
            </Text>
            <Text fontSize={10} color="$colorMuted" letterSpacing={1}>
              CALL OUT NUMBER
            </Text>
          </YStack>
        ) : null}

        <Separator />

        {/* Items */}
        <YStack gap="$1">
          <XStack justifyContent="space-between">
            <Text flex={1} fontSize={11} fontWeight="700" color="$colorMuted">
              Item
            </Text>
            <Text width={28} textAlign="right" fontSize={11} fontWeight="700" color="$colorMuted">
              Qty
            </Text>
            <Text width={80} textAlign="right" fontSize={11} fontWeight="700" color="$colorMuted">
              Price
            </Text>
          </XStack>
          {items.map((item: any, idx: number) => {
            const qty = item.quantity || 1;
            const unit = item.unit_price ?? 0;
            const addons = item.order_item_addons ?? item.addons ?? [];
            return (
              <YStack key={item.id ?? idx} gap="$0.5">
                <XStack justifyContent="space-between" alignItems="flex-start">
                  <Text flex={1} fontSize={12}>
                    {item.menu_item?.name || item.name || "Item"}
                  </Text>
                  <Text width={28} textAlign="right" fontSize={12}>
                    {qty}
                  </Text>
                  <Text width={80} textAlign="right" fontSize={12}>
                    {money(unit * qty)}
                  </Text>
                </XStack>
                {addons.map((a: any, ai: number) => (
                  <XStack key={a.id ?? ai} justifyContent="space-between">
                    <Text flex={1} fontSize={11} color="$colorMuted" paddingLeft="$3">
                      + {a.name}
                    </Text>
                    <Text fontSize={11} color="$colorMuted">
                      {money(a.price_minor ?? a.price ?? 0)}
                    </Text>
                  </XStack>
                ))}
              </YStack>
            );
          })}
        </YStack>

        <Separator />

        {/* Totals */}
        <YStack gap="$1">
          <Line label="Subtotal" value={money(order.subtotal_minor)} />
          {order.delivery_fee_minor ? (
            <Line label="Delivery Fee" value={money(order.delivery_fee_minor)} />
          ) : null}
          {taxLines.map((tax: any, ti: number) => {
            const rate = tax.rate_basis_points
              ? ` (${Math.floor(tax.rate_basis_points / 100)}%)`
              : "";
            return (
              <Line
                key={tax.id ?? ti}
                label={`${tax.name || "Tax"}${rate}`}
                value={money(tax.tax_amount_minor)}
              />
            );
          })}
          {order.discount_minor ? (
            <Line label="Discount" value={`-${money(order.discount_minor)}`} />
          ) : null}
          {order.tip_minor ? <Line label="Tip" value={money(order.tip_minor)} /> : null}
        </YStack>

        <Separator borderColor="$color" borderWidth={1} />
        <Line label="TOTAL" value={money(order.total_minor)} bold />
        <Separator borderColor="$color" borderWidth={1} />

        <Text fontSize={12} textAlign="center" paddingTop="$1">
          {paymentText(order)}
        </Text>

        <YStack alignItems="center" gap="$1" paddingTop="$2">
          <Text fontSize={12} color="$colorMuted" textAlign="center">
            Thank you for your order!{"\n"}Come back soon!
          </Text>
        </YStack>
      </YStack>
    </ScrollView>
  );
}

export { RECEIPT_WIDTH };
