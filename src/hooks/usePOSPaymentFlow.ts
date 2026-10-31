import { useCallback, useEffect, useRef, useState } from "react";
import {
  drainPending,
  eventsService,
  extractApiErrorCode,
} from "@teincfood/core";
import { paymentService } from "@/services/payment.service";
import { trackEvent } from "@/utils/observability";
import { useBusinessStore } from "@/stores/business.store";
import type { MomoCharge, MomoProvider } from "@/types/payment";

export type POSPaymentState =
  "idle" | "initiating" | "awaiting_confirmation" | "success" | "failed";

/** Outcome of a checkout run. error is null when still pending (phx owns it). */
export type POSPaymentResult =
  { ok: true } | { ok: false; error: string | null; code?: string };

export type MomoChargeOptions = {
  phone: string;
  provider: MomoProvider;
};

const POLL_INTERVAL_MS = 4000;

/**
 * Direct Paystack mobile-money charge for the POS. The customer approves the
 * prompt on their phone (or reads an OTP to the teller); no browser opens.
 * Completion arrives from `payment.completed` or the bounded status poll.
 */
export function usePOSPaymentFlow() {
  const [state, setState] = useState<POSPaymentState>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [paymentRef, setPaymentRef] = useState<string | null>(null);
  const [currentOrderId, setCurrentOrderId] = useState<string | null>(null);
  const [charge, setCharge] = useState<MomoCharge | null>(null);
  const [isSubmittingOtp, setIsSubmittingOtp] = useState(false);
  const cancelledRef = useRef(false);
  const completedRef = useRef(false);

  const complete = useCallback((next?: MomoCharge) => {
    if (next) setCharge(next);
    if (completedRef.current) return;
    completedRef.current = true;
    setState("success");
    setErrorMsg(null);
  }, []);

  const fail = useCallback((message?: string | null) => {
    setState("failed");
    setErrorMsg(message || "Payment failed. Please try again.");
  }, []);

  const applyCharge = useCallback(
    (next: MomoCharge): POSPaymentResult => {
      setCharge(next);
      setPaymentRef(next.reference);

      switch (next.status) {
        case "success":
          trackEvent("payment.completed", {
            ...(currentOrderId ? { order_id: String(currentOrderId) } : {}),
            via: "momo",
          });
          complete(next);
          return { ok: true };

        case "failed":
        case "expired":
        case "abandoned":
          trackEvent("payment.failed", {
            ...(currentOrderId ? { order_id: String(currentOrderId) } : {}),
            via: "momo",
          });
          fail(next.display_text);
          return { ok: false, error: next.display_text || "Payment failed." };

        default:
          setState("awaiting_confirmation");
          setErrorMsg(null);
          return { ok: false, error: null };
      }
    },
    [complete, currentOrderId, fail],
  );

  // Socket completion/failure.
  useEffect(() => {
    if (state !== "awaiting_confirmation" || !currentOrderId) return;

    const matches = (data: unknown) => {
      if (!data) return false;
      const payload = data as Record<string, unknown>;
      return (
        String(payload.order_id) === String(currentOrderId) ||
        (paymentRef && String(payload.reference) === String(paymentRef))
      );
    };

    const onCompleted = (event: Record<string, unknown>) => {
      const payload = (event.payload ?? event) as Record<string, unknown>;
      if (matches(payload) && !completedRef.current) {
        complete();
      }
    };

    const onFailed = (event: Record<string, unknown>) => {
      const payload = (event.payload ?? event) as Record<string, unknown>;
      if (matches(payload)) {
        fail(typeof payload.reason === "string" ? payload.reason : null);
      }
    };

    const unsub1 = eventsService.on("payment.completed", onCompleted);
    const unsub2 = eventsService.on("payment.failed", onFailed);

    return () => {
      unsub1();
      unsub2();
    };
  }, [complete, currentOrderId, fail, paymentRef, state]);

  // Poll while awaiting approval/OTP. This is the fallback if the socket
  // dropped or the customer approved after the teller left the screen.
  useEffect(() => {
    if (state !== "awaiting_confirmation" || !paymentRef) return;
    let stopped = false;

    const tick = async () => {
      try {
        const response = await paymentService.getMomoCharge(paymentRef);
        if (!stopped) applyCharge(response.data);
      } catch {
        // Keep waiting.
      }
    };

    const timer = setInterval(() => void tick(), POLL_INTERVAL_MS);
    void tick();

    return () => {
      stopped = true;
      clearInterval(timer);
    };
  }, [applyCharge, paymentRef, state]);

  const startCheckout = useCallback(
    async (
      orderId: string,
      amountMinor: number,
      options: MomoChargeOptions,
    ): Promise<POSPaymentResult> => {
      cancelledRef.current = false;
      completedRef.current = false;
      setState("initiating");
      setCurrentOrderId(orderId);
      setPaymentRef(null);
      setCharge(null);
      setErrorMsg(null);
      trackEvent("payment.started", {
        order_id: orderId,
        amount_minor: amountMinor,
        provider: options.provider,
      });

      if (!options.phone || !options.provider) {
        const message = "Enter the customer mobile-money number and provider.";
        fail(message);
        return { ok: false, error: message };
      }

      try {
        // Offline-first order creation queues `order:create`; flush it before
        // the backend/Paystack looks up the order. Without this the charge can
        // race the sync and 404 with "Charge not found".
        const businessId = useBusinessStore.getState().activeBusiness?.id;
        if (businessId) await drainPending(businessId);

        const response = await paymentService.chargeMomo({
          order_id: orderId,
          phone: options.phone,
          provider: options.provider,
          idempotency_key: `order-pay-${orderId}-${Date.now()}`,
        });

        if (cancelledRef.current) return { ok: false, error: null };
        const result = applyCharge(response.data);
        // Pull server truth after the charge: a missed Phoenix frame must not
        // leave a paid order stuck in awaiting_payment / showing Pay again.
        if (businessId) void drainPending(businessId).catch(() => undefined);
        return result;
      } catch (err) {
        if (!cancelledRef.current) {
          const message =
            err instanceof Error
              ? err.message
              : "Could not start the mobile-money charge";
          const code = extractApiErrorCode(err);
          const businessId = useBusinessStore.getState().activeBusiness?.id;
          if (businessId && code === "ALREADY_PAID") {
            void drainPending(businessId).catch(() => undefined);
          }
          fail(message);
          return { ok: false, error: message, code };
        }
        return { ok: false, error: null };
      }
    },
    [applyCharge, fail],
  );

  const submitOtp = useCallback(
    async (otp: string) => {
      if (!paymentRef) return;
      setIsSubmittingOtp(true);
      setErrorMsg(null);
      try {
        const response = await paymentService.submitMomoOtp(paymentRef, otp);
        applyCharge(response.data);
      } catch (err) {
        setErrorMsg(
          err instanceof Error ? err.message : "Could not submit the OTP",
        );
      } finally {
        setIsSubmittingOtp(false);
      }
    },
    [applyCharge, paymentRef],
  );

  const reset = useCallback(() => {
    cancelledRef.current = true;
    if (paymentRef) {
      void paymentService.abandonMomoCharge(paymentRef).catch(() => undefined);
    }
    setState("idle");
    setErrorMsg(null);
    setPaymentRef(null);
    setCurrentOrderId(null);
    setCharge(null);
    setIsSubmittingOtp(false);
  }, [paymentRef]);

  return {
    state,
    errorMsg,
    paymentRef,
    currentOrderId,
    charge,
    nextAction: charge?.next_action ?? null,
    displayText: charge?.display_text ?? null,
    isSubmittingOtp,
    isProcessing: state === "initiating" || state === "awaiting_confirmation",
    startCheckout,
    submitOtp,
    reset,
  };
}
