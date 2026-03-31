import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { zustandStorage } from '@/utils/storage';
import type { Order } from '@/models/order.model';
import { MOCK_ORDERS } from '@/mocks/orders.mock';

interface OrdersState {
  orders: Order[];

  // Actions
  addOrder: (order: Order) => void;
  updateOrderStatus: (orderId: string, status: Order['status']) => void;
  removeOrder: (orderId: string) => void;
  getActiveOrders: () => Order[];
  getCompletedOrders: () => Order[];
}

export const useOrdersStore = create<OrdersState>()(
  persist(
    (set, get) => ({
      orders: MOCK_ORDERS, // Pre-seeded with mock data

      addOrder: (order) => {
        set((state) => ({
          orders: [order, ...state.orders],
        }));
      },

      updateOrderStatus: (orderId, status) => {
        set((state) => ({
          orders: state.orders.map((o) =>
            o.id === orderId ? { ...o, status } : o
          ),
        }));
      },

      removeOrder: (orderId) => {
        set((state) => ({
          orders: state.orders.filter((o) => o.id !== orderId)
        }));
      },

      getActiveOrders: () => {
        return get().orders.filter(
          (o) => !['delivered', 'cancelled'].includes(o.status)
        );
      },

      getCompletedOrders: () => {
        return get().orders.filter(
          (o) => ['delivered', 'cancelled'].includes(o.status)
        );
      },
    }),
    {
      name: 'teincfoods-orders',
      storage: createJSONStorage(() => zustandStorage),
    }
  )
);
