import { getActiveProvider } from '@/services/payment-providers';
import type { InitiatePaymentFn } from '@/services/payment-providers';

export type PaymentFlowInput = {
  orderId: string;
  amountMinor: number;
  idempotencyKey?: string;
  currency?: string;
  email?: string;
  phone?: string;
};

export type PaymentFlowOutcome = {
  status: 'success' | 'failed' | 'cancelled' | 'pending_confirmation';
  message: string;
  reference?: string;
};

const MAX_MINOR_AMOUNT = 2_147_483_647;

function normalizeMinorAmount(amountMinor: number): number {
  if (!Number.isFinite(amountMinor) || amountMinor <= 0) {
    throw new Error('Invalid payment amount. Amount must be a positive minor-unit value.');
  }

  const normalized = Math.trunc(amountMinor);
  if (normalized !== amountMinor) {
    throw new Error('Invalid payment amount. Amount must be an integer minor-unit value.');
  }

  if (normalized > MAX_MINOR_AMOUNT) {
    throw new Error('Invalid payment amount. Transaction amount is out of supported range.');
  }

  return normalized;
}

export async function startPaymentFlow(
  input: PaymentFlowInput,
  initiator: InitiatePaymentFn,
): Promise<PaymentFlowOutcome> {
  const normalizedAmountMinor = normalizeMinorAmount(input.amountMinor);

  const provider = getActiveProvider();
  const result = await provider.initiatePayment(
    {
      orderId: input.orderId,
      amountMinor: normalizedAmountMinor,
      idempotencyKey: input.idempotencyKey,
      currency: input.currency,
      email: input.email,
      phone: input.phone,
    },
    initiator,
  );

  if (result.flow === 'web_checkout') {
    return {
      status: 'pending_confirmation',
      message: 'Awaiting payment confirmation.',
      reference: result.reference,
    };
  }

  return {
    status: 'failed',
    message: 'Unable to complete payment. Please try again.',
    reference: result.reference,
  };
}
