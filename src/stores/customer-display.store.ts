import { create } from "zustand";
import type {
  CustomerDisplayConfirmation,
  CustomerDisplayPaymentMethod,
  CustomerDisplayPaymentStatus,
  CustomerDisplayPhase,
} from "@teincfood/core";

interface CustomerDisplayRuntimeState {
  phase: CustomerDisplayPhase | null;
  paymentMethod: CustomerDisplayPaymentMethod | null;
  paymentStatus: CustomerDisplayPaymentStatus | null;
  confirmation: CustomerDisplayConfirmation | null;
  beginOrdering: () => void;
  beginPayment: (method: CustomerDisplayPaymentMethod) => void;
  setPaymentStatus: (status: CustomerDisplayPaymentStatus) => void;
  showConfirmation: (
    confirmation: Omit<CustomerDisplayConfirmation, "at">,
  ) => void;
  reset: () => void;
}

/**
 * Transient (non-persisted) customer-display runtime state. The POS flow drives
 * this; the controller turns it into a full model. Never persisted — a fresh
 * start must always show idle.
 */
export const useCustomerDisplayStore = create<CustomerDisplayRuntimeState>()(
  (set) => ({
    phase: null,
    paymentMethod: null,
    paymentStatus: null,
    confirmation: null,
    beginOrdering: () =>
      set({ phase: "ordering", paymentMethod: null, paymentStatus: null }),
    beginPayment: (method) =>
      set({ phase: "payment", paymentMethod: method, paymentStatus: "pending" }),
    setPaymentStatus: (status) => set({ paymentStatus: status }),
    showConfirmation: (confirmation) =>
      set({
        phase: "confirmation",
        confirmation: { ...confirmation, at: Date.now() },
        paymentStatus: "paid",
      }),
    reset: () =>
      set({
        phase: null,
        paymentMethod: null,
        paymentStatus: null,
        confirmation: null,
      }),
  }),
);
