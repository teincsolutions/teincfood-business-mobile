export interface ProviderPaymentResult {
  reference: string;
  provider?: string;
  status?: string;
  flow?: 'web_checkout';
}

export type InitiatePaymentFn = (payload: {
  order_id: string;
  amount_minor: number;
  idempotency_key?: string;
  currency?: string;
  email?: string;
  phone?: string;
  provider?: string;
}) => Promise<any>;

export interface PaymentProvider {
  id: string;
  initiatePayment(
    payload: {
      orderId: string;
      amountMinor: number;
      idempotencyKey?: string;
      currency?: string;
      email?: string;
      phone?: string;
    },
    initiator: InitiatePaymentFn,
  ): Promise<ProviderPaymentResult>;
}
