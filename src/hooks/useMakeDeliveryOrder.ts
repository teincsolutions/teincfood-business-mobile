import { useMutation, useQueryClient } from "@tanstack/react-query";
import { getSyncDatabase } from "@teincfood/core";
import { mergeOrderFromServer } from "@teincfood/core/dist/sync/order-merge.js";
import { convertOrderToDelivery } from "@/services/seller.service";
import { useBusinessStore } from "@/stores/business.store";

export interface MakeDeliveryAddress {
  address: string;
  latitude: number;
  longitude: number;
  city?: string;
  region?: string;
  customer_phone?: string;
}

export function useConvertOrderToDeliveryMutation() {
  const queryClient = useQueryClient();
  const businessId = useBusinessStore((state) => state.activeBusiness?.id);

  return useMutation({
    mutationFn: async ({
      orderId,
      delivery,
    }: {
      orderId: string;
      delivery: MakeDeliveryAddress;
    }) => {
      const response = await convertOrderToDelivery(orderId, delivery);
      const order = response.data;

      // Keep the offline-first read model in lockstep: the seller screens read
      // SQLite first, so a server-only conversion would not appear until the
      // next full order pull.
      if (businessId && order) {
        try {
          await mergeOrderFromServer(getSyncDatabase(), businessId, order);
        } catch (error) {
          console.debug("[MakeDelivery] local merge failed", error);
        }
      }

      return order;
    },
    onSuccess: (order, variables) => {
      void queryClient.invalidateQueries({ queryKey: ["seller"] });
      void queryClient.invalidateQueries({ queryKey: ["pos"] });
      void queryClient.invalidateQueries({ queryKey: ["kiosk"] });
      void queryClient.invalidateQueries({
        queryKey: ["seller", "order", variables.orderId],
      });
      return order;
    },
  });
}
