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
      paymentMethods: [
        {
          id: "pm-1",
          type: "mobile_money",
          mobileMoneyNumber: "+233 20 123 4567",
          accountHolderName: "MTN Mobile Money",
          isDefault: true,
        },
        {
          id: "pm-2",
          type: "card",
          last4: "4242",
          cardHolderName: "Vishal Khadok",
          cardBrand: "visa",
          isDefault: false,
        },
      ],

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
      name: "TeincFood Business-payments",
      storage: createJSONStorage(() => zustandStorage),
    },
  ),
);
