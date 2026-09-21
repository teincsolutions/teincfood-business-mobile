/**
 * Receipt preview hooks — screens call these, never `@/services/print.service` directly.
 *
 * Exposes the offline 80mm HTML preview builder and the print mutation.
 * The static sample order lives in `@/components/settings/SampleReceiptPreview`
 * (rendered in printer settings); this hook only serves live orders.
 */
import { useMemo } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner-native";
import type { SellerOrder } from "@teincfood/core";
import { printService } from "@/services/print.service";

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
