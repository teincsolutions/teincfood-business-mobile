import * as WebBrowser from 'expo-web-browser';
import type { PaymentProvider, InitiatePaymentFn, ProviderPaymentResult } from './types';
import { getPaystackCurrency } from '@/services/paystack-config.service';

const PAYSTACK_CHECKOUT_BASE = 'https://checkout.paystack.com';

export const paystackProvider: PaymentProvider = {
  id: 'paystack',

  async initiatePayment(
    payload: {
      orderId: string;
      amountMinor: number;
      idempotencyKey?: string;
      currency?: string;
      email?: string;
      phone?: string;
    },
    initiator: InitiatePaymentFn,
  ): Promise<ProviderPaymentResult> {
    const response = await initiator({
      order_id: payload.orderId,
      amount_minor: payload.amountMinor,
      idempotency_key: payload.idempotencyKey,
      currency: payload.currency ?? getPaystackCurrency(),
      email: payload.email,
      phone: payload.phone,
      provider: 'paystack',
    });

    const maybeWrapped = response as { data?: { reference?: string } };
    const payment =
      maybeWrapped?.data && typeof maybeWrapped.data.reference === 'string'
        ? (maybeWrapped.data as any)
        : (response as any);

    if (!payment || typeof payment.reference !== 'string') {
      throw new Error('Invalid payment initiation response payload.');
    }

    const providerData = payment.provider_data || {};
    const accessCode =
      typeof providerData.access_code === 'string'
        ? providerData.access_code
        : undefined;

    if (!accessCode) {
      throw new Error('Paystack initiate response missing access_code.');
    }

    await WebBrowser.openBrowserAsync(`${PAYSTACK_CHECKOUT_BASE}/${accessCode}`);

    return {
      reference: payment.reference,
      provider: payment.provider,
      flow: 'web_checkout',
    };
  },
};
