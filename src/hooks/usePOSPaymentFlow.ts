import { useState, useEffect, useCallback, useRef } from 'react';
import * as WebBrowser from 'expo-web-browser';
import { eventsService } from '@teincfood/core';
import { paymentService } from '@/services/payment.service';

export type POSPaymentState = 'idle' | 'initiating' | 'awaiting_confirmation' | 'success' | 'failed';

/** Outcome of a checkout run. error is null when still pending (phx owns it). */
export type POSPaymentResult = { ok: true } | { ok: false; error: string | null };

// Verify-then-wait: Paystack settles asynchronously (webhook in flight), so a
// "not successful yet" verify right after browser dismiss is EXPECTED, not a
// failure. Only non-pending rejections fail the flow; pending states ride the
// phx payment.completed event + bounded verify backoff. No polling beyond this.
const VERIFY_RETRY_DELAYS_MS = [5000, 10000, 15000];

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

function isPaymentPendingError(err: unknown): boolean {
  const code = (err as { data?: { error?: { code?: string } } })?.data?.error?.code;
  return code === 'PAYMENT_NOT_COMPLETED';
}

function isNetworkError(err: unknown): boolean {
  const e = err as { data?: unknown; status?: number; response?: unknown };
  return e?.data === undefined && e?.response === undefined;
}

export function usePOSPaymentFlow() {
  const [state, setState] = useState<POSPaymentState>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [paymentRef, setPaymentRef] = useState<string | null>(null);
  const [currentOrderId, setCurrentOrderId] = useState<string | null>(null);
  const cancelledRef = useRef(false);
  const completedRef = useRef(false);

  useEffect(() => {
    if (state !== 'awaiting_confirmation' || !currentOrderId) return;

    const matches = (data: any) => {
      if (!data) return false;
      return (
        String(data.order_id) === String(currentOrderId) ||
        (paymentRef && String(data.reference) === String(paymentRef))
      );
    };

    const onCompleted = (event: Record<string, unknown>) => {
      const payload = (event.payload ?? event) as any;
      if (matches(payload) && !completedRef.current) {
        completedRef.current = true;
        setState('success');
      }
    };

    const onFailed = (event: Record<string, unknown>) => {
      const payload = (event.payload ?? event) as any;
      if (matches(payload)) {
        setState('failed');
        setErrorMsg('Payment was declined or cancelled');
      }
    };

    const unsub1 = eventsService.on('payment.completed', onCompleted);
    const unsub2 = eventsService.on('payment.failed', onFailed);

    return () => {
      unsub1();
      unsub2();
    };
  }, [state, currentOrderId, paymentRef]);

  const completeSuccessfully = useCallback(() => {
    if (!completedRef.current) {
      completedRef.current = true;
      setState('success');
    }
  }, []);

  const startCheckout = useCallback(async (orderId: string, amountMinor: number): Promise<POSPaymentResult> => {
    cancelledRef.current = false;
    completedRef.current = false;
    setState('initiating');
    setCurrentOrderId(orderId);
    setPaymentRef(null);
    setErrorMsg(null);

    const doVerify = (ref: string) =>
      paymentService.verifyPayment({
        provider: 'paystack',
        reference: ref,
        order_id: orderId,
      });

    try {
      const response = await paymentService.initiatePayment({
        order_id: orderId,
        amount_minor: amountMinor,
        provider: 'paystack',
        // Order-scoped key: retries replay the SAME cached initiate
        // response (same reference) instead of minting a second payable
        // transaction. Backend holds the key 7 days; failed attempts release
        // the claim server-side so genuine retries still work.
        idempotency_key: `order-pay-${orderId}`,
      });

      if (cancelledRef.current) return { ok: false, error: null };

      const payment = response?.data?.reference ? response.data : response;
      if (!payment || typeof payment.reference !== 'string') {
        throw new Error('Invalid payment initiation response');
      }

      const accessCode = payment.provider_data?.access_code;
      if (!accessCode) {
        throw new Error('Paystack access code missing from response');
      }

      const ref = payment.reference;
      setPaymentRef(ref);
      setState('awaiting_confirmation');

      // Resolves on browser DISMISS, not on payment — the user may have paid
      // and closed it, or abandoned it. Either way the next step is verify.
      await WebBrowser.openBrowserAsync(`https://checkout.paystack.com/${accessCode}`);

      if (cancelledRef.current) return { ok: false, error: null };

      // Bounded verify backoff as a backup to the phx payment.completed
      // event (listeners armed while awaiting_confirmation). A pending
      // provider state here is normal — never fail the flow for it.
      const attempts = [0, ...VERIFY_RETRY_DELAYS_MS];
      for (let i = 0; i < attempts.length; i++) {
        if (i > 0) await sleep(attempts[i]);
        if (cancelledRef.current || completedRef.current)
          return completedRef.current ? { ok: true } : { ok: false, error: null };
        try {
          const verifyResult = await doVerify(ref);
          if (verifyResult?.fulfilled && !completedRef.current) {
            completeSuccessfully();
            return { ok: true };
          }
        } catch (err) {
          if (!isPaymentPendingError(err) && !isNetworkError(err)) throw err;
        }
      }
      // Still pending after backoff: stay in awaiting_confirmation so the
      // (still armed) phx listener can complete late. The user cancels
      // explicitly if they abandoned — the order stays payable and a retry
      // reuses the same reference via the idempotency key.
      return { ok: false, error: null };
    } catch (err) {
      if (!cancelledRef.current) {
        setState('failed');
        const message = err instanceof Error ? err.message : 'Could not initiate payment';
        setErrorMsg(message);
        console.debug('[POSPaymentFlow] Checkout failed', err);
        return { ok: false, error: message };
      }
      console.debug('[POSPaymentFlow] Checkout failed', err);
      return { ok: false, error: null };
    }
  }, [completeSuccessfully]);

  const reset = useCallback(() => {
    cancelledRef.current = true;
    setState('idle');
    setErrorMsg(null);
    setPaymentRef(null);
    setCurrentOrderId(null);
  }, []);

  return {
    state,
    errorMsg,
    paymentRef,
    currentOrderId,
    isProcessing: state === 'initiating' || state === 'awaiting_confirmation',
    startCheckout,
    reset,
  };
}
