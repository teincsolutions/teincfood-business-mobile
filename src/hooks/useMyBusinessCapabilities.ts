/**
 * Re-export from @teincfood/core — single source of truth for capabilities.
 * Ensures mobile parity with desktop.
 */
import { useBusinessCapabilities as useCoreCapabilities } from "@teincfood/core";
import { useActiveBusiness } from './useActiveBusiness';

export function useMyBusinessCapabilities() {
  const { activeBusinessId } = useActiveBusiness();
  return useCoreCapabilities(activeBusinessId ?? null);
}

export function useHasCapability(capability: string) {
  const { data: membership } = useMyBusinessCapabilities();
  return membership?.capabilities.includes(capability) ?? false;
}

export { useBusinessCapabilities } from "@teincfood/core";
