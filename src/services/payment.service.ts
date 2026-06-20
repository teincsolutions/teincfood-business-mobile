import { api } from './api';

export const paymentService = {
  listPaymentMethods(): Promise<any> {
    return api.get<any>('/payments/methods');
  },

  createPaymentMethod(payload: any): Promise<any> {
    return api.post<any>('/payments/methods', payload);
  },

  setupPaymentMethod(payload: any): Promise<any> {
    return api.post<any>('/payments/methods/paystack', payload);
  },

  confirmPaymentMethodSetup(payload: any): Promise<any> {
    return api.post<any>('/payments/methods/paystack/confirm', payload);
  },

  updatePaymentMethod(id: string, payload: any): Promise<any> {
    return api.patch<any>(`/payments/methods/${id}`, payload);
  },

  deletePaymentMethod(id: string): Promise<any> {
    return api.delete<any>(`/payments/methods/${id}`);
  },

  initiatePayment(payload: any): Promise<any> {
    return api.post<any>('/payments/initiate', payload);
  },

  verifyPayment(payload: any): Promise<any> {
    return api.post<any>('/payments/verify', payload);
  },
};
