import { useState, useEffect, useCallback, useRef } from 'react';
import * as WebBrowser from 'expo-web-browser';
import { eventsService } from '@teincfood/core';
import { paymentService } from '@/services/payment.service';

export type POSPaymentState = 'idle' | 'initiating' | 'awaiting_confirmation' | 'success' | 'failed';

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

  const startCheckout = useCallback(async (orderId: string, amountMinor: number) => {
    cancelledRef.current = false;
    completedRef.current = false;
    setState('initiating');
    setCurrentOrderId(orderId);
    setPaymentRef(null);
    setErrorMsg(null);

    try {
      const response = await paymentService.initiatePayment({
        order_id: orderId,
        amount_minor: amountMinor,
        provider: 'paystack',
      });

      if (cancelledRef.current) return;

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

      await WebBrowser.openBrowserAsync(`https://checkout.paystack.com/${accessCode}`);

      if (cancelledRef.current) return;

      const verifyResult = await paymentService.verifyPayment({
        provider: 'paystack',
        reference: ref,
        order_id: orderId,
      });

      if (verifyResult?.fulfilled && !completedRef.current) {
        completedRef.current = true;
        setState('success');
      }
    } catch (err) {
      if (!cancelledRef.current) {
        setState('failed');
        const message = err instanceof Error ? err.message : 'Could not initiate payment';
        setErrorMsg(message);
      }
      console.debug('[POSPaymentFlow] Checkout failed', err);
    }
  }, []);

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
