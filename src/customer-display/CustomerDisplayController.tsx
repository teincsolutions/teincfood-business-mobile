// @ts-nocheck
import { useEffect, useRef, useState } from "react";
import { useDisplayStore } from "@/stores/display.store";
import { useCustomerDisplayStore } from "@/stores/customer-display.store";
import { useCustomerDisplayModel } from "./useCustomerDisplayModel";
import { customerDisplayDriver as driver } from "./androidDriver";

const CONFIRMATION_DISMISS_MS = 6000;

/** Live secondary-display capabilities for the settings UI (mobile). */
export function useCustomerDisplayCapabilities() {
  const [caps, setCaps] = useState<{
    supported: boolean;
    displays: number;
    reason?: string;
  } | null>(null);

  useEffect(() => {
    let unsub: (() => void) | undefined;
    void driver.capabilities().then(setCaps);
    unsub = driver.onCapabilitiesChanged(setCaps);
    return () => unsub?.();
  }, []);

  return caps;
}

/**
 * Owns the customer-display lifecycle: opens/closes the secondary presentation
 * and streams the shared model to it. Mounted once at the seller shell; does
 * nothing unless enabled and supported.
 */
export function CustomerDisplayController() {
  const enabled = useDisplayStore((s) => s.customerDisplayEnabled);
  const [caps, setCaps] = useState<{
    supported: boolean;
    displays: number;
    reason?: string;
  } | null>(null);
  const openedRef = useRef(false);

  useEffect(() => {
    let unsub: (() => void) | undefined;
    void driver.capabilities().then(setCaps);
    unsub = driver.onCapabilitiesChanged(setCaps);
    return () => unsub?.();
  }, []);

  const supported = caps?.supported ?? false;

  useEffect(() => {
    if (enabled && supported) {
      void driver.open().then(() => {
        openedRef.current = true;
      });
    } else if (openedRef.current) {
      openedRef.current = false;
      void driver.close();
    }
  }, [enabled, supported]);

  const model = useCustomerDisplayModel();

  useEffect(() => {
    if (!enabled || !supported) return;
    const timer = setTimeout(() => driver.push(model), 80);
    return () => clearTimeout(timer);
  }, [enabled, supported, model]);

  const confirmation = useCustomerDisplayStore((s) => s.confirmation);
  useEffect(() => {
    if (!confirmation) return;
    const timer = setTimeout(
      () => useCustomerDisplayStore.getState().reset(),
      CONFIRMATION_DISMISS_MS,
    );
    return () => clearTimeout(timer);
  }, [confirmation]);

  return null;
}
