import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { zustandStorage } from "@/utils/storage";
import type { PaymentMethod } from "@/types/user.model";

interface PaymentState {
  paymentMethods: PaymentMethod[];

  // Actions
  addPaymentMethod: (pm: PaymentMethod) => void;
  removePaymentMethod: (id: string) => void;
  setDefaultPaymentMethod: (id: string) => void;
  getDefaultPaymentMethod: () => PaymentMethod | undefined;
}

export const usePaymentStore = create<PaymentState>()(
  persist(
    (set, get) => ({
      paymentMethods: [],

      addPaymentMethod: (pm) => {
        set((state) => ({
          paymentMethods: [...state.paymentMethods, pm],
        }));
      },

      removePaymentMethod: (id) => {
        set((state) => ({
          paymentMethods: state.paymentMethods.filter((pm) => pm.id !== id),
        }));
      },

      setDefaultPaymentMethod: (id) => {
        set((state) => ({
          paymentMethods: state.paymentMethods.map((pm) => ({
            ...pm,
            isDefault: pm.id === id,
          })),
        }));
      },

      getDefaultPaymentMethod: () => {
        return (
          get().paymentMethods.find((pm) => pm.isDefault) ||
          get().paymentMethods[0]
        );
      },
    }),
    {
      name: "Teinc Food Business-payments",
      storage: createJSONStorage(() => zustandStorage),
    },
  ),
);
