/**
 * Receipt preview hooks — screens call these, never `@/services/print.service` directly.
 *
 * Exposes the offline 80mm HTML preview builder, the print mutation, and a
 * built-in golden sample order (long business name, 2 items incl. one with
 * variant/size + addons, tax line, discount, delivery fee, cash payment).
 */
import { useMemo } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner-native";
import type { OrderItemAddon, SellerOrder } from "@teincfood/core";
import { printService } from "@/services/print.service";

const SAMPLE_ISO = "2026-09-21T14:00:00.000Z";
const SAMPLE_PAID_ISO = "2026-09-21T14:05:00.000Z";

// Subtotal 14500 + VAT 435 + delivery 1500 − discount 1000 = total 15435.
export const GOLDEN_SAMPLE_ORDER: SellerOrder = {
  id: "sample-receipt-preview",
  order_number: "TFL-000-042",
  callout_number: 42,
  order_type: "takeout",
  is_pos: true,
  customer_name: "Kwame Mensah",
  customer_phone: "+233 24 000 0042",
  pos_payment_method: "cash",
  paid_at: SAMPLE_PAID_ISO,
  status: "ready",
  delivery_id: null,
  delivery_status: null,
  is_paid: true,
  payment: {
    is_paid: true,
    reference: null,
    amount_minor: 15435,
    currency: "GHS",
    paid_at: SAMPLE_PAID_ISO,
  },
  payment_mode: "cash",
  total_minor: 15435,
  subtotal_minor: 14500,
  delivery_fee_minor: 1500,
  tax_minor: 435,
  tip_minor: null,
  discount_minor: 1000,
  promo_code: "SAMPLE10",
  tax_lines: [
    {
      id: null,
      business_tax_rule_id: null,
      name: "VAT",
      code: "VAT",
      country_code: "GH",
      rate_basis_points: 300,
      taxable_amount_minor: 14500,
      tax_amount_minor: 435,
      applies_to: "subtotal",
      is_inclusive: false,
    },
  ],
  currency: "GHS",
  currency_code: "GHS",
  business_id: "sample-business",
  business: {
    id: "sample-business",
    name: "Mama Efya's Kitchen & Continental Dishes — Osu Oxford Street, Accra",
    phone: "+233 24 123 4567",
  },
  delivery_address: null,
  delivery_lat: null,
  delivery_lng: null,
  user: {
    id: "sample-user",
    full_name: "Kwame Mensah",
    email: "kwame@example.com",
    phone: "+233 24 000 0042",
    avatar_url: null,
  },
  items: [
    {
      id: "sample-item-1",
      menu_item: { id: "sample-menu-1", name: "Jollof Rice (Large)" },
      quantity: 2,
      unit_price: 4500,
      subtotal: 9000,
      addons: [
        { id: "sample-addon-1", name: "Extra Chicken", price: 2500 },
        { id: "sample-addon-2", name: "Fried Plantain", price: 1200 },
      ] as unknown as OrderItemAddon[],
    },
    {
      id: "sample-item-2",
      menu_item: { id: "sample-menu-2", name: "Fresh Orange Juice" },
      quantity: 1,
      unit_price: 1800,
      subtotal: 1800,
    },
  ],
  inserted_at: SAMPLE_ISO,
};

/** Builds the 80mm receipt HTML for an order via the core local generator. */
export function useReceiptPreviewHtml(
  order: SellerOrder | null | undefined,
): string {
  return useMemo(() => {
    if (!order) return "";
    try {
      return printService.generateLocalReceipt(order, "html");
    } catch (err) {
      console.debug("[useReceiptPreviewHtml] Failed", err);
      return "";
    }
  }, [order]);
}

/** Prints an 80mm receipt through the existing print path. */
export function usePrintReceiptMutation() {
  return useMutation<void, Error, SellerOrder>({
    mutationFn: (order) => printService.printOrderReceipt(order),
    onError: (err) => {
      console.debug("[usePrintReceiptMutation] failed", err);
      toast.error("Failed to print receipt");
    },
  });
}
