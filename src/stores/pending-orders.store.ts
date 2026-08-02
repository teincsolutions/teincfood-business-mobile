/**
 * Pending Orders Store.
 *
 * Holds locally queued (offline) order:create commands as optimistic
 * `SellerOrder`s so they remain visible on every terminal until they are
 * reconciled with the cloud (see src/sync/pending-orders.service.ts).
 *
 * Orders are keyed by order_number so reconciliation can match the cloud's
 * echoed `local_order_number` back to the optimistic order regardless of the
 * server-assigned id.
 */

import { create } from "zustand";
import type { SellerOrder } from "@/types/api/seller.api";

interface PendingOrdersState {
  orders: SellerOrder[];
  hydrated: boolean;

  setOrders: (orders: SellerOrder[]) => void;
  addOrder: (order: SellerOrder) => void;
  removeByOrderNumber: (orderNumber: string) => void;
  removeByOrderId: (orderId: string) => void;
  setHydrated: (hydrated: boolean) => void;
}

export const usePendingOrdersStore = create<PendingOrdersState>()((set) => ({
  orders: [],
  hydrated: false,

  setOrders: (orders) => set({ orders }),

  addOrder: (order) =>
    set((state) => {
      const exists = state.orders.some(
        (o) =>
          o.order_number === order.order_number ||
          o.id === order.id,
      );
      if (exists) return state;
      return { orders: [...state.orders, order] };
    }),

  removeByOrderNumber: (orderNumber) =>
    set((state) => ({
      orders: state.orders.filter((o) => o.order_number !== orderNumber),
    })),

  removeByOrderId: (orderId) =>
    set((state) => ({
      orders: state.orders.filter((o) => o.id !== orderId),
    })),

  setHydrated: (hydrated) => set({ hydrated }),
}));
