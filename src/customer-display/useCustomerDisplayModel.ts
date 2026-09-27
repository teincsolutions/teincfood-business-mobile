import { useMemo } from "react";
import {
  buildCustomerDisplayModel,
  calculatePricing,
  useBusinessTaxRulesQuery,
  type CustomerDisplayLineItem,
  type CustomerDisplayModel,
  type CustomerDisplayTaxLine,
} from "@teincfood/core";
import { usePOSStore } from "@/stores/pos.store";
import { useBusinessStore } from "@/stores/business.store";
import { useCustomerDisplayStore } from "@/stores/customer-display.store";

function toLineItem(item: any): CustomerDisplayLineItem {
  return {
    id: item.id,
    name: item.menu_item?.name ?? "",
    variant: item.selected_variant?.name,
    addons: (item.selected_addons ?? []).map((a: any) => a.name),
    quantity: item.quantity,
    unitPriceMinor: item.unit_price_minor ?? 0,
    lineTotalMinor: (item.unit_price_minor ?? 0) * item.quantity,
  };
}

/** Derive the customer-display model from the live POS state (mobile). */
export function useCustomerDisplayModel(): CustomerDisplayModel {
  const items = usePOSStore((s) => s.items);
  const checkoutForm = usePOSStore((s) => s.checkoutForm);
  const activeBusiness = useBusinessStore((s) => s.activeBusiness);
  const { data: taxRules } = useBusinessTaxRulesQuery(true);

  const phase = useCustomerDisplayStore((s) => s.phase);
  const paymentMethod = useCustomerDisplayStore((s) => s.paymentMethod);
  const paymentStatus = useCustomerDisplayStore((s) => s.paymentStatus);
  const confirmation = useCustomerDisplayStore((s) => s.confirmation);

  const biz = activeBusiness as unknown as {
    name?: string;
    currency?: string;
    currency_code?: string;
    logo_url?: string | null;
    logoUrl?: string | null;
  } | null;
  const currency = biz?.currency ?? biz?.currency_code ?? "GHS";

  const pricing = useMemo(() => {
    if (!items || items.length === 0) return null;
    try {
      return calculatePricing({
        items,
        taxRules: ((taxRules as { data?: unknown[] } | undefined)?.data ??
          []) as import("@teincfood/core").TaxRule[],
        currency_code: currency,
      });
    } catch {
      return null;
    }
  }, [items, taxRules, currency]);

  return useMemo(() => {
    const taxLines: CustomerDisplayTaxLine[] = (
      (pricing?.tax_lines ?? []) as Array<{
        id?: string;
        name?: string;
        tax_amount_minor?: number;
        is_inclusive?: boolean;
      }>
    ).map((line) => ({
      id: line.id,
      name: line.name ?? "Tax",
      amountMinor: line.tax_amount_minor ?? 0,
      inclusive: line.is_inclusive,
    }));

    return buildCustomerDisplayModel({
      branding: biz
        ? {
            name: biz.name ?? "TeincFood",
            logoUrl: biz.logo_url ?? biz.logoUrl ?? null,
          }
        : null,
      currency,
      items: (items ?? []).map(toLineItem),
      subtotalMinor: pricing?.subtotal_minor ?? 0,
      taxLines,
      discountMinor: pricing?.discount_minor ?? 0,
      totalMinor: pricing?.total_minor ?? 0,
      customerName: checkoutForm?.customer_name || undefined,
      orderType: checkoutForm?.order_type,
      phase: phase ?? undefined,
      payment: paymentMethod
        ? { method: paymentMethod, status: paymentStatus ?? "pending" }
        : undefined,
      confirmation: confirmation ?? undefined,
    });
  }, [
    biz,
    currency,
    items,
    pricing,
    checkoutForm?.customer_name,
    checkoutForm?.order_type,
    phase,
    paymentMethod,
    paymentStatus,
    confirmation,
  ]);
}
