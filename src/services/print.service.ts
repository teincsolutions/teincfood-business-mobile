/**
 * Print service — thin wrapper over @teincfood/core printer service (backend-identical ESC/POS + HTML).
 * Keeps `printService.fetchReceipt` / `printOrderReceipt(orderId: string)` API for existing call sites,
 * but fully offline: queued DD-RRR-CCC orders generate receipt locally without network.
 */
import { printerService as corePrint } from "@teincfood/core";
import type { SellerOrder } from "@teincfood/core";
import { orderSnapshotsService } from "@teincfood/core";
import { getActiveBusiness } from "@teincfood/core";
import { API_BASE_URL } from "@/utils/constants";
import { useAuthStore } from "@/stores/auth.store";
import { toast } from "sonner-native";

async function fetchReceipt(orderId: string, format: "html" | "escpos" = "html"): Promise<string> {
  try {
    return await corePrint.fetchReceipt(orderId, format);
  } catch {
    // Fallback to raw fetch for auth header compatibility
    const token = useAuthStore.getState().accessToken;
    const url = `${API_BASE_URL}/orders/${orderId}/receipt?format=${format}`;
    const res = await fetch(url, {
      headers: { Authorization: token ? `Bearer ${token}` : "", Accept: format === "html" ? "text/html" : "text/plain" },
    });
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`Failed to fetch receipt (${res.status}): ${body.slice(0, 200)}`);
    }
    return res.text();
  }
}

async function resolveOrder(orderId: string): Promise<SellerOrder | null> {
  const bid = getActiveBusiness()?.id;
  if (bid) {
    try {
      const list = await orderSnapshotsService.getSellerList(bid, bid);
      const found = list?.find((o) => o.id === orderId || o.order_number === orderId);
      if (found) return found as unknown as SellerOrder;
    } catch {}
  }
  return null;
}

export const printService = {
  fetchReceipt,

  async printOrderReceipt(orderIdOrOrder: string | SellerOrder): Promise<void> {
    let order: SellerOrder | null = null;
    if (typeof orderIdOrOrder === "string") {
      order = await resolveOrder(orderIdOrOrder);
      if (!order) {
        // No snapshot — try backend fetch path via core (will fetch receipt directly if online)
        // Create a minimal order stub so core can attempt fetchReceipt by id
        order = { id: orderIdOrOrder, order_number: orderIdOrOrder } as unknown as SellerOrder;
        // Try to fetch full order for local generation fallback
        try {
          const { sellerService } = await import("@teincfood/core");
          const res = await (sellerService as unknown as { fetchSellerOrder: (id: string) => Promise<{ data: SellerOrder }> }).fetchSellerOrder(orderIdOrOrder);
          order = res.data;
        } catch {}
      }
    } else {
      order = orderIdOrOrder;
    }
    try {
      await corePrint.printOrderReceipt(order as SellerOrder);
      toast.success("Receipt printed");
    } catch (e) {
      console.debug("[print] failed", e);
      // Fallback to old HTML share path if core throws (no adapter)
      try {
        const html = typeof orderIdOrOrder === "string" ? await fetchReceipt(orderIdOrOrder, "html") : corePrint.generateLocalReceipt(order as SellerOrder, "html");
        const Print = require("expo-print");
        const Sharing = require("expo-sharing");
        const { uri } = await Print.printToFileAsync({ html });
        if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(uri, { dialogTitle: "Print Receipt", mimeType: "application/pdf" });
        else toast.success("Receipt saved to files");
        return;
      } catch {
        toast.error("Failed to print receipt");
      }
    }
  },

  async sendToTcpPrinter(ip: string, port: number, text: string): Promise<void> {
    return corePrint.sendToTcpPrinter(ip, port, text);
  },

  // Expose local generators for preview (offline)
  generateLocalReceipt: corePrint.generateLocalReceipt,
  generateEscpos: corePrint.generateEscpos,
  generateHtml: corePrint.generateHtml,
};
