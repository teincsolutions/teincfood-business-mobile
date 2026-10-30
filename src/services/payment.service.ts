import { api } from "./api";
import type { MomoCharge, MomoProvider, MomoQuote } from "@/types/payment";

export const paymentService = {
  listPaymentMethods(): Promise<any> {
    return api.get<any>("/payments/methods");
  },

  createPaymentMethod(payload: any): Promise<any> {
    return api.post<any>("/payments/methods", payload);
  },

  setupPaymentMethod(payload: any): Promise<any> {
    return api.post<any>("/payments/methods/paystack", payload);
  },

  confirmPaymentMethodSetup(payload: any): Promise<any> {
    return api.post<any>("/payments/methods/paystack/confirm", payload);
  },

  updatePaymentMethod(id: string, payload: any): Promise<any> {
    return api.patch<any>(`/payments/methods/${id}`, payload);
  },

  deletePaymentMethod(id: string): Promise<any> {
    return api.delete<any>(`/payments/methods/${id}`);
  },

  initiatePayment(payload: any): Promise<any> {
    return api.post<any>("/payments/initiate", payload);
  },

  verifyPayment(payload: any): Promise<any> {
    return api.post<any>("/payments/verify", payload);
  },

  getMomoQuote(params: {
    order_id?: string;
    invoice_id?: string;
    business_id?: string;
    amount_minor?: number;
  }): Promise<{ data: MomoQuote }> {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) query.set(key, String(value));
    });
    return api.get<{ data: MomoQuote }>(
      `/payments/momo/quote?${query.toString()}`,
    );
  },

  chargeMomo(payload: {
    order_id?: string;
    invoice_id?: string;
    phone: string;
    provider: MomoProvider;
    idempotency_key?: string;
  }): Promise<{ data: MomoCharge }> {
    return api.post<{ data: MomoCharge }>("/payments/momo/charge", payload);
  },

  getMomoCharge(reference: string): Promise<{ data: MomoCharge }> {
    return api.get<{ data: MomoCharge }>(
      `/payments/momo/${encodeURIComponent(reference)}`,
    );
  },

  submitMomoOtp(reference: string, otp: string): Promise<{ data: MomoCharge }> {
    return api.post<{ data: MomoCharge }>(
      `/payments/momo/${encodeURIComponent(reference)}/otp`,
      { otp },
    );
  },

  abandonMomoCharge(reference: string): Promise<{ data: MomoCharge }> {
    return api.post<{ data: MomoCharge }>(
      `/payments/momo/${encodeURIComponent(reference)}/abandon`,
      {},
    );
  },
};
